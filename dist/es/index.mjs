import { produce } from 'immer';
import { useState, useMemo, useRef, useLayoutEffect, createElement, createContext, cloneElement, isValidElement, Fragment, useContext, Suspense, useEffect, Component, useCallback, useSyncExternalStore } from 'react';
import { useNavigate, useParams, useLocation, generatePath, Await, matchRoutes, RouterProvider, createBrowserRouter as createBrowserRouter$1, createHashRouter as createHashRouter$1 } from 'react-router-dom';

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
    };
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
  };

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

const requestBeforeHandles = Symbol();
const requestAfterHandles = Symbol();
const requestErrorHandles = Symbol();
const routerStoreRequestHookPlugin = {
  name: "routerStoreRequestHookPlugin",
  install: store => {
    Object.defineProperties(store.detail, {
      [requestBeforeHandles]: {value: []},
      [requestAfterHandles]: {value: []},
      [requestErrorHandles]: {value: []},
    });
  }
};

function getRequestBeforeHandles(store) {
  return Reflect.get(store.detail, requestBeforeHandles);
}

function getRequestAfterHandles(store) {
  return Reflect.get(store.detail, requestAfterHandles);
}

function getRequestErrorHandles(store) {
  return Reflect.get(store.detail, requestErrorHandles);
}

const effects = Symbol("effects");
const routerStoreEffects = [];
const routerStoreEffectPlugin = {
  name: "routerStoreEffectPlugin",
  install: store => {
    Object.defineProperties(store.detail, {
      [effects]: {value: []},
      memo: {value: {}},
    });
    store.detail[requestBeforeHandles].push(() => {
      if (routerStoreEffects.length > 0) {
        routerStoreEffects.splice(0);
      }
    });
    store.detail[requestAfterHandles].push(() => {
      if (routerStoreEffects.length > 0 && store.detail[effects].length === 0) {
        store.detail[effects].push(...routerStoreEffects.splice(0));
      }
    });
  }
};

function addEffect(effect) {
  routerStoreEffects.push(effect);
}

function getEffects(store) {
  return Reflect.get(store.detail, effects);
}

/**
 * @param type {"transition" | "animation"}
 * @param name {string}
 * @param uniqueKey {string | any}
 * @param disabled {boolean}
 * @param __className {string}
 * @param style {React.CSSProperties}
 * @param enterFromClass {string}
 * @param enterActiveClass {string}
 * @param enterToClass {string}
 * @param leaveFromClass {string}
 * @param leaveActiveClass {string}
 * @param leaveToClass {string}
 * @param children {React.ReactNode}
 * @return {React.ReactElement}
 */
function Transition(
  {
    type,
    name = "v",
    uniqueKey,
    disabled = true,
    className: __className,
    style = {height: "100%"},
    enterFromClass,
    enterActiveClass,
    enterToClass,
    leaveFromClass,
    leaveActiveClass,
    leaveToClass,
    children
  }
) {
  const [el, setEl] = useState(children);
  const className = useMemo(() => ({
    enterFromClass: enterFromClass ?? `${name}-enter-from`,
    enterActiveClass: enterActiveClass ?? `${name}-enter-active`,
    enterToClass: enterToClass ?? `${name}-enter-to`,
    leaveFromClass: leaveFromClass ?? `${name}-leave-from`,
    leaveActiveClass: leaveActiveClass ?? `${name}-leave-active`,
    leaveToClass: leaveToClass ?? `${name}-leave-to`,
  }), [uniqueKey, enterFromClass, enterActiveClass, enterToClass, leaveFromClass, leaveActiveClass, leaveToClass]);
  const div = useRef();
  const flag = useRef(false);
  useLayoutEffect(() => {
    if (disabled) {
      if (!flag.current) {
        flag.current = true;
      }
      setEl(children);
      return;
    }
    const isFinished = {current: true};
    switch (type) {
      case "transition": {
        if (!flag.current) {
          flag.current = true;
          firstTransitionFrame(div.current, className, isFinished);
        } else {
          noFirstTransitionFrame(div.current, className, isFinished, () => setEl(children));
        }
        return;
      }
      case "animation": {
        if (!flag.current) {
          flag.current = true;
          firstAnimationFrame(div.current, className, isFinished);
        } else {
          noFirstAnimationFrame(div.current, className, isFinished, () => setEl(children));
        }
        return;
      }
      default: {
        if (!flag.current) {
          flag.current = true;
        }
        setEl(children);
      }
    }
    return () => {
      isFinished.current = true;
    };
  }, [uniqueKey]);
  return createElement(
    "div",
    {ref: div, className: __className, style, children: el, "data-type": "Transition"}
  );
}

