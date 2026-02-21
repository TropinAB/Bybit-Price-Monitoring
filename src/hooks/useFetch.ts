import { useState, useEffect, useCallback, useRef } from "react";

interface UseFetchOptions<T, R> {
  skipOnMount?: boolean; // пропустить запуск при монтировании?
  dataSelector?: (data: T) => R; // функция для преобразования данных
}

export function useFetch<T = any, R = any>(
  url: string | null,
  option: UseFetchOptions<T, R> = {},
) {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<R | null | undefined>(undefined);
  const [error, setError] = useState<string>("");

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    console.log("fetchData", url);
    if (!url) return;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    try {
      setLoading(true);
      setError("");

      const response: Response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });
      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
      }
      const result: T = await response.json();

      // Если задан селектор - преобразовать данные
      const transformedData: R = option.dataSelector
        ? option.dataSelector(result)
        : (result as unknown as R);

      setData(transformedData);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") return;
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    // пропустить запуск при монтировании?
    if (!option.skipOnMount) fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchData]);

  return { loading, data, error, refetchData: fetchData };
}
