interface BybitSystemStatus {
  id: string;
  title: string;
  state: string; // scheduled/ongoing/completed/canceled
  begin: string;
  end: string;
  href: string;
  // serviceTypes
  // 1 Trading service
  // 2 Trading service via http request
  // 3 Trading service via websocket
  // 4 Private websocket stream
  // 5 Market data service
  serviceTypes: number[];
  // product
  // 1 Futures
  // 2 Spot
  // 3 Option
  // 4 Spread
  product: number[];
  uidSuffix: number[];
  // maintainType
  // 1 Planned maintenance
  // 2 Temporary maintenance
  // 3 Incident
  maintainType: string;
  // env
  // 1 Production
  // 2 Production Demo service
  env: string;
}

export interface BybitSystemStatuses {
  list: BybitSystemStatus[];
}
