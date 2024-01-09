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
  useCallback,
  createContext,
  useContext,
  isValidElement,
  Fragment,
} from "react";
import {OutletContext} from "./outlet.js";
import {isForwardRefComponent, cloneElementWithRef} from "./utils.js";

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
 * @param className {string}
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
    className,
    style = {height: "100%"},
    children
  }
) {
  const {valid} = useContext(OutletContext);
  const originKeysOrder = useRef(new List()).current;
  const sortedKeysOrder = useRef(new List()).current;
  const map = useRef(new Map()).current;
  const activeKey = useRef(uniqueKey);
  const isCache = useRef(true);
  const roots = useRef([]).current;
  const setRootsStyle = useCallback(() => {
    if (roots.length === 0) return;
    roots.forEach(({root, isActive}) => {
      root.style.display = isActive ? "" : "none";
    });
    roots.length = 0;
  }, []);
  useLayoutEffect(() => {
    setRootsStyle();
  }, [uniqueKey]);
  if (!isCache.current) {
    const {originNode, sortedNode} = map.get(activeKey.current);
    map.delete(activeKey.current);
    originKeysOrder.deleteNode(originNode);
    sortedKeysOrder.deleteNode(sortedNode);
    isCache.current = true;
  }
  if (map.has(uniqueKey)) {
    const data = map.get(uniqueKey);
    data.isActive = true;
    sortedKeysOrder.pushLast(data.sortedNode);
  } else {
    const originNode = originKeysOrder.addNode(uniqueKey);
    const sortedNode = sortedKeysOrder.addNode(uniqueKey);
    const element = isValidElement(children) ? children : createElement(Fragment, null, children);
    map.set(uniqueKey, {element, isActive: true, originNode, sortedNode});
    if (max > 0 && sortedKeysOrder.length > max) {
      const {item} = sortedKeysOrder.deleteFirst();
      originKeysOrder.deleteNode(map.get(item).originNode);
      map.delete(item);
    }
  }
  if (uniqueKey !== activeKey.current) {
    const data = map.get(activeKey.current);
    if (data) data.isActive = false;
  }
  activeKey.current = uniqueKey;
  if (!include(uniqueKey) || exclude(uniqueKey)) {
    isCache.current = false;
  }
  return [...originKeysOrder].map(({item: key}) => {
    const {element, isActive} = map.get(key);
    let el;
    if (isForwardRefComponent(element)) {
      el = cloneElementWithRef(element, (root) => {
        root && roots.push({root, isActive});
      });
    } else {
      el = createElement("div", {
        className,
        style: {...style, display: isActive ? "" : "none"},
        "data-type": "KeepaliveItem"
      }, element);
    }
    return createElement(Context.Provider, {value: isActive && valid, key}, el);
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

  addNode(item) {
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

  deleteNode(node) {
    if (this.#length === 0) return node;
    this.#length -= 1;
    if (this.#length === 0) {
      this.#first = null;
      return node;
    }
    if (node === this.#first) {
      this.#first = this.#first.after;
      this.#first.before = null;
      if (this.#length === 1)
        this.#last = null;
      return node;
    }
    if (node === this.#last) {
      this.#last = this.#last.before;
      this.#last.after = null;
      if (this.#length === 1)
        this.#last = null;
      return node;
    }
    const {before, after} = node;
    before.after = after;
    after.before = before;
    return node;
  }

  deleteFirst() {
    return this.deleteNode(this.#first);
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
    return node;
  }
}