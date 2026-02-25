import { renderHook, act, waitFor } from "@testing-library/react";
import { useFetch } from "./useFetch";

// Мокируем глобальный fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("useFetch", () => {
  const mockData = { user: { id: 1, name: "John" } };
  const mockResponseOK = {
    ok: true,
    json: async () => mockData,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Сброс всех моков перед каждым тестом
    mockFetch.mockReset();
  });

  describe("Базовый рендер и состояние", () => {
    it("должен инициализироваться с loading=true и data=undefined", async () => {
      mockFetch.mockResolvedValueOnce(mockResponseOK);
      const { result } = renderHook(() =>
        useFetch("https://api.example.com/data"),
      );

      // Ждём, что после монтирования loading всё ещё true
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe("");
    });

    it("должен работать с null URL (не делать запрос)", () => {
      const { result } = renderHook(() => useFetch(null));

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Успешный запрос", () => {
    it("должен успешно получать данные", async () => {
      mockFetch.mockResolvedValueOnce(mockResponseOK);
      const { result } = renderHook(() =>
        useFetch("https://api.example.com/data"),
      );

      // Ждем завершения запроса
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe("");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/data", {
        signal: expect.any(AbortSignal),
      });
    });

    it("должен применять dataSelector если он передан", async () => {
      mockFetch.mockResolvedValueOnce(mockResponseOK);

      const selector = (data: typeof mockData) => data.user;

      const { result } = renderHook(() =>
        useFetch("https://api.example.com/data", { dataSelector: selector }),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual({ id: 1, name: "John" });
      expect(result.current.data).not.toHaveProperty("user");
    });
  });

  describe("Обработка ошибок", () => {
    it("должен обрабатывать HTTP ошибки", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const { result } = renderHook(() =>
        useFetch("https://api.example.com/data"),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe("Ошибка 404: Not Found");
    });

    it("должен обрабатывать сетевые ошибки", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() =>
        useFetch("https://api.example.com/data"),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe("Network error");
    });

    it("должен игнорировать AbortError", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      mockFetch.mockRejectedValueOnce(abortError);

      const { result } = renderHook(() =>
        useFetch("https://api.example.com/data"),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe(""); // AbortError игнорируется
    });
  });

  describe("Пропуск запроса при монтировании", () => {
    it("должен пропускать запрос если skipOnMount=true", () => {
      const { result } = renderHook(() =>
        useFetch("https://api.example.com/data", { skipOnMount: true }),
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("должен делать запрос при вызове refetchData даже с skipOnMount", async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() =>
        useFetch("https://api.example.com/data", { skipOnMount: true }),
      );

      expect(mockFetch).not.toHaveBeenCalled();

      // Вызываем refetchData
      await act(async () => {
        result.current.refetchData();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe("Отмена запросов", () => {
    it("должен отменять предыдущий запрос при новом URL", async () => {
      const abortSpy = jest.spyOn(AbortController.prototype, "abort");

      const { result, rerender } = renderHook(({ url }) => useFetch(url), {
        initialProps: { url: "https://api.example.com/data1" },
      });
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Меняем URL
      rerender({ url: "https://api.example.com/data2" });
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(abortSpy).toHaveBeenCalled();

      abortSpy.mockRestore();
    });

    it("должен отменять запрос при размонтировании", () => {
      const abortSpy = jest.spyOn(AbortController.prototype, "abort");

      const { unmount } = renderHook(() =>
        useFetch("https://api.example.com/data"),
      );

      unmount();

      expect(abortSpy).toHaveBeenCalled();

      abortSpy.mockRestore();
    });
  });

  describe("refetchData функция", () => {
    it("должен повторно получать данные при вызове refetchData", async () => {
      const mockData1 = { id: 1 };
      const mockData2 = { id: 2 };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData2,
        });

      const { result } = renderHook(() =>
        useFetch("https://api.example.com/data"),
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.data).toEqual(mockData1);

      // Вызываем refetchData
      await act(async () => {
        result.current.refetchData();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2);
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("не должен делать запрос если URL null", async () => {
      const { result } = renderHook(() => useFetch(null));

      await act(async () => {
        await result.current.refetchData();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Изменение URL", () => {
    it("должен делать новый запрос при изменении URL", async () => {
      const mockData1 = { id: 1 };
      const mockData2 = { id: 2 };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData2,
        });

      const { result, rerender } = renderHook(({ url }) => useFetch(url), {
        initialProps: { url: "https://api.example.com/data1" },
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1);
      });

      // Меняем URL
      rerender({ url: "https://api.example.com/data2" });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Сложные сценарии", () => {
    it("должен обрабатывать несколько последовательных запросов", async () => {
      const responses = [{ id: 1 }, { id: 2 }, { id: 3 }];

      responses.forEach((data) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => data,
        });
      });

      const { result, rerender } = renderHook(({ url }) => useFetch(url), {
        initialProps: { url: "https://api.example.com/1" },
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 1 });
      });

      rerender({ url: "https://api.example.com/2" });
      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 2 });
      });

      rerender({ url: "https://api.example.com/3" });
      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 3 });
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("должен сохранять состояние loading во время запроса", async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise);

      const { result } = renderHook(() =>
        useFetch("https://api.example.com/data"),
      );

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ data: "test" }),
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});
