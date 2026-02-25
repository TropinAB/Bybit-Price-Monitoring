export type BybitInstrumentInfoCombo =
  | null
  | string
  | number
  | Date
  | BybitPriceFilter
  | BybitLotSizeFilter
  | BybitLeverageFilter
  | BybitInstrumentInfo;

export interface BybitPriceFilter {
  tickSize: number;
  minPrice: number | null; // linear only
  maxPrice: number | null; // linear only
}
export interface BybitLotSizeFilter {
  minOrderAmt: number | null; // SPOT only
  maxOrderAmt: number | null; // SPOT only
  maxLimitOrderQty: number | null; // SPOT only
  maxMarketOrderQty: number | null; // SPOT only
  maxMktOrderQty: number | null; // linear only
  qtyStep: number | null; // linear only
  minNotionalValue: number | null; // linear only
}
export interface BybitLeverageFilter {
  minLeverage: number | null; // linear only
  maxLeverage: number | null; // linear only
  leverageStep: number | null; // linear only
}
export interface BybitInstrumentInfo {
  symbol: string;
  contractType: string; // linear only
  status: string;
  baseCoin: string;
  quoteCoin: string;
  launchTime: Date | number | null; // linear only
  priceFilter: BybitPriceFilter;
  lotSizeFilter: BybitLotSizeFilter;
  leverageFilter: BybitLeverageFilter;
}

export interface BybitInstrumentsInfo {
  category: string;
  list: BybitInstrumentInfo[];
}
