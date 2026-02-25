import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { AppContent } from "./AppContent";
import { useBybit } from "../hooks/useBybit";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { playBellSound } from "../utils/soundUtils";

// Мокаем хуки
jest.mock("../hooks/useBybit");
jest.mock("../hooks/useLocalStorage");
jest.mock("../utils/soundUtils");

// Мокаем дочерние компоненты
jest.mock("react-hot-toast", () => ({
  Toaster: () => <div data-testid="toaster" />,
  toast: jest.fn(),
}));

describe("AppContent", () => {
  const mockUseBybit = {
    isOnline: true,
    error: "",
    serverTime: new Date("2024-01-01T12:00:00"),
    dataInstruments: [
      {
        category: "spot",
        symbol: "BTCUSDT",
        lastPrice: 50000,
        turnover24h: 1000000,
        volume24h: 20,
        price24hPcnt: 0.05,
      },
    ],
    dataInstrumentDetails: null,
  };

  const mockSetRefreshInterval = jest.fn();
  const mockSetCategory = jest.fn();
  const mockSetBaseCoin = jest.fn();
  const mockSetMonitoringData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Мокаем useLocalStorage
    (useLocalStorage as jest.Mock)
      .mockImplementationOnce(() => [0, mockSetRefreshInterval]) // refreshInterval
      .mockImplementationOnce(() => ["linear", mockSetCategory]) // category
      .mockImplementationOnce(() => ["USDT", mockSetBaseCoin]) // baseCoin
      .mockImplementationOnce(() => [[1], mockSetMonitoringData]); // monitoringData

    // Мокаем useBybit
    (useBybit as jest.Mock).mockReturnValue(mockUseBybit);
  });

  describe("Запуск приложения (сценарий 1)", () => {
    it("должен отображать заголовок, меню и подвал", () => {
      render(
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>,
      );

      // Заголовок
      expect(
        screen.getByText("Мониторинг цен на бирже Bybit"),
      ).toBeInTheDocument();

      // Меню
      expect(screen.getByText("Инструменты")).toBeInTheDocument();
      expect(screen.getByText("Мониторинг")).toBeInTheDocument();
      expect(screen.getByText("О приложении")).toBeInTheDocument();

      // Подвал
      expect(screen.getByText("Состояние сервера Bybit:")).toBeInTheDocument();
      expect(screen.getByText(/🟢 Работает/)).toBeInTheDocument();
      expect(screen.getByText("Время обновления:")).toBeInTheDocument();
    });

    it("должен запрашивать статус биржи через useBybit", () => {
      render(
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>,
      );

      expect(useBybit).toHaveBeenCalledWith(0, "linear", "");
    });

    it("должен отображать Toaster для уведомлений", () => {
      render(
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>,
      );

      expect(screen.getByTestId("toaster")).toBeInTheDocument();
    });
  });

  describe("Статус биржи (сценарии 2-4)", () => {
    it("должен отображать зелёный индикатор при отсутствии техработ (сценарий 4)", () => {
      (useBybit as jest.Mock).mockReturnValue({
        ...mockUseBybit,
        isOnline: true,
        error: "",
      });

      render(
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>,
      );

      const statusValue = screen.getByText(/🟢 Работает/);
      expect(statusValue).toHaveClass("status-value online");
    });

    it("должен отображать красный индикатор при техработах (сценарий 3)", () => {
      (useBybit as jest.Mock).mockReturnValue({
        ...mockUseBybit,
        isOnline: false,
        error: "Сервер на обслуживании",
      });

      render(
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>,
      );

      const statusValue = screen.getByText(/🔴 Не работает/);
      expect(statusValue).toHaveClass("status-value offline");

      // Должно отображаться сообщение об ошибке
      expect(screen.getByText("Сервер на обслуживании")).toBeInTheDocument();
    });

    it("должен обновлять время сервера (сценарий 2)", () => {
      const mockDate = new Date("2024-01-01T15:30:45");
      (useBybit as jest.Mock).mockReturnValue({
        ...mockUseBybit,
        serverTime: mockDate,
      });

      render(
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>,
      );

      expect(
        screen.getByText(mockDate.toLocaleTimeString()),
      ).toBeInTheDocument();
    });
  });

  describe("Управление интервалом обновления", () => {
    it("должен изменять интервал через выпадающий список интервалов", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>,
      );

      const select = screen.getByLabelText("Частота обновления:");
      await user.selectOptions(select, "3");

      expect(mockSetRefreshInterval).toHaveBeenCalledWith(3);
    });

    it("должен отображать текущее значение интервала", async () => {
      // Переопределяем моки для этого теста
      (useLocalStorage as jest.Mock).mockReset();
      (useLocalStorage as jest.Mock)
        .mockImplementationOnce(() => [5, mockSetRefreshInterval]) // refreshInterval = 5 минут
        .mockImplementationOnce(() => ["linear", mockSetCategory])
        .mockImplementationOnce(() => ["USDT", mockSetBaseCoin])
        .mockImplementationOnce(() => [[], mockSetMonitoringData]);

      render(
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>,
      );

      // Ждем, пока компонент обновится после загрузки из localStorage
      await waitFor(() => {
        const select = screen.getByLabelText("Частота обновления:");
        expect(select).toHaveValue("5");
      });
    });
  });

  describe("Мониторинг достижения целей", () => {
    const mockMonitoringData = [
      {
        category: "spot",
        symbol: "BTCUSDT",
        startPrice: 40000,
        startDate: new Date("2024-01-01"),
        targetPrice: 50000,
        targetDate: null,
      },
    ];

    it("должен определять достижение цели и показывать уведомление", async () => {
      // Переопределяем моки для этого теста
      (useLocalStorage as jest.Mock).mockReset();
      (useLocalStorage as jest.Mock)
        .mockImplementationOnce(() => [0, mockSetRefreshInterval])
        .mockImplementationOnce(() => ["linear", mockSetCategory])
        .mockImplementationOnce(() => ["USDT", mockSetBaseCoin])
        .mockImplementationOnce(() => [
          mockMonitoringData,
          mockSetMonitoringData,
        ]);

      // Цена достигла цели
      (useBybit as jest.Mock).mockReturnValue({
        ...mockUseBybit,
        dataInstruments: [
          {
            category: "spot",
            symbol: "BTCUSDT",
            lastPrice: 50100,
            turnover24h: 1000000,
            volume24h: 20,
            price24hPcnt: 0.25,
          },
        ],
      });

      const { toast } = require("react-hot-toast");

      render(
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>,
      );

      // Ждем обработки эффекта
      await waitFor(() => {
        expect(mockSetMonitoringData).toHaveBeenCalled();
      });

      // Проверяем уведомление
      expect(toast).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ duration: 10000 }),
      );

      // Проверяем звук
      expect(playBellSound).toHaveBeenCalled();
    });

    it("не должен повторно уведомлять о уже достигнутых целях", async () => {
      const mockMonitoringDataWithReached = [
        {
          category: "spot",
          symbol: "BTCUSDT",
          startPrice: 40000,
          startDate: new Date("2024-01-01"),
          targetPrice: 50000,
          targetDate: new Date("2024-01-02"), // уже достигнута
        },
      ];

      (useLocalStorage as jest.Mock)
        .mockImplementationOnce(() => [0, mockSetRefreshInterval])
        .mockImplementationOnce(() => ["linear", mockSetCategory])
        .mockImplementationOnce(() => ["USDT", mockSetBaseCoin])
        .mockImplementationOnce(() => [
          mockMonitoringDataWithReached,
          mockSetMonitoringData,
        ]);

      (useBybit as jest.Mock).mockReturnValue(mockUseBybit);

      const { toast } = require("react-hot-toast");

      render(
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>,
      );

      // Ждем, чтобы убедиться что эффект не вызвал уведомление
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(toast).not.toHaveBeenCalled();
      expect(playBellSound).not.toHaveBeenCalled();
    });
  });
});
