import "./AboutPage.css";

export function AboutPage() {
  return (
    <div className="about-container">
      <div className="about-content">
        <section className="about-section">
          <h2>📊 Мониторинг цен на бирже Bybit</h2>
          <p>
            Приложение предназначено для отслеживания цен криптовалют на бирже
            Bybit и мониторинга установленных целевых цен. Вы можете добавлять
            инструменты в список наблюдения, устанавливать целевые цены и
            получать уведомления при их достижении.
          </p>
        </section>

        <section className="about-section">
          <h2>✨ Основные возможности</h2>
          <ul className="features-list">
            <li>
              <div className="feature-text">
                <span className="feature-icon">📈</span>
                <strong>Просмотр инструментов</strong>
              </div>
              <span className="feature-description">
                Таблица со всеми доступными инструментами Bybit с сортировкой и
                фильтрацией по категориям и базовым валютам
              </span>
            </li>
            <li>
              <div className="feature-text">
                <span className="feature-icon">🔍</span>
                <strong>
                  Просмотр детальной информации о выбранном Инструменте
                </strong>
              </div>
              <span className="feature-description">
                Отображение подробной информации: тип контракта, статус, дата
                запуска, параметры цены (минимум, максимум, шаг), параметры
                лота, параметры плеча
              </span>
            </li>
            <li>
              <div className="feature-text">
                <span className="feature-icon">🎯</span>
                <strong>Установка целевых цен</strong>
              </div>
              <span className="feature-description">
                Добавление инструментов в мониторинг с указанием желаемой цены
                для отслеживания
              </span>
            </li>
            <li>
              <div className="feature-text">
                <span className="feature-icon">🔔</span>
                <strong>Уведомления о достижении целей</strong>
              </div>
              <span className="feature-description">
                Всплывающие toast-уведомления и звуковые сигналы при достижении
                целевой цены
              </span>
            </li>
            <li>
              <div className="feature-text">
                <span className="feature-icon">📋</span>
                <strong>Мониторинг целей</strong>
              </div>
              <span className="feature-description">
                Отдельная страница со списком отслеживаемых инструментов и
                статусом их достижения
              </span>
            </li>
            <li>
              <div className="feature-text">
                <span className="feature-icon">💾</span>
                <strong>Сохранение данных</strong>
              </div>
              <span className="feature-description">
                Все цели, а также настройки частоты обновления, выбранная
                категория и базовая монета сохраняются в localStorage и доступны
                после перезагрузки страницы
              </span>
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>🛠️ Технологии</h2>
          <div className="tech-stack">
            <span className="tech-tag">React 19</span>
            <span className="tech-tag">TypeScript</span>
            <span className="tech-tag">CSS Modules</span>
            <span className="tech-tag">Bybit API</span>
            <span className="tech-tag">LocalStorage</span>
            <span className="tech-tag">Jest</span>
          </div>
        </section>

        <section className="about-section">
          <h2>📱 Как пользоваться</h2>
          <ol className="instructions-list">
            <li>
              На странице <strong>Инструменты</strong> выберите интересующий вас
              инструмент из таблицы
            </li>
            <li>
              Нажмите кнопку <button className="instruction-code-btn">+</button>{" "}
              чтобы добавить инструмент в мониторинг с целевой ценой
            </li>
            <li>
              Перейдите на страницу <strong>Мониторинг</strong> для отслеживания
              всех целей
            </li>
            <li>
              При достижении цели вы получите уведомление и звуковой сигнал
            </li>
            <li>Достигнутые цели подсвечиваются зелёным фоном</li>
          </ol>
        </section>

        <section className="about-section info-section">
          <h2>ℹ️ Дополнительная информация</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Обновление цен:</span>
              <span className="info-value">
                от 0 до 5 минут (настраиваемый интервал)
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Источник данных:</span>
              <span className="info-value">Bybit Public API</span>
            </div>
            <div className="info-item">
              <span className="info-label">Хранение данных:</span>
              <span className="info-value">LocalStorage браузера</span>
            </div>
            <div className="info-item">
              <span className="info-label">Поддерживаемые инструменты:</span>
              <span className="info-value">
                Спот и бессрочные контракты (PERP)
              </span>
            </div>
          </div>
        </section>

        <section className="about-section author-section">
          <h2>👤 Автор</h2>
          <p>Тропин А.Б.</p>
        </section>
      </div>
    </div>
  );
}
