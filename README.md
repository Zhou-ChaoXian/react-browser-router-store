# react-browser-router-store

## 简介

> 封装 `react` 浏览器端路由（`react-router-dom v6`）  
> 简单、强大的 `react` 路由管理工具

## 功能

1. [过渡（`transition`，路由切换提供过渡或动画效果）](#添加过渡效果)
2. [缓存（`keepalive`，缓存路由组件）](#缓存)
3. [重定向（`redirect`，重定向到其他路由）](#重定向)
4. [别名（`alias`，一个路由有多个路径）](#别名)
5. [增强（`enhancer`，对路由进行布局增强，每次切换路由主动调用）](#增强)
6. [包装（`wrapper`，用组件对路由进行包装）](#包装)
7. [拆分（`views`，对路由组件进行拆分，动态配置）](#拆分路由组件)
8. [错误（`guardError`，在进入下一个路由前发生错误，进行处理）](#错误)
9. [通用设置（`global`，设置通用的效果）](#通用设置)
10. [**仓库（`store`，路由仓库，每一个路由都可以拥有一个仓库）**](#仓库)
11. [导航守卫（`beforeEach  afterEach`，在路由切换前后进行处理）](#导航守卫)
12. [动态路由（`addRoutes`，添加路由）](#动态路由)
13. [优化（防止路由组件切换多渲染一次）](#优化)
14. [组件 - 1（`Show` 管理 `promise` 的组件）](#组件1)
15. [组件 - 2（`Transition` 过渡效果的组件）](#组件2)
16. [组件 - 3（`Keepalive` 缓存效果的组件）](#组件3)
17. [优化过渡组件和缓存组件（组件外层多一层 `div`）](#优化过渡和缓存组件)
18. [组件 - 4（`ViewTransition` 使用视图过渡 api 的过渡效果组件）](#组件4)
19. [优化视图过渡组件（组件外层多一层 `div`）](#优化视图过渡组件)
20. [组件 - 5（`Await`，处理形式意义上的 `async` 函数组件）](#组件5)
21. [定义异步组件（`defineAsyncComponent`）](#异步组件)

> 功能 ***1 - 10***，在路由对象中加了 `meta` 属性，他们都是 `symbol`

```javascript
const router = createBrowserRouter([
  {
    path: "/",
    element: <Index/>,
    meta: {
      [alias]: ["/index", "/ind"],
      [transition]: {
        type: "transition",
      },
      [keepalive]: {
        include: () => true,
      },
    }
  }
]);
```

## 安装

```text
npm install react-browser-router-store
```

## 教程

> 没有教程，一起实现一个简单的 **React** 项目即可  
> ***学的开心 ~***

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

> 修改很简单，只需 2 步
> 1. 导入换一下
> 2. RouterProvider 前面添加一个 router 即可

> 功能正常，并且已具备额外功能

### 添加过渡效果

> 过渡组件的props 类似 vue 的过渡组件  
> name: 默认是 v
>
> `${name}-enter-from` 进入之前的样式  
> `${name}-enter-active` 进入时如何过渡  
> `${name}-enter-to` 进入后的样式
>
> `${name}-leave-from` 离开之前的样式  
> `${name}-leave-active` 离开时如何过渡  
> `${name}-leave-to` 离开后的样式
>
> `onEnter(el)` 如何进入，el 是根元素  
> `onLeave(el, done)` 如何离开，el 是根元素，done 离开结束后调用

```text
type: "transition" | "animation" | "animate" | undefined

1. transition   ->   css 过渡效果
2. animation    ->   css 动画效果
3. animate      ->   js  动画效果
4. undefined    ->       没有效果
```

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
        // css过渡效果
        type: "transition",

        // css动画效果
        // name: "test",
        // type: "animation",

        // js动画效果
        // type: "animate",
        onEnter: (el) => {
          el.animate([
            {opacity: "0", transform: "scale(0.9)"},
            {opacity: "1", transform: "none"},
          ], {
            duration: 500,
            easing: "linear"
          })
        },
        onLeave: (el, done) => {
          const animate = el.animate([
            {opacity: "1", transform: "none"},
            {opacity: "0", transform: "scale(0.9)"},
          ], {
            duration: 500,
            easing: "linear"
          });
          // 一定要调用 done
          animate.finished.then(() => done());
        }
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
// 最多缓存 10 个路由，最后访问的 10 个路由
// 要改变数量，用 max
// max > 0，缓存 max 个
// max <= 0，全部缓存
import {max} from "react-browser-router-store";

const router = createBrowserRouter([], undefined, {
  [max]: 0  // 全部缓存
});
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
      // 这里只能用函数设置值
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

```javascript
// 子路由占位
// 在子路由中 使用 useOutletContext 获取传递的 context
// 使用 react-router-dom 的 Outlet，子路由缓存会失效
import {Outlet, useOutletContext} from "react-browser-router-store";

function Foo() {
  return (
    <div>
      <h1>foo</h1>
      <Link to="/">
        <h1>index</h1>
      </Link>
      <Outlet context={"hello"}/>
    </div>
  );
}
```

> 快试一试效果， <kbd>f12</kbd> 打开浏览器控制台，查看元素，看看切换路由后 dom 的情况。  
> 给组件添加状态并修改状态（`useState`），切换路由并查看状态是否保留

### 别名

> 一个路由可能存在多个路径，但是要保证 ***路径的匹配模式*** 必须相同  
> ***注意：子路由的路径，不能以 / 开头***  
> ***因为子路由的路径必须包含父路由的路径，现在父路由有多个***

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
      },
      [keepalive]: {
        include: () => true,
      },
      [enhancer]: [
        next => () => {
          return (
            <>
              <h1>enhancer1</h1>
              {next()}
            </>
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
      },
      [keepalive]: {
        include: () => true,
      },
      [enhancer]: [
        next => () => {
          return (
            <>
              <h1>enhancer1</h1>
              {next()}
            </>
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
    <>
      <h1>IndexWrapper</h1>
      {children}
    </>
  );
}
```

```javascript
// [wrapper]: [[IndexWrapper, {name: "james", age: 39}]]
// 也可以是元组，第二个元素是组件的props

function IndexWrapper({name, age, children}) {
  return (
    <>
      <h1>IndexWrapper - {name} - {age}</h1>
      {children}
    </>
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

> 通过 `router.routes` 获取所有路由，在其中添加路由数据  
> `router.addRoutes(router.routes)` 返回一个 promise，拿到新的 `navigate`  
> ***注意：***
> 1. ***旧的 `navigate` 已失效，只能使用新的***
> 2. ***必须等 `promise` 完成***

```javascript
// 添加路由通常在登录页面中，一般和路由守卫配合
router.beforeEach(async (to, from, navigateGuard) => {
  // 判断
  if (!router.hasRoute("/bar")) {
    if (to.pathname !== "/login") {
      // 跳转到登录页面
      navigateGuard.next("/login?redirect=" + encodeURIComponent(to.pathname));
    }
  }
});

function Login() {
  // 获取 redirect 地址
  let redirect = useSearchParams()[0].get("redirect");
  if (redirect === null) {
    redirect = "/"
  } else {
    redirect = decodeURIComponent(redirect);
    if (redirect === "/login")
      redirect = "/";
  }

  async function login() {
    // 从接口获取路由数据
    const newRoutes = await getRoutesByApi();
    // 转换路由数据
    const routes = handle(newRoutes);
    // 添加进当前路由
    router.routes.push(...routes);
    const navigate = await router.addRoutes(router.routes);
    // 跳转
    navigate(redirect, {replace: true});
  }

  return (
    <button onClick={login}>login</button>
  );
}
```

```javascript
// 直接在路由守卫中添加
router.beforeEach(async (to, from, navigateGuard) => {
  // 判断
  if (!router.hasRoute("/bar")) {
    // 从接口获取路由数据
    const newRoutes = await getRoutesByApi();
    // 转换路由数据
    const routes = handle(newRoutes);
    // 添加进当前路由
    router.routes.push(...routes);
    const navigate = await router.addRoutes(router.routes);
    // 注意  navigateGuard.next 已失效
    // 如果想导航到其他路由，请使用新的 navigate
  }
});
```

### 拆分路由组件

> 将一个大的路由组件拆分成多个小组件，动态配置

```javascript
import {createBrowserRouter} from "react-browser-router-store";

const router = createBrowserRouter([
  {
    path: "/foo",
    element: <Foo/>,
  }
]);

// 接下来拆分 Foo 组件
function Foo() {
  return (
    <div>
      {/* 放到 Foo1 组件中 */}
      <h1>hello world</h1>
      {/* 放到 Foo2 组件中 */}
      <div>
        <h1>hi</h1>
        {/* 放到 Foo21 组件中 */}
        <h1>你好</h1>
      </div>
    </div>
  );
}
```

```javascript
import {createBrowserRouter, views, RouteView} from "react-browser-router-store";

const router = createBrowserRouter([
  {
    path: "/foo",
    element: <Foo/>,
    meta: {
      [views]: {
        default: {component: Foo1},
        foo2: {component: Foo2, children: {default: {component: Foo21}}},
      }
    }
  }
]);

function Foo() {
  return (
    <div>
      {/* name 默认是 default */}
      <RouteView/>
      <RouteView name="foo2"/>
    </div>
  );
}

function Foo1() {
  return <h1>hello world</h1>
}

function Foo2() {
  return (
    <div>
      <h1>hi</h1>
      <RouteView/>
    </div>
  );
}

function Foo21() {
  return <h1>你好</h1>
}

// 将当前路由拆分成多个小组件，动态配置，扩展性大大加强
// views 提供了一种拆分路由组件的方式，根据实际情况判断是否使用
```

> 通过 `RouteView` 给组件传递 `props` `children`

```javascript
// 删除不必要的代码，只保留 Foo 和 Foo1 组件演示
import {createBrowserRouter, views, RouteView} from "react-browser-router-store";

const router = createBrowserRouter([
  {
    path: "/foo",
    element: <Foo/>,
    meta: {
      [views]: {
        // component 组件，props 属性
        default: {component: Foo1, props: {name: "james"}},
      }
    }
  }
]);

function Foo() {
  return (
    <div>
      <RouteView/>
    </div>
  );
}

// 可以拿到路由中对应的 props
function Foo1({name}) {
  return (
    <div>
      <h1>{name}</h1>
    </div>
  );
}
```

```javascript
import {createBrowserRouter, views, RouteView} from "react-browser-router-store";

const router = createBrowserRouter([
  {
    path: "/foo",
    element: <Foo/>,
    meta: {
      [views]: {
        default: {component: Foo1, props: {name: "james"}},
      }
    }
  }
]);

function Foo() {
  const message = "test";
  return (
    <div>
      <RouteView>
        <h1>hello</h1>
        <h1>{message}</h1>
      </RouteView>
    </div>
  );
}

// 可以拿到 Foo 组件中 RouteView 的 children
function Foo1({name, children}) {
  return (
    <div>
      <h1>{name}</h1>
      {children}
    </div>
  );
}
```

```javascript
import {createBrowserRouter, views, RouteView} from "react-browser-router-store";

const router = createBrowserRouter([
  {
    path: "/foo",
    element: <Foo/>,
    meta: {
      [views]: {
        default: {component: Foo1, props: {name: "james"}},
      }
    }
  }
]);

// RouteView的子元素是个函数
function Foo() {
  const message = "test";
  return (
    <div>
      <RouteView>
        {/* Component props 对应路由中的配置，分别是 Foo1 和 {name: "james"} */}
        {(Component, props) => {
          return (
            <Component {...props} message={message}>
              <h1>hello</h1>
            </Component>
          );
        }}
      </RouteView>
    </div>
  );
}

function Foo1({name, message, children}) {
  return (
    <div>
      <h1>{name}</h1>
      {children}
      <h1>{message}</h1>
    </div>
  );
}
```

### 错误

> 在跳转到下一个路由前，需要处理的逻辑可能报错，有些错误是故意抛出的，无需在意

```javascript
import {guardError} from "react-browser-router-store";

// 在 meta 中添加
// [guardError]: (error) => {
//   console.log(error);
// }
```

### 通用设置

> 快速设置通用效果... 过渡、缓存、增强、包装、错误

```javascript
import {createBrowserRouter, transition, keepalive, enhancer, wrapper, guardError} from "react-browser-router-store";

// 快速设置所有路由的效果
const router = createBrowserRouter([], undefined, {
  [transition]: {},
  [keepalive]: {},
  [enhancer]: [],
  [wrapper]: [],
  [guardError]: () => {
  }
});

// 快速设置当前路由全部子路由的效果
const router = createBrowserRouter([
  {
    path: "/foo",
    element: <Foo/>,
    meta: {
      [global]: {
        [transition]: {},
        [keepalive]: {},
        [enhancer]: [],
        [wrapper]: [],
        [guardError]: () => {
        }
      }
    },
    children: [...]
  }
]);

// 优先级从高到底
// 局部设置  ->  父部设置  ->  全局设置  
```

### 仓库

> 称之为路由仓库，每个路由都可以拥有一个仓库，可以保留状态或不保留

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
  // dispatch调用，会从 reducers 中选择 type，选中函数，然后执行
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

// 反思：仓库的状态在一堆，操作状态的行为在一堆，和 hooks 思想不符
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
  // dispatch是一个函数，传递 action，action 是一个对象，必须要有 type
  // dispatch调用，type 是一个函数，直接执行这个函数
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

// 反思：一个完整的 hook 应该包括 3 部分
// 1. 数据
// 2. 操作数据的行为
// 3. 数据改变后的副作用
// 现在缺少副作用
```

> ***注意：副作用仅限于 `router.useRouterStoreCompose`***

```text
副作用包含三个函数，对应功能如下：

1. makeEffect    ->  useEffect
2. makeMemo      ->  useMemo
3. makeCallback  ->  useCallback
```

```javascript
import {
  createBrowserRouter,
  store,
  createRouterStore,
  makeEffect,
  makeMemo,
  makeCallback,
} from "react-browser-router-store";

function makeCount() {
  const count = 0;

  function add(state) {
    state.count += 1;
  }

  // 添加副作用，功能类似 useEffect，返回一个元组，将 useEffect两个参数颠倒过来
  makeEffect(({state}, dispatch) => {
    return [
      // 依赖数组
      [state.count],
      // 依赖改变后的操作，newValue oldValue 对应依赖数组，oldValue第一次为 undefined
      (newValue, oldValue) => {
        console.log(newValue, oldValue);
        // 返回清理函数，下一次操作执行前，它会执行
        return () => {

        };
      }
    ];
  });

  // 功能类似 useMemo，依赖改变后重新计算
  // 通过  countCalc.value 拿到结果
  const countCalc = makeMemo(
    // 依赖数组
    ({state}) => [state.count],
    // 依赖改变后的操作
    (newValue, oldValue) => {
      return newValue[0] + 1;
    }
  );

  // 功能类似 useCallback，依赖改变后重新生成函数
  // 通过 func.value 拿到结果
  // 调用函数 func.value(1, 2, 3)  最后两个参数 newValue oldValue 会自动添加
  const func = makeCallback(
    ({state}) => [state.count],
    (a, b, c, newValue, oldValue) => {
      console.log(a, b, c, newValue, oldValue);
    }
  );

  return {
    count,
    countCalc,
    add,
    func,
  };
}

// 现在是一个完整的 hook 了
// count         ->  仓库中的一个数据
// add           ->  修改数据
// makeEffect    ->  监控 count，改变后执行相关操作，并有清理函数
// makeMemo      ->  监控 count，改变后重新计算
// makeCallback  ->  监控 count，改变后重新生成函数
// 反思：add 直接对状态修改，是同步的，现在缺少异步的
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

  // 已经有结果，直接对状态进行修改 （同步修改）
  function add(state) {
    state.count += 1;
  }

  // 先加工数据，然后返回一个新的 action （异步修改）
  // 因为返回的是一个新的 action，所以可以链式的进行调用
  // 比如：返回 {type: addDelay1, ...} -> {type: addDelay2, ...} -> ...  -> {type: add}
  // addDelay1  addDelay2 都是通过 createReducerHandle 创建的
  // 最后返回 同步 的 action，对状态直接进行修改
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

// makeCount 是一个完整的 hook
// 但是仅适用于 router.useRouterStoreCompose
// 因为其他的不会生效，而且副作用开销还是挺大的
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
routerNative        ->  没有使用仓库
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

// 有两个参数：1. 组件  2. 函数
// 不会影响组件渲染的路由 hooks 放这里的函数里面
// 影响组件渲染的路由 hooks 放组件中，比如: useNavigation、useActionData
export default createComponentWithStore(routerStoreCompose(Index, () => ({
  location: useLocation(),
})), indexStore);
```

### 组件1

> `Show`  管理一个 `promise`  
> `ShowList`  `Resolve`  管理多个 `promise`，共用一个加载状态  
> `ShowOrder`  管理多个 `Show`，让其按照一定规则展示结果

> 思考：一般组件从外部接口获取数据，我们的写法是...
> 1. 先创建一个状态
> 2. 组件挂载后在副作用中请求接口，设置状态

> 问题
> 1. 组件多次渲染
> 2. 数据瀑布

> `react` 有一个实验性的hook  `use`，我们对这个功能简单封装了一下

```javascript
// Show 组件
import {useState} from "react";
import {Show} from "react-browser-router-store";

function Foo() {
  // 接口请求数据
  // setData 可以传 promise 或 值
  // 如果 setData 设置了一个 promise，就会先展示 loading，promise 完成后 展示内容
  // 如果 setData 设置 promise，还想展示旧的内容，请看下一个示例
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
import {Show} from "react-browser-router-store";

let count = 0;

async function getData() {
  await new Promise(resolve => setTimeout(resolve, 1000));
  count += 1;
  return "hello " + count;
}

function Foo() {
  const [data, setData] = useState(() => getData());
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => {
        setCount(count + 1);
        // 每次都会展示 loading 效果
        setData(getData());
      }}>
        <h1>add</h1>
      </button>
      <Show resolve={data} loading={<h1>loading...</h1>}>
        {value => <h1>{value}</h1>}
      </Show>
    </div>
  );
}

// 如何展示旧内容，不展示 loading（注意：但是第一次肯定是 loading）
// ====================================================
// ====================================================
// 方法一
import {useDeferredValue} from "react";

function Foo() {
  const [data, setData] = useState(() => getData());
  // 使用 useDeferredValue 包装一下值
  const deferredData = useDeferredValue(data);
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => {
        setCount(count + 1);
        setData(getData());
      }}>
        <h1>add</h1>
      </button>
      {/* 使用包装过的值，就会展示旧的内容，不展示 loading */}
      <Show resolve={deferredData} loading={<h1>loading...</h1>}>
        {value => <h1>{value}</h1>}
      </Show>
    </div>
  );
}

// ====================================================
// ====================================================
// 方法二
import {startTransition} from "react";

// 如果需要 标记，使用 import {useTransition} from "react";

function Foo() {
  const [data, setData] = useState(() => getData());
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => {
        setCount(count + 1);
        // 设置值用 startTransition 包装一下
        startTransition(() => {
          setData(getData());
        });
      }}>
        <h1>add</h1>
      </button>
      <Show resolve={data} loading={<h1>loading...</h1>}>
        {value => <h1>{value}</h1>}
      </Show>
    </div>
  );
}

// ====================================================
// ====================================================
// 方法三
function Foo() {
  const [data, setData] = useState(() => getData());
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1>{count}</h1>
      <button onClick={async () => {
        setCount(count + 1);
        const data = await getData();
        setData(data);
      }}>
        <h1>add</h1>
      </button>
      <Show resolve={data} loading={<h1>loading...</h1>}>
        {value => <h1>{value}</h1>}
      </Show>
    </div>
  );
}
```

```javascript
// ShowList  Resolve 组件
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

```javascript
// ShowOrder  Show 组件
import {ShowOrder, Show} from "react-browser-router-store";

async function sleep(delay, value) {
  await new Promise(resolve => setTimeout(resolve, delay));
  return value;
}

// 组件依赖多个外部接口，有的时候，必须按照接口的顺序去展示结果
// 如下，同时请求3个接口，但是必须 p1 展示结果后，在展示 p2，在展示 p3
// 总共4中情况：
// 1. mode -> "forward"               展示顺序  p1 p2 p3
// 2. mode -> "backward"              展示顺序  p3 p2 p1
// 3. mode -> "together"              展示顺序  一起完成后统一展示
// 4. mode -> undefined（组件不写mode） 展示顺序  先完成先展示
function Foo() {
  const p1 = sleep(3000, "hello");
  const p2 = sleep(2000, "hi");
  const p3 = sleep(1000, "你好");
  return (
    <div>
      <ShowOrder mode="forward">
        <Show resolve={p1} loading={<h1>loading...</h1>}>
          {value => <h1>{value}</h1>}
        </Show>
        <Show resolve={p2} loading={<h1>loading...</h1>}>
          {value => <h1>{value}</h1>}
        </Show>
        <Show resolve={p3} loading={<h1>loading...</h1>}>
          {value => <h1>{value}</h1>}
        </Show>
      </ShowOrder>
    </div>
  );
}
```

### 组件2

> `Transition`  
> 组件切换时提供过渡效果

```javascript
import {Transition} from "react-browser-router-store";

// global.css
//
// .v-enter-from, .v-leave-to {
//   opacity: 0;
//   transform: scale(.9);
// }
//
// .v-enter-active, .v-leave-active {
//   transition: all .5s linear;
// }

function Foo() {
  const elements = {
    foo: "Foo Component",
    bar: "Bar Component",
  };
  const [key, setKey] = useState("foo");
  return (
    <div>
      <button onClick={() => setKey("foo")}>
        <h1>foo</h1>
      </button>
      <button onClick={() => setKey("bar")}>
        <h1>bar</h1>
      </button>
      <Transition type="transition" uniqueKey={key}>
        {elements[key]}
      </Transition>
    </div>
  );
}
```

### 组件3

> `Keepalive`  
> 组件切换保留 dom，提供缓存效果

```javascript
import {Keepalive} from "react-browser-router-store";

function Foo() {
  const elements = {
    foo: "Foo Component",
    bar: "Bar Component",
  };
  const [key, setKey] = useState("foo");
  return (
    <div>
      <button onClick={() => setKey("foo")}>
        <h1>foo</h1>
      </button>
      <button onClick={() => setKey("bar")}>
        <h1>bar</h1>
      </button>
      <Keepalive uniqueKey={key} include={() => true}>
        {elements[key]}
      </Keepalive>
    </div>
  );
}
```

### 优化过渡和缓存组件

> 通过查看 dom 发现，`Transition` 和 `Keepalive` 组件外层多一层 `div`  
> 可能会影响布局

> 解决方法：使用 `forwardRef` 创建组件，指定 `ref`       
> ***注意：必须要设置 `ref`，不然会报错***  
> ***不要用 `useImperativeHandle` 处理 `ref`***

```javascript
import {forwardRef, useState} from "react";
import {Transition, Keepalive} from "react-browser-router-store";

function Foo() {
  const elements = {
    bar: <Bar/>,
    tee: <Tee/>,
  };
  const [key, setKey] = useState("bar");
  return (
    <div>
      <button onClick={() => setKey("bar")}>
        <h1>bar</h1>
      </button>
      <button onClick={() => setKey("tee")}>
        <h1>tee</h1>
      </button>
      <Transition type="transition" uniqueKey={key}>
        {elements[key]}
      </Transition>
      <hr/>
      <Keepalive uniqueKey={key} include={() => true}>
        {elements[key]}
      </Keepalive>
    </div>
  );
}

// 通过 forwardRef 创建组件
// 必须要设置 ref，否则会报错
const Bar = forwardRef((props, ref) => {
  return (
    <h1 ref={ref}>bar</h1>
  );
});

const Tee = forwardRef((props, ref) => {
  return (
    <h1 ref={ref}>tee</h1>
  );
});
```

### 组件4

> `ViewTransition`  
> 视图过渡 view transition 提供了更丝滑的过渡效果  
> 可能浏览器不支持  
> 有兴趣可以试一试  
> 没有将功能合并进 `Transition` 的原因如下：  
> ***页面中如果存在多个 view transition name，名字必须不一样，不通用***  
> ***所以单独分出来***

```css
/*全局 css 样式*/

::view-transition-old(root), ::view-transition-new(root) {
  animation: none;
}

::view-transition-old(test) {
  animation: view-show1 .5s linear 1 forwards;
}

::view-transition-new(test) {
  animation: view-show2 1s linear 1 forwards;
}

@keyframes view-show1 {
  from {
    opacity: 1;
    transform: none;
    clip-path: circle(100%);
  }
  to {
    opacity: 0;
    transform: scale(.8);
    clip-path: circle(0);
  }
}

@keyframes view-show2 {
  from, 50% {
    opacity: 0;
    transform: scale(.8);
    clip-path: circle(0);
  }
  to {
    opacity: 1;
    transform: none;
    clip-path: circle(100%);
  }
}
```

```javascript
import {useState} from "react";
import {ViewTransition} from "react-browser-router-store";

function Foo() {
  const elements = {
    bar: <Bar/>,
    tee: <Tee/>,
  };
  const [key, setKey] = useState("bar");
  return (
    <div>
      <button onClick={() => setKey("bar")}>
        <h1>bar</h1>
      </button>
      <button onClick={() => setKey("tee")}>
        <h1>tee</h1>
      </button>
      <ViewTransition
        name="test"
        uniqueKey={key}
        onViewTransition={(el, startViewTransition) => {
          // 必须要调用
          startViewTransition();
        }}
      >
        {elements[key]}
      </ViewTransition>
    </div>
  );
}

function Bar() {
  return (
    <div style={{height: "100px", backgroundColor: "lightpink"}}>
      <h1>bar</h1>
    </div>
  );
}

function Tee() {
  return (
    <div style={{height: "200px", backgroundColor: "lightgreen"}}>
      <h1>tee</h1>
    </div>
  );
}
```

### 优化视图过渡组件

> 查看 dom 会发现 Bar 组件 Tee 组件外层多了一层 div，可能会影响布局

> 解决方法：使用 `forwardRef` 创建组件，指定 `ref`       
> ***注意：必须要设置 `ref`，不然会报错***  
> ***不要用 `useImperativeHandle` 处理 `ref`***

```javascript
import {useState, forwardRef} from "react";
import {ViewTransition, useViewTransition} from "react-browser-router-store";

function Foo() {
  const elements = {
    bar: <Bar/>,
    tee: <Tee/>,
  };
  const [key, setKey] = useState("bar");
  return (
    <div>
      <button onClick={() => setKey("bar")}>
        <h1>bar</h1>
      </button>
      <button onClick={() => setKey("tee")}>
        <h1>tee</h1>
      </button>
      <ViewTransition
        name="test"
        uniqueKey={key}
        onViewTransition={(el, startViewTransition) => {
          startViewTransition();
        }}
      >
        {elements[key]}
      </ViewTransition>
    </div>
  );
}

// 使用 forwardRef 包装组件
const Bar = forwardRef(function Bar(props, ref) {
  // 必须要调用
  useViewTransition(ref);
  return (
    // 设置 ref 指向 HTML 标签
    <div ref={ref} style={{height: "100px", backgroundColor: "lightpink"}}>
      <h1>bar</h1>
    </div>
  );
});

const Tee = forwardRef(function Tee(props, ref) {
  useViewTransition(ref);
  return (
    <div ref={ref} style={{height: "200px", backgroundColor: "lightgreen"}}>
      <h1>tee</h1>
    </div>
  );
});
```

### 组件5

> `Await`  
> 对 `Show` 组件的二次封装，将组件写成 `async` 函数  
> ***注意：不是真正的组件，只是一个函数，只是表面看起来像组件***

```javascript
import {Await} from "react-browser-router-store";

function Foo() {
  return (
    // 用 Await 包住组件
    // loading 在 promise 完成前展示
    // error 在 promise 报错后展示，是个函数 (error) => {}，函数拿到错误信息
    <Await loading={<h1>loading...</h1>} error={() => <h1>error...</h1>}>
      {/* Bar 不是组件，只是组件的写法 */}
      <Bar name="james" age={39}/>
    </Await>
  );
}

// Bar 不是组件，只是一个普通的异步函数，所以不能使用 hooks
async function Bar({name, age}) {
  // 请求外部数据的操作
  await new Promise(resolve => setTimeout(resolve, 1000));
  return (
    <div>
      <h1>{name} - {age}</h1>
    </div>
  );
}
```

> ***`Await` 在内部对比 新旧 props，如果新的 props 中有数据和旧的 props 不一样，会更新组件***

```javascript
import {useRef, useState} from "react";
import {Await} from "react-browser-router-store";

function Foo() {
  const [count, setCount] = useState(39);
  const buttonRef = useRef(null);
  return (
    <div>
      <h1>Foo - {count}</h1>
      <button ref={buttonRef} onClick={() => setCount(count + 1)}>add</button>
      <Await
        // 不显示 loading 效果，显示旧页面，但是第一次是 loading
        complete
        loading={<h1>loading...</h1>}
        // 开始前执行，让 button 不能点击
        onStart={() => buttonRef.current.disabled = true}
        // 结束后执行，恢复 button 点击
        onEnd={() => buttonRef.current.disabled = false}
        // 数据不一致，更新组件
        compare={(newProps, oldProps) => newProps.age !== oldProps.age}
      >
        <Bar name={"james"} age={count}/>
      </Await>
    </div>
  );
}

// 由此可以看出：Bar只是用来处理一些异步任务，没错就是这样
// 如果组件不需要 hooks，一个 Bar 组件即可
// 如果需要 hooks，添加子组件，将异步任务的结果传下去
// 中转异步任务的结果
// Bar 不是组件！！！只是形式
// Bar 不是组件！！！只是形式
// Bar 不是组件！！！只是形式
async function Bar({name, age}) {
  const data = await new Promise(resolve => setTimeout(resolve, 1000, "data"));
  return (
    <div>
      <h1>{name} - {age}</h1>
      <Tee data={data}/>
    </div>
  );
}

function Tee({data}) {
  useEffect(() => {
    console.log("hello");
  }, []);
  return (
    <div>
      <h1>{data}</h1>
    </div>
  );
}
```

> ***只是 `Show` 组件的另一种写法，仅此而已~***

### 异步组件

> `defineAsyncComponent`  
> 通过这个函数可以生成异步组件  
> 所谓异步组件，就是依赖外部接口数据的组件，***根本没有异步组件***  
> ***封装 `Await` 组件***  
> ***同样只是 `Show` 组件的另一种写法，仅此而已~***

```javascript
import {useRef, useState} from "react";
import {defineAsyncComponent, useAsyncValue} from "react-browser-router-store";

function Foo() {
  const [count, setCount] = useState(0);
  const buttonRef = useRef(null);
  return (
    <div>
      <h1>{count}</h1>
      <button ref={buttonRef} onClick={() => setCount(count + 1)}>add</button>
      <Bar
        name="james"
        age={count}
        // 开始前执行，让 button 不能点击
        onStart={() => {
          buttonRef.current.disabled = true;
        }}
        // 结束后执行，恢复 button 点击
        onEnd={() => {
          buttonRef.current.disabled = false;
        }}
      />
    </div>
  );
}

const Bar = defineAsyncComponent({
  // 组件名称
  name: "Bar",
  // 不显示 loading 效果，显示旧页面，但是第一次是 loading
  complete: true,
  // 加载效果
  loading: <h1>loading...</h1>,
  // 对比，数据不一致，更新组件
  compare: (newProps, oldProps) => {
    return newProps.age !== oldProps.age;
  },
  // 如果 props 发生变化，会调用，props 不包含 onStart onEnd
  loader: async ({age}) => {
    const data = await new Promise(resolve => setTimeout(resolve, 1000, age));
    return "hello world " + data;
  },
  // 组件，props 不包含 onStart onEnd
  Component: ({name, age}) => {
    // 获取 loader 的结果
    const data = useAsyncValue();
    return (
      <div>
        <h1>{name} - {age}</h1>
        <h1>{data}</h1>
      </div>
    );
  }
});
```

---

---

---

> 以上就是 `react-browser-router-store` 所有功能   
> 感谢您的观看  
> ***完结 ~***

## EOF