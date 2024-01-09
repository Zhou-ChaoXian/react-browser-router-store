"use strict";

/**
 * function Foo() {
 *   const promise = new Promise(resolve => setTimeout(resolve, 1000, "hello world"));
 *   return (
 *     <div>
 *       <Show resolve={promise} loading={<h1>loading...</h1>}>
 *         {value => <h1>{value}</h1>}
 *       </Show>
 *     </div>
 *   );
 * }
 *
 * function Bar() {
 *   const promise1 = new Promise(resolve => setTimeout(resolve, 1000, "hello world"));
 *   const promise2 = new Promise(resolve => setTimeout(resolve, 2000, "hi"));
 *   return (
 *     <div>
 *       <ShowList loading={<h1>loading...</h1>}>
 *         <Resolve resolve={promise1}>
 *           {value => <h1>{value}</h1>}
 *         </Resolve>
 *         <Resolve resolve={promise2}>
 *           {value => <h1>{value}</h1>}
 *         </Resolve>
 *       </ShowList>
 *     </div>
 *   );
 * }
 */

import {
  createElement,
  Suspense,
  Component,
  Fragment,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  createContext,
  useContext,
  useCallback,
  isValidElement
} from "react";

export {
  Show,
  Await,
  defineAsyncComponent,
  useAsyncValue,
  ShowOrder,
  ShowList,
  Resolve,
  TimeoutError,
};

const Nop = Symbol();
const NotResult = Symbol();
const _tracked = Symbol();
const _data = Symbol();
const _error = Symbol();
const defaultFunction = (_ => _);
const Context = createContext(undefined);

/**
 * @param resolve {Promise | any}
 * @param loading {React.ReactNode}
 * @param error {(error: any) => React.ReactNode}
 * @param onStart {() => any}
 * @param onEnd {() => any}
 * @param children {(value: any) => React.ReactNode}
 * @return {React.ReactElement}
 */
function Show({resolve, loading = false, error = (_) => false, onStart, onEnd, children}) {
  useLayoutEffect(() => {
    onStart?.();
  }, [resolve]);
  return createElement(ErrorBoundary, {fallback: error},
    createElement(Suspense, {fallback: loading},
      createElement(ResolveInner, {resolve, children, onEnd})
    )
  );
}

/**
 * @param loading {React.ReactNode}
 * @param error {(error: any) => React.ReactNode}
 * @param complete {boolean}
 * @param onStart {() => void}
 * @param onEnd {() => void}
 * @param delay {number}
 * @param children {React.FunctionComponentElement<any>}
 * @param compare {(newProps: any, oldProps: any) => boolean}
 * @return {React.ReactElement}
 */
function Await(
  {
    loading,
    error,
    complete = false,
    onStart,
    onEnd,
    delay = 300,
    children,
    compare = defaultCompare
  }
) {
  const [resolve, setResolve] = useState(() => {
    return isValidElement(children) && typeof children.type === "function" ?
      {current: children.type(children.props)} :
      undefined;
  });
  const flag = useRef(true), first = useRef(true);
  const cacheProps = useRef(null);
  if (!isValidElement(children) || typeof children.type !== "function")
    return createElement(Show, {resolve: children, children: defaultFunction});
  const handle = () => children.type(children.props);
  useAwaitCompareProps(compare, flag, complete, cacheProps, children.props, resolve, handle, delay);
  useAwaitLayoutEffect(first, flag, onStart, onEnd, setResolve, handle);
  const props = {resolve: resolve.current, loading, error, children: defaultFunction};
  useAwaitSetProps(first, complete, props, onStart, onEnd);
  return createElement(Show, props);
}

/**
 * @param name {string}
 * @param loader {(props: any) => Promise<any> | any}
 * @param Component {React.ComponentType}
 * @param complete {boolean}
 * @param loading {React.ReactNode}
 * @param error {(error: any) => React.ReactNode}
 * @param delay {number}
 * @param compare {(newProps: any, oldProps: any) => boolean}
 * @return {function(*): React.FunctionComponentElement}
 */
