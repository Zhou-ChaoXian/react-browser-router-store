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

import {createElement, Suspense, Component, Fragment, useEffect, useLayoutEffect} from "react";

export {
  Show,
  ShowList,
  Resolve,
  TimeoutError,
};

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