import {
  numberWithSpaces,
  formatPrice,
  formatVolume,
  formatPercentage,
  formatDate,
} from "./FormatValues";

describe("FormatValues", () => {
  describe("numberWithSpaces", () => {
    it("должен форматировать целые числа с пробелами", () => {
      expect(numberWithSpaces(1000)).toBe("1 000");
      expect(numberWithSpaces(1000000)).toBe("1 000 000");
      expect(numberWithSpaces(1234567)).toBe("1 234 567");
    });

    it("должен форматировать числа с десятичной частью", () => {
      expect(numberWithSpaces(1234.56, 2)).toBe("1 234,56");
      expect(numberWithSpaces(1234.56789, 3)).toBe("1 234,568");
    });

    it("должен обрабатывать нули", () => {
      expect(numberWithSpaces(0)).toBe("0");
      expect(numberWithSpaces(0.0)).toBe("0");
    });

    it("должен обрезать лишние нули при digits=0", () => {
      expect(numberWithSpaces(123.45, 0)).toBe("123,45");
      expect(numberWithSpaces(123.0, 0)).toBe("123");
    });

    it("должен обрабатывать отрицательные числа", () => {
      expect(numberWithSpaces(-1000)).toBe("-1 000");
      expect(numberWithSpaces(-1234.56, 2)).toBe("-1 234,56");
    });

    it("должен форматировать маленькие числа", () => {
      expect(numberWithSpaces(0.001, 3)).toBe("0,001");
      expect(numberWithSpaces(0.0001, 4)).toBe("0,0001");
    });

    it("должен обрабатывать граничные случаи", () => {
      expect(numberWithSpaces(999)).toBe("999");
      expect(numberWithSpaces(1000)).toBe("1 000");
      expect(numberWithSpaces(999999)).toBe("999 999");
    });
  });

  describe("formatPrice", () => {
    it('должен возвращать "-" для null', () => {
      expect(formatPrice(null)).toBe("-");
    });

    it("должен форматировать цену с 2-12 знаками после запятой", () => {
      expect(formatPrice(1234.5)).toBe("1 234,50");
      expect(formatPrice(1234.56789)).toBe("1 234,56789");
      expect(formatPrice(0.00000123)).toBe("0,00000123");
    });

    it("должен использовать русскую локаль", () => {
      const result = formatPrice(1000.5);
      expect(result).toContain(" "); // неразрывный пробел
      expect(result).toContain(",");
    });

    it("должен форматировать целые числа", () => {
      expect(formatPrice(1000)).toBe("1 000,00");
    });

    it("должен обрабатывать отрицательные цены", () => {
      expect(formatPrice(-1000.5)).toBe("-1 000,50");
    });

    it("должен обрабатывать нулевую цену", () => {
      expect(formatPrice(0)).toBe("0,00");
    });
  });

  describe("formatVolume", () => {
    it('должен возвращать "-" для null', () => {
      expect(formatVolume(null)).toBe("-");
    });

    it("должен форматировать миллионы с суффиксом M", () => {
      expect(formatVolume(1_500_000)).toBe("1,500M");
      expect(formatVolume(2_000_000)).toBe("2,000M");
      expect(formatVolume(2_345_678)).toBe("2,346M");
    });

    it("должен форматировать тысячи с суффиксом K", () => {
      expect(formatVolume(1_500)).toBe("1,500K");
      expect(formatVolume(2_000)).toBe("2,000K");
      expect(formatVolume(2_345)).toBe("2,345K");
    });

    it("должен форматировать числа меньше тысячи без суффикса", () => {
      expect(formatVolume(123)).toBe("123,000");
      expect(formatVolume(999.99)).toBe("999,990");
    });

    it("должен обрабатывать граничные значения", () => {
      expect(formatVolume(1_000_000)).toBe("1,000M");
      expect(formatVolume(1_000)).toBe("1,000K");
      expect(formatVolume(999.999)).toBe("999,999");
    });

    it("должен обрабатывать отрицательные объёмы", () => {
      expect(formatVolume(-1_500_000)).toBe("-1,500M");
      expect(formatVolume(-1_500)).toBe("-1,500K");
    });

    it("должен использовать numberWithSpaces для форматирования", () => {
      expect(formatVolume(1_234_567)).toBe("1,235M");
      expect(formatVolume(1_234)).toBe("1,234K");
    });
  });

  describe("formatPercentage", () => {
    it('должен возвращать "-" для null', () => {
      expect(formatPercentage(null)).toEqual(<p>-</p>);
    });

    it("должен форматировать положительные проценты с классом positive", () => {
      const result = formatPercentage(0.05);
      expect(result.type).toBe("span");
      expect(result.props.className).toBe("positive");
      expect(result.props.children).toEqual(["5,00", "%"]);
    });

    it("должен форматировать отрицательные проценты с классом negative", () => {
      const result = formatPercentage(-0.05);
      expect(result.type).toBe("span");
      expect(result.props.className).toBe("negative");
      expect(result.props.children).toEqual(["-5,00", "%"]);
    });

    it("должен форматировать нулевые проценты как положительные", () => {
      const result = formatPercentage(0);
      expect(result.props.className).toBe("positive");
      expect(result.props.children).toEqual(["0,00", "%"]);
    });

    it("должен умножать на 100 для отображения процентов", () => {
      const result = formatPercentage(0.123);
      expect(result.props.children).toEqual(["12,30", "%"]);
    });

    it("должен форматировать с двумя знаками после запятой", () => {
      const result = formatPercentage(0.12345);
      expect(result.props.children).toEqual(["12,35", "%"]);
    });
  });

  describe("formatDate", () => {
    const mockDate = new Date("2024-01-15T14:30:45");

    it('должен возвращать "-" для null/undefined', () => {
      expect(formatDate(null)).toBe("-");
      expect(formatDate(undefined)).toBe("-");
    });

    it("должен форматировать Date объект", () => {
      const result = formatDate(mockDate);
      expect(result).toContain("15.01.2024");
      expect(result).toContain("14:30");
    });

    it("должен форматировать строку с датой", () => {
      const result = formatDate("2024-01-15T14:30:45");
      expect(result).toContain("15.01.2024");
      expect(result).toContain("14:30");
    });

    it('должен возвращать "-" для некорректной даты', () => {
      expect(formatDate("invalid-date")).toBe("-");
      expect(formatDate(new Date("invalid"))).toBe("-");
    });

    it("должен использовать русскую локаль", () => {
      const result = formatDate(mockDate);
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/); // формат ДД.ММ.ГГГГ
    });

    it("должен обрабатывать разные форматы дат", () => {
      expect(formatDate("2024-01-05")).toContain("05.01.2024");
      expect(formatDate("2024-01-05T10:00:00")).toContain("05.01.2024");
    });

    it("должен обрабатывать время с одной цифрой", () => {
      const date = new Date("2024-01-15T09:05:00");
      const result = formatDate(date);
      expect(result).toContain("09:05");
    });
  });

  describe("Интеграционные проверки", () => {
    it("должен правильно форматировать все типы данных вместе", () => {
      const price = 1234.56789;
      const volume = 1_500_000;
      const percent = 0.0567;
      const date = new Date("2024-01-15T14:30:00");

      expect(formatPrice(price)).toBe("1 234,56789");
      expect(formatVolume(volume)).toBe("1,500M");
      expect(formatPercentage(percent).props.children).toEqual(["5,67", "%"]);
      expect(formatDate(date)).toContain("15.01.2024");
    });
  });
});
