import { useEffect, useState } from "react";
import { useFetch } from "./useFetch";
import { BybitResponse } from "../types/BybitResponse";
import { BybitSystemStatuses } from "../types/BybitSystemStatus";
import { BybitInstrument, BybitInstruments } from "../types/BybitInstruments";
import {
  BybitInstrumentInfo,
  BybitInstrumentsInfo,
} from "../types/BybitInstrumentInfo";

// TODO подумать как разделить обновление только того, что меняется

// category: spot/linear/inverse/option
export function useBybit(
  category: string = "spot",
  baseCoin: string = "USDT",
  intervalMinutes: number = 1,
  symbol: string = "",
) {
  const intervalMS = intervalMinutes * 60 * 1000;
  const [isOnline, setIsOnline] = useState(false);
  const [serverTime, setServerTime] = useState<Date | null>(null);
  console.log("useBybit", category, baseCoin, intervalMinutes);

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

  // Запрос перечня Инструментов
  const [triggerInstruments, setTriggerInstruments] = useState(0);
  const {
    // loading: loadingInstruments,
    data: dataInstruments,
    error: errorInstruments,
    refetchData: refetchInstruments,
  } = useFetch<BybitResponse<BybitInstruments>, BybitInstrument[]>(
    `https://api.bybit.com/v5/market/tickers?category=${category}&baseCoin=${baseCoin}`,
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
      symbol: item.symbol,
      lastPrice: Number(item.lastPrice),
      turnover24h: Number(item.turnover24h),
      volume24h: Number(item.volume24h),
      price24hPcnt: Number(item.price24hPcnt),
    }));
  }

  // Запрос детализации по Инструменту
  const [triggerInstrumentDetails, setTriggerInstrumentDetails] = useState(0);
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
  }, [triggerState, category, baseCoin, symbol]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect errorState", errorState);
    errorState && setIsOnline(false);
    // TODO сделать обработку и вывод ошибок
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
        // Запрос перечня Инструментов
        category && baseCoin && setTriggerInstruments((t) => t + 1);
        // Запрос детализации по Инструменту
        category && symbol && setTriggerInstrumentDetails((t) => t + 1);
      } else {
        setIsOnline(false);
        // TODO сделать обработку и вывод ошибок
      }
    }
  }, [dataState]);

  useEffect(() => {
    // Запрос перечня Инструментов
    console.log("useEffect triggerInstruments", triggerInstruments);
    console.time("dataInstruments");
    triggerInstruments && refetchInstruments();
  }, [triggerInstruments]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect errorInstruments", errorInstruments);
    // TODO сделать обработку и вывод ошибок
  }, [errorInstruments]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect dataInstruments", dataInstruments);
    console.timeEnd("dataInstruments");
    // TODO сделать обработку и вывод ошибок
  }, [dataInstruments]);

  useEffect(() => {
    // Запрос детализации по Инструменту
    console.log("useEffect triggerInstrumentDetails", triggerInstrumentDetails);
    console.time("dataInstrumentDetails");
    triggerInstruments && refetchInstrumentDetails();
  }, [triggerInstrumentDetails]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect errorInstrumentDetails", errorInstrumentDetails);
    // TODO сделать обработку и вывод ошибок
  }, [errorInstrumentDetails]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect dataInstrumentDetails", dataInstrumentDetails);
    console.timeEnd("dataInstrumentDetails");
    // TODO сделать обработку и вывод ошибок
  }, [dataInstrumentDetails]);

  return { isOnline, serverTime, dataInstruments, dataInstrumentDetails };
}
