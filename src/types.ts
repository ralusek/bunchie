export type OptionalKeys<T> = { [k in keyof T]-?: undefined extends T[k] ? k : never }[keyof T];
export type NonOptionalKeys<T> = { [k in keyof T]-?: undefined extends T[k] ? never : k }[keyof T];

export type TimeoutId = ReturnType<typeof setTimeout>;

export type Config<T> = {
  debounce?: number;
  maxTimeout?: number;
  maxCount?: number;
  onNewBunch?: () => void;
  onBunchExecute?: (args: T[]) => void;
};

export type Key = string | string[];

export type ConstructKey<T extends any[]> = (...args: T) => Key;

export type Defer<R> = {
  resolve: (response: R) => void;
  reject: (reason?: any) => void;
};

export type Result<T, R> = {
  result: R;
  index: number;
  arguments: T;
  bunch: {
    size: number;
    arguments: T[];
  };
};
