interface BybitInstument {
  symbol: string;
  lastPrice: number | null; // текущая цена
  turnover24h: number | null; // объём торгов в $
  volume24h: number | null; // объём торгов в единицах Инструмента
  price24hPcnt;
}

export interface BybitInstuments {
  category: string;
  list: BybitSystemStatus[];
}
