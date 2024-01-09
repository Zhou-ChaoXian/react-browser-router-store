"use strict";

import {createElement, useContext, useRef} from "react";
import {RouteViewsContext} from "../core/context.js";

export {
  RouteView,
};

function RouteView({name = "default", children}) {
  const views = useRef(useContext(RouteViewsContext) ?? {}).current;
  const view = views[name] ?? {};
  const {component: Component, children: childrenViews, props = {}} = view;
  let element;
  if (typeof children === "function") {
    element = children(Component, props);
  } else {
    if (Component) {
      element = createElement(Component, {...props, children});
    }
  }
  return createElement(RouteViewsContext.Provider, {value: childrenViews}, element);
}