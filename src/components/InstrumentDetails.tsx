import { useOutletContext } from "react-router";
import {
  BybitInstrumentInfo,
  BybitInstrumentInfoCombo,
} from "../types/BybitInstrumentInfo";
import { numberWithSpaces } from "../utils/FormatValues";

const details = [
  {
    groupPath: "",
    groupName: "Основные параметры",
    params: [
      { path: "contractType", label: "Тип контракта" },
      { path: "status", label: "Статус" },
      { path: "launchTime", label: "Дата запуска" },
    ],
  },
  {
    groupPath: "priceFilter",
    groupName: "Параметры цены",
    params: [
      { path: "minPrice", label: "Минимум" },
      { path: "maxPrice", label: "Максимум" },
      { path: "tickSize", label: "Шаг цены" },
    ],
  },
  {
    groupPath: "lotSizeFilter",
    groupName: "Параметры лота",
    params: [
      { path: "minOrderAmt", label: "Минимум" },
      { path: "maxOrderAmt", label: "Максимум" },
      { path: "maxLimitOrderQty", label: "Максимум (лимитный ордер)" },
      { path: "maxMarketOrderQty", label: "Максимум (маркет-ордер)" },
      { path: "maxMktOrderQty", label: "Максимум (маркет-ордер)" },
      { path: "qtyStep", label: "Шаг кол-ва" },
      { path: "minNotionalValue", label: "Минимум в $" },
    ],
  },
  {
    groupPath: "leverageFilter",
    groupName: "Параметры плеча",
    params: [
      { path: "minLeverage", label: "Минимум" },
      { path: "maxLeverage", label: "Максимум" },
      { path: "leverageStep", label: "Шаг" },
    ],
  },
];

interface ContextType {
  selectedInstrument: string;
  dataInstrumentDetails: BybitInstrumentInfo;
}

export function InstrumentDetails() {
  const { dataInstrumentDetails: instrument } = useOutletContext<ContextType>();

  // подгодовить структуру параметров
  function getGroups() {
    const groups: React.ReactNode[] = [];
    details.forEach((group) => {
      const items: React.ReactNode[] = [];
      const column = group.groupPath as keyof BybitInstrumentInfo;
      const data: BybitInstrumentInfoCombo = group.groupPath
        ? instrument[column]
        : instrument;
      data &&
        group.params.forEach((param) => {
          const column = param.path as keyof BybitInstrumentInfoCombo;
          let value: null | string | number | Date | any = data[column];
          if (value) {
            if (typeof value === "number") value = numberWithSpaces(value); // TODO подобрать точность
            if (value instanceof Date) value = value.toLocaleString("ru-RU");
            items.push(
              <div className="detail-item" key={param.path}>
                <span className="label">{param.label}:</span>
                <span className="value">{value}</span>
              </div>,
            );
          }
        });
      if (items && items.length) {
        groups.push(
          <div className="details-group" key={group.groupName || "main"}>
            <h3 className="group-title">{group.groupName}</h3>
            <div className="details-grid">{items}</div>
          </div>,
        );
      }
    });

    return groups;
  }

  return (
    <div className="instrument-details-section">
      {instrument ? (
        <div className="instrument-details">
          <h2>{instrument.symbol}</h2>
          <div className="details-groups-container">{getGroups()}</div>
        </div>
      ) : (
        <div className="no-selection">Выберите инструмент из списка</div>
      )}
    </div>
  );
}
