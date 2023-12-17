import type {ReactNode, CSSProperties, ComponentType, ReactElement} from "react";
import type {RouteObject, NavigateOptions, RouterProviderProps, NavigateFunction, Location, To} from "react-router-dom";

export interface KeepaliveProps {
  uniqueKey: string;
  max: number;
  include: (key: string) => boolean;
  exclude: (key: string) => boolean;
  style: Omit<CSSProperties, "display">;
  children: ReactNode;
}

export interface RedirectProps {
  path: string;
  options: NavigateOptions;
  children: ReactNode;
}

export interface TransitionProps {
  name: string;
  disabled: boolean;
  uniqueKey: string | undefined;
  type: "transition" | "animation";
  className: string | undefined;
  style: CSSProperties;
  children: ReactNode;
  enterFromClass: string | undefined;
  enterActiveClass: string | undefined;
  enterToClass: string | undefined;
  leaveFromClass: string | undefined;
  leaveActiveClass: string | undefined;
  leaveToClass: string | undefined;
}

export interface ShowProps {
  resolve: Promise<any> | any;
  loading: ReactNode;
  error: ReactNode | ((error: any) => ReactNode);
  onStart: () => void;
  onEnd: () => void;
  children: (value: any) => ReactNode;
}

export interface ShowListProps {
  loading: ReactNode;
  timeout: number;
  delay: number;
  onStart: () => void;
  onEnd: () => void;
  children: ReactNode | typeof Resolve | (ReactNode | typeof Resolve)[];
}

export interface ResolveProp {
  resolve: Promise<any> | any;
  error: ReactNode | ((error: any) => ReactNode);
  children: (value: any) => ReactNode;
}

export declare class TimeoutError extends Error {
}

export declare class ComponentWithStore {
  readonly component: ComponentType;
  readonly store: StoreInterface;
}

type deactivatedHandle = (() => void) | undefined;

export declare function Transition(props: Partial<TransitionProps>): ReactElement;

export declare function Keepalive(props: Partial<KeepaliveProps>): ReactElement;

export declare function useActivated(activatedHandle: () => deactivatedHandle): void;

export declare function Redirect(props: Partial<RedirectProps>): undefined;

export declare function Show(props: Partial<ShowProps>): ReactElement;

export declare function ShowList(props: Partial<ShowListProps>): ReactElement;

export declare function Resolve(props: Partial<ResolveProp>): undefined;

export declare const enhancer: unique symbol;
export declare const wrapper: unique symbol;
export declare const transition: unique symbol;
export declare const keepalive: unique symbol;
export declare const store: unique symbol;
export declare const start: unique symbol;
export declare const guardError: unique symbol;
export declare const redirect: unique symbol;
export declare const alias: unique symbol;
export declare const max: unique symbol;

type EnhancerHandle = () => ReactNode;
type Enhancer = (next: EnhancerHandle) => EnhancerHandle;
type Props = { [key: string]: any };
type Wrapper = ComponentType | [ComponentType, Props];
type RedirectType = string | RedirectProps;
type AliasType = string | string[];
type ObjectAny = { [key: string | symbol]: any };

interface BaseMetaInterface {
  [enhancer]: Enhancer[];
  [wrapper]: Wrapper[];
  [transition]: Partial<TransitionProps>;
  [keepalive]: Partial<KeepaliveProps>;
  [redirect]: Partial<RedirectType>;
  [alias]: AliasType;
  [guardError]: (error: any) => void;
}

export type MetaInterface = Partial<BaseMetaInterface> & { [store]?: StoreInterface } & ObjectAny;
export type GlobalOptionsType = Partial<BaseMetaInterface> & { [start]?: ReactNode; [max]?: number } & ObjectAny;
export type Route = RouteObject & {
  meta?: MetaInterface;
  component?: ComponentType | ComponentWithStore;
  children?: Route[];
};
export type NavigateGuardType = {
  next: (to: To, options?: NavigateOptions) => never;
  stop: () => never;
};
export type LocationWithMeta = Location & { meta: MetaInterface };
type BeforeEachHandle = (to?: LocationWithMeta, from?: LocationWithMeta, navigateGuard?: NavigateGuardType, value?: any, pathname?: string) => any;
type AfterEachHandle = (to?: LocationWithMeta, from?: LocationWithMeta, value?: any, pathname?: string) => any;
type DeleteBeforeEachHandle = () => BeforeEachHandle;
type DeleteAfterEachHandle = () => AfterEachHandle;
export type WrapperStore<S = ObjectAny> = { state: S; detail: ObjectAny; options: ObjectAny };
export type SetStore<S = ObjectAny> = (state: S, detail?: ObjectAny, options?: ObjectAny) => S | undefined;
export type ReducerAction = ObjectAny & { type: string | undefined };
export type ComposeAction = ObjectAny & { type: Function | undefined };
export type ReducerDispatch = (action: ReducerAction) => any;
export type ComposeDispatch = (action: ComposeAction) => any;

