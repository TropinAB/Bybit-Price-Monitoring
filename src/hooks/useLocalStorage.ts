import { useEffect, useState } from "react";

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, Function] {
  const [value, setValue] = useState(() => {
    try {
      const storedValue: string | null = window.localStorage.getItem(key);
      if (storedValue != null) return JSON.parse(storedValue);
    } catch (error) {}
    return defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
