interface BybitInstrument {
  category: string;
  symbol: string;
  lastPrice: number | null; // текущая цена
  turnover24h: number | null; // объём торгов в $
  volume24h: number | null; // объём торгов в единицах Инструмента
  price24hPcnt: number | null; // % изменения цены за 24 часа
}

export interface BybitInstruments {
  category: string;
  list: BybitInstrument[];
}
// category
// - spot
// - linear USDT perpetual, USDT Futures and USDC contract, including USDC perp, USDC futures
// - inverse Inverse contract, including Inverse perp, Inverse futures
// - option
