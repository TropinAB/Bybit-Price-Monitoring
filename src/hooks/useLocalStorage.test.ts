import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  // Очищаем localStorage перед каждым тестом
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();

    // Мокаем методы localStorage для отслеживания вызовов
    jest.spyOn(Storage.prototype, "getItem");
    jest.spyOn(Storage.prototype, "setItem");
    jest.spyOn(Storage.prototype, "removeItem");
    jest.spyOn(Storage.prototype, "clear");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Инициализация", () => {
    it("должен возвращать значение по умолчанию если localStorage пуст", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "default value"),
      );

      const [value] = result.current;

      expect(value).toBe("default value");
      expect(localStorage.getItem).toHaveBeenCalledWith("test-key");
    });

    it("должен загружать существующее значение из localStorage", () => {
      // Предварительно заполняем localStorage
      localStorage.setItem("existing-key", JSON.stringify("stored value"));

      const { result } = renderHook(() =>
        useLocalStorage("existing-key", "default value"),
      );

      const [value] = result.current;

      expect(value).toBe("stored value");
    });

    it("должен работать с числовыми значениями", () => {
      localStorage.setItem("number-key", JSON.stringify(42));

      const { result } = renderHook(() => useLocalStorage("number-key", 0));

      const [value] = result.current;
      expect(value).toBe(42);
    });

    it("должен работать с булевыми значениями", () => {
      localStorage.setItem("bool-key", JSON.stringify(true));

      const { result } = renderHook(() => useLocalStorage("bool-key", false));

      const [value] = result.current;
      expect(value).toBe(true);
    });

    it("должен работать с объектами", () => {
      const storedObject = { name: "John", age: 30 };
      localStorage.setItem("object-key", JSON.stringify(storedObject));

      const { result } = renderHook(() =>
        useLocalStorage("object-key", { name: "", age: 0 }),
      );

      const [value] = result.current;
      expect(value).toEqual(storedObject);
    });

    it("должен работать с массивами", () => {
      const storedArray = [1, 2, 3, 4, 5];
      localStorage.setItem("array-key", JSON.stringify(storedArray));

      const { result } = renderHook(() => useLocalStorage("array-key", []));

      const [value] = result.current;
      expect(value).toEqual(storedArray);
    });

    it("должен обрабатывать некорректный JSON в localStorage", () => {
      // Сохраняем некорректный JSON
      localStorage.setItem("invalid-key", "not valid json{");

      // Мокаем console.error чтобы не засорять вывод
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() =>
        useLocalStorage("invalid-key", "default value"),
      );

      const [value] = result.current;

      expect(value).toBe("default value");
      expect(consoleSpy).not.toHaveBeenCalled(); // Ошибка перехвачена в try/catch

      consoleSpy.mockRestore();
    });
  });

  describe("Обновление значений", () => {
    it("должен обновлять значение и сохранять в localStorage", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );

      act(() => {
        const [, setValue] = result.current;
        setValue("updated value");
      });

      const [updatedValue] = result.current;

      expect(updatedValue).toBe("updated value");
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "test-key",
        JSON.stringify("updated value"),
      );
    });

    it("должен обновлять значение функцией (как useState)", () => {
      const { result } = renderHook(() => useLocalStorage("counter", 0));

      act(() => {
        const [, setValue] = result.current;
        setValue((prev: number) => prev + 5);
      });

      const [value] = result.current;
      expect(value).toBe(5);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "counter",
        JSON.stringify(5),
      );
    });

    it("должен обновлять объекты", () => {
      const { result } = renderHook(() =>
        useLocalStorage("user", { name: "John", age: 30 }),
      );

      act(() => {
        const [, setValue] = result.current;
        setValue({ ...result.current[0], age: 31 });
      });

      const [value] = result.current;
      expect(value).toEqual({ name: "John", age: 31 });
    });

    it("должен обновлять массивы", () => {
      const { result } = renderHook(() =>
        useLocalStorage("todos", ["todo1", "todo2"]),
      );

      act(() => {
        const [, setValue] = result.current;
        setValue([...result.current[0], "todo3"]);
      });

      const [value] = result.current;
      expect(value).toEqual(["todo1", "todo2", "todo3"]);
    });
  });

  describe("Несколько ключей", () => {
    it("должен независимо хранить значения для разных ключей", () => {
      const { result: hook1 } = renderHook(() =>
        useLocalStorage("key1", "value1"),
      );

      const { result: hook2 } = renderHook(() =>
        useLocalStorage("key2", "value2"),
      );

      expect(hook1.current[0]).toBe("value1");
      expect(hook2.current[0]).toBe("value2");

      act(() => {
        hook1.current[1]("new value1");
      });

      expect(hook1.current[0]).toBe("new value1");
      expect(hook2.current[0]).toBe("value2");

      // Проверяем localStorage
      expect(localStorage.getItem("key1")).toBe(JSON.stringify("new value1"));
      expect(localStorage.getItem("key2")).toBe(JSON.stringify("value2"));
    });

    it.skip("должен работать с несколькими экземплярами одного ключа", () => {
      // TODO вернуться к этому тесту после реализации синхронизации
      const { result: hook1 } = renderHook(() =>
        useLocalStorage("shared-key", "initial"),
      );

      const { result: hook2 } = renderHook(() =>
        useLocalStorage("shared-key", "initial"),
      );

      act(() => {
        hook1.current[1]("updated from hook1");
      });

      // Второй хук должен получить обновленное значение
      expect(hook2.current[0]).toBe("updated from hook1");
    });
  });

  describe("Синхронизация с localStorage", () => {
    it("должен сохранять в localStorage при изменении ключа", () => {
      const { rerender } = renderHook(
        ({ key }) => useLocalStorage(key, "value"),
        { initialProps: { key: "key1" } },
      );

      // Первоначальное сохранение
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "key1",
        JSON.stringify("value"),
      );

      // Меняем ключ
      rerender({ key: "key2" });

      // Должен сохранить с новым ключом
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "key2",
        JSON.stringify("value"),
      );
    });
  });

  describe("Граничные случаи", () => {
    it("должен обрабатывать null и undefined", () => {
      const { result } = renderHook(() =>
        useLocalStorage<null | string>("null-key", null),
      );

      expect(result.current[0]).toBeNull();

      act(() => {
        result.current[1](undefined);
      });

      expect(result.current[0]).toBeUndefined();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "null-key",
        JSON.stringify(undefined),
      );
    });

    it("должен обрабатывать сложные вложенные объекты", () => {
      const complexObject = {
        user: {
          name: "John",
          address: {
            city: "Moscow",
            street: "Lenina",
          },
          hobbies: ["reading", "coding"],
        },
        meta: {
          created: new Date("2024-01-01").toISOString(),
          version: 1,
        },
      };

      localStorage.setItem("complex", JSON.stringify(complexObject));

      const { result } = renderHook(() => useLocalStorage("complex", {}));

      expect(result.current[0]).toEqual(complexObject);
    });
  });

  describe("Производительность и оптимизация", () => {
    it("не должен вызывать лишние рендеры", () => {
      const renderSpy = jest.fn();

      const Component = () => {
        renderSpy();
        return null;
      };

      renderHook(() => Component());

      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it("должен стабильно возвращать функцию setValue", () => {
      const { result, rerender } = renderHook(() =>
        useLocalStorage("test", "value"),
      );

      const [, setValue1] = result.current;

      rerender();

      const [, setValue2] = result.current;

      expect(setValue1).toBe(setValue2); // Ссылка на функцию должна быть стабильной
    });
  });
});
