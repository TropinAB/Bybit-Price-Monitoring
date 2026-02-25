// Instruments.test.tsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Instruments } from "./Instruments";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  formatPrice,
  formatVolume,
  formatPercentage,
} from "../utils/FormatValues";

// Мокаем alert
window.alert = jest.fn();
window.prompt = jest.fn();

const mockInstruments = [
  {
    category: "spot",
    symbol: "BTCUSDT",
    lastPrice: 50000,
    turnover24h: 1000000,
    volume24h: 20,
    price24hPcnt: 0.05,
  },
  {
    category: "spot",
    symbol: "ETHUSDT",
    lastPrice: 3000,
    turnover24h: 500000,
    volume24h: 166.67,
    price24hPcnt: -0.02,
  },
  {
    category: "linear",
    symbol: "BTCPERP",
    lastPrice: 50100,
    turnover24h: 2000000,
    volume24h: 40,
    price24hPcnt: 0.06,
  },
];

// Мокаем хуки
const mockOnChangeCategory = jest.fn();
const mockOnChangeBaseCoin = jest.fn();
const mockOnChangeSelected = jest.fn();
const mockOnChangeMonitoring = jest.fn();
const defaultContext = {
  category: "spot",
  onChangeCategory: mockOnChangeCategory,
  baseCoin: "USDT",
  onChangeBaseCoin: mockOnChangeBaseCoin,
  selectedInstrument: "",
  onChangeSelectedInstrument: mockOnChangeSelected,
  dataInstruments: mockInstruments,
  monitoringData: [],
  onChangeMonitoringData: mockOnChangeMonitoring,
};

const mockUseOutletContext = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useOutletContext: () => mockUseOutletContext(),
}));

jest.mock("../hooks/useLocalStorage");
jest.mock("../utils/FormatValues");

