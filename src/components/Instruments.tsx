import { useOutletContext } from "react-router";
import { BybitInstrument } from "../types/BybitInstruments";
import { useMemo, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  formatPercentage,
  formatPrice,
  formatVolume,
} from "../utils/FormatValues";

const categories = [
  { value: "spot", name: "СПОТ" },
  { value: "linear", name: "Бессрочные контракты" },
];
const baseCoins = ["USDT", "USDC", "BTC"];
const columns = [
  { id: "symbol", name: "Инструмент" },
  { id: "lastPrice", name: "Цена" },
  { id: "turnover24h", name: "Оборот за 24 ч." },
  { id: "volume24h", name: "Объём за 24 ч." },
  { id: "price24hPcnt", name: "% изменения цены" },
];

interface ContextType {
  // refreshInterval: number;
  // isOnline: boolean;
  category: string;
  onChangeCategory: (category: string) => void;
  baseCoin: string;
  onChangeBaseCoin: (category: string) => void;
  selectedInstrument: string;
  onChangeSelectedInstrument: (category: string) => void;
  dataInstruments: BybitInstrument[];
}

interface InstrumentsProps {
  onSelectInstrument?: (instrument: BybitInstrument) => void;
}

export function Instruments({ onSelectInstrument }: InstrumentsProps) {
  const {
    category,
    onChangeCategory,
    baseCoin,
    onChangeBaseCoin,
    selectedInstrument,
    onChangeSelectedInstrument,
    dataInstruments,
  } = useOutletContext<ContextType>();
  console.log("Instruments", category, baseCoin);

  const [filterSymbol, setFilterSymbol] = useState<string>("");
  const [sortColumn, setSortColumn] = useLocalStorage(
    "Bybit-Price-Monitoring:sortColumn",
    "turnover24h",
  );
  const [sortDirection, setSortDirection] = useLocalStorage(
    "Bybit-Price-Monitoring:sortDirection",
    "descending",
  );

  const preparedInstruments = useMemo(() => {
    if (!dataInstruments) return [];
    // Фильтруем по базовой монете
    const result: BybitInstrument[] = dataInstruments.filter(
      (instrument) =>
        instrument.symbol.endsWith(baseCoin) &&
        instrument.symbol.includes(filterSymbol),
    );

    result.sort((a, b) => {
      const column = sortColumn as keyof BybitInstrument;
      const aValue = a[column];
      const bValue = b[column];

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string")
        comparison = aValue.localeCompare(bValue);
      else if (typeof aValue === "number" && typeof bValue === "number")
        comparison = aValue - bValue;

      return sortDirection === "ascending" ? comparison : -comparison;
    });

    console.log("Sort", sortColumn, sortDirection);
    return result;
  }, [dataInstruments, baseCoin, filterSymbol, sortColumn, sortDirection]);

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection(
        sortDirection === "ascending" ? "descending" : "ascending",
      );
    } else {
      setSortColumn(column);
      setSortDirection("descending");
    }
  }

  function handleRowClick(instrument: BybitInstrument) {
    onChangeSelectedInstrument(instrument.symbol);
    if (onSelectInstrument) onSelectInstrument(instrument);
  }

  function handleChangeCategory(value: string) {
    onChangeCategory(value);
    onChangeSelectedInstrument("");
  }

  function handleChangeBaseCoin(value: string) {
    onChangeBaseCoin(value);
    onChangeSelectedInstrument("");
  }

  return (
    <div className="instruments-table-section">
      <div className="filters-panel">
        <select
          value={category}
          onChange={(e) => handleChangeCategory(e.target.value)}
          className="filter-select"
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={baseCoin}
          onChange={(e) => handleChangeBaseCoin(e.target.value)}
          className="filter-select"
        >
          {baseCoins.map((coin) => (
            <option key={coin} value={coin}>
              {coin}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={filterSymbol}
          onChange={(e) => setFilterSymbol(e.target.value.toUpperCase())}
          className="filter-select"
        />
      </div>
      <div className="table-container">
        <table className="instruments-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  className={column.id === sortColumn ? sortDirection : ""}
                  onClick={() => handleSort(column.id)}
                >
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preparedInstruments.map((instrument) => (
              <tr
                key={instrument.symbol}
                onClick={() => handleRowClick(instrument)}
                className={
                  selectedInstrument === instrument.symbol ? "selected" : ""
                }
              >
                <td>{instrument.symbol}</td>
                <td className="price">{formatPrice(instrument.lastPrice)}</td>
                <td className="volume">
                  {formatVolume(instrument.turnover24h)}
                </td>
                <td className="volume">{formatVolume(instrument.volume24h)}</td>
                <td className="percentage">
                  {formatPercentage(instrument.price24hPcnt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
