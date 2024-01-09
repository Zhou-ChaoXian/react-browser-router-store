"use strict";

/**
 * global.css
 *
 * .v-enter-from, .v-leave-to {
 *   opacity: 0;
 *   transform: scale(.9);
 * }
 *
 * .v-enter-active, .v-leave-active {
 *   transition: all .5s linear;
 * }
 *
 *
 * function Foo() {
 *   const elements = {
 *     foo: "Foo Component",
 *     bar: "Bar Component",
 *   };
 *   const [key, setKey] = useState("foo");
 *   return (
 *     <div>
 *       <button onClick={() => setKey("foo")}><h1>foo</h1></button>
 *       <button onClick={() => setKey("bar")}><h1>bar</h1></button>
 *       <Transition type="transition" uniqueKey={key}>
 *         {elements[key]}
 *       </Transition>
 *     </div>
 *   );
 * }
 */

import {createElement, useLayoutEffect, useMemo, useRef, useState, createContext, useContext} from "react";
import {isForwardRefComponent, cloneElementWithRef} from "./utils.js";

export {
  Transition,
  ViewTransition,
  useViewTransition,
};

/**
 * @param type {"transition" | "animation" | "animate" | undefined}
 * @param name {string}
 * @param uniqueKey {any}
 * @param __className {string}
 * @param style {Omit<React.CSSProperties, "visibility">}
 * @param enterFromClass {string}
 * @param enterActiveClass {string}
 * @param enterToClass {string}
 * @param leaveFromClass {string}
 * @param leaveActiveClass {string}
 * @param leaveToClass {string}
 * @param onEnter {(el: HTMLElement) => void}
 * @param onLeave {(el: HTMLElement, done: () => void) => void}
 * @param children {React.ReactNode}
 * @return {React.ReactElement}
 */
function Transition(
  {
    type,
    name = "v",
    uniqueKey,
    className: __className,
    style = {height: "100%"},
    enterFromClass,
    enterActiveClass,
    enterToClass,
    leaveFromClass,
    leaveActiveClass,
    leaveToClass,
    onEnter,
    onLeave,
    children
  }
) {
  const ref = useRef(null);
  const [el, setEl] = useState(children);
  const reRender = useRef(false);
  const first = useRef(true);
  const className = useMemo(() => ({
    enterFromClass: (enterFromClass ?? `${name}-enter-from`).split(" ").filter(Boolean),
    enterActiveClass: (enterActiveClass ?? `${name}-enter-active`).split(" ").filter(Boolean),
    enterToClass: (enterToClass ?? `${name}-enter-to`).split(" ").filter(Boolean),
    leaveFromClass: (leaveFromClass ?? `${name}-leave-from`).split(" ").filter(Boolean),
    leaveActiveClass: (leaveActiveClass ?? `${name}-leave-active`).split(" ").filter(Boolean),
    leaveToClass: (leaveToClass ?? `${name}-leave-to`).split(" ").filter(Boolean),
  }), [uniqueKey]);
  useLayoutEffect(() => {
    let flag = true;
    const root = ref.current;
    const handle = () => {
      if (flag) {
        setEl(children);
        reRender.current = true;
      }
    };
    switch (type) {
      case "transition": {
        if (first.current) {
          first.current = false;
          transitionEnter(root, className);
        } else {
          transitionLeave(root, className, handle);
        }
        return;
      }
      case "animation": {
        if (first.current) {
          first.current = false;
          animationEnter(root, className);
        } else {
          animationLeave(root, className, handle);
        }
        return;
      }
      case "animate": {
        if (first.current) {
          first.current = false;
          animateEnter(root, onEnter);
        } else {
          animateLeave(root, onLeave, handle);
        }
        return;
      }
      default: {
        if (first.current) first.current = false;
        setEl(children);
      }
    }
    return () => {
      flag = false;
    };
  }, [uniqueKey]);
  useLayoutEffect(() => {
    if (!reRender.current) return;
    reRender.current = false;
    const root = ref.current;
    switch (type) {
      case "transition": {
        transitionEnter(root, className);
        return;
      }
      case "animation": {
        animationEnter(root, className);
        return;
      }
      case "animate": {
        animateEnter(root, onEnter);
        return;
      }
    }
  });
  return isForwardRefComponent(el) ?
    cloneElementWithRef(el, ref) :
    createElement("div", {ref, className: __className, style, children: el, "data-type": "Transition"});
}

function animationFrame(handle) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      handle();
    });
  });
}

function calcTransitionTime(el) {
  const {transitionDuration, transitionDelay} = getComputedStyle(el);
  const duration = parseFloat(transitionDuration) * 1000;
  const delay = parseFloat(transitionDelay) * 1000;
  return duration + delay;
}

function enterStyle(root) {
  root.style.visibility = "";
}

