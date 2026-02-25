import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { App } from "./App";
import { useLocalStorage } from "./hooks/useLocalStorage";

jest.mock("./hooks/useBybit", () => ({
  useBybit: () => ({
    isOnline: true,
    error: "",
    serverTime: new Date(),
    dataInstruments: [],
    dataInstrumentDetails: null,
  }),
}));

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
  dataInstruments: [],
  monitoringData: [],
  onChangeMonitoringData: mockOnChangeMonitoring,
};
const mockUseOutletContext = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useOutletContext: () => mockUseOutletContext(),
}));

jest.mock("./hooks/useLocalStorage");

describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Сбрасываем конкретные моки
    mockOnChangeCategory.mockClear();
    mockOnChangeBaseCoin.mockClear();
    mockOnChangeSelected.mockClear();
    mockOnChangeMonitoring.mockClear();

    (useLocalStorage as jest.Mock)
      .mockReset() // полностью сбрасываем
      .mockReturnValueOnce(["0", jest.fn()])
      .mockReturnValueOnce(["linear", jest.fn()])
      .mockReturnValueOnce(["USDT", jest.fn()])
      .mockReturnValueOnce([[], jest.fn()])
      .mockReturnValueOnce(["turnover24h", jest.fn()])
      .mockReturnValueOnce(["descending", jest.fn()])
      .mockReturnValue(["", jest.fn()]);

    // Устанавливаем контекст по умолчанию
    mockUseOutletContext.mockReset();
    mockUseOutletContext.mockReturnValue(defaultContext);
  });

  describe("Структура и вложенность", () => {
    it("должен рендерить AppContent как корневой элемент", () => {
      const { container } = render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>,
      );
      screen.debug;

      const appСontainer = container.querySelector(".app-container");
      expect(appСontainer).toBeInTheDocument();
      if (appСontainer) {
        const header = appСontainer.querySelector("header");
        expect(header).toBeInTheDocument();
        if (header) {
          expect(header.querySelector(".menu-container")).toBeInTheDocument();
        }
        const main = appСontainer.querySelector("main");
        expect(main).toBeInTheDocument();
        if (main) {
          // expect(main.querySelector('Outlet')).toBeInTheDocument();
        }
        const footer = appСontainer.querySelector("footer");
        expect(footer).toBeInTheDocument();
        if (footer) {
          expect(footer.querySelector(".footer-content")).toBeInTheDocument();
        }
      }
    });
  });

  describe("Маршрутизация", () => {
    it("должен показывать 404 для неизвестного маршрута", () => {
      render(
        <MemoryRouter initialEntries={["/unknown-route"]}>
          <App />
        </MemoryRouter>,
      );

      expect(screen.getByText("404: Страница не найдена")).toBeInTheDocument();
    });

    it("должен рендерить InstrumentsPage на главном маршруте (/)", async () => {
      const { container } = render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>,
      );

      // Проверяем что AppContent отрендерился
      expect(container.querySelector(".app-container")).toBeInTheDocument();
      // Проверяем уникальные элементы со страницы Instruments
      expect(
        container.querySelector(".instruments-container"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".instruments-table-section"),
      ).toBeInTheDocument();
      expect(container.querySelector(".filters-panel")).toBeInTheDocument();
      expect(
        container.querySelector(".instruments-table-container"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".instrument-details-section"),
      ).toBeInTheDocument();
    });

    it("должен рендерить MonitoringPage на маршруте /monitoring", async () => {
      const { container } = render(
        <MemoryRouter initialEntries={["/monitoring"]}>
          <App />
        </MemoryRouter>,
      );

      // Проверяем что AppContent отрендерился
      expect(container.querySelector(".app-container")).toBeInTheDocument();
      // Проверяем уникальные элементы со страницы Monitoring
      expect(
        container.querySelector(".monitoring-container"),
      ).toBeInTheDocument();
      expect(container.querySelector(".monitoring-header")).toBeInTheDocument();
    });

    it("должен рендерить AboutPage на маршруте /about", async () => {
      const { container } = render(
        <MemoryRouter initialEntries={["/about"]}>
          <App />
        </MemoryRouter>,
      );

      // Проверяем что AppContent отрендерился
      expect(container.querySelector(".app-container")).toBeInTheDocument();
      // Проверяем уникальные элементы со страницы About
      expect(container.querySelector(".about-container")).toBeInTheDocument();
      expect(container.querySelector(".about-content")).toBeInTheDocument();
    });
  });

  describe("Навигация между страницами", () => {
    it("должен переходить на страницу Instruments при клике на ссылку", async () => {
      const user = userEvent.setup();

      const { container } = render(
        <MemoryRouter initialEntries={["/monitoring"]}>
          <App />
        </MemoryRouter>,
      );

      // Проверяем что мы на Monitoring
      expect(
        container.querySelector(".monitoring-container"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".instruments-container"),
      ).not.toBeInTheDocument();

      // Кликаем на ссылку Инструменты
      const instrumentsLink = screen.getByRole("link", {
        name: /инструменты/i,
      });
      await user.click(instrumentsLink);

      // Проверяем что перешли на Instruments
      expect(
        container.querySelector(".instruments-container"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".monitoring-container"),
      ).not.toBeInTheDocument();
    });

    it("должен переходить на страницу Monitoring при клике на ссылку", async () => {
      const user = userEvent.setup();

      const { container } = render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>,
      );

      // Проверяем что мы на Instruments
      expect(
        container.querySelector(".instruments-container"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".monitoring-container"),
      ).not.toBeInTheDocument();

      // Кликаем на ссылку Мониторинг
      const monitoringLink = screen.getByRole("link", { name: /мониторинг/i });
      await user.click(monitoringLink);

      // Проверяем что перешли на Monitoring
      expect(
        container.querySelector(".monitoring-container"),
      ).toBeInTheDocument();
      expect(
        container.querySelector(".instruments-container"),
      ).not.toBeInTheDocument();
    });

    it("должен переходить на страницу About при клике на ссылку", async () => {
      const user = userEvent.setup();

      const { container } = render(
        <MemoryRouter initialEntries={["/"]}>
          <App />
        </MemoryRouter>,
      );

      // Кликаем на ссылку О приложении
      const aboutLink = screen.getByRole("link", { name: /о приложении/i });
      await user.click(aboutLink);

      // Проверяем что перешли на About
      expect(container.querySelector(".about-container")).toBeInTheDocument();
      expect(
        container.querySelector(".instruments-container"),
      ).not.toBeInTheDocument();
    });
  });
});
