'use strict';

const fs = require("fs");
const path = require("path");

class App {
  static serverUrl;
  static distPath;
  static srcPath;
  static server = {};
  static api = {};
  static layout;
  static isPreview = false;

  /**
   * 判断文件是否存在
   * @param {*} filePath 
   * @returns 
   */
  static isFile(filePath) {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  }

  static config(config) {
    let vite = config.vite;
    if (typeof vite === 'object') {
      if (typeof vite.server === 'object') {
        this.server = vite.server;
      }
      if (typeof vite.api === 'object') {
        this.api = vite.api;
      }
    }

    let serverHost = this.server.host;
    if (serverHost === undefined) {
      serverHost = '127.0.0.1';
    }

    let serverPort = this.server.port;
    if (serverPort === undefined) {
      serverPort = 3000;
    }

    this.serverUrl = `http://${serverHost}:${serverPort}`;
    
    let json = config.json;
    if (typeof json === 'object') {
      this.layout = json.layout;
    }

    if (this.layout === undefined) {
      this.layout = '/layout/index';
    }

    let srcPath = config.path;
    if (typeof this.api.src === 'string') {
      srcPath = path.resolve(srcPath, this.api.src);
    }
    this.srcPath = srcPath;

    let apiDist = this.api.dist;
    if (apiDist === undefined || typeof apiDist !== 'string') {
      apiDist = 'dist';
    }

    let distPath = path.resolve(srcPath, apiDist);
    this.distPath = distPath;

    if (process.argv.includes('preview')) {
      // 生产模式直接以koa运行
      this.isPreview = true;
    } else {
      // 开发模式以koa作为代理
      require('vite/dist/node/cli');
    }
  }

  /**
   * 开发模式
   * @param {*} hdData 
   * @param {*} hd 
   * @returns 
   */
  static async setDev(hdData, hd) {
    if (hdData !== undefined) {
      return hdData;
    }

    let url = hd.ctx.request.url;
    if (url == '/') {
      url = '/index.html';
    }


    let pos = url.indexOf('?');
    let tUrl = url;
    let query = '';
    if (pos >= 0) {
      tUrl = tUrl.substring(0, pos);
      query = tUrl.substring(pos);
    }

    let srcFile = `${App.srcPath}${tUrl}`;
    if (!App.isFile(srcFile)) {
      srcFile = `${srcFile}.html`;
      if (App.isFile(srcFile)) {
        url = `${tUrl}.html${query}`;
      }
    }

    const ret = await hd.http({
      url: `${App.serverUrl}${url}`,
      buffer: true,
    });

    if (ret.headers !== undefined) {
      const ct = ret.headers['Content-Type'];
      const cc = ret.headers['Cache-Control'];
      if (ct !== undefined) {
        hd.ctx.type = ct;
      }

      if (cc !== undefined) {
        hd.ctx.append('Cache-Control', cc);
      }
    }

    if (ret.status) {
      if (ret.code !== 404) {
        return ret.data;
      }
    } else {
      hd.ctx.status = 500;
      return ret.data;
    }
  }

  /**
   * 生产环境模式
   * @param {*} hdData 
   * @param {*} hd 
   * @returns 
   */
   static async setPreview(hdData, hd) {
    if (hdData !== undefined) {
      return hdData;
    }

    let url = hd.ctx.request.url;
    if (url == '/') {
      url = '/index.html';
    }

    let pos = url.indexOf('?');
    if (pos >= 0) {
      url = url.substring(0, pos);
    }

    let distFile = `${App.distPath}${url}`;
    if (App.isFile(distFile)) {
      if (hd.data.extName === '') {
        hd.ctx.type = "text/html";
      }
      return hd.read(distFile);
    } else {
      distFile = `${distFile}.html`;
      if (App.isFile(distFile)) {
        hd.ctx.type = "text/html";
        return hd.read(distFile);
      }
    }
  }
}

module.exports = (config) => {
  App.config(config);

  if (App.isPreview) {
    return async (setMid, setData) => {
      setData('*', App.setPreview);
    };
  }

  return async (setMid, setData) => {
    setData('*', App.setDev);
  };
};