function animationFrame(handle) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      handle();
    });
  });
}

function firstTransitionFrame(root, className, isFinished) {
  if (!isFinished.current) return;
  isFinished.current = false;
  const {enterFromClass, enterActiveClass, enterToClass} = className;
  root.classList.add(enterFromClass, enterActiveClass);
  animationFrame(() => {
    root.classList.remove(enterFromClass);
    root.classList.add(enterToClass);
    root.addEventListener("transitionend", function () {
      root.classList.remove(enterActiveClass);
      isFinished.current = true;
    }, {once: true});
  });
}

function noFirstTransitionFrame(root, className, isFinished, handle) {
  if (!isFinished.current) return;
  isFinished.current = false;
  const {enterToClass, leaveFromClass, leaveActiveClass, leaveToClass} = className;
  root.classList.remove(enterToClass);
  root.classList.add(leaveFromClass, leaveActiveClass);
  animationFrame(() => {
    root.classList.remove(leaveFromClass);
    root.classList.add(leaveToClass);
    root.addEventListener("transitionend", function () {
      root.classList.remove(leaveActiveClass, leaveToClass);
      if (isFinished.current) return;
      handle();
      isFinished.current = true;
      firstTransitionFrame(root, className, isFinished);
    }, {once: true});
  });
}

function firstAnimationFrame(root, className, isFinished) {
  if (!isFinished.current) return;
  isFinished.current = false;
  const {enterActiveClass} = className;
  root.style.display = "";
  root.classList.add(enterActiveClass);
  root.addEventListener("animationend", function () {
    root.classList.remove(enterActiveClass);
    isFinished.current = true;
  }, {once: true});
}

function noFirstAnimationFrame(root, className, isFinished, handle) {
  if (!isFinished.current) return;
  isFinished.current = false;
  const {leaveActiveClass} = className;
  root.classList.add(leaveActiveClass);
  root.addEventListener("animationend", function () {
    root.style.display = "none";
    root.classList.remove(leaveActiveClass);
    if (isFinished.current) return;
    handle();
    isFinished.current = true;
    animationFrame(() => {
      firstAnimationFrame(root, className, isFinished);
    });
  }, {once: true});
}

const Context$2 = createContext(false);

/**
 * @param uniqueKey {string | any}
 * @param max {number}
 * @param include {(key: string | any) => boolean}
 * @param exclude {(key: string | any) => boolean}
 * @param style {Omit<React.CSSProperties, "display">}
 * @param children {React.ReactNode}
 * @return {React.ReactElement[]}
 */