export interface Router {
  RouterProvider: ComponentType<Omit<RouterProviderProps, "router"> & { router: Router }>;
  useRoutes: Route[];
  useGlobalOptions: GlobalOptionsType;
  useRouteMeta: MetaInterface;
  useNavigateGuard: () => boolean;
  useRouterStore: () => StoreInterface;
  useRouterStoreState: () => [WrapperStore, SetStore];
  useRouterStoreReducer: (reducers: ObjectAny) => [WrapperStore, ReducerDispatch];
  useRouterStoreCompose: () => [WrapperStore, ComposeDispatch];
  globalOptions: GlobalOptionsType;
  beforeEach: (handle: BeforeEachHandle) => DeleteBeforeEachHandle;
  afterEach: (handle: AfterEachHandle) => DeleteAfterEachHandle;
  getRoutes: Route[];
  addRoutes: (newRoutes: Route[]) => Promise<NavigateFunction>;
  hasRoute: (locationArg: Partial<Location> | string, basename?: string) => boolean;
}

type Options = { basename?: string };

export declare function createBrowserRouter(routes: Route[], options?: Options, globalOptions?: GlobalOptionsType): Router;

export declare function createHashRouter(routes: Route[], options?: Options, globalOptions?: GlobalOptionsType): Router;

export declare function useRouter(): Router;

type Action = ReducerAction | ComposeAction;

export declare function createReducerHandle<S = ObjectAny>(reducer: (state: S, action?: Action, detail?: ObjectAny, options?: ObjectAny) => Action | undefined): any;

export type LazyFactoryType = () => Promise<{ default: ComponentType; [name: string]: any }>;

export declare function lazy(factory: LazyFactoryType, name?: string, loading?: ReactNode, error?: ReactNode): ComponentType;

export type LazyWithStoreFactoryType = () => Promise<{ default: ComponentWithStore; [name: string]: any }>;

export declare function lazyWithStore(factory: LazyWithStoreFactoryType, name?: string): ComponentType;

export declare function createComponentWithStore(component: ComponentType, store: StoreInterface): ComponentWithStore;

export type EffectHandleType = (newValue: any, oldValue: any) => (() => void) | undefined;
type EffectType = (data: { state: ObjectAny; detail: ObjectAny; options: ObjectAny }, dispatch: ReducerDispatch | ComposeDispatch) => [any[], EffectHandleType];

export declare function makeEffect(effect: EffectType): void;

type DepsHandle = (data: { state: ObjectAny }) => any[];
type MemoHandleType = (newValue, oldValue) => any;
type DetailType = { memo: ObjectAny } & ObjectAny;
type MemoValueSetType = (setContainer: { detail: DetailType, options: ObjectAny, value: any }) => void;
type CallbackValueSetType = (setContainer: { detail: DetailType, options: ObjectAny, value: () => any }) => void;

export declare function makeMemo(depsHandle: DepsHandle, computeHandle: MemoHandleType, set: MemoValueSetType, isFactory?: boolean): void;

export declare function makeCallback(depsHandle: DepsHandle, functor: MemoHandleType, set: CallbackValueSetType): void;

export declare function useRouterStore(): any;

export declare function useRouterHooks(): ObjectAny;

export declare function routerNativeHooks(component: ComponentType, useRouterNativeHooksHandle?: () => ObjectAny): ComponentType;

export declare function routerStore(component: ComponentType, useRouterHooksHandle?: () => ObjectAny): ComponentType;

export declare function routerStoreState(component: ComponentType, useRouterHooksHandle?: () => ObjectAny): ComponentType;

export declare function routerStoreReducer(component: ComponentType, reducers?: ObjectAny, useRouterHooksHandle?: () => ObjectAny): ComponentType;

export declare function routerStoreCompose(component: ComponentType, useRouterHooksHandle?: () => ObjectAny): ComponentType;

type ActionType = ObjectAny & {
  type: keyof ReducersType;
};
type ReducerType<S> = ((state: S, action?: ActionType, detail?: ObjectAny, options?: ObjectAny) => S | undefined);
type ReducersType<S = ObjectAny> = {
  [key: string | symbol]: ReducerType<S>;
};
type ActionsType = {
  [P in keyof ReducersType]: (payload: any) => { type: P; payload: any };
};
type RequestArg<S> = {
  to: LocationWithMeta;
  from: LocationWithMeta;
  pathname: string;
  state: S;
  detail: ObjectAny;
  options: ObjectAny;
};
type Request<S> = (data: RequestArg<S>) => S
type SubscribeHandleType<S = ObjectAny> = (data: { state: S; detail?: ObjectAny; options?: ObjectAny }) => void;
type DeleteSubscribeHandle = () => SubscribeHandleType;

export type StoreInterface<S = ObjectAny | null> = ObjectAny & {
  state: S;
  detail: ObjectAny;
  options: ObjectAny;
  reducers: ReducersType<S>;
  actions: ActionsType;
  request: Request<S>;
  dispatch: (action: ActionType) => ActionType;
  subscribe: (handle: SubscribeHandleType<S>) => DeleteSubscribeHandle;
  init: (newState: S) => void;
  dispose: () => void;
  reset: (newState: S) => void;
};

export declare function createRouterStore<S = ObjectAny | null>(request: Request<S>): StoreInterface<S>;
export declare function createRouterStore<S = ObjectAny | null>(storeOptions: ObjectAny & {
  request: Request<S>;
  reducers?: ReducersType<S>;
}): StoreInterface<S>;