export type ApiResponse<T = object> = {
  code: number;
  msg: string;
  data: T;
};
