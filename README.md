# react-browser-router-store

## 简介

> 封装路由（`react-router-dom`）和仓库（`redux`）  
> 路由：对 `react-router-dom v6`（数据路由） 进行增强，不改变原始的用法（只加功能）  
> 仓库：重新实现 `redux` 思想，并将功能添加进路由  
> ***仓库中实现 hooks 思想***


> 增强的功能如下：

1. [过渡（`transition`，路由切换提供过渡或动画效果）](#添加过渡效果)
2. [缓存（`keepalive`，缓存路由组件）](#缓存)
3. [重定向（`redirect`，重定向到其他路由）](#重定向)
4. [别名（`alias`，一个路由有多个路径）](#别名)
5. [增强（`enhancer`，对路由进行布局增强，每次切换路由主动调用）](#增强)
6. [包装（`wrapper`，用组件对路由进行包装）](#包装)
7. [错误（`guardError`，在进入下一个路由前发生错误，进行处理）](#错误)
8. [**仓库（`store`，路由仓库，每一个路由都可以拥有一个仓库）**](#仓库)
9. [导航守卫（`beforeEach  afterEach`，在路由切换前进行调用）](#导航守卫)
10. [动态路由（`addRoutes`，添加路由）](#动态路由)
11. [优化](#优化)
12. [组件（管理 `promise` 的功能性组件）](#组件)

> 功能 **1 - 8** 实现方式：在路由对象中加了 `meta` 属性，他们都是 `symbol`

```javascript
const router = createBrowserRouter([
  {
    path: "/",
    element: <Index/>,
    meta: {
      [alias]: ["/index", "/ind"],
      [transition]: {
        type: "transition",
        disabled: false,
      },
      [keepalive]: {
        include: () => true,
      },
    }
  }
]);
```

## 教程

> 没有教程，一起实现一个简单的 **React** 项目即可

---

***学的愉快，学的开心 ~***

___

## 开始

### 创建项目

> 使用 **vite** 或 **react-app** 创建一个纯净无暇的 **react** 项目

```javascript
// App.jsx
// 目前所有代码都在 App.jsx 中，通过 Index 和 Foo 这两个组件进行功能讲解

import {createBrowserRouter, RouterProvider, Link} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index/>,
  },
  {
    path: "/foo",
    element: <Foo/>,
  }
]);

export default function App() {
  return (
    <RouterProvider router={router}/>
  );
}

function Index() {
  return (
    <div>
      <h1>index</h1>
      <Link to="/foo">
        <h1>foo</h1>
      </Link>
    </div>
  );
}

function Foo() {
  return (
    <div>
      <h1>foo</h1>
      <Link to="/">
        <h1>index</h1>
      </Link>
    </div>
  );
}
```

> 一个简单的 **react** 项目写完

### 切换路由

> 使用我们封装的路由

```javascript
// 原始
import {createBrowserRouter, RouterProvider, Link} from "react-router-dom";

export default function App() {
  return (
    <RouterProvider router={router}/>
  );
}
```

```javascript
// 修改后
import {Link} from "react-router-dom";
import {createBrowserRouter} from "react-browser-router-store";

export default function App() {
  return (
    <router.RouterProvider router={router}/>
  );
}
```

> 修改很简单，只需 3 步
> 1. 导入换一下
> 2. RouterProvider 前面添加一个 router 即可
> 3. 所有功能已具备

> 功能正常

### 添加过渡效果

> 过渡组件的props 类似 vue 的过渡组件  
> name: 默认是 v  
> `${name}-enter-from` 进入之前的样式  
> `${name}-enter-active` 进入时如何过渡  
> `${name}-enter-to` 进入后的样式
>
> `${name}-leave-from` 离开之前的样式  
> `${name}-leave-active` 离开时如何过渡  
> `${name}-leave-to` 离开后的样式
>
> disabled: 默认是 false，表示不使用过渡功能
>
> type: "transition" | "animation"  
> transition表示过渡效果，animation表示动画效果

```css
/*在全局的 css 文件中添加*/

/*过渡效果 ==========================================*/
.v-enter-from, .v-leave-to {
  opacity: 0;
  transform: scale(.9);
}

.v-enter-active, .v-leave-active {
  transition: all .5s linear;
}

/*动画效果 =========================================*/
@keyframes show {
  from {
    opacity: 0;
    transform: scale(.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.test-enter-active {
  animation: show .5s linear 1 forwards;
}

.test-leave-active {
  animation: show .5s linear 1 reverse forwards;
}
```

```javascript
import {createBrowserRouter, transition} from "react-browser-router-store";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index/>,
    meta: {
      [transition]: {
        // 过渡效果
        type: "transition",
        // 动画效果
        // name: "test",
        // type: "animation",
        disabled: false
      }
    }
  },
  {
    path: "/foo",
    element: <Foo/>,
  }
]);
```

> 在浏览器中点一点，试一试效果。尝试添加更多的 css，并给 Foo 路由添加过渡效果

### 缓存

> 实现思路：保存所有缓存的路由组件，动态设置组件根节点的内联 css display 样式

```javascript
import {createBrowserRouter, transition, keepalive} from "react-browser-router-store";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index/>,
    meta: {
      [transition]: {
        type: "transition",
        disabled: false
      },
      [keepalive]: {
        include: () => true,
      }
    }
  },
  {
    path: "/foo",
    element: <Foo/>,
  }
]);
```

```javascript
// 有缓存效果时，组件有 激活 | 失活 两种状态
// 有些行为在组件失活时应停止
import {useActivated} from "react-browser-router-store";

function Foo() {
  const [count, setCount] = useState(0);
  // 添加激活函数，组件挂载或激活时执行
  useActivated(() => {
    const id = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
    // 返回失活函数，组件卸载或失活时执行
    return () => {
      clearInterval(id);
    };
  });
  return (
    <div>
      <h1>foo - {count}</h1>
      <Link to="/">
        <h1>index</h1>
      </Link>
    </div>
  );
}
```

> 快试一试效果，<kbd>f12</kbd>打开浏览器控制台，查看元素，看看切换路由后 dom 的情况。  
> 给组件添加状态并修改状态（`useState`），切换路由并查看状态是否保留  
> 给 Foo 添加缓存效果

### 别名

> 一个路由可能存在多个路径，但是要保证 ***路径的匹配模式*** 必须相同

```text
/test/:id  ->  /testPro/:id    √  
/test/:id  ->  /testPro/:key   ×
```

```javascript
import {createBrowserRouter, transition, keepalive, alias} from "react-browser-router-store";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index/>,
    meta: {
      [transition]: {
        type: "transition",
        disabled: false
      },
      [keepalive]: {
        include: () => true,
      },
    }
  },
  {
    path: "/foo",
    element: <Foo/>,
    meta: {
      [alias]: "/fooPro"  // 也可以是数组 ["/fooPro", "/fooPlus"]
    }
  }
]);

function Index() {
  return (
    <div>
      <h1>index</h1>
      <Link to="/foo">
        <h1>foo</h1>
      </Link>
      <Link to="/fooPro">
        <h1>fooPro</h1>
      </Link>
    </div>
  );
}
```

> 试试效果，看看浏览器导航栏地址的变化情况，以及组件展示情况  
> 尝试给组件添加缓存效果，并添加状态，在看看情况

### 重定向

> 由一个路径重定向到其他路径

```javascript
import {createBrowserRouter, transition, keepalive, alias, redirect} from "react-browser-router-store";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index/>,
    meta: {
      [transition]: {
        type: "transition",
        disabled: false
      },
      [keepalive]: {
        include: () => true,
      },
    }
  },
  {
    path: "/foo",
    element: <Foo/>,
    meta: {
      [alias]: "/fooPro",
    }
  },
  {
    path: "/bar",
    meta: {
      [redirect]: "/foo",
    }
  }
]);

function Index() {
  return (
    <div>
      <h1>index</h1>
      <Link to="/foo">
        <h1>foo</h1>
      </Link>
      <Link to="/fooPro">
        <h1>fooPro</h1>
      </Link>
      <Link to="/bar">
        <h1>bar</h1>
      </Link>
    </div>
  );
}
```

> 点击 `bar` 看看情况，看看浏览器导航栏地址信息

### 增强

> 有的时候需要给组件添加一些功能，不改变组件原有的功能

```javascript
import {createBrowserRouter, transition, keepalive, alias, redirect, enhancer} from "react-browser-router-store";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index/>,
    meta: {
      [transition]: {
        type: "transition",
        disabled: false
      },
      [keepalive]: {
        include: () => true,
      },
      [enhancer]: [
        next => () => {
          return (
            <div>
              <h1>enhancer1</h1>
              {next()}
            </div>
          );
        }
      ],
    }
  },
  {
    path: "/foo",
    element: <Foo/>,
    meta: {
      [alias]: "/fooPro",
    }
  },
  {
    path: "/bar",
    meta: {
      [redirect]: "/foo",
    }
  }
]);
```

> 看效果！enhancer是一个数组，尝试添加更多的增强函数  
> 不调用 next 函数会有什么情况，快试试

### 包装

> 效果其实和前面的 `增强` 差不多，但是 `增强` 是普通函数，无法使用 `hooks`

```javascript
import {
  createBrowserRouter,
  transition,
  keepalive,
  alias,
  redirect,
  enhancer,
  wrapper
} from "react-browser-router-store";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index/>,
    meta: {
      [transition]: {
        type: "transition",
        disabled: false
      },
      [keepalive]: {
        include: () => true,
      },
      [enhancer]: [
        next => () => {
          return (
            <div>
              <h1>enhancer1</h1>
              {next()}
            </div>
          );
        }
      ],
      [wrapper]: [IndexWrapper]
    }
  },
  {
    path: "/foo",
    element: <Foo/>,
    meta: {
      [alias]: "/fooPro",
    }
  },
  {
    path: "/bar",
    meta: {
      [redirect]: "/foo",
    }
  }
]);

function IndexWrapper({children}) {
  return (
    <div>
      <h1>IndexWrapper</h1>
      {children}
    </div>
  );
}
```

```javascript
// [wrapper]: [[IndexWrapper, {name: "james", age: 39}]]
// 也可以是元组，第二个元素是组件的props

function IndexWrapper({name, age, children}) {
  return (
    <div>
      <h1>IndexWrapper - {name} - {age}</h1>
      {children}
    </div>
  );
}
```

> 多写几个包装组件，试试效果，看看不使用 `children` 的效果  
> 尝试在包装组件中使用 `react hooks`

### 导航守卫

> 在路由切换前，切换后的处理，类似 `vue-router` 的 api

```javascript
router.beforeEach(async (to, from, navigateGuard) => {
  // 导航到其他路由
  // navigateGuard.next("/");

  // 停止进入路由
  // navigateGuard.stop();
})

router.afterEach((to) => {
  const title = to.meta.title;
  if (typeof title === "string") {
    document.title = title;
  }
})
```

> 多次调用，添加多个拦截。  
> 尝试一下，可以是普通函数或异步函数

### 动态路由

> 添加路由，注意：需要添加全新的路由，因为原有的路由 element 已经被处理过。在原有路由中添加，会多次处理 element

```javascript
// 修改代码
function getBaseRoutes() {
  return [
    {}
  ]
}

const router = createBrowserRouter(getBaseRoutes());
```

```javascript
// 添加路由通常在登录页面中

function Login() {

  async function login() {
    const baseRoutes = getBaseRoutes();
    const newRoutes = await getRoutesByApi();
    const routes = handle(newRoutes);
    baseRoutes.push(...routes);
    const navigate = await router.addRoutes(baseRoutes);
    navigate("/");
  }

  return (
    <button onClick={login}>login</button>
  );
}
```

> 动态路由通常和路由守卫配合，如果不满足条件，跳转到登录页面，添加路由  
> 尝试一下

### 错误

> 在跳转到下一个路由前，需要处理的逻辑可能报错，有些错误是故意抛出的，无需在意

```javascript
import {guardError} from "react-browser-router-store";

// 在 meta 中添加
// [guardError]: (error) => {
//   console.log(error);
// }
```

### 仓库

> 重新实现了 `redux` 的思想，并添加了一些功能  
> **并且在仓库中实现 hooks 功能**  
> 称之为路由仓库，每个路由都可以拥有一个仓库，可以保留状态或不保留  
> 有了仓库功能，缓存组件就会失效（因为可以提供更高级的缓存）

```javascript
// 删除不必要的代码
import {Link} from "react-router-dom";
import {createBrowserRouter, store, createRouterStore} from "react-browser-router-store";

// 创建一个仓库，仓库就是一个函数，仓库的状态初始值为 null
// 函数会在路由进入前调用，返回值就是仓库的状态
const indexStore = createRouterStore(async ({state}) => {
  if (state !== null) return state;
  return {
    count: 0,
  };
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index/>,
    meta: {
      [store]: indexStore,
    }
  },
  {
    path: "/foo",
    element: <Foo/>,
  },
]);
```

```javascript
function Index() {
  // 类似于 useState
  // 解构出状态，setStore必须传一个函数，对仓库状态直接修改
  const [{state}, setStore] = router.useRouterStoreState();
  return (
    <div>
      <h1>index - {state.count}</h1>
      <button onClick={() => setStore(state => {
        state.count += 1;
      })}>add
      </button>
      <Link to="/foo">
        <h1>foo</h1>
      </Link>
    </div>
  );
}

// 反思：逻辑在组件内部！业务逻辑很复杂，逻辑应该放到组件外面
```

```javascript
const reducers = {
  add: (state) => {
    state.count += 1;
  }
}

function Index() {
  // 类似于 useReducer
  // dispatch是一个函数，传递 action，action 是一个对象，必须要有 type
  const [{state}, dispatch] = router.useRouterStoreReducer(reducers);
  return (
    <div>
      <h1>index - {state.count}</h1>
      <button onClick={() => dispatch({type: "add"})}>add</button>
      <Link to="/foo">
        <h1>foo</h1>
      </Link>
    </div>
  );
}

// 反思：目前遇到的仓库，状态在一堆，操作状态的行为在一堆，和 hooks 思想不符
```

```javascript
// 将数据，操作数据行为放到一个函数中
function makeCount() {
  const count = 0;

  function add(state) {
    state.count += 1;
  }

  return {
    count,
    add,
  }
}

const indexStore = createRouterStore(async ({state}) => {
  if (state !== null) return state;
  return {
    ...makeCount(),
  };
});

function Index() {
  // 组合式
  const [{state}, dispatch] = router.useRouterStoreCompose();
  return (
    <div>
      <h1>index - {state.count}</h1>
      <button onClick={() => dispatch({type: state.add})}>add</button>
      <Link to="/foo">
        <h1>foo</h1>
      </Link>
    </div>
  );
}

// 反思：hooks 应该包括 3 部分
// 1. 数据
// 2. 操作数据的行为
// 3. 数据改变后的副作用
// 现在缺少副作用
```

```javascript
import {createBrowserRouter, store, createRouterStore, makeEffect} from "react-browser-router-store";

function makeCount() {
  const count = 0;

  function add(state) {
    state.count += 1;
  }

  // 添加副作用，功能类似 useEffect，返回一个元组，将 useEffect两个参数颠倒过来
  makeEffect(({state}, dispatch) => {
    return [
      // 依赖
      [state.count],
      // 依赖改变后的操作
      (newValue, oldValue) => {
        console.log(newValue, oldValue);
        // 返回清理函数
        return () => {

        };
      }
    ];
  });

  return {
    count,
    add,
  }
}

// 现在是一个完整的 hooks 了
```

```javascript
import {
  createBrowserRouter,
  store,
  createRouterStore,
  makeEffect,
  createReducerHandle
} from "react-browser-router-store";

function makeCount() {
  const count = 0;

  // 已经有结果，直接对状态进行修改
  function add(state) {
    state.count += 1;
  }

  // 先加工数据，然后返回一个新的 action
  const addDelay = createReducerHandle(async (state, action) => {
    await new Promise(resolve => setTimeout(resolve, action.delay));
    return {type: add};
  })

  return {
    count,
    add,
    addDelay,
  }
}

function Index() {
  const [{state}, dispatch] = router.useRouterStoreCompose();
  return (
    <div>
      <h1>index - {state.count}</h1>
      <button onClick={async (e) => {
        e.target.disabled = true;
        await dispatch({type: state.addDelay, delay: 1000});
        e.target.disabled = false;
      }}>add
      </button>
      <Link to="/foo">
        <h1>foo</h1>
      </Link>
    </div>
  );
}
```

```javascript
// 将 Index 组件挪到 components/Index.jsx 中
import {Link} from "react-router-dom";
import {
  createReducerHandle,
  createRouterStore,
  useRouter,
  createComponentWithStore
} from "react-browser-router-store";

function makeCount() {
  const count = 0;

  function add(state) {
    state.count += 1;
  }

  const addDelay = createReducerHandle(async (state, action) => {
    await new Promise(resolve => setTimeout(resolve, action.delay));
    return {type: add};
  })

  return {
    count,
    add,
    addDelay,
  }
}

const indexStore = createRouterStore(async ({state}) => {
  if (state !== null) return state;
  return {
    ...makeCount(),
  };
});

function Index() {
  const [{state}, dispatch] = useRouter().useRouterStoreCompose();
  return (
    <div>
      <h1>index - {state.count}</h1>
      <button onClick={async (e) => {
        e.target.disabled = true;
        await dispatch({type: state.addDelay, delay: 1000});
        e.target.disabled = false;
      }}>add
      </button>
      <Link to="/foo">
        <h1>foo</h1>
      </Link>
    </div>
  );
}

// 导出组件和仓库
export default createComponentWithStore(Index, indexStore);

// App.jsx
import Index from "./components/Index";

const router = createBrowserRouter([
  {
    path: "/",
    // 会对 componet 进行处理，创建 element
    component: Index,
  },
  {
    path: "/foo",
    element: <Foo/>,
  },
]);
```

```javascript
import {lazyWithStore} from "react-browser-router-store";

// 路由懒加载
const Index = lazyWithStore(() => import("./components/Index"));
```

> 在仓库中也可以实现 hooks 思想

### 优化

> 在组件内使用路由相关的 hooks 时，切换路由会多渲染一次

```javascript
import {routerStoreCompose, useRouterStore} from "react-browser-router-store";

function Index() {
  // useRouterStore获取仓库
  const [{state}, dispatch] = useRouterStore();
  return (
    <div>
      <h1>index - {state.count}</h1>
      <button onClick={async (e) => {
        e.target.disabled = true;
        await dispatch({type: state.addDelay, delay: 1000});
        e.target.disabled = false;
      }}>add
      </button>
      <Link to="/foo">
        <h1>foo</h1>
      </Link>
    </div>
  );
}

// 使用 routerStoreCompose 包装一下组件
export default createComponentWithStore(routerStoreCompose(Index), indexStore);
```

```text
routerNativeHooks
routerStore         ->  router.useRouterStore
routerStoreState    ->  router.useRouterStoreState
routerStoreReducer  ->  router.useRouterStoreReducer
routerStoreCompose  ->  router.useRouterStoreCompose

对组件进行包装，防止路由切换时多渲染一次
```

```javascript
import {
  createReducerHandle,
  createRouterStore,
  createComponentWithStore,
  routerStoreCompose,
  useRouterStore,
  useRouterHooks,
} from "react-browser-router-store";

function Index() {
  // 获取仓库
  const [{state}, dispatch] = useRouterStore();
  // 获取路由 hooks
  const {location} = useRouterHooks();
  return (
    <div>
      <h1>index - {state.count}</h1>
      <button onClick={async (e) => {
        e.target.disabled = true;
        await dispatch({type: state.addDelay, delay: 1000});
        e.target.disabled = false;
      }}>add
      </button>
      <Link to="/foo">
        <h1>foo</h1>
      </Link>
    </div>
  );
}

// 不会影响组件渲染的路由 hooks 放这里
// 影响组件渲染的路由 hooks 放组件中，比如: useNavigation、useActionData
export default createComponentWithStore(routerStoreCompose(Index, () => ({
  location: useLocation(),
})), indexStore);
```

### 组件

> `Show`  管理一个 `promise`  
> `ShowList`  `Resolve`  管理多个 `promise`

> 思考：一般组件从外部接口获取数据，我们的写法是...
> 1. 先创建一个状态
> 2. 组件挂载后在副作用中请求接口，设置状态

> 问题
> 1. 组件多次渲染
> 2. 数据瀑布

> `react` 有一个实验性的hook  `use`，我们对这个功能简单封装了一下

```javascript
import {useState} from "react";
import {Show} from "react-browser-router-store";

function Foo() {
  // 接口请求数据
  // setData 可以传 promise 或 值
  const [data, setData] = useState(() => Promise.resolve("hello world"));
  return (
    <div>
      {/* resolve 可以是 promise 或 值 */}
      {/* loading 在 promise 完成前显示 */}
      <Show resolve={data} loading={<h1>loading...</h1>}>
        {/* value 是 promise 的结果 */}
        {value => <h1>{value}</h1>}
      </Show>
    </div>
  );
}

// 请求接口数据现在就像组件中的一个普通状态
```

```javascript
import {useState} from "react";
import {ShowList, Resolve} from "react-browser-router-store";

async function sleep(delay, value) {
  await new Promise(resolve => setTimeout(resolve, delay));
  return value;
}

// 有的时候，组件可能依赖多个 外部接口数据
// 等所有数据准备好了，统一显示
function Foo() {
  const [data1, setData1] = useState(() => sleep(1000, "hello world"));
  const [data2, setData2] = useState(() => sleep(2000, "hi"));
  return (
    <div>
      <ShowList loading={<h1>loading...</h1>}>
        <Resolve resolve={data1}>
          {value => <h1>{value}</h1>}
        </Resolve>
        <Resolve resolve={data2}>
          {value => <h1>{value}</h1>}
        </Resolve>
      </ShowList>
    </div>
  );
}
```

---

***完结 ~***

___