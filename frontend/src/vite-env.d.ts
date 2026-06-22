/// <reference types="vite/client" />

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "react" {
  export type ReactNode = any;
  export type ReactElement = any;
  export type FormEvent<T = any> = any;
  export type ChangeEvent<T = any> = any;
  export type MouseEvent<T = any> = any;
  export type KeyboardEvent<T = any> = any;
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export interface Context<T = any> {
    __type?: T;
    Provider?: any;
  }

  export function useState<S>(
    initialState: S | (() => S),
  ): [S, Dispatch<SetStateAction<S>>];
  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function useEffect(
    effect: () => void | (() => void),
    deps?: readonly unknown[],
  ): void;
  export function useMemo<T>(factory: () => T, deps?: readonly unknown[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: readonly unknown[],
  ): T;
  export const StrictMode: any;
  const React: any;
  export default React;
}

declare namespace React {
  type FormEvent<T = any> = import("react").FormEvent<T>;
  type ChangeEvent<T = any> = import("react").ChangeEvent<T>;
  type ReactNode = import("react").ReactNode;
}

declare module "react/jsx-runtime" {
  export const Fragment: any;
  export const jsx: any;
  export const jsxs: any;
}

declare module "react-dom/client" {
  export function createRoot(container: any): {
    render: (node: any) => void;
  };
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface IntrinsicAttributes {
    key?: any;
  }
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
  [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