function leaveStyle(root) {
  root.style.visibility = "hidden";
}

function transitionEnter(root, className) {
  enterStyle(root);
  const {enterFromClass, enterActiveClass, enterToClass, leaveToClass} = className;
  root.classList.remove(...leaveToClass);
  root.classList.add(...enterFromClass, ...enterActiveClass);
  animationFrame(() => {
    root.classList.remove(...enterFromClass);
    root.classList.add(...enterToClass);
    root.addEventListener("transitionend", () => {
      root.classList.remove(...enterActiveClass);
    }, {once: true});
  });
}

function transitionLeave(root, className, handle) {
  const {enterToClass, leaveFromClass, leaveActiveClass, leaveToClass} = className;
  root.classList.remove(...enterToClass);
  root.classList.add(...leaveFromClass, ...leaveActiveClass);
  animationFrame(() => {
    root.classList.remove(...leaveFromClass);
    root.classList.add(...leaveToClass);
    let flag = false;
    const fn = () => {
      if (flag) return;
      flag = true;
      handle();
      leaveStyle(root);
      root.classList.remove(...leaveActiveClass);
    };
    root.addEventListener("transitionend", fn, {once: true});
    setTimeout(fn, calcTransitionTime(root));
  });
}

function animationEnter(root, className) {
  enterStyle(root);
  const {enterActiveClass} = className;
  root.classList.add(...enterActiveClass);
  root.addEventListener("animationend", function () {
    root.classList.remove(...enterActiveClass);
  }, {once: true});
}

function animationLeave(root, className, handle) {
  const {leaveActiveClass} = className;
  root.classList.add(...leaveActiveClass);
  root.addEventListener("animationend", () => {
    leaveStyle(root);
    root.classList.remove(...leaveActiveClass);
    handle();
  }, {once: true});
}

function animateEnter(root, onEnter) {
  enterStyle(root);
  onEnter(root);
}

function animateLeave(root, onLeave, handle) {
  onLeave(root, () => {
    leaveStyle(root);
    handle();
  });
}

const Context = createContext("");

/**
 * @typedef {{
 *   finished: Promise<void>;
 *   ready: Promise<void>;
 *   updateCallbackDone: Promise<void>;
 *   skipTransition(): void;
 * }} ViewTransitionInterface
 * @typedef {(cb?: () => Promise<void> | void) => ViewTransitionInterface} StartViewTransition
 */

/**
 * @param name {string}
 * @param uniqueKey {any}
 * @param onViewTransition {(el: HTMLElement, startViewTransition: StartViewTransition) => void}
 * @param className {string}
 * @param style {Omit<React.CSSProperties, "visibility">}
 * @param children {React.ReactNode}
 * @return {React.ReactElement}
 */
function ViewTransition(
  {
    name,
    uniqueKey,
    onViewTransition,
    className,
    style = {height: "100%"},
    children
  }
) {
  const ref = useRef(null);
  const [el, setEl] = useState(children);
  const first = useRef(true);
  const viewTransitionResolve = useRef(null);
  useLayoutEffect(() => {
    let flag = true;
    if (document.startViewTransition === undefined) {
      if (first.current) first.current = false;
      setEl(children);
    } else {
      const root = ref.current;
      if (first.current) {
        first.current = false;
        onViewTransition(root, (cb) => {
          leaveStyle(root);
          root.style.viewTransitionName = name;
          const view = document.startViewTransition(() => {
            const fn = () => {
              enterStyle(root);
            };
            return Promise.resolve(cb?.()).then(fn, fn);
          });
          view.finished.then(() => root.style.viewTransitionName = "");
          return view;
        });
      } else {
        onViewTransition(root, (cb) => {
          root.style.viewTransitionName = name;
          const view = document.startViewTransition(() => {
            const fn = () => {
              if (flag) {
                setEl(children);
                return new Promise(resolve => viewTransitionResolve.current = resolve);
              }
            };
            return Promise.resolve(cb?.()).then(fn, fn);
          });
          view.finished.then(() => {
            root.style.viewTransitionName = "";
            if (ref.current !== root)
              ref.current.style.viewTransitionName = "";
          });
          return view;
        });
      }
    }
    return () => {
      flag = false;
    };
  }, [uniqueKey]);
  useLayoutEffect(() => {
    if (viewTransitionResolve.current !== null) {
      viewTransitionResolve.current?.();
      viewTransitionResolve.current = null;
    }
  });
  return isForwardRefComponent(el) ?
    createElement(Context.Provider, {value: name}, cloneElementWithRef(el, ref)) :
    createElement("div", {ref, className, style, children: el, "data-type": "ViewTransition"});
}

function useViewTransition(ref) {
  const name = useContext(Context);
  useLayoutEffect(() => {
    ref.current.style.viewTransitionName = name;
  }, [name]);
}