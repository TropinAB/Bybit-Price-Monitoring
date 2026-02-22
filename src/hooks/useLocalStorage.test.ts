import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  // Очищаем localStorage перед каждым тестом
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  // Мок для localStorage
  const mockLocalStorage = () => {
    let store: { [key: string]: string } = {};

    const getItemMock = jest.spyOn(Storage.prototype, "getItem");
    const setItemMock = jest.spyOn(Storage.prototype, "setItem");
    const removeItemMock = jest.spyOn(Storage.prototype, "removeItem");
    const clearMock = jest.spyOn(Storage.prototype, "clear");

    getItemMock.mockImplementation((key: string) => store[key] || null);
    setItemMock.mockImplementation((key: string, value: string) => {
      store[key] = value;
    });
    removeItemMock.mockImplementation((key: string) => {
      delete store[key];
    });
    clearMock.mockImplementation(() => {
      store = {};
    });

    return { store, getItemMock, setItemMock, removeItemMock, clearMock };
  };

  it("should return default value when localStorage is empty", () => {
    mockLocalStorage();

    const { result } = renderHook(() =>
      useLocalStorage<string>("test-key", "default value"),
    );

    const [value] = result.current;
    expect(value).toBe("default value");
  });

  it("should load existing value from localStorage", () => {
    const mocks = mockLocalStorage();
    mocks.store["existing-key"] = JSON.stringify("stored value");

    const { result } = renderHook(() =>
      useLocalStorage<string>("existing-key", "default value"),
    );

    const [value] = result.current;
    expect(value).toBe("stored value");
  });

  it("should handle complex objects", () => {
    mockLocalStorage();

    const defaultValue = {
      name: "John",
      age: 30,
      hobbies: ["reading", "coding"],
    };

    const { result } = renderHook(() =>
      useLocalStorage<typeof defaultValue>("user", defaultValue),
    );

    const [value] = result.current;
    expect(value).toEqual(defaultValue);
  });

  it("should update localStorage when value changes", () => {
    const mocks = mockLocalStorage();

    const { result } = renderHook(() =>
      useLocalStorage<string>("test-key", "initial"),
    );

    act(() => {
      const [, setValue] = result.current;
      setValue("updated value");
    });

    // Проверяем, что состояние обновилось
    const [updatedValue] = result.current;
    expect(updatedValue).toBe("updated value");

    // Проверяем, что localStorage обновился
    const storedValue: string | undefined = mocks.store["test-key"];
    expect(storedValue).not.toBeNull();
    expect(JSON.parse(storedValue as string)).toBe("updated value");
    expect(mocks.setItemMock).toHaveBeenCalledWith(
      "test-key",
      JSON.stringify("updated value"),
    );
  });

  it("should handle functional updates", () => {
    mockLocalStorage();

    const { result } = renderHook(() => useLocalStorage<number>("counter", 0));

    act(() => {
      const [, setValue] = result.current;
      setValue((prev: number) => prev + 5);
    });

    const [value] = result.current;
    expect(value).toBe(5);
  });

  it("should handle arrays correctly", () => {
    mockLocalStorage();

    const { result } = renderHook(() => useLocalStorage<string[]>("todos", []));

    act(() => {
      const [, setValue] = result.current;
      setValue(["todo1", "todo2"]);
    });

    const [value] = result.current;
    expect(value).toEqual(["todo1", "todo2"]);

    // Проверяем localStorage
    const storedValue = JSON.parse(
      window.localStorage.getItem("todos") || "[]",
    );
    expect(storedValue).toEqual(["todo1", "todo2"]);
  });

  it("should handle different keys independently", () => {
    mockLocalStorage();

    const { result: hook1 } = renderHook(() =>
      useLocalStorage<string>("key1", "value1"),
    );

    const { result: hook2 } = renderHook(() =>
      useLocalStorage<string>("key2", "value2"),
    );

    expect(hook1.current[0]).toBe("value1");
    expect(hook2.current[0]).toBe("value2");

    act(() => {
      hook1.current[1]("new value1");
    });

    expect(hook1.current[0]).toBe("new value1");
    expect(hook2.current[0]).toBe("value2");
  });

  test("should handle JSON parse errors gracefully", () => {
    const mocks = mockLocalStorage();
    // Сохраняем некорректный JSON
    mocks.store["invalid"] = "not valid json{";

    // Мокаем JSON.parse чтобы выбрасывал ошибку
    const parseMock = jest.spyOn(JSON, "parse").mockImplementationOnce(() => {
      throw new Error("Parse error");
    });

    const { result } = renderHook(() =>
      useLocalStorage<string>("invalid", "default"),
    );
    expect(result.current[0]).toBe("default");
    parseMock.mockRestore();
  });

  test("should handle multiple updates in sequence", () => {
    mockLocalStorage();

    const { result } = renderHook(() => useLocalStorage<number>("counter", 0));

    act(() => {
      const [, setValue] = result.current;
      setValue(1);
    });
    expect(result.current[0]).toBe(1);

    act(() => {
      const [, setValue] = result.current;
      setValue(2);
    });
    expect(result.current[0]).toBe(2);

    act(() => {
      const [, setValue] = result.current;
      setValue(3);
    });
    expect(result.current[0]).toBe(3);
  });
});
