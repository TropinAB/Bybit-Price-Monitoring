import "./AppContent.css";
import { NavLink, Outlet } from "react-router";
import { useBybit } from "../hooks/useBybit";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useEffect, useState } from "react";
import { MonitoringData } from "../types/MonitoringData";
import { BybitInstrument } from "../types/BybitInstruments";
import toast, { Toaster } from "react-hot-toast";
import { playBellSound } from "../utils/soundUtils";

const menuItems = [
  { path: PREFIX, name: "Инструменты" },
  { path: PREFIX + "monitoring", name: "Мониторинг" },
  { path: PREFIX + "about", name: "О приложении" },
];

const categories = new Map<string, string>([
  ["spot", "СПОТ"],
  ["linear", "Бессрочные контракты"],
]);

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
  const [monitoringData, setMonitoringData] = useLocalStorage<MonitoringData[]>(
    "Bybit-Price-Monitoring:monitoringData",
    [],
  );
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const { isOnline, serverTime, dataInstruments, dataInstrumentDetails } =
    useBybit(refreshInterval, category, selectedInstrument);
  function handleIntervalChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setRefreshInterval(Number(e.target.value));
  }

  useEffect(() => {
    console.log("###", monitoringData.length);
    if (!dataInstruments || !monitoringData || monitoringData.length === 0)
      return;

    let wasChanged: boolean = false;
    const newMD: MonitoringData[] = monitoringData.map((itemMD) => {
      if (itemMD.targetDate) return itemMD; // уже достигли

      const instrument: BybitInstrument | undefined = dataInstruments.find(
        (data) =>
          data.category === itemMD.category && data.symbol === itemMD.symbol,
      );
      instrument &&
        instrument.lastPrice &&
        console.log(
          "###",
          itemMD.targetPrice,
          instrument?.lastPrice,
          itemMD.startPrice,
          Math.sign(instrument?.lastPrice - itemMD.targetPrice),
          Math.sign(itemMD.targetPrice - itemMD.startPrice),
        );
      if (
        instrument &&
        instrument.lastPrice &&
        Math.sign(instrument.lastPrice - itemMD.targetPrice) ===
          Math.sign(itemMD.targetPrice - itemMD.startPrice)
      ) {
        // пересечение уровня
        console.log("###", true);
        itemMD = { ...itemMD, targetDate: new Date() }; // копия

        // playTargetReachedSound();
        playBellSound();
        toast(
          () => (
            <div>
              <span className="toast-icon">🎯</span>
              <div className="toast-text">
                <strong>
                  {categories.get(itemMD.category) || "-"}: {itemMD.symbol}
                </strong>{" "}
                достиг цели!
                <div className="toast-details">
                  Цель: {itemMD.targetPrice} | Текущая: {instrument.lastPrice}
                </div>
              </div>
            </div>
          ),
          { duration: 10000 },
        );
        wasChanged = true;
      }

      return itemMD;
    });
    if (wasChanged) setMonitoringData(newMD);
  }, [dataInstruments, monitoringData]);

  console.log("AppContent", category, baseCoin);
  return (
    <div className="app-container">
      <Toaster position="top-right" />

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

      <main id="main">
        <Outlet
          context={{
            refreshInterval,
            category,
            onChangeCategory: setCategory,
            baseCoin,
            onChangeBaseCoin: setBaseCoin,
            selectedInstrument,
            onChangeSelectedInstrument: setSelectedInstrument,
            isOnline,
            dataInstruments,
            dataInstrumentDetails,
            monitoringData,
            onChangeMonitoringData: setMonitoringData,
          }}
        />
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="server-status">
            <span className="status-label">Состояние сервера Bybit:</span>
            <span className={`status-value ${isOnline ? "online" : "offline"}`}>
              {isOnline ? "🟢 Работает" : "🔴 Не работает"}
            </span>
          </div>
          <div className="update-time">
            <span className="time-label">Время обновления:</span>
            <span className="time-value">
              {serverTime?.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
