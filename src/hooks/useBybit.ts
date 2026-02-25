import { useEffect, useState } from "react";
import { useFetch } from "./useFetch";
import { BybitResponse } from "../types/BybitResponse";
import {
  BybitSystemStatus,
  BybitSystemStatuses,
} from "../types/BybitSystemStatus";
import { BybitInstrument, BybitInstruments } from "../types/BybitInstruments";
import {
  BybitInstrumentInfo,
  BybitInstrumentsInfo,
} from "../types/BybitInstrumentInfo";

// category: spot/linear/inverse/option
export function useBybit(
  intervalMinutes: number = 1,
  category: string = "",
  symbol: string = "",
) {
  const intervalMS = intervalMinutes * 60 * 1000;
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState("");
  const [serverTime, setServerTime] = useState<Date | null>(null);

  // Запрос состояния сервера
  const [triggerState, setTriggerState] = useState(0);
  const {
    // loading: loadingState,
    data: dataState,
    error: errorState,
    refetchData: refetchState,
  } = useFetch<BybitResponse<BybitSystemStatuses>>(
    "https://api.bybit.com/v5/system/status",
  );

  // Запрос перечня Инструментов по категориям spot/linear
  const {
    data: dataInstrumentsSpot,
    error: errorInstrumentsSpot,
    refetchData: refetchInstrumentsSpot,
  } = useFetch<BybitResponse<BybitInstruments>, BybitInstrument[]>(
    `https://api.bybit.com/v5/market/tickers?category=spot`,
    {
      skipOnMount: true,
      dataSelector: InstrumentsSelector,
    },
  );
  const {
    // loading: loadingInstruments,
    data: dataInstrumentsLinear,
    error: errorInstrumentsLinear,
    refetchData: refetchInstrumentsLinear,
  } = useFetch<BybitResponse<BybitInstruments>, BybitInstrument[]>(
    `https://api.bybit.com/v5/market/tickers?category=linear`,
    {
      skipOnMount: true,
      dataSelector: InstrumentsSelector,
    },
  );
  function InstrumentsSelector(
    response: BybitResponse<BybitInstruments>,
  ): BybitInstrument[] {
    if (!response.result?.list || response.result?.list.length === 0) return [];
    return response.result.list.map((item) => ({
      category: response.result.category,
      symbol: item.symbol,
      lastPrice: Number(item.lastPrice),
      turnover24h: Number(item.turnover24h),
      volume24h: Number(item.volume24h),
      price24hPcnt: Number(item.price24hPcnt),
    }));
  }
  // Запрос детализации по Инструменту
  const {
    // loading: loadingInstruments,
    data: dataInstrumentDetails,
    error: errorInstrumentDetails,
    refetchData: refetchInstrumentDetails,
  } = useFetch<BybitResponse<BybitInstrumentsInfo>, BybitInstrumentInfo>(
    `https://api.bybit.com//v5/market/instruments-info?category=${category}&symbol=${symbol}`,
    {
      skipOnMount: true,
      dataSelector: InstrumentInfoSelector,
    },
  );
  function InstrumentInfoSelector(
    response: BybitResponse<BybitInstrumentsInfo>,
  ): BybitInstrumentInfo {
    if (!response?.result?.list || response.result.list.length === 0)
      return {} as BybitInstrumentInfo;
    const item: BybitInstrumentInfo = response.result
      .list[0] as BybitInstrumentInfo;
    return {
      symbol: item.symbol,
      contractType: item.contractType,
      status: item.status,
      baseCoin: item.baseCoin,
      quoteCoin: item.quoteCoin,
      launchTime: item.launchTime && new Date(Number(item.launchTime)),
      priceFilter: item.priceFilter && {
        tickSize:
          item.priceFilter.tickSize && Number(item.priceFilter.tickSize),
        minPrice:
          item.priceFilter.minPrice && Number(item.priceFilter.minPrice),
        maxPrice:
          item.priceFilter.maxPrice && Number(item.priceFilter.maxPrice),
      },
      lotSizeFilter: item.lotSizeFilter && {
        minOrderAmt:
          item.lotSizeFilter.minOrderAmt &&
          Number(item.lotSizeFilter.minOrderAmt),
        maxOrderAmt:
          item.lotSizeFilter.maxOrderAmt &&
          Number(item.lotSizeFilter.maxOrderAmt),
        maxLimitOrderQty:
          item.lotSizeFilter.maxLimitOrderQty &&
          Number(item.lotSizeFilter.maxLimitOrderQty),
        maxMarketOrderQty:
          item.lotSizeFilter.maxMarketOrderQty &&
          Number(item.lotSizeFilter.maxMarketOrderQty),
        maxMktOrderQty:
          item.lotSizeFilter.maxMktOrderQty &&
          Number(item.lotSizeFilter.maxMktOrderQty),
        qtyStep:
          item.lotSizeFilter.qtyStep && Number(item.lotSizeFilter.qtyStep),
        minNotionalValue:
          item.lotSizeFilter.minNotionalValue &&
          Number(item.lotSizeFilter.minNotionalValue),
      },
      leverageFilter: item.leverageFilter && {
        minLeverage:
          item.leverageFilter.minLeverage &&
          Number(item.leverageFilter.minLeverage),
        maxLeverage:
          item.leverageFilter.maxLeverage &&
          Number(item.leverageFilter.maxLeverage),
        leverageStep:
          item.leverageFilter.leverageStep &&
          Number(item.leverageFilter.leverageStep),
      },
    };
  }

  useEffect(() => {
    if (!intervalMS) return;
    const timerID = setInterval(() => {
      setTriggerState((t) => t + 1);
    }, intervalMS);

    return () => clearInterval(timerID);
  }, [intervalMS]);

  useEffect(() => {
    // запрос статуса сервера
    refetchState();
  }, [triggerState]);

  // обработать ошибки
  useEffect(() => {
    if (
      errorState ||
      errorInstrumentsSpot ||
      errorInstrumentsLinear ||
      errorInstrumentDetails
    ) {
      errorState && setIsOnline(false);
      const error = [
        errorState,
        errorInstrumentsSpot,
        errorInstrumentsLinear,
        errorInstrumentDetails,
      ]
        .filter((error) => !!error)
        .join(", ");
      setError(error);
    }
  }, [
    errorState,
    errorInstrumentsSpot,
    errorInstrumentsLinear,
    errorInstrumentDetails,
  ]);

  useEffect(() => {
    // обработать статус сервера
    if (!dataState) return;
    setServerTime(new Date(dataState.time));
    if (dataState.result && dataState.result.list) {
      if (dataState.result.list.length === 0) {
        setIsOnline(true);
        // Запрос перечня Инструментов
        refetchInstrumentsSpot();
        refetchInstrumentsLinear();
      } else {
        const state = dataState.result.list
          .map((item: BybitSystemStatus) => item.title)
          .join(", ");
        setError(state);
        setIsOnline(false);
      }
    }
  }, [dataState]);

  useEffect(() => {
    // запрос статуса сервера
    if (isOnline && category && symbol) {
      refetchInstrumentDetails();
    }
  }, [isOnline, category, symbol]);

  let dataInstruments: BybitInstrument[] = [
    ...(dataInstrumentsSpot || []),
    ...(dataInstrumentsLinear || []),
  ];
  return {
    isOnline,
    error,
    serverTime,
    dataInstruments,
    dataInstrumentDetails,
  };
}