function Keepalive(
  {
    uniqueKey,
    max = 10,
    include = noCache,
    exclude = noCache,
    style = {height: "100%"},
    children
  }
) {
  const sortedKeysList = useRef(new List()).current;
  const map = useRef(new Map()).current;
  const activeKey = useRef(uniqueKey);
  const isCache = useRef(true);
  if (!isCache.current) {
    const {node} = map.get(activeKey.current);
    map.delete(activeKey.current);
    sortedKeysList.deleteItem(node);
    isCache.current = true;
  }
  if (map.has(uniqueKey)) {
    const data = map.get(uniqueKey);
    data.element = cloneElement(data.element);
    data.isActive = true;
    sortedKeysList.pushLast(data.node);
  } else {
    const node = sortedKeysList.addItem(uniqueKey);
    const element = isValidElement(children) ? children : createElement(Fragment, null, children);
    map.set(uniqueKey, {element, isActive: true, node});
    if (max > 0 && sortedKeysList.length > max) {
      for (const i of sortedKeysList.iteratorCount(sortedKeysList.length - max)) {
        sortedKeysList.deleteItem(i);
        map.delete(i.item);
      }
    }
  }
  if (uniqueKey !== activeKey.current) {
    const data = map.get(activeKey.current);
    if (data) {
      data.element = cloneElement(data.element);
      data.isActive = false;
    }
  }
  activeKey.current = uniqueKey;
  if (!include(uniqueKey) || exclude(uniqueKey)) {
    isCache.current = false;
  }
  return [...sortedKeysList].map(({item: key}) => {
    const {element, isActive} = map.get(key);
    return createElement(
      "div",
      {key, style: {...style, display: isActive ? undefined : "none"}, "data-type": "Keepalive"},
      createElement(Context$2.Provider, {value: isActive}, element)
    );
  });
}

function useActivated(activatedHandle) {
  const isActive = useContext(Context$2);
  const deactivatedHandle = useRef(null);
  useLayoutEffect(() => {
    if (isActive) {
      const d = activatedHandle();
      if (typeof d === "function")
        deactivatedHandle.current = d;
    }
  }, [isActive]);
  useLayoutEffect(() => {
    if (!isActive) {
      if (deactivatedHandle.current) {
        deactivatedHandle.current?.();
        deactivatedHandle.current = null;
      }
    }
  }, [isActive]);
  useLayoutEffect(() => () => {
    if (deactivatedHandle.current)
      deactivatedHandle.current?.();
  }, []);
}

function noCache() {
  return false;
}

class List {
  #first = null;
  #last = null;
  #length = 0;

