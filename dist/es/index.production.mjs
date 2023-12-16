import{produce as e}from"immer";import{useState as t,useMemo as r,useRef as n,useLayoutEffect as o,createElement as s,createContext as i,cloneElement as u,isValidElement as c,Fragment as l,useContext as a,Suspense as f,useEffect as h,Component as d,useCallback as p,useSyncExternalStore as m}from"react";import{useNavigate as v,useParams as g,useLocation as y,generatePath as b,Await as S,matchRoutes as w,RouterProvider as R,createBrowserRouter as E,createHashRouter as P}from"react-router-dom";const C=Symbol(),A=Symbol(),L=new Set([C,A]),x=[];function k(e){if("function"==typeof e)return q({request:e},j([]));const{request:t,reducers:r={},plugins:n=[],thunks:o=[],...s}=e;return q({request:t,reducers:r,plugins:n,options:s},j(o))}function q({request:t,reducers:r={},plugins:n=[],options:o={}},s){if("function"==typeof s)return s(q)({request:t,reducers:r,plugins:n,options:o});let i=!1,u=null,c=[];const l={state:null,detail:{},options:o,reducers:r,request:t,get isDisposed(){return i},get trigger(){return u},registerTrigger:e=>{"function"==typeof e&&(u=e)},unRegisterTrigger:()=>{u=null},dispatch:t=>{if(i)return;let n=!1;const{type:o}=t;if(L.has(o))n=!0;else{const s=r[o];if(s){const r=[l.state,t,l.detail,l.options],o="function"==typeof s?e(s).apply(void 0,r):e(s.handle).apply(void 0,r);n=o!==l.state,n&&(l.state=o)}}return n&&c.forEach((e=>e({state:l.state,detail:l.detail,options:l.options}))),n}};l.actions=Object.entries(r).reduce(((e,[t,r])=>(e[t]=(...e)=>{const n="function"==typeof r?e[0]:r.prepare?.(...e);return{type:t,payload:n}},e)),{}),l.subscribe=e=>{if(!i)return c.push(e),()=>{const t=c.findIndex((t=>t===e));return t>=0?c.splice(t,1):void 0}},l.init=e=>{e!==l.state&&(i&&(i=!1),l.state=e,l.dispatch({type:C}))},l.dispose=()=>{i||(u=null,i=!0,l.state=null,l.detail={},c=[])},l.reset=e=>{i||e===l.state||(l.state=e,l.dispatch({type:A}))};const a=(e,[t,r])=>"function"==typeof t?t(e,r)??l:t.install?.(e,r)??l;return n.reduce(a,x.reduce(a,l))}function T(e,t){return x.push([e,t]),()=>{const t=x.findIndex((t=>t[0]===e));return t>=0?x.splice(t,1):void 0}}function I(e=[]){return 0===e.length?e=>e:1===e.length?e[0]:e.reduce(((e,t)=>(...r)=>e(t(...r))))}const O=e=>t=>"function"==typeof t?t(e):e(t);function j(e=[]){return t=>r=>{const n=t(r);let o=n.dispatch;return n.dispatch=I([O,...e])((e=>(n.trigger?n.trigger([o,e]):o(e),e))),n}}const F=Symbol(),N=Symbol(),H=Symbol(),$={name:"routerStoreRequestHookPlugin",install:e=>{Object.defineProperties(e.detail,{[F]:{value:[]},[N]:{value:[]},[H]:{value:[]}})}};const K=Symbol("effects"),G=[],_={name:"routerStoreEffectPlugin",install:e=>{Object.defineProperties(e.detail,{[K]:{value:[]},memo:{value:{}}}),e.detail[F].push((()=>{G.length>0&&G.splice(0)})),e.detail[N].push((()=>{G.length>0&&0===e.detail[K].length&&e.detail[K].push(...G.splice(0))}))}};function D(e){G.push(e)}function M(e){return Reflect.get(e.detail,K)}function z({type:e,name:i="v",uniqueKey:u,disabled:c=!0,className:l,style:a={height:"100%"},enterFromClass:f,enterActiveClass:h,enterToClass:d,leaveFromClass:p,leaveActiveClass:m,leaveToClass:v,children:g}){const[y,b]=t(g),S=r((()=>({enterFromClass:f??`${i}-enter-from`,enterActiveClass:h??`${i}-enter-active`,enterToClass:d??`${i}-enter-to`,leaveFromClass:p??`${i}-leave-from`,leaveActiveClass:m??`${i}-leave-active`,leaveToClass:v??`${i}-leave-to`})),[u,f,h,d,p,m,v]),w=n(),R=n(!1);return o((()=>{if(c)return R.current||(R.current=!0),void b(g);const t={current:!0};switch(e){case"transition":return void(R.current?function(e,t,r,n){if(!r.current)return;r.current=!1;const{enterToClass:o,leaveFromClass:s,leaveActiveClass:i,leaveToClass:u}=t;e.classList.remove(o),e.classList.add(s,i),B((()=>{e.classList.remove(s),e.classList.add(u),e.addEventListener("transitionend",(function(){e.classList.remove(i,u),r.current||(n(),r.current=!0,W(e,t,r))}),{once:!0})}))}(w.current,S,t,(()=>b(g))):(R.current=!0,W(w.current,S,t)));case"animation":return void(R.current?function(e,t,r,n){if(!r.current)return;r.current=!1;const{leaveActiveClass:o}=t;e.classList.add(o),e.addEventListener("animationend",(function(){e.style.display="none",e.classList.remove(o),r.current||(n(),r.current=!0,B((()=>{J(e,t,r)})))}),{once:!0})}(w.current,S,t,(()=>b(g))):(R.current=!0,J(w.current,S,t)));default:R.current||(R.current=!0),b(g)}return()=>{t.current=!0}}),[u]),s("div",{ref:w,className:l,style:a,children:y,"data-type":"Transition"})}function B(e){requestAnimationFrame((()=>{requestAnimationFrame((()=>{e()}))}))}function W(e,t,r){if(!r.current)return;r.current=!1;const{enterFromClass:n,enterActiveClass:o,enterToClass:s}=t;e.classList.add(n,o),B((()=>{e.classList.remove(n),e.classList.add(s),e.addEventListener("transitionend",(function(){e.classList.remove(o),r.current=!0}),{once:!0})}))}function J(e,t,r){if(!r.current)return;r.current=!1;const{enterActiveClass:n}=t;e.style.display="",e.classList.add(n),e.addEventListener("animationend",(function(){e.classList.remove(n),r.current=!0}),{once:!0})}const Q=i(!1);function U({uniqueKey:e,max:t=10,include:r=X,exclude:o=X,style:i={height:"100%"},children:a}){const f=n(new Y).current,h=n(new Map).current,d=n(e),p=n(!0);if(!p.current){const{node:e}=h.get(d.current);h.delete(d.current),f.deleteItem(e),p.current=!0}if(h.has(e)){const t=h.get(e);t.element=u(t.element),t.isActive=!0,f.pushLast(t.node)}else{const r=f.addItem(e),n=c(a)?a:s(l,null,a);if(h.set(e,{element:n,isActive:!0,node:r}),t>0&&f.length>t)for(const e of f.iteratorCount(f.length-t))f.deleteItem(e),h.delete(e.item)}if(e!==d.current){const e=h.get(d.current);e&&(e.element=u(e.element),e.isActive=!1)}return d.current=e,r(e)&&!o(e)||(p.current=!1),[...f].map((({item:e})=>{const{element:t,isActive:r}=h.get(e);return s("div",{key:e,style:{...i,display:r?void 0:"none"},"data-type":"Keepalive"},s(Q.Provider,{value:r},t))}))}function V(e){const t=a(Q),r=n(null);o((()=>{if(t){const t=e();"function"==typeof t&&(r.current=t)}}),[t]),o((()=>{t||r.current&&(r.current?.(),r.current=null)}),[t]),o((()=>()=>{r.current&&r.current?.()}),[])}function X(){return!1}class Y{#e=null;#t=null;#r=0;#n(e){return{item:e,before:null,after:null}}addItem(e){const t=this.#n(e);return this.#e?(this.#t?(t.before=this.#t,this.#t.after=t):(t.before=this.#e,this.#e.after=t),this.#t=t):this.#e=t,this.#r+=1,t}deleteItem(e){if(0===this.#r)return;if(this.#r-=1,0===this.#r)return void(this.#e=null);if(e===this.#e)return this.#e=this.#e.after,this.#e.before=null,void(1===this.#r&&(this.#t=null));if(e===this.#t)return this.#t=this.#t.before,this.#t.after=null,void(1===this.#r&&(this.#t=null));const{before:t,after:r}=e;t.after=r,r.before=t}get length(){return this.#r}*[Symbol.iterator](){let e=0,t=this.#e;for(;e<this.#r;)yield t,t=t.after,e+=1}pushLast(e){this.#r<2||e===this.#t||(e===this.#e?(this.#e=e.after,this.#e.before=null):(e.before.after=e.after,e.after.before=e.before),this.#t.after=e,e.before=this.#t,e.after=null,this.#t=e)}*iteratorCount(e){const t=e>this.#r?this.#r:e;let r=0,n=this.#e;for(;r<t;)yield n,n=n.after,r+=1}}function Z({path:e,options:t,children:r}){const n=v(),s=g(),{search:i,hash:u}=y(),c=b(e,s);return o((()=>{n({pathname:c,search:i,hash:u},t)}),[]),r}const ee=Symbol(),te=Symbol(),re=Symbol(),ne=Symbol(),oe=Symbol();function se({resolve:e,loading:t=!1,error:r=(e=>!1),onStart:n,onEnd:i,children:u}){return o((()=>{n?.()})),s(pe,{fallback:r},s(f,{fallback:t},s(ce,{resolve:e,children:u,onEnd:i})))}function ie({loading:e=!1,timeout:t=0,delay:r=300,onStart:n,onEnd:i,children:u}){o((()=>{n?.()})),Array.isArray(u)||(u=[u]);const c=Array(u.length).fill(ee),a=t>0;let h=!1;const d=(e,t)=>(a&&(c[e]=t),t);let p=u.map(((e,t)=>{if(e?.type!==ue)return d(t,ae(te));const r=e.props.resolve;if(!(r instanceof Promise))return d(t,ae(r));if(Reflect.has(r,re))return Reflect.has(r,oe)?d(t,fe(Reflect.get(r,oe))):d(t,ae(Reflect.get(r,ne)));h=!0;const n=de(r);return a?n.then((e=>(c[t]=ae(e),e)),(e=>{throw c[t]=fe(e),e})):n}));h&&(p=Promise.allSettled(p.map((e=>e instanceof Promise?e:"fulfilled"===e.status?e.value:Promise.reject(e.reason)))).then((e=>he(r,e))));let m=p;if(a){const e=he(t+r,c).then((e=>e.map((e=>e===ee?fe(new le):e))));m=Promise.race([h?p:he(r,p),e])}return s(f,{fallback:e},s(ce,{resolve:m,children:e=>{const t=e.map((({status:e,value:t,reason:r},n)=>{if(t===te)return u[n];if("fulfilled"===e)return u[n].props.children(t);{const{error:e}=u[n].props;return"function"==typeof e?e(r):e}}));return s(l,null,...t)},onEnd:i}))}function ue({resolve:e,error:t=(e=>!1),children:r}){}function ce({resolve:e,children:t,onEnd:r}){const n=function(e){if(!(e instanceof Promise))return e;if(Reflect.has(e,re)){if(Reflect.has(e,oe))throw Error(Reflect.get(e,oe));return Reflect.get(e,ne)}throw de(e)}(e);return h((()=>{r?.()})),t(n)}class le extends Error{constructor(){super("timeout.")}}function ae(e){return{status:"fulfilled",value:e}}function fe(e){return{status:"rejected",reason:e}}function he(e,t){return new Promise((r=>setTimeout(r,e,t)))}function de(e){return e.then((t=>Object.defineProperty(e,ne,{value:t})),(t=>Object.defineProperty(e,oe,{value:t}))).finally((()=>Object.defineProperty(e,re,{value:!0})))}class pe extends d{state={error:null};static getDerivedStateFromError(e){return{error:e}}render(){const{error:e}=this.state;return null===e?this.props.children:(this.state.error=null,"function"==typeof this.props.fallback?this.props.fallback(e.message):this.props.fallback)}}const me=i(null),ve=i(null),ge=e=>e,ye={flag:!0},be=Symbol(),Se=Symbol();function we(e,t=void 0,r=!1,n=!1){let o=null;return function(i){let u;return u=null===o?e().catch((e=>{throw e})):o,s(f,{fallback:r},s(S,{resolve:u,errorElement:n},(e=>(null===o&&(o=t?e[t]??e.default:e.default),s(o,i)))))}}function Re(e,t=void 0){return Object.defineProperties((function e(t){return s(Reflect.get(e,"component"),t)}),{displayName:{value:"LazyComponentWithStore"},tag:{value:Se},factory:{value:t?()=>e().then((e=>({default:e[t]??e.default}))):e},component:{value:null,writable:!0},storeState:{value:null,writable:!0}})}class Ee{constructor(e){this.factory=e,this.store=null,this.error=null}}class Pe{constructor(e,t){this.component=e,this.store=t}}function Ce(e,t){return new Pe(e,t)}const Ae=Symbol("enhancer"),Le=Symbol("wrapper"),xe=Symbol("transition"),ke=Symbol("keepalive"),qe=Symbol("store"),Te=Symbol("start"),Ie=Symbol("guardError"),Oe=Symbol("redirect"),je=Symbol("alias"),Fe=Symbol(),Ne=Symbol("max");function He(e,t){const r=[];e.forEach((e=>{const n=e.meta??{};if(void 0!==e.path)if(n[Oe])!function(e){const t=e.meta[Oe];let r,n,o={};"string"==typeof t?r=t:({path:r,options:o,children:n}=t);e.element=s(ze,{route:s(Z,{path:r,options:o,children:n})})}(e);else{ye.flag&&n[qe]&&(ye.flag=!1);const o=n[Le]??t[Le]??[];let i;i=e.element?e.element:e.component?function(e){let t;const{component:r}=e;if(r instanceof Pe)ye.flag=!1,t=s(r.component),e.meta??={},e.meta[qe]=r.store;else if(function(e){return Reflect.get(e,"tag")===Se}(r)){ye.flag=!1,e.meta??={};const n=Reflect.get(r,"storeState")??new Ee((()=>Reflect.get(r,"factory")().then((e=>(r.component=e.default.component,r.storeState=n,n.store=e.default.store)),(e=>{throw n.error=e,e}))));e.meta[qe]=n,t=s(r)}else t=s(r);return t}(e):void 0,e.element=s(ze,{route:$e(o)(i)}),n[je]&&function(e,t){let r=e.meta[je];"string"==typeof r&&(r=[r]);if(0===r.length)return;t.push((()=>r.map((t=>{const r={...e,meta:{...e.meta},path:t};return delete r.meta[je],r}))))}(e,r)}(e.children??[]).length>0&&He(e.children,t)})),e.push(...r.map((e=>e())).flat())}function $e(e){const t=[...e].reverse();return e=>t.reduce(((e,t)=>{let r,n=null;return Array.isArray(t)?[r,n=null]=t:r=t,s(r,n,e)}),e)}class Ke extends Error{constructor(e,t){super("jump."),this.to=e,this.options=t}}class Ge extends Error{constructor(){super("stop navigate.")}}class _e extends Error{constructor(){super("cancel navigate.")}}class De extends Error{}const Me={next(e,t){throw new Ke(e,t)},stop(){throw new Ge}};function ze({route:e}){const{handles:[r,i],router:u,globalOptions:c,handleNavigateGuard:l}=a(me),f=u.state.matches,h=f[f.findIndex((t=>t.route.element.props.route===e))],{pathname:d}=h,{meta:p={}}=h.route;p[Fe]||(p[Fe]=I(p[Ae]??c[Ae]??[]),h.route.meta=p);const[m,g]=t((()=>c[Te])),b=n(),S=y(),w=n(S),R=n(S);S.pathname===d&&(S.meta??=p);const E=v(),P=n(),[C]=t((()=>c[be]));return o((()=>{let t=!0;return l(w.current.pathname,!0),r.reduce(((e,t)=>e.then((e=>Promise.resolve(t(S,w.current,Me,e,d))))),Promise.resolve()).then((t=>(P.current=t,e)),(e=>{if(e instanceof Ke)throw E(e.to,e.options),e;if(e instanceof Ge)throw E(-1),e;throw e})).then((e=>{if(!t)throw new _e;if(e===b.current)throw new De;const r=p[qe];if(!r)return[e];let n;if(r instanceof Ee){if(null!==r.error)throw r.error;n=null===r.store?r.factory().then(ge):Promise.resolve(r.store)}else n=Promise.resolve(r);return n.then((t=>{const{state:r,detail:n,options:o}=t,s={to:S,from:w.current,pathname:d,state:r,detail:n,options:o};return function(e){return Reflect.get(e.detail,F)}(t).forEach((e=>e(s))),Promise.resolve(t.request(s)).then((r=>(t.init(r),function(e){return Reflect.get(e.detail,N)}(t).forEach((e=>e(r))),[e,t])),(e=>{throw function(e){return Reflect.get(e.detail,H)}(t).forEach((t=>t(e))),e}))}))})).then((([e,r])=>{if(!t)throw new _e;const n=d,o={...p[ke]??c[ke]??{},max:c[Ne],uniqueKey:n};C||(o.include=X);const i=s(ve.Provider,{value:{pathname:d,store:r,meta:p}},s(z,{...p[xe]??c[xe]??{},uniqueKey:n},s(U,o,p[Fe]((()=>e))({to:S,from:w.current,pathname:d}))));g(i),w.current=S,b.current=e})).catch((e=>{if(!(e instanceof De))throw e;t=!1})).finally((()=>{l(R.current.pathname,!1),R.current=w.current})).then((()=>{if(!t)return;const e=P.current;return P.current=null,i.reduce(((e,t)=>e.then((e=>Promise.resolve(t(S,w.current,e,d))))),Promise.resolve(e))})).catch(p[Ie]??c[Ie]??ge),()=>{t=!1}}),[S.pathname,S.search,S.hash,d]),m}const Be={factory:E},We=Promise.resolve();function Je(e){Be.factory=e}function Qe(e,t=void 0,r={}){return Je(E),Ve(e,t,r)}function Ue(e,t=void 0,r={}){return Je(P),Ve(e,t,r)}function Ve(r,o=void 0,i={},u=void 0){if("function"==typeof u)return u(Ve)(r,o,i);y(r);const{factory:c}=Be,l=[],f=[];let d=r;const v={current:{pathname:"",active:!1},subscribes:[]};let g=c(d,o);function y(e){ye.flag=!0,He(e,i),Object.defineProperty(i,be,{value:ye.flag,writable:!0}),ye.flag=!0}function b(){const e=n(a(ve).store).current;if(!e)throw new Error("not find router store.");const t=n(null),r=p((r=>(t.current=r,()=>{t.current=null,e.unRegisterTrigger()})),[]);return m(r,(()=>e.state)),e.trigger||e.registerTrigger((([e,r])=>{e(r)&&t.current?.()})),e}function S(t,r){const{state:o,detail:s,options:i,reset:u}=t,c=p((function n(o){if("function"==typeof o)return o(n);const c=r(o);return"function"==typeof c?(u(e(c)(t.state,o,s,i)),o):c instanceof Ye?Promise.resolve(c.reducerHandle(t.state,o,s,i)).then((e=>n(c.successAction(e)))).catch((e=>n(c.failAction(e)))):o}),[]),l={state:o,detail:s,options:i};return function(e,t,r){const o=p((e=>"function"==typeof e?e(o):(We.then((()=>r(e))),e)),[r]),s=n(null);h((()=>()=>{s.current&&s.current.forEach((([e,t])=>t&&t()))}),[]);const i=M(e);if(0===i.length)return;const u=i.map((e=>e(t,o)));null===s.current?s.current=u.map((([e,t])=>[e,t(e)])):s.current.forEach((([e,t],r)=>{if(0===e.length)return;const[n,o]=u[r];e.some(((e,t)=>e!==n[t]))&&(t&&t(),s.current[r][0]=n,s.current[r][1]=o(n,e))}))}(t,l,c),[l,c]}let E=null,P=null;function C(e,t){return e.push(t),()=>e.splice(e.findIndex((e=>e===t)),1)}return{RouterProvider:function({router:e,fallbackElement:t,future:r}){const n=m((e=>(E=e,()=>E=null)),(()=>g));h((()=>{null!==P&&(P(n.navigate),P=null)}),[n]);const o={handles:[l,f],router:n,globalOptions:i,handleNavigateGuard:(e,t)=>{v.current.pathname=e,v.current.active=t,v.subscribes.forEach((e=>e()))},__router:e};return s(me.Provider,{value:o},s(R,{router:n,fallbackElement:t,future:r}))},useRoutes:function(){return d},useGlobalOptions:function(){return i},useRouteMeta:function(){return n(a(ve).meta).current},useNavigateGuard:function(){const e=n(a(ve).pathname).current,{current:t,subscribes:r}=v,o=p((e=>(r.push(e),()=>{const t=r.findIndex((t=>t===e));t>=0&&r.splice(t,1)})),[]);return m(o,(()=>t.active&&t.pathname===e))},useRouterStore:b,useRouterStoreState:function(){const t=b(),{state:r,detail:n,options:o,reset:s}=t,i=p((function(r){"function"==typeof r&&s(e(r)(t.state,n,o))}),[]);return[{state:r,detail:n,options:o},i]},useRouterStoreReducer:function(e){const r=b(),[n]=t((()=>"function"==typeof e?e(r):e));return S(r,(e=>n[e?.type]))},useRouterStoreCompose:function(){return S(b(),(e=>e?.type))},globalOptions:i,beforeEach:e=>C(l,e),afterEach:e=>C(f,e),getRoutes:()=>g.routes,addRoutes:(e=d)=>new Promise((t=>{e!==d&&(d=e,y(d),g=c(d,o),E?.(),P=t)})),hasRoute:(e,t="/")=>{const r=w(g.routes,e,t);return null!==r&&void 0===r[0].params["*"]}}}function Xe(){return a(me).__router}class Ye{constructor(e,t,r){this.reducerHandle=e,this.successAction=t,this.failAction=r}}function Ze(e,t=ge,r=ge){return new Ye(e,t,r)}function et(e){D(e)}function tt(e,t,r,n=!0){D((({state:o,detail:s,options:i})=>[e(o),(e,o)=>{const u=n?t(e,o):()=>t(e,o);r({detail:s,options:i,value:u})}]))}function rt(e,t,r){tt(e,t,r,!1)}const nt=i(null),ot=()=>({}),st=e=>({});function it(){return a(nt).storeInfo}function ut(){return a(nt).routerHooks}function ct(e,r=ot){return function(){const n=r();return t((()=>dt(e,void 0,n)))[0]}}function lt(e,t=st){return function(){const r=Xe(),n=r.useRouterStore();return pt(e,n,n.state,r,t)}}function at(e,t=st){return function(){const r=Xe(),n=r.useRouterStoreState();return pt(e,n,n[0].state,r,t)}}function ft(e,t={},r=st){return function(){const n=Xe(),o=n.useRouterStoreReducer(t);return pt(e,o,o[0].state,n,r)}}function ht(e,t=st){return function(){const r=Xe(),n=r.useRouterStoreCompose();return pt(e,n,n[0].state,r,t)}}function dt(e,t,r){return s(nt.Provider,{value:{storeInfo:t,routerHooks:r}},s(e))}function pt(e,r,s,i,u){const c=u(i),[l,a]=t((()=>dt(e,r,c))),f=n(!0);return o((()=>{f.current?f.current=!1:a(dt(e,r,c))}),[s]),l}T($),T(_);export{U as Keepalive,Z as Redirect,ue as Resolve,se as Show,ie as ShowList,le as TimeoutError,z as Transition,je as alias,Qe as createBrowserRouter,Ce as createComponentWithStore,Ue as createHashRouter,Ze as createReducerHandle,k as createRouterStore,Ae as enhancer,Ie as guardError,ke as keepalive,we as lazy,Re as lazyWithStore,rt as makeCallback,et as makeEffect,tt as makeMemo,Ne as max,X as noCache,Oe as redirect,T as registerGlobalPlugin,ct as routerNativeHooks,lt as routerStore,ht as routerStoreCompose,ft as routerStoreReducer,at as routerStoreState,Te as start,qe as store,xe as transition,V as useActivated,Xe as useRouter,ut as useRouterHooks,it as useRouterStore,Le as wrapper};
