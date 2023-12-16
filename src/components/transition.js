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
 *       <Transition type="transition" uniqueKey={key} disabled={false}>
 *         {elements[key]}
 *       </Transition>
 *     </div>
 *   );
 * }
 */

import {createElement, useLayoutEffect, useMemo, useRef, useState} from "react";

export {
  Transition as default,
};

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