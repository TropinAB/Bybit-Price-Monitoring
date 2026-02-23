import { useEffect, useState } from "react";
import { useFetch } from "./useFetch";
import { BybitResponse } from "../types/BybitResponse";
import { BybitSystemStatuses } from "../types/BybitSystemStatus";
import { BybitInstrument, BybitInstruments } from "../types/BybitInstruments";
import {
  BybitInstrumentInfo,
  BybitInstrumentsInfo,
} from "../types/BybitInstrumentInfo";

// category: spot/linear/inverse/option
export function useBybit(
  intervalMinutes: number = 1,
  category: string = "spot",
  symbol: string = "",
) {
  const intervalMS = intervalMinutes * 60 * 1000;
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState("");
  const [serverTime, setServerTime] = useState<Date | null>(null);
  console.log("useBybit", intervalMinutes);

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
  // console.log("requestBybitState", stateLoading, dataState, errorState);

  // Запрос перечня Инструментов по категориям spot/linear
  const {
    // loading: loadingInstruments,
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
    if (!response.result?.list) return [];
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

  console.log("triggerState", triggerState);
  useEffect(() => {
    console.log("setInterval refetchStatus", intervalMS);
    if (!intervalMS) return;
    const timerID = setInterval(() => {
      setTriggerState((t) => t + 1);
    }, intervalMS);

    return () => clearInterval(timerID);
  }, [intervalMS]);

  useEffect(() => {
    // запрос статуса сервера
    console.log("useEffect triggerState", triggerState);
    refetchState();
  }, [triggerState]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect errorState", errorState);
    if (errorState) {
      setIsOnline(false);
      setError(errorState);
    }
  }, [errorState]);

  useEffect(() => {
    // обработать статус сервера
    console.log(
      "useEffect dataState",
      dataState && new Date(dataState.time),
      dataState,
    );
    if (!dataState) return;
    setServerTime(new Date(dataState.time));
    if (dataState.result && dataState.result.list) {
      if (dataState.result.list.length === 0) {
        setIsOnline(true);
        setError("");
        // Запрос перечня Инструментов
        console.time("dataInstrumentsSpot");
        refetchInstrumentsSpot();
        console.time("dataInstrumentsLinear");
        refetchInstrumentsLinear();
      } else {
        setIsOnline(false);
        // TODO сделать обработку ответов о профработах
      }
    }
  }, [dataState]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect errorInstrumentsSpot", errorInstrumentsSpot);
    errorInstrumentsSpot && setError(errorInstrumentsSpot);
  }, [errorInstrumentsSpot]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect dataInstrumentsSpot", dataInstrumentsSpot);
    dataInstrumentsSpot && console.timeEnd("dataInstrumentsSpot");
    dataInstrumentsSpot && setError("");
  }, [dataInstrumentsSpot]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect errorInstrumentsLinear", errorInstrumentsLinear);
    errorInstrumentsLinear && setError(errorInstrumentsLinear);
  }, [errorInstrumentsLinear]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect dataInstrumentsLinear", dataInstrumentsLinear);
    dataInstrumentsLinear && console.timeEnd("dataInstrumentsLinear");
    dataInstrumentsLinear && setError("");
  }, [dataInstrumentsLinear]);

  useEffect(() => {
    // запрос статуса сервера
    console.log(
      "!!!! useEffect isOnline, category, symbol",
      isOnline,
      category,
      symbol,
    );
    if (isOnline && category && symbol) {
      console.time("dataInstrumentDetails");
      refetchInstrumentDetails();
    }
  }, [isOnline, category, symbol]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect errorInstrumentDetails", errorInstrumentDetails);
    errorInstrumentDetails && setError(errorInstrumentDetails);
  }, [errorInstrumentDetails]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect dataInstrumentDetails", dataInstrumentDetails);
    dataInstrumentDetails && console.timeEnd("dataInstrumentDetails");
    dataInstrumentDetails && setError("");
  }, [dataInstrumentDetails]);

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
