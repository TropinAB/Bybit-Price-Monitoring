import { render, screen } from "@testing-library/react";
import { AboutPage } from "./AboutPage";
import "@testing-library/jest-dom";

jest.mock("./AboutPage.css", () => ({}));

describe("AboutPage", () => {
  const getSectionByHeading = (headingText: string | RegExp) => {
    const heading = screen.getByRole("heading", { name: headingText });
    return heading.closest("section");
  };

  describe("Рендер основных секций", () => {
    it('должен рендерить заголовок "Мониторинг цен на бирже Bybit"', () => {
      render(<AboutPage />);

      const heading = screen.getByRole("heading", {
        name: /📊 Мониторинг цен на бирже Bybit/i,
      });
      expect(heading).toBeInTheDocument();
    });

    it("должен рендерить описание приложения", () => {
      render(<AboutPage />);

      const description = screen.getByText(
        /Приложение предназначено для отслеживания цен криптовалют/i,
      );
      expect(description).toBeInTheDocument();
    });

    it("должен рендерить все 6 основных разделов", () => {
      render(<AboutPage />);

      const sections = [
        /📊 Мониторинг цен на бирже Bybit/i,
        /✨ Основные возможности/i,
        /🛠️ Технологии/i,
        /📱 Как пользоваться/i,
        /ℹ️ Дополнительная информация/i,
        /👤 Автор/i,
      ];

      sections.forEach((section) => {
        expect(
          screen.getByRole("heading", { name: section }),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Раздел "Основные возможности"', () => {
    it("должен рендерить все 6 пунктов возможностей", () => {
      render(<AboutPage />);

      const features = [
        /Просмотр инструментов/i,
        /Просмотр детальной информации о выбранном Инструменте/i,
        /Установка целевых цен/i,
        /Уведомления о достижении целей/i,
        /Мониторинг целей/i,
        /Сохранение данных/i,
      ];

      features.forEach((feature) => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    it("должен рендерить описания для каждого пункта", () => {
      render(<AboutPage />);

      const descriptions = [
        /Таблица со всеми доступными инструментами Bybit/i,
        /тип контракта, статус, дата запуска/i,
        /Добавление инструментов в мониторинг/i,
        /Всплывающие toast-уведомления/i,
        /Отдельная страница со списком отслеживаемых инструментов/i,
        /сохраняются в localStorage/i,
      ];

      descriptions.forEach((desc) => {
        expect(screen.getByText(desc, { exact: false })).toBeInTheDocument();
      });
    });

    it("должен иметь правильную структуру с иконками", () => {
      render(<AboutPage />);

      // Проверяем наличие иконок
      const icons = ["📈", "🔍", "🎯", "🔔", "📋", "💾"];

      icons.forEach((icon) => {
        expect(screen.getByText(icon)).toBeInTheDocument();
      });
    });
  });

  describe('Раздел "Технологии"', () => {
    it("должен рендерить все технологии", () => {
      render(<AboutPage />);

      const section = getSectionByHeading(/🛠️ Технологии/i);

      const techTags = section?.querySelectorAll(".tech-tag");
      expect(techTags).toHaveLength(6);

      const techTexts = Array.from(techTags || []).map(
        (tag) => tag.textContent,
      );
      expect(techTexts).toEqual([
        "React 19",
        "TypeScript",
        "CSS Modules",
        "Bybit API",
        "LocalStorage",
        "Jest",
      ]);
    });

    it("должен иметь правильные классы для тегов технологий", () => {
      render(<AboutPage />);

      // Ищем по точному тексту
      const reactTag = screen.getByText("React 19");
      const tsTag = screen.getByText("TypeScript");
      const cssTag = screen.getByText("CSS Modules");
      const bybitTag = screen.getByText("Bybit API");
      const localStorageTag = screen.getByText("LocalStorage");
      const jestTag = screen.getByText("Jest");

      expect(reactTag).toHaveClass("tech-tag");
      expect(tsTag).toHaveClass("tech-tag");
      expect(cssTag).toHaveClass("tech-tag");
      expect(bybitTag).toHaveClass("tech-tag");
      expect(localStorageTag).toHaveClass("tech-tag");
      expect(jestTag).toHaveClass("tech-tag");
    });
  });

  describe('Раздел "Как пользоваться"', () => {
    it("должен рендерить все 5 шагов инструкции", () => {
      render(<AboutPage />);

      const section = getSectionByHeading(/📱 Как пользоваться/i);
      expect(section).toHaveClass("about-section");

      const list = section?.querySelector(".instructions-list");
      expect(list).toBeInTheDocument();

      const items = list?.querySelectorAll("li");
      expect(items).toHaveLength(5);

      // Проверяем наличие ключевых фраз
      const itemTexts = Array.from(items || []).map((item) => item.textContent);

      expect(itemTexts.some((text) => text?.includes("Инструменты"))).toBe(
        true,
      );
      expect(itemTexts.some((text) => text?.includes("Мониторинг"))).toBe(true);
      expect(itemTexts.some((text) => text?.includes("кнопку +"))).toBe(true);
      expect(itemTexts.some((text) => text?.includes("уведомление"))).toBe(
        true,
      );
      expect(itemTexts.some((text) => text?.includes("зелёным фоном"))).toBe(
        true,
      );
    });
  });

  describe('Раздел "Дополнительная информация"', () => {
    it("должен рендерить все 4 информационных блока", () => {
      render(<AboutPage />);

      const infoLabels = [
        /Обновление цен:/i,
        /Источник данных:/i,
        /Хранение данных:/i,
        /Поддерживаемые инструменты:/i,
      ];

      infoLabels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it("должен отображать корректные значения информации", () => {
      render(<AboutPage />);

      const infoValues = [
        /от 0 до 5 минут/i,
        /Bybit Public API/i,
        /LocalStorage браузера/i,
        /Спот и бессрочные контракты/i,
      ];

      infoValues.forEach((value) => {
        expect(screen.getByText(value, { exact: false })).toBeInTheDocument();
      });
    });

    it("должен иметь класс info-section", () => {
      render(<AboutPage />);

      const infoSection = screen
        .getByText(/Дополнительная информация/i)
        .closest("section");
      expect(infoSection).toHaveClass("info-section");
    });
  });

  describe('Раздел "Автор"', () => {
    it("должен отображать имя автора", () => {
      render(<AboutPage />);

      expect(screen.getByText("Тропин А.Б.")).toBeInTheDocument();
    });

    it("должен иметь класс author-section", () => {
      render(<AboutPage />);

      const authorSection = screen.getByText(/Автор/i).closest("section");
      expect(authorSection).toHaveClass("author-section");
    });
  });

  describe("Общая структура и стили", () => {
    it("должен иметь правильную структуру контейнера", () => {
      const { container } = render(<AboutPage />);

      expect(container.firstChild).toHaveClass("about-container");
      expect(container.querySelector(".about-content")).toBeInTheDocument();
    });

    it("должен рендерить все секции с правильными классами", () => {
      render(<AboutPage />);

      const sections = document.querySelectorAll(".about-section");
      expect(sections.length).toBe(6);
    });
  });
});
