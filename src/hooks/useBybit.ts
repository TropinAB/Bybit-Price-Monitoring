import { useEffect, useState } from "react";
import { useFetch } from "./useFetch";
import { BybitResponse } from "../types/BybitResponse";
import { BybitSystemStatuses } from "../types/BybitSystemStatus";
import { BybitInstrument, BybitInstruments } from "../types/BybitInstruments";

// category: spot/linear/inverse/option
export function useBybit(
  category: string = "spot",
  baseCoin: string = "USDT",
  intervalMinutes: number = 1,
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
  }, [triggerState, category]);

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
        setTriggerInstruments((t) => t + 1);
      } else {
        console.log(
          "dataState.result.list.length=, dataState.result.list.length",
        );
        setIsOnline(false);
        // TODO сделать обработку и вывод ошибок
      }
    }
  }, [dataState]);

  useEffect(() => {
    // Запрос перечня Инструментов
    console.log("useEffect triggerInstruments", triggerInstruments);
    console.time("triggerInstruments");
    triggerInstruments && refetchInstruments();
  }, [triggerInstruments]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect errorInstruments", errorInstruments);
    errorInstruments && setIsOnline(false);
    // TODO сделать обработку и вывод ошибок
  }, [errorInstruments]);

  useEffect(() => {
    // обработать ошибки
    console.log("useEffect dataInstruments", dataInstruments);
    console.timeEnd("triggerInstruments");
    // TODO сделать обработку и вывод ошибок
  }, [dataInstruments]);

  return { isOnline, serverTime, dataInstruments };
}
