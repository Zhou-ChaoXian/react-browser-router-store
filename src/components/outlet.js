"use strict";

import {createContext, useRef, createElement, useContext} from "react";
import {useOutlet as useOutlet$1} from "react-router-dom";

export {
  Outlet,
  useOutlet,
  useOutletContext,
  OutletContext,
};

const OutletContext = createContext({valid: true});

function Outlet({context = undefined}) {
  const cache = useRef(null);
  const element = useOutlet$1();
  const valid = element !== null;
  if (valid) cache.current = element;
  return createElement(OutletContext.Provider, {value: {valid, context}}, cache.current);
}

function useOutlet(context = undefined) {
  return Outlet({context});
}

function useOutletContext() {
  return useContext(OutletContext).context;
}