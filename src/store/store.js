"use strict";

import {produce} from "immer";

export {
  createRouterStore,
  registerGlobalPlugin,
  baseCreateRouterStore,
  compose,
  applyMiddleware,
};

const init = Symbol();
const reset = Symbol();
const mustTrue = new Set([init, reset]);
const globalPlugins = [];

function createRouterStore(storeOptionsOrRequest) {
  if (typeof storeOptionsOrRequest === "function") {
    return baseCreateRouterStore({request: storeOptionsOrRequest}, applyMiddleware([]));
  }
  const {request, reducers = {}, plugins = [], thunks = [], ...options} = storeOptionsOrRequest;
  return baseCreateRouterStore({request, reducers, plugins, options}, applyMiddleware(thunks));
}

function baseCreateRouterStore({request, reducers = {}, plugins = [], options = {}}, enhancer) {
  if (typeof enhancer === "function") {
    return enhancer(baseCreateRouterStore)({request, reducers, plugins, options});
  }
  let __isDisposed = false;
  let __trigger = null;
  let subscribeList = [];
  const store = {
    state: null,
    detail: {},
    options,
    reducers,
    request,
    get isDisposed() {
      return __isDisposed;
    },
    get trigger() {
      return __trigger;
    }
  };

  store.registerTrigger = trigger => {
    if (typeof trigger === "function") {
      __trigger = trigger;
    }
  };

  store.unRegisterTrigger = () => {
    __trigger = null;
  };

  store.dispatch = action => {
    if (__isDisposed) return;
    let flag = false;
    const {type} = action;
    if (mustTrue.has(type)) {
      flag = true;
    } else {
      const reducer = reducers[type];
      if (reducer) {
        const args = [store.state, action, store.detail, store.options];
        const result = typeof reducer === "function" ?
          produce(reducer).apply(undefined, args) :
          produce(reducer.handle).apply(undefined, args);
        flag = result !== store.state;
        if (flag) store.state = result;
      }
    }
    flag && subscribeList.forEach(item => item({state: store.state, detail: store.detail, options: store.options}));
    return flag;
  };

  store.actions = Object.entries(reducers).reduce((result, [key, value]) => {
    result[key] = (...args) => {
      const arg = typeof value === "function" ? args[0] : value.prepare?.(...args);
      return {type: key, payload: arg};
    }
    return result;
  }, {});

  store.subscribe = handle => {
    if (__isDisposed) return;
    subscribeList.push(handle);
    return () => {
      const index = subscribeList.findIndex(item => item === handle);
      return index >= 0 ? subscribeList.splice(index, 1) : undefined;
    };
  };

  store.init = newState => {
    if (newState === store.state) return;
    if (__isDisposed) {
      __isDisposed = false;
    }
    store.state = newState;
    store.dispatch({type: init});
  };

  store.dispose = () => {
    if (__isDisposed) return;
    __trigger = null;
    __isDisposed = true;
    store.state = null;
    store.detail = {};
    subscribeList = [];
  };

  store.reset = newState => {
    if (__isDisposed || newState === store.state) return;
    store.state = newState;
    store.dispatch({type: reset});
  }

  const pluginReducer = (prevStore, [plugin, arg]) => {
    if (typeof plugin === "function") {
      return plugin(prevStore, arg) ?? store;
    }
    return plugin.install?.(prevStore, arg) ?? store;
  };

  return plugins.reduce(pluginReducer, globalPlugins.reduce(pluginReducer, store));
}

function registerGlobalPlugin(plugin, arg) {
  globalPlugins.push([plugin, arg]);
  return () => {
    const index = globalPlugins.findIndex(item => item[0] === plugin);
    return index >= 0 ? globalPlugins.splice(index, 1) : undefined;
  };
}

function compose(handleList = []) {
  if (handleList.length === 0) {
    return _ => _;
  }
  if (handleList.length === 1) {
    return handleList[0];
  }
  return handleList.reduce((previousValue, currentValue) => {
    return (...args) => previousValue(currentValue(...args));
  })
}

const defaultThunk = dispatch => action => {
  if (typeof action === "function") {
    return action(dispatch);
  }
  return dispatch(action);
};

function applyMiddleware(thunks = []) {
  return factory => arg => {
    const store = factory(arg);
    let __dispatch = store.dispatch;
    const triggerByLastDispatch = action => {
      if (store.trigger) {
        store.trigger([__dispatch, action]);
      } else {
        __dispatch(action);
      }
      return action;
    };
    store.dispatch = compose([defaultThunk, ...thunks])(triggerByLastDispatch);
    return store;
  }
}