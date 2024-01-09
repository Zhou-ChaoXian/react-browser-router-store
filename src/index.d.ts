import type {ReactNode, CSSProperties, ComponentType, ReactElement, ForwardedRef} from "react";
import type {RouteObject, NavigateOptions, RouterProviderProps, NavigateFunction, Location, To} from "react-router-dom";
import type {Router as RemixRouter} from "@remix-run/router";

export interface KeepaliveProps {
  uniqueKey: string;
  max?: number;
  include?: (key: string | undefined) => boolean;
  exclude?: (key: string | undefined) => boolean;
  className?: string;
  style?: Omit<CSSProperties, "display">;
  children: ReactNode;
}

export interface TransitionProps {
  type?: "transition" | "animation" | "animate" | undefined;
  name?: string;
  uniqueKey: string | any;
  className?: string;
  style?: Omit<CSSProperties, "visibility">;
  children: ReactNode;
  enterFromClass?: string;
  enterActiveClass?: string;
  enterToClass?: string;
  leaveFromClass?: string;
  leaveActiveClass?: string;
  leaveToClass?: string;
  onEnter?: (el: HTMLElement) => void;
  onLeave?: (el: HTMLElement, done: () => void) => void;
}

export interface ViewTransitionInterface {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;

  skipTransition(): void;
}

export interface ViewTransitionProps {
  name: string;
  uniqueKey: string | any;
  onViewTransition: (el: HTMLElement, startViewTransition: (cb?: () => Promise<void> | void) => ViewTransitionInterface) => void;
  className?: string;
  style?: Omit<CSSProperties, "visibility">;
  children?: ReactNode;
}

export interface ShowProps {
  resolve: Promise<any> | any;
  loading?: ReactNode;
  error?: (error: any) => ReactNode;
  onStart?: () => void;
  onEnd?: () => void;
  children: (value: any) => ReactNode;
}

interface FunctionComponent<P = ObjectAny> {
  (props: P): Promise<ReactNode> | ReactNode;

  defaultProps?: Partial<P> | undefined;
  displayName?: string | undefined;
}

export type FunctionComponentElement<P = ObjectAny> = { type: FunctionComponent<P>; props: P; key: string | number };

export interface AwaitProps {
  loading?: ReactNode;
  error?: (error: any) => ReactNode;
  complete?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  delay?: number;
  children: FunctionComponentElement;
  compare?: (newProps: ObjectAny, oldProps: ObjectAny) => boolean;
}

export interface AsyncComponentOptions<P = ObjectAny> {
  name?: string;
  loader: (props: P) => Promise<any> | any;
  Component: ComponentType<P>;
  complete?: boolean;
  loading?: ReactNode;
  error?: (error: any) => ReactNode;
  delay?: number;
  compare?: (newProps: P, oldProps: P) => boolean;
}

export interface ShowOrderProps {
  mode?: "forward" | "backward" | "together" | undefined;
  delay?: number;
  children: ReactNode | ReactElement<ShowProps, typeof Show> | (ReactNode | ReactElement<ShowProps, typeof Show>)[];
}

export interface ShowListProps {
  loading?: ReactNode;
  timeout?: number;
  delay?: number;
  onStart?: () => void;
  onEnd?: () => void;
  children: ReactNode | ReactElement<ResolveProp, typeof Resolve> | (ReactNode | ReactElement<ResolveProp, typeof Resolve>)[];
}

export interface ResolveProp {
  resolve: Promise<any> | any;
  error?: (error: any) => ReactNode;
  children: (value: any) => ReactNode;
}

export interface OutletProps {
  context?: any;
}

export interface RouteViewProps {
  name?: string | symbol | undefined | "default";
  children?: ((Component: ComponentType, props?: ObjectAny) => ReactElement) | ReactElement;
}

export declare class TimeoutError extends Error {
}

export declare class ComponentWithStore {
  component: ComponentType;
  store: StoreInterface;
}