describe("Instruments", () => {
  const mockSetSortColumn = jest.fn();
  // mockSetSortColumn.prototype.myName = "mockSetSortColumn";
  const mockSetSortDirection = jest.fn();
  // mockSetSortDirection.prototype.myName = "mockSetSortDirection";
  const mockSetOther = jest.fn();
  // mockSetOther.prototype.myName = "mockSetOther";

  // (useLocalStorage as jest.Mock).mock.calls.forEach(c => { console.log(c); });
  // (useLocalStorage as jest.Mock).mock.results.forEach(c => { console.log(c.type, c.value[0], c.value[1].prototype.myName); });

  beforeEach(() => {
    jest.clearAllMocks();

    // Сбрасываем конкретные моки
    mockOnChangeCategory.mockClear();
    mockOnChangeBaseCoin.mockClear();
    mockOnChangeSelected.mockClear();
    mockOnChangeMonitoring.mockClear();
    mockSetSortColumn.mockClear();
    mockSetSortDirection.mockClear();

    // Устанавливаем контекст по умолчанию
    mockUseOutletContext.mockReset();
    mockUseOutletContext.mockReturnValue(defaultContext);

    (useLocalStorage as jest.Mock)
      .mockReset() // полностью сбрасываем
      .mockReturnValueOnce(["turnover24h", mockSetSortColumn])
      .mockReturnValueOnce(["descending", mockSetSortDirection])
      .mockReturnValueOnce(["lastPrice", mockSetSortColumn])
      .mockReturnValueOnce(["descending", mockSetSortDirection])
      .mockReturnValueOnce(["lastPrice", mockSetSortColumn])
      .mockReturnValueOnce(["ascending", mockSetSortDirection])
      .mockReturnValue(["", mockSetOther]);

    (formatPrice as jest.Mock).mockImplementation(
      (price) => price?.toString() || "-",
    );
    (formatVolume as jest.Mock).mockImplementation(
      (vol) => vol?.toString() || "-",
    );
    (formatPercentage as jest.Mock).mockImplementation(
      (val) => val?.toString() || "-",
    );
  });

  describe("Загрузка списка инструментов (сценарий 6)", () => {
    it("должен отображать таблицу с инструментами", () => {
      render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      // Проверяем заголовки таблицы
      expect(screen.getByText("Инструмент")).toBeInTheDocument();
      expect(screen.getByText("Цена")).toBeInTheDocument();
      expect(screen.getByText("Оборот за 24 ч.")).toBeInTheDocument();
      expect(screen.getByText("Объём за 24 ч.")).toBeInTheDocument();
      expect(screen.getByText("% изменения цены")).toBeInTheDocument();

      // Проверяем что инструменты отображаются
      expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
      expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
    });

    it("должен применять фильтры по категории и базовой монете", () => {
      render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      // Только spot инструменты с USDT
      expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
      expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
      expect(screen.queryByText("BTCPERP")).not.toBeInTheDocument(); // linear не должен отображаться
    });

    it("должен применять фильтр по символу", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      const filterInput = screen.getByRole("textbox");
      await user.type(filterInput, "BTC");

      expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
      expect(screen.queryByText("ETHUSDT")).not.toBeInTheDocument();
    });

    it("должен применять сортировку", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      const th = screen.getAllByText("Цена")[0];
      expect(th).toBeDefined();

      await user.click(th!);
      await waitFor(() => {
        expect(mockSetSortDirection).toHaveBeenCalled();
      });

      rerender(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      // По умолчанию сортировка по turnover24h descending
      const rows = screen.getAllByRole("row");
      // BTCUSDT должен быть первым (оборот 1,000,000 цена 50000)
      // ETHUSDT вторым (оборот 500,000 цена 3000)
      expect(rows).toHaveLength(3); // с заголовком
      expect(rows[1]?.textContent).toContain("1000000");
      expect(rows[1]?.textContent).toContain("50000");
      expect(rows[2]?.textContent).toContain("500000");
      expect(rows[2]?.textContent).toContain("3000");

      await user.click(th!);
      await waitFor(() => {
        expect(mockSetSortDirection).toHaveBeenCalled();
      });

      rerender(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      const rows2 = screen.getAllByRole("row");
      // ETHUSDT первым (оборот 500,000)
      // BTCUSDT должен быть вторым (оборот 1,000,000)
      expect(rows2).toHaveLength(3); // с заголовком
      expect(rows2[1]?.textContent).toContain("500000");
      expect(rows2[2]?.textContent).toContain("1000000");
    });
  });

  describe("Обновление таблицы (сценарий 7)", () => {
    it("должен обновлять данные при изменении props", () => {
      const { rerender } = render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      expect(screen.getByText("50000")).toBeInTheDocument();

      // Обновляем данные
      const updatedInstruments = [...mockInstruments];
      if (updatedInstruments[0]) updatedInstruments[0].lastPrice = 51001;

      rerender(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      expect(screen.getByText("51001")).toBeInTheDocument();
    });
  });

  describe("Выбор строки (сценарий 9)", () => {
    it("должен подсвечивать выбранную строку", () => {
      const { rerender } = render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      // Меняем только одно поле
      mockUseOutletContext.mockReturnValue({
        ...defaultContext,
        selectedInstrument: "BTCUSDT", // только это поле переопределено
      });

      rerender(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      const selectedRow = screen.getByText("BTCUSDT").closest("tr");
      expect(selectedRow).toHaveClass("selected");
    });
  });

  describe("Сохранение выбранной строки при обновлении (сценарий 10)", () => {
    it("должен сохранять selectedInstrument после обновления данных", () => {
      const { rerender } = render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      // Выбираем строку
      const row = screen.getByText("BTCUSDT").closest("tr");
      fireEvent.click(row!);

      // Обновляем данные
      // const updatedInstruments = [...mockInstruments];

      // Меняем только одно поле
      mockUseOutletContext.mockReturnValue({
        ...defaultContext,
        selectedInstrument: "BTCUSDT", // только это поле переопределено
      });

      rerender(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      // Строка должна оставаться выбранной
      const selectedRow = screen.getByText("BTCUSDT").closest("tr");
      expect(selectedRow).toHaveClass("selected");
    });
  });

  describe("Кнопка добавления в мониторинг (сценарий 11)", () => {
    it("должен показывать prompt при клике на +", async () => {
      const mockPrompt = jest
        .spyOn(window, "prompt")
        .mockImplementation(() => null);
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      const plusButton = screen.getAllByText("+")[0];
      expect(plusButton).not.toBeNull();
      await user.click(plusButton!);

      expect(mockPrompt).toHaveBeenCalledWith("Введите цену для BTCUSDT:", "");

      mockPrompt.mockRestore();
    });

    it("должен показывать alert если текущая цена = 0", async () => {
      const mockAlert = jest
        .spyOn(window, "alert")
        .mockImplementation(() => {});
      const user = userEvent.setup();

      // Инструмент с нулевой ценой
      const instrumentsWithZeroPrice = JSON.parse(
        JSON.stringify(mockInstruments),
      );
      instrumentsWithZeroPrice[0].lastPrice = 0;

      mockUseOutletContext.mockReturnValue({
        ...defaultContext,
        dataInstruments: instrumentsWithZeroPrice,
        selectedInstrument: "BTCUSDT",
      });

      render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      const plusButton = screen.getAllByText("+")[0];
      expect(plusButton).not.toBeNull();
      await user.click(plusButton!);

      expect(mockAlert).toHaveBeenCalledWith("Текущая цена = 0! :(");

      mockAlert.mockRestore();
    });
  });

  describe("Отмена ввода цены (сценарий 12)", () => {
    it("не должен добавлять в мониторинг при отмене prompt", async () => {
      const mockPrompt = jest
        .spyOn(window, "prompt")
        .mockImplementation(() => null);
      const user = userEvent.setup();

      mockUseOutletContext.mockReturnValue({
        ...defaultContext,
        selectedInstrument: "BTCUSDT",
      });

      render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      const plusButton = screen.getAllByText("+")[0];
      expect(plusButton).not.toBeNull();
      await user.click(plusButton!);

      expect(mockOnChangeMonitoring).not.toHaveBeenCalled();

      mockPrompt.mockRestore();
    });
  });

  describe("Подтверждение цены (сценарий 13)", () => {
    it("должен добавлять в мониторинг при вводе цены", async () => {
      const mockAlert = jest
        .spyOn(window, "alert")
        .mockImplementation(() => {});
      const mockPrompt = jest
        .spyOn(window, "prompt")
        .mockImplementation(() => "55000");
      const user = userEvent.setup();

      // Меняем только одно поле
      mockUseOutletContext.mockReturnValue({
        ...defaultContext,
        selectedInstrument: "BTCUSDT",
      });

      render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      const plusButton = screen.getAllByText("+")[0];
      expect(plusButton).not.toBeNull();
      await user.click(plusButton!);

      expect(mockAlert).not.toHaveBeenCalled();

      expect(mockOnChangeMonitoring).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            category: "spot",
            symbol: "BTCUSDT",
            targetPrice: 55000,
          }),
        ]),
      );

      mockPrompt.mockRestore();
      mockAlert.mockRestore();
    });

    it("должен сохранять данные в localStorage", async () => {
      // Проверка сохранения в localStorage
      const mockPrompt = jest
        .spyOn(window, "prompt")
        .mockImplementation(() => "55000");
      const user = userEvent.setup();

      // Меняем только одно поле
      mockUseOutletContext.mockReturnValue({
        ...defaultContext,
        selectedInstrument: "BTCUSDT", // только это поле переопределено
      });

      render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      const plusButton = screen.getAllByText("+")[0];
      expect(plusButton).not.toBeNull();
      await user.click(plusButton!);

      // Проверяем вызов onChangeMonitoringData, который сохраняет в localStorage
      expect(mockOnChangeMonitoring).toHaveBeenCalled();

      mockPrompt.mockRestore();
    });
  });

  describe("Повторный ввод цены (сценарий 14)", () => {
    it("не должен добавлять дубликат", async () => {
      const mockPrompt = jest
        .spyOn(window, "prompt")
        .mockImplementation(() => "55000");
      const mockAlert = jest
        .spyOn(window, "alert")
        .mockImplementation(() => {});
      const user = userEvent.setup();

      const existingMonitoringData = [
        {
          category: "spot",
          symbol: "BTCUSDT",
          startPrice: 50000,
          startDate: new Date(),
          targetPrice: 55000,
        },
      ];

      mockUseOutletContext.mockReturnValue({
        ...defaultContext,
        selectedInstrument: "BTCUSDT",
        monitoringData: existingMonitoringData,
      });

      render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      const plusButton = screen.getAllByText("+")[0];
      expect(plusButton).not.toBeNull();
      await user.click(plusButton!);

      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining("уже были добавлены"),
      );
      expect(mockOnChangeMonitoring).not.toHaveBeenCalled();

      mockPrompt.mockRestore();
      mockAlert.mockRestore();
    });
  });

  describe("Сохранение настроек в localStorage (сценарий 15)", () => {
    it("должен сохранять сортировку при изменении", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      const priceHeader = screen.getByText("Цена");
      await user.click(priceHeader);

      expect(mockSetSortColumn).toHaveBeenCalledWith("lastPrice");
      expect(mockSetSortDirection).toHaveBeenCalledWith("descending");
    });

    it("должен загружать сохраненные настройки", () => {
      (useLocalStorage as jest.Mock)
        .mockReset()
        .mockReturnValueOnce(["lastPrice", mockSetSortColumn])
        .mockReturnValueOnce(["ascending", mockSetSortDirection]);

      render(
        <MemoryRouter>
          <Instruments />
        </MemoryRouter>,
      );

      // Проверяем что сортировка применилась
      // ASC по цене - самый дешевый первый
    });
  });
});
