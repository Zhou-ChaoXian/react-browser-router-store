"use strict";

import {createElement as h, useContext, useLayoutEffect, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {Context, RouteContext, defaultFunction, judgeUseKeepalive, isUseKeepAlive} from "./context.js";
import {ComponentWithStore, isLazyComponentWithStore, StoreState} from "./lazy.js";
import {Transition, Keepalive, Redirect, noCache} from "../components";
import {compose, getRequestAfterHandles, getRequestBeforeHandles, getRequestErrorHandles} from "../store";

export {
  handleRoutes,
  enhancer,
  wrapper,
  transition,
  keepalive,
  store,
  start,
  guardError,
  redirect,
  alias,
  max,
};

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
        item.element = h(Route, {route: composeComponent(wrapperList)(element)});
        if (meta[alias]) {
          handleRouteMetaAlias(item, extraRoutesHandles)
        }
      }
    }
    if ((item.children ?? []).length > 0) {
      handleRoutes(item.children, globalOptions);
    }
  })
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
    return h(component, props, prev);
  }, element);
}

function handleRouteComponent(item) {
  let element;
  const {component} = item;
  if (component instanceof ComponentWithStore) {
    judgeUseKeepalive.flag = false;
    element = h(component.component);
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
    element = h(component);
  } else {
    element = h(component);
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
  route.element = h(Route, {route: h(Redirect, {path, options, children})})
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
  const {handles: [before, after], router, globalOptions, handleNavigateGuard} = useContext(Context);
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
      const nextElement = h(RouteContext.Provider, {value: {pathname, store, meta}}, h(
        Transition, {...(meta[transition] ?? globalOptions[transition] ?? {}), uniqueKey},
        h(Keepalive, keepAliveProps, meta[enhancerFactory](() => route)({to, from: from.current, pathname}))
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
      flag = false
    };
  }, [to.pathname, to.search, to.hash, pathname]);
  return element;
}