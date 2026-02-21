export interface BybitResponse<T> {
  retCode: number;
  retMsg: string;
  result: T;
  retExtInfo: Object;
  time: number;
}