  #createNode(item) {
    return {item, before: null, after: null};
  }

  addItem(item) {
    const node = this.#createNode(item);
    if (!this.#first) {
      this.#first = node;
    } else {
      if (!this.#last) {
        node.before = this.#first;
        this.#first.after = node;
      } else {
        node.before = this.#last;
        this.#last.after = node;
      }
      this.#last = node;
    }
    this.#length += 1;
    return node;
  }

  deleteItem(node) {
    if (this.#length === 0) return;
    this.#length -= 1;
    if (this.#length === 0) {
      this.#first = null;
      return;
    }
    if (node === this.#first) {
      this.#first = this.#first.after;
      this.#first.before = null;
      if (this.#length === 1)
        this.#last = null;
      return;
    }
    if (node === this.#last) {
      this.#last = this.#last.before;
      this.#last.after = null;
      if (this.#length === 1)
        this.#last = null;
      return;
    }
    const {before, after} = node;
    before.after = after;
    after.before = before;
  }

  get length() {
    return this.#length;
  }

  * [Symbol.iterator]() {
    let i = 0;
    let node = this.#first;
    while (i < this.#length) {
      yield node;
      node = node.after;
      i += 1;
    }
  }

  pushLast(node) {
    if (this.#length < 2 || node === this.#last) return;
    if (node === this.#first) {
      this.#first = node.after;
      this.#first.before = null;
    } else {
      node.before.after = node.after;
      node.after.before = node.before;
    }
    this.#last.after = node;
    node.before = this.#last;
    node.after = null;
    this.#last = node;
  }

  * iteratorCount(count) {
    const c = count > this.#length ? this.#length : count;
    let i = 0;
    let node = this.#first;
    while (i < c) {
      yield node;
      node = node.after;
      i += 1;
    }
  }
}

/**
 * @param path {string}
 * @param options {import("react-router-dom").NavigateOptions | undefined}
 * @param children {React.ReactNode}
 * @return {React.ReactNode}
 */
function Redirect({path, options, children}) {
  const navigate = useNavigate();
  const params = useParams();
  const {search, hash} = useLocation();
  const pathname = generatePath(path, params);
  useLayoutEffect(() => {
    navigate({pathname, search, hash}, options);
  }, []);
  return children;
}

const Nop = Symbol();
const NotResult = Symbol();
const _tracked = Symbol();
const _data = Symbol();
const _error = Symbol();

/**
 * @param resolve {Promise | any}
 * @param loading {React.ReactNode}
 * @param error {React.ReactNode | ((error: any) => React.ReactNode)}
 * @param onStart {() => any}
 * @param onEnd {() => any}
 * @param children {(value: any) => React.ReactNode}
 * @return {React.ReactElement}
 */
function Show({resolve, loading = false, error = (_) => false, onStart, onEnd, children}) {
  useLayoutEffect(() => {
    onStart?.();
  });
  return createElement(ErrorBoundary, {fallback: error},
    createElement(Suspense, {fallback: loading}, createElement(ResolveInner, {resolve, children, onEnd}))
  );
}

/**
 * @param loading {React.ReactNode}
 * @param timeout {number}
 * @param delay {number}
 * @param onStart {() => any}
 * @param onEnd {() => any}
 * @param children {React.ReactNode | Resolve | (React.ReactNode | Resolve)[]}
 * @return {React.ReactElement}
 */
function ShowList({loading = false, timeout = 0, delay = 300, onStart, onEnd, children}) {
  useLayoutEffect(() => {
    onStart?.();
  });
  if (!Array.isArray(children))
    children = [children];
  const timeoutArrayValue = Array(children.length).fill(Nop);
  const flag = timeout > 0;
  let hasPromise = false;
  const setValue = (index, value) => {
    flag && (timeoutArrayValue[index] = value);
    return value;
  };
  let tasks = children.map((child, index) => {
    if (child?.type !== Resolve) return setValue(index, setResolveValue(NotResult));
    const value = child.props.resolve;
    if (!(value instanceof Promise)) return setValue(index, setResolveValue(value));
    if (Reflect.has(value, _tracked)) {
      if (Reflect.has(value, _error)) return setValue(index, setRejectReason(Reflect.get(value, _error)));
      return setValue(index, setResolveValue(Reflect.get(value, _data)));
    }
    hasPromise = true;
    const promise = trackedPromise(value);
    return flag ? promise.then(v => {
      timeoutArrayValue[index] = setResolveValue(v);
      return v;
    }, e => {
      timeoutArrayValue[index] = setRejectReason(e);
      throw e;
    }) : promise;
  });
  if (hasPromise) {
    tasks = Promise.allSettled(tasks.map(item => {
      if (item instanceof Promise) return item;
      return item.status === "fulfilled" ? item.value : Promise.reject(item.reason);
    })).then(v => sleep(delay, v));
  }
  let resolve = tasks;
  if (flag) {
    const timeoutTask = sleep(timeout + delay, timeoutArrayValue)
      .then(v => v.map(item => item === Nop ? setRejectReason(new TimeoutError()) : item));
    resolve = Promise.race([hasPromise ? tasks : sleep(delay, tasks), timeoutTask]);
  }
  const handle = values => {
    const result = values.map(({status, value, reason}, index) => {
      if (value === NotResult) return children[index];
      if (status === "fulfilled") {
        return children[index].props.children(value);
      } else {
        const {error} = children[index].props;
        return typeof error === "function" ? error(reason) : error;
      }
    });
    return createElement(Fragment, null, ...result);
  };
  return createElement(Suspense, {fallback: loading}, createElement(ResolveInner, {resolve, children: handle, onEnd}));
}

/**
 * @param resolve {Promise | any}
 * @param error {React.ReactNode | ((error: any) => React.ReactNode)}
 * @param children {(value: any) => React.ReactNode}
 */
function Resolve({resolve, error = (_) => false, children}) {
}

function ResolveInner({resolve, children, onEnd}) {
  const value = use(resolve);
  useEffect(() => {
    onEnd?.();
  });
  return children(value);
}

class TimeoutError extends Error {
  constructor() {
    super("timeout.");
  }
}

function setResolveValue(value) {
  return {status: "fulfilled", value};
}

function setRejectReason(reason) {
  return {status: "rejected", reason};
}

function sleep(delay, value) {
  return new Promise(resolve => setTimeout(resolve, delay, value));
}

function trackedPromise(promise) {
  return promise.then(
    v => Object.defineProperty(promise, _data, {value: v}),
    e => Object.defineProperty(promise, _error, {value: e})
  ).finally(
    () => Object.defineProperty(promise, _tracked, {value: true})
  );
}

function use(promise) {
  if (!(promise instanceof Promise)) {
    return promise;
  }
  if (Reflect.has(promise, _tracked)) {
    if (Reflect.has(promise, _error))
      throw Error(Reflect.get(promise, _error));
    return Reflect.get(promise, _data);
  } else {
    throw trackedPromise(promise);
  }
}

class ErrorBoundary extends Component {
  state = {error: null};

  static getDerivedStateFromError(error) {
    return {error};
  }

  render() {
    const {error} = this.state;
    if (error === null) {
      return this.props.children;
    } else {
      this.state.error = null;
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(error.message);
      }
      return this.props.fallback;
    }
  }
}

const Context$1 = createContext(null);
const RouteContext = createContext(null);
const defaultFunction = (_ => _);
const judgeUseKeepalive = {flag: true};
const isUseKeepAlive = Symbol();

const tag = Symbol();

function lazy(factory, name = undefined, loading = false, error = false) {
  let component = null;

  return function LazyComponent(props) {
    let resolve;
    if (component === null) {
      resolve = factory().catch(error => {
        throw error;
      });
    } else {
      resolve = component;
    }
    return createElement(Suspense, {fallback: loading},
      createElement(Await, {resolve, errorElement: error}, module => {
        if (component === null) {
          component = name ? (module[name] ?? module.default) : module.default;
        }
        return createElement(component, props);
      })
    );
  }
}

function lazyWithStore(factory, name = undefined) {
  return Object.defineProperties(function LazyComponentWithStore(props) {
    return createElement(Reflect.get(LazyComponentWithStore, "component"), props);
  }, {
    displayName: {value: "LazyComponentWithStore"},
    tag: {value: tag},
    factory: {
      value: name ?
        () => factory().then(module => ({default: module[name] ?? module.default})) :
        factory
    },
    component: {value: null, writable: true},
    storeState: {value: null, writable: true},
  });
}

function isLazyComponentWithStore(component) {
  return Reflect.get(component, "tag") === tag;
}

class StoreState {
  constructor(factory) {
    this.factory = factory;
    this.store = null;
    this.error = null;
  }
}

class ComponentWithStore {
  constructor(component, store) {
    this.component = component;
    this.store = store;
  }
}

function createComponentWithStore(component, store) {
  return new ComponentWithStore(component, store);
}

const enhancer = Symbol("enhancer");
const wrapper = Symbol("wrapper");
const transition = Symbol("transition");
const keepalive = Symbol("keepalive");
const store = Symbol("store");
const start = Symbol("start");
const guardError = Symbol("guardError");
const redirect = Symbol("redirect");
const alias = Symbol("alias");
const enhancerFactory = Symbol();
const max = Symbol("max");

function handleRoutes(routes, globalOptions) {
  const extraRoutesHandles = [];
  routes.forEach(item => {
    const meta = item.meta ?? {};
    if (item.path !== undefined) {
      if (meta[redirect]) {
        handleRouteMetaRedirect(item);
      } else {
        if (judgeUseKeepalive.flag && meta[store]) {
          judgeUseKeepalive.flag = false;
        }
        const wrapperList = meta[wrapper] ?? globalOptions[wrapper] ?? [];
        let element;
        if (item.element) {
          element = item.element;
        } else if (item.component) {
          element = handleRouteComponent(item);
        } else {
          element = undefined;
        }
        item.element = createElement(Route, {route: composeComponent(wrapperList)(element)});
        if (meta[alias]) {
          handleRouteMetaAlias(item, extraRoutesHandles);
        }
      }
    }
    if ((item.children ?? []).length > 0) {
      handleRoutes(item.children, globalOptions);
    }
  });
  routes.push(...extraRoutesHandles.map(handle => handle()).flat());
}

function composeComponent(componentWithPropsList) {
  const reverse = [...componentWithPropsList].reverse();
  return element => reverse.reduce((prev, current) => {
    let component, props = null;
    if (Array.isArray(current)) {
      [component, props = null] = current;
    } else {
      component = current;
    }
    return createElement(component, props, prev);
  }, element);
}

function handleRouteComponent(item) {
  let element;
  const {component} = item;
  if (component instanceof ComponentWithStore) {
    judgeUseKeepalive.flag = false;
    element = createElement(component.component);
    item.meta ??= {};
    item.meta[store] = component.store;
  } else if (isLazyComponentWithStore(component)) {
    judgeUseKeepalive.flag = false;
    item.meta ??= {};
    const storeState =
      Reflect.get(component, "storeState") ??
      new StoreState(() => Reflect.get(component, "factory")().then(module => {
        component.component = module.default.component;
        component.storeState = storeState;
        return storeState.store = module.default.store;
      }, error => {
        storeState.error = error;
        throw error;
      }));
    item.meta[store] = storeState;
    element = createElement(component);
  } else {
    element = createElement(component);
  }
  return element;
}

function handleRouteMetaRedirect(route) {
  const redirectInfo = route.meta[redirect];
  let path, options = {}, children;
  if (typeof redirectInfo === "string") {
    path = redirectInfo;
  } else {
    ({path, options, children} = redirectInfo);
  }
  route.element = createElement(Route, {route: createElement(Redirect, {path, options, children})});
}

function handleRouteMetaAlias(route, extraRoutesHandles) {
  let aliasInfo = route.meta[alias];
  if (typeof aliasInfo === "string") {
    aliasInfo = [aliasInfo];
  }
  if (aliasInfo.length === 0) return;
  extraRoutesHandles.push(() => aliasInfo.map(path => {
    const newRoute = {...route, meta: {...route.meta}, path};
    delete newRoute.meta[alias];
    return newRoute;
  }));
}

class Next extends Error {
  constructor(to, options) {
    super("jump.");
    this.to = to;
    this.options = options;
  }
}

class Stop extends Error {
  constructor() {
    super("stop navigate.");
  }
}

class Cancel extends Error {
  constructor() {
    super("cancel navigate.");
  }
}

class NotNeed extends Error {
}

const navigateGuard = {
  next(to, options) {
    throw new Next(to, options);
  },
  stop() {
    throw new Stop();
  }
};

function Route({route}) {
  const {handles: [before, after], router, globalOptions, handleNavigateGuard} = useContext(Context$1);
  const matches = router.state.matches;
  const match = matches[matches.findIndex(item => item.route.element.props.route === route)];
  const {pathname} = match, {meta = {}} = match.route;
  if (!meta[enhancerFactory]) {
    meta[enhancerFactory] = compose(meta[enhancer] ?? globalOptions[enhancer] ?? []);
    match.route.meta = meta;
  }
  const [element, setElement] = useState(() => globalOptions[start]);
  const routeRef = useRef();
  const to = useLocation(), from = useRef(to), fromPro = useRef(to);
  to.pathname === pathname && (to.meta ??= meta);
  const navigate = useNavigate();
  const resolveValue = useRef();
  const [isUseKeepaliveFlag] = useState(() => globalOptions[isUseKeepAlive]);
  useLayoutEffect(() => {
    let flag = true;
    handleNavigateGuard(from.current.pathname, true);
    before.reduce(
      (prev, current) => prev.then(v => Promise.resolve(current(to, from.current, navigateGuard, v, pathname))),
      Promise.resolve()
    ).then(value => {
      resolveValue.current = value;
      return route;
    }, error => {
      if (error instanceof Next) {
        navigate(error.to, error.options);
        throw error;
      }
      if (error instanceof Stop) {
        navigate(-1);
        throw error;
      }
      throw error;
    }).then(route => {
      if (!flag) throw new Cancel();
      if (route === routeRef.current) throw new NotNeed();
      const routerStore = meta[store];
      if (!routerStore) return [route];
      let promise;
      if (routerStore instanceof StoreState) {
        if (routerStore.error !== null) throw routerStore.error;
        promise = routerStore.store === null ?
          routerStore.factory().then(defaultFunction) :
          Promise.resolve(routerStore.store);
      } else {
        promise = Promise.resolve(routerStore);
      }
      return promise.then(routerStore => {
        const {state, detail, options} = routerStore;
        const arg = {to, from: from.current, pathname, state, detail, options};
        getRequestBeforeHandles(routerStore).forEach(handle => handle(arg));
        return Promise.resolve(routerStore.request(arg)).then(value => {
          routerStore.init(value);
          getRequestAfterHandles(routerStore).forEach(handle => handle(value));
          return [route, routerStore];
        }, error => {
          getRequestErrorHandles(routerStore).forEach(handle => handle(error));
          throw error;
        });
      });
    }).then(([route, store]) => {
      if (!flag) throw new Cancel();
      const uniqueKey = pathname;
      const keepAliveProps = {
        ...(meta[keepalive] ?? globalOptions[keepalive] ?? {}),
        max: globalOptions[max],
        uniqueKey
      };
      if (!isUseKeepaliveFlag) keepAliveProps.include = noCache;
      const nextElement = createElement(RouteContext.Provider, {value: {pathname, store, meta}}, createElement(
        Transition, {...(meta[transition] ?? globalOptions[transition] ?? {}), uniqueKey},
        createElement(Keepalive, keepAliveProps, meta[enhancerFactory](() => route)({to, from: from.current, pathname}))
      ));
      setElement(nextElement);
      from.current = to;
      routeRef.current = route;
    }).catch(error => {
      if (error instanceof NotNeed) {
        flag = false;
        return;
      }
      throw error;
    }).finally(() => {
      handleNavigateGuard(fromPro.current.pathname, false);
      fromPro.current = from.current;
    }).then(() => {
      if (!flag) return;
      const value = resolveValue.current;
      resolveValue.current = null;
      return after.reduce(
        (prev, current) => prev.then(v => Promise.resolve(current(to, from.current, v, pathname))),
        Promise.resolve(value)
      );
    }).catch((meta[guardError] ?? globalOptions[guardError] ?? defaultFunction));
    return () => {
      flag = false;
    };
  }, [to.pathname, to.search, to.hash, pathname]);
  return element;
}

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
  wrapperHandleRoutes(routes);
  const {factory} = routerFactory;
  const beforeHandles = [];
  const afterHandles = [];
  let baseRoutes = routes;
  const navigateGuard = {current: {pathname: "", active: false}, subscribes: []};
  let router = factory(baseRoutes, options);

  function wrapperHandleRoutes(routes) {
    judgeUseKeepalive.flag = true;
    handleRoutes(routes, globalOptions);
    Object.defineProperty(globalOptions, isUseKeepAlive, {value: judgeUseKeepalive.flag, writable: true});
    judgeUseKeepalive.flag = true;
  }

  function useRoutes() {
    return baseRoutes;
  }

  function useGlobalOptions() {
    return globalOptions;
  }

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
    const wrapperStore = {state, detail, options};
    useRouterStoreStatePro__effect(store, wrapperStore, dispatch);
    return [wrapperStore, dispatch];
  }

  function useRouterStoreStatePro__effect(store, wrapperStore, dispatch) {
    const wrapperDispatch = useCallback(action => {
      if (typeof action === "function") return action(wrapperDispatch);
      resolveMicroTask.then(() => dispatch(action));
      return action;
    }, [dispatch]);
    const oldDepsWithDispose = useRef(null);
    useEffect(() => () => {
      if (oldDepsWithDispose.current) {
        oldDepsWithDispose.current.forEach(([_, dispose]) => dispose && dispose());
      }
    }, []);
    const effects = getEffects(store);
    if (effects.length === 0) return;
    const newDepsWithHandle = effects.map(effect => effect(wrapperStore, wrapperDispatch));
    if (oldDepsWithDispose.current === null) {
      oldDepsWithDispose.current = newDepsWithHandle.map(([deps, handle]) => [deps, handle(deps)]);
    } else {
      oldDepsWithDispose.current.forEach(([oldDeps, dispose], index) => {
        if (oldDeps.length === 0) return;
        const [deps, handle] = newDepsWithHandle[index];
        if (oldDeps.some((item, i) => item !== deps[i])) {
          dispose && dispose();
          oldDepsWithDispose.current[index][0] = deps;
          oldDepsWithDispose.current[index][1] = handle(deps, oldDeps);
        }
      });
    }
  }

  function useRouterStoreReducer(reducersOrFactory) {
    const store = useRouterStore();
    const [reducers] = useState(() => typeof reducersOrFactory === "function" ?
      reducersOrFactory(store) :
      reducersOrFactory
    );
    return useRouterStoreStatePro__base(store, action => reducers[action?.type]);
  }

  function useRouterStoreCompose() {
    const store = useRouterStore();
    return useRouterStoreStatePro__base(store, action => action?.type);
  }

  let listener = null;
  let addRoutesResolve = null;

  function RouterProvider$1({router: __router, fallbackElement, future}) {
    const realRouter = useSyncExternalStore(onStoreChange => {
      listener = onStoreChange;
      return () => listener = null;
    }, () => router);
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
    return createElement(Context$1.Provider, {value}, createElement(RouterProvider, {
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
    RouterProvider: RouterProvider$1,
    useRoutes,
    useGlobalOptions,
    useRouteMeta,
    useNavigateGuard,
    useRouterStore,
    useRouterStoreState,
    useRouterStoreReducer,
    useRouterStoreCompose,
    globalOptions,
    beforeEach: (handle) => {
      return add(beforeHandles, handle);
    },
    afterEach: (handle) => {
      return add(afterHandles, handle);
    },
    getRoutes: () => {
      return router.routes;
    },
    addRoutes: (newRoutes = baseRoutes) => {
      return new Promise(resolve => {
        if (newRoutes === baseRoutes) return;
        baseRoutes = newRoutes;
        wrapperHandleRoutes(baseRoutes);
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
  return useContext(Context$1)["__router"];
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

function makeEffect(effect) {
  addEffect(effect);
}

function makeMemo(depsHandle, computeHandle, set, isFactory = true) {
  addEffect(({state, detail, options}) => [
    depsHandle(state),
    (newValue, oldValue) => {
      const value = isFactory ? computeHandle(newValue, oldValue) : () => computeHandle(newValue, oldValue);
      set({detail, options, value});
    }
  ]);
}

function makeCallback(depsHandle, functor, set) {
  makeMemo(depsHandle, functor, set, false);
}

const Context = createContext(null);
const defaultUseRouterNativeHooksHandle = () => ({});
const defaultUseRouterHooksHandle = (_) => ({});

function useRouterStore() {
  return useContext(Context).storeInfo;
}

function useRouterHooks() {
  return useContext(Context).routerHooks;
}

function routerNativeHooks(component, useRouterNativeHooksHandle = defaultUseRouterNativeHooksHandle) {
  return function RouterNativeHooks() {
    const routerHooks = useRouterNativeHooksHandle();
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

registerGlobalPlugin(routerStoreRequestHookPlugin);
registerGlobalPlugin(routerStoreEffectPlugin);

export { Keepalive, Redirect, Resolve, Show, ShowList, TimeoutError, Transition, alias, createBrowserRouter, createComponentWithStore, createHashRouter, createReducerHandle, createRouterStore, enhancer, guardError, keepalive, lazy, lazyWithStore, makeCallback, makeEffect, makeMemo, max, noCache, redirect, registerGlobalPlugin, routerNativeHooks, routerStore, routerStoreCompose, routerStoreReducer, routerStoreState, start, store, transition, useActivated, useRouter, useRouterHooks, useRouterStore, wrapper };
