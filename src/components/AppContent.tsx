import { NavLink, Outlet } from "react-router";
import { useBybit } from "../hooks/useBybit";
import { useLocalStorage } from "../hooks/useLocalStorage";

const menuItems = [
  { path: PREFIX, name: "Инструменты" },
  { path: PREFIX + "monitoring", name: "Мониторинг" },
  { path: PREFIX + "about", name: "О приложении" },
];

export function AppContent() {
  const [refreshInterval, setRefreshInterval] = useLocalStorage(
    "Bybit-Price-Monitoring:refreshInterval",
    0,
  );
  const [category, setCategory] = useLocalStorage(
    "Bybit-Price-Monitoring:category",
    "linear",
  );
  const [baseCoin, setBaseCoin] = useLocalStorage(
    "Bybit-Price-Monitoring:baseCoin",
    "USDT",
  );
  const { isOnline, serverTime, dataInstruments } = useBybit(
    category,
    baseCoin,
    refreshInterval,
  );
  console.log("AppContent", category, baseCoin);
  function handleIntervalChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setRefreshInterval(Number(e.target.value));
  }

  return (
    <div className="app-container">
      <header>
        <h1 className="header">Мониторинг цен на бирже Bybit</h1>
        <div className="menu-container">
          <nav>
            {menuItems.map((item, index) => (
              <NavLink key={index} to={item.path} className="menu-item border">
                {item.name}
              </NavLink>
            ))}
          </nav>
          <div className="refresh-control">
            <label htmlFor="refresh-interval" className="refresh-label">
              Частота обновления:
            </label>
            <select
              id="refresh-interval"
              value={refreshInterval}
              onChange={handleIntervalChange}
              className="refresh-select"
            >
              <option value={0}>Остановить</option>
              <option value={1}>1 минута</option>
              <option value={2}>2 минуты</option>
              <option value={3}>3 минуты</option>
              <option value={4}>4 минуты</option>
              <option value={5}>5 минут</option>
            </select>
          </div>
        </div>
      </header>

      <main>
        <Outlet
          context={{
            refreshInterval,
            category,
            onChangeCategory: setCategory,
            baseCoin,
            onChangeBaseCoin: setBaseCoin,
            isOnline,
            dataInstruments,
          }}
        />
      </main>

      <footer>
        Состояние сервера Bybit: {isOnline ? "Работает" : "Не работает"}, время
        обновления: {serverTime?.toLocaleTimeString()}
      </footer>
    </div>
  );
}
