import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { InstrumentDetails } from "./InstrumentDetails";

// Мокаем useOutletContext
const mockUseOutletContext = jest.fn();
jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useOutletContext: () => mockUseOutletContext(),
}));

describe("InstrumentDetails", () => {
  const mockInstrumentDetails = {
    symbol: "BTCUSDT",
    contractType: "LinearPerpetual",
    status: "Trading",
    launchTime: new Date("2021-01-01"),
    baseCoin: "BTC",
    quoteCoin: "USDT",
    priceFilter: {
      minPrice: 100,
      maxPrice: 100000,
      tickSize: 0.1,
    },
    lotSizeFilter: {
      minOrderAmt: 0.002,
      maxOrderAmt: 200,
      maxLimitOrderQty: 201,
      maxMarketOrderQty: 202,
      maxMktOrderQty: 203,
      qtyStep: 0.002,
      minNotionalValue: 5,
    },
    leverageFilter: {
      minLeverage: 1,
      maxLeverage: 77,
      leverageStep: 0.01,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("должен отображать сообщение если инструмент не выбран", () => {
    // Мокаем контекст с null данными
    mockUseOutletContext.mockReturnValue({
      selectedInstrument: "",
      dataInstrumentDetails: null,
    });

    render(
      <MemoryRouter>
        <InstrumentDetails />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Выберите инструмент из списка"),
    ).toBeInTheDocument();
  });

  it("должен отображать детальную информацию о выбранном инструменте", () => {
    // Мокаем контекст с данными инструмента
    mockUseOutletContext.mockReturnValue({
      selectedInstrument: "BTCUSDT",
      dataInstrumentDetails: mockInstrumentDetails,
    });

    render(
      <MemoryRouter>
        <InstrumentDetails />
      </MemoryRouter>,
    );

    // Проверяем заголовок
    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();

    // Проверяем основные параметры
    expect(screen.getByText("LinearPerpetual")).toBeInTheDocument();
    expect(screen.getByText("Trading")).toBeInTheDocument();

    // Проверяем параметры цены
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("100 000")).toBeInTheDocument();
    expect(screen.getByText("0,1")).toBeInTheDocument();

    // Проверяем наличие групп
    expect(screen.getByText("Основные параметры")).toBeInTheDocument();
    expect(screen.getByText("Параметры цены")).toBeInTheDocument();
    expect(screen.getByText("Параметры лота")).toBeInTheDocument();
    expect(screen.getByText("Параметры плеча")).toBeInTheDocument();
  });

  it("должен корректно отображать дату запуска", () => {
    mockUseOutletContext.mockReturnValue({
      selectedInstrument: "BTCUSDT",
      dataInstrumentDetails: mockInstrumentDetails,
    });

    render(
      <MemoryRouter>
        <InstrumentDetails />
      </MemoryRouter>,
    );

    // Дата должна быть отформатирована для России
    const expectedDate =
      mockInstrumentDetails.launchTime.toLocaleString("ru-RU");
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it("должен обрабатывать отсутствие некоторых групп данных", () => {
    const instrumentWithoutPriceFilter = {
      ...mockInstrumentDetails,
      priceFilter: undefined,
    };

    mockUseOutletContext.mockReturnValue({
      selectedInstrument: "BTCUSDT",
      dataInstrumentDetails: instrumentWithoutPriceFilter,
    });

    render(
      <MemoryRouter>
        <InstrumentDetails />
      </MemoryRouter>,
    );

    // Основные параметры должны быть
    expect(screen.getByText("Основные параметры")).toBeInTheDocument();

    // Параметры цены не должны отображаться
    expect(screen.queryByText("Параметры цены")).not.toBeInTheDocument();

    // Другие группы должны быть
    expect(screen.getByText("Параметры лота")).toBeInTheDocument();
    expect(screen.getByText("Параметры плеча")).toBeInTheDocument();
  });
});
