"use strict";

import {createElement as h, useContext, useLayoutEffect, useRef, useState, isValidElement, Fragment} from "react";
import {generatePath, useLocation, useNavigate} from "react-router-dom";
import {Context, defaultFunction, RouteContext, RouteViewsContext} from "./context.js";
import {ComponentWithStore, isLazyComponentWithStore, StoreState} from "./lazy.js";
import {Transition, Keepalive} from "../components";
import {compose, getRequestAfterHandles, getRequestBeforeHandles, getRequestErrorHandles} from "../store";

export {
  handleRoutes,
  global,
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
  views,
};

const global = Symbol("global");
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
const originPath = Symbol("originPath");
const handled = Symbol();
const elementNop = Symbol("elementNop");
const routeRefNop = Symbol();
const views = Symbol("views");

function handleRoutes(routes, globalOptions, parentGlobalOptions = {}, hasIndex = true) {
  const extraRoutesHandles = [];
  routes.forEach(item => {
    if (item.index) hasIndex = true;
    const flag = (item.path !== undefined || item.index) && item.meta?.[handled] === undefined;
    if (flag) {
      item.meta ??= {};
      item.meta[handled] = true;
      if (item.meta[redirect] !== undefined) {
        item.element = h(Route, {route: h(Fragment)});
        delete item.children;
        return;
      }
      let element;
      if (Reflect.has(item, "element")) {
        element = isValidElement(item.element) ? item.element : h(Fragment, null, item.element);
      } else if (item.component) {
        element = handleRouteComponent(item);
      } else {
        element = h(Fragment);
      }
      const wrapperList = item.meta[wrapper] ?? parentGlobalOptions[wrapper] ?? globalOptions[wrapper] ?? [];
      item.element = h(Route, {route: composeComponent(wrapperList)(element)});
      if (item.meta[alias]) {
        handleRouteMetaAlias(item, extraRoutesHandles);
      }
    }
    if ((item.children ?? []).length > 0 && item.meta?.[originPath] === undefined) {
      handleRoutes(item.children, globalOptions, item[global], !flag);
    }
  });
  if (!hasIndex)
    routes.push({index: true, element: h(Route, {route: elementNop}), meta: {[handled]: true}});
  if (extraRoutesHandles.length > 0)
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
    element = h(component.component);
    item.meta[store] = component.store;
  } else if (isLazyComponentWithStore(component)) {
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

function handleRouteMetaAlias(route, extraRoutesHandles) {
  let aliasInfo = route.meta[alias];
  if (typeof aliasInfo === "string") {
    aliasInfo = [aliasInfo];
  }
  if (aliasInfo.length === 0) return;
  extraRoutesHandles.push(() => aliasInfo.map(path => {
    const newRoute = {...route, meta: {...route.meta, [originPath]: route.path}, path};
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
  const {handles: [before, after], globalOptions, router, handleNavigateGuard} = useContext(Context);
  const routeRef = useRef(routeRefNop);
  const to = useLocation(), from = useRef(to), fromPro = useRef(to);
  const navigate = useNavigate();
  const resolveValue = useRef();
  const matches = router.state.matches;
  const index = matches.findIndex(item => item.route.element.props.route === route);
  const notFind = index < 0;
  const match = matches[index];
  const {pathname, params} = match ?? {};
  const meta = match?.route.meta
  let parentGlobalOptions = {};
  if (index > 0) {
    const __global = matches[index - 1].route.meta?.[global];
    if (__global !== undefined)
      parentGlobalOptions = __global;
  }
  const getValueFromGlobal = (key, defaultValue = undefined) => {
    if (Reflect.has(parentGlobalOptions, key))
      return parentGlobalOptions[key];
    if (Reflect.has(globalOptions, key))
      return globalOptions[key];
    return defaultValue
  };
  const [element, setElement] = useState(() => {
    return h(RouteContext.Provider, {value: {}},
      h(RouteViewsContext.Provider, {value: {}},
        h(Transition, getValueFromGlobal(transition, {}),
          h(Keepalive, {uniqueKey: "start"}, getValueFromGlobal(start))
        )
      )
    );
  });
  useLayoutEffect(() => {
    if (notFind) return;
    if (Reflect.has(meta, redirect)) {
      queueMicrotask(() => {
        navigate({pathname: generatePath(meta[redirect], params), search: to.search, hash: to.hash}, {replace: true});
      });
      return;
    }
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
      const __originPath = meta[originPath];
      const keepAliveProps = {
        ...(meta[keepalive] ?? getValueFromGlobal(keepalive, {})),
        max: getValueFromGlobal(max),
        uniqueKey: __originPath === undefined ? uniqueKey : generatePath(__originPath, params),
        children: route === elementNop ?
          undefined :
          meta[enhancerFactory](() => route)({to, from: from.current, pathname}),
      };
      const nextElement =
        h(RouteContext.Provider, {value: {pathname, store, meta}},
          h(RouteViewsContext.Provider, {value: meta[views]},
            h(Transition, {...(meta[transition] ?? getValueFromGlobal(transition, {})), uniqueKey},
              h(Keepalive, keepAliveProps)
            )
          )
        );
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
    }).catch(meta[guardError] ?? getValueFromGlobal(guardError, defaultFunction));
    return () => {
      flag = false
    };
  }, [pathname, route]);
  if (notFind)
    return element;
  if (!meta[enhancerFactory])
    meta[enhancerFactory] = compose(meta[enhancer] ?? getValueFromGlobal(enhancer, []));
  to.pathname === pathname && (to.meta ??= meta);
  return element;
}