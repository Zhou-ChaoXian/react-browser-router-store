"use strict";

import {
  createElement,
  createContext,
  useRef,
  useState,
  useLayoutEffect,
  useContext,
} from "react";
import {useRouter} from "./browserRouter.js";

export {
  routerNative,
  routerStore,
  routerStoreState,
  routerStoreReducer,
  routerStoreCompose,
  useRouterStore,
  useRouterHooks,
};

const Context = createContext(null);
const defaultUseRouterHooksHandle = (_) => ({});

function useRouterStore() {
  return useContext(Context).storeInfo;
}

function useRouterHooks() {
  return useContext(Context).routerHooks;
}

function routerNative(component, useRouterHooksHandle = defaultUseRouterHooksHandle) {
  return function RouterNative() {
    const routerHooks = useRouterHooksHandle(useRouter());
    return useState(() => generateElement(component, undefined, routerHooks))[0];
  }
}

function routerStore(component, useRouterHooksHandle = defaultUseRouterHooksHandle) {
  return function RouterStore() {
    const router = useRouter();
    const store = router.useRouterStore();
    return useHook(component, store, store.state, router, useRouterHooksHandle);
  }
}

function routerStoreState(component, useRouterHooksHandle = defaultUseRouterHooksHandle) {
  return function RouterStoreState() {
    const router = useRouter();
    const storeState = router.useRouterStoreState();
    return useHook(component, storeState, storeState[0].state, router, useRouterHooksHandle);
  }
}

function routerStoreReducer(component, reducers = {}, useRouterHooksHandle = defaultUseRouterHooksHandle) {
  return function RouterStoreReducer() {
    const router = useRouter();
    const storeReducer = router.useRouterStoreReducer(reducers);
    return useHook(component, storeReducer, storeReducer[0].state, router, useRouterHooksHandle);
  }
}

function routerStoreCompose(component, useRouterHooksHandle = defaultUseRouterHooksHandle) {
  return function RouterStoreCompose() {
    const router = useRouter();
    const storeCompose = router.useRouterStoreCompose();
    return useHook(component, storeCompose, storeCompose[0].state, router, useRouterHooksHandle);
  }
}

function generateElement(component, storeInfo, routerHooks) {
  return createElement(Context.Provider, {value: {storeInfo, routerHooks}}, createElement(component));
}

function useHook(component, storeInfo, state, router, useRouterHooksHandle) {
  const routerHooks = useRouterHooksHandle(router);
  const [element, setElement] = useState(() => generateElement(component, storeInfo, routerHooks));
  const isFirst = useRef(true);
  useLayoutEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
    } else {
      setElement(generateElement(component, storeInfo, routerHooks));
    }
  }, [state]);
  return element;
}