type deactivatedHandle = (() => void) | undefined;

export declare function Transition(props: TransitionProps): ReactElement;

export declare function Keepalive(props: KeepaliveProps): ReactElement;

export declare function useActivated(activatedHandle: () => deactivatedHandle): void;

export declare function Show(props: ShowProps): ReactElement;

export declare function Await(props: AwaitProps): ReactElement;

export declare function defineAsyncComponent<P = ObjectAny>(options: AsyncComponentOptions<P>): ComponentType<P & { onStart?: () => void; onEnd?: () => void; }>;

export declare function useAsyncValue(): any;

export declare function ShowOrder(props: ShowOrderProps): ReactElement;

export declare function ShowList(props: ShowListProps): ReactElement;

export declare function Resolve(props: ResolveProp): undefined;

export declare function Outlet(props: OutletProps): ReactElement;

export declare function useOutlet(context?: any): ReactElement;

export declare function useOutletContext(): any;

export declare function RouteView(props: RouteViewProps): ReactElement;

export declare function ViewTransition(props: ViewTransitionProps): ReactElement;

export declare function useViewTransition(ref: ForwardedRef<HTMLElement>): void;

// @ts-ignore
export declare const global = Symbol();
// @ts-ignore
export declare const enhancer = Symbol();
// @ts-ignore
export declare const wrapper = Symbol();
// @ts-ignore
export declare const transition = Symbol();
// @ts-ignore
export declare const keepalive = Symbol();
// @ts-ignore
export declare const store = Symbol();
// @ts-ignore
export declare const start = Symbol();
// @ts-ignore
export declare const guardError = Symbol();
// @ts-ignore
export declare const redirect = Symbol();
// @ts-ignore
export declare const alias = Symbol();
// @ts-ignore
export declare const max = Symbol();
// @ts-ignore
export declare const views = Symbol();

type EnhancerHandle = () => ReactNode;
type Enhancer = (next: EnhancerHandle) => EnhancerHandle;
type Props = { [key: string]: any };
type Wrapper = ComponentType | [ComponentType, Props];
type AliasType = string | string[];
type ObjectAny = { [key: string | symbol]: any };
type ViewsItemType = {
  component: ComponentType;
  children?: ViewsType;
  props?: ObjectAny;
};
type ViewsType = {
  [name: string | symbol]: ViewsItemType;
};

interface BaseMetaInterface {
  [enhancer]: Enhancer[];
  [wrapper]: Wrapper[];
  [transition]: Partial<TransitionProps>;
  [keepalive]: Partial<Omit<KeepaliveProps, "max">>;
  [guardError]: (error: any) => void;
}

export type GlobalOptionsType = Partial<BaseMetaInterface> & { [start]?: ReactNode; [max]?: number } & ObjectAny;
export type MetaInterface =
  Partial<BaseMetaInterface>
  & { [store]?: StoreInterface; [redirect]?: string; [alias]?: AliasType; [global]?: GlobalOptionsType; [views]?: ViewsType; }
  & ObjectAny;

export type Action = ReducerAction | ComposeAction;
export type ReducerAction = ObjectAny & { type: string | undefined };
export type ComposeAction = ObjectAny & { type: SyncReducerHandle | ReducerHandle | undefined };
export type SyncReducerHandle<S = ObjectAny> = (state: S, action?: Action, detail?: ObjectAny, options?: ObjectAny) => S | undefined;
export type AsyncReducerHandle<S = ObjectAny> = (state: S, action?: Action, detail?: ObjectAny, options?: ObjectAny) => Action | undefined | Promise<Action | undefined>;

declare class ReducerHandle {
  reducerHandle: AsyncReducerHandle;
  successAction?: (value: any) => Action;
  failAction?: (error: any) => Action;
}

