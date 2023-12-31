"use strict";

import {
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  createBrowserRouter as createBrowserRouter$1,
  createHashRouter as createHashRouter$1,
  RouterProvider as RouterProvider$1,
  matchRoutes,
} from "react-router-dom";
import {produce} from "immer";
import {Context, RouteContext, defaultFunction} from "./context.js";
import {handleRoutes} from "./handleRoutes.js";
import {getEffects} from "../store";

export {
  createBrowserRouter,
  createHashRouter,
  baseCreateBrowserRouter,
  setRouterFactory,
  createReducerHandle,
  useRouter,
};

const routerFactory = {factory: createBrowserRouter$1};
const resolveMicroTask = Promise.resolve();

function setRouterFactory(factory) {
  routerFactory.factory = factory;
}

function createBrowserRouter(routes, options = undefined, globalOptions = {}) {
  setRouterFactory(createBrowserRouter$1);
  return baseCreateBrowserRouter(routes, options, globalOptions);
}

function createHashRouter(routes, options = undefined, globalOptions = {}) {
  setRouterFactory(createHashRouter$1);
  return baseCreateBrowserRouter(routes, options, globalOptions);
}

function baseCreateBrowserRouter(routes, options = undefined, globalOptions = {}, enhancer = undefined) {
  if (typeof enhancer === "function") {
    return enhancer(baseCreateBrowserRouter)(routes, options, globalOptions);
  }
  handleRoutes(routes, globalOptions);
  const {factory} = routerFactory;
  const beforeHandles = [];
  const afterHandles = [];
  let baseRoutes = routes;
  const navigateGuard = {current: {pathname: "", active: false}, subscribes: []};
  let router = factory(baseRoutes, options);

  function useRouteMeta() {
    return useRef(useContext(RouteContext).meta).current;
  }

  function useNavigateGuard() {
    const pathname = useRef(useContext(RouteContext).pathname).current;
    const {current, subscribes} = navigateGuard;
    const change = useCallback(onStoreChange => {
      subscribes.push(onStoreChange);
      return () => {
        const index = subscribes.findIndex(item => item === onStoreChange);
        index >= 0 && subscribes.splice(index, 1);
      };
    }, []);
    return useSyncExternalStore(change, () => current.active && current.pathname === pathname);
  }

  function useRouterStore() {
    const store = useRef(useContext(RouteContext).store).current;
    if (!store) throw new Error("not find router store.");
    const listener = useRef(null);
    const change = useCallback(onStoreChange => {
      listener.current = onStoreChange;
      return () => {
        listener.current = null;
        store.unRegisterTrigger();
      };
    }, []);
    useSyncExternalStore(change, () => store.state);
    if (!store.trigger) {
      store.registerTrigger(([dispatch, action]) => {
        if (dispatch(action)) listener.current?.();
      });
    }
    return store;
  }

  function useRouterStoreState() {
    const store = useRouterStore();
    const {state, detail, options, reset} = store;
    const setStore = useCallback(function setStore(handle) {
      typeof handle === "function" && reset(produce(handle)(store.state, detail, options));
    }, []);
    return [{state, detail, options}, setStore];
  }

  function useRouterStoreStatePro__base(store, getHandle) {
    const {state, detail, options, reset} = store;
    const dispatch = useCallback(function dispatch(action) {
      if (typeof action === "function")
        return action(dispatch);
      const handle = getHandle(action);
      if (typeof handle === "function") {
        reset(produce(handle)(store.state, action, detail, options));
        return action;
      } else if (handle instanceof ReducerHandle) {
        return Promise.resolve(handle.reducerHandle(store.state, action, detail, options))
          .then(value => dispatch(handle.successAction(value)))
          .catch(error => dispatch(handle.failAction(error)));
      } else {
        return action;
      }
    }, []);
    return [{state, detail, options}, dispatch];
  }

  function useRouterStoreStatePro__effect(store, wrapperStore, dispatch) {
    const wrapperDispatch = useCallback(action => {
      if (typeof action === "function") return action(wrapperDispatch);
      resolveMicroTask.then(() => dispatch(action));
      return action;
    }, [dispatch]);
    const oldDepsWithDispose = useRef(null);
    const effects = useRef(null), recover = useRef(null);
    useEffect(() => () => {
      oldDepsWithDispose.current?.forEach(([_, dispose]) => typeof dispose === "function" && dispose());
      recover.current?.();
    }, []);
    if (effects.current === null)
      [effects.current, recover.current] = getEffects(store);
    if (effects.current.length === 0) return;
    const newDepsWithHandle = effects.current.map(effect => effect(wrapperStore, wrapperDispatch));
    if (oldDepsWithDispose.current === null) {
      oldDepsWithDispose.current = newDepsWithHandle.map(([deps, handle]) => [deps, handle(deps)]);
    } else {
      oldDepsWithDispose.current.forEach(([oldDeps, dispose], index) => {
        if (oldDeps.length === 0) return;
        const [deps, handle] = newDepsWithHandle[index];
        if (oldDeps.some((item, i) => item !== deps[i])) {
          if (typeof dispose === "function") dispose();
          const oldCurrent = oldDepsWithDispose.current[index];
          oldCurrent[0] = deps;
          oldCurrent[1] = handle(deps, oldDeps);
        }
      });
    }
  }

  function useRouterStoreReducer(reducersOrFactory = {}) {
    const store = useRouterStore();
    const [reducers] = useState(() => typeof reducersOrFactory === "function" ?
      reducersOrFactory(store) :
      reducersOrFactory
    );
    return useRouterStoreStatePro__base(store, action => reducers[action?.type]);
  }

  function useRouterStoreCompose() {
    const store = useRouterStore();
    const [wrapperStore, dispatch] = useRouterStoreStatePro__base(store, action => action?.type);
    useRouterStoreStatePro__effect(store, wrapperStore, dispatch);
    return [wrapperStore, dispatch];
  }

  let listener = null;
  let addRoutesResolve = null;

  function setListener(onStoreChange) {
    listener = onStoreChange;
    return () => listener = null;
  }

  function RouterProvider({router: __router, fallbackElement, future}) {
    const realRouter = useSyncExternalStore(setListener, () => router);
    useEffect(() => {
      if (addRoutesResolve === null) return;
      addRoutesResolve(realRouter.navigate);
      addRoutesResolve = null;
    }, [realRouter]);
    const value = {
      handles: [beforeHandles, afterHandles],
      router: realRouter,
      globalOptions,
      handleNavigateGuard: (pathname, isActive) => {
        navigateGuard.current.pathname = pathname;
        navigateGuard.current.active = isActive;
        navigateGuard.subscribes.forEach(item => item());
      },
      __router,
    };
    return createElement(Context.Provider, {value}, createElement(RouterProvider$1, {
      router: realRouter,
      fallbackElement,
      future,
    }));
  }

  function add(array, handle) {
    array.push(handle);
    return () => array.splice(array.findIndex(item => item === handle), 1);
  }

  return {
    RouterProvider,
    useRouteMeta,
    useNavigateGuard,
    useRouterStore,
    useRouterStoreState,
    useRouterStoreReducer,
    useRouterStoreCompose,
    globalOptions,
    get routes() {
      return baseRoutes;
    },
    get originRouter() {
      return router;
    },
    beforeEach: (handle) => {
      return add(beforeHandles, handle);
    },
    afterEach: (handle) => {
      return add(afterHandles, handle);
    },
    addRoutes: (newRoutes) => {
      return new Promise(resolve => {
        baseRoutes = newRoutes;
        handleRoutes(baseRoutes, globalOptions);
        router.dispose();
        router = factory(baseRoutes, options);
        listener?.();
        addRoutesResolve = resolve;
      });
    },
    hasRoute: (locationArg, basename = "/") => {
      const matches = matchRoutes(router.routes, locationArg, basename);
      return matches !== null && matches[0].params["*"] === undefined;
    },
  };
}

function useRouter() {
  return useContext(Context)["__router"];
}

class ReducerHandle {
  constructor(reducerHandle, successAction, failAction) {
    this.reducerHandle = reducerHandle;
    this.successAction = successAction;
    this.failAction = failAction;
  }
}

function createReducerHandle(reducerHandle, successAction = defaultFunction, failAction = defaultFunction) {
  return new ReducerHandle(reducerHandle, successAction, failAction);
}