"use strict";

import {isValidElement, cloneElement} from "react";

export {
  isForwardRefComponent,
  cloneElementWithRef,
};

const forwardRefComponentSymbol = Symbol.for("react.forward_ref");

function isForwardRefComponent(element) {
  return isValidElement(element) && element.type.$$typeof === forwardRefComponentSymbol;
}

function cloneElementWithRef(element, ref) {
  return cloneElement(element, {ref});
}