export type Route = Omit<RouteObject, "Component" | "lazy"> & {
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
export type ReducerDispatch = (action: ReducerAction) => ReducerAction | Promise<ReducerAction>;
export type ComposeDispatch = (action: ComposeAction) => ComposeAction | Promise<ComposeAction>;
export type ReducersObject = { [key: string]: SyncReducerHandle | ReducerHandle; };

export interface Router {
  RouterProvider: ComponentType<Omit<RouterProviderProps, "router"> & { router: Router }>;
  useRouteMeta: MetaInterface;
  useNavigateGuard: () => boolean;
  useRouterStore: () => StoreInterface;
  useRouterStoreState: () => [WrapperStore, SetStore];
  useRouterStoreReducer: (reducers?: ReducersObject | ((store: StoreInterface) => ReducersObject)) => [WrapperStore, ReducerDispatch];
  useRouterStoreCompose: () => [WrapperStore, ComposeDispatch];
  readonly routes: Route[];
  readonly originRouter: RemixRouter;
  globalOptions: GlobalOptionsType;
  beforeEach: (handle: BeforeEachHandle) => DeleteBeforeEachHandle;
  afterEach: (handle: AfterEachHandle) => DeleteAfterEachHandle;
  addRoutes: (newRoutes: Route[]) => Promise<NavigateFunction | undefined>;
  hasRoute: (locationArg: Location | string, basename?: string) => boolean;
}

type Options = { basename?: string };

export declare function createBrowserRouter(routes: Route[], options?: Options, globalOptions?: GlobalOptionsType): Router;

export declare function createHashRouter(routes: Route[], options?: Options, globalOptions?: GlobalOptionsType): Router;

export declare function useRouter(): Router;

export declare function createReducerHandle<S = ObjectAny>(reducer: AsyncReducerHandle<S>): ReducerHandle;

export type LazyFactoryType = () => Promise<{ default: ComponentType; [name: string]: any }>;

export declare function lazy(factory: LazyFactoryType, name?: string, loading?: ReactNode, error?: ReactNode): ComponentType;

export type LazyWithStoreFactoryType = () => Promise<{ default: ComponentWithStore; [name: string]: any }>;

export declare function lazyWithStore(factory: LazyWithStoreFactoryType, name?: string): ComponentType;

export declare function createComponentWithStore(component: ComponentType, store: StoreInterface): ComponentWithStore;

export type EffectHandleType = (newValue?: any, oldValue?: any) => (() => void) | undefined;
type EffectType = (store: WrapperStore, dispatch?: ComposeDispatch) => [any[], EffectHandleType];

export declare function makeEffect(effect: EffectType): void;

type DepsHandle = (store: WrapperStore) => any[];

export declare function makeMemo(depsHandle: DepsHandle, computedHandle: (newValue: any[], oldValue?: any[]) => any): { value: any };

export declare function makeCallback(depsHandle: DepsHandle, functor: (...args: any[]) => any): { value: (...args: any[]) => any };

export declare function useRouterStore(): [WrapperStore, SetStore | ReducerDispatch | ComposeDispatch] | undefined;

export declare function useRouterHooks(): ObjectAny;

type UseRouterHooksHandleType = (router: Router) => ObjectAny;

export declare function routerNative(component: ComponentType, useRouterHooksHandle?: UseRouterHooksHandleType): ComponentType;

export declare function routerStore(component: ComponentType, useRouterHooksHandle?: UseRouterHooksHandleType): ComponentType;

export declare function routerStoreState(component: ComponentType, useRouterHooksHandle?: UseRouterHooksHandleType): ComponentType;

export declare function routerStoreReducer(component: ComponentType, reducers?: ObjectAny, useRouterHooksHandle?: UseRouterHooksHandleType): ComponentType;

export declare function routerStoreCompose(component: ComponentType, useRouterHooksHandle?: UseRouterHooksHandleType): ComponentType;

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
type Request<S> = (requestArg?: RequestArg<S>) => S
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