function defineAsyncComponent(
  {
    name = "AsyncComponent",
    loader,
    Component,
    complete = false,
    loading,
    error,
    delay = 300,
    compare = defaultCompare,
  }
) {
  function AsyncComponent({onStart, onEnd, ...props}) {
    const handle = () => loader(props);
    const [resolve, setResolve] = useState(() => ({current: handle()}));
    const cacheProps = useRef(null);
    const flag = useRef(true), first = useRef(true);
    const el = useState(() => ({current: createElement(Component, props)}))[0];
    const fn = useCallback((value) => createElement(Context.Provider, {value}, el.current), []);
    const defineHandle = () => el.current = createElement(Component, props);
    useAwaitCompareProps(compare, flag, complete, cacheProps, props, resolve, handle, delay, defineHandle);
    useAwaitLayoutEffect(first, flag, onStart, onEnd, setResolve, handle, defineHandle);
    const __props = {resolve: resolve.current, loading, error, children: fn};
    useAwaitSetProps(first, complete, __props, onStart, onEnd);
    return createElement(Show, __props);
  }

  return Object.defineProperty(AsyncComponent, "displayName", {value: name});
}

function useAsyncValue() {
  return useContext(Context);
}

function defaultCompare(newProps, oldProps) {
  return Object.entries(newProps).some(([key, value]) => value !== oldProps[key]);
}

function useAwaitCompareProps(compare, flag, complete, cacheProps, newProps, resolve, handle, delay, defineHandle) {
  const oldProps = cacheProps.current;
  if (oldProps === null) {
    cacheProps.current = newProps;
  } else if (compare(newProps, oldProps)) {
    cacheProps.current = newProps;
    if (complete) {
      flag.current = !flag.current;
    } else {
      let data = handle();
      if (data instanceof Promise)
        data = data.then(value => sleep(delay, value));
      resolve.current = data;
      defineHandle && defineHandle();
    }
  }
}

function useAwaitLayoutEffect(first, flag, onStart, onEnd, setResolve, handle, defineHandle) {
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onStart?.();
    let flag = true;
    Promise.resolve(handle()).then(value => {
      if (flag) {
        setResolve({current: value});
        defineHandle && defineHandle();
        onEnd?.();
      }
    });
    return () => {
      flag = false;
    };
  }, [flag.current]);
}

function useAwaitSetProps(first, complete, props, onStart, onEnd) {
  if (first.current || !complete) {
    props.onStart = onStart;
    props.onEnd = onEnd;
  }
}

const modeStates = new Set(["forward", "backward", "together"]);

/**
 * @param mode {"forward" | "backward" | "together" | undefined}
 * @param delay {number}
 * @param children {ReactNode | ReactElement<ShowProps> | (ReactNode | ReactElement<ShowProps>)[]}
 * @return
 */
function ShowOrder({mode, delay = 300, children}) {
  if (!modeStates.has(mode)) return children;
  if (!Array.isArray(children))
    children = [children];
  const resolves = children.map(child => child?.type === Show ? child.props.resolve : Nop);
  if (mode === "together") {
    const promises = [], position = [];
    resolves.forEach((resolve, index) => {
      if (resolve instanceof Promise && !Reflect.has(resolve, _tracked)) {
        promises.push(trackedPromise(resolve));
        position.push(index);
      }
    });
    if (promises.length > 0) {
      const all = Promise.allSettled(promises);
      position.forEach((pos, index) => resolves[pos] = all.then(() => promises[index]));
    }
  } else {
    const fnName = mode === "backward" ? "reduceRight" : "reduce";
    resolves[fnName]((prev, current, index) => {
      if (current instanceof Promise && !Reflect.has(current, _tracked)) {
        const promise = trackedPromise(current), fn = () => sleep(delay, promise);
        return resolves[index] = prev.then(fn, fn);
      }
      return prev;
    }, Promise.resolve());
  }
  return createElement(Fragment, null, ...resolves.map((resolve, index) => {
    return resolve === Nop ?
      children[index] :
      createElement(Show, {...children[index].props, resolve});
  }));
}

/**
 * @param loading {React.ReactNode}
 * @param timeout {number}
 * @param delay {number}
 * @param onStart {() => any}
 * @param onEnd {() => any}
 * @param children {React.ReactNode | ReactElement<ResolveProp> | (React.ReactNode | ReactElement<ResolveProp>)[]}
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
  if (flag && hasPromise) {
    const timeoutTask = sleep(timeout + delay, timeoutArrayValue)
      .then(v => v.map(item => item === Nop ? setRejectReason(new TimeoutError()) : item));
    resolve = Promise.race([tasks, timeoutTask]);
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
 * @param error {(error: any) => React.ReactNode}
 * @param children {(value: any) => React.ReactNode}
 */
function Resolve({resolve, error = (_) => false, children}) {
}

function ResolveInner({resolve, children, onEnd}) {
  const value = use(resolve);
  useEffect(() => {
    onEnd?.();
  }, [resolve]);
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
      return this.props.fallback(error.message);
    }
  }
}