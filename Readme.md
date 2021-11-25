## 使用说明

- 使用基本步骤请参考: [koa-web](https://www.npmjs.com/package/koa-web)
- vite转发机制，[koa-vite](https://www.npmjs.com/package/koa-vite)
- 开发模式： koa服务转发到vite服务
- 生产模式： 直接以koa为服务器运行dist文件

### 安装 vite

```
npm init @vitejs/app
# 选择 vue
cd vite-project
npm install
```

#### 安装 koa-vite

```
npm i koa-vite
```

#### 启动程序，如:start.js

- 运行dev: node start.js
- 运行生产环境: node start.js preview
- build: vite build

```js
const Koa = require("koa");
const KoaWeb = require('koa-web');
const KoaVite = require('koa-vite');
const app = new Koa();

const config = {
  path: __dirname,
  json: {
    layout: "@layout/index"
  },
  vite: {
    server: {
      // vite 主机名
      host: '0.0.0.0',

      // vite 端口
      port: 3010,
      
      // 端口暂用退出
      strictPort: true,
    },
  
    api: {
      // koa-web 域名
      host: 'localhost',
      
      // koa-web 端口
      port: 3000,

      // 构建模板， 默认 dist
      // dist: '../dist/',
      
      // vite根路径， 默认为空
      src: './vite/'
    }
  }
};

KoaWeb(KoaVite(config));

app.use(KoaWeb(config));

const { api } = config.vite;
app.listen(api.port, () => {
  const port = `\x1B[1m${api.port}\x1B[22m`;
  const link = `\x1B[36mhttp://${api.host}:${port}/\x1B[39m`;
  process.stdout.write(`\n  > koa-web:  ${link}\n`);
});
```

---

## 主目录已设置到vite

- 需要把src和public文件夹移动到vite目录

#### 创建test页面: /vite/test.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/static/test.js"></script>
  </body>
</html>
```

#### 创建html页面: /vite/static/test.js
```js
import { createApp } from 'vue'
import App from '../src/components/MyTest.vue'

createApp(App).mount('#app')
```

#### 创建数据控制页面: /vite/src/components/MyTest.vue

```html
<template>
  <div class="my">My Test</div>
</template>

<style scoped>
.my {
  color: #e23e59;
}
</style>
```

- 访问: http://localhost:3000/test.html （查看源码）
- 或者: http://localhost:3000/test

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/static/test.js"></script>
  </body>
</html>
```

- 访问: http://localhost:3000/static/test.js （查看源码）

```js
import { createApp } from '/@fs/home/node/vite/node_modules/.vite/vue.js?v=76df34b2'
import App from '/src/components/MyTest.vue'

createApp(App).mount('#app')
```

#### 创建layout页面: /html/layout/index.html

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <title>Koa-Vite</title>
</head>

<body>
  {{ __layout__ | safe }}
</body>
</html>
```

#### 创建html页面: /html/my.html

```js
<div>hello</div>
```

- 访问: http://localhost:3000/my （查看源码）

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <title>Koa-Vite</title>
</head>

<body>
  <div>hello</div>
</body>
</html>
```