import { renderHook, act, waitFor } from "@testing-library/react";
import { useBybit } from "./useBybit";

// проверить как тесты проходят на github
// console.log("process.env.NODE_ENV", process.env.NODE_ENV)

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("useBybit", () => {
  // Моковые данные
  const mockServerStatusResponse = {
    time: 1645564800000,
    result: {
      list: [], // Пустой список = сервер работает
    },
  };
  const responseStatus = {
    ok: true,
    json: async () => mockServerStatusResponse,
  };

  const mockServerMaintenanceResponse = {
    time: 1645564800000,
    result: {
      list: [
        {
          state: "maintenance",
          title: "Сервер на обслуживании",
        },
      ],
    },
  };

  const mockSpotInstrumentsResponse = {
    result: {
      category: "spot",
      list: [
        {
          symbol: "BTCUSDT",
          lastPrice: "50000",
          turnover24h: "1000000",
          volume24h: "20",
          price24hPcnt: "0.05",
        },
        {
          symbol: "ETHUSDT",
          lastPrice: "3000",
          turnover24h: "500000",
          volume24h: "166.67",
          price24hPcnt: "-0.02",
        },
      ],
    },
  };
  const responseSpotInstruments = {
    ok: true,
    json: async () => mockSpotInstrumentsResponse,
  };

  const mockLinearInstrumentsResponse = {
    result: {
      category: "linear",
      list: [
        {
          symbol: "BTCPERP",
          lastPrice: "50100",
          turnover24h: "2000000",
          volume24h: "40",
          price24hPcnt: "0.06",
        },
      ],
    },
  };
  const responseLinearInstruments = {
    ok: true,
    json: async () => mockLinearInstrumentsResponse,
  };

  const mockEmptyInstrumentsResponse = {
    result: {
      category: "linear",
      list: [],
    },
  };
  const responseEmptyInstruments = {
    ok: true,
    json: async () => mockEmptyInstrumentsResponse,
  };

  const mockInstrumentDetailsResponse = {
    result: {
      list: [
        {
          symbol: "BTCUSDT",
          contractType: "LinearPerpetual",
          status: "Trading",
          baseCoin: "BTC",
          quoteCoin: "USDT",
          launchTime: "1609459200000",
          priceFilter: {
            tickSize: "0.1",
            minPrice: "100",
            maxPrice: "100000",
          },
          lotSizeFilter: {
            minOrderAmt: "0.001",
            maxOrderAmt: "100",
            maxLimitOrderQty: "100",
            maxMarketOrderQty: "100",
            maxMktOrderQty: "100",
            qtyStep: "0.001",
            minNotionalValue: "5",
          },
          leverageFilter: {
            minLeverage: "1",
            maxLeverage: "100",
            leverageStep: "0.01",
          },
        },
      ],
    },
  };
  const responseInstrumentDetails = {
    ok: true,
    json: async () => mockInstrumentDetailsResponse,
  };

  const mockEmptyInstrumentDetailsResponse = {
    result: {
      list: [],
    },
  };
  const responseEmptyInstrumentDetails = {
    ok: true,
    json: async () => mockEmptyInstrumentDetailsResponse,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Настраиваем fetch по умолчанию
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockServerStatusResponse,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Инициализация", () => {
    it("должен инициализироваться с правильными значениями по умолчанию", async () => {
      const { result } = renderHook(() => useBybit());

      // Начальные значения
      expect(result.current.isOnline).toBe(false);
      expect(result.current.error).toBe("");
      expect(result.current.serverTime).toBeNull();
      expect(result.current.dataInstruments).toEqual([]);
      expect(result.current.dataInstrumentDetails).toBeUndefined();

      // Ждем завершения первого запроса статуса
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.bybit.com/v5/system/status",
          expect.any(Object),
        );
      });
    });
  });

  describe("Запрос статуса сервера", () => {
    it("должен обновлять статус при успешном ответе (сервер работает)", async () => {
      mockFetch
        .mockResolvedValueOnce(responseStatus) //StrictMode
        .mockResolvedValueOnce(responseStatus);

      const { result } = renderHook(() => useBybit());

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      expect(result.current.error).toBe("");
      expect(result.current.serverTime).toEqual(
        new Date(mockServerStatusResponse.time),
      );
      // Должны запуститься запросы инструментов
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.bybit.com/v5/market/tickers?category=spot",
        expect.any(Object),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.bybit.com/v5/market/tickers?category=linear",
        expect.any(Object),
      );
    });

    it("должен обновлять статус при успешном ответе (сервер на обслуживании)", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockServerMaintenanceResponse,
      });

      const { result } = renderHook(() => useBybit());

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
        expect(result.current.error).not.toBe("");
      });

      expect(result.current.error).toBe("Сервер на обслуживании");
      // Не должны запускаться запросы инструментов
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringMatching(/tickers/),
        expect.any(Object),
      );
    });

    it("должен обрабатывать ошибку при запросе статуса", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Network error")) //StrictMode
        .mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useBybit(0));

      await waitFor(() => {
        expect(result.current.error).toBe("Network error");
      });

      expect(result.current.isOnline).toBe(false);
    });

    it("должен обрабатывать HTTP ошибку при запросе статуса", async () => {
      const response = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      };
      mockFetch
        .mockResolvedValueOnce(response) //StrictMode
        .mockResolvedValueOnce(response);

      const { result } = renderHook(() => useBybit());

      await waitFor(() => {
        expect(result.current.error).toContain("500");
      });

      expect(result.current.isOnline).toBe(false);
    });
  });

  describe("Запрос инструментов", () => {
    it("должен загружать spot и linear инструменты после успешного статуса", async () => {
      // Последовательно возвращаем разные ответы
      mockFetch
        .mockResolvedValueOnce(responseStatus) //StrictMode
        .mockResolvedValueOnce(responseStatus)
        .mockResolvedValueOnce(responseSpotInstruments)
        .mockResolvedValueOnce(responseLinearInstruments);

      const { result } = renderHook(() => useBybit());

      await waitFor(() => {
        expect(result.current.dataInstruments).toHaveLength(3);
      });

      const instruments = result.current.dataInstruments;
      if (instruments[0]) {
        expect(instruments[0].symbol).toBe("BTCUSDT");
        expect(instruments[0].category).toBe("spot");
        expect(instruments[0].lastPrice).toBe(50000);
      }
      if (instruments[1]) {
        expect(instruments[1].symbol).toBe("ETHUSDT");
        expect(instruments[1].category).toBe("spot");
      }
      if (instruments[2]) {
        expect(instruments[2].symbol).toBe("BTCPERP");
        expect(instruments[2].category).toBe("linear");
        expect(instruments[2].lastPrice).toBe(50100);
      }
    });

    it("должен обрабатывать ошибки при загрузке spot инструментов", async () => {
      // Последовательно возвращаем разные ответы
      mockFetch
        .mockResolvedValueOnce(responseStatus) //StrictMode
        .mockResolvedValueOnce(responseStatus)
        .mockRejectedValueOnce(new Error("Ошибка загрузки spot"))
        .mockResolvedValueOnce(responseLinearInstruments);

      const { result } = renderHook(() => useBybit());

      await waitFor(() => {
        expect(result.current.error).toBe("Ошибка загрузки spot");
      });

      // Linear инструменты загрузятся, несмотря на ошибки в spot
      expect(result.current.dataInstruments).toHaveLength(1);
    });

    it("должен обрабатывать ошибки при загрузке linear инструментов", async () => {
      // Последовательно возвращаем разные ответы
      mockFetch
        .mockResolvedValueOnce(responseStatus) //StrictMode
        .mockResolvedValueOnce(responseStatus)
        .mockResolvedValueOnce(responseSpotInstruments)
        .mockRejectedValueOnce(new Error("Ошибка загрузки linear"));

      const { result } = renderHook(() => useBybit());

      await waitFor(() => {
        expect(result.current.error).toBe("Ошибка загрузки linear");
      });

      // Spot инструменты загрузятся
      expect(result.current.dataInstruments).toHaveLength(2);
    });

    it("должен обрабатывать пустой список при загрузке linear инструментов", async () => {
      // Последовательно возвращаем разные ответы
      mockFetch
        .mockResolvedValueOnce(responseStatus) //StrictMode
        .mockResolvedValueOnce(responseStatus)
        .mockResolvedValueOnce(responseSpotInstruments)
        .mockRejectedValueOnce(responseEmptyInstruments);

      const { result } = renderHook(() => useBybit());

      await waitFor(() => {
        expect(result.current.dataInstruments).not.toHaveLength(0);
      });

      // Spot инструменты загрузятся
      expect(result.current.dataInstruments).toHaveLength(2);
    });
  });

  describe("Запрос детальной информации", () => {
    it("должен загружать детальную информацию при выборе инструмента", async () => {
      // Последовательно возвращаем разные ответы
      mockFetch
        .mockResolvedValueOnce(responseStatus) //StrictMode
        .mockResolvedValueOnce(responseStatus)
        .mockResolvedValueOnce(responseSpotInstruments)
        .mockResolvedValueOnce(responseLinearInstruments)
        .mockResolvedValueOnce(responseInstrumentDetails);

      const { result } = renderHook(
        ({ category, symbol }) => useBybit(1, category, symbol),
        { initialProps: { category: "spot", symbol: "BTCUSDT" } },
      );

      // Ждем загрузки статуса и инструментов
      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.dataInstruments).toHaveLength(3);
      });

      // Проверяем, что запрос деталей был сделан
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.bybit.com//v5/market/instruments-info?category=spot&symbol=BTCUSDT",
        expect.any(Object),
      );

      await waitFor(() => {
        expect(result.current.dataInstrumentDetails).toBeDefined();
      });

      expect(result.current.dataInstrumentDetails?.symbol).toBe("BTCUSDT");
      expect(result.current.dataInstrumentDetails?.contractType).toBe(
        "LinearPerpetual",
      );
      expect(result.current.dataInstrumentDetails?.priceFilter?.tickSize).toBe(
        0.1,
      );
      expect(result.current.dataInstrumentDetails?.launchTime).toBeInstanceOf(
        Date,
      );
    });

    it("должен получать {} если сервер вернул пустые данные при выборе инструмента", async () => {
      // Последовательно возвращаем разные ответы
      mockFetch
        .mockResolvedValueOnce(responseStatus) //StrictMode
        .mockResolvedValueOnce(responseStatus)
        .mockResolvedValueOnce(responseSpotInstruments)
        .mockResolvedValueOnce(responseLinearInstruments)
        .mockResolvedValueOnce(responseEmptyInstrumentDetails);

      const { result } = renderHook(
        ({ category, symbol }) => useBybit(1, category, symbol),
        { initialProps: { category: "spot", symbol: "BTCUSDT" } },
      );

      // Ждем загрузки статуса и инструментов
      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.dataInstruments).toHaveLength(3);
      });

      // Проверяем, что запрос деталей был сделан
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.bybit.com//v5/market/instruments-info?category=spot&symbol=BTCUSDT",
        expect.any(Object),
      );

      await waitFor(() => {
        expect(result.current.dataInstrumentDetails).toBeDefined();
      });

      expect(result.current.dataInstrumentDetails).toEqual({});
    });

    it("должен обрабатывать ошибки при загрузке детальной информации", async () => {
      // Последовательно возвращаем разные ответы
      mockFetch
        .mockResolvedValueOnce(responseStatus) //StrictMode
        .mockResolvedValueOnce(responseStatus)
        .mockResolvedValueOnce(responseSpotInstruments)
        .mockResolvedValueOnce(responseLinearInstruments)
        .mockRejectedValueOnce(new Error("Ошибка загрузки деталей"));

      const { result } = renderHook(() => useBybit(1, "spot", "BTCUSDT"));

      await waitFor(() => {
        expect(result.current.error).toBe("Ошибка загрузки деталей");
      });
    });

    it("не должен запрашивать детали если нет символа", async () => {
      // Последовательно возвращаем разные ответы
      mockFetch
        .mockResolvedValueOnce(responseStatus) //StrictMode
        .mockResolvedValueOnce(responseStatus)
        .mockResolvedValueOnce(responseSpotInstruments)
        .mockResolvedValueOnce(responseLinearInstruments);

      const { result } = renderHook(() => useBybit(1, "spot", ""));

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      // Проверяем, что запрос деталей НЕ был сделан
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining("instruments-info"),
        expect.any(Object),
      );
    });
  });

  describe("Периодическое обновление", () => {
    it("должен обновлять статус сервера с заданным интервалом", async () => {
      mockFetch.mockResolvedValue(responseStatus);

      renderHook(() => useBybit(1)); // интервал 1 минута

      // Первый запрос при монтировании
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(4);
      });

      // Запускаем таймеры
      act(() => {
        jest.advanceTimersByTime(60000); // 1 минута
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(5);
      });

      act(() => {
        jest.advanceTimersByTime(60000); // еще 1 минута
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(6);
      });
    });

    it("не должен обновлять при intervalMinutes = 0", async () => {
      mockFetch.mockResolvedValue(responseStatus);

      renderHook(() => useBybit(0));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(4); // только StrictMode + начальная загрузка
      });

      act(() => {
        jest.advanceTimersByTime(120000);
      });

      expect(mockFetch).toHaveBeenCalledTimes(4); // не увеличилось
    });
  });

  describe("Интеграция и сложные сценарии", () => {
    it("должен корректно обрабатывать последовательность: статус → инструменты → детали", async () => {
      // Последовательно возвращаем разные ответы
      mockFetch
        .mockResolvedValueOnce(responseStatus) //StrictMode
        .mockResolvedValueOnce(responseStatus)
        .mockResolvedValueOnce(responseSpotInstruments)
        .mockResolvedValueOnce(responseLinearInstruments)
        .mockResolvedValueOnce(responseInstrumentDetails);

      const { result } = renderHook(() => useBybit(1, "spot", "BTCUSDT"));

      // Проверяем всю цепочку
      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      await waitFor(() => {
        expect(result.current.dataInstruments).toHaveLength(3);
      });

      await waitFor(() => {
        expect(result.current.dataInstrumentDetails).toBeDefined();
      });

      // Проверяем количество запросов
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it("должен очищать таймеры при размонтировании", async () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");

      const { unmount } = renderHook(() => useBybit(1));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });

    it("должен обновлять данные при изменении category или symbol", async () => {
      // Последовательно возвращаем разные ответы
      mockFetch
        .mockResolvedValueOnce(responseStatus) //StrictMode
        .mockResolvedValueOnce(responseStatus)
        .mockResolvedValueOnce(responseSpotInstruments)
        .mockResolvedValueOnce(responseLinearInstruments)
        .mockResolvedValueOnce(responseInstrumentDetails)
        // Для второго вызова с новыми параметрами
        .mockResolvedValueOnce(responseInstrumentDetails);

      const { result, rerender } = renderHook(
        ({ category, symbol }) => useBybit(1, category, symbol),
        { initialProps: { category: "spot", symbol: "BTCUSDT" } },
      );

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      // Проверяем количество запросов
      expect(mockFetch).toHaveBeenCalledTimes(5);

      // Меняем параметры
      rerender({ category: "linear", symbol: "ETHPERP" });

      // Должен быть новый запрос деталей
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("category=linear&symbol=ETHPERP"),
          expect.any(Object),
        );
      });
      expect(mockFetch).toHaveBeenCalledTimes(6);
    });
  });
});
