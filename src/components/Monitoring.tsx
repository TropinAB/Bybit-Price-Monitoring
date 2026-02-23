import { useMemo } from "react";
import { MonitoringData } from "../types/MonitoringData";
import { useOutletContext } from "react-router";
import { BybitInstrument } from "../types/BybitInstruments";
import {
  formatDate,
  formatPercentage,
  formatPrice,
} from "../utils/FormatValues";

interface ContextType {
  category: string;
  dataInstruments: BybitInstrument[];
  monitoringData: MonitoringData[];
  onChangeMonitoringData: (data: MonitoringData[]) => void;
}

const columns = [
  { id: "category", name: "Категория" },
  { id: "symbol", name: "Инструмент" },
  { id: "startPrice", name: "Начальная цена" },
  { id: "startDate", name: "Дата начала" },
  { id: "lastPrice", name: "Текущая цена" },
  { id: "targetPrice", name: "Ожидаемая цена" },
  { id: "targetDate", name: "Дата достижения цели" },
  { id: "state", name: "Статус" },
];

const categories = new Map<string, string>([
  ["spot", "СПОТ"],
  ["linear", "Бессрочные контракты"],
]);

export function Monitoring() {
  const { category, dataInstruments, monitoringData, onChangeMonitoringData } =
    useOutletContext<ContextType>();
  console.log("Monitoring", category, monitoringData);

  const preparedMD = useMemo(() => {
    if (!monitoringData) return [];

    const result = monitoringData.map((itemMD) => {
      // найти текущую цену
      const instrument: BybitInstrument | undefined =
        dataInstruments &&
        dataInstruments.find((itemI) => itemI.symbol === itemMD.symbol);

      return {
        ...itemMD,
        lastPrice: instrument?.lastPrice || 0,
        key: `${itemMD.category}-${itemMD.symbol}-${itemMD.targetPrice}-${itemMD.startDate}`,
      };
    });

    // Сортируем
    result.sort(
      (a, b) =>
        a.category.localeCompare(b.category) ||
        a.symbol.localeCompare(b.symbol) ||
        b.targetPrice - a.targetPrice,
    );

    return result;
  }, [dataInstruments, monitoringData]);

  // Обработчик удаления записи
  const handleDelete = (itemMD: MonitoringData) => {
    if (window.confirm("Вы уверены, что хотите удалить эту запись?")) {
      const newData = monitoringData.filter(
        (item) =>
          !(
            item.category === itemMD.category &&
            item.symbol === itemMD.symbol &&
            item.targetPrice === itemMD.targetPrice &&
            item.startDate.getTime() === itemMD.startDate.getTime()
          ),
      );
      onChangeMonitoringData(newData);
      // onDeleteItem?.(symbol, startDate);
    }
  };

  // Обработчик очистки всех данных
  const handleClearAll = () => {
    if (window.confirm("Вы уверены, что хотите очистить все записи?")) {
      onChangeMonitoringData([]);
      //     onClearAll?.();
    }
  };

  // Проверка, достигнута ли цель
  const isTargetReached = (item: MonitoringData) => {
    return !!item.targetDate;
  };

  return (
    <div className="monitoring-container">
      <div className="monitoring-header">
        <button
          className="clear-all-btn"
          onClick={handleClearAll}
          disabled={preparedMD.length === 0}
        >
          🗑️ Очистить все данные
        </button>
      </div>

      {preparedMD.length === 0 ? (
        <div className="empty-state">
          <p>Нет записей для мониторинга</p>
          <p className="empty-state-hint">
            Добавьте цели на странице "Инструменты"
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="monitoring-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th>{column.name}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {preparedMD.map((item) => {
                const reached = isTargetReached(item);
                const priceDiff =
                  (item.lastPrice - item.targetPrice) / item.targetPrice;
                return (
                  <tr
                    key={item.key}
                    className={reached ? "target-reached" : ""}
                  >
                    <td>{categories.get(item.category) || "-"}</td>
                    <td className="instrument">{item.symbol}</td>
                    <td className="price">{formatPrice(item.startPrice)}</td>
                    <td className="date">{formatDate(item.startDate)}</td>
                    <td className="price current">
                      {formatPrice(item.lastPrice)}
                      <span className="price-diff">
                        {formatPercentage(priceDiff)}
                      </span>
                    </td>
                    <td className="price target">
                      {formatPrice(item.targetPrice)}
                    </td>
                    <td className="date">{formatDate(item.targetDate)}</td>
                    <td>
                      {reached ? (
                        <span className="status-badge success">
                          ✅ Достигнута
                        </span>
                      ) : (
                        <span className="status-badge pending">
                          ⏳ Ожидание
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(item)}
                        title="Удалить запись"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
