"use strict";

/**
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
 *       <Keepalive uniqueKey={key} include={() => true}>
 *         {elements[key]}
 *       </Keepalive>
 *     </div>
 *   );
 * }
 */

import {
  createElement,
  useLayoutEffect,
  useRef,
  createContext,
  useContext,
  cloneElement,
  isValidElement,
  Fragment,
} from "react";

export {
  Keepalive,
  useActivated,
  noCache,
};

const Context = createContext(false);

/**
 * @param uniqueKey {string | undefined}
 * @param max {number}
 * @param include {(key: string | undefined) => boolean}
 * @param exclude {(key: string | undefined) => boolean}
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
      createElement(Context.Provider, {value: isActive}, element)
    );
  });
}

function useActivated(activatedHandle) {
  const isActive = useContext(Context);
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