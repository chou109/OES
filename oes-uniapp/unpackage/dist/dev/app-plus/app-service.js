if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global2 = uni.requireGlobal();
  ArrayBuffer = global2.ArrayBuffer;
  Int8Array = global2.Int8Array;
  Uint8Array = global2.Uint8Array;
  Uint8ClampedArray = global2.Uint8ClampedArray;
  Int16Array = global2.Int16Array;
  Uint16Array = global2.Uint16Array;
  Int32Array = global2.Int32Array;
  Uint32Array = global2.Uint32Array;
  Float32Array = global2.Float32Array;
  Float64Array = global2.Float64Array;
  BigInt64Array = global2.BigInt64Array;
  BigUint64Array = global2.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  const ON_SHOW = "onShow";
  const ON_HIDE = "onHide";
  const ON_LOAD = "onLoad";
  const ON_UNLOAD = "onUnload";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const createHook = (lifecycle) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onShow = /* @__PURE__ */ createHook(ON_SHOW);
  const onHide = /* @__PURE__ */ createHook(ON_HIDE);
  const onLoad = /* @__PURE__ */ createHook(ON_LOAD);
  const onUnload = /* @__PURE__ */ createHook(ON_UNLOAD);
  const BASE_URL = "http://192.168.1.92:8081/api";
  const requestInterceptor = (config) => {
    formatAppLog("log", "at utils/request.js:18", "请求拦截器 - 原始配置:", JSON.stringify(config));
    if (!config) {
      config = {};
    }
    if (!config.header || typeof config.header !== "object") {
      config.header = {};
    }
    const token = uni.getStorageSync("token");
    if (token) {
      config.header["Authorization"] = `Bearer ${token}`;
    }
    if (!config.header["Content-Type"]) {
      config.header["Content-Type"] = "application/json;charset=UTF-8";
    }
    formatAppLog("log", "at utils/request.js:40", "请求拦截器 - 处理后配置:", JSON.stringify(config));
    config.header["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.header["Pragma"] = "no-cache";
    if (config.method === "GET") {
      config.data = {
        ...config.data,
        _t: Date.now()
      };
    }
    return config;
  };
  const responseInterceptor = (response, config) => {
    const { statusCode, data } = response;
    if (statusCode === 200) {
      return data;
    }
    handleError(statusCode, data);
    return Promise.reject(response);
  };
  const handleError = (statusCode, data) => {
    switch (statusCode) {
      case 401:
        uni.removeStorageSync("token");
        uni.showToast({
          title: "登录已过期",
          icon: "none"
        });
        setTimeout(() => {
          uni.reLaunch({
            url: "/pages/common/login"
          });
        }, 1500);
        break;
      case 403:
        uni.showToast({
          title: "没有权限访问",
          icon: "none"
        });
        break;
      case 404:
        uni.showToast({
          title: "请求的资源不存在",
          icon: "none"
        });
        break;
      case 500:
        uni.showToast({
          title: "服务器错误",
          icon: "none"
        });
        break;
      default:
        uni.showToast({
          title: (data == null ? void 0 : data.message) || "请求失败",
          icon: "none"
        });
    }
  };
  const request = (options) => {
    options = requestInterceptor(options);
    options.url = BASE_URL + options.url;
    options.timeout = options.timeout || 6e4;
    return new Promise((resolve, reject) => {
      uni.request({
        ...options,
        success: (response) => {
          try {
            const result = responseInterceptor(response, options);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        fail: (error) => {
          if (error.errMsg === "request:fail") {
            uni.showToast({
              title: "网络连接失败",
              icon: "none"
            });
          } else {
            uni.showToast({
              title: "请求失败",
              icon: "none"
            });
          }
          reject(error);
        }
      });
    });
  };
  const get = (url, data = {}, options = {}) => {
    return request({
      url,
      method: "GET",
      data,
      ...options
    });
  };
  const post = (url, data = {}, options = {}) => {
    return request({
      url,
      method: "POST",
      data,
      ...options
    });
  };
  const put = (url, data = {}, options = {}) => {
    return request({
      url,
      method: "PUT",
      data,
      ...options
    });
  };
  const del$1 = (url, data = {}, options = {}) => {
    return request({
      url,
      method: "DELETE",
      data,
      ...options
    });
  };
  const upload$1 = (url, filePath, formData = {}) => {
    const token = uni.getStorageSync("token");
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: BASE_URL + url,
        filePath,
        name: "file",
        formData,
        header: {
          "Authorization": `Bearer ${token}`
        },
        success: (response) => {
          if (response.statusCode === 200) {
            try {
              const data = JSON.parse(response.data);
              resolve(data);
            } catch (e) {
              resolve(response.data);
            }
          } else {
            handleError(response.statusCode, response.data);
            reject(response);
          }
        },
        fail: (error) => {
          uni.showToast({
            title: "上传失败",
            icon: "none"
          });
          reject(error);
        }
      });
    });
  };
  const authApi = {
    login: (data) => post("/auth/login", data),
    register: (data) => post("/auth/register", data),
    getUserInfo: () => get("/auth/info"),
    changePassword: (data) => post("/auth/changePassword", data)
  };
  const userApi = {
    page: (params) => get("/users/page", params),
    getById: (id) => get(`/users/${id}`),
    create: (data) => post("/users", data),
    update: (data) => put("/users", data),
    delete: (id) => del$1(`/users/${id}`),
    getStudents: () => get("/users/students"),
    getTeachers: () => get("/users/teachers"),
    changeStatus: (id, status) => put(`/users/${id}/status`, null, { status })
  };
  const departmentApi = {
    tree: () => get("/departments/tree"),
    list: () => get("/departments"),
    getById: (id) => get(`/departments/${id}`),
    create: (data) => post("/departments", data),
    update: (data) => put("/departments", data),
    delete: (id) => del$1(`/departments/${id}`)
  };
  const classApi = {
    page: (params) => get("/classes/page", params),
    list: (params) => get("/classes", params),
    getById: (id) => get(`/classes/${id}`),
    create: (data, teacherId) => post("/class/create", data, { teacherId }),
    update: (data) => put("/classes", data),
    delete: (id) => del$1(`/classes/${id}`),
    getMyClasses: (userId) => get("/class/my-classes", { userId }),
    joinByCode: (inviteCode, userId) => post("/class/join-by-code", { inviteCode, userId }),
    getClassInfo: (classId) => get(`/classes/${classId}`),
    getClassMembers: (classId) => get(`/class/${classId}/members`),
    getMessages: (classId, current, size) => get(`/class/${classId}/messages`, { current, size }),
    sendMessage: (classId, content, senderId) => post(`/class/${classId}/message?senderId=${senderId}`, { content }),
    checkMemberRole: (classId, userId) => get(`/class/${classId}/member/${userId}/check`)
  };
  const logApi = {
    page: (params) => get("/logs/page", params)
  };
  const subjectApi = {
    page: (params) => get("/subjects/page", params),
    list: () => get("/subjects"),
    getById: (id) => get(`/subjects/${id}`),
    create: (data) => post("/subjects", data),
    update: (data) => put("/subjects", data),
    delete: (id) => del$1(`/subjects/${id}`)
  };
  const questionApi = {
    page: (params) => get("/questions/page", params),
    list: (params) => get("/questions/list", params),
    getById: (id) => get(`/questions/${id}`),
    create: (data) => post("/questions", data),
    update: (data) => put("/questions", data),
    delete: (id) => del$1(`/questions/${id}`),
    getCorrectRate: (id) => get(`/questions/${id}/correct-rate`),
    import: (data) => post("/questions/import", data),
    importQuestion: (filePath) => upload("/questions/import", filePath),
    generatePaper: (data) => post("/questions/generate-paper", data)
  };
  const paperApi = {
    page: (params) => get("/papers/page", params),
    getById: (id) => get(`/papers/${id}`),
    getQuestions: (id) => get(`/papers/${id}/questions`),
    create: (data) => post("/papers", data),
    update: (data) => put("/papers", data),
    publish: (id) => put(`/papers/${id}/publish`),
    delete: (id) => del$1(`/papers/${id}`)
  };
  const examApi = {
    page: (params) => get("/exams/page", params),
    studentPage: (params) => get("/exams/student/page", params),
    getById: (id) => get(`/exams/${id}`),
    create: (data) => post("/exams", data),
    update: (data) => put("/exams", data),
    publish: (id) => put(`/exams/${id}/publish`),
    start: (id) => put(`/exams/${id}/start`),
    finish: (id) => put(`/exams/${id}/finish`),
    extend: (id, minutes) => put(`/exams/${id}/extend`, null, { minutes }),
    delete: (id) => del$1(`/exams/${id}`),
    getStatistics: (id) => get(`/exams/${id}/statistics`)
  };
  const examRecordApi = {
    page: (params) => get("/exam-records/page", params),
    getById: (id) => get(`/exam-records/${id}`),
    start: (data) => post("/exam-records/start", data),
    saveAnswer: (data) => post("/exam-records/answer", data),
    autoSave: (data) => post("/exam-records/auto-save", data),
    submit: (id) => post(`/exam-records/submit/${id}`),
    autoSubmit: (id) => post(`/exam-records/auto-submit/${id}`),
    screenSwitch: (data) => post("/exam-records/screen-switch", data),
    reportLeave: (data) => post("/exam-records/report-leave", data),
    getAnswers: (id) => get(`/exam-records/${id}/answers`),
    getStudentHistory: (params) => get("/exam-records/student/history", params),
    getAnalysis: (params) => get("/exam-records/analysis", params),
    getStudentStats: () => get("/exam-records/student/stats"),
    getStudentSubjectScores: () => get("/exam-records/student/subject-scores"),
    getScoreTrend: () => get("/exam-records/student/score-trend"),
    getKnowledgeMastery: () => get("/exam-records/student/knowledge-mastery"),
    getExamStats: (examId) => get(`/exam-records/teacher/exam-stats/${examId}`),
    getQuestionAnalysis: (examId) => get(`/exam-records/teacher/question-analysis/${examId}`),
    exportExamScores: (examId) => get(`/exam-records/teacher/export/${examId}`),
    grade: (id, data) => put(`/exam-records/${id}/grade`, data)
  };
  const wrongQuestionApi = {
    page: (params) => get("/wrong-questions/page", params),
    getById: (id) => get(`/wrong-questions/${id}`),
    practice: (id) => post(`/wrong-questions/${id}/practice`),
    correct: (id) => post(`/wrong-questions/${id}/correct`),
    updateMastered: (id, mastered) => put(`/wrong-questions/${id}/mastered?mastered=${mastered}`)
  };
  const statisticsApi = {
    overview: () => get("/statistics/overview"),
    teacherStats: () => get("/statistics/teacher/stats")
  };
  var isVue2 = false;
  function set(target, key, val) {
    if (Array.isArray(target)) {
      target.length = Math.max(target.length, key);
      target.splice(key, 1, val);
      return val;
    }
    target[key] = val;
    return val;
  }
  function del(target, key) {
    if (Array.isArray(target)) {
      target.splice(key, 1);
      return;
    }
    delete target[key];
  }
  function getDevtoolsGlobalHook() {
    return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable = typeof Proxy === "function";
  const HOOK_SETUP = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
  let supported;
  let perf;
  function isPerformanceSupported() {
    var _a;
    if (supported !== void 0) {
      return supported;
    }
    if (typeof window !== "undefined" && window.performance) {
      supported = true;
      perf = window.performance;
    } else if (typeof global !== "undefined" && ((_a = global.perf_hooks) === null || _a === void 0 ? void 0 : _a.performance)) {
      supported = true;
      perf = global.perf_hooks.performance;
    } else {
      supported = false;
    }
    return supported;
  }
  function now() {
    return isPerformanceSupported() ? perf.now() : Date.now();
  }
  class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id in plugin.settings) {
          const item = plugin.settings[id];
          defaultSettings[id] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = Object.assign({}, defaultSettings);
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data = JSON.parse(raw);
        Object.assign(currentSettings, data);
      } catch (e) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e) {
          }
          currentSettings = value;
        },
        now() {
          return now();
        }
      };
      if (hook) {
        hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
          if (pluginId === this.plugin.id) {
            this.fallbacks.setSettings(value);
          }
        });
      }
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  }
  function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
    const descriptor = pluginDescriptor;
    const target = getTarget();
    const hook = getDevtoolsGlobalHook();
    const enableProxy = isProxyAvailable && descriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy(descriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor: descriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
    * pinia v2.0.33
    * (c) 2023 Eduardo San Martin Morote
    * @license MIT
    */
  let activePinia;
  const setActivePinia = (pinia2) => activePinia = pinia2;
  const piniaSymbol = Symbol("pinia");
  function isPlainObject(o) {
    return o && typeof o === "object" && Object.prototype.toString.call(o) === "[object Object]" && typeof o.toJSON !== "function";
  }
  var MutationType;
  (function(MutationType2) {
    MutationType2["direct"] = "direct";
    MutationType2["patchObject"] = "patch object";
    MutationType2["patchFunction"] = "patch function";
  })(MutationType || (MutationType = {}));
  const IS_CLIENT = typeof window !== "undefined";
  const USE_DEVTOOLS = IS_CLIENT;
  const _global = /* @__PURE__ */ (() => typeof window === "object" && window.window === window ? window : typeof self === "object" && self.self === self ? self : typeof global === "object" && global.global === global ? global : typeof globalThis === "object" ? globalThis : { HTMLElement: null })();
  function bom(blob, { autoBom = false } = {}) {
    if (autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
      return new Blob([String.fromCharCode(65279), blob], { type: blob.type });
    }
    return blob;
  }
  function download(url, name, opts) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.onload = function() {
      saveAs(xhr.response, name, opts);
    };
    xhr.onerror = function() {
      console.error("could not download file");
    };
    xhr.send();
  }
  function corsEnabled(url) {
    const xhr = new XMLHttpRequest();
    xhr.open("HEAD", url, false);
    try {
      xhr.send();
    } catch (e) {
    }
    return xhr.status >= 200 && xhr.status <= 299;
  }
  function click(node) {
    try {
      node.dispatchEvent(new MouseEvent("click"));
    } catch (e) {
      const evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click", true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
      node.dispatchEvent(evt);
    }
  }
  const _navigator = typeof navigator === "object" ? navigator : { userAgent: "" };
  const isMacOSWebView = /* @__PURE__ */ (() => /Macintosh/.test(_navigator.userAgent) && /AppleWebKit/.test(_navigator.userAgent) && !/Safari/.test(_navigator.userAgent))();
  const saveAs = !IS_CLIENT ? () => {
  } : (
    // Use download attribute first if possible (#193 Lumia mobile) unless this is a macOS WebView or mini program
    typeof HTMLAnchorElement !== "undefined" && "download" in HTMLAnchorElement.prototype && !isMacOSWebView ? downloadSaveAs : (
      // Use msSaveOrOpenBlob as a second approach
      "msSaveOrOpenBlob" in _navigator ? msSaveAs : (
        // Fallback to using FileReader and a popup
        fileSaverSaveAs
      )
    )
  );
  function downloadSaveAs(blob, name = "download", opts) {
    const a = document.createElement("a");
    a.download = name;
    a.rel = "noopener";
    if (typeof blob === "string") {
      a.href = blob;
      if (a.origin !== location.origin) {
        if (corsEnabled(a.href)) {
          download(blob, name, opts);
        } else {
          a.target = "_blank";
          click(a);
        }
      } else {
        click(a);
      }
    } else {
      a.href = URL.createObjectURL(blob);
      setTimeout(function() {
        URL.revokeObjectURL(a.href);
      }, 4e4);
      setTimeout(function() {
        click(a);
      }, 0);
    }
  }
  function msSaveAs(blob, name = "download", opts) {
    if (typeof blob === "string") {
      if (corsEnabled(blob)) {
        download(blob, name, opts);
      } else {
        const a = document.createElement("a");
        a.href = blob;
        a.target = "_blank";
        setTimeout(function() {
          click(a);
        });
      }
    } else {
      navigator.msSaveOrOpenBlob(bom(blob, opts), name);
    }
  }
  function fileSaverSaveAs(blob, name, opts, popup) {
    popup = popup || open("", "_blank");
    if (popup) {
      popup.document.title = popup.document.body.innerText = "downloading...";
    }
    if (typeof blob === "string")
      return download(blob, name, opts);
    const force = blob.type === "application/octet-stream";
    const isSafari = /constructor/i.test(String(_global.HTMLElement)) || "safari" in _global;
    const isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent);
    if ((isChromeIOS || force && isSafari || isMacOSWebView) && typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onloadend = function() {
        let url = reader.result;
        if (typeof url !== "string") {
          popup = null;
          throw new Error("Wrong reader.result type");
        }
        url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, "data:attachment/file;");
        if (popup) {
          popup.location.href = url;
        } else {
          location.assign(url);
        }
        popup = null;
      };
      reader.readAsDataURL(blob);
    } else {
      const url = URL.createObjectURL(blob);
      if (popup)
        popup.location.assign(url);
      else
        location.href = url;
      popup = null;
      setTimeout(function() {
        URL.revokeObjectURL(url);
      }, 4e4);
    }
  }
  function toastMessage(message, type) {
    const piniaMessage = "🍍 " + message;
    if (typeof __VUE_DEVTOOLS_TOAST__ === "function") {
      __VUE_DEVTOOLS_TOAST__(piniaMessage, type);
    } else if (type === "error") {
      console.error(piniaMessage);
    } else if (type === "warn") {
      console.warn(piniaMessage);
    } else {
      console.log(piniaMessage);
    }
  }
  function isPinia(o) {
    return "_a" in o && "install" in o;
  }
  function checkClipboardAccess() {
    if (!("clipboard" in navigator)) {
      toastMessage(`Your browser doesn't support the Clipboard API`, "error");
      return true;
    }
  }
  function checkNotFocusedError(error) {
    if (error instanceof Error && error.message.toLowerCase().includes("document is not focused")) {
      toastMessage('You need to activate the "Emulate a focused page" setting in the "Rendering" panel of devtools.', "warn");
      return true;
    }
    return false;
  }
  async function actionGlobalCopyState(pinia2) {
    if (checkClipboardAccess())
      return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(pinia2.state.value));
      toastMessage("Global state copied to clipboard.");
    } catch (error) {
      if (checkNotFocusedError(error))
        return;
      toastMessage(`Failed to serialize the state. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  async function actionGlobalPasteState(pinia2) {
    if (checkClipboardAccess())
      return;
    try {
      pinia2.state.value = JSON.parse(await navigator.clipboard.readText());
      toastMessage("Global state pasted from clipboard.");
    } catch (error) {
      if (checkNotFocusedError(error))
        return;
      toastMessage(`Failed to deserialize the state from clipboard. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  async function actionGlobalSaveState(pinia2) {
    try {
      saveAs(new Blob([JSON.stringify(pinia2.state.value)], {
        type: "text/plain;charset=utf-8"
      }), "pinia-state.json");
    } catch (error) {
      toastMessage(`Failed to export the state as JSON. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  let fileInput;
  function getFileOpener() {
    if (!fileInput) {
      fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json";
    }
    function openFile() {
      return new Promise((resolve, reject) => {
        fileInput.onchange = async () => {
          const files = fileInput.files;
          if (!files)
            return resolve(null);
          const file = files.item(0);
          if (!file)
            return resolve(null);
          return resolve({ text: await file.text(), file });
        };
        fileInput.oncancel = () => resolve(null);
        fileInput.onerror = reject;
        fileInput.click();
      });
    }
    return openFile;
  }
  async function actionGlobalOpenStateFile(pinia2) {
    try {
      const open2 = await getFileOpener();
      const result = await open2();
      if (!result)
        return;
      const { text, file } = result;
      pinia2.state.value = JSON.parse(text);
      toastMessage(`Global state imported from "${file.name}".`);
    } catch (error) {
      toastMessage(`Failed to export the state as JSON. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  function formatDisplay(display) {
    return {
      _custom: {
        display
      }
    };
  }
  const PINIA_ROOT_LABEL = "🍍 Pinia (root)";
  const PINIA_ROOT_ID = "_root";
  function formatStoreForInspectorTree(store) {
    return isPinia(store) ? {
      id: PINIA_ROOT_ID,
      label: PINIA_ROOT_LABEL
    } : {
      id: store.$id,
      label: store.$id
    };
  }
  function formatStoreForInspectorState(store) {
    if (isPinia(store)) {
      const storeNames = Array.from(store._s.keys());
      const storeMap = store._s;
      const state2 = {
        state: storeNames.map((storeId) => ({
          editable: true,
          key: storeId,
          value: store.state.value[storeId]
        })),
        getters: storeNames.filter((id) => storeMap.get(id)._getters).map((id) => {
          const store2 = storeMap.get(id);
          return {
            editable: false,
            key: id,
            value: store2._getters.reduce((getters, key) => {
              getters[key] = store2[key];
              return getters;
            }, {})
          };
        })
      };
      return state2;
    }
    const state = {
      state: Object.keys(store.$state).map((key) => ({
        editable: true,
        key,
        value: store.$state[key]
      }))
    };
    if (store._getters && store._getters.length) {
      state.getters = store._getters.map((getterName) => ({
        editable: false,
        key: getterName,
        value: store[getterName]
      }));
    }
    if (store._customProperties.size) {
      state.customProperties = Array.from(store._customProperties).map((key) => ({
        editable: true,
        key,
        value: store[key]
      }));
    }
    return state;
  }
  function formatEventData(events) {
    if (!events)
      return {};
    if (Array.isArray(events)) {
      return events.reduce((data, event) => {
        data.keys.push(event.key);
        data.operations.push(event.type);
        data.oldValue[event.key] = event.oldValue;
        data.newValue[event.key] = event.newValue;
        return data;
      }, {
        oldValue: {},
        keys: [],
        operations: [],
        newValue: {}
      });
    } else {
      return {
        operation: formatDisplay(events.type),
        key: formatDisplay(events.key),
        oldValue: events.oldValue,
        newValue: events.newValue
      };
    }
  }
  function formatMutationType(type) {
    switch (type) {
      case MutationType.direct:
        return "mutation";
      case MutationType.patchFunction:
        return "$patch";
      case MutationType.patchObject:
        return "$patch";
      default:
        return "unknown";
    }
  }
  let isTimelineActive = true;
  const componentStateTypes = [];
  const MUTATIONS_LAYER_ID = "pinia:mutations";
  const INSPECTOR_ID = "pinia";
  const { assign: assign$1 } = Object;
  const getStoreType = (id) => "🍍 " + id;
  function registerPiniaDevtools(app, pinia2) {
    setupDevtoolsPlugin({
      id: "dev.esm.pinia",
      label: "Pinia 🍍",
      logo: "https://pinia.vuejs.org/logo.svg",
      packageName: "pinia",
      homepage: "https://pinia.vuejs.org",
      componentStateTypes,
      app
    }, (api) => {
      if (typeof api.now !== "function") {
        toastMessage("You seem to be using an outdated version of Vue Devtools. Are you still using the Beta release instead of the stable one? You can find the links at https://devtools.vuejs.org/guide/installation.html.");
      }
      api.addTimelineLayer({
        id: MUTATIONS_LAYER_ID,
        label: `Pinia 🍍`,
        color: 15064968
      });
      api.addInspector({
        id: INSPECTOR_ID,
        label: "Pinia 🍍",
        icon: "storage",
        treeFilterPlaceholder: "Search stores",
        actions: [
          {
            icon: "content_copy",
            action: () => {
              actionGlobalCopyState(pinia2);
            },
            tooltip: "Serialize and copy the state"
          },
          {
            icon: "content_paste",
            action: async () => {
              await actionGlobalPasteState(pinia2);
              api.sendInspectorTree(INSPECTOR_ID);
              api.sendInspectorState(INSPECTOR_ID);
            },
            tooltip: "Replace the state with the content of your clipboard"
          },
          {
            icon: "save",
            action: () => {
              actionGlobalSaveState(pinia2);
            },
            tooltip: "Save the state as a JSON file"
          },
          {
            icon: "folder_open",
            action: async () => {
              await actionGlobalOpenStateFile(pinia2);
              api.sendInspectorTree(INSPECTOR_ID);
              api.sendInspectorState(INSPECTOR_ID);
            },
            tooltip: "Import the state from a JSON file"
          }
        ],
        nodeActions: [
          {
            icon: "restore",
            tooltip: "Reset the state (option store only)",
            action: (nodeId) => {
              const store = pinia2._s.get(nodeId);
              if (!store) {
                toastMessage(`Cannot reset "${nodeId}" store because it wasn't found.`, "warn");
              } else if (!store._isOptionsAPI) {
                toastMessage(`Cannot reset "${nodeId}" store because it's a setup store.`, "warn");
              } else {
                store.$reset();
                toastMessage(`Store "${nodeId}" reset.`);
              }
            }
          }
        ]
      });
      api.on.inspectComponent((payload, ctx) => {
        const proxy = payload.componentInstance && payload.componentInstance.proxy;
        if (proxy && proxy._pStores) {
          const piniaStores = payload.componentInstance.proxy._pStores;
          Object.values(piniaStores).forEach((store) => {
            payload.instanceData.state.push({
              type: getStoreType(store.$id),
              key: "state",
              editable: true,
              value: store._isOptionsAPI ? {
                _custom: {
                  value: vue.toRaw(store.$state),
                  actions: [
                    {
                      icon: "restore",
                      tooltip: "Reset the state of this store",
                      action: () => store.$reset()
                    }
                  ]
                }
              } : (
                // NOTE: workaround to unwrap transferred refs
                Object.keys(store.$state).reduce((state, key) => {
                  state[key] = store.$state[key];
                  return state;
                }, {})
              )
            });
            if (store._getters && store._getters.length) {
              payload.instanceData.state.push({
                type: getStoreType(store.$id),
                key: "getters",
                editable: false,
                value: store._getters.reduce((getters, key) => {
                  try {
                    getters[key] = store[key];
                  } catch (error) {
                    getters[key] = error;
                  }
                  return getters;
                }, {})
              });
            }
          });
        }
      });
      api.on.getInspectorTree((payload) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          let stores = [pinia2];
          stores = stores.concat(Array.from(pinia2._s.values()));
          payload.rootNodes = (payload.filter ? stores.filter((store) => "$id" in store ? store.$id.toLowerCase().includes(payload.filter.toLowerCase()) : PINIA_ROOT_LABEL.toLowerCase().includes(payload.filter.toLowerCase())) : stores).map(formatStoreForInspectorTree);
        }
      });
      api.on.getInspectorState((payload) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia2 : pinia2._s.get(payload.nodeId);
          if (!inspectedStore) {
            return;
          }
          if (inspectedStore) {
            payload.state = formatStoreForInspectorState(inspectedStore);
          }
        }
      });
      api.on.editInspectorState((payload, ctx) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia2 : pinia2._s.get(payload.nodeId);
          if (!inspectedStore) {
            return toastMessage(`store "${payload.nodeId}" not found`, "error");
          }
          const { path } = payload;
          if (!isPinia(inspectedStore)) {
            if (path.length !== 1 || !inspectedStore._customProperties.has(path[0]) || path[0] in inspectedStore.$state) {
              path.unshift("$state");
            }
          } else {
            path.unshift("state");
          }
          isTimelineActive = false;
          payload.set(inspectedStore, path, payload.state.value);
          isTimelineActive = true;
        }
      });
      api.on.editComponentState((payload) => {
        if (payload.type.startsWith("🍍")) {
          const storeId = payload.type.replace(/^🍍\s*/, "");
          const store = pinia2._s.get(storeId);
          if (!store) {
            return toastMessage(`store "${storeId}" not found`, "error");
          }
          const { path } = payload;
          if (path[0] !== "state") {
            return toastMessage(`Invalid path for store "${storeId}":
${path}
Only state can be modified.`);
          }
          path[0] = "$state";
          isTimelineActive = false;
          payload.set(store, path, payload.state.value);
          isTimelineActive = true;
        }
      });
    });
  }
  function addStoreToDevtools(app, store) {
    if (!componentStateTypes.includes(getStoreType(store.$id))) {
      componentStateTypes.push(getStoreType(store.$id));
    }
    setupDevtoolsPlugin({
      id: "dev.esm.pinia",
      label: "Pinia 🍍",
      logo: "https://pinia.vuejs.org/logo.svg",
      packageName: "pinia",
      homepage: "https://pinia.vuejs.org",
      componentStateTypes,
      app,
      settings: {
        logStoreChanges: {
          label: "Notify about new/deleted stores",
          type: "boolean",
          defaultValue: true
        }
        // useEmojis: {
        //   label: 'Use emojis in messages ⚡️',
        //   type: 'boolean',
        //   defaultValue: true,
        // },
      }
    }, (api) => {
      const now2 = typeof api.now === "function" ? api.now.bind(api) : Date.now;
      store.$onAction(({ after, onError, name, args }) => {
        const groupId = runningActionId++;
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now2(),
            title: "🛫 " + name,
            subtitle: "start",
            data: {
              store: formatDisplay(store.$id),
              action: formatDisplay(name),
              args
            },
            groupId
          }
        });
        after((result) => {
          activeAction = void 0;
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: now2(),
              title: "🛬 " + name,
              subtitle: "end",
              data: {
                store: formatDisplay(store.$id),
                action: formatDisplay(name),
                args,
                result
              },
              groupId
            }
          });
        });
        onError((error) => {
          activeAction = void 0;
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: now2(),
              logType: "error",
              title: "💥 " + name,
              subtitle: "end",
              data: {
                store: formatDisplay(store.$id),
                action: formatDisplay(name),
                args,
                error
              },
              groupId
            }
          });
        });
      }, true);
      store._customProperties.forEach((name) => {
        vue.watch(() => vue.unref(store[name]), (newValue, oldValue) => {
          api.notifyComponentUpdate();
          api.sendInspectorState(INSPECTOR_ID);
          if (isTimelineActive) {
            api.addTimelineEvent({
              layerId: MUTATIONS_LAYER_ID,
              event: {
                time: now2(),
                title: "Change",
                subtitle: name,
                data: {
                  newValue,
                  oldValue
                },
                groupId: activeAction
              }
            });
          }
        }, { deep: true });
      });
      store.$subscribe(({ events, type }, state) => {
        api.notifyComponentUpdate();
        api.sendInspectorState(INSPECTOR_ID);
        if (!isTimelineActive)
          return;
        const eventData = {
          time: now2(),
          title: formatMutationType(type),
          data: assign$1({ store: formatDisplay(store.$id) }, formatEventData(events)),
          groupId: activeAction
        };
        activeAction = void 0;
        if (type === MutationType.patchFunction) {
          eventData.subtitle = "⤵️";
        } else if (type === MutationType.patchObject) {
          eventData.subtitle = "🧩";
        } else if (events && !Array.isArray(events)) {
          eventData.subtitle = events.type;
        }
        if (events) {
          eventData.data["rawEvent(s)"] = {
            _custom: {
              display: "DebuggerEvent",
              type: "object",
              tooltip: "raw DebuggerEvent[]",
              value: events
            }
          };
        }
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: eventData
        });
      }, { detached: true, flush: "sync" });
      const hotUpdate = store._hotUpdate;
      store._hotUpdate = vue.markRaw((newStore) => {
        hotUpdate(newStore);
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now2(),
            title: "🔥 " + store.$id,
            subtitle: "HMR update",
            data: {
              store: formatDisplay(store.$id),
              info: formatDisplay(`HMR update`)
            }
          }
        });
        api.notifyComponentUpdate();
        api.sendInspectorTree(INSPECTOR_ID);
        api.sendInspectorState(INSPECTOR_ID);
      });
      const { $dispose } = store;
      store.$dispose = () => {
        $dispose();
        api.notifyComponentUpdate();
        api.sendInspectorTree(INSPECTOR_ID);
        api.sendInspectorState(INSPECTOR_ID);
        api.getSettings().logStoreChanges && toastMessage(`Disposed "${store.$id}" store 🗑`);
      };
      api.notifyComponentUpdate();
      api.sendInspectorTree(INSPECTOR_ID);
      api.sendInspectorState(INSPECTOR_ID);
      api.getSettings().logStoreChanges && toastMessage(`"${store.$id}" store installed 🆕`);
    });
  }
  let runningActionId = 0;
  let activeAction;
  function patchActionForGrouping(store, actionNames) {
    const actions = actionNames.reduce((storeActions, actionName) => {
      storeActions[actionName] = vue.toRaw(store)[actionName];
      return storeActions;
    }, {});
    for (const actionName in actions) {
      store[actionName] = function() {
        const _actionId = runningActionId;
        const trackedStore = new Proxy(store, {
          get(...args) {
            activeAction = _actionId;
            return Reflect.get(...args);
          },
          set(...args) {
            activeAction = _actionId;
            return Reflect.set(...args);
          }
        });
        return actions[actionName].apply(trackedStore, arguments);
      };
    }
  }
  function devtoolsPlugin({ app, store, options }) {
    if (store.$id.startsWith("__hot:")) {
      return;
    }
    if (options.state) {
      store._isOptionsAPI = true;
    }
    if (typeof options.state === "function") {
      patchActionForGrouping(
        // @ts-expect-error: can cast the store...
        store,
        Object.keys(options.actions)
      );
      const originalHotUpdate = store._hotUpdate;
      vue.toRaw(store)._hotUpdate = function(newStore) {
        originalHotUpdate.apply(this, arguments);
        patchActionForGrouping(store, Object.keys(newStore._hmrPayload.actions));
      };
    }
    addStoreToDevtools(
      app,
      // FIXME: is there a way to allow the assignment from Store<Id, S, G, A> to StoreGeneric?
      store
    );
  }
  function createPinia() {
    const scope = vue.effectScope(true);
    const state = scope.run(() => vue.ref({}));
    let _p = [];
    let toBeInstalled = [];
    const pinia2 = vue.markRaw({
      install(app) {
        setActivePinia(pinia2);
        {
          pinia2._a = app;
          app.provide(piniaSymbol, pinia2);
          app.config.globalProperties.$pinia = pinia2;
          if (USE_DEVTOOLS) {
            registerPiniaDevtools(app, pinia2);
          }
          toBeInstalled.forEach((plugin) => _p.push(plugin));
          toBeInstalled = [];
        }
      },
      use(plugin) {
        if (!this._a && !isVue2) {
          toBeInstalled.push(plugin);
        } else {
          _p.push(plugin);
        }
        return this;
      },
      _p,
      // it's actually undefined here
      // @ts-expect-error
      _a: null,
      _e: scope,
      _s: /* @__PURE__ */ new Map(),
      state
    });
    if (USE_DEVTOOLS && typeof Proxy !== "undefined") {
      pinia2.use(devtoolsPlugin);
    }
    return pinia2;
  }
  function patchObject(newState, oldState) {
    for (const key in oldState) {
      const subPatch = oldState[key];
      if (!(key in newState)) {
        continue;
      }
      const targetValue = newState[key];
      if (isPlainObject(targetValue) && isPlainObject(subPatch) && !vue.isRef(subPatch) && !vue.isReactive(subPatch)) {
        newState[key] = patchObject(targetValue, subPatch);
      } else {
        {
          newState[key] = subPatch;
        }
      }
    }
    return newState;
  }
  const noop = () => {
  };
  function addSubscription(subscriptions, callback, detached, onCleanup = noop) {
    subscriptions.push(callback);
    const removeSubscription = () => {
      const idx = subscriptions.indexOf(callback);
      if (idx > -1) {
        subscriptions.splice(idx, 1);
        onCleanup();
      }
    };
    if (!detached && vue.getCurrentScope()) {
      vue.onScopeDispose(removeSubscription);
    }
    return removeSubscription;
  }
  function triggerSubscriptions(subscriptions, ...args) {
    subscriptions.slice().forEach((callback) => {
      callback(...args);
    });
  }
  function mergeReactiveObjects(target, patchToApply) {
    if (target instanceof Map && patchToApply instanceof Map) {
      patchToApply.forEach((value, key) => target.set(key, value));
    }
    if (target instanceof Set && patchToApply instanceof Set) {
      patchToApply.forEach(target.add, target);
    }
    for (const key in patchToApply) {
      if (!patchToApply.hasOwnProperty(key))
        continue;
      const subPatch = patchToApply[key];
      const targetValue = target[key];
      if (isPlainObject(targetValue) && isPlainObject(subPatch) && target.hasOwnProperty(key) && !vue.isRef(subPatch) && !vue.isReactive(subPatch)) {
        target[key] = mergeReactiveObjects(targetValue, subPatch);
      } else {
        target[key] = subPatch;
      }
    }
    return target;
  }
  const skipHydrateSymbol = Symbol("pinia:skipHydration");
  function shouldHydrate(obj) {
    return !isPlainObject(obj) || !obj.hasOwnProperty(skipHydrateSymbol);
  }
  const { assign } = Object;
  function isComputed(o) {
    return !!(vue.isRef(o) && o.effect);
  }
  function createOptionsStore(id, options, pinia2, hot) {
    const { state, actions, getters } = options;
    const initialState = pinia2.state.value[id];
    let store;
    function setup() {
      if (!initialState && !hot) {
        {
          pinia2.state.value[id] = state ? state() : {};
        }
      }
      const localState = hot ? (
        // use ref() to unwrap refs inside state TODO: check if this is still necessary
        vue.toRefs(vue.ref(state ? state() : {}).value)
      ) : vue.toRefs(pinia2.state.value[id]);
      return assign(localState, actions, Object.keys(getters || {}).reduce((computedGetters, name) => {
        if (name in localState) {
          console.warn(`[🍍]: A getter cannot have the same name as another state property. Rename one of them. Found with "${name}" in store "${id}".`);
        }
        computedGetters[name] = vue.markRaw(vue.computed(() => {
          setActivePinia(pinia2);
          const store2 = pinia2._s.get(id);
          return getters[name].call(store2, store2);
        }));
        return computedGetters;
      }, {}));
    }
    store = createSetupStore(id, setup, options, pinia2, hot, true);
    return store;
  }
  function createSetupStore($id, setup, options = {}, pinia2, hot, isOptionsStore) {
    let scope;
    const optionsForPlugin = assign({ actions: {} }, options);
    if (!pinia2._e.active) {
      throw new Error("Pinia destroyed");
    }
    const $subscribeOptions = {
      deep: true
      // flush: 'post',
    };
    {
      $subscribeOptions.onTrigger = (event) => {
        if (isListening) {
          debuggerEvents = event;
        } else if (isListening == false && !store._hotUpdating) {
          if (Array.isArray(debuggerEvents)) {
            debuggerEvents.push(event);
          } else {
            console.error("🍍 debuggerEvents should be an array. This is most likely an internal Pinia bug.");
          }
        }
      };
    }
    let isListening;
    let isSyncListening;
    let subscriptions = vue.markRaw([]);
    let actionSubscriptions = vue.markRaw([]);
    let debuggerEvents;
    const initialState = pinia2.state.value[$id];
    if (!isOptionsStore && !initialState && !hot) {
      {
        pinia2.state.value[$id] = {};
      }
    }
    const hotState = vue.ref({});
    let activeListener;
    function $patch(partialStateOrMutator) {
      let subscriptionMutation;
      isListening = isSyncListening = false;
      {
        debuggerEvents = [];
      }
      if (typeof partialStateOrMutator === "function") {
        partialStateOrMutator(pinia2.state.value[$id]);
        subscriptionMutation = {
          type: MutationType.patchFunction,
          storeId: $id,
          events: debuggerEvents
        };
      } else {
        mergeReactiveObjects(pinia2.state.value[$id], partialStateOrMutator);
        subscriptionMutation = {
          type: MutationType.patchObject,
          payload: partialStateOrMutator,
          storeId: $id,
          events: debuggerEvents
        };
      }
      const myListenerId = activeListener = Symbol();
      vue.nextTick().then(() => {
        if (activeListener === myListenerId) {
          isListening = true;
        }
      });
      isSyncListening = true;
      triggerSubscriptions(subscriptions, subscriptionMutation, pinia2.state.value[$id]);
    }
    const $reset = isOptionsStore ? function $reset2() {
      const { state } = options;
      const newState = state ? state() : {};
      this.$patch(($state) => {
        assign($state, newState);
      });
    } : (
      /* istanbul ignore next */
      () => {
        throw new Error(`🍍: Store "${$id}" is built using the setup syntax and does not implement $reset().`);
      }
    );
    function $dispose() {
      scope.stop();
      subscriptions = [];
      actionSubscriptions = [];
      pinia2._s.delete($id);
    }
    function wrapAction(name, action) {
      return function() {
        setActivePinia(pinia2);
        const args = Array.from(arguments);
        const afterCallbackList = [];
        const onErrorCallbackList = [];
        function after(callback) {
          afterCallbackList.push(callback);
        }
        function onError(callback) {
          onErrorCallbackList.push(callback);
        }
        triggerSubscriptions(actionSubscriptions, {
          args,
          name,
          store,
          after,
          onError
        });
        let ret;
        try {
          ret = action.apply(this && this.$id === $id ? this : store, args);
        } catch (error) {
          triggerSubscriptions(onErrorCallbackList, error);
          throw error;
        }
        if (ret instanceof Promise) {
          return ret.then((value) => {
            triggerSubscriptions(afterCallbackList, value);
            return value;
          }).catch((error) => {
            triggerSubscriptions(onErrorCallbackList, error);
            return Promise.reject(error);
          });
        }
        triggerSubscriptions(afterCallbackList, ret);
        return ret;
      };
    }
    const _hmrPayload = /* @__PURE__ */ vue.markRaw({
      actions: {},
      getters: {},
      state: [],
      hotState
    });
    const partialStore = {
      _p: pinia2,
      // _s: scope,
      $id,
      $onAction: addSubscription.bind(null, actionSubscriptions),
      $patch,
      $reset,
      $subscribe(callback, options2 = {}) {
        const removeSubscription = addSubscription(subscriptions, callback, options2.detached, () => stopWatcher());
        const stopWatcher = scope.run(() => vue.watch(() => pinia2.state.value[$id], (state) => {
          if (options2.flush === "sync" ? isSyncListening : isListening) {
            callback({
              storeId: $id,
              type: MutationType.direct,
              events: debuggerEvents
            }, state);
          }
        }, assign({}, $subscribeOptions, options2)));
        return removeSubscription;
      },
      $dispose
    };
    const store = vue.reactive(
      assign(
        {
          _hmrPayload,
          _customProperties: vue.markRaw(/* @__PURE__ */ new Set())
          // devtools custom properties
        },
        partialStore
        // must be added later
        // setupStore
      )
    );
    pinia2._s.set($id, store);
    const setupStore = pinia2._e.run(() => {
      scope = vue.effectScope();
      return scope.run(() => setup());
    });
    for (const key in setupStore) {
      const prop = setupStore[key];
      if (vue.isRef(prop) && !isComputed(prop) || vue.isReactive(prop)) {
        if (hot) {
          set(hotState.value, key, vue.toRef(setupStore, key));
        } else if (!isOptionsStore) {
          if (initialState && shouldHydrate(prop)) {
            if (vue.isRef(prop)) {
              prop.value = initialState[key];
            } else {
              mergeReactiveObjects(prop, initialState[key]);
            }
          }
          {
            pinia2.state.value[$id][key] = prop;
          }
        }
        {
          _hmrPayload.state.push(key);
        }
      } else if (typeof prop === "function") {
        const actionValue = hot ? prop : wrapAction(key, prop);
        {
          setupStore[key] = actionValue;
        }
        {
          _hmrPayload.actions[key] = prop;
        }
        optionsForPlugin.actions[key] = prop;
      } else {
        if (isComputed(prop)) {
          _hmrPayload.getters[key] = isOptionsStore ? (
            // @ts-expect-error
            options.getters[key]
          ) : prop;
          if (IS_CLIENT) {
            const getters = setupStore._getters || // @ts-expect-error: same
            (setupStore._getters = vue.markRaw([]));
            getters.push(key);
          }
        }
      }
    }
    {
      assign(store, setupStore);
      assign(vue.toRaw(store), setupStore);
    }
    Object.defineProperty(store, "$state", {
      get: () => hot ? hotState.value : pinia2.state.value[$id],
      set: (state) => {
        if (hot) {
          throw new Error("cannot set hotState");
        }
        $patch(($state) => {
          assign($state, state);
        });
      }
    });
    {
      store._hotUpdate = vue.markRaw((newStore) => {
        store._hotUpdating = true;
        newStore._hmrPayload.state.forEach((stateKey) => {
          if (stateKey in store.$state) {
            const newStateTarget = newStore.$state[stateKey];
            const oldStateSource = store.$state[stateKey];
            if (typeof newStateTarget === "object" && isPlainObject(newStateTarget) && isPlainObject(oldStateSource)) {
              patchObject(newStateTarget, oldStateSource);
            } else {
              newStore.$state[stateKey] = oldStateSource;
            }
          }
          set(store, stateKey, vue.toRef(newStore.$state, stateKey));
        });
        Object.keys(store.$state).forEach((stateKey) => {
          if (!(stateKey in newStore.$state)) {
            del(store, stateKey);
          }
        });
        isListening = false;
        isSyncListening = false;
        pinia2.state.value[$id] = vue.toRef(newStore._hmrPayload, "hotState");
        isSyncListening = true;
        vue.nextTick().then(() => {
          isListening = true;
        });
        for (const actionName in newStore._hmrPayload.actions) {
          const action = newStore[actionName];
          set(store, actionName, wrapAction(actionName, action));
        }
        for (const getterName in newStore._hmrPayload.getters) {
          const getter = newStore._hmrPayload.getters[getterName];
          const getterValue = isOptionsStore ? (
            // special handling of options api
            vue.computed(() => {
              setActivePinia(pinia2);
              return getter.call(store, store);
            })
          ) : getter;
          set(store, getterName, getterValue);
        }
        Object.keys(store._hmrPayload.getters).forEach((key) => {
          if (!(key in newStore._hmrPayload.getters)) {
            del(store, key);
          }
        });
        Object.keys(store._hmrPayload.actions).forEach((key) => {
          if (!(key in newStore._hmrPayload.actions)) {
            del(store, key);
          }
        });
        store._hmrPayload = newStore._hmrPayload;
        store._getters = newStore._getters;
        store._hotUpdating = false;
      });
    }
    if (USE_DEVTOOLS) {
      const nonEnumerable = {
        writable: true,
        configurable: true,
        // avoid warning on devtools trying to display this property
        enumerable: false
      };
      ["_p", "_hmrPayload", "_getters", "_customProperties"].forEach((p) => {
        Object.defineProperty(store, p, assign({ value: store[p] }, nonEnumerable));
      });
    }
    pinia2._p.forEach((extender) => {
      if (USE_DEVTOOLS) {
        const extensions = scope.run(() => extender({
          store,
          app: pinia2._a,
          pinia: pinia2,
          options: optionsForPlugin
        }));
        Object.keys(extensions || {}).forEach((key) => store._customProperties.add(key));
        assign(store, extensions);
      } else {
        assign(store, scope.run(() => extender({
          store,
          app: pinia2._a,
          pinia: pinia2,
          options: optionsForPlugin
        })));
      }
    });
    if (store.$state && typeof store.$state === "object" && typeof store.$state.constructor === "function" && !store.$state.constructor.toString().includes("[native code]")) {
      console.warn(`[🍍]: The "state" must be a plain object. It cannot be
	state: () => new MyClass()
Found in store "${store.$id}".`);
    }
    if (initialState && isOptionsStore && options.hydrate) {
      options.hydrate(store.$state, initialState);
    }
    isListening = true;
    isSyncListening = true;
    return store;
  }
  function defineStore(idOrOptions, setup, setupOptions) {
    let id;
    let options;
    const isSetupStore = typeof setup === "function";
    if (typeof idOrOptions === "string") {
      id = idOrOptions;
      options = isSetupStore ? setupOptions : setup;
    } else {
      options = idOrOptions;
      id = idOrOptions.id;
    }
    function useStore(pinia2, hot) {
      const currentInstance = vue.getCurrentInstance();
      pinia2 = // in test mode, ignore the argument provided as we can always retrieve a
      // pinia instance with getActivePinia()
      pinia2 || currentInstance && vue.inject(piniaSymbol, null);
      if (pinia2)
        setActivePinia(pinia2);
      if (!activePinia) {
        throw new Error(`[🍍]: getActivePinia was called with no active Pinia. Did you forget to install pinia?
	const pinia = createPinia()
	app.use(pinia)
This will fail in production.`);
      }
      pinia2 = activePinia;
      if (!pinia2._s.has(id)) {
        if (isSetupStore) {
          createSetupStore(id, setup, options, pinia2);
        } else {
          createOptionsStore(id, options, pinia2);
        }
        {
          useStore._pinia = pinia2;
        }
      }
      const store = pinia2._s.get(id);
      if (hot) {
        const hotId = "__hot:" + id;
        const newStore = isSetupStore ? createSetupStore(hotId, setup, options, pinia2, true) : createOptionsStore(hotId, assign({}, options), pinia2, true);
        hot._hotUpdate(newStore);
        delete pinia2.state.value[hotId];
        pinia2._s.delete(hotId);
      }
      if (IS_CLIENT && currentInstance && currentInstance.proxy && // avoid adding stores that are just built for hot module replacement
      !hot) {
        const vm = currentInstance.proxy;
        const cache = "_pStores" in vm ? vm._pStores : vm._pStores = {};
        cache[id] = store;
      }
      return store;
    }
    useStore.$id = id;
    return useStore;
  }
  const useUserStore = defineStore("user", {
    state: () => ({
      userInfo: null,
      token: uni.getStorageSync("token") || "",
      isLoginVerified: false
    }),
    getters: {
      isLoggedIn: (state) => !!state.token && !!state.userInfo,
      role: (state) => {
        var _a;
        return ((_a = state.userInfo) == null ? void 0 : _a.role) || "";
      },
      userId: (state) => {
        var _a;
        return ((_a = state.userInfo) == null ? void 0 : _a.userId) || "";
      }
    },
    actions: {
      /**
       * 登录
       * @param {Object} loginData - 登录数据
       */
      async login(loginData) {
        try {
          const res = await authApi.login(loginData);
          if (res.code === 200) {
            this.token = res.data.token;
            this.userInfo = res.data;
            this.isLoginVerified = true;
            uni.setStorageSync("token", res.data.token);
            return res.data;
          }
          throw new Error(res.message);
        } catch (error) {
          uni.showToast({
            title: error.message || "登录失败",
            icon: "none"
          });
          throw error;
        }
      },
      /**
       * 获取用户信息
       */
      async getUserInfo() {
        if (!this.token)
          return null;
        try {
          const res = await authApi.getUserInfo();
          if (res.code === 200) {
            this.userInfo = res.data;
            this.isLoginVerified = true;
            return res.data;
          } else {
            this.clearLoginState();
            return null;
          }
        } catch (error) {
          formatAppLog("error", "at store/index.js:65", "获取用户信息失败:", error);
          this.clearLoginState();
          return null;
        }
      },
      /**
       * 验证登录状态
       */
      async verifyLoginState() {
        if (!this.token) {
          this.clearLoginState();
          return false;
        }
        try {
          const res = await authApi.getUserInfo();
          if (res.code === 200) {
            this.userInfo = res.data;
            this.isLoginVerified = true;
            return true;
          } else {
            this.clearLoginState();
            return false;
          }
        } catch (error) {
          formatAppLog("error", "at store/index.js:91", "登录状态验证失败:", error);
          this.clearLoginState();
          return false;
        }
      },
      /**
       * 清除登录状态
       */
      clearLoginState() {
        this.token = "";
        this.userInfo = null;
        this.isLoginVerified = false;
        uni.removeStorageSync("token");
      },
      /**
       * 登出
       */
      logout() {
        this.clearLoginState();
        uni.reLaunch({
          url: "/pages/common/login"
        });
      },
      /**
       * 初始化登录状态
       */
      initLoginState() {
        const savedToken = uni.getStorageSync("token");
        if (savedToken) {
          this.token = savedToken;
        }
      }
    }
  });
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$u = {
    setup() {
      const loginType = vue.ref("student");
      const showAdminLogin = vue.ref(false);
      const loading = vue.ref(false);
      const userStore = useUserStore();
      const form = vue.reactive({
        username: "",
        password: ""
      });
      const switchLoginType = (type) => {
        if (type === "admin") {
          showAdminLogin.value = true;
        } else {
          showAdminLogin.value = false;
          loginType.value = type;
        }
      };
      const handleLogin = async () => {
        if (!form.username || !form.password) {
          uni.showToast({
            title: "请输入用户名和密码",
            icon: "none"
          });
          return;
        }
        loading.value = true;
        try {
          formatAppLog("log", "at pages/common/login.vue:117", "开始登录，用户名:", form.username);
          const result = await userStore.login(form);
          formatAppLog("log", "at pages/common/login.vue:120", "用户信息:", result);
          if (showAdminLogin.value && result.role !== "ADMIN") {
            uni.showToast({
              title: "不存在此管理员账号",
              icon: "none"
            });
            return;
          }
          if (!showAdminLogin.value) {
            const expectedRole = loginType.value === "student" ? "STUDENT" : "TEACHER";
            if (result.role !== expectedRole) {
              uni.showToast({
                title: loginType.value === "student" ? "不存在此学生账号" : "不存在此教师账号",
                icon: "none"
              });
              return;
            }
          }
          uni.setStorageSync("userInfo", result);
          uni.showToast({
            title: "登录成功",
            icon: "success"
          });
          setTimeout(() => {
            uni.switchTab({
              url: "/pages/common/dashboard"
            });
          }, 1500);
        } catch (error) {
          formatAppLog("error", "at pages/common/login.vue:155", "登录失败详情:", error);
          let errorMsg = "登录失败";
          if (error.errMsg && error.errMsg.includes("fail")) {
            errorMsg = "网络连接失败，请检查服务器是否启动";
          } else if (error.message) {
            errorMsg = error.message;
          } else if (error.data && error.data.message) {
            errorMsg = error.data.message;
          }
          uni.showToast({
            title: errorMsg,
            icon: "none",
            duration: 3e3
          });
        } finally {
          loading.value = false;
        }
      };
      const goToRegister = () => {
        uni.navigateTo({
          url: "/pages/common/register"
        });
      };
      return {
        loginType,
        showAdminLogin,
        loading,
        form,
        switchLoginType,
        handleLogin,
        goToRegister
      };
    }
  };
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "login-container" }, [
      vue.createCommentVNode(" Logo和标题 "),
      vue.createElementVNode("view", { class: "login-header" }, [
        vue.createElementVNode("image", {
          class: "logo",
          src: "/static/logo.png",
          mode: "aspectFit"
        }),
        vue.createElementVNode("text", { class: "title" }, "ExamPro"),
        vue.createElementVNode("text", { class: "subtitle" }, "专业的在线考试系统")
      ]),
      vue.createCommentVNode(" 登录表单 "),
      vue.createElementVNode("view", { class: "login-form" }, [
        vue.createCommentVNode(" 登录类型选择 "),
        vue.createElementVNode("view", { class: "login-tabs" }, [
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["login-tab", { active: $setup.loginType === "student" && !$setup.showAdminLogin }]),
              onClick: _cache[0] || (_cache[0] = ($event) => $setup.switchLoginType("student"))
            },
            [
              vue.createElementVNode("text", { class: "tab-text" }, "学生")
            ],
            2
            /* CLASS */
          ),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["login-tab", { active: $setup.loginType === "teacher" && !$setup.showAdminLogin }]),
              onClick: _cache[1] || (_cache[1] = ($event) => $setup.switchLoginType("teacher"))
            },
            [
              vue.createElementVNode("text", { class: "tab-text" }, "教师")
            ],
            2
            /* CLASS */
          ),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["login-tab", { active: $setup.showAdminLogin }]),
              onClick: _cache[2] || (_cache[2] = ($event) => $setup.switchLoginType("admin"))
            },
            [
              vue.createElementVNode("text", { class: "tab-text" }, "管理员")
            ],
            2
            /* CLASS */
          )
        ]),
        vue.createCommentVNode(" 登录输入 "),
        vue.createElementVNode("view", { class: "form-content" }, [
          vue.createElementVNode("view", { class: "input-group" }, [
            vue.createElementVNode("text", { class: "icon" }, "👤"),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "input",
                type: "text",
                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $setup.form.username = $event),
                placeholder: "请输入用户名",
                "placeholder-class": "placeholder"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.form.username]
            ])
          ]),
          vue.createElementVNode("view", { class: "input-group" }, [
            vue.createElementVNode("text", { class: "icon" }, "🔒"),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "input",
                type: "password",
                "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $setup.form.password = $event),
                placeholder: "请输入密码",
                "placeholder-class": "placeholder"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.form.password]
            ])
          ]),
          vue.createElementVNode("button", {
            class: "login-btn",
            disabled: $setup.loading,
            onClick: _cache[5] || (_cache[5] = (...args) => $setup.handleLogin && $setup.handleLogin(...args))
          }, [
            vue.createElementVNode(
              "text",
              { class: "btn-text" },
              vue.toDisplayString($setup.loading ? "登录中..." : "登录"),
              1
              /* TEXT */
            )
          ], 8, ["disabled"])
        ]),
        vue.createCommentVNode(" 其他操作 "),
        vue.createElementVNode("view", { class: "action-buttons" }, [
          vue.createElementVNode("text", {
            class: "action-link",
            onClick: _cache[6] || (_cache[6] = (...args) => $setup.goToRegister && $setup.goToRegister(...args))
          }, "注册账号")
        ]),
        vue.createCommentVNode(" 演示账号提示 "),
        vue.createElementVNode("view", { class: "demo-tip" }, [
          vue.createElementVNode("text", { class: "tip-text" }, "演示账号：学生 s/stu | 教师 t/tchr | 管理员 a/admin")
        ])
      ])
    ]);
  }
  const PagesCommonLogin = /* @__PURE__ */ _export_sfc(_sfc_main$u, [["render", _sfc_render$b], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/common/login.vue"]]);
  const _sfc_main$t = {
    setup() {
      const loading = vue.ref(false);
      const departments = vue.ref([]);
      const registerForm = vue.reactive({
        username: "",
        password: "",
        confirmPassword: "",
        role: "STUDENT",
        departmentId: null
      });
      const selectedDepartmentName = vue.computed(() => {
        if (!registerForm.departmentId)
          return "";
        const dept = departments.value.find((d) => d.id === registerForm.departmentId);
        return (dept == null ? void 0 : dept.name) || "";
      });
      const loadDepartments = async () => {
        try {
          const res = await departmentApi.list();
          if (res.code === 200) {
            departments.value = res.data;
          }
        } catch (e) {
          formatAppLog("error", "at pages/common/register.vue:127", "加载学院列表失败:", e);
        }
      };
      const onDepartmentChange = (e) => {
        const index = e.detail.value;
        if (departments.value[index]) {
          registerForm.departmentId = departments.value[index].id;
        }
      };
      const handleRegister = async () => {
        if (!registerForm.username) {
          uni.showToast({ title: "请输入用户名", icon: "none" });
          return;
        }
        if (registerForm.username.length < 3 || registerForm.username.length > 20) {
          uni.showToast({ title: "用户名长度应为3-20个字符", icon: "none" });
          return;
        }
        if (!registerForm.password) {
          uni.showToast({ title: "请输入密码", icon: "none" });
          return;
        }
        if (registerForm.password.length < 6 || registerForm.password.length > 20) {
          uni.showToast({ title: "密码长度应为6-20个字符", icon: "none" });
          return;
        }
        if (registerForm.password !== registerForm.confirmPassword) {
          uni.showToast({ title: "两次输入密码不一致", icon: "none" });
          return;
        }
        loading.value = true;
        try {
          const res = await authApi.register({
            username: registerForm.username,
            password: registerForm.password,
            role: registerForm.role,
            departmentId: registerForm.departmentId ? Number(registerForm.departmentId) : null
          });
          if (res.code === 200) {
            uni.showToast({ title: "注册成功", icon: "success" });
            setTimeout(() => {
              backToLogin();
            }, 1500);
          } else {
            uni.showToast({ title: res.message || "注册失败", icon: "none" });
          }
        } catch (e) {
          uni.showToast({ title: e.message || "注册失败", icon: "none" });
        } finally {
          loading.value = false;
        }
      };
      const backToLogin = () => {
        uni.navigateBack();
      };
      vue.onMounted(() => {
        loadDepartments();
      });
      return {
        loading,
        departments,
        registerForm,
        selectedDepartmentName,
        onDepartmentChange,
        handleRegister,
        backToLogin
      };
    }
  };
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "register-container" }, [
      vue.createCommentVNode(" 标题 "),
      vue.createElementVNode("view", { class: "register-header" }, [
        vue.createElementVNode("text", { class: "title" }, "创建账号"),
        vue.createElementVNode("text", { class: "subtitle" }, "选择身份并填写注册信息")
      ]),
      vue.createCommentVNode(" 注册表单 "),
      vue.createElementVNode("view", { class: "register-form" }, [
        vue.createCommentVNode(" 身份选择 "),
        vue.createElementVNode("view", { class: "role-tabs" }, [
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["role-tab", { active: $setup.registerForm.role === "STUDENT" }]),
              onClick: _cache[0] || (_cache[0] = ($event) => $setup.registerForm.role = "STUDENT")
            },
            [
              vue.createElementVNode("text", { class: "emoji-icon" }, "👨‍🎓"),
              vue.createElementVNode("text", { class: "tab-text" }, "学生")
            ],
            2
            /* CLASS */
          ),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["role-tab", { active: $setup.registerForm.role === "TEACHER" }]),
              onClick: _cache[1] || (_cache[1] = ($event) => $setup.registerForm.role = "TEACHER")
            },
            [
              vue.createElementVNode("text", { class: "emoji-icon" }, "👨‍🏫"),
              vue.createElementVNode("text", { class: "tab-text" }, "教师")
            ],
            2
            /* CLASS */
          )
        ]),
        vue.createCommentVNode(" 注册输入 "),
        vue.createElementVNode("view", { class: "form-content" }, [
          vue.createElementVNode("view", { class: "input-group" }, [
            vue.createElementVNode("text", { class: "emoji-icon" }, "👤"),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "input",
                type: "text",
                "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.registerForm.username = $event),
                placeholder: "请输入用户名",
                "placeholder-class": "placeholder"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.registerForm.username]
            ])
          ]),
          vue.createElementVNode("view", { class: "input-group" }, [
            vue.createElementVNode("text", { class: "emoji-icon" }, "🔒"),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "input",
                type: "password",
                "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $setup.registerForm.password = $event),
                placeholder: "请输入密码",
                "placeholder-class": "placeholder"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.registerForm.password]
            ])
          ]),
          vue.createElementVNode("view", { class: "input-group" }, [
            vue.createElementVNode("text", { class: "emoji-icon" }, "🔒"),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "input",
                type: "password",
                "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $setup.registerForm.confirmPassword = $event),
                placeholder: "请确认密码",
                "placeholder-class": "placeholder"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, $setup.registerForm.confirmPassword]
            ])
          ]),
          vue.createCommentVNode(" 学院选择 "),
          vue.createElementVNode("view", { class: "select-group" }, [
            vue.createElementVNode("text", { class: "emoji-icon" }, "🏫"),
            vue.createElementVNode("picker", {
              mode: "selector",
              range: $setup.departments,
              "range-key": "name",
              onChange: _cache[5] || (_cache[5] = (...args) => $setup.onDepartmentChange && $setup.onDepartmentChange(...args))
            }, [
              vue.createElementVNode("view", { class: "picker-content" }, [
                vue.createElementVNode(
                  "text",
                  {
                    class: vue.normalizeClass(["picker-text", { placeholder: !$setup.registerForm.departmentId }])
                  },
                  vue.toDisplayString($setup.selectedDepartmentName || "请选择学院"),
                  3
                  /* TEXT, CLASS */
                ),
                vue.createElementVNode("text", { class: "arrow-icon" }, "▼")
              ])
            ], 40, ["range"])
          ]),
          vue.createElementVNode("button", {
            class: "register-btn",
            disabled: $setup.loading,
            onClick: _cache[6] || (_cache[6] = (...args) => $setup.handleRegister && $setup.handleRegister(...args))
          }, [
            vue.createElementVNode(
              "text",
              { class: "btn-text" },
              vue.toDisplayString($setup.loading ? "注册中..." : "注册"),
              1
              /* TEXT */
            )
          ], 8, ["disabled"])
        ]),
        vue.createCommentVNode(" 返回登录 "),
        vue.createElementVNode("view", { class: "action-buttons" }, [
          vue.createElementVNode("text", {
            class: "action-link",
            onClick: _cache[7] || (_cache[7] = (...args) => $setup.backToLogin && $setup.backToLogin(...args))
          }, "已有账号？去登录")
        ])
      ])
    ]);
  }
  const PagesCommonRegister = /* @__PURE__ */ _export_sfc(_sfc_main$t, [["render", _sfc_render$a], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/common/register.vue"]]);
  const _sfc_main$s = {
    setup() {
      const userInfo = vue.ref(uni.getStorageSync("userInfo") || {});
      const displayName = vue.computed(() => {
        const name = userInfo.value.realName;
        const username = userInfo.value.username;
        return name && name.trim() ? name : username;
      });
      const currentDate = vue.computed(() => {
        const now2 = /* @__PURE__ */ new Date();
        const options = { year: "numeric", month: "long", day: "numeric", weekday: "long" };
        return now2.toLocaleDateString("zh-CN", options);
      });
      const roleText = vue.computed(() => {
        const map = { ADMIN: "管理员", TEACHER: "教师", STUDENT: "学生" };
        return map[userInfo.value.role] || "用户";
      });
      const stats = vue.ref({
        totalUsers: 0,
        studentCount: 0,
        teacherCount: 0,
        departmentCount: 0,
        classCount: 0,
        paperCount: 0,
        questionCount: 0,
        examCount: 0,
        pendingExams: 0,
        completedExams: 0,
        wrongCount: 0,
        averageScore: 0
      });
      const recentExams = vue.ref([]);
      const pendingExams = vue.ref([]);
      const recentLogs = vue.ref([]);
      const statusClass = (status) => {
        const map = { PENDING: "pending", ONGOING: "ongoing", FINISHED: "finished" };
        return map[status] || "";
      };
      const statusText = (status) => {
        const map = { PENDING: "待开始", ONGOING: "进行中", FINISHED: "已结束" };
        return map[status] || status;
      };
      const goTo = (url) => {
        uni.navigateTo({ url });
      };
      const goToExam = (exam) => {
        if (userInfo.value.role === "STUDENT") {
          uni.navigateTo({
            url: `/pages/student/exam-take?id=${exam.id}`
          });
        } else {
          uni.navigateTo({
            url: `/pages/teacher/exam-manage?id=${exam.id}`
          });
        }
      };
      const loadStats = async () => {
        try {
          if (userInfo.value.role === "ADMIN") {
            const res = await statisticsApi.overview();
            if (res.code === 200) {
              stats.value = {
                totalUsers: res.data.totalUsers || 0,
                studentCount: res.data.studentCount || 0,
                teacherCount: res.data.teacherCount || 0,
                departmentCount: res.data.departmentCount || 0
              };
            }
          } else if (userInfo.value.role === "TEACHER") {
            const res = await statisticsApi.teacherStats();
            if (res.code === 200) {
              stats.value = {
                classCount: res.data.classCount || 0,
                paperCount: res.data.paperCount || 0,
                questionCount: res.data.questionCount || 0,
                examCount: res.data.examCount || 0
              };
            }
          } else if (userInfo.value.role === "STUDENT") {
            const res = await examRecordApi.getStudentStats();
            if (res.code === 200) {
              stats.value = {
                pendingExams: res.data.pendingExams || 0,
                completedExams: res.data.completedExams || 0,
                wrongCount: res.data.wrongCount || 0,
                averageScore: res.data.averageScore || 0
              };
            }
          }
        } catch (e) {
          formatAppLog("error", "at pages/common/dashboard.vue:399", "加载统计数据失败:", e);
        }
      };
      const loadRecentExams = async () => {
        try {
          const res = await examApi.page({ current: 1, size: 5 });
          if (res.code === 200) {
            recentExams.value = res.data.records || [];
          }
        } catch (e) {
          formatAppLog("error", "at pages/common/dashboard.vue:410", "加载最近考试失败:", e);
        }
      };
      const loadPendingExams = async () => {
        try {
          const res = await examApi.studentPage({ current: 1, size: 10 });
          if (res.code === 200) {
            const records = res.data.records || [];
            pendingExams.value = records.filter(
              (e) => e.exam && e.exam.status !== "FINISHED" && e.studentStatus !== "SUBMITTED"
            ).map((e) => ({
              ...e.exam,
              studentStatus: e.studentStatus
            }));
          }
        } catch (e) {
          formatAppLog("error", "at pages/common/dashboard.vue:427", "加载待考考试失败:", e);
        }
      };
      const loadLogs = async () => {
        try {
          const res = await logApi.page({ current: 1, size: 10 });
          if (res.code === 200) {
            recentLogs.value = (res.data.records || []).map((log) => ({
              operator: log.username || "-",
              action: log.operation || "-",
              createTime: formatDateTime(log.createTime)
            }));
          }
        } catch (e) {
          formatAppLog("error", "at pages/common/dashboard.vue:442", "加载日志失败:", e);
        }
      };
      const formatDateTime = (dateTime) => {
        if (!dateTime)
          return "-";
        const date = new Date(dateTime);
        return date.toLocaleString("zh-CN");
      };
      vue.onMounted(async () => {
        await loadStats();
        if (userInfo.value.role === "ADMIN") {
          await loadLogs();
        } else if (userInfo.value.role === "TEACHER") {
          await loadRecentExams();
        } else if (userInfo.value.role === "STUDENT") {
          await loadPendingExams();
        }
      });
      return {
        userInfo,
        displayName,
        currentDate,
        roleText,
        stats,
        recentExams,
        pendingExams,
        recentLogs,
        statusClass,
        statusText,
        goTo,
        goToExam
      };
    }
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "dashboard" }, [
      vue.createElementVNode("view", { class: "page-header" }, [
        vue.createElementVNode(
          "text",
          { class: "title" },
          "欢迎回来，" + vue.toDisplayString($setup.displayName),
          1
          /* TEXT */
        ),
        vue.createElementVNode(
          "text",
          { class: "subtitle" },
          vue.toDisplayString($setup.roleText) + " | " + vue.toDisplayString($setup.currentDate),
          1
          /* TEXT */
        )
      ]),
      vue.createElementVNode("view", { class: "stats-grid" }, [
        $setup.userInfo.role === "ADMIN" ? (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 0 },
          [
            vue.createElementVNode("view", {
              class: "stat-card",
              onClick: _cache[0] || (_cache[0] = ($event) => $setup.goTo("/pages/admin/user-manage"))
            }, [
              vue.createElementVNode("view", { class: "stat-icon admin-icon" }, [
                vue.createElementVNode("text", { class: "emoji" }, "👥")
              ]),
              vue.createElementVNode("view", { class: "stat-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.stats.totalUsers),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "总用户数")
              ]),
              vue.createElementVNode("text", { class: "arrow" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "stat-card",
              onClick: _cache[1] || (_cache[1] = ($event) => $setup.goTo("/pages/admin/user-manage?role=STUDENT"))
            }, [
              vue.createElementVNode("view", { class: "stat-icon admin-icon" }, [
                vue.createElementVNode("text", { class: "emoji" }, "👨‍🎓")
              ]),
              vue.createElementVNode("view", { class: "stat-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.stats.studentCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "学生数")
              ]),
              vue.createElementVNode("text", { class: "arrow" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "stat-card",
              onClick: _cache[2] || (_cache[2] = ($event) => $setup.goTo("/pages/admin/user-manage?role=TEACHER"))
            }, [
              vue.createElementVNode("view", { class: "stat-icon admin-icon" }, [
                vue.createElementVNode("text", { class: "emoji" }, "👨‍🏫")
              ]),
              vue.createElementVNode("view", { class: "stat-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.stats.teacherCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "教师数")
              ]),
              vue.createElementVNode("text", { class: "arrow" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "stat-card",
              onClick: _cache[3] || (_cache[3] = ($event) => $setup.goTo("/pages/admin/department-manage"))
            }, [
              vue.createElementVNode("view", { class: "stat-icon admin-icon" }, [
                vue.createElementVNode("text", { class: "emoji" }, "🏫")
              ]),
              vue.createElementVNode("view", { class: "stat-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.stats.departmentCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "院系数")
              ]),
              vue.createElementVNode("text", { class: "arrow" }, "›")
            ])
          ],
          64
          /* STABLE_FRAGMENT */
        )) : $setup.userInfo.role === "TEACHER" ? (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 1 },
          [
            vue.createElementVNode("view", {
              class: "stat-card",
              onClick: _cache[4] || (_cache[4] = ($event) => $setup.goTo("/pages/teacher/my-classes"))
            }, [
              vue.createElementVNode("view", { class: "stat-icon teacher-icon" }, [
                vue.createElementVNode("text", { class: "emoji" }, "📚")
              ]),
              vue.createElementVNode("view", { class: "stat-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.stats.classCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "班级数")
              ]),
              vue.createElementVNode("text", { class: "arrow" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "stat-card",
              onClick: _cache[5] || (_cache[5] = ($event) => $setup.goTo("/pages/teacher/paper-manage"))
            }, [
              vue.createElementVNode("view", { class: "stat-icon teacher-icon" }, [
                vue.createElementVNode("text", { class: "emoji" }, "📄")
              ]),
              vue.createElementVNode("view", { class: "stat-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.stats.paperCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "试卷数")
              ]),
              vue.createElementVNode("text", { class: "arrow" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "stat-card",
              onClick: _cache[6] || (_cache[6] = ($event) => $setup.goTo("/pages/teacher/question-manage"))
            }, [
              vue.createElementVNode("view", { class: "stat-icon teacher-icon" }, [
                vue.createElementVNode("text", { class: "emoji" }, "❓")
              ]),
              vue.createElementVNode("view", { class: "stat-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.stats.questionCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "题目数")
              ]),
              vue.createElementVNode("text", { class: "arrow" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "stat-card",
              onClick: _cache[7] || (_cache[7] = ($event) => $setup.goTo("/pages/teacher/exam-manage"))
            }, [
              vue.createElementVNode("view", { class: "stat-icon teacher-icon" }, [
                vue.createElementVNode("text", { class: "emoji" }, "📅")
              ]),
              vue.createElementVNode("view", { class: "stat-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.stats.examCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "考试数")
              ]),
              vue.createElementVNode("text", { class: "arrow" }, "›")
            ])
          ],
          64
          /* STABLE_FRAGMENT */
        )) : $setup.userInfo.role === "STUDENT" ? (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 2 },
          [
            vue.createElementVNode("view", {
              class: "stat-card",
              onClick: _cache[8] || (_cache[8] = ($event) => $setup.goTo("/pages/student/exam-list"))
            }, [
              vue.createElementVNode("view", { class: "stat-icon student-icon" }, [
                vue.createElementVNode("text", { class: "emoji" }, "⏰")
              ]),
              vue.createElementVNode("view", { class: "stat-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.stats.pendingExams),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "待考考试")
              ]),
              vue.createElementVNode("text", { class: "arrow" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "stat-card",
              onClick: _cache[9] || (_cache[9] = ($event) => $setup.goTo("/pages/student/history"))
            }, [
              vue.createElementVNode("view", { class: "stat-icon student-icon" }, [
                vue.createElementVNode("text", { class: "emoji" }, "✅")
              ]),
              vue.createElementVNode("view", { class: "stat-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.stats.completedExams),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "已完成")
              ]),
              vue.createElementVNode("text", { class: "arrow" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "stat-card",
              onClick: _cache[10] || (_cache[10] = ($event) => $setup.goTo("/pages/student/wrong-questions"))
            }, [
              vue.createElementVNode("view", { class: "stat-icon student-icon" }, [
                vue.createElementVNode("text", { class: "emoji" }, "❌")
              ]),
              vue.createElementVNode("view", { class: "stat-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.stats.wrongCount),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "错题数")
              ]),
              vue.createElementVNode("text", { class: "arrow" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "stat-card",
              onClick: _cache[11] || (_cache[11] = ($event) => $setup.goTo("/pages/student/statistics"))
            }, [
              vue.createElementVNode("view", { class: "stat-icon student-icon" }, [
                vue.createElementVNode("text", { class: "emoji" }, "📊")
              ]),
              vue.createElementVNode("view", { class: "stat-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString($setup.stats.averageScore) + "分",
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "平均分")
              ]),
              vue.createElementVNode("text", { class: "arrow" }, "›")
            ])
          ],
          64
          /* STABLE_FRAGMENT */
        )) : vue.createCommentVNode("v-if", true)
      ]),
      $setup.userInfo.role === "STUDENT" ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "card"
      }, [
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[12] || (_cache[12] = ($event) => $setup.goTo("/pages/student/my-classes"))
        }, [
          vue.createElementVNode("view", { class: "nav-icon" }, "🏫"),
          vue.createElementVNode("text", { class: "nav-text" }, "我的班级"),
          vue.createElementVNode("text", { class: "nav-arrow" }, "›")
        ]),
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[13] || (_cache[13] = ($event) => $setup.goTo("/pages/student/exam-list"))
        }, [
          vue.createElementVNode("view", { class: "nav-icon" }, "📋"),
          vue.createElementVNode("text", { class: "nav-text" }, "考试列表"),
          vue.createElementVNode("text", { class: "nav-arrow" }, "›")
        ]),
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[14] || (_cache[14] = ($event) => $setup.goTo("/pages/student/history"))
        }, [
          vue.createElementVNode("view", { class: "nav-icon" }, "📝"),
          vue.createElementVNode("text", { class: "nav-text" }, "考试历史"),
          vue.createElementVNode("text", { class: "nav-arrow" }, "›")
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.userInfo.role === "ADMIN" ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "card"
      }, [
        vue.createElementVNode("view", { class: "card-header" }, [
          vue.createElementVNode("view", { class: "card-title" }, [
            vue.createElementVNode("text", { class: "card-emoji" }, "📝"),
            vue.createElementVNode("text", { class: "title-text" }, "最近操作日志")
          ])
        ]),
        vue.createElementVNode("view", { class: "log-list" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.recentLogs, (log, index) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                class: "log-item",
                key: index
              }, [
                vue.createElementVNode(
                  "view",
                  { class: "log-operator" },
                  vue.toDisplayString(log.operator),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "view",
                  { class: "log-action" },
                  vue.toDisplayString(log.action),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "view",
                  { class: "log-time" },
                  vue.toDisplayString(log.createTime),
                  1
                  /* TEXT */
                )
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          )),
          $setup.recentLogs.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "empty"
          }, [
            vue.createElementVNode("text", { class: "empty-text" }, "暂无日志")
          ])) : vue.createCommentVNode("v-if", true)
        ])
      ])) : vue.createCommentVNode("v-if", true),
      $setup.userInfo.role === "TEACHER" ? (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 2 },
        [
          vue.createElementVNode("view", { class: "card" }, [
            vue.createElementVNode("view", {
              class: "nav-item",
              onClick: _cache[15] || (_cache[15] = ($event) => $setup.goTo("/pages/teacher/my-classes"))
            }, [
              vue.createElementVNode("view", { class: "nav-icon" }, "🏫"),
              vue.createElementVNode("text", { class: "nav-text" }, "班级管理"),
              vue.createElementVNode("text", { class: "nav-arrow" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "nav-item",
              onClick: _cache[16] || (_cache[16] = ($event) => $setup.goTo("/pages/teacher/subject-manage"))
            }, [
              vue.createElementVNode("view", { class: "nav-icon" }, "📚"),
              vue.createElementVNode("text", { class: "nav-text" }, "科目管理"),
              vue.createElementVNode("text", { class: "nav-arrow" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "nav-item",
              onClick: _cache[17] || (_cache[17] = ($event) => $setup.goTo("/pages/teacher/question-manage"))
            }, [
              vue.createElementVNode("view", { class: "nav-icon" }, "❓"),
              vue.createElementVNode("text", { class: "nav-text" }, "题库管理"),
              vue.createElementVNode("text", { class: "nav-arrow" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "nav-item",
              onClick: _cache[18] || (_cache[18] = ($event) => $setup.goTo("/pages/teacher/paper-manage"))
            }, [
              vue.createElementVNode("view", { class: "nav-icon" }, "📄"),
              vue.createElementVNode("text", { class: "nav-text" }, "试卷管理"),
              vue.createElementVNode("text", { class: "nav-arrow" }, "›")
            ]),
            vue.createElementVNode("view", {
              class: "nav-item",
              onClick: _cache[19] || (_cache[19] = ($event) => $setup.goTo("/pages/teacher/exam-manage"))
            }, [
              vue.createElementVNode("view", { class: "nav-icon" }, "📅"),
              vue.createElementVNode("text", { class: "nav-text" }, "考试管理"),
              vue.createElementVNode("text", { class: "nav-arrow" }, "›")
            ])
          ]),
          vue.createElementVNode("view", { class: "card" }, [
            vue.createElementVNode("view", { class: "card-header" }, [
              vue.createElementVNode("view", { class: "card-title" }, [
                vue.createElementVNode("text", { class: "card-emoji" }, "📅"),
                vue.createElementVNode("text", { class: "title-text" }, "最近考试")
              ]),
              vue.createElementVNode("text", {
                class: "card-link",
                onClick: _cache[20] || (_cache[20] = ($event) => $setup.goTo("/pages/teacher/exam-manage"))
              }, "管理考试")
            ]),
            vue.createElementVNode("view", { class: "exam-list" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.recentExams, (exam) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "exam-item",
                    key: exam.id,
                    onClick: ($event) => $setup.goToExam(exam)
                  }, [
                    vue.createElementVNode("view", { class: "exam-info" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "exam-title" },
                        vue.toDisplayString(exam.title),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "exam-meta" },
                        vue.toDisplayString(exam.className) + " | " + vue.toDisplayString(exam.startTime),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "view",
                      {
                        class: vue.normalizeClass(["status-tag", $setup.statusClass(exam.status)])
                      },
                      [
                        vue.createElementVNode(
                          "text",
                          { class: "status-text" },
                          vue.toDisplayString($setup.statusText(exam.status)),
                          1
                          /* TEXT */
                        )
                      ],
                      2
                      /* CLASS */
                    )
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              )),
              $setup.recentExams.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "empty"
              }, [
                vue.createElementVNode("text", { class: "empty-text" }, "暂无考试")
              ])) : vue.createCommentVNode("v-if", true)
            ])
          ])
        ],
        64
        /* STABLE_FRAGMENT */
      )) : vue.createCommentVNode("v-if", true),
      $setup.userInfo.role === "STUDENT" ? (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 3 },
        [
          vue.createElementVNode("view", { class: "card" }, [
            vue.createElementVNode("view", { class: "card-header" }, [
              vue.createElementVNode("view", { class: "card-title" }, [
                vue.createElementVNode("text", { class: "card-emoji" }, "⏰"),
                vue.createElementVNode("text", { class: "title-text" }, "待考考试")
              ]),
              vue.createElementVNode("text", {
                class: "card-link",
                onClick: _cache[21] || (_cache[21] = ($event) => $setup.goTo("/pages/student/exam-list"))
              }, "全部考试")
            ]),
            vue.createElementVNode("view", { class: "exam-list" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.pendingExams, (exam) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "exam-item",
                    key: exam.id
                  }, [
                    vue.createElementVNode("view", { class: "exam-info" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "exam-title" },
                        vue.toDisplayString(exam.title),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "exam-meta" },
                        vue.toDisplayString(exam.startTime) + " | " + vue.toDisplayString(exam.duration) + "分钟",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("button", {
                      class: "exam-btn",
                      disabled: exam.status !== "ONGOING",
                      onClick: ($event) => $setup.goToExam(exam)
                    }, [
                      vue.createElementVNode(
                        "text",
                        { class: "btn-text" },
                        vue.toDisplayString(exam.status === "ONGOING" ? "进入考试" : "等待开始"),
                        1
                        /* TEXT */
                      )
                    ], 8, ["disabled", "onClick"])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              )),
              $setup.pendingExams.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "empty"
              }, [
                vue.createElementVNode("text", { class: "empty-text" }, "暂无待考考试")
              ])) : vue.createCommentVNode("v-if", true)
            ])
          ]),
          vue.createElementVNode("view", { class: "card tips-card" }, [
            vue.createElementVNode("view", { class: "card-header" }, [
              vue.createElementVNode("view", { class: "card-title" }, [
                vue.createElementVNode("text", { class: "card-emoji" }, "ℹ️"),
                vue.createElementVNode("text", { class: "title-text" }, "考试须知")
              ])
            ]),
            vue.createElementVNode("view", { class: "tips-list" }, [
              vue.createElementVNode("view", { class: "tip-item" }, [
                vue.createElementVNode("text", { class: "tip-number" }, "1."),
                vue.createElementVNode("text", { class: "tip-text" }, "进入考试后请保持网络畅通")
              ]),
              vue.createElementVNode("view", { class: "tip-item" }, [
                vue.createElementVNode("text", { class: "tip-number" }, "2."),
                vue.createElementVNode("text", { class: "tip-text" }, "考试过程中请勿频繁切换页面")
              ]),
              vue.createElementVNode("view", { class: "tip-item" }, [
                vue.createElementVNode("text", { class: "tip-number" }, "3."),
                vue.createElementVNode("text", { class: "tip-text" }, "答案会自动保存，但建议手动提交")
              ]),
              vue.createElementVNode("view", { class: "tip-item" }, [
                vue.createElementVNode("text", { class: "tip-number" }, "4."),
                vue.createElementVNode("text", { class: "tip-text" }, "考试结束后可查看错题分析")
              ])
            ])
          ])
        ],
        64
        /* STABLE_FRAGMENT */
      )) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesCommonDashboard = /* @__PURE__ */ _export_sfc(_sfc_main$s, [["render", _sfc_render$9], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/common/dashboard.vue"]]);
  const _sfc_main$r = {
    setup() {
      const userInfo = vue.ref(uni.getStorageSync("userInfo") || {});
      const activeTab = vue.ref("class");
      const myClasses = vue.ref([]);
      const systemMessages = vue.ref([]);
      const goToClass = (cls) => {
        const url = userInfo.value.role === "STUDENT" ? `/pages/student/class-chat?id=${cls.id}` : `/pages/teacher/class-chat?id=${cls.id}`;
        uni.navigateTo({ url });
      };
      const getLastMessage = (cls) => {
        if (!cls.lastMessage)
          return "暂无消息";
        if (cls.lastMessage.startsWith("EXAM_NOTICE|")) {
          return parseExamNotice(cls.lastMessage);
        }
        return cls.lastMessage;
      };
      const parseExamNotice = (content) => {
        if (!(content == null ? void 0 : content.startsWith("EXAM_NOTICE|")))
          return "";
        const parts = content.split("|");
        const noticeType = parts[1] || "";
        const title = parts[2] || "";
        if (noticeType === "START") {
          return "🚀 " + title + " 开始考试";
        } else if (noticeType === "PUBLISH") {
          return "📢 " + title + " 发布通知";
        } else if (noticeType === "END") {
          return "🔚 " + title + " 考试结束";
        }
        return "📝 " + title;
      };
      const formatTime = (time) => {
        if (!time)
          return "";
        const date = new Date(time);
        const now2 = /* @__PURE__ */ new Date();
        const diff = now2 - date;
        if (diff < 6e4)
          return "刚刚";
        if (diff < 36e5)
          return Math.floor(diff / 6e4) + "分钟前";
        if (diff < 864e5)
          return Math.floor(diff / 36e5) + "小时前";
        return date.toLocaleDateString("zh-CN");
      };
      const loadMyClasses = async () => {
        try {
          const userId = userInfo.value.id || userInfo.value.userId;
          if (!userId)
            return;
          const res = await classApi.getMyClasses(userId);
          if (res.code === 200) {
            myClasses.value = (res.data || []).map((cls) => ({
              ...cls,
              memberCount: cls.memberCount || 0,
              lastMessage: cls.lastMessage || "",
              lastMessageTime: cls.lastMessageTime || ""
            }));
          }
        } catch (e) {
          formatAppLog("error", "at pages/common/message.vue:142", "加载班级失败:", e);
        }
      };
      const loadSystemMessages = async () => {
        systemMessages.value = [];
      };
      vue.onMounted(async () => {
        await loadMyClasses();
        await loadSystemMessages();
      });
      return {
        userInfo,
        activeTab,
        myClasses,
        systemMessages,
        goToClass,
        getLastMessage,
        formatTime
      };
    }
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "message-page" }, [
      vue.createElementVNode("view", { class: "page-header" }, [
        vue.createElementVNode("text", { class: "title" }, "消息")
      ]),
      vue.createElementVNode("view", { class: "tabs" }, [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["tab-item", { active: $setup.activeTab === "class" }]),
            onClick: _cache[0] || (_cache[0] = ($event) => $setup.activeTab = "class")
          },
          [
            vue.createElementVNode("text", { class: "tab-text" }, "班级消息")
          ],
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["tab-item", { active: $setup.activeTab === "system" }]),
            onClick: _cache[1] || (_cache[1] = ($event) => $setup.activeTab = "system")
          },
          [
            vue.createElementVNode("text", { class: "tab-text" }, "系统通知")
          ],
          2
          /* CLASS */
        )
      ]),
      vue.createElementVNode("scroll-view", {
        class: "content",
        "scroll-y": ""
      }, [
        $setup.activeTab === "class" ? (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 0 },
          [
            $setup.myClasses.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "class-list"
            }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.myClasses, (item) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "class-item",
                    key: item.class.id,
                    onClick: ($event) => $setup.goToClass(item.class)
                  }, [
                    vue.createElementVNode("view", { class: "class-icon" }, [
                      vue.createElementVNode("text", { class: "icon-emoji" }, "🏫")
                    ]),
                    vue.createElementVNode("view", { class: "class-info" }, [
                      vue.createElementVNode("view", { class: "class-header" }, [
                        vue.createElementVNode(
                          "text",
                          { class: "class-name" },
                          vue.toDisplayString(item.class.className),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode(
                          "text",
                          { class: "class-time" },
                          vue.toDisplayString($setup.formatTime(item.class.lastMessageTime)),
                          1
                          /* TEXT */
                        )
                      ]),
                      vue.createElementVNode(
                        "text",
                        { class: "last-message" },
                        vue.toDisplayString($setup.getLastMessage(item.class)),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "class-arrow" }, [
                      vue.createElementVNode("text", { class: "arrow-icon" }, "›")
                    ])
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])) : (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "empty"
            }, [
              vue.createElementVNode("text", { class: "empty-emoji" }, "📭"),
              vue.createElementVNode("text", { class: "empty-text" }, "暂无班级消息")
            ]))
          ],
          64
          /* STABLE_FRAGMENT */
        )) : vue.createCommentVNode("v-if", true),
        $setup.activeTab === "system" ? (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 1 },
          [
            $setup.systemMessages.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "system-list"
            }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.systemMessages, (msg) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "system-item",
                    key: msg.id
                  }, [
                    vue.createElementVNode("view", { class: "system-icon" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "icon-emoji" },
                        vue.toDisplayString(msg.type === "EXAM" ? "📝" : "📢"),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "system-info" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "system-title" },
                        vue.toDisplayString(msg.title),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "system-content" },
                        vue.toDisplayString(msg.content),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "system-time" },
                        vue.toDisplayString($setup.formatTime(msg.createTime)),
                        1
                        /* TEXT */
                      )
                    ])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])) : (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "empty"
            }, [
              vue.createElementVNode("text", { class: "empty-emoji" }, "🔔"),
              vue.createElementVNode("text", { class: "empty-text" }, "暂无系统通知")
            ]))
          ],
          64
          /* STABLE_FRAGMENT */
        )) : vue.createCommentVNode("v-if", true)
      ])
    ]);
  }
  const PagesCommonMessage = /* @__PURE__ */ _export_sfc(_sfc_main$r, [["render", _sfc_render$8], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/common/message.vue"]]);
  const _sfc_main$q = {
    setup() {
      const userInfo = vue.ref(uni.getStorageSync("userInfo") || {});
      const roleText = vue.computed(() => {
        const map = { ADMIN: "管理员", TEACHER: "教师", STUDENT: "学生" };
        return map[userInfo.value.role] || "用户";
      });
      const getAvatarUrl = (avatar) => {
        if (!avatar) {
          const name = userInfo.value.realName || userInfo.value.username || "用户";
          const firstChar = name.charAt(0);
          return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstChar)}&background=dc2626&color=fff&size=100`;
        }
        if (avatar.startsWith("http")) {
          return avatar;
        }
        return "http://192.168.34.49:8081" + avatar;
      };
      const showEditPopup = vue.ref(false);
      const showPasswordPopup = vue.ref(false);
      const showAboutPopup = vue.ref(false);
      const showAvatarMenuVisible = vue.ref(false);
      const showViewAvatar = vue.ref(false);
      const editForm = vue.reactive({
        username: userInfo.value.username || "",
        realName: userInfo.value.realName || "",
        email: userInfo.value.email || "",
        phone: userInfo.value.phone || ""
      });
      const passwordForm = vue.reactive({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      const showEditInfo = () => {
        editForm.username = userInfo.value.username || "";
        editForm.realName = userInfo.value.realName || "";
        editForm.email = userInfo.value.email || "";
        editForm.phone = userInfo.value.phone || "";
        showEditPopup.value = true;
      };
      const closeEditPopup = () => {
        showEditPopup.value = false;
      };
      const showChangePassword = () => {
        showPasswordPopup.value = true;
      };
      const closePasswordPopup = () => {
        passwordForm.oldPassword = "";
        passwordForm.newPassword = "";
        passwordForm.confirmPassword = "";
        showPasswordPopup.value = false;
      };
      const showAbout = () => {
        showAboutPopup.value = true;
      };
      const closeAboutPopup = () => {
        showAboutPopup.value = false;
      };
      const showAvatarMenu = () => {
        showAvatarMenuVisible.value = true;
      };
      const closeAvatarMenu = () => {
        showAvatarMenuVisible.value = false;
      };
      const handleViewAvatar = () => {
        closeAvatarMenu();
        showViewAvatar.value = true;
      };
      const closeViewAvatar = () => {
        showViewAvatar.value = false;
      };
      const handleChangeAvatar = () => {
        closeAvatarMenu();
        uni.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"],
          success: (res) => {
            const tempFilePath = res.tempFilePaths[0];
            uploadAvatar(tempFilePath);
          },
          fail: () => {
            uni.showToast({ title: "选择图片失败", icon: "none" });
          }
        });
      };
      const uploadAvatar = async (filePath) => {
        uni.showLoading({ title: "上传中..." });
        try {
          const result = await upload$1("/upload/avatar", filePath);
          if (result.code === 200) {
            const avatarUrl = result.data;
            const userId = userInfo.value.userId || userInfo.value.id;
            await userApi.update({
              id: userId,
              avatar: avatarUrl
            });
            userInfo.value.avatar = avatarUrl;
            uni.setStorageSync("userInfo", userInfo.value);
            uni.showToast({ title: "上传成功", icon: "success" });
          } else {
            uni.showToast({ title: result.message || "上传失败", icon: "none" });
          }
        } catch (e) {
          formatAppLog("error", "at pages/common/account.vue:343", e);
          uni.showToast({ title: "上传失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const goTo = (url) => {
        uni.navigateTo({ url });
      };
      const saveEditInfo = async () => {
        if (!editForm.realName) {
          uni.showToast({ title: "请输入真实姓名", icon: "none" });
          return;
        }
        const userId = userInfo.value.userId || userInfo.value.id;
        if (!userId) {
          uni.showToast({ title: "用户信息异常", icon: "none" });
          return;
        }
        try {
          const res = await userApi.update({
            id: userId,
            username: editForm.username,
            realName: editForm.realName,
            email: editForm.email,
            phone: editForm.phone
          });
          if (res.code === 200) {
            uni.showToast({ title: "保存成功", icon: "success" });
            const updatedUserInfo = {
              ...userInfo.value,
              realName: editForm.realName,
              email: editForm.email,
              phone: editForm.phone
            };
            userInfo.value = updatedUserInfo;
            uni.setStorageSync("userInfo", updatedUserInfo);
            closeEditPopup();
          } else {
            uni.showToast({ title: res.message || "保存失败", icon: "none" });
          }
        } catch (e) {
          uni.showToast({ title: e.message || "保存失败", icon: "none" });
        }
      };
      const savePassword = async () => {
        if (!passwordForm.oldPassword) {
          uni.showToast({ title: "请输入当前密码", icon: "none" });
          return;
        }
        if (!passwordForm.newPassword) {
          uni.showToast({ title: "请输入新密码", icon: "none" });
          return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          uni.showToast({ title: "两次密码不一致", icon: "none" });
          return;
        }
        try {
          const res = await authApi.changePassword({
            oldPassword: passwordForm.oldPassword,
            newPassword: passwordForm.newPassword
          });
          if (res.code === 200) {
            uni.showToast({ title: "密码修改成功", icon: "success" });
            closePasswordPopup();
          } else {
            uni.showToast({ title: res.message || "修改失败", icon: "none" });
          }
        } catch (e) {
          uni.showToast({ title: e.message || "修改失败", icon: "none" });
        }
      };
      const clearCache = () => {
        uni.showModal({
          title: "提示",
          content: "确定要清除缓存吗？",
          success: (res) => {
            if (res.confirm) {
              uni.clearStorage();
              uni.showToast({ title: "缓存已清除", icon: "success" });
            }
          }
        });
      };
      const handleLogout = () => {
        uni.showModal({
          title: "提示",
          content: "确定要退出登录吗？",
          success: (res) => {
            if (res.confirm) {
              uni.removeStorageSync("token");
              uni.removeStorageSync("userInfo");
              uni.reLaunch({
                url: "/pages/common/login"
              });
            }
          }
        });
      };
      return {
        userInfo,
        roleText,
        getAvatarUrl,
        showEditPopup,
        showPasswordPopup,
        showAboutPopup,
        showAvatarMenuVisible,
        showViewAvatar,
        editForm,
        passwordForm,
        showEditInfo,
        closeEditPopup,
        showChangePassword,
        closePasswordPopup,
        showAbout,
        closeAboutPopup,
        showAvatarMenu,
        closeAvatarMenu,
        handleViewAvatar,
        closeViewAvatar,
        handleChangeAvatar,
        saveEditInfo,
        savePassword,
        clearCache,
        handleLogout,
        goTo
      };
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "account-page" }, [
      vue.createCommentVNode(" 用户信息头部 "),
      vue.createElementVNode("view", { class: "user-header" }, [
        vue.createElementVNode("view", {
          class: "avatar-box",
          onClick: _cache[0] || (_cache[0] = (...args) => $setup.showAvatarMenu && $setup.showAvatarMenu(...args))
        }, [
          vue.createElementVNode("image", {
            class: "avatar",
            src: $setup.getAvatarUrl($setup.userInfo.avatar),
            mode: "aspectFill"
          }, null, 8, ["src"]),
          vue.createElementVNode("view", { class: "avatar-edit-icon" }, [
            vue.createElementVNode("text", { class: "edit-icon" }, "✎")
          ])
        ]),
        vue.createElementVNode("view", { class: "user-info" }, [
          vue.createElementVNode(
            "text",
            { class: "username" },
            vue.toDisplayString($setup.userInfo.realName || $setup.userInfo.username || "用户"),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "role" },
            vue.toDisplayString($setup.roleText),
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createCommentVNode(" 功能列表 "),
      vue.createElementVNode("view", { class: "menu-list" }, [
        vue.createCommentVNode(" 基本信息 "),
        vue.createElementVNode("view", { class: "menu-group" }, [
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: _cache[1] || (_cache[1] = (...args) => $setup.showEditInfo && $setup.showEditInfo(...args))
          }, [
            vue.createElementVNode("view", { class: "menu-icon" }, [
              vue.createElementVNode("text", { class: "emoji-icon" }, "👤")
            ]),
            vue.createElementVNode("text", { class: "menu-text" }, "基本资料"),
            vue.createElementVNode("view", { class: "menu-arrow" }, [
              vue.createElementVNode("text", { class: "arrow-icon" }, "›")
            ])
          ]),
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: _cache[2] || (_cache[2] = (...args) => $setup.showChangePassword && $setup.showChangePassword(...args))
          }, [
            vue.createElementVNode("view", { class: "menu-icon" }, [
              vue.createElementVNode("text", { class: "emoji-icon" }, "🔒")
            ]),
            vue.createElementVNode("text", { class: "menu-text" }, "修改密码"),
            vue.createElementVNode("view", { class: "menu-arrow" }, [
              vue.createElementVNode("text", { class: "arrow-icon" }, "›")
            ])
          ])
        ]),
        vue.createCommentVNode(" 学习功能（仅学生） "),
        $setup.userInfo.role === "STUDENT" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "menu-group"
        }, [
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: _cache[3] || (_cache[3] = ($event) => $setup.goTo("/pages/student/statistics"))
          }, [
            vue.createElementVNode("view", { class: "menu-icon" }, [
              vue.createElementVNode("text", { class: "emoji-icon" }, "📊")
            ]),
            vue.createElementVNode("text", { class: "menu-text" }, "成绩分析"),
            vue.createElementVNode("view", { class: "menu-arrow" }, [
              vue.createElementVNode("text", { class: "arrow-icon" }, "›")
            ])
          ]),
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: _cache[4] || (_cache[4] = ($event) => $setup.goTo("/pages/student/wrong-questions"))
          }, [
            vue.createElementVNode("view", { class: "menu-icon" }, [
              vue.createElementVNode("text", { class: "emoji-icon" }, "❌")
            ]),
            vue.createElementVNode("text", { class: "menu-text" }, "错题本"),
            vue.createElementVNode("view", { class: "menu-arrow" }, [
              vue.createElementVNode("text", { class: "arrow-icon" }, "›")
            ])
          ])
        ])) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" 教师功能（仅教师） "),
        $setup.userInfo.role === "TEACHER" ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "menu-group"
        }, [
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: _cache[5] || (_cache[5] = ($event) => $setup.goTo("/pages/teacher/exam-record-manage"))
          }, [
            vue.createElementVNode("view", { class: "menu-icon" }, [
              vue.createElementVNode("text", { class: "emoji-icon" }, "📝")
            ]),
            vue.createElementVNode("text", { class: "menu-text" }, "考试记录"),
            vue.createElementVNode("view", { class: "menu-arrow" }, [
              vue.createElementVNode("text", { class: "arrow-icon" }, "›")
            ])
          ])
        ])) : vue.createCommentVNode("v-if", true),
        vue.createCommentVNode(" 其他功能 "),
        vue.createElementVNode("view", { class: "menu-group" }, [
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: _cache[6] || (_cache[6] = (...args) => $setup.showAbout && $setup.showAbout(...args))
          }, [
            vue.createElementVNode("view", { class: "menu-icon" }, [
              vue.createElementVNode("text", { class: "emoji-icon" }, "ℹ️")
            ]),
            vue.createElementVNode("text", { class: "menu-text" }, "关于系统"),
            vue.createElementVNode("view", { class: "menu-arrow" }, [
              vue.createElementVNode("text", { class: "arrow-icon" }, "›")
            ])
          ]),
          vue.createElementVNode("view", {
            class: "menu-item",
            onClick: _cache[7] || (_cache[7] = (...args) => $setup.clearCache && $setup.clearCache(...args))
          }, [
            vue.createElementVNode("view", { class: "menu-icon" }, [
              vue.createElementVNode("text", { class: "emoji-icon" }, "🗑️")
            ]),
            vue.createElementVNode("text", { class: "menu-text" }, "清除缓存"),
            vue.createElementVNode("view", { class: "menu-arrow" }, [
              vue.createElementVNode("text", { class: "arrow-icon" }, "›")
            ])
          ])
        ]),
        vue.createCommentVNode(" 退出登录 "),
        vue.createElementVNode("view", {
          class: "logout-btn",
          onClick: _cache[8] || (_cache[8] = (...args) => $setup.handleLogout && $setup.handleLogout(...args))
        }, [
          vue.createElementVNode("text", { class: "logout-text" }, "退出登录")
        ])
      ]),
      vue.createCommentVNode(" 编辑信息弹窗 "),
      $setup.showEditPopup ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "popup-mask",
        onClick: _cache[9] || (_cache[9] = (...args) => $setup.closeEditPopup && $setup.closeEditPopup(...args))
      })) : vue.createCommentVNode("v-if", true),
      $setup.showEditPopup ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "popup-bottom"
      }, [
        vue.createElementVNode("view", { class: "popup-content" }, [
          vue.createElementVNode("view", { class: "popup-header" }, [
            vue.createElementVNode("text", { class: "popup-title" }, "编辑基本资料"),
            vue.createElementVNode("text", {
              class: "popup-close",
              onClick: _cache[10] || (_cache[10] = (...args) => $setup.closeEditPopup && $setup.closeEditPopup(...args))
            }, "关闭")
          ]),
          vue.createElementVNode("view", { class: "form-content" }, [
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "label" }, "用户名"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "input",
                  type: "text",
                  "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => $setup.editForm.username = $event),
                  disabled: ""
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.editForm.username]
              ])
            ]),
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "label" }, "真实姓名"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "input",
                  type: "text",
                  "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => $setup.editForm.realName = $event),
                  placeholder: "请输入真实姓名"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.editForm.realName]
              ])
            ]),
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "label" }, "邮箱"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "input",
                  type: "text",
                  "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => $setup.editForm.email = $event),
                  placeholder: "请输入邮箱"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.editForm.email]
              ])
            ]),
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "label" }, "手机号"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "input",
                  type: "text",
                  "onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => $setup.editForm.phone = $event),
                  placeholder: "请输入手机号"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.editForm.phone]
              ])
            ]),
            vue.createElementVNode("button", {
              class: "save-btn",
              onClick: _cache[15] || (_cache[15] = (...args) => $setup.saveEditInfo && $setup.saveEditInfo(...args))
            }, "保存修改")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 修改密码弹窗 "),
      $setup.showPasswordPopup ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "popup-mask",
        onClick: _cache[16] || (_cache[16] = (...args) => $setup.closePasswordPopup && $setup.closePasswordPopup(...args))
      })) : vue.createCommentVNode("v-if", true),
      $setup.showPasswordPopup ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 3,
        class: "popup-bottom"
      }, [
        vue.createElementVNode("view", { class: "popup-content" }, [
          vue.createElementVNode("view", { class: "popup-header" }, [
            vue.createElementVNode("text", { class: "popup-title" }, "修改密码"),
            vue.createElementVNode("text", {
              class: "popup-close",
              onClick: _cache[17] || (_cache[17] = (...args) => $setup.closePasswordPopup && $setup.closePasswordPopup(...args))
            }, "关闭")
          ]),
          vue.createElementVNode("view", { class: "form-content" }, [
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "label" }, "当前密码"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "input",
                  type: "password",
                  "onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => $setup.passwordForm.oldPassword = $event),
                  placeholder: "请输入当前密码"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.passwordForm.oldPassword]
              ])
            ]),
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "label" }, "新密码"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "input",
                  type: "password",
                  "onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => $setup.passwordForm.newPassword = $event),
                  placeholder: "请输入新密码"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.passwordForm.newPassword]
              ])
            ]),
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "label" }, "确认新密码"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "input",
                  type: "password",
                  "onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => $setup.passwordForm.confirmPassword = $event),
                  placeholder: "请确认新密码"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.passwordForm.confirmPassword]
              ])
            ]),
            vue.createElementVNode("button", {
              class: "save-btn",
              onClick: _cache[21] || (_cache[21] = (...args) => $setup.savePassword && $setup.savePassword(...args))
            }, "保存修改")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 关于弹窗 "),
      $setup.showAboutPopup ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 4,
        class: "popup-mask",
        onClick: _cache[22] || (_cache[22] = (...args) => $setup.closeAboutPopup && $setup.closeAboutPopup(...args))
      })) : vue.createCommentVNode("v-if", true),
      $setup.showAboutPopup ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 5,
        class: "popup-center"
      }, [
        vue.createElementVNode("view", { class: "about-content" }, [
          vue.createElementVNode("image", {
            class: "about-logo",
            src: "/static/logo.png",
            mode: "aspectFit"
          }),
          vue.createElementVNode("text", { class: "about-title" }, "ExamPro"),
          vue.createElementVNode("text", { class: "about-version" }, "版本 1.0.0"),
          vue.createElementVNode("text", { class: "about-desc" }, "专业的在线考试系统，让学习更高效"),
          vue.createElementVNode("text", { class: "about-copy" }, "© 2024 ExamPro Team"),
          vue.createElementVNode("button", {
            class: "about-close-btn",
            onClick: _cache[23] || (_cache[23] = (...args) => $setup.closeAboutPopup && $setup.closeAboutPopup(...args))
          }, "确定")
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 头像操作菜单 "),
      $setup.showAvatarMenuVisible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 6,
        class: "popup-mask",
        onClick: _cache[24] || (_cache[24] = (...args) => $setup.closeAvatarMenu && $setup.closeAvatarMenu(...args))
      })) : vue.createCommentVNode("v-if", true),
      $setup.showAvatarMenuVisible ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 7,
        class: "avatar-menu-popup"
      }, [
        vue.createElementVNode("view", { class: "avatar-menu-content" }, [
          vue.createElementVNode("view", {
            class: "avatar-menu-item",
            onClick: _cache[25] || (_cache[25] = (...args) => $setup.handleViewAvatar && $setup.handleViewAvatar(...args))
          }, [
            vue.createElementVNode("text", { class: "menu-item-icon" }, "👁️"),
            vue.createElementVNode("text", { class: "menu-item-text" }, "查看头像")
          ]),
          vue.createElementVNode("view", {
            class: "avatar-menu-item",
            onClick: _cache[26] || (_cache[26] = (...args) => $setup.handleChangeAvatar && $setup.handleChangeAvatar(...args))
          }, [
            vue.createElementVNode("text", { class: "menu-item-icon" }, "📷"),
            vue.createElementVNode("text", { class: "menu-item-text" }, "更换头像")
          ]),
          vue.createElementVNode("view", {
            class: "avatar-menu-cancel",
            onClick: _cache[27] || (_cache[27] = (...args) => $setup.closeAvatarMenu && $setup.closeAvatarMenu(...args))
          }, [
            vue.createElementVNode("text", { class: "menu-cancel-text" }, "取消")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 查看头像弹窗 "),
      $setup.showViewAvatar ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 8,
        class: "popup-mask",
        onClick: _cache[28] || (_cache[28] = (...args) => $setup.closeViewAvatar && $setup.closeViewAvatar(...args))
      })) : vue.createCommentVNode("v-if", true),
      $setup.showViewAvatar ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 9,
        class: "view-avatar-popup"
      }, [
        vue.createElementVNode("image", {
          class: "view-avatar-img",
          src: $setup.getAvatarUrl($setup.userInfo.avatar),
          mode: "aspectFit",
          onClick: _cache[29] || (_cache[29] = vue.withModifiers(() => {
          }, ["stop"]))
        }, null, 8, ["src"]),
        vue.createElementVNode("text", {
          class: "view-avatar-close",
          onClick: _cache[30] || (_cache[30] = (...args) => $setup.closeViewAvatar && $setup.closeViewAvatar(...args))
        }, "✕")
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesCommonAccount = /* @__PURE__ */ _export_sfc(_sfc_main$q, [["render", _sfc_render$7], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/common/account.vue"]]);
  const _sfc_main$p = {
    setup() {
      const keyword = vue.ref("");
      const userList = vue.ref([]);
      const total = vue.ref(0);
      const current = vue.ref(1);
      const size = vue.ref(20);
      const getRoleText = (role) => {
        const map = { ADMIN: "管理员", TEACHER: "教师", STUDENT: "学生" };
        return map[role] || role;
      };
      const loadData = async () => {
        try {
          uni.showLoading({ title: "加载中..." });
          const res = await userApi.page({
            current: current.value,
            size: size.value,
            keyword: keyword.value
          });
          if (res.code === 200) {
            userList.value = res.data.records;
            total.value = res.data.total;
          }
        } catch (e) {
          uni.showToast({ title: "加载失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const addUser = () => {
        uni.showToast({ title: "功能开发中", icon: "none" });
      };
      const editUser = (user) => {
        uni.showToast({ title: "功能开发中", icon: "none" });
      };
      const deleteUser = async (user) => {
        uni.showModal({
          title: "提示",
          content: `确定要删除用户 ${user.username} 吗？`,
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await userApi.delete(user.id);
                if (result.code === 200) {
                  uni.showToast({ title: "删除成功", icon: "success" });
                  loadData();
                } else {
                  uni.showToast({ title: result.message || "删除失败", icon: "none" });
                }
              } catch (e) {
                uni.showToast({ title: "删除失败", icon: "none" });
              }
            }
          }
        });
      };
      vue.onMounted(() => {
        loadData();
      });
      return {
        keyword,
        userList,
        total,
        getRoleText,
        loadData,
        addUser,
        editUser,
        deleteUser
      };
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = vue.resolveComponent("uni-icons");
    return vue.openBlock(), vue.createElementBlock("view", { class: "manage-page" }, [
      vue.createElementVNode("view", { class: "page-header" }, [
        vue.createElementVNode("text", { class: "title" }, "用户管理")
      ]),
      vue.createCommentVNode(" 搜索栏 "),
      vue.createElementVNode("view", { class: "search-bar" }, [
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "search-input",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.keyword = $event),
            placeholder: "搜索用户名"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.keyword]
        ]),
        vue.createElementVNode("button", {
          class: "search-btn",
          onClick: _cache[1] || (_cache[1] = (...args) => $setup.loadData && $setup.loadData(...args))
        }, "搜索")
      ]),
      vue.createCommentVNode(" 用户列表 "),
      vue.createElementVNode("view", { class: "user-list" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.userList, (user) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "user-item",
              key: user.id
            }, [
              vue.createElementVNode("view", { class: "user-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "username" },
                  vue.toDisplayString(user.username),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "role" },
                  vue.toDisplayString($setup.getRoleText(user.role)),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "user-actions" }, [
                vue.createElementVNode("text", {
                  class: "action-btn",
                  onClick: ($event) => $setup.editUser(user)
                }, "编辑", 8, ["onClick"]),
                vue.createElementVNode("text", {
                  class: "action-btn danger",
                  onClick: ($event) => $setup.deleteUser(user)
                }, "删除", 8, ["onClick"])
              ])
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        )),
        $setup.userList.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "empty"
        }, [
          vue.createElementVNode("text", { class: "empty-text" }, "暂无用户数据")
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 分页 "),
      vue.createElementVNode("view", { class: "pagination" }, [
        vue.createElementVNode(
          "text",
          { class: "page-info" },
          "共 " + vue.toDisplayString($setup.total) + " 条",
          1
          /* TEXT */
        )
      ]),
      vue.createCommentVNode(" 新增按钮 "),
      vue.createElementVNode("view", {
        class: "add-btn",
        onClick: _cache[2] || (_cache[2] = (...args) => $setup.addUser && $setup.addUser(...args))
      }, [
        vue.createVNode(_component_uni_icons, {
          type: "plus",
          size: "20",
          color: "#fff"
        }),
        vue.createElementVNode("text", { class: "add-text" }, "新增用户")
      ])
    ]);
  }
  const PagesAdminUserManage = /* @__PURE__ */ _export_sfc(_sfc_main$p, [["render", _sfc_render$6], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/admin/user-manage.vue"]]);
  const _sfc_main$o = {
    setup() {
      const keyword = vue.ref("");
      const deptList = vue.ref([]);
      const loadData = async () => {
        try {
          uni.showLoading({ title: "加载中..." });
          const res = await departmentApi.list();
          if (res.code === 200) {
            deptList.value = res.data;
          }
        } catch (e) {
          uni.showToast({ title: "加载失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const addDept = () => {
        uni.showToast({ title: "功能开发中", icon: "none" });
      };
      const editDept = (dept) => {
        uni.showToast({ title: "功能开发中", icon: "none" });
      };
      const deleteDept = async (dept) => {
        uni.showModal({
          title: "提示",
          content: `确定要删除院系 ${dept.name} 吗？`,
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await departmentApi.delete(dept.id);
                if (result.code === 200) {
                  uni.showToast({ title: "删除成功", icon: "success" });
                  loadData();
                } else {
                  uni.showToast({ title: result.message || "删除失败", icon: "none" });
                }
              } catch (e) {
                uni.showToast({ title: "删除失败", icon: "none" });
              }
            }
          }
        });
      };
      vue.onMounted(() => {
        loadData();
      });
      return {
        keyword,
        deptList,
        loadData,
        addDept,
        editDept,
        deleteDept
      };
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = vue.resolveComponent("uni-icons");
    return vue.openBlock(), vue.createElementBlock("view", { class: "manage-page" }, [
      vue.createElementVNode("view", { class: "page-header" }, [
        vue.createElementVNode("text", { class: "title" }, "院系管理")
      ]),
      vue.createCommentVNode(" 搜索栏 "),
      vue.createElementVNode("view", { class: "search-bar" }, [
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "search-input",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.keyword = $event),
            placeholder: "搜索院系名称"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.keyword]
        ]),
        vue.createElementVNode("button", {
          class: "search-btn",
          onClick: _cache[1] || (_cache[1] = (...args) => $setup.loadData && $setup.loadData(...args))
        }, "搜索")
      ]),
      vue.createCommentVNode(" 院系列表 "),
      vue.createElementVNode("view", { class: "dept-list" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.deptList, (dept) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "dept-item",
              key: dept.id
            }, [
              vue.createElementVNode("view", { class: "dept-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "dept-name" },
                  vue.toDisplayString(dept.name),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "dept-code" },
                  vue.toDisplayString(dept.code || "-"),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "dept-actions" }, [
                vue.createElementVNode("text", {
                  class: "action-btn",
                  onClick: ($event) => $setup.editDept(dept)
                }, "编辑", 8, ["onClick"]),
                vue.createElementVNode("text", {
                  class: "action-btn danger",
                  onClick: ($event) => $setup.deleteDept(dept)
                }, "删除", 8, ["onClick"])
              ])
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        )),
        $setup.deptList.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "empty"
        }, [
          vue.createElementVNode("text", { class: "empty-text" }, "暂无院系数据")
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 新增按钮 "),
      vue.createElementVNode("view", {
        class: "add-btn",
        onClick: _cache[2] || (_cache[2] = (...args) => $setup.addDept && $setup.addDept(...args))
      }, [
        vue.createVNode(_component_uni_icons, {
          type: "plus",
          size: "20",
          color: "#fff"
        }),
        vue.createElementVNode("text", { class: "add-text" }, "新增院系")
      ])
    ]);
  }
  const PagesAdminDepartmentManage = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["render", _sfc_render$5], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/admin/department-manage.vue"]]);
  const _sfc_main$n = {
    setup() {
      const keyword = vue.ref("");
      const classList = vue.ref([]);
      const departments = vue.ref([]);
      const selectedDeptId = vue.ref(null);
      const selectedDeptName = computed(() => {
        const dept = departments.value.find((d) => d.id === selectedDeptId.value);
        return (dept == null ? void 0 : dept.name) || "";
      });
      const getDeptName = (id) => {
        const dept = departments.value.find((d) => d.id === id);
        return (dept == null ? void 0 : dept.name) || "-";
      };
      const onDeptChange = (e) => {
        const index = e.detail.value;
        if (departments.value[index]) {
          selectedDeptId.value = departments.value[index].id;
        }
      };
      const loadData = async () => {
        try {
          uni.showLoading({ title: "加载中..." });
          const res = await classApi.page({
            current: 1,
            size: 20,
            keyword: keyword.value,
            departmentId: selectedDeptId.value
          });
          if (res.code === 200) {
            classList.value = res.data.records;
          }
        } catch (e) {
          uni.showToast({ title: "加载失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const loadDepartments = async () => {
        try {
          const res = await departmentApi.list();
          if (res.code === 200) {
            departments.value = res.data;
          }
        } catch (e) {
          formatAppLog("error", "at pages/admin/class-manage.vue:98", e);
        }
      };
      const addClass = () => {
        uni.showToast({ title: "功能开发中", icon: "none" });
      };
      const editClass = (item) => {
        uni.showToast({ title: "功能开发中", icon: "none" });
      };
      const deleteClass = async (item) => {
        uni.showModal({
          title: "提示",
          content: `确定要删除班级 ${item.className} 吗？`,
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await classApi.delete(item.id);
                if (result.code === 200) {
                  uni.showToast({ title: "删除成功", icon: "success" });
                  loadData();
                } else {
                  uni.showToast({ title: result.message || "删除失败", icon: "none" });
                }
              } catch (e) {
                uni.showToast({ title: "删除失败", icon: "none" });
              }
            }
          }
        });
      };
      vue.onMounted(() => {
        loadDepartments();
        loadData();
      });
      return {
        keyword,
        classList,
        departments,
        selectedDeptName,
        getDeptName,
        onDeptChange,
        loadData,
        addClass,
        editClass,
        deleteClass
      };
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uni_icons = vue.resolveComponent("uni-icons");
    return vue.openBlock(), vue.createElementBlock("view", { class: "manage-page" }, [
      vue.createElementVNode("view", { class: "page-header" }, [
        vue.createElementVNode("text", { class: "title" }, "班级管理")
      ]),
      vue.createCommentVNode(" 搜索栏 "),
      vue.createElementVNode("view", { class: "search-bar" }, [
        vue.createElementVNode("picker", {
          mode: "selector",
          range: $setup.departments,
          "range-key": "name",
          onChange: _cache[0] || (_cache[0] = (...args) => $setup.onDeptChange && $setup.onDeptChange(...args))
        }, [
          vue.createElementVNode("view", { class: "picker" }, [
            vue.createElementVNode(
              "text",
              { class: "picker-text" },
              vue.toDisplayString($setup.selectedDeptName || "选择院系"),
              1
              /* TEXT */
            )
          ])
        ], 40, ["range"]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "search-input",
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.keyword = $event),
            placeholder: "搜索班级名称"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.keyword]
        ]),
        vue.createElementVNode("button", {
          class: "search-btn",
          onClick: _cache[2] || (_cache[2] = (...args) => $setup.loadData && $setup.loadData(...args))
        }, "搜索")
      ]),
      vue.createCommentVNode(" 班级列表 "),
      vue.createElementVNode("view", { class: "list" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.classList, (item) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "list-item",
              key: item.id
            }, [
              vue.createElementVNode("view", { class: "item-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "item-title" },
                  vue.toDisplayString(item.className),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "item-meta" },
                  "群号: " + vue.toDisplayString(item.inviteCode || "-") + " | " + vue.toDisplayString($setup.getDeptName(item.departmentId)),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "item-actions" }, [
                vue.createElementVNode("text", {
                  class: "action-btn",
                  onClick: ($event) => $setup.editClass(item)
                }, "编辑", 8, ["onClick"]),
                vue.createElementVNode("text", {
                  class: "action-btn danger",
                  onClick: ($event) => $setup.deleteClass(item)
                }, "删除", 8, ["onClick"])
              ])
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        )),
        $setup.classList.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "empty"
        }, [
          vue.createElementVNode("text", { class: "empty-text" }, "暂无班级数据")
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 新增按钮 "),
      vue.createElementVNode("view", {
        class: "add-btn",
        onClick: _cache[3] || (_cache[3] = (...args) => $setup.addClass && $setup.addClass(...args))
      }, [
        vue.createVNode(_component_uni_icons, {
          type: "plus",
          size: "20",
          color: "#fff"
        }),
        vue.createElementVNode("text", { class: "add-text" }, "新增班级")
      ])
    ]);
  }
  const PagesAdminClassManage = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["render", _sfc_render$4], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/admin/class-manage.vue"]]);
  const _sfc_main$m = {
    setup() {
      const logList = vue.ref([]);
      const formatTime = (time) => {
        if (!time)
          return "-";
        const date = new Date(time);
        return date.toLocaleString("zh-CN");
      };
      const loadData = async () => {
        try {
          uni.showLoading({ title: "加载中..." });
          const res = await logApi.page({ current: 1, size: 50 });
          if (res.code === 200) {
            logList.value = res.data.records;
          }
        } catch (e) {
          uni.showToast({ title: "加载失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      vue.onMounted(() => {
        loadData();
      });
      return {
        logList,
        formatTime
      };
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "manage-page" }, [
      vue.createElementVNode("view", { class: "page-header" }, [
        vue.createElementVNode("text", { class: "title" }, "日志管理")
      ]),
      vue.createCommentVNode(" 日志列表 "),
      vue.createElementVNode("view", { class: "log-list" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.logList, (log) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "log-item",
              key: log.id
            }, [
              vue.createElementVNode("view", { class: "log-header" }, [
                vue.createElementVNode(
                  "text",
                  { class: "log-operator" },
                  vue.toDisplayString(log.username || "-"),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "log-time" },
                  vue.toDisplayString($setup.formatTime(log.createTime)),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "log-body" }, [
                vue.createElementVNode(
                  "text",
                  { class: "log-action" },
                  vue.toDisplayString(log.operation || "-"),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "log-target" },
                  vue.toDisplayString(log.params || "-"),
                  1
                  /* TEXT */
                )
              ])
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        )),
        $setup.logList.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "empty"
        }, [
          vue.createElementVNode("text", { class: "empty-text" }, "暂无日志数据")
        ])) : vue.createCommentVNode("v-if", true)
      ])
    ]);
  }
  const PagesAdminLogManage = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["render", _sfc_render$3], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/admin/log-manage.vue"]]);
  const _sfc_main$l = {
    setup() {
      const stats = vue.ref({
        totalUsers: 0,
        studentCount: 0,
        teacherCount: 0,
        departmentCount: 0
      });
      const loadData = async () => {
        try {
          uni.showLoading({ title: "加载中..." });
          const res = await statisticsApi.overview();
          if (res.code === 200) {
            stats.value = res.data;
          }
        } catch (e) {
          uni.showToast({ title: "加载失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      vue.onMounted(() => {
        loadData();
      });
      return {
        stats
      };
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "manage-page" }, [
      vue.createElementVNode("view", { class: "page-header" }, [
        vue.createElementVNode("text", { class: "title" }, "数据统计")
      ]),
      vue.createCommentVNode(" 统计卡片 "),
      vue.createElementVNode("view", { class: "stats-grid" }, [
        vue.createElementVNode("view", { class: "stat-card" }, [
          vue.createElementVNode(
            "text",
            { class: "stat-value" },
            vue.toDisplayString($setup.stats.totalUsers),
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "stat-label" }, "总用户数")
        ]),
        vue.createElementVNode("view", { class: "stat-card" }, [
          vue.createElementVNode(
            "text",
            { class: "stat-value" },
            vue.toDisplayString($setup.stats.studentCount),
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "stat-label" }, "学生数")
        ]),
        vue.createElementVNode("view", { class: "stat-card" }, [
          vue.createElementVNode(
            "text",
            { class: "stat-value" },
            vue.toDisplayString($setup.stats.teacherCount),
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "stat-label" }, "教师数")
        ]),
        vue.createElementVNode("view", { class: "stat-card" }, [
          vue.createElementVNode(
            "text",
            { class: "stat-value" },
            vue.toDisplayString($setup.stats.departmentCount),
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "stat-label" }, "院系数")
        ])
      ])
    ]);
  }
  const PagesAdminStatistics = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["render", _sfc_render$2], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/admin/statistics.vue"]]);
  const _sfc_main$k = {
    __name: "my-classes",
    setup(__props) {
      const userStore = useUserStore();
      const className = vue.ref("");
      const classList = vue.ref([]);
      const getRoleText = (role) => {
        return {
          CREATOR: "创建者",
          TEACHER: "教师",
          STUDENT: "学生"
        }[role] || role;
      };
      const handleCreate = async () => {
        var _a;
        if (!className.value.trim()) {
          uni.showToast({
            title: "请输入班级名称",
            icon: "none"
          });
          return;
        }
        try {
          const userId = (_a = userStore.userInfo) == null ? void 0 : _a.userId;
          if (!userId) {
            uni.showToast({
              title: "请先登录",
              icon: "none"
            });
            return;
          }
          const res = await classApi.create({
            className: className.value,
            creatorId: userId
          });
          if (res.code === 200) {
            uni.showToast({
              title: "创建班级成功",
              icon: "success"
            });
            className.value = "";
            loadClasses();
          } else {
            uni.showToast({
              title: res.message || "创建班级失败",
              icon: "none"
            });
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/my-classes.vue:108", e);
          uni.showToast({
            title: "网络错误",
            icon: "none"
          });
        }
      };
      const enterClass = (classId) => {
        uni.navigateTo({
          url: `/pages/teacher/class-chat?id=${classId}`
        });
      };
      const getLastMessage = (cls) => {
        if (!cls.lastMessage)
          return "暂无消息";
        if (cls.lastMessage.startsWith("EXAM_NOTICE|")) {
          return parseExamNotice(cls.lastMessage);
        }
        return cls.lastMessage;
      };
      const parseExamNotice = (content) => {
        if (!(content == null ? void 0 : content.startsWith("EXAM_NOTICE|")))
          return "";
        const parts = content.split("|");
        const noticeType = parts[1] || "";
        const title = parts[2] || "";
        if (noticeType === "START") {
          return "🚀 " + title + " 开始考试";
        } else if (noticeType === "PUBLISH") {
          return "📢 " + title + " 发布通知";
        } else if (noticeType === "END") {
          return "🔚 " + title + " 考试结束";
        }
        return "📝 " + title;
      };
      const formatMessageTime = (time) => {
        if (!time)
          return "";
        const date = new Date(time);
        const now2 = /* @__PURE__ */ new Date();
        const diff = now2 - date;
        if (diff < 6e4)
          return "刚刚";
        if (diff < 36e5)
          return Math.floor(diff / 6e4) + "分钟前";
        if (diff < 864e5)
          return Math.floor(diff / 36e5) + "小时前";
        return date.toLocaleDateString("zh-CN");
      };
      const loadClasses = async () => {
        var _a;
        try {
          const userId = (_a = userStore.userInfo) == null ? void 0 : _a.userId;
          if (!userId)
            return;
          const res = await classApi.getMyClasses(userId);
          if (res.code === 200) {
            classList.value = res.data;
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/my-classes.vue:166", e);
          uni.showToast({
            title: "加载班级列表失败",
            icon: "none"
          });
        }
      };
      vue.onMounted(() => {
        loadClasses();
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "my-classes" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("text", { class: "title" }, "班级消息"),
            vue.createElementVNode("text", { class: "subtitle" }, "查看班级最新动态")
          ]),
          vue.createCommentVNode(" 创建班级 "),
          vue.createElementVNode("view", { class: "create-card" }, [
            vue.createElementVNode("view", { class: "create-form" }, [
              vue.createElementVNode("view", { class: "create-input" }, [
                vue.createElementVNode("text", { class: "create-icon" }, "➕"),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    type: "text",
                    "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => className.value = $event),
                    placeholder: "输入班级名称",
                    onConfirm: handleCreate
                  },
                  null,
                  544
                  /* HYDRATE_EVENTS, NEED_PATCH */
                ), [
                  [vue.vModelText, className.value]
                ])
              ]),
              vue.createElementVNode("button", {
                class: "create-btn",
                onClick: handleCreate
              }, "创建班级")
            ])
          ]),
          vue.createCommentVNode(" 班级消息列表 "),
          classList.value.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "class-message-list"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(classList.value, (item) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "class-message-card",
                  key: item.class.id,
                  onClick: ($event) => enterClass(item.class.id)
                }, [
                  vue.createElementVNode("view", { class: "class-message-icon" }, [
                    vue.createElementVNode("text", { class: "icon-emoji" }, "🏫")
                  ]),
                  vue.createElementVNode("view", { class: "class-message-info" }, [
                    vue.createElementVNode("view", { class: "class-message-header" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "class-message-name" },
                        vue.toDisplayString(item.class.className),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "class-message-time" },
                        vue.toDisplayString(formatMessageTime(item.class.lastMessageTime)),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "class-message-content" },
                      vue.toDisplayString(getLastMessage(item.class)),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("view", { class: "class-message-meta" }, [
                      vue.createElementVNode(
                        "text",
                        null,
                        "群号：" + vue.toDisplayString(item.class.inviteCode),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        null,
                        "角色：" + vue.toDisplayString(getRoleText(item.role)),
                        1
                        /* TEXT */
                      )
                    ])
                  ]),
                  vue.createElementVNode("view", { class: "class-message-arrow" }, [
                    vue.createElementVNode("text", { class: "arrow-icon" }, "›")
                  ])
                ], 8, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])) : vue.createCommentVNode("v-if", true),
          classList.value.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "empty"
          }, [
            vue.createElementVNode("text", { class: "empty-icon" }, "📋"),
            vue.createElementVNode("text", { class: "empty-text" }, "暂无班级，创建您的第一个班级吧")
          ])) : vue.createCommentVNode("v-if", true)
        ]);
      };
    }
  };
  const PagesTeacherMyClasses = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["__scopeId", "data-v-044d2181"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/teacher/my-classes.vue"]]);
  const _sfc_main$j = {
    __name: "class-chat",
    setup(__props) {
      const userStore = useUserStore();
      const classId = vue.ref("");
      const className = vue.ref("");
      const memberCount = vue.ref(0);
      const messages = vue.ref([]);
      const members = vue.ref([]);
      const inputMessage = vue.ref("");
      const showMembers = vue.ref(false);
      const showActions = vue.ref(false);
      const showExamForm = vue.ref(false);
      const scrollTop = vue.ref(0);
      const canManageMember = vue.ref(false);
      const currentRole = vue.ref("");
      const inviteCode = vue.ref("");
      const papers = vue.ref([]);
      const selectedPaperId = vue.ref(null);
      const examForm = vue.reactive({
        title: "",
        duration: "",
        startDate: "",
        startTime: ""
      });
      const iconRocket = "🚀";
      const iconCalendar = "📅";
      const iconTimer = "⏱";
      const selectedPaper = vue.ref(null);
      const getRoleText = (role) => {
        return {
          CREATOR: "创建者",
          TEACHER: "教师",
          STUDENT: "学生"
        }[role] || role;
      };
      const isSelfMessage = (senderId) => {
        var _a;
        const userId = (_a = userStore.userInfo) == null ? void 0 : _a.userId;
        return String(senderId) === String(userId);
      };
      const isExamNotice = (msg) => {
        var _a;
        return (_a = msg.content) == null ? void 0 : _a.startsWith("EXAM_NOTICE|");
      };
      const parseExamNotice = (content) => {
        if (!(content == null ? void 0 : content.startsWith("EXAM_NOTICE|")))
          return null;
        const parts = content.split("|");
        return {
          noticeType: parts[1],
          title: parts[2],
          startTime: parts[3],
          endTime: parts[4],
          duration: parts[5],
          examId: parts[6]
        };
      };
      const getNoticeTitle = (content) => {
        const notice = parseExamNotice(content);
        return notice ? notice.title : "";
      };
      const getNoticeStartTime = (content) => {
        const notice = parseExamNotice(content);
        return notice ? notice.startTime : "";
      };
      const getNoticeDuration = (content) => {
        const notice = parseExamNotice(content);
        return notice ? notice.duration : "";
      };
      const getSenderName = (senderId) => {
        const member = members.value.find((m) => String(m.userId) === String(senderId));
        return (member == null ? void 0 : member.realName) || "未知用户";
      };
      const getSenderAvatar = (senderId) => {
        const member = members.value.find((m) => String(m.userId) === String(senderId));
        return (member == null ? void 0 : member.avatar) || "/static/default-avatar.png";
      };
      const formatTime = (time) => {
        if (!time)
          return "";
        const date = new Date(time);
        const now2 = /* @__PURE__ */ new Date();
        const diff = now2 - date;
        if (diff < 6e4)
          return "刚刚";
        if (diff < 36e5)
          return Math.floor(diff / 6e4) + "分钟前";
        if (diff < 864e5)
          return Math.floor(diff / 36e5) + "小时前";
        return date.toLocaleDateString("zh-CN");
      };
      const goBack = () => {
        uni.navigateBack();
      };
      const sendMessage = async () => {
        var _a;
        if (!inputMessage.value.trim())
          return;
        try {
          const userId = (_a = userStore.userInfo) == null ? void 0 : _a.userId;
          const res = await classApi.sendMessage(classId.value, inputMessage.value, userId);
          if (res.code === 200) {
            inputMessage.value = "";
            loadMessages();
          } else {
            uni.showToast({ title: res.message || "发送失败", icon: "none" });
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/class-chat.vue:293", e);
          uni.showToast({ title: "网络错误", icon: "none" });
        }
      };
      const handleSendExamNotice = () => {
        showActions.value = false;
        loadPapers();
        showExamForm.value = true;
      };
      const loadPapers = async () => {
        try {
          const res = await paperApi.page({ current: 1, size: 50 });
          if (res.code === 200) {
            papers.value = res.data.records || [];
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/class-chat.vue:311", "加载试卷失败:", e);
          uni.showToast({ title: "加载试卷失败", icon: "none" });
        }
      };
      const onPaperChange = (e) => {
        const index = e.detail.value;
        if (papers.value[index]) {
          selectedPaperId.value = papers.value[index].id;
          selectedPaper.value = papers.value[index];
        }
      };
      const onStartDateChange = (e) => {
        examForm.startDate = e.detail.value;
      };
      const onStartTimeChange = (e) => {
        examForm.startTime = e.detail.value;
      };
      const submitExam = async () => {
        var _a;
        if (!examForm.title.trim()) {
          uni.showToast({ title: "请输入考试标题", icon: "none" });
          return;
        }
        if (!selectedPaperId.value) {
          uni.showToast({ title: "请选择试卷", icon: "none" });
          return;
        }
        if (!examForm.duration) {
          uni.showToast({ title: "请输入考试时长", icon: "none" });
          return;
        }
        if (!examForm.startDate || !examForm.startTime) {
          uni.showToast({ title: "请选择开始时间", icon: "none" });
          return;
        }
        try {
          uni.showLoading({ title: "发布中..." });
          const startTime = `${examForm.startDate} ${examForm.startTime}:00`;
          const examData = {
            title: examForm.title,
            paperId: selectedPaperId.value,
            classIds: classId.value,
            duration: parseInt(examForm.duration),
            startTime,
            status: "PENDING"
          };
          const res = await examApi.create(examData);
          if (res.code === 200) {
            uni.showToast({ title: "考试发布成功", icon: "success" });
            showExamForm.value = false;
            const noticeContent = `EXAM_NOTICE|PUBLISH|${examForm.title}|${startTime}||${examForm.duration}|${res.data.id}`;
            await classApi.sendMessage(classId.value, noticeContent, (_a = userStore.userInfo) == null ? void 0 : _a.userId);
            examForm.title = "";
            examForm.duration = "";
            examForm.startDate = "";
            examForm.startTime = "";
            selectedPaperId.value = null;
            selectedPaper.value = null;
            loadMessages();
          } else {
            uni.showToast({ title: res.message || "发布失败", icon: "none" });
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/class-chat.vue:385", "发布考试失败:", e);
          uni.showToast({ title: "发布失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const handleInvite = () => {
        showActions.value = false;
        uni.showModal({
          title: "邀请成员",
          content: `班级群号：${inviteCode}
将此群号分享给需要加入的成员`,
          showCancel: false
        });
      };
      const handleMute = async (member) => {
        uni.showModal({
          title: "禁言成员",
          content: `确定要禁言 ${member.realName} 吗？`,
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await classApi.muteMember(classId.value, member.userId, 3600);
                if (result.code === 200) {
                  uni.showToast({ title: "已禁言", icon: "success" });
                  loadMembers();
                } else {
                  uni.showToast({ title: result.message || "操作失败", icon: "none" });
                }
              } catch (e) {
                uni.showToast({ title: "网络错误", icon: "none" });
              }
            }
          }
        });
      };
      const handleUnmute = async (member) => {
        uni.showModal({
          title: "解禁成员",
          content: `确定要解除 ${member.realName} 的禁言吗？`,
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await classApi.unmuteMember(classId.value, member.userId);
                if (result.code === 200) {
                  uni.showToast({ title: "已解禁", icon: "success" });
                  loadMembers();
                } else {
                  uni.showToast({ title: result.message || "操作失败", icon: "none" });
                }
              } catch (e) {
                uni.showToast({ title: "网络错误", icon: "none" });
              }
            }
          }
        });
      };
      const loadMessages = async () => {
        try {
          const res = await classApi.getMessages(classId.value, 1, 50);
          if (res.code === 200) {
            const records = res.data.records || res.data;
            messages.value = records.reverse();
            vue.nextTick(() => {
              scrollTop.value = 999999;
            });
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/class-chat.vue:456", e);
        }
      };
      const loadMembers = async () => {
        var _a;
        try {
          const res = await classApi.getClassMembers(classId.value);
          if (res.code === 200) {
            members.value = res.data;
            memberCount.value = res.data.length;
            const userId = (_a = userStore.userInfo) == null ? void 0 : _a.userId;
            const currentMember = res.data.find((m) => String(m.userId) === String(userId));
            if (currentMember) {
              currentRole.value = currentMember.role;
              canManageMember.value = currentMember.role === "CREATOR" || currentMember.role === "TEACHER";
            }
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/class-chat.vue:475", e);
        }
      };
      const loadClassInfo = async () => {
        try {
          const res = await classApi.getById(classId.value);
          if (res.code === 200) {
            className.value = res.data.className;
            inviteCode.value = res.data.inviteCode || "";
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/class-chat.vue:487", e);
        }
      };
      onLoad((options) => {
        classId.value = options.id;
        loadClassInfo();
        loadMessages();
        loadMembers();
      });
      return (_ctx, _cache) => {
        var _a;
        return vue.openBlock(), vue.createElementBlock("view", { class: "class-chat" }, [
          vue.createElementVNode("view", { class: "chat-header" }, [
            vue.createElementVNode("view", { class: "header-left" }, [
              vue.createElementVNode("view", {
                class: "back-btn",
                onClick: goBack
              }, [
                vue.createElementVNode("text", { class: "back-icon" }, "‹")
              ]),
              vue.createElementVNode("view", { class: "header-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "class-name" },
                  vue.toDisplayString(className.value),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "member-count" },
                  vue.toDisplayString(memberCount.value) + " 名成员",
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createElementVNode("view", { class: "header-right" }, [
              vue.createElementVNode("view", {
                class: "member-btn",
                onClick: _cache[0] || (_cache[0] = ($event) => showMembers.value = true)
              }, [
                vue.createElementVNode("text", { class: "btn-icon" }, "👥")
              ]),
              vue.createElementVNode("view", {
                class: "more-btn",
                onClick: _cache[1] || (_cache[1] = ($event) => showActions.value = true)
              }, [
                vue.createElementVNode("text", { class: "btn-icon" }, "☰")
              ])
            ])
          ]),
          vue.createElementVNode("scroll-view", {
            class: "chat-body",
            "scroll-y": "",
            "scroll-top": scrollTop.value
          }, [
            vue.createElementVNode("view", { class: "message-list" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(messages.value, (msg) => {
                  return vue.openBlock(), vue.createElementBlock(
                    "view",
                    {
                      key: msg.id,
                      class: vue.normalizeClass(["message-item", { "is-self": isSelfMessage(msg.senderId) }])
                    },
                    [
                      vue.createElementVNode("view", { class: "message-avatar" }, [
                        vue.createElementVNode("image", {
                          src: getSenderAvatar(msg.senderId),
                          mode: "aspectFill"
                        }, null, 8, ["src"])
                      ]),
                      vue.createElementVNode("view", { class: "message-content-wrapper" }, [
                        vue.createElementVNode(
                          "text",
                          { class: "message-sender" },
                          vue.toDisplayString(getSenderName(msg.senderId)),
                          1
                          /* TEXT */
                        ),
                        !isExamNotice(msg) ? (vue.openBlock(), vue.createElementBlock("view", {
                          key: 0,
                          class: "message-bubble"
                        }, [
                          vue.createElementVNode(
                            "text",
                            { class: "message-text" },
                            vue.toDisplayString(msg.content),
                            1
                            /* TEXT */
                          )
                        ])) : (vue.openBlock(), vue.createElementBlock("view", {
                          key: 1,
                          class: "exam-notice"
                        }, [
                          vue.createElementVNode("view", { class: "notice-header" }, [
                            vue.createElementVNode("text", { class: "notice-icon" }, vue.toDisplayString(iconRocket)),
                            vue.createElementVNode(
                              "text",
                              { class: "notice-title" },
                              vue.toDisplayString(getNoticeTitle(msg.content)),
                              1
                              /* TEXT */
                            ),
                            vue.createElementVNode("view", { class: "notice-badge" }, [
                              vue.createElementVNode("text", null, "考试通知")
                            ])
                          ]),
                          vue.createElementVNode("view", { class: "notice-info" }, [
                            vue.createElementVNode("view", { class: "info-item" }, [
                              vue.createElementVNode("text", { class: "info-icon" }, vue.toDisplayString(iconCalendar)),
                              vue.createElementVNode(
                                "text",
                                null,
                                vue.toDisplayString(getNoticeStartTime(msg.content)),
                                1
                                /* TEXT */
                              )
                            ]),
                            vue.createElementVNode("view", { class: "info-item" }, [
                              vue.createElementVNode("text", { class: "info-icon" }, vue.toDisplayString(iconTimer)),
                              vue.createElementVNode(
                                "text",
                                null,
                                vue.toDisplayString(getNoticeDuration(msg.content)) + "分钟",
                                1
                                /* TEXT */
                              )
                            ])
                          ])
                        ])),
                        vue.createElementVNode(
                          "text",
                          { class: "message-time" },
                          vue.toDisplayString(formatTime(msg.createTime)),
                          1
                          /* TEXT */
                        )
                      ])
                    ],
                    2
                    /* CLASS */
                  );
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ], 8, ["scroll-top"]),
          vue.createElementVNode("view", { class: "chat-input-wrapper" }, [
            vue.createElementVNode("view", { class: "chat-input" }, [
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => inputMessage.value = $event),
                  placeholder: "输入消息...",
                  onConfirm: sendMessage
                },
                null,
                544
                /* HYDRATE_EVENTS, NEED_PATCH */
              ), [
                [vue.vModelText, inputMessage.value]
              ]),
              vue.createElementVNode("button", {
                class: "send-btn",
                onClick: sendMessage,
                disabled: !inputMessage.value.trim()
              }, "发送", 8, ["disabled"])
            ])
          ]),
          vue.createCommentVNode(" 成员列表弹窗 "),
          showMembers.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "modal",
            onClick: _cache[5] || (_cache[5] = ($event) => showMembers.value = false)
          }, [
            vue.createElementVNode("view", {
              class: "modal-content",
              onClick: _cache[4] || (_cache[4] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("view", { class: "modal-header" }, [
                vue.createElementVNode("text", { class: "modal-title" }, "班级成员"),
                vue.createElementVNode("view", {
                  class: "modal-close",
                  onClick: _cache[3] || (_cache[3] = ($event) => showMembers.value = false)
                }, [
                  vue.createElementVNode("text", { class: "close-icon" }, "✕")
                ])
              ]),
              vue.createElementVNode("scroll-view", {
                class: "members-list",
                "scroll-y": ""
              }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(members.value, (member) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      class: "member-item",
                      key: member.userId
                    }, [
                      vue.createElementVNode("view", { class: "member-info" }, [
                        vue.createElementVNode(
                          "text",
                          { class: "member-name" },
                          vue.toDisplayString(member.realName),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode(
                          "view",
                          {
                            class: vue.normalizeClass(["member-role", "role-" + member.role.toLowerCase()])
                          },
                          [
                            vue.createElementVNode(
                              "text",
                              null,
                              vue.toDisplayString(getRoleText(member.role)),
                              1
                              /* TEXT */
                            )
                          ],
                          2
                          /* CLASS */
                        )
                      ]),
                      member.muteUntil ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 0,
                        class: "mute-status"
                      }, [
                        vue.createElementVNode("text", null, "已禁言")
                      ])) : vue.createCommentVNode("v-if", true),
                      canManageMember.value ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 1,
                        class: "member-actions"
                      }, [
                        !member.muteUntil ? (vue.openBlock(), vue.createElementBlock("button", {
                          key: 0,
                          class: "mute-btn",
                          onClick: ($event) => handleMute(member)
                        }, "禁言", 8, ["onClick"])) : (vue.openBlock(), vue.createElementBlock("button", {
                          key: 1,
                          class: "unmute-btn",
                          onClick: ($event) => handleUnmute(member)
                        }, "解禁", 8, ["onClick"]))
                      ])) : vue.createCommentVNode("v-if", true)
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createCommentVNode(" 操作面板 "),
          showActions.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "modal",
            onClick: _cache[8] || (_cache[8] = ($event) => showActions.value = false)
          }, [
            vue.createElementVNode("view", {
              class: "action-panel",
              onClick: _cache[7] || (_cache[7] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("view", {
                class: "action-item",
                onClick: handleSendExamNotice
              }, [
                vue.createElementVNode("text", { class: "action-icon" }, "📢"),
                vue.createElementVNode("text", null, "发布考试")
              ]),
              vue.createElementVNode("view", {
                class: "action-item",
                onClick: handleInvite
              }, [
                vue.createElementVNode("text", { class: "action-icon" }, "👥"),
                vue.createElementVNode("text", null, "邀请成员")
              ]),
              vue.createElementVNode("view", {
                class: "action-item danger",
                onClick: _cache[6] || (_cache[6] = ($event) => showActions.value = false)
              }, [
                vue.createElementVNode("text", null, "取消")
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createCommentVNode(" 发布考试弹窗 "),
          showExamForm.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 2,
            class: "modal",
            onClick: _cache[14] || (_cache[14] = ($event) => showExamForm.value = false)
          }, [
            vue.createElementVNode("view", {
              class: "exam-form-modal",
              onClick: _cache[13] || (_cache[13] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("view", { class: "modal-header" }, [
                vue.createElementVNode("text", { class: "modal-title" }, "发布考试"),
                vue.createElementVNode("view", {
                  class: "modal-close",
                  onClick: _cache[9] || (_cache[9] = ($event) => showExamForm.value = false)
                }, [
                  vue.createElementVNode("text", { class: "close-icon" }, "✕")
                ])
              ]),
              vue.createElementVNode("scroll-view", {
                class: "form-body",
                "scroll-y": ""
              }, [
                vue.createElementVNode("view", { class: "form-item" }, [
                  vue.createElementVNode("text", { class: "form-label" }, "考试标题"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      class: "form-input",
                      "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => examForm.title = $event),
                      placeholder: "请输入考试标题"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, examForm.title]
                  ])
                ]),
                vue.createElementVNode("view", { class: "form-item" }, [
                  vue.createElementVNode("text", { class: "form-label" }, "选择试卷"),
                  vue.createElementVNode("picker", {
                    mode: "selector",
                    range: papers.value,
                    "range-key": "title",
                    onChange: onPaperChange
                  }, [
                    vue.createElementVNode("view", { class: "form-picker" }, [
                      vue.createElementVNode(
                        "text",
                        null,
                        vue.toDisplayString(((_a = selectedPaper.value) == null ? void 0 : _a.title) || "请选择试卷"),
                        1
                        /* TEXT */
                      )
                    ])
                  ], 40, ["range"])
                ]),
                vue.createElementVNode("view", { class: "form-item" }, [
                  vue.createElementVNode("text", { class: "form-label" }, "考试时长（分钟）"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      class: "form-input",
                      type: "number",
                      "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => examForm.duration = $event),
                      placeholder: "请输入考试时长"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, examForm.duration]
                  ])
                ]),
                vue.createElementVNode("view", { class: "form-item" }, [
                  vue.createElementVNode("text", { class: "form-label" }, "开始时间"),
                  vue.createElementVNode("picker", {
                    mode: "date",
                    value: examForm.startDate,
                    onChange: onStartDateChange
                  }, [
                    vue.createElementVNode("view", { class: "form-picker" }, [
                      vue.createElementVNode(
                        "text",
                        null,
                        vue.toDisplayString(examForm.startDate || "请选择日期"),
                        1
                        /* TEXT */
                      )
                    ])
                  ], 40, ["value"])
                ]),
                vue.createElementVNode("view", { class: "form-item" }, [
                  vue.createElementVNode("text", { class: "form-label" }, "开始时间"),
                  vue.createElementVNode("picker", {
                    mode: "time",
                    value: examForm.startTime,
                    onChange: onStartTimeChange
                  }, [
                    vue.createElementVNode("view", { class: "form-picker" }, [
                      vue.createElementVNode(
                        "text",
                        null,
                        vue.toDisplayString(examForm.startTime || "请选择时间"),
                        1
                        /* TEXT */
                      )
                    ])
                  ], 40, ["value"])
                ])
              ]),
              vue.createElementVNode("view", { class: "modal-footer" }, [
                vue.createElementVNode("button", {
                  class: "modal-btn cancel",
                  onClick: _cache[12] || (_cache[12] = ($event) => showExamForm.value = false)
                }, "取消"),
                vue.createElementVNode("button", {
                  class: "modal-btn confirm",
                  onClick: submitExam
                }, "发布考试")
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true)
        ]);
      };
    }
  };
  const PagesTeacherClassChat = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["__scopeId", "data-v-a4d58c53"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/teacher/class-chat.vue"]]);
  const _sfc_main$i = {
    setup() {
      const keyword = vue.ref("");
      const subjectList = vue.ref([]);
      const showSubjectForm = vue.ref(false);
      const editingSubject = vue.ref(null);
      const form = vue.reactive({
        name: "",
        code: ""
      });
      const loadData = async () => {
        try {
          uni.showLoading({ title: "加载中..." });
          const res = await subjectApi.page({ current: 1, size: 20, keyword: keyword.value });
          if (res.code === 200) {
            subjectList.value = res.data.records;
          }
        } catch (e) {
          uni.showToast({ title: "加载失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const addSubject = () => {
        editingSubject.value = null;
        form.name = "";
        form.code = "";
        showSubjectForm.value = true;
      };
      const editSubject = (item) => {
        editingSubject.value = item;
        form.name = item.name;
        form.code = item.code || "";
        showSubjectForm.value = true;
      };
      const submitSubject = async () => {
        var _a;
        if (!form.name.trim()) {
          uni.showToast({ title: "请输入科目名称", icon: "none" });
          return;
        }
        try {
          uni.showLoading({ title: "保存中..." });
          const subjectData = {
            id: ((_a = editingSubject.value) == null ? void 0 : _a.id) || null,
            name: form.name,
            code: form.code
          };
          let res;
          if (editingSubject.value) {
            res = await subjectApi.update(subjectData);
          } else {
            res = await subjectApi.create(subjectData);
          }
          if (res.code === 200) {
            uni.showToast({ title: editingSubject.value ? "修改成功" : "创建成功", icon: "success" });
            showSubjectForm.value = false;
            loadData();
            resetForm();
          } else {
            uni.showToast({ title: res.message || "保存失败", icon: "none" });
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/subject-manage.vue:141", e);
          uni.showToast({ title: "保存失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const resetForm = () => {
        editingSubject.value = null;
        form.name = "";
        form.code = "";
      };
      const deleteSubject = async (item) => {
        uni.showModal({
          title: "提示",
          content: `确定要删除科目 ${item.name} 吗？`,
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await subjectApi.delete(item.id);
                if (result.code === 200) {
                  uni.showToast({ title: "删除成功", icon: "success" });
                  loadData();
                } else {
                  uni.showToast({ title: result.message || "删除失败", icon: "none" });
                }
              } catch (e) {
                uni.showToast({ title: "删除失败", icon: "none" });
              }
            }
          }
        });
      };
      vue.onMounted(() => {
        loadData();
      });
      return {
        keyword,
        subjectList,
        showSubjectForm,
        form,
        loadData,
        addSubject,
        editSubject,
        submitSubject,
        deleteSubject
      };
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "manage-page" }, [
      vue.createElementVNode("view", { class: "page-header" }, [
        vue.createElementVNode("text", { class: "title" }, "科目管理")
      ]),
      vue.createCommentVNode(" 搜索栏 "),
      vue.createElementVNode("view", { class: "search-bar" }, [
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "search-input",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.keyword = $event),
            placeholder: "搜索科目名称"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.keyword]
        ]),
        vue.createElementVNode("button", {
          class: "search-btn",
          onClick: _cache[1] || (_cache[1] = (...args) => $setup.loadData && $setup.loadData(...args))
        }, "搜索")
      ]),
      vue.createCommentVNode(" 科目列表 "),
      vue.createElementVNode("view", { class: "list" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.subjectList, (item) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "list-item",
              key: item.id
            }, [
              vue.createElementVNode("view", { class: "item-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "item-title" },
                  vue.toDisplayString(item.name),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "item-meta" },
                  vue.toDisplayString(item.code || "-"),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "item-actions" }, [
                vue.createElementVNode("text", {
                  class: "action-btn",
                  onClick: ($event) => $setup.editSubject(item)
                }, "编辑", 8, ["onClick"]),
                vue.createElementVNode("text", {
                  class: "action-btn danger",
                  onClick: ($event) => $setup.deleteSubject(item)
                }, "删除", 8, ["onClick"])
              ])
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        )),
        $setup.subjectList.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "empty"
        }, [
          vue.createElementVNode("text", { class: "empty-text" }, "暂无科目数据")
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 新增按钮 "),
      vue.createElementVNode("view", {
        class: "add-btn",
        onClick: _cache[2] || (_cache[2] = ($event) => $setup.showSubjectForm = true)
      }, [
        vue.createElementVNode("text", { class: "add-icon" }, "➕"),
        vue.createElementVNode("text", { class: "add-text" }, "新增科目")
      ]),
      vue.createCommentVNode(" 科目编辑弹窗 "),
      $setup.showSubjectForm ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "modal",
        onClick: _cache[9] || (_cache[9] = ($event) => $setup.showSubjectForm = false)
      }, [
        vue.createElementVNode("view", {
          class: "subject-modal",
          onClick: _cache[8] || (_cache[8] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "modal-header" }, [
            vue.createElementVNode(
              "text",
              { class: "modal-title" },
              vue.toDisplayString(_ctx.editingSubject ? "编辑科目" : "新增科目"),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", {
              class: "modal-close",
              onClick: _cache[3] || (_cache[3] = ($event) => $setup.showSubjectForm = false)
            }, [
              vue.createElementVNode("text", { class: "close-icon" }, "✕")
            ])
          ]),
          vue.createElementVNode("view", { class: "modal-body" }, [
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "form-label" }, "科目名称 *"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "form-input",
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $setup.form.name = $event),
                  placeholder: "请输入科目名称"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.form.name]
              ])
            ]),
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "form-label" }, "科目代码"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "form-input",
                  "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $setup.form.code = $event),
                  placeholder: "请输入科目代码"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.form.code]
              ])
            ])
          ]),
          vue.createElementVNode("view", { class: "modal-footer" }, [
            vue.createElementVNode("button", {
              class: "modal-btn cancel",
              onClick: _cache[6] || (_cache[6] = ($event) => $setup.showSubjectForm = false)
            }, "取消"),
            vue.createElementVNode(
              "button",
              {
                class: "modal-btn confirm",
                onClick: _cache[7] || (_cache[7] = (...args) => $setup.submitSubject && $setup.submitSubject(...args))
              },
              vue.toDisplayString(_ctx.editingSubject ? "保存" : "创建"),
              1
              /* TEXT */
            )
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesTeacherSubjectManage = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["render", _sfc_render$1], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/teacher/subject-manage.vue"]]);
  const _sfc_main$h = {
    setup() {
      const keyword = vue.ref("");
      const questionList = vue.ref([]);
      const subjects = vue.ref([]);
      const selectedSubjectId = vue.ref(null);
      const selectedTypeId = vue.ref("");
      const showQuestionForm = vue.ref(false);
      const editingQuestion = vue.ref(null);
      const showImportModal = vue.ref(false);
      const importText = vue.ref("");
      const importSubject = vue.ref(null);
      const questionTypes = [
        { value: "SINGLE_CHOICE", label: "单选题" },
        { value: "MULTIPLE_CHOICE", label: "多选题" },
        { value: "JUDGMENT", label: "判断题" },
        { value: "FILL_BLANK", label: "填空题" },
        { value: "ESSAY", label: "简答题" }
      ];
      const form = vue.reactive({
        type: "SINGLE_CHOICE",
        subjectId: null,
        content: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        score: ""
      });
      const selectedFormType = vue.computed(() => {
        return questionTypes.find((t) => t.value === form.type) || {};
      });
      const selectedFormSubject = vue.computed(() => {
        return subjects.value.find((s) => String(s.id) === String(form.subjectId));
      });
      const subjectOptions = vue.computed(() => {
        return [{ id: null, name: "全部" }, ...subjects.value];
      });
      const selectedSubjectName = vue.computed(() => {
        const s = subjects.value.find((s2) => s2.id === selectedSubjectId.value);
        return (s == null ? void 0 : s.name) || "";
      });
      const selectedTypeName = vue.computed(() => {
        const t = questionTypes.find((t2) => t2.value === selectedTypeId.value);
        return (t == null ? void 0 : t.label) || "";
      });
      const typeText = (type) => {
        const map = {
          SINGLE_CHOICE: "单选",
          MULTIPLE_CHOICE: "多选",
          JUDGMENT: "判断",
          FILL_BLANK: "填空",
          ESSAY: "简答",
          PROGRAMMING: "编程"
        };
        return map[type] || type;
      };
      const getTypeClass = (type) => {
        const map = {
          SINGLE_CHOICE: "type-single",
          MULTIPLE_CHOICE: "type-multi",
          JUDGMENT: "type-judge",
          FILL_BLANK: "type-fill",
          ESSAY: "type-essay"
        };
        return map[type] || "";
      };
      const getSubjectName = (subjectId) => {
        const s = subjects.value.find((s2) => String(s2.id) === String(subjectId));
        return (s == null ? void 0 : s.name) || "未知科目";
      };
      const truncate = (text, len) => {
        if (!text)
          return "-";
        return text.length > len ? text.substring(0, len) + "..." : text;
      };
      const onSubjectChange = (e) => {
        const index = e.detail.value;
        if (subjects.value[index]) {
          selectedSubjectId.value = subjects.value[index].id;
        }
      };
      const onTypeChange = (e) => {
        const index = e.detail.value;
        if (questionTypes[index]) {
          selectedTypeId.value = questionTypes[index].value;
        }
      };
      const onFormTypeChange = (e) => {
        const index = e.detail.value;
        form.type = questionTypes[index].value;
        if (form.type === "JUDGMENT") {
          form.options = ["正确", "错误"];
        } else if (form.type === "ESSAY" || form.type === "FILL_BLANK") {
          form.options = [];
        } else {
          form.options = ["", "", "", ""];
        }
      };
      const onFormSubjectChange = (e) => {
        const index = e.detail.value;
        if (subjects.value[index]) {
          form.subjectId = subjects.value[index].id;
        }
      };
      const addOption = () => {
        if (form.options.length < 6) {
          form.options.push("");
        }
      };
      const removeOption = (idx) => {
        if (form.options.length > 2) {
          form.options.splice(idx, 1);
        }
      };
      const loadData = async () => {
        try {
          uni.showLoading({ title: "加载中..." });
          const res = await questionApi.page({
            current: 1,
            size: 20,
            keyword: keyword.value,
            subjectId: selectedSubjectId.value,
            type: selectedTypeId.value
          });
          if (res.code === 200) {
            questionList.value = res.data.records;
          }
        } catch (e) {
          uni.showToast({ title: "加载失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const loadSubjects = async () => {
        try {
          const res = await subjectApi.list();
          if (res.code === 200) {
            subjects.value = res.data;
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/question-manage.vue:333", e);
        }
      };
      const editQuestion = async (item) => {
        editingQuestion.value = item;
        form.type = item.type;
        form.subjectId = item.subjectId;
        form.content = item.content;
        form.correctAnswer = item.answer || item.correctAnswer || "";
        form.score = item.score ? item.score.toString() : "";
        if (item.type === "JUDGMENT") {
          form.options = ["正确", "错误"];
        } else if (item.type === "ESSAY" || item.type === "FILL_BLANK") {
          form.options = [];
        } else {
          let opts = [];
          if (Array.isArray(item.options)) {
            if (item.options.length > 0 && typeof item.options[0] === "object") {
              opts = item.options.map((opt) => opt.content || opt.text || "");
            } else {
              opts = [...item.options];
            }
          } else if (typeof item.options === "string") {
            try {
              const parsed = JSON.parse(item.options);
              if (Array.isArray(parsed)) {
                if (parsed.length > 0 && typeof parsed[0] === "object") {
                  opts = parsed.map((opt) => opt.content || opt.text || "");
                } else {
                  opts = parsed;
                }
              }
            } catch (e) {
              opts = item.options.split("|").filter((o) => o.trim());
            }
          }
          while (opts.length < 4) {
            opts.push("");
          }
          form.options = opts;
        }
        showQuestionForm.value = true;
      };
      const submitQuestion = async () => {
        var _a;
        if (!form.content.trim()) {
          uni.showToast({ title: "请输入题目内容", icon: "none" });
          return;
        }
        if (!form.subjectId) {
          uni.showToast({ title: "请选择科目", icon: "none" });
          return;
        }
        if (!form.correctAnswer.trim()) {
          uni.showToast({ title: "请输入正确答案", icon: "none" });
          return;
        }
        try {
          uni.showLoading({ title: "保存中..." });
          const questionData = {
            id: ((_a = editingQuestion.value) == null ? void 0 : _a.id) || null,
            type: form.type,
            subjectId: form.subjectId,
            content: form.content,
            options: form.options.filter((o) => o.trim()).join("|"),
            answer: form.correctAnswer,
            score: form.score ? parseInt(form.score) : 10
          };
          let res;
          if (editingQuestion.value) {
            res = await questionApi.update(questionData);
          } else {
            res = await questionApi.create(questionData);
          }
          if (res.code === 200) {
            uni.showToast({ title: editingQuestion.value ? "修改成功" : "创建成功", icon: "success" });
            showQuestionForm.value = false;
            loadData();
            resetForm();
          } else {
            uni.showToast({ title: res.message || "保存失败", icon: "none" });
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/question-manage.vue:423", e);
          uni.showToast({ title: "保存失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const resetForm = () => {
        editingQuestion.value = null;
        form.type = "SINGLE_CHOICE";
        form.subjectId = null;
        form.content = "";
        form.options = ["", "", "", ""];
        form.correctAnswer = "";
        form.score = "";
      };
      const onImportSubjectChange = (e) => {
        importSubject.value = subjects.value[e.detail.value];
      };
      const submitImport = async () => {
        var _a, _b, _c, _d, _e, _f;
        if (!importSubject.value) {
          uni.showToast({ title: "请选择科目", icon: "none" });
          return;
        }
        if (!importText.value.trim()) {
          uni.showToast({ title: "请输入导入文本", icon: "none" });
          return;
        }
        try {
          uni.showLoading({ title: "导入中..." });
          const lines = importText.value.trim().split("\n");
          const questions = [];
          for (const line of lines) {
            const parts = line.split("|");
            if (parts.length < 3)
              continue;
            const typeMap = {
              "单选": "SINGLE_CHOICE",
              "多选": "MULTIPLE_CHOICE",
              "判断": "JUDGMENT",
              "填空": "FILL_BLANK",
              "简答": "ESSAY"
            };
            const typeKey = parts[0].trim();
            const type = typeMap[typeKey];
            if (!type)
              continue;
            const question = {
              type,
              subjectId: importSubject.value.id,
              content: ((_a = parts[1]) == null ? void 0 : _a.trim()) || "",
              correctAnswer: "",
              score: 10
            };
            if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") {
              if (parts.length >= 8) {
                question.options = [parts[2], parts[3], parts[4], parts[5]].filter((p) => p == null ? void 0 : p.trim()).join("|");
                question.correctAnswer = ((_b = parts[6]) == null ? void 0 : _b.trim()) || "";
                question.score = parseInt(parts[7]) || 10;
              }
            } else if (type === "JUDGMENT") {
              if (parts.length >= 4) {
                question.options = "正确|错误";
                question.correctAnswer = ((_c = parts[2]) == null ? void 0 : _c.trim()) === "正确" || ((_d = parts[2]) == null ? void 0 : _d.trim()) === "A" ? "A" : "B";
                question.score = parseInt(parts[3]) || 10;
              }
            } else if (type === "FILL_BLANK") {
              if (parts.length >= 4) {
                question.correctAnswer = ((_e = parts[2]) == null ? void 0 : _e.trim()) || "";
                question.score = parseInt(parts[3]) || 10;
              }
            } else if (type === "ESSAY") {
              if (parts.length >= 4) {
                question.correctAnswer = ((_f = parts[2]) == null ? void 0 : _f.trim()) || "";
                question.score = parseInt(parts[3]) || 10;
              }
            }
            if (question.content && question.correctAnswer) {
              questions.push(question);
            }
          }
          if (questions.length === 0) {
            uni.showToast({ title: "未解析到有效题目", icon: "none" });
            return;
          }
          let successCount = 0;
          for (const q of questions) {
            try {
              const res = await questionApi.create(q);
              if (res.code === 200)
                successCount++;
            } catch (e) {
              formatAppLog("error", "at pages/teacher/question-manage.vue:525", "导入单题失败:", e);
            }
          }
          uni.showToast({ title: `导入完成，成功${successCount}/${questions.length}题`, icon: "success" });
          showImportModal.value = false;
          importText.value = "";
          importSubject.value = null;
          loadData();
        } catch (e) {
          formatAppLog("error", "at pages/teacher/question-manage.vue:536", e);
          uni.showToast({ title: "导入失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const copyExample = (text) => {
        uni.setClipboardData({
          data: text,
          success: () => {
            uni.showToast({ title: "复制成功", icon: "success", duration: 1500 });
          },
          fail: () => {
            uni.showToast({ title: "复制失败", icon: "none" });
          }
        });
      };
      const deleteQuestion = async (item) => {
        uni.showModal({
          title: "提示",
          content: `确定要删除此题目吗？`,
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await questionApi.delete(item.id);
                if (result.code === 200) {
                  uni.showToast({ title: "删除成功", icon: "success" });
                  loadData();
                } else {
                  uni.showToast({ title: result.message || "删除失败", icon: "none" });
                }
              } catch (e) {
                uni.showToast({ title: "删除失败", icon: "none" });
              }
            }
          }
        });
      };
      vue.onMounted(() => {
        loadSubjects();
        loadData();
      });
      return {
        keyword,
        questionList,
        subjects,
        questionTypes,
        subjectOptions,
        selectedSubjectName,
        selectedTypeName,
        showQuestionForm,
        editingQuestion,
        selectedFormType,
        selectedFormSubject,
        form,
        showImportModal,
        importText,
        importSubject,
        typeText,
        getTypeClass,
        getSubjectName,
        truncate,
        onSubjectChange,
        onTypeChange,
        onFormTypeChange,
        onFormSubjectChange,
        onImportSubjectChange,
        addOption,
        removeOption,
        loadData,
        editQuestion,
        submitQuestion,
        submitImport,
        copyExample,
        deleteQuestion
      };
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    var _a, _b;
    return vue.openBlock(), vue.createElementBlock("view", { class: "manage-page" }, [
      vue.createElementVNode("view", { class: "page-header" }, [
        vue.createElementVNode("text", { class: "title" }, "题库管理")
      ]),
      vue.createCommentVNode(" 搜索栏 "),
      vue.createElementVNode("view", { class: "search-bar" }, [
        vue.createElementVNode("picker", {
          mode: "selector",
          range: $setup.subjectOptions,
          "range-key": "name",
          onChange: _cache[0] || (_cache[0] = (...args) => $setup.onSubjectChange && $setup.onSubjectChange(...args))
        }, [
          vue.createElementVNode("view", { class: "picker" }, [
            vue.createElementVNode(
              "text",
              { class: "picker-text" },
              vue.toDisplayString($setup.selectedSubjectName || "选择科目"),
              1
              /* TEXT */
            )
          ])
        ], 40, ["range"]),
        vue.createElementVNode("picker", {
          mode: "selector",
          range: $setup.questionTypes,
          "range-key": "label",
          onChange: _cache[1] || (_cache[1] = (...args) => $setup.onTypeChange && $setup.onTypeChange(...args))
        }, [
          vue.createElementVNode("view", { class: "picker" }, [
            vue.createElementVNode(
              "text",
              { class: "picker-text" },
              vue.toDisplayString($setup.selectedTypeName || "题目类型"),
              1
              /* TEXT */
            )
          ])
        ], 40, ["range"]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "search-input",
            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.keyword = $event),
            placeholder: "搜索题目内容"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $setup.keyword]
        ]),
        vue.createElementVNode("button", {
          class: "search-btn",
          onClick: _cache[3] || (_cache[3] = (...args) => $setup.loadData && $setup.loadData(...args))
        }, "搜索")
      ]),
      vue.createCommentVNode(" 题目列表 "),
      vue.createElementVNode("view", { class: "list" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.questionList, (item) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "list-item",
              key: item.id
            }, [
              vue.createElementVNode("view", { class: "item-info" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["type-tag", $setup.getTypeClass(item.type)])
                  },
                  vue.toDisplayString($setup.typeText(item.type)),
                  3
                  /* TEXT, CLASS */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "item-title" },
                  vue.toDisplayString($setup.truncate(item.content, 50)),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "item-meta" },
                  "分值：" + vue.toDisplayString(item.score) + "分 | " + vue.toDisplayString($setup.getSubjectName(item.subjectId)),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "item-actions" }, [
                vue.createElementVNode("text", {
                  class: "action-btn",
                  onClick: ($event) => $setup.editQuestion(item)
                }, "编辑", 8, ["onClick"]),
                vue.createElementVNode("text", {
                  class: "action-btn danger",
                  onClick: ($event) => $setup.deleteQuestion(item)
                }, "删除", 8, ["onClick"])
              ])
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        )),
        $setup.questionList.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "empty"
        }, [
          vue.createElementVNode("text", { class: "empty-text" }, "暂无题目数据")
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 新增按钮 "),
      vue.createElementVNode("view", {
        class: "add-btn",
        onClick: _cache[4] || (_cache[4] = ($event) => $setup.showQuestionForm = true)
      }, [
        vue.createElementVNode("text", { class: "add-icon" }, "➕"),
        vue.createElementVNode("text", { class: "add-text" }, "新增题目")
      ]),
      vue.createCommentVNode(" 批量导入按钮 "),
      vue.createElementVNode("view", {
        class: "import-btn",
        onClick: _cache[5] || (_cache[5] = ($event) => $setup.showImportModal = true)
      }, [
        vue.createElementVNode("text", { class: "import-icon" }, "📤"),
        vue.createElementVNode("text", { class: "import-text" }, "批量导入")
      ]),
      vue.createCommentVNode(" 题目编辑弹窗 "),
      $setup.showQuestionForm ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "modal",
        onClick: _cache[16] || (_cache[16] = ($event) => $setup.showQuestionForm = false)
      }, [
        vue.createElementVNode("view", {
          class: "question-modal",
          onClick: _cache[15] || (_cache[15] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "modal-header" }, [
            vue.createElementVNode(
              "text",
              { class: "modal-title" },
              vue.toDisplayString($setup.editingQuestion ? "编辑题目" : "新增题目"),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", {
              class: "modal-close",
              onClick: _cache[6] || (_cache[6] = ($event) => $setup.showQuestionForm = false)
            }, [
              vue.createElementVNode("text", { class: "close-icon" }, "✕")
            ])
          ]),
          vue.createElementVNode("scroll-view", {
            class: "modal-body",
            "scroll-y": ""
          }, [
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "form-label" }, "题目类型 *"),
              vue.createElementVNode("picker", {
                mode: "selector",
                range: $setup.questionTypes,
                "range-key": "label",
                onChange: _cache[7] || (_cache[7] = (...args) => $setup.onFormTypeChange && $setup.onFormTypeChange(...args))
              }, [
                vue.createElementVNode("view", { class: "form-picker" }, [
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString($setup.selectedFormType.label || "请选择题目类型"),
                    1
                    /* TEXT */
                  )
                ])
              ], 40, ["range"])
            ]),
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "form-label" }, "所属科目 *"),
              vue.createElementVNode("picker", {
                mode: "selector",
                range: $setup.subjects,
                "range-key": "name",
                onChange: _cache[8] || (_cache[8] = (...args) => $setup.onFormSubjectChange && $setup.onFormSubjectChange(...args))
              }, [
                vue.createElementVNode("view", { class: "form-picker" }, [
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString(((_a = $setup.selectedFormSubject) == null ? void 0 : _a.name) || "请选择科目"),
                    1
                    /* TEXT */
                  )
                ])
              ], 40, ["range"])
            ]),
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "form-label" }, "题目内容 *"),
              vue.withDirectives(vue.createElementVNode(
                "textarea",
                {
                  class: "form-textarea",
                  "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => $setup.form.content = $event),
                  placeholder: "请输入题目内容"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.form.content]
              ])
            ]),
            $setup.form.type !== "ESSAY" && $setup.form.type !== "FILL_BLANK" ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "form-item"
            }, [
              vue.createElementVNode("text", { class: "form-label" }, "选项"),
              vue.createElementVNode("view", { class: "options-list" }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.form.options, (opt, idx) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      class: "option-item",
                      key: idx
                    }, [
                      vue.createElementVNode(
                        "text",
                        { class: "option-label" },
                        vue.toDisplayString(String.fromCharCode(65 + idx)) + ".",
                        1
                        /* TEXT */
                      ),
                      vue.withDirectives(vue.createElementVNode("input", {
                        class: "option-input",
                        "onUpdate:modelValue": ($event) => $setup.form.options[idx] = $event,
                        placeholder: "选项" + String.fromCharCode(65 + idx)
                      }, null, 8, ["onUpdate:modelValue", "placeholder"]), [
                        [vue.vModelText, $setup.form.options[idx]]
                      ]),
                      $setup.form.options.length > 2 ? (vue.openBlock(), vue.createElementBlock("text", {
                        key: 0,
                        class: "option-delete",
                        onClick: ($event) => $setup.removeOption(idx)
                      }, "✕", 8, ["onClick"])) : vue.createCommentVNode("v-if", true)
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ]),
              $setup.form.options.length < 6 ? (vue.openBlock(), vue.createElementBlock("button", {
                key: 0,
                class: "add-option-btn",
                onClick: _cache[10] || (_cache[10] = (...args) => $setup.addOption && $setup.addOption(...args))
              }, "添加选项")) : vue.createCommentVNode("v-if", true)
            ])) : vue.createCommentVNode("v-if", true),
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "form-label" }, "正确答案 *"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "form-input",
                  "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => $setup.form.correctAnswer = $event),
                  placeholder: "请输入正确答案"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.form.correctAnswer]
              ])
            ]),
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "form-label" }, "分值"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  class: "form-input",
                  type: "number",
                  "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => $setup.form.score = $event),
                  placeholder: "请输入分值"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.form.score]
              ])
            ])
          ]),
          vue.createElementVNode("view", { class: "modal-footer" }, [
            vue.createElementVNode("button", {
              class: "modal-btn cancel",
              onClick: _cache[13] || (_cache[13] = ($event) => $setup.showQuestionForm = false)
            }, "取消"),
            vue.createElementVNode(
              "button",
              {
                class: "modal-btn confirm",
                onClick: _cache[14] || (_cache[14] = (...args) => $setup.submitQuestion && $setup.submitQuestion(...args))
              },
              vue.toDisplayString($setup.editingQuestion ? "保存" : "创建"),
              1
              /* TEXT */
            )
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 批量导入弹窗 "),
      $setup.showImportModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "modal",
        onClick: _cache[28] || (_cache[28] = ($event) => $setup.showImportModal = false)
      }, [
        vue.createElementVNode("view", {
          class: "import-modal",
          onClick: _cache[27] || (_cache[27] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "modal-header" }, [
            vue.createElementVNode("text", { class: "modal-title" }, "批量导入题目"),
            vue.createElementVNode("view", {
              class: "modal-close",
              onClick: _cache[17] || (_cache[17] = ($event) => $setup.showImportModal = false)
            }, [
              vue.createElementVNode("text", { class: "close-icon" }, "✕")
            ])
          ]),
          vue.createElementVNode("scroll-view", {
            class: "modal-body",
            "scroll-y": ""
          }, [
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "form-label" }, "选择科目 *"),
              vue.createElementVNode("picker", {
                mode: "selector",
                range: $setup.subjects,
                "range-key": "name",
                onChange: _cache[18] || (_cache[18] = (...args) => $setup.onImportSubjectChange && $setup.onImportSubjectChange(...args))
              }, [
                vue.createElementVNode("view", { class: "form-picker" }, [
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString(((_b = $setup.importSubject) == null ? void 0 : _b.name) || "请选择科目"),
                    1
                    /* TEXT */
                  )
                ])
              ], 40, ["range"])
            ]),
            vue.createElementVNode("view", { class: "form-item" }, [
              vue.createElementVNode("text", { class: "form-label" }, "导入文本 *"),
              vue.createElementVNode("view", { class: "form-hint" }, [
                vue.createElementVNode("text", { class: "hint-title" }, "格式说明（每行一题，使用|分隔）："),
                vue.createElementVNode("view", { class: "hint-example" }, [
                  vue.createElementVNode("view", {
                    class: "hint-line",
                    onClick: _cache[19] || (_cache[19] = ($event) => $setup.copyExample("单选|题目内容是什么？|选项A内容|选项B内容|选项C内容|选项D内容|A|5"))
                  }, [
                    vue.createElementVNode("text", null, "单选|题目内容是什么？|选项A内容|选项B内容|选项C内容|选项D内容|A|5"),
                    vue.createElementVNode("text", { class: "copy-icon" }, "📋")
                  ]),
                  vue.createElementVNode("view", {
                    class: "hint-line",
                    onClick: _cache[20] || (_cache[20] = ($event) => $setup.copyExample("多选|哪些是正确的？|选项A|选项B|选项C|选项D|A,C|10"))
                  }, [
                    vue.createElementVNode("text", null, "多选|哪些是正确的？|选项A|选项B|选项C|选项D|A,C|10"),
                    vue.createElementVNode("text", { class: "copy-icon" }, "📋")
                  ]),
                  vue.createElementVNode("view", {
                    class: "hint-line",
                    onClick: _cache[21] || (_cache[21] = ($event) => $setup.copyExample("判断|这句话是正确的|A|2"))
                  }, [
                    vue.createElementVNode("text", null, "判断|这句话是正确的|A|2"),
                    vue.createElementVNode("text", { class: "copy-icon" }, "📋")
                  ]),
                  vue.createElementVNode("view", {
                    class: "hint-line",
                    onClick: _cache[22] || (_cache[22] = ($event) => $setup.copyExample("填空|答案是____|答案内容|5"))
                  }, [
                    vue.createElementVNode("text", null, "填空|答案是____|答案内容|5"),
                    vue.createElementVNode("text", { class: "copy-icon" }, "📋")
                  ]),
                  vue.createElementVNode("view", {
                    class: "hint-line",
                    onClick: _cache[23] || (_cache[23] = ($event) => $setup.copyExample("简答|请简述原理|参考答案内容|15"))
                  }, [
                    vue.createElementVNode("text", null, "简答|请简述原理|参考答案内容|15"),
                    vue.createElementVNode("text", { class: "copy-icon" }, "📋")
                  ])
                ]),
                vue.createElementVNode("text", { class: "hint-note" }, "注：判断题正确答案填A，错误填B；多选题答案用逗号分隔。点击示例可复制")
              ]),
              vue.withDirectives(vue.createElementVNode(
                "textarea",
                {
                  class: "form-textarea",
                  "onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => $setup.importText = $event),
                  placeholder: "请粘贴题目文本..."
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.importText]
              ])
            ])
          ]),
          vue.createElementVNode("view", { class: "modal-footer" }, [
            vue.createElementVNode("button", {
              class: "modal-btn cancel",
              onClick: _cache[25] || (_cache[25] = ($event) => $setup.showImportModal = false)
            }, "取消"),
            vue.createElementVNode("button", {
              class: "modal-btn confirm",
              onClick: _cache[26] || (_cache[26] = (...args) => $setup.submitImport && $setup.submitImport(...args))
            }, "导入")
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesTeacherQuestionManage = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["render", _sfc_render], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/teacher/question-manage.vue"]]);
  const _sfc_main$g = {
    __name: "paper-manage",
    setup(__props) {
      const tableData = vue.ref([]);
      const subjects = vue.ref([]);
      const params = vue.ref({
        subjectId: "",
        status: "",
        keyword: ""
      });
      const loadStatus = vue.ref("more");
      const current = vue.ref(1);
      const size = vue.ref(10);
      const subjectOptions = vue.computed(() => {
        return [{ id: "", name: "全部科目" }, ...subjects.value];
      });
      const statusOptions = [
        { value: "", label: "全部状态" },
        { value: "DRAFT", label: "草稿" },
        { value: "PUBLISHED", label: "已发布" }
      ];
      const currentSubjectText = vue.computed(() => {
        const option = subjectOptions.value.find((s) => s.id === params.value.subjectId);
        return option ? option.name : "全部科目";
      });
      const currentStatusText = vue.computed(() => {
        const option = statusOptions.find((s) => s.value === params.value.status);
        return option ? option.label : "全部状态";
      });
      const getSubjectName = (subjectId) => {
        const subject = subjects.value.find((s) => s.id === subjectId);
        return subject ? subject.name : "未知科目";
      };
      const onSubjectChange = (e) => {
        const index = e.detail.value;
        params.value.subjectId = subjectOptions.value[index].id;
        loadData();
      };
      const onStatusChange = (e) => {
        const index = e.detail.value;
        params.value.status = statusOptions[index].value;
        loadData();
      };
      const handleCreate = () => {
        uni.navigateTo({ url: "/pages/teacher/paper-edit" });
      };
      const handleEdit = (item) => {
        uni.navigateTo({ url: `/pages/teacher/paper-edit?id=${item.id}` });
      };
      const handlePreview = (item) => {
        uni.navigateTo({ url: `/pages/teacher/paper-preview?id=${item.id}` });
      };
      const handlePublish = async (item) => {
        uni.showModal({
          title: "提示",
          content: "确定要发布试卷吗？",
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await paperApi.publish(item.id);
                if (result.code === 200) {
                  uni.showToast({ title: "试卷已发布", icon: "success" });
                  loadData();
                } else {
                  uni.showToast({ title: result.message || "操作失败", icon: "none" });
                }
              } catch (e) {
                uni.showToast({ title: "网络错误", icon: "none" });
              }
            }
          }
        });
      };
      const handleDelete = async (item) => {
        uni.showModal({
          title: "警告",
          content: "确定要删除试卷吗？此操作不可恢复！",
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await paperApi.delete(item.id);
                if (result.code === 200) {
                  uni.showToast({ title: "试卷已删除", icon: "success" });
                  loadData();
                } else {
                  uni.showToast({ title: result.message || "操作失败", icon: "none" });
                }
              } catch (e) {
                uni.showToast({ title: "网络错误", icon: "none" });
              }
            }
          }
        });
      };
      const loadSubjects = async () => {
        try {
          const res = await subjectApi.list();
          if (res.code === 200) {
            subjects.value = res.data;
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/paper-manage.vue:178", e);
        }
      };
      const loadData = async () => {
        if (loadStatus.value === "loading")
          return;
        loadStatus.value = "loading";
        current.value = 1;
        tableData.value = [];
        try {
          const res = await paperApi.page({
            current: current.value,
            size: size.value,
            subjectId: params.value.subjectId,
            status: params.value.status,
            keyword: params.value.keyword
          });
          if (res.code === 200) {
            tableData.value = res.data.records;
            loadStatus.value = res.data.records.length >= size.value ? "more" : "noMore";
          } else {
            uni.showToast({ title: res.message || "加载失败", icon: "none" });
            loadStatus.value = "more";
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/paper-manage.vue:204", e);
          uni.showToast({ title: "网络错误", icon: "none" });
          loadStatus.value = "more";
        }
      };
      vue.onMounted(() => {
        loadSubjects();
        loadData();
      });
      return (_ctx, _cache) => {
        const _component_uni_load_more = vue.resolveComponent("uni-load-more");
        return vue.openBlock(), vue.createElementBlock("view", { class: "paper-manage" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("text", { class: "title" }, "试卷管理"),
            vue.createElementVNode("text", { class: "subtitle" }, "创建和管理考试试卷，支持手动组卷和自动组卷")
          ]),
          vue.createCommentVNode(" 工具栏 "),
          vue.createElementVNode("view", { class: "toolbar" }, [
            vue.createElementVNode("view", { class: "toolbar-left" }, [
              vue.createElementVNode("picker", {
                mode: "selector",
                range: vue.unref(subjectOptions),
                "range-key": "name",
                onChange: onSubjectChange
              }, [
                vue.createElementVNode(
                  "view",
                  { class: "picker" },
                  vue.toDisplayString(vue.unref(currentSubjectText)),
                  1
                  /* TEXT */
                )
              ], 40, ["range"]),
              vue.createElementVNode(
                "picker",
                {
                  mode: "selector",
                  range: statusOptions,
                  "range-key": "label",
                  onChange: onStatusChange
                },
                [
                  vue.createElementVNode(
                    "view",
                    { class: "picker" },
                    vue.toDisplayString(vue.unref(currentStatusText)),
                    1
                    /* TEXT */
                  )
                ],
                32
                /* HYDRATE_EVENTS */
              )
            ]),
            vue.createElementVNode("button", {
              class: "create-btn",
              onClick: handleCreate
            }, "创建试卷")
          ]),
          vue.createCommentVNode(" 试卷列表 "),
          vue.createElementVNode("view", { class: "paper-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(tableData.value, (item) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "paper-item",
                  key: item.id
                }, [
                  vue.createElementVNode("view", { class: "paper-header" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "paper-title" },
                      vue.toDisplayString(item.title),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "view",
                      {
                        class: vue.normalizeClass(["paper-status", item.status === "PUBLISHED" ? "status-success" : "status-info"])
                      },
                      [
                        vue.createElementVNode(
                          "text",
                          null,
                          vue.toDisplayString(item.status === "PUBLISHED" ? "已发布" : "草稿"),
                          1
                          /* TEXT */
                        )
                      ],
                      2
                      /* CLASS */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "paper-info" }, [
                    vue.createElementVNode("view", { class: "info-row" }, [
                      vue.createElementVNode("text", { class: "info-icon" }, "📚"),
                      vue.createElementVNode(
                        "text",
                        { class: "info-text" },
                        "科目：" + vue.toDisplayString(getSubjectName(item.subjectId)),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "info-row" }, [
                      vue.createElementVNode("text", { class: "info-icon" }, "📝"),
                      vue.createElementVNode(
                        "text",
                        { class: "info-text" },
                        "题数：" + vue.toDisplayString(item.questionCount) + "道",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "info-row" }, [
                      vue.createElementVNode("text", { class: "info-icon" }, "🏆"),
                      vue.createElementVNode(
                        "text",
                        { class: "info-text" },
                        "总分：" + vue.toDisplayString(item.totalScore) + "分",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "info-row" }, [
                      vue.createElementVNode("text", { class: "info-icon" }, "⏱"),
                      vue.createElementVNode(
                        "text",
                        { class: "info-text" },
                        "时长：" + vue.toDisplayString(item.duration) + "分钟",
                        1
                        /* TEXT */
                      )
                    ])
                  ]),
                  vue.createElementVNode("view", { class: "paper-actions" }, [
                    vue.createElementVNode("button", {
                      class: "action-btn",
                      onClick: ($event) => handleEdit(item)
                    }, "编辑", 8, ["onClick"]),
                    vue.createElementVNode("button", {
                      class: "action-btn",
                      onClick: ($event) => handlePreview(item)
                    }, "预览", 8, ["onClick"]),
                    item.status === "DRAFT" ? (vue.openBlock(), vue.createElementBlock("button", {
                      key: 0,
                      class: "action-btn success",
                      onClick: ($event) => handlePublish(item)
                    }, "发布", 8, ["onClick"])) : vue.createCommentVNode("v-if", true),
                    vue.createElementVNode("button", {
                      class: "action-btn danger",
                      onClick: ($event) => handleDelete(item)
                    }, "删除", 8, ["onClick"])
                  ])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createVNode(_component_uni_load_more, { status: loadStatus.value }, null, 8, ["status"])
        ]);
      };
    }
  };
  const PagesTeacherPaperManage = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["__scopeId", "data-v-1f88a9f4"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/teacher/paper-manage.vue"]]);
  const _sfc_main$f = {
    __name: "exam-manage",
    setup(__props) {
      const tableData = vue.ref([]);
      const subjects = vue.ref([]);
      const params = vue.ref({
        subjectId: "",
        status: "",
        keyword: ""
      });
      const loadStatus = vue.ref("more");
      const current = vue.ref(1);
      const size = vue.ref(10);
      const subjectOptions = vue.computed(() => {
        return [{ id: "", name: "全部科目" }, ...subjects.value];
      });
      const statusOptions = [
        { value: "", label: "全部状态" },
        { value: "PENDING", label: "待开始" },
        { value: "ONGOING", label: "进行中" },
        { value: "FINISHED", label: "已结束" }
      ];
      const currentSubjectText = vue.computed(() => {
        const option = subjectOptions.value.find((s) => s.id === params.value.subjectId);
        return option ? option.name : "全部科目";
      });
      const currentStatusText = vue.computed(() => {
        const option = statusOptions.find((s) => s.value === params.value.status);
        return option ? option.label : "全部状态";
      });
      const statusText = (status) => {
        return {
          PENDING: "待开始",
          ONGOING: "进行中",
          FINISHED: "已结束"
        }[status] || status;
      };
      const getSubjectName = (subjectId) => {
        const subject = subjects.value.find((s) => s.id === subjectId);
        return subject ? subject.name : "未知科目";
      };
      const formatDateTime = (time) => {
        if (!time)
          return "";
        const date = new Date(time);
        return date.toLocaleString("zh-CN");
      };
      const onSubjectChange = (e) => {
        const index = e.detail.value;
        params.value.subjectId = subjectOptions.value[index].id;
        loadData();
      };
      const onStatusChange = (e) => {
        const index = e.detail.value;
        params.value.status = statusOptions[index].value;
        loadData();
      };
      const handleCreate = () => {
        uni.navigateTo({ url: "/pages/teacher/exam-edit" });
      };
      const handleMonitor = (item) => {
        uni.navigateTo({ url: `/pages/teacher/exam-monitor?id=${item.id}` });
      };
      const handleEdit = (item) => {
        uni.navigateTo({ url: `/pages/teacher/exam-edit?id=${item.id}` });
      };
      const handleStart = async (item) => {
        uni.showModal({
          title: "提示",
          content: "确定要开始考试吗？",
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await examApi.start(item.id);
                if (result.code === 200) {
                  uni.showToast({ title: "考试已开始", icon: "success" });
                  loadData();
                } else {
                  uni.showToast({ title: result.message || "操作失败", icon: "none" });
                }
              } catch (e) {
                uni.showToast({ title: "网络错误", icon: "none" });
              }
            }
          }
        });
      };
      const handleFinish = async (item) => {
        uni.showModal({
          title: "提示",
          content: "确定要结束考试吗？",
          success: async (res) => {
            if (res.confirm) {
              try {
                const result = await examApi.finish(item.id);
                if (result.code === 200) {
                  uni.showToast({ title: "考试已结束", icon: "success" });
                  loadData();
                } else {
                  uni.showToast({ title: result.message || "操作失败", icon: "none" });
                }
              } catch (e) {
                uni.showToast({ title: "网络错误", icon: "none" });
              }
            }
          }
        });
      };
      const handleStats = (item) => {
        uni.navigateTo({
          url: `/pages/admin/statistics?examId=${item.id}`
        });
      };
      const loadSubjects = async () => {
        try {
          const res = await subjectApi.list();
          if (res.code === 200) {
            subjects.value = res.data;
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-manage.vue:200", e);
        }
      };
      const loadData = async () => {
        if (loadStatus.value === "loading")
          return;
        loadStatus.value = "loading";
        current.value = 1;
        tableData.value = [];
        try {
          const res = await examApi.page({
            current: current.value,
            size: size.value,
            subjectId: params.value.subjectId,
            status: params.value.status,
            keyword: params.value.keyword
          });
          if (res.code === 200) {
            tableData.value = res.data.records;
            loadStatus.value = res.data.records.length >= size.value ? "more" : "noMore";
          } else {
            uni.showToast({ title: res.message || "加载失败", icon: "none" });
            loadStatus.value = "more";
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-manage.vue:226", e);
          uni.showToast({ title: "网络错误", icon: "none" });
          loadStatus.value = "more";
        }
      };
      vue.onMounted(() => {
        loadSubjects();
        loadData();
      });
      return (_ctx, _cache) => {
        const _component_uni_load_more = vue.resolveComponent("uni-load-more");
        return vue.openBlock(), vue.createElementBlock("view", { class: "exam-manage" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("text", { class: "title" }, "考试管理"),
            vue.createElementVNode("text", { class: "subtitle" }, "发布和管理考试，监控考生状态")
          ]),
          vue.createCommentVNode(" 工具栏 "),
          vue.createElementVNode("view", { class: "toolbar" }, [
            vue.createElementVNode("view", { class: "toolbar-left" }, [
              vue.createElementVNode("picker", {
                mode: "selector",
                range: vue.unref(subjectOptions),
                "range-key": "name",
                onChange: onSubjectChange
              }, [
                vue.createElementVNode(
                  "view",
                  { class: "picker" },
                  vue.toDisplayString(vue.unref(currentSubjectText)),
                  1
                  /* TEXT */
                )
              ], 40, ["range"]),
              vue.createElementVNode(
                "picker",
                {
                  mode: "selector",
                  range: statusOptions,
                  "range-key": "label",
                  onChange: onStatusChange
                },
                [
                  vue.createElementVNode(
                    "view",
                    { class: "picker" },
                    vue.toDisplayString(vue.unref(currentStatusText)),
                    1
                    /* TEXT */
                  )
                ],
                32
                /* HYDRATE_EVENTS */
              )
            ]),
            vue.createElementVNode("button", {
              class: "create-btn",
              onClick: handleCreate
            }, "发布考试")
          ]),
          vue.createCommentVNode(" 考试列表 "),
          vue.createElementVNode("view", { class: "exam-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(tableData.value, (item) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "exam-item",
                  key: item.id
                }, [
                  vue.createElementVNode("view", { class: "exam-header" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "exam-title" },
                      vue.toDisplayString(item.title),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "view",
                      {
                        class: vue.normalizeClass(["exam-status", "status-" + item.status.toLowerCase()])
                      },
                      [
                        vue.createElementVNode(
                          "text",
                          null,
                          vue.toDisplayString(statusText(item.status)),
                          1
                          /* TEXT */
                        )
                      ],
                      2
                      /* CLASS */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "exam-info" }, [
                    vue.createElementVNode("view", { class: "info-row" }, [
                      vue.createElementVNode("text", { class: "info-icon" }, "📚"),
                      vue.createElementVNode(
                        "text",
                        { class: "info-text" },
                        "科目：" + vue.toDisplayString(getSubjectName(item.subjectId)),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "info-row" }, [
                      vue.createElementVNode("text", { class: "info-icon" }, "⏱"),
                      vue.createElementVNode(
                        "text",
                        { class: "info-text" },
                        "时长：" + vue.toDisplayString(item.duration) + "分钟",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "info-row" }, [
                      vue.createElementVNode("text", { class: "info-icon" }, "📅"),
                      vue.createElementVNode(
                        "text",
                        { class: "info-text" },
                        "开始：" + vue.toDisplayString(formatDateTime(item.startTime)),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "info-row" }, [
                      vue.createElementVNode("text", { class: "info-icon" }, "🏆"),
                      vue.createElementVNode(
                        "text",
                        { class: "info-text" },
                        "总分：" + vue.toDisplayString(item.totalScore) + "分",
                        1
                        /* TEXT */
                      )
                    ])
                  ]),
                  vue.createElementVNode("view", { class: "exam-actions" }, [
                    vue.createElementVNode("button", {
                      class: "action-btn",
                      onClick: ($event) => handleMonitor(item)
                    }, "监控", 8, ["onClick"]),
                    vue.createElementVNode("button", {
                      class: "action-btn",
                      onClick: ($event) => handleEdit(item)
                    }, "修改", 8, ["onClick"]),
                    item.status === "PENDING" ? (vue.openBlock(), vue.createElementBlock("button", {
                      key: 0,
                      class: "action-btn success",
                      onClick: ($event) => handleStart(item)
                    }, "开始", 8, ["onClick"])) : vue.createCommentVNode("v-if", true),
                    item.status === "ONGOING" ? (vue.openBlock(), vue.createElementBlock("button", {
                      key: 1,
                      class: "action-btn warning",
                      onClick: ($event) => handleFinish(item)
                    }, "结束", 8, ["onClick"])) : vue.createCommentVNode("v-if", true),
                    vue.createElementVNode("button", {
                      class: "action-btn primary",
                      onClick: ($event) => handleStats(item)
                    }, "统计", 8, ["onClick"])
                  ])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createVNode(_component_uni_load_more, { status: loadStatus.value }, null, 8, ["status"])
        ]);
      };
    }
  };
  const PagesTeacherExamManage = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["__scopeId", "data-v-41ca3adc"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/teacher/exam-manage.vue"]]);
  const _sfc_main$e = {
    __name: "exam-record-manage",
    setup(__props) {
      const tableData = vue.ref([]);
      const exams = vue.ref([]);
      const params = vue.ref({
        examId: "",
        status: ""
      });
      const loadStatus = vue.ref("more");
      const current = vue.ref(1);
      const size = vue.ref(10);
      const examOptions = vue.computed(() => {
        return [{ id: "", title: "全部考试" }, ...exams.value];
      });
      const statusOptions = [
        { value: "", label: "全部状态" },
        { value: "SUBMITTED", label: "已提交" },
        { value: "AUTO_SUBMITTED", label: "强制收卷" },
        { value: "GRADED", label: "已评分" }
      ];
      const currentExamText = vue.computed(() => {
        const option = examOptions.value.find((e) => e.id === params.value.examId);
        return option ? option.title : "全部考试";
      });
      const currentStatusText = vue.computed(() => {
        const option = statusOptions.find((s) => s.value === params.value.status);
        return option ? option.label : "全部状态";
      });
      const formatDateTime = (time) => {
        if (!time)
          return "";
        const date = new Date(time);
        return date.toLocaleString("zh-CN");
      };
      const onExamChange = (e) => {
        const index = e.detail.value;
        params.value.examId = examOptions.value[index].id;
        loadData();
      };
      const onStatusChange = (e) => {
        const index = e.detail.value;
        params.value.status = statusOptions[index].value;
        loadData();
      };
      const handleView = (item) => {
        uni.navigateTo({
          url: `/pages/teacher/exam-record-detail?examId=${item.examId}&recordId=${item.id}`
        });
      };
      const handleGrade = (item) => {
        uni.navigateTo({
          url: `/pages/teacher/exam-grade?examId=${item.examId}&recordId=${item.id}`
        });
      };
      const loadExams = async () => {
        try {
          const res = await examApi.list();
          if (res.code === 200) {
            exams.value = res.data;
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-record-manage.vue:133", e);
        }
      };
      const loadData = async () => {
        if (loadStatus.value === "loading")
          return;
        loadStatus.value = "loading";
        current.value = 1;
        tableData.value = [];
        try {
          const res = await examRecordApi.page({
            current: current.value,
            size: size.value,
            examId: params.value.examId,
            status: params.value.status
          });
          if (res.code === 200) {
            tableData.value = res.data.records;
            loadStatus.value = res.data.records.length >= size.value ? "more" : "noMore";
          } else {
            uni.showToast({ title: res.message || "加载失败", icon: "none" });
            loadStatus.value = "more";
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-record-manage.vue:158", e);
          uni.showToast({ title: "网络错误", icon: "none" });
          loadStatus.value = "more";
        }
      };
      vue.onMounted(() => {
        loadExams();
        loadData();
      });
      return (_ctx, _cache) => {
        const _component_uni_load_more = vue.resolveComponent("uni-load-more");
        return vue.openBlock(), vue.createElementBlock("view", { class: "exam-record" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("text", { class: "title" }, "考试记录"),
            vue.createElementVNode("text", { class: "subtitle" }, "查看学生考试记录和答卷详情")
          ]),
          vue.createCommentVNode(" 工具栏 "),
          vue.createElementVNode("view", { class: "toolbar" }, [
            vue.createElementVNode("view", { class: "toolbar-left" }, [
              vue.createElementVNode("picker", {
                mode: "selector",
                range: vue.unref(examOptions),
                "range-key": "title",
                onChange: onExamChange
              }, [
                vue.createElementVNode(
                  "view",
                  { class: "picker" },
                  vue.toDisplayString(vue.unref(currentExamText)),
                  1
                  /* TEXT */
                )
              ], 40, ["range"]),
              vue.createElementVNode(
                "picker",
                {
                  mode: "selector",
                  range: statusOptions,
                  "range-key": "label",
                  onChange: onStatusChange
                },
                [
                  vue.createElementVNode(
                    "view",
                    { class: "picker" },
                    vue.toDisplayString(vue.unref(currentStatusText)),
                    1
                    /* TEXT */
                  )
                ],
                32
                /* HYDRATE_EVENTS */
              )
            ]),
            vue.createElementVNode("button", {
              class: "search-btn",
              onClick: loadData
            }, "搜索")
          ]),
          vue.createCommentVNode(" 记录列表 "),
          vue.createElementVNode("view", { class: "record-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(tableData.value, (item) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "record-item",
                  key: item.id
                }, [
                  vue.createElementVNode("view", { class: "record-header" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "student-name" },
                      vue.toDisplayString(item.studentName),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "view",
                      {
                        class: vue.normalizeClass(["score-badge", item.score >= 60 ? "pass" : "fail"])
                      },
                      [
                        vue.createElementVNode(
                          "text",
                          null,
                          vue.toDisplayString(item.score) + "分",
                          1
                          /* TEXT */
                        )
                      ],
                      2
                      /* CLASS */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "record-info" }, [
                    vue.createElementVNode("view", { class: "info-row" }, [
                      vue.createElementVNode("text", { class: "info-icon" }, "📋"),
                      vue.createElementVNode(
                        "text",
                        { class: "info-text" },
                        "考试：" + vue.toDisplayString(item.examTitle),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "info-row" }, [
                      vue.createElementVNode("text", { class: "info-icon" }, "📅"),
                      vue.createElementVNode(
                        "text",
                        { class: "info-text" },
                        "提交时间：" + vue.toDisplayString(formatDateTime(item.submitTime)),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "info-row" }, [
                      vue.createElementVNode("text", { class: "info-icon" }, "⏱"),
                      vue.createElementVNode(
                        "text",
                        { class: "info-text" },
                        "用时：" + vue.toDisplayString(item.duration) + "分钟",
                        1
                        /* TEXT */
                      )
                    ]),
                    item.status === "AUTO_SUBMITTED" ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "info-row"
                    }, [
                      vue.createElementVNode("text", { class: "info-icon" }, "⚠️"),
                      vue.createElementVNode("text", { class: "info-text warning" }, "强制收卷")
                    ])) : vue.createCommentVNode("v-if", true)
                  ]),
                  vue.createElementVNode("view", { class: "record-actions" }, [
                    vue.createElementVNode("button", {
                      class: "action-btn",
                      onClick: ($event) => handleView(item)
                    }, "查看答卷", 8, ["onClick"]),
                    !item.score ? (vue.openBlock(), vue.createElementBlock("button", {
                      key: 0,
                      class: "action-btn primary",
                      onClick: ($event) => handleGrade(item)
                    }, "评分", 8, ["onClick"])) : vue.createCommentVNode("v-if", true)
                  ])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createVNode(_component_uni_load_more, { status: loadStatus.value }, null, 8, ["status"])
        ]);
      };
    }
  };
  const PagesTeacherExamRecordManage = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["__scopeId", "data-v-7c10f726"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/teacher/exam-record-manage.vue"]]);
  const _sfc_main$d = {
    __name: "exam-monitor",
    setup(__props) {
      const examId = vue.ref("");
      const examInfo = vue.reactive({
        title: "",
        status: "",
        subjectId: "",
        duration: 0,
        startTime: "",
        className: ""
      });
      const stats = vue.reactive({
        total: 0,
        submitted: 0,
        notStarted: 0,
        ongoing: 0
      });
      const subjects = vue.ref([]);
      const studentRecords = vue.ref([]);
      const filterStatus = vue.ref("");
      const statusOptions = [
        { value: "", label: "全部" },
        { value: "NOT_STARTED", label: "未开始" },
        { value: "ONGOING", label: "进行中" },
        { value: "SUBMITTED", label: "已提交" },
        { value: "AUTO_SUBMITTED", label: "强制收卷" }
      ];
      const currentStatusText = vue.ref("全部");
      const statusText = (status) => {
        return {
          PENDING: "待开始",
          ONGOING: "进行中",
          FINISHED: "已结束"
        }[status] || status;
      };
      const getStatusText = (status) => {
        return {
          NOT_STARTED: "未开始",
          ONGOING: "进行中",
          SUBMITTED: "已提交",
          AUTO_SUBMITTED: "强制收卷"
        }[status] || status;
      };
      const getStatusClass = (status) => {
        return {
          NOT_STARTED: "status-not-started",
          ONGOING: "status-ongoing",
          SUBMITTED: "status-submitted",
          AUTO_SUBMITTED: "status-auto-submitted"
        }[status] || "";
      };
      const getSubjectName = (subjectId) => {
        const subject = subjects.value.find((s) => s.id === subjectId);
        return subject ? subject.name : "未知科目";
      };
      const formatDateTime = (time) => {
        if (!time)
          return "";
        const date = new Date(time);
        return date.toLocaleString("zh-CN");
      };
      const goBack = () => {
        uni.navigateBack();
      };
      const onStatusChange = (e) => {
        const index = e.detail.value;
        filterStatus.value = statusOptions[index].value;
        currentStatusText.value = statusOptions[index].label;
        loadStudentRecords();
      };
      const loadExamInfo = async () => {
        try {
          const res = await examApi.getById(examId.value);
          if (res.code === 200) {
            Object.assign(examInfo, res.data);
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-monitor.vue:184", "加载考试信息失败:", e);
        }
      };
      const loadStats = async () => {
        try {
          const res = await examRecordApi.getExamStats(examId.value);
          if (res.code === 200) {
            Object.assign(stats, res.data);
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-monitor.vue:195", "加载统计数据失败:", e);
        }
      };
      const loadStudentRecords = async () => {
        try {
          const params = { current: 1, size: 100, examId: examId.value };
          if (filterStatus.value) {
            params.status = filterStatus.value;
          }
          const res = await examRecordApi.page(params);
          if (res.code === 200) {
            studentRecords.value = res.data.records || [];
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-monitor.vue:210", "加载考生记录失败:", e);
        }
      };
      const loadSubjects = async () => {
        try {
          const res = await subjectApi.list();
          if (res.code === 200) {
            subjects.value = res.data;
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-monitor.vue:221", "加载科目失败:", e);
        }
      };
      onLoad((options) => {
        examId.value = options.id;
        loadSubjects();
        loadExamInfo();
        loadStats();
        loadStudentRecords();
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "exam-monitor" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("view", {
              class: "back-btn",
              onClick: goBack
            }, [
              vue.createElementVNode("text", { class: "back-icon" }, "‹")
            ]),
            vue.createElementVNode("text", { class: "title" }, "考试监控"),
            vue.createElementVNode("view", { class: "header-right" })
          ]),
          vue.createCommentVNode(" 考试信息 "),
          vue.createElementVNode("view", { class: "card" }, [
            vue.createElementVNode("view", { class: "exam-header" }, [
              vue.createElementVNode(
                "text",
                { class: "exam-title" },
                vue.toDisplayString(examInfo.title),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["status-tag", "status-" + examInfo.status.toLowerCase()])
                },
                [
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString(statusText(examInfo.status)),
                    1
                    /* TEXT */
                  )
                ],
                2
                /* CLASS */
              )
            ]),
            vue.createElementVNode("view", { class: "exam-info" }, [
              vue.createElementVNode("view", { class: "info-row" }, [
                vue.createElementVNode("text", { class: "info-icon" }, "📚"),
                vue.createElementVNode(
                  "text",
                  { class: "info-text" },
                  "科目：" + vue.toDisplayString(getSubjectName(examInfo.subjectId)),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "info-row" }, [
                vue.createElementVNode("text", { class: "info-icon" }, "⏱"),
                vue.createElementVNode(
                  "text",
                  { class: "info-text" },
                  "时长：" + vue.toDisplayString(examInfo.duration) + "分钟",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "info-row" }, [
                vue.createElementVNode("text", { class: "info-icon" }, "📅"),
                vue.createElementVNode(
                  "text",
                  { class: "info-text" },
                  "开始：" + vue.toDisplayString(formatDateTime(examInfo.startTime)),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "info-row" }, [
                vue.createElementVNode("text", { class: "info-icon" }, "🏫"),
                vue.createElementVNode(
                  "text",
                  { class: "info-text" },
                  "班级：" + vue.toDisplayString(examInfo.className),
                  1
                  /* TEXT */
                )
              ])
            ])
          ]),
          vue.createCommentVNode(" 统计数据 "),
          vue.createElementVNode("view", { class: "card" }, [
            vue.createElementVNode("view", { class: "card-header" }, [
              vue.createElementVNode("text", { class: "card-title" }, "考试统计")
            ]),
            vue.createElementVNode("view", { class: "stats-grid" }, [
              vue.createElementVNode("view", { class: "stat-item" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString(stats.total),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "总人数")
              ]),
              vue.createElementVNode("view", { class: "stat-item" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString(stats.submitted),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "已提交")
              ]),
              vue.createElementVNode("view", { class: "stat-item" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString(stats.notStarted),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "未开始")
              ]),
              vue.createElementVNode("view", { class: "stat-item" }, [
                vue.createElementVNode(
                  "text",
                  { class: "stat-value" },
                  vue.toDisplayString(stats.ongoing),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "stat-label" }, "进行中")
              ])
            ])
          ]),
          vue.createCommentVNode(" 考生列表 "),
          vue.createElementVNode("view", { class: "card" }, [
            vue.createElementVNode("view", { class: "card-header" }, [
              vue.createElementVNode("text", { class: "card-title" }, "考生状态"),
              vue.createElementVNode(
                "picker",
                {
                  mode: "selector",
                  range: statusOptions,
                  "range-key": "label",
                  onChange: onStatusChange
                },
                [
                  vue.createElementVNode(
                    "view",
                    { class: "status-picker" },
                    vue.toDisplayString(currentStatusText.value),
                    1
                    /* TEXT */
                  )
                ],
                32
                /* HYDRATE_EVENTS */
              )
            ]),
            vue.createElementVNode("view", { class: "student-list" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(studentRecords.value, (item) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "student-item",
                    key: item.id
                  }, [
                    vue.createElementVNode("view", { class: "student-info" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "student-name" },
                        vue.toDisplayString(item.studentName),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "student-id" },
                        "学号：" + vue.toDisplayString(item.studentId),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "student-status" }, [
                      vue.createElementVNode(
                        "view",
                        {
                          class: vue.normalizeClass(["status-badge", getStatusClass(item.status)])
                        },
                        [
                          vue.createElementVNode(
                            "text",
                            null,
                            vue.toDisplayString(getStatusText(item.status)),
                            1
                            /* TEXT */
                          )
                        ],
                        2
                        /* CLASS */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "student-meta" }, [
                      item.submitTime ? (vue.openBlock(), vue.createElementBlock(
                        "text",
                        { key: 0 },
                        "提交时间：" + vue.toDisplayString(formatDateTime(item.submitTime)),
                        1
                        /* TEXT */
                      )) : vue.createCommentVNode("v-if", true),
                      item.score ? (vue.openBlock(), vue.createElementBlock(
                        "text",
                        { key: 1 },
                        "得分：" + vue.toDisplayString(item.score) + "分",
                        1
                        /* TEXT */
                      )) : vue.createCommentVNode("v-if", true)
                    ])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ])
        ]);
      };
    }
  };
  const PagesTeacherExamMonitor = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["__scopeId", "data-v-f57b8412"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/teacher/exam-monitor.vue"]]);
  const _sfc_main$c = {
    __name: "exam-edit",
    setup(__props) {
      const examId = vue.ref("");
      const isEdit = vue.ref(false);
      const papers = vue.ref([]);
      const classes = vue.ref([]);
      const selectedPaperId = vue.ref(null);
      const selectedClassId = vue.ref(null);
      const selectedPaper = vue.ref(null);
      const selectedClass = vue.ref(null);
      const form = vue.reactive({
        title: "",
        duration: "",
        startDate: "",
        startTime: "",
        passRate: "60",
        shuffleQuestions: false,
        shuffleOptions: false,
        leaveDetection: false,
        maxLeaveCount: "3",
        allowViewAfterExam: false
      });
      const goBack = () => {
        uni.navigateBack();
      };
      const onPaperChange = (e) => {
        const index = e.detail.value;
        if (papers.value[index]) {
          selectedPaperId.value = papers.value[index].id;
          selectedPaper.value = papers.value[index];
        }
      };
      const onClassChange = (e) => {
        const index = e.detail.value;
        if (classes.value[index]) {
          selectedClassId.value = classes.value[index].id;
          selectedClass.value = classes.value[index];
        }
      };
      const onStartDateChange = (e) => {
        form.startDate = e.detail.value;
      };
      const onStartTimeChange = (e) => {
        form.startTime = e.detail.value;
      };
      const onShuffleQuestionsChange = (e) => {
        form.shuffleQuestions = e.detail.value;
      };
      const onShuffleOptionsChange = (e) => {
        form.shuffleOptions = e.detail.value;
      };
      const onLeaveDetectionChange = (e) => {
        form.leaveDetection = e.detail.value;
      };
      const onAllowViewAfterExamChange = (e) => {
        form.allowViewAfterExam = e.detail.value;
      };
      const submitForm = async () => {
        if (!form.title.trim()) {
          uni.showToast({ title: "请输入考试标题", icon: "none" });
          return;
        }
        if (!selectedPaperId.value) {
          uni.showToast({ title: "请选择试卷", icon: "none" });
          return;
        }
        if (!selectedClassId.value) {
          uni.showToast({ title: "请选择班级", icon: "none" });
          return;
        }
        if (!form.duration) {
          uni.showToast({ title: "请输入考试时长", icon: "none" });
          return;
        }
        if (!form.startDate || !form.startTime) {
          uni.showToast({ title: "请选择开始时间", icon: "none" });
          return;
        }
        try {
          uni.showLoading({ title: "保存中..." });
          const startTime = `${form.startDate} ${form.startTime}:00`;
          const antiCheatConfig = {
            shuffleQuestions: form.shuffleQuestions,
            shuffleOptions: form.shuffleOptions,
            leaveDetection: form.leaveDetection,
            maxLeaveCount: parseInt(form.maxLeaveCount) || 3
          };
          const examData = {
            id: examId.value || null,
            title: form.title,
            paperId: selectedPaperId.value,
            classIds: selectedClassId.value,
            duration: parseInt(form.duration),
            startTime,
            passScore: parseInt(form.passRate) || 60,
            antiCheatConfig: JSON.stringify(antiCheatConfig),
            allowViewAfterExam: form.allowViewAfterExam ? 1 : 0
          };
          let res;
          if (isEdit.value) {
            res = await examApi.update(examData);
          } else {
            res = await examApi.create(examData);
          }
          if (res.code === 200) {
            uni.showToast({ title: "保存成功", icon: "success" });
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          } else {
            uni.showToast({ title: res.message || "保存失败", icon: "none" });
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-edit.vue:254", "保存失败:", e);
          uni.showToast({ title: "保存失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const loadPapers = async () => {
        try {
          const res = await paperApi.page({ current: 1, size: 50 });
          if (res.code === 200) {
            papers.value = res.data.records || [];
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-edit.vue:268", "加载试卷失败:", e);
        }
      };
      const loadClasses = async () => {
        var _a;
        try {
          const userId = (_a = uni.getStorageSync("userInfo")) == null ? void 0 : _a.userId;
          const res = await classApi.getMyClasses(userId);
          if (res.code === 200) {
            classes.value = res.data.map((item) => item.class) || [];
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-edit.vue:280", "加载班级失败:", e);
        }
      };
      const loadExamInfo = async () => {
        try {
          const res = await examApi.getById(examId.value);
          if (res.code === 200) {
            const data = res.data;
            form.title = data.title;
            form.duration = data.duration.toString();
            const date = new Date(data.startTime);
            form.startDate = date.toISOString().split("T")[0];
            form.startTime = date.toTimeString().slice(0, 5);
            selectedPaperId.value = data.paperId;
            selectedClassId.value = data.classId;
            selectedPaper.value = papers.value.find((p) => p.id === data.paperId);
            selectedClass.value = classes.value.find((c) => c.id === data.classId);
            if (data.passScore) {
              form.passRate = data.passScore.toString();
            }
            if (data.allowViewAfterExam !== void 0) {
              form.allowViewAfterExam = data.allowViewAfterExam === 1;
            }
            if (data.antiCheatConfig) {
              try {
                const config = JSON.parse(data.antiCheatConfig);
                if (config.shuffleQuestions !== void 0) {
                  form.shuffleQuestions = config.shuffleQuestions;
                }
                if (config.shuffleOptions !== void 0) {
                  form.shuffleOptions = config.shuffleOptions;
                }
                if (config.leaveDetection !== void 0) {
                  form.leaveDetection = config.leaveDetection;
                }
                if (config.maxLeaveCount !== void 0) {
                  form.maxLeaveCount = config.maxLeaveCount.toString();
                }
              } catch (e) {
                formatAppLog("error", "at pages/teacher/exam-edit.vue:326", "解析防作弊配置失败:", e);
              }
            }
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-edit.vue:331", "加载考试信息失败:", e);
        }
      };
      onLoad((options) => {
        if (options.id) {
          examId.value = options.id;
          isEdit.value = true;
        }
        loadPapers();
        loadClasses();
        if (isEdit.value) {
          setTimeout(() => {
            loadExamInfo();
          }, 100);
        }
      });
      return (_ctx, _cache) => {
        var _a, _b;
        return vue.openBlock(), vue.createElementBlock("view", { class: "exam-edit" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("view", {
              class: "back-btn",
              onClick: goBack
            }, [
              vue.createElementVNode("text", { class: "back-icon" }, "‹")
            ]),
            vue.createElementVNode(
              "text",
              { class: "title" },
              vue.toDisplayString(isEdit.value ? "编辑考试" : "创建考试"),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "header-right" })
          ]),
          vue.createElementVNode("scroll-view", {
            class: "form-body",
            "scroll-y": ""
          }, [
            vue.createElementVNode("view", { class: "card" }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-title" }, "基本信息")
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "考试标题 *"),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "form-input",
                    "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.title = $event),
                    placeholder: "请输入考试标题"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, form.title]
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "选择试卷 *"),
                vue.createElementVNode("picker", {
                  mode: "selector",
                  range: papers.value,
                  "range-key": "title",
                  onChange: onPaperChange
                }, [
                  vue.createElementVNode("view", { class: "form-picker" }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString(((_a = selectedPaper.value) == null ? void 0 : _a.title) || "请选择试卷"),
                      1
                      /* TEXT */
                    )
                  ])
                ], 40, ["range"])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "选择班级 *"),
                vue.createElementVNode("picker", {
                  mode: "selector",
                  range: classes.value,
                  "range-key": "className",
                  onChange: onClassChange
                }, [
                  vue.createElementVNode("view", { class: "form-picker" }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString(((_b = selectedClass.value) == null ? void 0 : _b.className) || "请选择班级"),
                      1
                      /* TEXT */
                    )
                  ])
                ], 40, ["range"])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "考试时长（分钟）*"),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "form-input",
                    type: "number",
                    "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.duration = $event),
                    placeholder: "请输入考试时长"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, form.duration]
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "开始日期 *"),
                vue.createElementVNode("picker", {
                  mode: "date",
                  value: form.startDate,
                  onChange: onStartDateChange
                }, [
                  vue.createElementVNode("view", { class: "form-picker" }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString(form.startDate || "请选择日期"),
                      1
                      /* TEXT */
                    )
                  ])
                ], 40, ["value"])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "开始时间 *"),
                vue.createElementVNode("picker", {
                  mode: "time",
                  value: form.startTime,
                  onChange: onStartTimeChange
                }, [
                  vue.createElementVNode("view", { class: "form-picker" }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString(form.startTime || "请选择时间"),
                      1
                      /* TEXT */
                    )
                  ])
                ], 40, ["value"])
              ])
            ]),
            vue.createElementVNode("view", { class: "card" }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-title" }, "考试设置")
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "及格比例 (%)"),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "form-input",
                    type: "number",
                    "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.passRate = $event),
                    placeholder: "默认60"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, form.passRate]
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "题目乱序"),
                vue.createElementVNode("view", { class: "form-switch-wrap" }, [
                  vue.createElementVNode("switch", {
                    checked: form.shuffleQuestions,
                    onChange: onShuffleQuestionsChange,
                    color: "#dc2626"
                  }, null, 40, ["checked"]),
                  vue.createElementVNode("text", { class: "switch-desc" }, "开启后题目顺序随机排列")
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "选项乱序"),
                vue.createElementVNode("view", { class: "form-switch-wrap" }, [
                  vue.createElementVNode("switch", {
                    checked: form.shuffleOptions,
                    onChange: onShuffleOptionsChange,
                    color: "#dc2626"
                  }, null, 40, ["checked"]),
                  vue.createElementVNode("text", { class: "switch-desc" }, "开启后选项顺序随机排列")
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "离开检测"),
                vue.createElementVNode("view", { class: "form-switch-wrap" }, [
                  vue.createElementVNode("switch", {
                    checked: form.leaveDetection,
                    onChange: onLeaveDetectionChange,
                    color: "#dc2626"
                  }, null, 40, ["checked"]),
                  vue.createElementVNode("text", { class: "switch-desc" }, "检测考试期间离开页面")
                ])
              ]),
              form.leaveDetection ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "form-item"
              }, [
                vue.createElementVNode("text", { class: "form-label" }, "离开次数上限"),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "form-input",
                    type: "number",
                    "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.maxLeaveCount = $event),
                    placeholder: "超过此次数将自动收卷"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, form.maxLeaveCount]
                ])
              ])) : vue.createCommentVNode("v-if", true),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "允许考后查看"),
                vue.createElementVNode("view", { class: "form-switch-wrap" }, [
                  vue.createElementVNode("switch", {
                    checked: form.allowViewAfterExam,
                    onChange: onAllowViewAfterExamChange,
                    color: "#dc2626"
                  }, null, 40, ["checked"]),
                  vue.createElementVNode("text", { class: "switch-desc" }, "考试结束后可查看试卷和答案")
                ])
              ])
            ])
          ]),
          vue.createElementVNode("view", { class: "form-footer" }, [
            vue.createElementVNode("button", {
              class: "submit-btn",
              onClick: submitForm
            }, "保存")
          ])
        ]);
      };
    }
  };
  const PagesTeacherExamEdit = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["__scopeId", "data-v-fda6f62f"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/teacher/exam-edit.vue"]]);
  const _sfc_main$b = {
    __name: "paper-edit",
    setup(__props) {
      const paperId = vue.ref("");
      const isEdit = vue.ref(false);
      const subjects = vue.ref([]);
      const selectedSubjectId = vue.ref(null);
      const selectedSubject = vue.ref(null);
      const questions = vue.ref([]);
      const showAddQuestion = vue.ref(false);
      const form = vue.reactive({
        title: "",
        duration: "",
        totalScore: "",
        description: ""
      });
      const questionTypes = [
        { value: "SINGLE_CHOICE", label: "单选题" },
        { value: "MULTIPLE_CHOICE", label: "多选题" },
        { value: "JUDGMENT", label: "判断题" },
        { value: "FILL_BLANK", label: "填空题" },
        { value: "ESSAY", label: "简答题" }
      ];
      const currentQuestionType = vue.ref({ value: "SINGLE_CHOICE", label: "单选题" });
      const newQuestion = vue.reactive({
        type: "SINGLE_CHOICE",
        content: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        score: ""
      });
      const goBack = () => {
        uni.navigateBack();
      };
      const onSubjectChange = (e) => {
        const index = e.detail.value;
        if (subjects.value[index]) {
          selectedSubjectId.value = subjects.value[index].id;
          selectedSubject.value = subjects.value[index];
        }
      };
      const onQuestionTypeChange = (e) => {
        const index = e.detail.value;
        currentQuestionType.value = questionTypes[index];
        newQuestion.type = currentQuestionType.value.value;
        if (currentQuestionType.value.value === "JUDGMENT") {
          newQuestion.options = ["正确", "错误"];
          newQuestion.correctAnswer = "";
        } else if (currentQuestionType.value.value === "ESSAY") {
          newQuestion.options = [];
        } else {
          newQuestion.options = ["", "", "", ""];
        }
      };
      const addOption = () => {
        if (newQuestion.options.length < 6) {
          newQuestion.options.push("");
        }
      };
      const removeOption = (idx) => {
        if (newQuestion.options.length > 2) {
          newQuestion.options.splice(idx, 1);
        }
      };
      const addQuestion = () => {
        if (!newQuestion.content.trim()) {
          uni.showToast({ title: "请输入题目内容", icon: "none" });
          return;
        }
        if (!newQuestion.correctAnswer.trim()) {
          uni.showToast({ title: "请输入正确答案", icon: "none" });
          return;
        }
        questions.value.push({
          type: newQuestion.type,
          content: newQuestion.content,
          options: [...newQuestion.options.filter((o) => o.trim())],
          correctAnswer: newQuestion.correctAnswer,
          score: parseInt(newQuestion.score) || 10
        });
        newQuestion.content = "";
        newQuestion.options = ["", "", "", ""];
        newQuestion.correctAnswer = "";
        newQuestion.score = "";
        showAddQuestion.value = false;
      };
      const editQuestion = (index) => {
        uni.showToast({ title: "编辑功能开发中", icon: "none" });
      };
      const removeQuestion = (index) => {
        questions.value.splice(index, 1);
      };
      const getTypeText = (type) => {
        const map = {
          SINGLE_CHOICE: "单选",
          MULTIPLE_CHOICE: "多选",
          JUDGMENT: "判断",
          FILL_BLANK: "填空",
          ESSAY: "简答"
        };
        return map[type] || type;
      };
      const getTypeClass = (type) => {
        const map = {
          SINGLE_CHOICE: "type-single",
          MULTIPLE_CHOICE: "type-multi",
          JUDGMENT: "type-judge",
          FILL_BLANK: "type-fill",
          ESSAY: "type-essay"
        };
        return map[type] || "";
      };
      const truncate = (text, len) => {
        if (!text)
          return "-";
        return text.length > len ? text.substring(0, len) + "..." : text;
      };
      const submitForm = async () => {
        if (!form.title.trim()) {
          uni.showToast({ title: "请输入试卷标题", icon: "none" });
          return;
        }
        if (!selectedSubjectId.value) {
          uni.showToast({ title: "请选择科目", icon: "none" });
          return;
        }
        if (questions.value.length === 0) {
          uni.showToast({ title: "请至少添加一道题目", icon: "none" });
          return;
        }
        try {
          uni.showLoading({ title: "保存中..." });
          const paperData = {
            id: paperId.value || null,
            title: form.title,
            subjectId: selectedSubjectId.value,
            duration: form.duration ? parseInt(form.duration) : 60,
            totalScore: form.totalScore ? parseInt(form.totalScore) : questions.value.reduce((sum, q) => sum + (q.score || 0), 0),
            description: form.description,
            status: "DRAFT",
            questions: questions.value
          };
          let res;
          if (isEdit.value) {
            res = await paperApi.update(paperData);
          } else {
            res = await paperApi.create(paperData);
          }
          if (res.code === 200) {
            uni.showToast({ title: "保存成功", icon: "success" });
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          } else {
            uni.showToast({ title: res.message || "保存失败", icon: "none" });
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/paper-edit.vue:311", "保存失败:", e);
          uni.showToast({ title: "保存失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const loadSubjects = async () => {
        try {
          const res = await subjectApi.list();
          if (res.code === 200) {
            subjects.value = res.data;
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/paper-edit.vue:325", "加载科目失败:", e);
        }
      };
      const loadPaperInfo = async () => {
        try {
          const res = await paperApi.getById(paperId.value);
          if (res.code === 200) {
            const data = res.data;
            form.title = data.title;
            form.duration = data.duration ? data.duration.toString() : "";
            form.totalScore = data.totalScore ? data.totalScore.toString() : "";
            form.description = data.description || "";
            selectedSubjectId.value = data.subjectId;
            selectedSubject.value = subjects.value.find((s) => s.id === data.subjectId);
            const qRes = await paperApi.getQuestions(paperId.value);
            if (qRes.code === 200) {
              questions.value = qRes.data || [];
            }
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/paper-edit.vue:348", "加载试卷信息失败:", e);
        }
      };
      onLoad((options) => {
        if (options.id) {
          paperId.value = options.id;
          isEdit.value = true;
        }
        loadSubjects();
        if (isEdit.value) {
          setTimeout(() => {
            loadPaperInfo();
          }, 100);
        }
      });
      return (_ctx, _cache) => {
        var _a;
        return vue.openBlock(), vue.createElementBlock("view", { class: "paper-edit" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("view", {
              class: "back-btn",
              onClick: goBack
            }, [
              vue.createElementVNode("text", { class: "back-icon" }, "‹")
            ]),
            vue.createElementVNode(
              "text",
              { class: "title" },
              vue.toDisplayString(isEdit.value ? "编辑试卷" : "创建试卷"),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "header-right" })
          ]),
          vue.createElementVNode("scroll-view", {
            class: "form-body",
            "scroll-y": ""
          }, [
            vue.createElementVNode("view", { class: "card" }, [
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "试卷标题 *"),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "form-input",
                    "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.title = $event),
                    placeholder: "请输入试卷标题"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, form.title]
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "选择科目 *"),
                vue.createElementVNode("picker", {
                  mode: "selector",
                  range: subjects.value,
                  "range-key": "name",
                  onChange: onSubjectChange
                }, [
                  vue.createElementVNode("view", { class: "form-picker" }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString(((_a = selectedSubject.value) == null ? void 0 : _a.name) || "请选择科目"),
                      1
                      /* TEXT */
                    )
                  ])
                ], 40, ["range"])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "考试时长（分钟）"),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "form-input",
                    type: "number",
                    "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.duration = $event),
                    placeholder: "请输入考试时长"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, form.duration]
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "总分"),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "form-input",
                    type: "number",
                    "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.totalScore = $event),
                    placeholder: "请输入总分"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, form.totalScore]
                ])
              ]),
              vue.createElementVNode("view", { class: "form-item" }, [
                vue.createElementVNode("text", { class: "form-label" }, "试卷描述"),
                vue.withDirectives(vue.createElementVNode(
                  "textarea",
                  {
                    class: "form-textarea",
                    "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.description = $event),
                    placeholder: "请输入试卷描述"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, form.description]
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "card" }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-title" }, "题目列表"),
                vue.createElementVNode("button", {
                  class: "add-question-btn",
                  onClick: _cache[4] || (_cache[4] = ($event) => showAddQuestion.value = true)
                }, "添加题目")
              ]),
              questions.value.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "question-list"
              }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(questions.value, (q, index) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      class: "question-item",
                      key: index
                    }, [
                      vue.createElementVNode("view", { class: "question-header" }, [
                        vue.createElementVNode(
                          "view",
                          {
                            class: vue.normalizeClass(["type-tag", getTypeClass(q.type)])
                          },
                          [
                            vue.createElementVNode(
                              "text",
                              null,
                              vue.toDisplayString(getTypeText(q.type)),
                              1
                              /* TEXT */
                            )
                          ],
                          2
                          /* CLASS */
                        ),
                        vue.createElementVNode(
                          "text",
                          { class: "question-score" },
                          vue.toDisplayString(q.score) + "分",
                          1
                          /* TEXT */
                        )
                      ]),
                      vue.createElementVNode(
                        "text",
                        { class: "question-content" },
                        vue.toDisplayString(truncate(q.content, 100)),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode("view", { class: "question-actions" }, [
                        vue.createElementVNode("text", {
                          class: "action-text",
                          onClick: ($event) => editQuestion()
                        }, "编辑", 8, ["onClick"]),
                        vue.createElementVNode("text", {
                          class: "action-text danger",
                          onClick: ($event) => removeQuestion(index)
                        }, "删除", 8, ["onClick"])
                      ])
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])) : (vue.openBlock(), vue.createElementBlock("view", {
                key: 1,
                class: "empty"
              }, [
                vue.createElementVNode("text", { class: "empty-text" }, "暂无题目，请添加题目")
              ]))
            ])
          ]),
          vue.createElementVNode("view", { class: "form-footer" }, [
            vue.createElementVNode(
              "button",
              {
                class: "submit-btn",
                onClick: submitForm
              },
              vue.toDisplayString(isEdit.value ? "保存" : "创建"),
              1
              /* TEXT */
            )
          ]),
          vue.createCommentVNode(" 添加题目弹窗 "),
          showAddQuestion.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "modal",
            onClick: _cache[11] || (_cache[11] = ($event) => showAddQuestion.value = false)
          }, [
            vue.createElementVNode("view", {
              class: "question-modal",
              onClick: _cache[10] || (_cache[10] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("view", { class: "modal-header" }, [
                vue.createElementVNode("text", { class: "modal-title" }, "添加题目"),
                vue.createElementVNode("view", {
                  class: "modal-close",
                  onClick: _cache[5] || (_cache[5] = ($event) => showAddQuestion.value = false)
                }, [
                  vue.createElementVNode("text", { class: "close-icon" }, "✕")
                ])
              ]),
              vue.createElementVNode("scroll-view", {
                class: "modal-body",
                "scroll-y": ""
              }, [
                vue.createElementVNode("view", { class: "form-item" }, [
                  vue.createElementVNode("text", { class: "form-label" }, "题目类型 *"),
                  vue.createElementVNode(
                    "picker",
                    {
                      mode: "selector",
                      range: questionTypes,
                      "range-key": "label",
                      onChange: onQuestionTypeChange
                    },
                    [
                      vue.createElementVNode("view", { class: "form-picker" }, [
                        vue.createElementVNode(
                          "text",
                          null,
                          vue.toDisplayString(currentQuestionType.value.label || "请选择题目类型"),
                          1
                          /* TEXT */
                        )
                      ])
                    ],
                    32
                    /* HYDRATE_EVENTS */
                  )
                ]),
                vue.createElementVNode("view", { class: "form-item" }, [
                  vue.createElementVNode("text", { class: "form-label" }, "题目内容 *"),
                  vue.withDirectives(vue.createElementVNode(
                    "textarea",
                    {
                      class: "form-textarea",
                      "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => newQuestion.content = $event),
                      placeholder: "请输入题目内容"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, newQuestion.content]
                  ])
                ]),
                currentQuestionType.value.value !== "ESSAY" ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "form-item"
                }, [
                  vue.createElementVNode("text", { class: "form-label" }, "选项"),
                  vue.createElementVNode("view", { class: "options-list" }, [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList(newQuestion.options, (opt, idx) => {
                        return vue.openBlock(), vue.createElementBlock("view", {
                          class: "option-item",
                          key: idx
                        }, [
                          vue.createElementVNode(
                            "text",
                            { class: "option-label" },
                            vue.toDisplayString(String.fromCharCode(65 + idx)) + ".",
                            1
                            /* TEXT */
                          ),
                          vue.withDirectives(vue.createElementVNode("input", {
                            class: "option-input",
                            "onUpdate:modelValue": ($event) => newQuestion.options[idx] = $event,
                            placeholder: "选项" + String.fromCharCode(65 + idx)
                          }, null, 8, ["onUpdate:modelValue", "placeholder"]), [
                            [vue.vModelText, newQuestion.options[idx]]
                          ]),
                          newQuestion.options.length > 2 ? (vue.openBlock(), vue.createElementBlock("text", {
                            key: 0,
                            class: "option-delete",
                            onClick: ($event) => removeOption(idx)
                          }, "✕", 8, ["onClick"])) : vue.createCommentVNode("v-if", true)
                        ]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ]),
                  newQuestion.options.length < 6 ? (vue.openBlock(), vue.createElementBlock("button", {
                    key: 0,
                    class: "add-option-btn",
                    onClick: addOption
                  }, "添加选项")) : vue.createCommentVNode("v-if", true)
                ])) : vue.createCommentVNode("v-if", true),
                vue.createElementVNode("view", { class: "form-item" }, [
                  vue.createElementVNode("text", { class: "form-label" }, "正确答案 *"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      class: "form-input",
                      "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => newQuestion.correctAnswer = $event),
                      placeholder: "请输入正确答案"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, newQuestion.correctAnswer]
                  ])
                ]),
                vue.createElementVNode("view", { class: "form-item" }, [
                  vue.createElementVNode("text", { class: "form-label" }, "分值"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      class: "form-input",
                      type: "number",
                      "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => newQuestion.score = $event),
                      placeholder: "请输入分值"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, newQuestion.score]
                  ])
                ])
              ]),
              vue.createElementVNode("view", { class: "modal-footer" }, [
                vue.createElementVNode("button", {
                  class: "modal-btn cancel",
                  onClick: _cache[9] || (_cache[9] = ($event) => showAddQuestion.value = false)
                }, "取消"),
                vue.createElementVNode("button", {
                  class: "modal-btn confirm",
                  onClick: addQuestion
                }, "确认添加")
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true)
        ]);
      };
    }
  };
  const PagesTeacherPaperEdit = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["__scopeId", "data-v-ae5e2cd9"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/teacher/paper-edit.vue"]]);
  const _sfc_main$a = {
    __name: "paper-preview",
    setup(__props) {
      const paperId = vue.ref("");
      const paper = vue.reactive({
        title: "",
        subjectId: "",
        duration: 0,
        totalScore: 0,
        description: ""
      });
      const subjects = vue.ref([]);
      const questions = vue.ref([]);
      const currentIndex = vue.ref(0);
      const showAnswerCard = vue.ref(false);
      const goBack = () => {
        uni.navigateBack();
      };
      const getSubjectName = (subjectId) => {
        const subject = subjects.value.find((s) => s.id === subjectId);
        return subject ? subject.name : "未知科目";
      };
      const getTypeText = (type) => {
        return {
          SINGLE_CHOICE: "单选题",
          MULTIPLE_CHOICE: "多选题",
          JUDGMENT: "判断题",
          FILL_BLANK: "填空题",
          ESSAY: "简答题"
        }[type] || type;
      };
      const parseOptions = (options) => {
        if (!options)
          return [];
        if (Array.isArray(options)) {
          return options.map((opt) => {
            if (typeof opt === "object") {
              return opt.text || opt.content || JSON.stringify(opt);
            }
            return String(opt);
          });
        }
        if (typeof options === "string") {
          try {
            const parsed = JSON.parse(options);
            if (Array.isArray(parsed)) {
              return parsed.map((opt) => {
                if (typeof opt === "object") {
                  return opt.text || opt.content || JSON.stringify(opt);
                }
                return String(opt);
              });
            }
          } catch (e) {
            return options.split("|").filter((o) => o.trim());
          }
        }
        return [];
      };
      const formatAnswer = (q) => {
        const answer = q.answer || q.correctAnswer;
        if (!answer)
          return "";
        if (q.type === "JUDGMENT") {
          return answer === "A" || answer === "正确" ? "正确" : "错误";
        }
        return answer;
      };
      const currentQuestion = vue.computed(() => questions.value[currentIndex.value]);
      const singleQuestions = vue.computed(() => questions.value.filter((q) => q.type === "SINGLE_CHOICE"));
      const multiQuestions = vue.computed(() => questions.value.filter((q) => q.type === "MULTIPLE_CHOICE"));
      const judgeQuestions = vue.computed(() => questions.value.filter((q) => q.type === "JUDGMENT"));
      const fillQuestions = vue.computed(() => questions.value.filter((q) => q.type === "FILL_BLANK"));
      const essayQuestions = vue.computed(() => questions.value.filter((q) => q.type === "ESSAY"));
      const getQuestionIndex = (q) => {
        return questions.value.findIndex((item) => item.id === q.id);
      };
      const prevQuestion = () => {
        if (currentIndex.value > 0) {
          currentIndex.value--;
        }
      };
      const nextQuestion = () => {
        if (currentIndex.value < questions.value.length - 1) {
          currentIndex.value++;
        }
      };
      const jumpToQuestion = (index) => {
        currentIndex.value = index;
        showAnswerCard.value = false;
      };
      const loadPaperInfo = async () => {
        try {
          const res = await paperApi.getById(paperId.value);
          if (res.code === 200) {
            Object.assign(paper, res.data);
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/paper-preview.vue:291", "加载试卷信息失败:", e);
        }
      };
      const loadQuestions = async () => {
        try {
          const res = await paperApi.getQuestions(paperId.value);
          if (res.code === 200) {
            questions.value = res.data || [];
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/paper-preview.vue:302", "加载题目失败:", e);
        }
      };
      const loadSubjects = async () => {
        try {
          const res = await subjectApi.list();
          if (res.code === 200) {
            subjects.value = res.data;
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/paper-preview.vue:313", "加载科目失败:", e);
        }
      };
      onLoad((options) => {
        paperId.value = options.id;
        loadSubjects();
        loadPaperInfo();
        loadQuestions();
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "paper-preview" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("view", {
              class: "back-btn",
              onClick: goBack
            }, [
              vue.createElementVNode("text", { class: "back-icon" }, "‹")
            ]),
            vue.createElementVNode("text", { class: "title" }, "试卷预览"),
            vue.createElementVNode("view", { class: "header-right" })
          ]),
          vue.createElementVNode("view", { class: "exam-header" }, [
            vue.createElementVNode(
              "text",
              { class: "exam-title" },
              vue.toDisplayString(paper.title),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "exam-meta" }, [
              vue.createElementVNode("view", { class: "meta-item" }, [
                vue.createElementVNode("text", { class: "meta-icon" }, "📚"),
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString(getSubjectName(paper.subjectId)),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "meta-item" }, [
                vue.createElementVNode("text", { class: "meta-icon" }, "⏱"),
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString(paper.duration) + "分钟",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "meta-item" }, [
                vue.createElementVNode("text", { class: "meta-icon" }, "📝"),
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString(questions.value.length) + "道题",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "meta-item" }, [
                vue.createElementVNode("text", { class: "meta-icon" }, "🏆"),
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString(paper.totalScore) + "分",
                  1
                  /* TEXT */
                )
              ])
            ])
          ]),
          vue.unref(currentQuestion) ? (vue.openBlock(), vue.createElementBlock("scroll-view", {
            key: 0,
            class: "question-area",
            "scroll-y": ""
          }, [
            vue.createElementVNode("view", { class: "question-card" }, [
              vue.createElementVNode("view", { class: "question-header" }, [
                vue.createElementVNode("view", { class: "question-type" }, [
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString(getTypeText(vue.unref(currentQuestion).type)),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "question-score" }, [
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString(vue.unref(currentQuestion).score) + "分",
                    1
                    /* TEXT */
                  )
                ])
              ]),
              vue.createElementVNode("view", { class: "question-content" }, [
                vue.createElementVNode(
                  "text",
                  { class: "question-number" },
                  vue.toDisplayString(currentIndex.value + 1) + ".",
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "content-text" },
                  vue.toDisplayString(vue.unref(currentQuestion).content),
                  1
                  /* TEXT */
                )
              ]),
              vue.unref(currentQuestion).type !== "FILL_BLANK" && vue.unref(currentQuestion).type !== "ESSAY" ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "options-list"
              }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(parseOptions(vue.unref(currentQuestion).options), (opt, idx) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      class: "option-item",
                      key: idx
                    }, [
                      vue.createElementVNode(
                        "text",
                        { class: "option-label" },
                        vue.toDisplayString(String.fromCharCode(65 + idx)) + ".",
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "option-text" },
                        vue.toDisplayString(opt),
                        1
                        /* TEXT */
                      )
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])) : vue.createCommentVNode("v-if", true),
              vue.createElementVNode("view", { class: "answer-section" }, [
                vue.createElementVNode("text", { class: "answer-label" }, "正确答案："),
                vue.createElementVNode(
                  "text",
                  { class: "answer-text correct" },
                  vue.toDisplayString(formatAnswer(vue.unref(currentQuestion))),
                  1
                  /* TEXT */
                )
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", { class: "nav-footer" }, [
            vue.createElementVNode("button", {
              class: vue.normalizeClass(["nav-btn", currentIndex.value === 0 ? "disabled" : ""]),
              onClick: prevQuestion,
              disabled: currentIndex.value === 0
            }, [
              vue.createElementVNode("text", null, "上一题")
            ], 10, ["disabled"]),
            vue.createElementVNode("view", { class: "question-indicator" }, [
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString(currentIndex.value + 1) + " / " + vue.toDisplayString(questions.value.length),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("button", {
              class: vue.normalizeClass(["nav-btn", currentIndex.value === questions.value.length - 1 ? "disabled" : ""]),
              onClick: nextQuestion,
              disabled: currentIndex.value === questions.value.length - 1
            }, [
              vue.createElementVNode("text", null, "下一题")
            ], 10, ["disabled"])
          ]),
          vue.createElementVNode("view", {
            class: "answer-card-btn",
            onClick: _cache[0] || (_cache[0] = ($event) => showAnswerCard.value = !showAnswerCard.value)
          }, [
            vue.createElementVNode("text", { class: "answer-card-icon" }, "📋"),
            vue.createElementVNode("text", { class: "answer-card-text" }, "答题卡")
          ]),
          showAnswerCard.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "answer-card-modal",
            onClick: _cache[3] || (_cache[3] = ($event) => showAnswerCard.value = false)
          }, [
            vue.createElementVNode("view", {
              class: "answer-card-content",
              onClick: _cache[2] || (_cache[2] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("view", { class: "card-header" }, [
                vue.createElementVNode("text", { class: "card-title" }, "答题卡"),
                vue.createElementVNode("view", {
                  class: "close-btn",
                  onClick: _cache[1] || (_cache[1] = ($event) => showAnswerCard.value = false)
                }, [
                  vue.createElementVNode("text", { class: "close-icon" }, "×")
                ])
              ]),
              vue.createElementVNode("scroll-view", {
                class: "card-body",
                "scroll-y": ""
              }, [
                vue.unref(singleQuestions).length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "question-section"
                }, [
                  vue.createElementVNode(
                    "view",
                    { class: "section-title" },
                    "单选题 (" + vue.toDisplayString(vue.unref(singleQuestions).length) + "题)",
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("view", { class: "question-grid" }, [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList(vue.unref(singleQuestions), (q) => {
                        return vue.openBlock(), vue.createElementBlock("view", {
                          class: vue.normalizeClass(["question-item", getQuestionIndex(q) === currentIndex.value ? "current" : ""]),
                          key: q.id,
                          onClick: ($event) => jumpToQuestion(getQuestionIndex(q))
                        }, [
                          vue.createElementVNode(
                            "text",
                            null,
                            vue.toDisplayString(getQuestionIndex(q) + 1),
                            1
                            /* TEXT */
                          )
                        ], 10, ["onClick"]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ])
                ])) : vue.createCommentVNode("v-if", true),
                vue.unref(multiQuestions).length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 1,
                  class: "question-section"
                }, [
                  vue.createElementVNode(
                    "view",
                    { class: "section-title" },
                    "多选题 (" + vue.toDisplayString(vue.unref(multiQuestions).length) + "题)",
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("view", { class: "question-grid" }, [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList(vue.unref(multiQuestions), (q) => {
                        return vue.openBlock(), vue.createElementBlock("view", {
                          class: vue.normalizeClass(["question-item", getQuestionIndex(q) === currentIndex.value ? "current" : ""]),
                          key: q.id,
                          onClick: ($event) => jumpToQuestion(getQuestionIndex(q))
                        }, [
                          vue.createElementVNode(
                            "text",
                            null,
                            vue.toDisplayString(getQuestionIndex(q) + 1),
                            1
                            /* TEXT */
                          )
                        ], 10, ["onClick"]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ])
                ])) : vue.createCommentVNode("v-if", true),
                vue.unref(judgeQuestions).length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 2,
                  class: "question-section"
                }, [
                  vue.createElementVNode(
                    "view",
                    { class: "section-title" },
                    "判断题 (" + vue.toDisplayString(vue.unref(judgeQuestions).length) + "题)",
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("view", { class: "question-grid" }, [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList(vue.unref(judgeQuestions), (q) => {
                        return vue.openBlock(), vue.createElementBlock("view", {
                          class: vue.normalizeClass(["question-item", getQuestionIndex(q) === currentIndex.value ? "current" : ""]),
                          key: q.id,
                          onClick: ($event) => jumpToQuestion(getQuestionIndex(q))
                        }, [
                          vue.createElementVNode(
                            "text",
                            null,
                            vue.toDisplayString(getQuestionIndex(q) + 1),
                            1
                            /* TEXT */
                          )
                        ], 10, ["onClick"]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ])
                ])) : vue.createCommentVNode("v-if", true),
                vue.unref(fillQuestions).length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 3,
                  class: "question-section"
                }, [
                  vue.createElementVNode(
                    "view",
                    { class: "section-title" },
                    "填空题 (" + vue.toDisplayString(vue.unref(fillQuestions).length) + "题)",
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("view", { class: "question-grid" }, [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList(vue.unref(fillQuestions), (q) => {
                        return vue.openBlock(), vue.createElementBlock("view", {
                          class: vue.normalizeClass(["question-item", getQuestionIndex(q) === currentIndex.value ? "current" : ""]),
                          key: q.id,
                          onClick: ($event) => jumpToQuestion(getQuestionIndex(q))
                        }, [
                          vue.createElementVNode(
                            "text",
                            null,
                            vue.toDisplayString(getQuestionIndex(q) + 1),
                            1
                            /* TEXT */
                          )
                        ], 10, ["onClick"]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ])
                ])) : vue.createCommentVNode("v-if", true),
                vue.unref(essayQuestions).length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 4,
                  class: "question-section"
                }, [
                  vue.createElementVNode(
                    "view",
                    { class: "section-title" },
                    "简答题 (" + vue.toDisplayString(vue.unref(essayQuestions).length) + "题)",
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("view", { class: "question-grid" }, [
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList(vue.unref(essayQuestions), (q) => {
                        return vue.openBlock(), vue.createElementBlock("view", {
                          class: vue.normalizeClass(["question-item", getQuestionIndex(q) === currentIndex.value ? "current" : ""]),
                          key: q.id,
                          onClick: ($event) => jumpToQuestion(getQuestionIndex(q))
                        }, [
                          vue.createElementVNode(
                            "text",
                            null,
                            vue.toDisplayString(getQuestionIndex(q) + 1),
                            1
                            /* TEXT */
                          )
                        ], 10, ["onClick"]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ])
                ])) : vue.createCommentVNode("v-if", true)
              ]),
              vue.createElementVNode("view", { class: "card-legend" }, [
                vue.createElementVNode("view", { class: "legend-row" }, [
                  vue.createElementVNode("view", { class: "legend-item" }, [
                    vue.createElementVNode("view", { class: "dot current" }),
                    vue.createElementVNode("text", null, "当前")
                  ]),
                  vue.createElementVNode("view", { class: "legend-item" }, [
                    vue.createElementVNode("view", { class: "dot unanswered" }),
                    vue.createElementVNode("text", null, "未答")
                  ])
                ])
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true)
        ]);
      };
    }
  };
  const PagesTeacherPaperPreview = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["__scopeId", "data-v-8c165299"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/teacher/paper-preview.vue"]]);
  const _sfc_main$9 = {
    __name: "exam-record-detail",
    setup(__props) {
      const recordId = vue.ref("");
      const examId = vue.ref("");
      const examInfo = vue.reactive({
        title: "",
        subjectId: "",
        duration: 0,
        totalScore: 0
      });
      const recordInfo = vue.reactive({
        studentName: "",
        score: 0,
        submitTime: "",
        duration: 0,
        status: ""
      });
      const subjects = vue.ref([]);
      const questions = vue.ref([]);
      const studentAnswers = vue.ref({});
      const goBack = () => {
        uni.navigateBack();
      };
      const getSubjectName = (subjectId) => {
        const subject = subjects.value.find((s) => s.id === subjectId);
        return subject ? subject.name : "未知科目";
      };
      const formatDateTime = (time) => {
        if (!time)
          return "";
        const date = new Date(time);
        return date.toLocaleString("zh-CN");
      };
      const parseOptions = (options) => {
        if (!options)
          return [];
        if (Array.isArray(options)) {
          return options.map((opt) => {
            if (typeof opt === "object") {
              return opt.text || opt.content || JSON.stringify(opt);
            }
            return String(opt);
          });
        }
        if (typeof options === "string") {
          try {
            const parsed = JSON.parse(options);
            if (Array.isArray(parsed)) {
              return parsed.map((opt) => {
                if (typeof opt === "object") {
                  return opt.text || opt.content || JSON.stringify(opt);
                }
                return String(opt);
              });
            }
          } catch (e) {
            return options.split("|").filter((o) => o.trim());
          }
        }
        return [];
      };
      const getQuestionNumber = (q) => {
        return questions.value.findIndex((item) => item.id === q.id) + 1;
      };
      const getStudentAnswer = (q) => {
        return studentAnswers.value[q.id];
      };
      const isCorrectAnswer = (q) => {
        const studentAnswer = studentAnswers.value[q.id];
        if (!studentAnswer)
          return false;
        return studentAnswer === q.correctAnswer;
      };
      const isCorrectOption = (q, idx) => {
        if (!q.correctAnswer)
          return false;
        const optionLetter = String.fromCharCode(65 + idx);
        return q.correctAnswer.includes(optionLetter);
      };
      const isStudentAnswer = (q, idx) => {
        const studentAnswer = studentAnswers.value[q.id];
        if (!studentAnswer)
          return false;
        const optionLetter = String.fromCharCode(65 + idx);
        return studentAnswer.includes(optionLetter);
      };
      const getOptionClass = (q, idx) => {
        const classes = [];
        if (isCorrectOption(q, idx)) {
          classes.push("correct");
        }
        if (isStudentAnswer(q, idx)) {
          if (isCorrectOption(q, idx)) {
            classes.push("selected");
          } else {
            classes.push("selected wrong");
          }
        }
        return classes.join(" ");
      };
      const singleQuestions = vue.computed(() => questions.value.filter((q) => q.type === "SINGLE_CHOICE"));
      const multiQuestions = vue.computed(() => questions.value.filter((q) => q.type === "MULTIPLE_CHOICE"));
      const judgeQuestions = vue.computed(() => questions.value.filter((q) => q.type === "JUDGMENT"));
      const fillQuestions = vue.computed(() => questions.value.filter((q) => q.type === "FILL_BLANK"));
      const essayQuestions = vue.computed(() => questions.value.filter((q) => q.type === "ESSAY"));
      const loadRecord = async () => {
        try {
          uni.showLoading({ title: "加载中..." });
          const res = await examRecordApi.getById(recordId.value);
          if (res.code === 200) {
            const data = res.data;
            recordInfo.studentName = data.studentName;
            recordInfo.score = data.score || 0;
            recordInfo.submitTime = data.submitTime;
            recordInfo.duration = data.duration;
            recordInfo.status = data.status;
            if (data.answers) {
              try {
                studentAnswers.value = typeof data.answers === "string" ? JSON.parse(data.answers) : data.answers;
              } catch (e) {
                formatAppLog("error", "at pages/teacher/exam-record-detail.vue:317", "解析答案失败:", e);
              }
            }
          }
          const examRes = await examApi.getById(examId.value);
          if (examRes.code === 200) {
            Object.assign(examInfo, examRes.data);
            if (examRes.data.paperId) {
              const qRes = await paperApi.getQuestions(examRes.data.paperId);
              if (qRes.code === 200) {
                questions.value = qRes.data || [];
              }
            }
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-record-detail.vue:334", "加载失败:", e);
          uni.showToast({ title: "加载失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const loadSubjects = async () => {
        try {
          const res = await subjectApi.list();
          if (res.code === 200) {
            subjects.value = res.data;
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-record-detail.vue:348", "加载科目失败:", e);
        }
      };
      onLoad((options) => {
        recordId.value = options.recordId;
        examId.value = options.examId;
        loadSubjects();
        loadRecord();
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "exam-detail" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("view", {
              class: "back-btn",
              onClick: goBack
            }, [
              vue.createElementVNode("text", { class: "back-icon" }, "‹")
            ]),
            vue.createElementVNode("text", { class: "title" }, "答卷详情"),
            vue.createElementVNode("view", { class: "header-right" })
          ]),
          vue.createElementVNode("scroll-view", {
            class: "detail-body",
            "scroll-y": ""
          }, [
            vue.createElementVNode("view", { class: "exam-info-card" }, [
              vue.createElementVNode(
                "text",
                { class: "exam-title" },
                vue.toDisplayString(examInfo.title),
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "exam-meta" }, [
                vue.createElementVNode("view", { class: "meta-item" }, [
                  vue.createElementVNode("text", { class: "meta-icon" }, "📚"),
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString(getSubjectName(examInfo.subjectId)),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "meta-item" }, [
                  vue.createElementVNode("text", { class: "meta-icon" }, "⏱"),
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString(examInfo.duration) + "分钟",
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "meta-item" }, [
                  vue.createElementVNode("text", { class: "meta-icon" }, "🏆"),
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString(examInfo.totalScore) + "分",
                    1
                    /* TEXT */
                  )
                ])
              ])
            ]),
            vue.createElementVNode("view", { class: "student-info-card" }, [
              vue.createElementVNode("view", { class: "student-header" }, [
                vue.createElementVNode(
                  "text",
                  { class: "student-name" },
                  vue.toDisplayString(recordInfo.studentName),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["score-badge", recordInfo.score >= 60 ? "pass" : "fail"])
                  },
                  [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString(recordInfo.score || 0) + "分",
                      1
                      /* TEXT */
                    )
                  ],
                  2
                  /* CLASS */
                )
              ]),
              vue.createElementVNode("view", { class: "student-meta" }, [
                vue.createElementVNode("view", { class: "meta-item" }, [
                  vue.createElementVNode("text", { class: "meta-icon" }, "📅"),
                  vue.createElementVNode(
                    "text",
                    null,
                    "提交时间：" + vue.toDisplayString(formatDateTime(recordInfo.submitTime)),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "meta-item" }, [
                  vue.createElementVNode("text", { class: "meta-icon" }, "⏱"),
                  vue.createElementVNode(
                    "text",
                    null,
                    "用时：" + vue.toDisplayString(recordInfo.duration || 0) + "分钟",
                    1
                    /* TEXT */
                  )
                ]),
                recordInfo.status === "AUTO_SUBMITTED" ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "meta-item warning"
                }, [
                  vue.createElementVNode("text", { class: "meta-icon" }, "⚠️"),
                  vue.createElementVNode("text", null, "强制收卷")
                ])) : vue.createCommentVNode("v-if", true)
              ])
            ]),
            vue.unref(singleQuestions).length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "question-section"
            }, [
              vue.createElementVNode("view", { class: "section-header" }, [
                vue.createElementVNode("text", { class: "section-title" }, "一、单选题"),
                vue.createElementVNode(
                  "text",
                  { class: "section-score" },
                  "（共" + vue.toDisplayString(vue.unref(singleQuestions).length) + "题）",
                  1
                  /* TEXT */
                )
              ]),
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(vue.unref(singleQuestions), (q, index) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "question-item",
                    key: q.id
                  }, [
                    vue.createElementVNode("view", { class: "question-header" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "question-number" },
                        vue.toDisplayString(getQuestionNumber(q)) + ".",
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "question-score" },
                        "（" + vue.toDisplayString(q.score) + "分）",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "question-content" },
                      vue.toDisplayString(q.content),
                      1
                      /* TEXT */
                    ),
                    parseOptions(q.options).length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "options-list"
                    }, [
                      (vue.openBlock(true), vue.createElementBlock(
                        vue.Fragment,
                        null,
                        vue.renderList(parseOptions(q.options), (opt, idx) => {
                          return vue.openBlock(), vue.createElementBlock(
                            "view",
                            {
                              class: vue.normalizeClass(["option-item", getOptionClass(q, idx)]),
                              key: idx
                            },
                            [
                              vue.createElementVNode(
                                "text",
                                { class: "option-label" },
                                vue.toDisplayString(String.fromCharCode(65 + idx)) + ".",
                                1
                                /* TEXT */
                              ),
                              vue.createElementVNode(
                                "text",
                                { class: "option-text" },
                                vue.toDisplayString(opt),
                                1
                                /* TEXT */
                              ),
                              isCorrectOption(q, idx) ? (vue.openBlock(), vue.createElementBlock("text", {
                                key: 0,
                                class: "correct-mark"
                              }, "✓")) : vue.createCommentVNode("v-if", true),
                              isStudentAnswer(q, idx) && !isCorrectOption(q, idx) ? (vue.openBlock(), vue.createElementBlock("text", {
                                key: 1,
                                class: "wrong-mark"
                              }, "✗")) : vue.createCommentVNode("v-if", true)
                            ],
                            2
                            /* CLASS */
                          );
                        }),
                        128
                        /* KEYED_FRAGMENT */
                      ))
                    ])) : vue.createCommentVNode("v-if", true),
                    vue.createElementVNode("view", { class: "answer-row" }, [
                      vue.createElementVNode("text", { class: "answer-label" }, "学生答案："),
                      vue.createElementVNode(
                        "text",
                        {
                          class: vue.normalizeClass(["answer-text", isCorrectAnswer(q) ? "correct" : "wrong"])
                        },
                        vue.toDisplayString(getStudentAnswer(q) || "未作答"),
                        3
                        /* TEXT, CLASS */
                      ),
                      vue.createElementVNode("text", { class: "answer-label" }, "正确答案："),
                      vue.createElementVNode(
                        "text",
                        { class: "answer-text correct" },
                        vue.toDisplayString(q.correctAnswer),
                        1
                        /* TEXT */
                      )
                    ])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])) : vue.createCommentVNode("v-if", true),
            vue.unref(multiQuestions).length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "question-section"
            }, [
              vue.createElementVNode("view", { class: "section-header" }, [
                vue.createElementVNode("text", { class: "section-title" }, "二、多选题"),
                vue.createElementVNode(
                  "text",
                  { class: "section-score" },
                  "（共" + vue.toDisplayString(vue.unref(multiQuestions).length) + "题）",
                  1
                  /* TEXT */
                )
              ]),
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(vue.unref(multiQuestions), (q, index) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "question-item",
                    key: q.id
                  }, [
                    vue.createElementVNode("view", { class: "question-header" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "question-number" },
                        vue.toDisplayString(getQuestionNumber(q)) + ".",
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "question-score" },
                        "（" + vue.toDisplayString(q.score) + "分）",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "question-content" },
                      vue.toDisplayString(q.content),
                      1
                      /* TEXT */
                    ),
                    parseOptions(q.options).length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "options-list"
                    }, [
                      (vue.openBlock(true), vue.createElementBlock(
                        vue.Fragment,
                        null,
                        vue.renderList(parseOptions(q.options), (opt, idx) => {
                          return vue.openBlock(), vue.createElementBlock(
                            "view",
                            {
                              class: vue.normalizeClass(["option-item", getOptionClass(q, idx)]),
                              key: idx
                            },
                            [
                              vue.createElementVNode(
                                "text",
                                { class: "option-label" },
                                vue.toDisplayString(String.fromCharCode(65 + idx)) + ".",
                                1
                                /* TEXT */
                              ),
                              vue.createElementVNode(
                                "text",
                                { class: "option-text" },
                                vue.toDisplayString(opt),
                                1
                                /* TEXT */
                              ),
                              isCorrectOption(q, idx) ? (vue.openBlock(), vue.createElementBlock("text", {
                                key: 0,
                                class: "correct-mark"
                              }, "✓")) : vue.createCommentVNode("v-if", true),
                              isStudentAnswer(q, idx) && !isCorrectOption(q, idx) ? (vue.openBlock(), vue.createElementBlock("text", {
                                key: 1,
                                class: "wrong-mark"
                              }, "✗")) : vue.createCommentVNode("v-if", true)
                            ],
                            2
                            /* CLASS */
                          );
                        }),
                        128
                        /* KEYED_FRAGMENT */
                      ))
                    ])) : vue.createCommentVNode("v-if", true),
                    vue.createElementVNode("view", { class: "answer-row" }, [
                      vue.createElementVNode("text", { class: "answer-label" }, "学生答案："),
                      vue.createElementVNode(
                        "text",
                        {
                          class: vue.normalizeClass(["answer-text", isCorrectAnswer(q) ? "correct" : "wrong"])
                        },
                        vue.toDisplayString(getStudentAnswer(q) || "未作答"),
                        3
                        /* TEXT, CLASS */
                      ),
                      vue.createElementVNode("text", { class: "answer-label" }, "正确答案："),
                      vue.createElementVNode(
                        "text",
                        { class: "answer-text correct" },
                        vue.toDisplayString(q.correctAnswer),
                        1
                        /* TEXT */
                      )
                    ])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])) : vue.createCommentVNode("v-if", true),
            vue.unref(judgeQuestions).length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 2,
              class: "question-section"
            }, [
              vue.createElementVNode("view", { class: "section-header" }, [
                vue.createElementVNode("text", { class: "section-title" }, "三、判断题"),
                vue.createElementVNode(
                  "text",
                  { class: "section-score" },
                  "（共" + vue.toDisplayString(vue.unref(judgeQuestions).length) + "题）",
                  1
                  /* TEXT */
                )
              ]),
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(vue.unref(judgeQuestions), (q, index) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "question-item",
                    key: q.id
                  }, [
                    vue.createElementVNode("view", { class: "question-header" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "question-number" },
                        vue.toDisplayString(getQuestionNumber(q)) + ".",
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "question-score" },
                        "（" + vue.toDisplayString(q.score) + "分）",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "question-content" },
                      vue.toDisplayString(q.content),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("view", { class: "answer-row" }, [
                      vue.createElementVNode("text", { class: "answer-label" }, "学生答案："),
                      vue.createElementVNode(
                        "text",
                        {
                          class: vue.normalizeClass(["answer-text", isCorrectAnswer(q) ? "correct" : "wrong"])
                        },
                        vue.toDisplayString(getStudentAnswer(q) || "未作答"),
                        3
                        /* TEXT, CLASS */
                      ),
                      vue.createElementVNode("text", { class: "answer-label" }, "正确答案："),
                      vue.createElementVNode(
                        "text",
                        { class: "answer-text correct" },
                        vue.toDisplayString(q.correctAnswer === "A" || q.correctAnswer === "正确" ? "正确" : "错误"),
                        1
                        /* TEXT */
                      )
                    ])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])) : vue.createCommentVNode("v-if", true),
            vue.unref(fillQuestions).length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 3,
              class: "question-section"
            }, [
              vue.createElementVNode("view", { class: "section-header" }, [
                vue.createElementVNode("text", { class: "section-title" }, "四、填空题"),
                vue.createElementVNode(
                  "text",
                  { class: "section-score" },
                  "（共" + vue.toDisplayString(vue.unref(fillQuestions).length) + "题）",
                  1
                  /* TEXT */
                )
              ]),
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(vue.unref(fillQuestions), (q, index) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "question-item",
                    key: q.id
                  }, [
                    vue.createElementVNode("view", { class: "question-header" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "question-number" },
                        vue.toDisplayString(getQuestionNumber(q)) + ".",
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "question-score" },
                        "（" + vue.toDisplayString(q.score) + "分）",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "question-content" },
                      vue.toDisplayString(q.content),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("view", { class: "answer-row" }, [
                      vue.createElementVNode("text", { class: "answer-label" }, "学生答案："),
                      vue.createElementVNode(
                        "text",
                        {
                          class: vue.normalizeClass(["answer-text", isCorrectAnswer(q) ? "correct" : "wrong"])
                        },
                        vue.toDisplayString(getStudentAnswer(q) || "未作答"),
                        3
                        /* TEXT, CLASS */
                      ),
                      vue.createElementVNode("text", { class: "answer-label" }, "正确答案："),
                      vue.createElementVNode(
                        "text",
                        { class: "answer-text correct" },
                        vue.toDisplayString(q.correctAnswer),
                        1
                        /* TEXT */
                      )
                    ])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])) : vue.createCommentVNode("v-if", true),
            vue.unref(essayQuestions).length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 4,
              class: "question-section"
            }, [
              vue.createElementVNode("view", { class: "section-header" }, [
                vue.createElementVNode("text", { class: "section-title" }, "五、简答题"),
                vue.createElementVNode(
                  "text",
                  { class: "section-score" },
                  "（共" + vue.toDisplayString(vue.unref(essayQuestions).length) + "题）",
                  1
                  /* TEXT */
                )
              ]),
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(vue.unref(essayQuestions), (q, index) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "question-item",
                    key: q.id
                  }, [
                    vue.createElementVNode("view", { class: "question-header" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "question-number" },
                        vue.toDisplayString(getQuestionNumber(q)) + ".",
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "question-score" },
                        "（" + vue.toDisplayString(q.score) + "分）",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "question-content" },
                      vue.toDisplayString(q.content),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("view", { class: "answer-section" }, [
                      vue.createElementVNode("text", { class: "answer-label" }, "学生答案："),
                      vue.createElementVNode(
                        "text",
                        { class: "answer-text" },
                        vue.toDisplayString(getStudentAnswer(q) || "未作答"),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "answer-section" }, [
                      vue.createElementVNode("text", { class: "answer-label" }, "参考答案："),
                      vue.createElementVNode(
                        "text",
                        { class: "answer-text correct" },
                        vue.toDisplayString(q.correctAnswer),
                        1
                        /* TEXT */
                      )
                    ])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])) : vue.createCommentVNode("v-if", true)
          ])
        ]);
      };
    }
  };
  const PagesTeacherExamRecordDetail = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["__scopeId", "data-v-798daac6"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/teacher/exam-record-detail.vue"]]);
  const _sfc_main$8 = {
    __name: "exam-grade",
    setup(__props) {
      const recordId = vue.ref("");
      const examId = vue.ref("");
      const examInfo = vue.reactive({
        title: "",
        subjectId: "",
        duration: 0,
        totalScore: 0
      });
      const recordInfo = vue.reactive({
        studentName: "",
        score: 0,
        submitTime: "",
        duration: 0,
        status: ""
      });
      vue.ref([]);
      const questions = vue.ref([]);
      const studentAnswers = vue.ref({});
      const grades = vue.reactive({});
      const goBack = () => {
        uni.navigateBack();
      };
      const getTypeText = (type) => {
        return {
          SINGLE_CHOICE: "单选题",
          MULTIPLE_CHOICE: "多选题",
          JUDGMENT: "判断题",
          FILL_BLANK: "填空题",
          ESSAY: "简答题"
        }[type] || type;
      };
      const isSubjective = (type) => {
        return type === "FILL_BLANK" || type === "ESSAY";
      };
      const parseOptions = (options) => {
        if (!options)
          return [];
        if (Array.isArray(options)) {
          return options.map((opt) => {
            if (typeof opt === "object") {
              return opt.text || opt.content || JSON.stringify(opt);
            }
            return String(opt);
          });
        }
        if (typeof options === "string") {
          try {
            const parsed = JSON.parse(options);
            if (Array.isArray(parsed)) {
              return parsed.map((opt) => {
                if (typeof opt === "object") {
                  return opt.text || opt.content || JSON.stringify(opt);
                }
                return String(opt);
              });
            }
          } catch (e) {
            return options.split("|").filter((o) => o.trim());
          }
        }
        return [];
      };
      const formatAnswer = (q) => {
        const answer = q.answer || q.correctAnswer;
        if (!answer)
          return "";
        if (q.type === "JUDGMENT") {
          return answer === "A" || answer === "正确" ? "正确" : "错误";
        }
        return answer;
      };
      const getStudentAnswer = (q) => {
        return studentAnswers.value[q.id];
      };
      const isCorrectAnswer = (q) => {
        const studentAnswer = studentAnswers.value[q.id];
        if (!studentAnswer)
          return false;
        return studentAnswer === q.correctAnswer;
      };
      const isCorrectOption = (q, idx) => {
        if (!q.correctAnswer)
          return false;
        const optionLetter = String.fromCharCode(65 + idx);
        return q.correctAnswer.includes(optionLetter);
      };
      const isStudentAnswer = (q, idx) => {
        const studentAnswer = studentAnswers.value[q.id];
        if (!studentAnswer)
          return false;
        const optionLetter = String.fromCharCode(65 + idx);
        return studentAnswer.includes(optionLetter);
      };
      const getOptionClass = (q, idx) => {
        const classes = [];
        if (isCorrectOption(q, idx)) {
          classes.push("correct");
        }
        if (isStudentAnswer(q, idx)) {
          if (isCorrectOption(q, idx)) {
            classes.push("selected");
          } else {
            classes.push("selected wrong");
          }
        }
        return classes.join(" ");
      };
      const loadRecord = async () => {
        try {
          uni.showLoading({ title: "加载中..." });
          const res = await examRecordApi.getById(recordId.value);
          if (res.code === 200) {
            const data = res.data;
            recordInfo.studentName = data.studentName;
            recordInfo.score = data.score || 0;
            recordInfo.submitTime = data.submitTime;
            recordInfo.duration = data.duration;
            recordInfo.status = data.status;
            if (data.answers) {
              try {
                studentAnswers.value = typeof data.answers === "string" ? JSON.parse(data.answers) : data.answers;
              } catch (e) {
                formatAppLog("error", "at pages/teacher/exam-grade.vue:211", "解析答案失败:", e);
              }
            }
            if (data.exam) {
              Object.assign(examInfo, data.exam);
              if (data.questions) {
                questions.value = data.questions || [];
                questions.value.forEach((q) => {
                  if (isSubjective(q.type)) {
                    grades[q.id] = "";
                  }
                });
              }
            }
          }
          if (!examInfo.title) {
            const examRes = await examApi.getById(examId.value);
            if (examRes.code === 200) {
              Object.assign(examInfo, examRes.data);
              if (examRes.data.paperId && questions.value.length === 0) {
                const qRes = await paperApi.getQuestions(examRes.data.paperId);
                if (qRes.code === 200) {
                  questions.value = qRes.data || [];
                  questions.value.forEach((q) => {
                    if (isSubjective(q.type)) {
                      grades[q.id] = "";
                    }
                  });
                }
              }
            }
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-grade.vue:248", "加载失败:", e);
          uni.showToast({ title: "加载失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      const submitGrade = async () => {
        try {
          uni.showLoading({ title: "评分中..." });
          const gradeData = {};
          let hasGrade = false;
          questions.value.forEach((q) => {
            if (isSubjective(q.type) && grades[q.id] !== "") {
              const score = parseInt(grades[q.id]);
              if (!isNaN(score) && score >= 0 && score <= q.score) {
                gradeData[q.id] = score;
                hasGrade = true;
              }
            }
          });
          if (!hasGrade) {
            uni.showToast({ title: "请至少给一道题评分", icon: "none" });
            return;
          }
          const res = await examRecordApi.grade(recordId.value, { grades: gradeData });
          if (res.code === 200) {
            uni.showToast({ title: "评分成功", icon: "success" });
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          } else {
            uni.showToast({ title: res.message || "评分失败", icon: "none" });
          }
        } catch (e) {
          formatAppLog("error", "at pages/teacher/exam-grade.vue:287", "评分失败:", e);
          uni.showToast({ title: "评分失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
      };
      onLoad((options) => {
        recordId.value = options.recordId;
        examId.value = options.examId;
        loadRecord();
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "exam-grade" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("view", {
              class: "back-btn",
              onClick: goBack
            }, [
              vue.createElementVNode("text", { class: "back-icon" }, "‹")
            ]),
            vue.createElementVNode("text", { class: "title" }, "评分"),
            vue.createElementVNode("view", { class: "header-right" })
          ]),
          vue.createElementVNode("scroll-view", {
            class: "grade-body",
            "scroll-y": ""
          }, [
            vue.createElementVNode("view", { class: "info-card" }, [
              vue.createElementVNode(
                "text",
                { class: "exam-title" },
                vue.toDisplayString(examInfo.title),
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "student-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "student-name" },
                  vue.toDisplayString(recordInfo.studentName),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "current-score" },
                  "当前得分：" + vue.toDisplayString(recordInfo.score || 0) + " / " + vue.toDisplayString(examInfo.totalScore) + "分",
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createElementVNode("view", { class: "question-list" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(questions.value, (q, index) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "question-item",
                    key: q.id
                  }, [
                    vue.createElementVNode("view", { class: "question-header" }, [
                      vue.createElementVNode("view", { class: "question-type" }, [
                        vue.createElementVNode(
                          "text",
                          null,
                          vue.toDisplayString(getTypeText(q.type)),
                          1
                          /* TEXT */
                        )
                      ]),
                      vue.createElementVNode("view", { class: "question-score" }, [
                        vue.createElementVNode(
                          "text",
                          null,
                          vue.toDisplayString(q.score) + "分",
                          1
                          /* TEXT */
                        )
                      ]),
                      vue.createElementVNode(
                        "text",
                        { class: "question-number" },
                        "第" + vue.toDisplayString(index + 1) + "题",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "question-content" },
                      vue.toDisplayString(q.content),
                      1
                      /* TEXT */
                    ),
                    q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE" ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "options-list"
                    }, [
                      (vue.openBlock(true), vue.createElementBlock(
                        vue.Fragment,
                        null,
                        vue.renderList(parseOptions(q.options), (opt, idx) => {
                          return vue.openBlock(), vue.createElementBlock(
                            "view",
                            {
                              class: vue.normalizeClass(["option-item", getOptionClass(q, idx)]),
                              key: idx
                            },
                            [
                              vue.createElementVNode(
                                "text",
                                { class: "option-label" },
                                vue.toDisplayString(String.fromCharCode(65 + idx)) + ".",
                                1
                                /* TEXT */
                              ),
                              vue.createElementVNode(
                                "text",
                                { class: "option-text" },
                                vue.toDisplayString(opt),
                                1
                                /* TEXT */
                              ),
                              isCorrectOption(q, idx) ? (vue.openBlock(), vue.createElementBlock("text", {
                                key: 0,
                                class: "correct-mark"
                              }, "✓")) : vue.createCommentVNode("v-if", true),
                              isStudentAnswer(q, idx) && !isCorrectOption(q, idx) ? (vue.openBlock(), vue.createElementBlock("text", {
                                key: 1,
                                class: "wrong-mark"
                              }, "✗")) : vue.createCommentVNode("v-if", true)
                            ],
                            2
                            /* CLASS */
                          );
                        }),
                        128
                        /* KEYED_FRAGMENT */
                      ))
                    ])) : vue.createCommentVNode("v-if", true),
                    vue.createElementVNode("view", { class: "answer-section" }, [
                      vue.createElementVNode("view", { class: "answer-row" }, [
                        vue.createElementVNode("text", { class: "answer-label" }, "学生答案："),
                        vue.createElementVNode(
                          "text",
                          {
                            class: vue.normalizeClass(["answer-text", isCorrectAnswer(q) ? "correct" : "wrong"])
                          },
                          vue.toDisplayString(getStudentAnswer(q) || "未作答"),
                          3
                          /* TEXT, CLASS */
                        )
                      ]),
                      vue.createElementVNode("view", { class: "answer-row" }, [
                        vue.createElementVNode("text", { class: "answer-label" }, "正确答案："),
                        vue.createElementVNode(
                          "text",
                          { class: "answer-text correct" },
                          vue.toDisplayString(formatAnswer(q)),
                          1
                          /* TEXT */
                        )
                      ])
                    ]),
                    isSubjective(q.type) ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 1,
                      class: "grade-section"
                    }, [
                      vue.createElementVNode(
                        "text",
                        { class: "grade-label" },
                        "评分（0-" + vue.toDisplayString(q.score) + "分）",
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode("view", { class: "grade-input-row" }, [
                        vue.withDirectives(vue.createElementVNode("input", {
                          class: "grade-input",
                          type: "number",
                          "onUpdate:modelValue": ($event) => grades[q.id] = $event,
                          max: q.score,
                          placeholder: "0"
                        }, null, 8, ["onUpdate:modelValue", "max"]), [
                          [vue.vModelText, grades[q.id]]
                        ]),
                        vue.createElementVNode("text", { class: "grade-unit" }, "分")
                      ])
                    ])) : vue.createCommentVNode("v-if", true)
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ]),
          vue.createElementVNode("view", { class: "grade-footer" }, [
            vue.createElementVNode("button", {
              class: "submit-btn",
              onClick: submitGrade
            }, "提交评分")
          ])
        ]);
      };
    }
  };
  const PagesTeacherExamGrade = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__scopeId", "data-v-87f028a1"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/teacher/exam-grade.vue"]]);
  const _sfc_main$7 = {
    __name: "my-classes",
    setup(__props) {
      const userStore = useUserStore();
      const inviteCode = vue.ref("");
      const classList = vue.ref([]);
      const getRoleText = (role) => {
        return {
          CREATOR: "创建者",
          TEACHER: "教师",
          STUDENT: "学生"
        }[role] || role;
      };
      const handleJoin = async () => {
        var _a;
        if (!inviteCode.value.trim()) {
          uni.showToast({
            title: "请输入班级群号",
            icon: "none"
          });
          return;
        }
        try {
          const userId = (_a = userStore.userInfo) == null ? void 0 : _a.userId;
          if (!userId) {
            uni.showToast({
              title: "请先登录",
              icon: "none"
            });
            return;
          }
          const res = await classApi.joinByCode(inviteCode.value, userId);
          if (res.code === 200) {
            uni.showToast({
              title: "加入班级成功",
              icon: "success"
            });
            inviteCode.value = "";
            loadClasses();
          } else {
            uni.showToast({
              title: res.message || "加入班级失败",
              icon: "none"
            });
          }
        } catch (e) {
          formatAppLog("error", "at pages/student/my-classes.vue:105", e);
          uni.showToast({
            title: "网络错误",
            icon: "none"
          });
        }
      };
      const enterClass = (classId) => {
        uni.navigateTo({
          url: `/pages/student/class-chat?id=${classId}`
        });
      };
      const loadClasses = async () => {
        var _a;
        try {
          const userId = ((_a = userStore.userInfo) == null ? void 0 : _a.userId) || uni.getStorageSync("userId");
          formatAppLog("log", "at pages/student/my-classes.vue:122", "loadClasses userId:", userId);
          if (!userId) {
            formatAppLog("log", "at pages/student/my-classes.vue:124", "userId为空");
            return;
          }
          formatAppLog("log", "at pages/student/my-classes.vue:128", "调用classApi.getMyClasses:", userId);
          const res = await classApi.getMyClasses(userId);
          formatAppLog("log", "at pages/student/my-classes.vue:130", "getMyClasses返回:", JSON.stringify(res));
          if (res.code === 200) {
            classList.value = res.data;
            formatAppLog("log", "at pages/student/my-classes.vue:133", "classList:", JSON.stringify(classList.value));
          } else {
            formatAppLog("log", "at pages/student/my-classes.vue:135", "接口返回错误:", res.message);
          }
        } catch (e) {
          formatAppLog("error", "at pages/student/my-classes.vue:138", "加载班级失败:", e);
          uni.showToast({
            title: "加载班级列表失败",
            icon: "none"
          });
        }
      };
      const getLastMessage = (cls) => {
        if (!cls.lastMessage)
          return "暂无消息";
        if (cls.lastMessage.startsWith("EXAM_NOTICE|")) {
          return parseExamNotice(cls.lastMessage);
        }
        return cls.lastMessage;
      };
      const parseExamNotice = (content) => {
        if (!(content == null ? void 0 : content.startsWith("EXAM_NOTICE|")))
          return "";
        const parts = content.split("|");
        const noticeType = parts[1] || "";
        const title = parts[2] || "";
        if (noticeType === "START") {
          return "🚀 " + title + " 开始考试";
        } else if (noticeType === "PUBLISH") {
          return "📢 " + title + " 发布通知";
        } else if (noticeType === "END") {
          return "🔚 " + title + " 考试结束";
        }
        return "📝 " + title;
      };
      const formatMessageTime = (time) => {
        if (!time)
          return "";
        const date = new Date(time);
        const now2 = /* @__PURE__ */ new Date();
        const diff = now2 - date;
        if (diff < 6e4)
          return "刚刚";
        if (diff < 36e5)
          return Math.floor(diff / 6e4) + "分钟前";
        if (diff < 864e5)
          return Math.floor(diff / 36e5) + "小时前";
        return date.toLocaleDateString("zh-CN");
      };
      vue.onMounted(() => {
        loadClasses();
      });
      return (_ctx, _cache) => {
        const _component_uni_icons = vue.resolveComponent("uni-icons");
        return vue.openBlock(), vue.createElementBlock("view", { class: "my-classes" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("text", { class: "title" }, "班级消息"),
            vue.createElementVNode("text", { class: "subtitle" }, "查看班级最新动态")
          ]),
          vue.createCommentVNode(" 加入班级 "),
          vue.createElementVNode("view", { class: "join-card" }, [
            vue.createElementVNode("view", { class: "join-form" }, [
              vue.createElementVNode("view", { class: "join-input" }, [
                vue.createVNode(_component_uni_icons, {
                  type: "personadd",
                  size: "20",
                  color: "#999"
                }),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    type: "text",
                    "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => inviteCode.value = $event),
                    placeholder: "请输入班级群号",
                    onConfirm: handleJoin
                  },
                  null,
                  544
                  /* HYDRATE_EVENTS, NEED_PATCH */
                ), [
                  [vue.vModelText, inviteCode.value]
                ])
              ]),
              vue.createElementVNode("button", {
                class: "join-btn",
                onClick: handleJoin
              }, "加入班级")
            ])
          ]),
          vue.createCommentVNode(" 班级消息列表 "),
          classList.value.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "class-message-list"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(classList.value, (item) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "class-message-card",
                  key: item.class.id,
                  onClick: ($event) => enterClass(item.class.id)
                }, [
                  vue.createElementVNode("view", { class: "class-message-icon" }, [
                    vue.createElementVNode("text", { class: "icon-emoji" }, "🏫")
                  ]),
                  vue.createElementVNode("view", { class: "class-message-info" }, [
                    vue.createElementVNode("view", { class: "class-message-header" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "class-message-name" },
                        vue.toDisplayString(item.class.className),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "class-message-time" },
                        vue.toDisplayString(formatMessageTime(item.class.lastMessageTime)),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "class-message-content" },
                      vue.toDisplayString(getLastMessage(item.class)),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("view", { class: "class-message-meta" }, [
                      vue.createElementVNode(
                        "text",
                        null,
                        "群号：" + vue.toDisplayString(item.class.inviteCode),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        null,
                        "角色：" + vue.toDisplayString(getRoleText(item.role)),
                        1
                        /* TEXT */
                      )
                    ])
                  ]),
                  vue.createElementVNode("view", { class: "class-message-arrow" }, [
                    vue.createElementVNode("text", { class: "arrow-icon" }, "›")
                  ])
                ], 8, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])) : vue.createCommentVNode("v-if", true),
          classList.value.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "empty"
          }, [
            vue.createVNode(_component_uni_icons, {
              type: "info",
              size: "80",
              color: "#999"
            }),
            vue.createElementVNode("text", { class: "empty-text" }, "暂无班级，输入群号加入班级吧")
          ])) : vue.createCommentVNode("v-if", true)
        ]);
      };
    }
  };
  const PagesStudentMyClasses = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-c97905fd"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/student/my-classes.vue"]]);
  const _sfc_main$6 = {
    __name: "class-chat",
    setup(__props) {
      const userStore = useUserStore();
      const classId = vue.ref("");
      const className = vue.ref("");
      const memberCount = vue.ref(0);
      const messages = vue.ref([]);
      const members = vue.ref([]);
      const inputMessage = vue.ref("");
      const showMembers = vue.ref(false);
      const isMuted = vue.ref(false);
      const scrollTop = vue.ref(0);
      const iconRocket = "🚀";
      const iconBell = "🔔";
      const iconCalendar = "📅";
      const iconEnd = "🔚";
      const iconTimer = "⏱";
      const getRoleText = (role) => {
        return {
          CREATOR: "创建者",
          TEACHER: "教师",
          STUDENT: "学生"
        }[role] || role;
      };
      const isSelfMessage = (senderId) => {
        var _a;
        const userId = (_a = userStore.userInfo) == null ? void 0 : _a.userId;
        return String(senderId) === String(userId);
      };
      const getSenderName = (senderId) => {
        const member = members.value.find((m) => String(m.userId) === String(senderId));
        return (member == null ? void 0 : member.realName) || "未知用户";
      };
      const getSenderAvatar = (senderId) => {
        const member = members.value.find((m) => String(m.userId) === String(senderId));
        return (member == null ? void 0 : member.avatar) || "/static/default-avatar.png";
      };
      const isExamNotice = (msg) => {
        var _a;
        return (_a = msg.content) == null ? void 0 : _a.startsWith("EXAM_NOTICE|");
      };
      const sendMessage = async () => {
        var _a;
        if (!inputMessage.value.trim() || isMuted.value)
          return;
        try {
          const userId = (_a = userStore.userInfo) == null ? void 0 : _a.userId;
          const res = await classApi.sendMessage(classId.value, inputMessage.value, userId);
          if (res.code === 200) {
            inputMessage.value = "";
            loadMessages();
          } else {
            uni.showToast({
              title: res.message || "发送失败",
              icon: "none"
            });
          }
        } catch (e) {
          formatAppLog("error", "at pages/student/class-chat.vue:176", e);
          uni.showToast({
            title: "网络错误",
            icon: "none"
          });
        }
      };
      const parseExamNotice = (content) => {
        if (!(content == null ? void 0 : content.startsWith("EXAM_NOTICE|")))
          return null;
        const parts = content.split("|");
        return {
          noticeType: parts[1],
          title: parts[2],
          startTime: parts[3],
          endTime: parts[4],
          duration: parts[5],
          examId: parts[6]
        };
      };
      const getNoticeIcon = (content) => {
        const notice = parseExamNotice(content);
        return (notice == null ? void 0 : notice.noticeType) === "START" ? iconRocket : iconBell;
      };
      const getNoticeBadge = (content) => {
        const notice = parseExamNotice(content);
        return (notice == null ? void 0 : notice.noticeType) === "START" ? "进行中" : "待开始";
      };
      const getNoticeBtnText = (content) => {
        const notice = parseExamNotice(content);
        return (notice == null ? void 0 : notice.noticeType) === "START" ? "进入考试" : "查看考试";
      };
      const getNoticeTitle = (content) => {
        const notice = parseExamNotice(content);
        return notice ? notice.title : "";
      };
      const getNoticeStartTime = (content) => {
        const notice = parseExamNotice(content);
        return notice ? notice.startTime : "";
      };
      const getNoticeEndTime = (content) => {
        const notice = parseExamNotice(content);
        return notice ? notice.endTime : "";
      };
      const getNoticeDuration = (content) => {
        const notice = parseExamNotice(content);
        return notice ? notice.duration : "";
      };
      const formatTime = (time) => {
        if (!time)
          return "";
        const date = new Date(time);
        const now2 = /* @__PURE__ */ new Date();
        const diff = now2 - date;
        if (diff < 6e4)
          return "刚刚";
        if (diff < 36e5)
          return Math.floor(diff / 6e4) + "分钟前";
        if (diff < 864e5)
          return Math.floor(diff / 36e5) + "小时前";
        return date.toLocaleDateString("zh-CN");
      };
      const goBack = () => {
        uni.navigateBack();
      };
      const goToExamDetail = (msg) => {
        const examNotice = parseExamNotice(msg.content);
        if (examNotice && examNotice.examId) {
          uni.navigateTo({
            url: `/pages/student/exam-take?id=${examNotice.examId}`
          });
        }
      };
      const loadMessages = async () => {
        try {
          const res = await classApi.getMessages(classId.value, 1, 50);
          if (res.code === 200) {
            const records = res.data.records || res.data;
            messages.value = records.reverse();
            vue.nextTick(() => {
              scrollTop.value = 999999;
            });
          }
        } catch (e) {
          formatAppLog("error", "at pages/student/class-chat.vue:267", e);
        }
      };
      const loadMoreMessages = () => {
      };
      const loadMembers = async () => {
        var _a;
        try {
          const res = await classApi.getClassMembers(classId.value);
          if (res.code === 200) {
            members.value = res.data;
            memberCount.value = res.data.length;
            const userId = (_a = userStore.userInfo) == null ? void 0 : _a.userId;
            const currentMember = res.data.find((m) => String(m.userId) === String(userId));
            if (currentMember && currentMember.muteUntil) {
              isMuted.value = true;
            }
          }
        } catch (e) {
          formatAppLog("error", "at pages/student/class-chat.vue:289", e);
        }
      };
      const loadClassInfo = async () => {
        try {
          const res = await classApi.getById(classId.value);
          if (res.code === 200) {
            className.value = res.data.className;
          }
        } catch (e) {
          formatAppLog("error", "at pages/student/class-chat.vue:300", e);
        }
      };
      onLoad((options) => {
        classId.value = options.id;
        loadClassInfo();
        loadMessages();
        loadMembers();
      });
      return (_ctx, _cache) => {
        const _component_uni_icons = vue.resolveComponent("uni-icons");
        return vue.openBlock(), vue.createElementBlock("view", { class: "class-chat" }, [
          vue.createElementVNode("view", { class: "chat-header" }, [
            vue.createElementVNode("view", { class: "header-left" }, [
              vue.createElementVNode("view", {
                class: "back-btn",
                onClick: goBack
              }, [
                vue.createVNode(_component_uni_icons, {
                  type: "back",
                  size: "20",
                  color: "#333"
                })
              ]),
              vue.createElementVNode("view", { class: "header-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "class-name" },
                  vue.toDisplayString(className.value),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "member-count" },
                  vue.toDisplayString(memberCount.value) + " 名成员",
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createElementVNode("view", { class: "header-right" }, [
              vue.createElementVNode("view", {
                class: "member-btn",
                onClick: _cache[0] || (_cache[0] = ($event) => showMembers.value = true)
              }, [
                vue.createVNode(_component_uni_icons, {
                  type: "person",
                  size: "20",
                  color: "#666"
                })
              ])
            ])
          ]),
          vue.createElementVNode("scroll-view", {
            class: "chat-body",
            "scroll-y": "",
            "scroll-top": scrollTop.value,
            onScrolltoupper: loadMoreMessages
          }, [
            vue.createElementVNode("view", { class: "message-list" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(messages.value, (msg) => {
                  return vue.openBlock(), vue.createElementBlock(
                    "view",
                    {
                      key: msg.id,
                      class: vue.normalizeClass(["message-item", { "is-self": isSelfMessage(msg.senderId) }])
                    },
                    [
                      vue.createElementVNode("view", { class: "message-avatar" }, [
                        vue.createElementVNode("image", {
                          src: getSenderAvatar(msg.senderId),
                          mode: "aspectFill"
                        }, null, 8, ["src"])
                      ]),
                      vue.createElementVNode("view", { class: "message-content-wrapper" }, [
                        vue.createElementVNode(
                          "text",
                          { class: "message-sender" },
                          vue.toDisplayString(getSenderName(msg.senderId)),
                          1
                          /* TEXT */
                        ),
                        !isExamNotice(msg) ? (vue.openBlock(), vue.createElementBlock("view", {
                          key: 0,
                          class: "message-bubble"
                        }, [
                          vue.createElementVNode(
                            "text",
                            { class: "message-text" },
                            vue.toDisplayString(msg.content),
                            1
                            /* TEXT */
                          )
                        ])) : (vue.openBlock(), vue.createElementBlock("view", {
                          key: 1,
                          class: "exam-notice"
                        }, [
                          vue.createElementVNode("view", { class: "notice-header" }, [
                            vue.createElementVNode(
                              "text",
                              { class: "notice-icon" },
                              vue.toDisplayString(getNoticeIcon(msg.content)),
                              1
                              /* TEXT */
                            ),
                            vue.createElementVNode(
                              "text",
                              { class: "notice-title" },
                              vue.toDisplayString(getNoticeTitle(msg.content)),
                              1
                              /* TEXT */
                            ),
                            vue.createElementVNode("view", { class: "notice-badge" }, [
                              vue.createElementVNode(
                                "text",
                                null,
                                vue.toDisplayString(getNoticeBadge(msg.content)),
                                1
                                /* TEXT */
                              )
                            ])
                          ]),
                          vue.createElementVNode("view", { class: "notice-info" }, [
                            vue.createElementVNode("view", { class: "info-item" }, [
                              vue.createElementVNode("text", { class: "info-icon" }, vue.toDisplayString(iconCalendar)),
                              vue.createElementVNode(
                                "text",
                                null,
                                vue.toDisplayString(getNoticeStartTime(msg.content)),
                                1
                                /* TEXT */
                              )
                            ]),
                            vue.createElementVNode("view", { class: "info-item" }, [
                              vue.createElementVNode("text", { class: "info-icon" }, vue.toDisplayString(iconEnd)),
                              vue.createElementVNode(
                                "text",
                                null,
                                vue.toDisplayString(getNoticeEndTime(msg.content)),
                                1
                                /* TEXT */
                              )
                            ]),
                            vue.createElementVNode("view", { class: "info-item" }, [
                              vue.createElementVNode("text", { class: "info-icon" }, vue.toDisplayString(iconTimer)),
                              vue.createElementVNode(
                                "text",
                                null,
                                vue.toDisplayString(getNoticeDuration(msg.content)) + "分钟",
                                1
                                /* TEXT */
                              )
                            ])
                          ]),
                          vue.createElementVNode("button", {
                            class: "notice-btn",
                            onClick: ($event) => goToExamDetail(msg)
                          }, vue.toDisplayString(getNoticeBtnText(msg.content)), 9, ["onClick"])
                        ])),
                        vue.createElementVNode(
                          "text",
                          { class: "message-time" },
                          vue.toDisplayString(formatTime(msg.createTime)),
                          1
                          /* TEXT */
                        )
                      ])
                    ],
                    2
                    /* CLASS */
                  );
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ], 40, ["scroll-top"]),
          vue.createElementVNode("view", { class: "chat-input-wrapper" }, [
            vue.createElementVNode("view", { class: "chat-input" }, [
              vue.withDirectives(vue.createElementVNode("input", {
                "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => inputMessage.value = $event),
                placeholder: "输入消息...",
                disabled: isMuted.value,
                onConfirm: sendMessage
              }, null, 40, ["disabled"]), [
                [vue.vModelText, inputMessage.value]
              ]),
              vue.createElementVNode("button", {
                class: "send-btn",
                onClick: sendMessage,
                disabled: !inputMessage.value.trim() || isMuted.value
              }, "发送", 8, ["disabled"])
            ]),
            isMuted.value ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "muted-tip"
            }, [
              vue.createElementVNode("text", null, "您已被禁言")
            ])) : vue.createCommentVNode("v-if", true)
          ]),
          vue.createCommentVNode(" 成员列表弹窗 "),
          showMembers.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "modal",
            onClick: _cache[4] || (_cache[4] = ($event) => showMembers.value = false)
          }, [
            vue.createElementVNode("view", {
              class: "modal-content",
              onClick: _cache[3] || (_cache[3] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("view", { class: "modal-header" }, [
                vue.createElementVNode("text", { class: "modal-title" }, "班级成员"),
                vue.createElementVNode("view", {
                  class: "modal-close",
                  onClick: _cache[2] || (_cache[2] = ($event) => showMembers.value = false)
                }, [
                  vue.createVNode(_component_uni_icons, {
                    type: "close",
                    size: "24",
                    color: "#333"
                  })
                ])
              ]),
              vue.createElementVNode("scroll-view", {
                class: "members-list",
                "scroll-y": ""
              }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(members.value, (member) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      class: "member-item",
                      key: member.userId
                    }, [
                      vue.createElementVNode("view", { class: "member-info" }, [
                        vue.createElementVNode(
                          "text",
                          { class: "member-name" },
                          vue.toDisplayString(member.realName),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode(
                          "view",
                          {
                            class: vue.normalizeClass(["member-role", "role-" + member.role.toLowerCase()])
                          },
                          [
                            vue.createElementVNode(
                              "text",
                              null,
                              vue.toDisplayString(getRoleText(member.role)),
                              1
                              /* TEXT */
                            )
                          ],
                          2
                          /* CLASS */
                        )
                      ]),
                      member.muteUntil ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 0,
                        class: "mute-status"
                      }, [
                        vue.createElementVNode("text", null, "已禁言")
                      ])) : vue.createCommentVNode("v-if", true)
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true)
        ]);
      };
    }
  };
  const PagesStudentClassChat = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-f2165426"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/student/class-chat.vue"]]);
  const _sfc_main$5 = {
    __name: "exam-list",
    setup(__props) {
      useUserStore();
      const tableData = vue.ref([]);
      const searchForm = vue.ref({
        keyword: "",
        status: ""
      });
      const statusOptions = [
        { label: "全部", value: "" },
        { label: "待开始", value: "PENDING" },
        { label: "进行中", value: "ONGOING" },
        { label: "已结束", value: "FINISHED" }
      ];
      const currentStatusText = vue.computed(() => {
        const option = statusOptions.find((o) => o.value === searchForm.value.status);
        return option ? option.label : "全部";
      });
      const loadStatus = vue.ref("more");
      const formatTime = (time) => {
        if (!time)
          return "";
        const date = new Date(time);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day} ${hour}:${minute}`;
      };
      const getStatusClass = (item) => {
        if (item.studentStatus === "AUTO_SUBMITTED")
          return "danger";
        if (item.studentStatus === "SUBMITTED")
          return "success";
        if (item.exam.status === "ONGOING")
          return "warning";
        return "info";
      };
      const getExamStatusText = (item) => {
        if (item.studentStatus === "AUTO_SUBMITTED")
          return "强制收卷";
        if (item.studentStatus === "SUBMITTED")
          return "已完成";
        if (item.exam.status === "ONGOING")
          return "进行中";
        return "即将开始";
      };
      const canJoin = (item) => {
        return item.exam.status === "ONGOING" && item.studentStatus !== "SUBMITTED" && item.studentStatus !== "AUTO_SUBMITTED";
      };
      const canView = (item) => {
        return item.studentStatus === "SUBMITTED" || item.studentStatus === "AUTO_SUBMITTED";
      };
      const getButtonText = (item) => {
        if (item.studentStatus === "SUBMITTED" || item.studentStatus === "AUTO_SUBMITTED") {
          return "查看详情";
        }
        if (item.exam.status === "ONGOING")
          return "进入考试";
        return "等待开始";
      };
      const getButtonClass = (item) => {
        if (item.studentStatus === "SUBMITTED" || item.studentStatus === "AUTO_SUBMITTED") {
          return "btn-success";
        }
        if (item.exam.status === "ONGOING")
          return "btn-danger";
        return "btn-disabled";
      };
      const onStatusChange = (e) => {
        const index = e.detail.value;
        searchForm.value.status = statusOptions[index].value;
        handleSearch();
      };
      const handleJoin = (exam) => {
        uni.navigateTo({
          url: `/pages/student/exam-take?id=${exam.id}`
        });
      };
      const handleSearch = () => {
        loadStatus.value = "more";
        loadData();
      };
      const loadData = async () => {
        if (loadStatus.value === "loading")
          return;
        loadStatus.value = "loading";
        try {
          const params = {
            current: 1,
            size: 20,
            keyword: searchForm.value.keyword,
            status: searchForm.value.status
          };
          const res = await examApi.studentPage(params);
          if (res.code === 200) {
            tableData.value = res.data.records;
            loadStatus.value = res.data.records.length >= 20 ? "more" : "noMore";
          } else {
            uni.showToast({
              title: res.message || "加载失败",
              icon: "none"
            });
            loadStatus.value = "more";
          }
        } catch (e) {
          formatAppLog("error", "at pages/student/exam-list.vue:194", e);
          uni.showToast({
            title: "网络错误",
            icon: "none"
          });
          loadStatus.value = "more";
        }
      };
      vue.onMounted(() => {
        loadData();
      });
      return (_ctx, _cache) => {
        const _component_uni_icons = vue.resolveComponent("uni-icons");
        const _component_uni_load_more = vue.resolveComponent("uni-load-more");
        return vue.openBlock(), vue.createElementBlock("view", { class: "exam-list" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("text", { class: "title" }, "考试列表"),
            vue.createElementVNode("text", { class: "subtitle" }, "查看并参加待进行的考试")
          ]),
          vue.createCommentVNode(" 搜索和筛选区域 "),
          vue.createElementVNode("view", { class: "search-bar" }, [
            vue.createElementVNode("view", { class: "search-input" }, [
              vue.createVNode(_component_uni_icons, {
                type: "search",
                size: "18",
                color: "#999"
              }),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  type: "text",
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => searchForm.value.keyword = $event),
                  placeholder: "搜索考试名称",
                  onConfirm: handleSearch
                },
                null,
                544
                /* HYDRATE_EVENTS, NEED_PATCH */
              ), [
                [vue.vModelText, searchForm.value.keyword]
              ])
            ]),
            vue.createElementVNode("view", { class: "filter-row" }, [
              vue.createElementVNode(
                "picker",
                {
                  mode: "selector",
                  range: statusOptions,
                  "range-key": "label",
                  onChange: onStatusChange
                },
                [
                  vue.createElementVNode("view", { class: "picker" }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString(vue.unref(currentStatusText)),
                      1
                      /* TEXT */
                    ),
                    vue.createVNode(_component_uni_icons, {
                      type: "bottom",
                      size: "14",
                      color: "#666"
                    })
                  ])
                ],
                32
                /* HYDRATE_EVENTS */
              ),
              vue.createElementVNode("button", {
                class: "search-btn",
                onClick: handleSearch
              }, "搜索")
            ])
          ]),
          vue.createCommentVNode(" 考试列表 "),
          vue.createElementVNode("view", { class: "exam-grid" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(tableData.value, (item) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "exam-card",
                  key: item.exam.id
                }, [
                  vue.createElementVNode("view", { class: "exam-header" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "exam-title" },
                      vue.toDisplayString(item.exam.title),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "view",
                      {
                        class: vue.normalizeClass(["exam-status", "status-" + getStatusClass(item)])
                      },
                      [
                        vue.createElementVNode(
                          "text",
                          null,
                          vue.toDisplayString(getExamStatusText(item)),
                          1
                          /* TEXT */
                        )
                      ],
                      2
                      /* CLASS */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "exam-info" }, [
                    vue.createElementVNode("view", { class: "info-item" }, [
                      vue.createVNode(_component_uni_icons, {
                        type: "clock",
                        size: "16",
                        color: "#666"
                      }),
                      vue.createElementVNode(
                        "text",
                        null,
                        vue.toDisplayString(item.exam.duration) + " 分钟",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "info-item" }, [
                      vue.createVNode(_component_uni_icons, {
                        type: "flag",
                        size: "16",
                        color: "#666"
                      }),
                      vue.createElementVNode(
                        "text",
                        null,
                        "总分 " + vue.toDisplayString(item.exam.totalScore),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "info-item" }, [
                      vue.createVNode(_component_uni_icons, {
                        type: "calendar",
                        size: "16",
                        color: "#666"
                      }),
                      vue.createElementVNode(
                        "text",
                        null,
                        vue.toDisplayString(formatTime(item.exam.startTime)),
                        1
                        /* TEXT */
                      )
                    ])
                  ]),
                  vue.createElementVNode("view", { class: "exam-actions" }, [
                    vue.createElementVNode("button", {
                      class: vue.normalizeClass(["join-btn", getButtonClass(item)]),
                      disabled: !canJoin(item) && !canView(item),
                      onClick: ($event) => handleJoin(item.exam)
                    }, [
                      vue.createElementVNode(
                        "text",
                        null,
                        vue.toDisplayString(getButtonText(item)),
                        1
                        /* TEXT */
                      )
                    ], 10, ["disabled", "onClick"])
                  ])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createVNode(_component_uni_load_more, { status: loadStatus.value }, null, 8, ["status"])
        ]);
      };
    }
  };
  const PagesStudentExamList = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-20bbf78e"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/student/exam-list.vue"]]);
  const _sfc_main$4 = {
    __name: "exam-take",
    setup(__props) {
      const examInfo = vue.ref(null);
      const questions = vue.ref([]);
      const recordId = vue.ref(null);
      const currentQuestionId = vue.ref(null);
      const answers = vue.reactive({});
      const multiAnswers = vue.reactive({});
      const submitting = vue.ref(false);
      const saving = vue.ref(false);
      const remainingTime = vue.ref(0);
      const leaveCount = vue.ref(0);
      const maxLeaveCount = vue.ref(3);
      const isViewMode = vue.ref(false);
      vue.ref(false);
      const answerMap = vue.ref({});
      const canViewPaper = vue.ref(false);
      const studentScore = vue.ref(0);
      const showNav = vue.ref(false);
      const examStartTime = vue.ref(0);
      const examDuration = vue.ref(0);
      let timer = null;
      let autoSaveTimer = null;
      const typeMap = {
        SINGLE_CHOICE: { name: "单选题", start: "一" },
        MULTIPLE_CHOICE: { name: "多选题", start: "二" },
        JUDGMENT: { name: "判断题", start: "三" },
        FILL_BLANK: { name: "填空题", start: "四" },
        ESSAY: { name: "简答题", start: "五" },
        PROGRAMMING: { name: "编程题", start: "六" }
      };
      const shuffledOptionsMap = vue.reactive({});
      const questionSections = vue.computed(() => {
        var _a, _b;
        const sections = [];
        const typeOrder = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "JUDGMENT", "FILL_BLANK", "ESSAY", "PROGRAMMING"];
        let globalIndex = 0;
        for (const type of typeOrder) {
          const typeQuestions = questions.value.filter((q) => q.type === type);
          if (typeQuestions.length > 0) {
            sections.push({
              type,
              typeName: ((_a = typeMap[type]) == null ? void 0 : _a.name) || type,
              startName: ((_b = typeMap[type]) == null ? void 0 : _b.start) || "",
              questions: typeQuestions,
              startIndex: globalIndex
            });
            globalIndex += typeQuestions.length;
          }
        }
        return sections;
      });
      const totalQuestions = vue.computed(() => questions.value.length);
      const currentQuestion = vue.computed(() => {
        return questions.value.find((q) => q.id === currentQuestionId.value);
      });
      const currentQuestionNumber = vue.computed(() => {
        const index = questions.value.findIndex((q) => q.id === currentQuestionId.value);
        return index + 1;
      });
      const currentTypeName = vue.computed(() => {
        var _a;
        if (!currentQuestion.value)
          return "";
        return ((_a = typeMap[currentQuestion.value.type]) == null ? void 0 : _a.name) || currentQuestion.value.type;
      });
      const getExamConfig = () => {
        var _a, _b;
        try {
          const configStr = ((_a = examInfo.value) == null ? void 0 : _a.antiCheatConfig) || ((_b = examInfo.value) == null ? void 0 : _b.config) || "{}";
          return typeof configStr === "string" ? JSON.parse(configStr) : configStr;
        } catch (e) {
          return {};
        }
      };
      const currentShuffledOptions = vue.computed(() => {
        if (!currentQuestion.value || !currentQuestion.value.options)
          return [];
        const questionId = currentQuestion.value.id;
        if (!shuffledOptionsMap[questionId]) {
          const original = parseOptions(currentQuestion.value.options);
          let options = Object.entries(original).map(([key, label]) => ({ key, label }));
          const examConfig = getExamConfig();
          if (examConfig.shuffleOptions && !isViewMode.value) {
            options = shuffleArray([...options]);
          }
          shuffledOptionsMap[questionId] = options;
        }
        return shuffledOptionsMap[questionId];
      });
      const examStatusText = vue.computed(() => {
        var _a;
        return {
          PENDING: "待开始",
          ONGOING: "进行中",
          FINISHED: "已结束"
        }[(_a = examInfo.value) == null ? void 0 : _a.status] || "";
      });
      const examStatusLower = vue.computed(() => {
        var _a;
        return (((_a = examInfo.value) == null ? void 0 : _a.status) || "").toLowerCase();
      });
      const examStatusClass = vue.computed(() => {
        return "status-" + examStatusLower.value;
      });
      const isFirstQuestion = vue.computed(() => currentQuestionNumber.value === 1);
      const isLastQuestion = vue.computed(() => currentQuestionNumber.value === totalQuestions.value);
      const isAnswered = (questionId) => {
        const answer = answers[questionId];
        const multiAnswer = multiAnswers[questionId];
        if (Array.isArray(multiAnswer) && multiAnswer.length > 0)
          return true;
        if (answer && answer.trim() !== "")
          return true;
        return false;
      };
      const getQuestionResult = (questionId) => {
        if (!answerMap.value)
          return null;
        const key = String(questionId);
        if (!answerMap.value[key])
          return null;
        return answerMap.value[key].isCorrect === 1;
      };
      const isCorrectAnswer = (questionId, key) => {
        const question = questions.value.find((q) => q.id === questionId);
        if (!question || !question.correctAnswer)
          return false;
        const correctKeys = question.correctAnswer.split(",").map((k) => k.trim());
        return correctKeys.indexOf(key) > -1;
      };
      const isMultiSelected = (questionId, key) => {
        const answer = multiAnswers[questionId];
        if (!answer || !Array.isArray(answer))
          return false;
        return answer.indexOf(key) > -1;
      };
      const isSingleChoiceOrJudgment = (type) => {
        return type === "SINGLE_CHOICE" || type === "JUDGMENT";
      };
      const isCurrentQuestion = (questionId) => {
        return currentQuestionId.value === questionId;
      };
      const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        const s = seconds % 60;
        if (h > 0) {
          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        }
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      };
      const parseOptions = (options) => {
        if (!options)
          return {};
        if (Array.isArray(options)) {
          const result = {};
          options.forEach((item, idx) => {
            const key = String.fromCharCode(65 + idx);
            if (typeof item === "object") {
              result[key] = item.content || item.text || "";
            } else {
              result[key] = String(item);
            }
          });
          return result;
        }
        if (typeof options === "string") {
          try {
            const parsed = JSON.parse(options);
            if (Array.isArray(parsed)) {
              const result = {};
              parsed.forEach((item, idx) => {
                const key = String.fromCharCode(65 + idx);
                if (typeof item === "object") {
                  result[key] = item.content || item.text || "";
                } else {
                  result[key] = String(item);
                }
              });
              return result;
            }
          } catch (e) {
            const parts = options.split("|").filter((o) => o.trim());
            const result = {};
            parts.forEach((part, idx) => {
              const key = String.fromCharCode(65 + idx);
              result[key] = part.trim();
            });
            return result;
          }
        }
        return {};
      };
      const seededRandom = (seed) => {
        const x = Math.sin(seed++) * 1e4;
        return x - Math.floor(x);
      };
      const shuffleArray = (array, seed = Date.now()) => {
        const shuffled = [...array];
        let random = seededRandom.bind(null, seed);
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };
      const shuffleQuestionsByType = (questions2) => {
        const typeOrder = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "JUDGMENT", "FILL_BLANK", "ESSAY", "PROGRAMMING"];
        const result = [];
        for (const type of typeOrder) {
          const typeQuestions = questions2.filter((q) => q.type === type);
          if (typeQuestions.length > 0) {
            result.push(...shuffleArray(typeQuestions));
          }
        }
        return result;
      };
      const jumpToQuestion = (questionId) => {
        currentQuestionId.value = questionId;
        showNav.value = false;
      };
      const prevQuestion = () => {
        const currentIndex = questions.value.findIndex((q) => q.id === currentQuestionId.value);
        if (currentIndex > 0) {
          currentQuestionId.value = questions.value[currentIndex - 1].id;
        }
      };
      const nextQuestion = () => {
        const currentIndex = questions.value.findIndex((q) => q.id === currentQuestionId.value);
        if (currentIndex < questions.value.length - 1) {
          currentQuestionId.value = questions.value[currentIndex + 1].id;
        }
      };
      const handleSelect = (key) => {
        if (isViewMode.value)
          return;
        answers[currentQuestion.value.id] = key;
        saveAnswer();
      };
      const handleMultiSelect = (key) => {
        if (isViewMode.value)
          return;
        if (!multiAnswers[currentQuestion.value.id]) {
          multiAnswers[currentQuestion.value.id] = [];
        }
        const index = multiAnswers[currentQuestion.value.id].indexOf(key);
        if (index > -1) {
          multiAnswers[currentQuestion.value.id].splice(index, 1);
        } else {
          multiAnswers[currentQuestion.value.id].push(key);
        }
        answers[currentQuestion.value.id] = multiAnswers[currentQuestion.value.id].join(",");
        saveAnswer();
      };
      const saveAnswer = async () => {
        if (isViewMode.value)
          return;
        if (!recordId.value) {
          formatAppLog("error", "at pages/student/exam-take.vue:450", "保存答案失败: recordId为空");
          return;
        }
        try {
          const allAnswers = {};
          for (const [qId, value] of Object.entries(answers)) {
            if (value && value.trim() !== "") {
              allAnswers[String(qId)] = String(value);
            }
          }
          for (const [qId, value] of Object.entries(multiAnswers)) {
            if (Array.isArray(value) && value.length > 0) {
              allAnswers[String(qId)] = value.join(",");
            }
          }
          if (Object.keys(allAnswers).length === 0)
            return;
          const saveResult = await examRecordApi.autoSave({
            recordId: Number(recordId.value),
            answers: allAnswers
          });
          formatAppLog("log", "at pages/student/exam-take.vue:470", "保存答案结果:", saveResult);
        } catch (e) {
          formatAppLog("error", "at pages/student/exam-take.vue:472", "保存答案失败:", e);
        }
      };
      const handleManualSave = async () => {
        if (isViewMode.value)
          return;
        saving.value = true;
        try {
          await saveAnswer();
          uni.showToast({ title: "保存成功", icon: "success" });
        } catch (e) {
          uni.showToast({ title: "保存失败", icon: "none" });
        } finally {
          saving.value = false;
        }
      };
      const handleSubmit = async () => {
        if (isViewMode.value)
          return;
        uni.showModal({
          title: "提示",
          content: "确定要交卷吗？交卷后无法修改答案",
          success: async (res) => {
            if (res.confirm) {
              submitting.value = true;
              try {
                const result = await examRecordApi.submit(recordId.value);
                if (result.code === 200) {
                  uni.showToast({ title: "交卷成功", icon: "success" });
                  isViewMode.value = true;
                  setTimeout(() => {
                    uni.redirectTo({ url: "/pages/student/history" });
                  }, 1500);
                } else {
                  uni.showToast({ title: result.message || "交卷失败", icon: "none" });
                }
              } catch (e) {
                uni.showToast({ title: e.message || "交卷失败", icon: "none" });
              } finally {
                submitting.value = false;
              }
            }
          }
        });
      };
      const handleTimeUp = async () => {
        if (isViewMode.value)
          return;
        uni.showToast({ title: "考试时间到，已自动交卷", icon: "none", duration: 2e3 });
        try {
          await examRecordApi.autoSubmit(recordId.value);
        } catch (e) {
          formatAppLog("error", "at pages/student/exam-take.vue:524", e);
        }
        setTimeout(() => {
          uni.redirectTo({ url: "/pages/student/history" });
        }, 2e3);
      };
      const recalculateRemainingTime = () => {
        if (!examStartTime.value || isViewMode.value)
          return;
        const totalSeconds = examDuration.value * 60;
        const elapsedSeconds = Math.floor((Date.now() - examStartTime.value) / 1e3);
        remainingTime.value = Math.max(0, totalSeconds - elapsedSeconds);
      };
      const startTimer = () => {
        if (timer)
          clearInterval(timer);
        timer = setInterval(() => {
          recalculateRemainingTime();
          if (remainingTime.value <= 0) {
            clearInterval(timer);
            handleTimeUp();
          }
        }, 1e3);
      };
      const setupAutoSave = () => {
        if (autoSaveTimer)
          clearInterval(autoSaveTimer);
        autoSaveTimer = setInterval(() => {
          saveAnswer();
        }, 3e4);
      };
      const handleLeaveDetection = async () => {
        if (!recordId.value || isViewMode.value)
          return;
        const examConfig = getExamConfig();
        if (!examConfig.leaveDetection)
          return;
        leaveCount.value++;
        formatAppLog("log", "at pages/student/exam-take.vue:563", "检测到离开，当前离开次数:", leaveCount.value);
        if (examConfig.maxLeaveCount !== void 0) {
          maxLeaveCount.value = examConfig.maxLeaveCount;
        }
        uni.setStorageSync(`leaveWarning_${recordId.value}`, {
          needShow: true,
          leaveCount: leaveCount.value,
          maxLeaveCount: maxLeaveCount.value
        });
        if (leaveCount.value >= maxLeaveCount.value) {
          uni.showModal({
            title: "警告",
            content: `您已离开考试页面${leaveCount.value}次，已达到上限！
系统将自动交卷。`,
            showCancel: false,
            confirmText: "确定",
            success: async () => {
              try {
                await examRecordApi.autoSubmit(recordId.value);
              } catch (e) {
                formatAppLog("error", "at pages/student/exam-take.vue:585", e);
              }
              uni.redirectTo({ url: "/pages/student/history" });
            }
          });
          return;
        }
        uni.showModal({
          title: "警告",
          content: `您已离开考试页面${leaveCount.value}次！
再离开${maxLeaveCount.value - leaveCount.value}次将被强制收卷。`,
          showCancel: false,
          confirmText: "知道了"
        });
        try {
          await examRecordApi.reportLeave({
            recordId: recordId.value,
            leaveCount: leaveCount.value
          });
        } catch (e) {
          formatAppLog("error", "at pages/student/exam-take.vue:606", "上报离开失败:", e);
        }
      };
      const loadExamData = async (examId, reviewRecordId, isReview) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r;
        try {
          if (isReview && reviewRecordId) {
            isViewMode.value = true;
            const res = await examRecordApi.getById(reviewRecordId);
            if (res.code === 200) {
              examInfo.value = res.data.exam;
              questions.value = res.data.questions || [];
              recordId.value = res.data.id;
              answerMap.value = res.data.answerMap || {};
              studentScore.value = res.data.score || 0;
              try {
                const examConfig = typeof ((_a = res.data.exam) == null ? void 0 : _a.antiCheatConfig) === "string" ? JSON.parse((_b = res.data.exam) == null ? void 0 : _b.antiCheatConfig) : ((_c = res.data.exam) == null ? void 0 : _c.antiCheatConfig) || {};
                canViewPaper.value = ((_d = res.data.exam) == null ? void 0 : _d.allowViewAfterExam) !== 0 && examConfig.viewPaperAfterExam !== false;
              } catch (e) {
                canViewPaper.value = ((_e = res.data.exam) == null ? void 0 : _e.allowViewAfterExam) !== 0;
              }
              if (res.data.studentAnswers) {
                Object.assign(answers, typeof res.data.studentAnswers === "string" ? JSON.parse(res.data.studentAnswers) : res.data.studentAnswers);
              }
              if (questions.value.length > 0) {
                currentQuestionId.value = questions.value[0].id;
              }
            } else {
              uni.showToast({ title: res.message || "加载失败", icon: "none" });
            }
          } else {
            const examRes = await examApi.getById(examId);
            if (examRes.code === 200) {
              examInfo.value = examRes.data;
              const isExamFinished = examInfo.value.status === "FINISHED";
              if (isExamFinished) {
                isViewMode.value = true;
                const recRes = await examRecordApi.page({ examId: Number(examId) });
                if (recRes.code === 200 && recRes.data.records.length > 0) {
                  const record = recRes.data.records[0];
                  recordId.value = record.id;
                  studentScore.value = record.score || 0;
                  answerMap.value = record.answerMap || {};
                  try {
                    const examConfig = typeof ((_f = examInfo.value) == null ? void 0 : _f.antiCheatConfig) === "string" ? JSON.parse((_g = examInfo.value) == null ? void 0 : _g.antiCheatConfig) : ((_h = examInfo.value) == null ? void 0 : _h.antiCheatConfig) || {};
                    canViewPaper.value = ((_i = examInfo.value) == null ? void 0 : _i.allowViewAfterExam) !== 0 && examConfig.viewPaperAfterExam !== false;
                  } catch (e) {
                    canViewPaper.value = ((_j = examInfo.value) == null ? void 0 : _j.allowViewAfterExam) !== 0;
                  }
                  if (record.studentAnswers || record.answers) {
                    Object.assign(answers, typeof (record.studentAnswers || record.answers) === "string" ? JSON.parse(record.studentAnswers || record.answers) : record.studentAnswers || record.answers);
                  }
                }
              }
              let existingRecord = null;
              if (examInfo.value.paperId) {
                const qRes = await examRecordApi.page({ examId: Number(examId) });
                if (qRes.code === 200 && qRes.data.records.length > 0) {
                  existingRecord = qRes.data.records.find((r) => r.status === "ONGOING");
                }
              }
              const startRes = await examRecordApi.start({ examId: Number(examId) });
              formatAppLog("log", "at pages/student/exam-take.vue:676", "start接口返回:", JSON.stringify(startRes));
              if (startRes.code === 200) {
                formatAppLog("log", "at pages/student/exam-take.vue:678", "questions原始数据长度:", (startRes.data.questions || []).length);
                questions.value = startRes.data.questions || [];
                formatAppLog("log", "at pages/student/exam-take.vue:680", "questions设置后长度:", questions.value.length);
                if (!recordId.value) {
                  recordId.value = startRes.data.recordId;
                }
                const recordStatus = (_k = startRes.data.record) == null ? void 0 : _k.status;
                formatAppLog("log", "at pages/student/exam-take.vue:687", "record状态:", recordStatus);
                if (recordStatus === "SUBMITTED" || recordStatus === "AUTO_SUBMITTED") {
                  isViewMode.value = true;
                  studentScore.value = ((_l = startRes.data.record) == null ? void 0 : _l.score) || 0;
                }
                try {
                  const examConfig2 = typeof ((_m = examInfo.value) == null ? void 0 : _m.antiCheatConfig) === "string" ? JSON.parse((_n = examInfo.value) == null ? void 0 : _n.antiCheatConfig) : ((_o = examInfo.value) == null ? void 0 : _o.antiCheatConfig) || {};
                  canViewPaper.value = ((_p = examInfo.value) == null ? void 0 : _p.allowViewAfterExam) !== 0 && examConfig2.viewPaperAfterExam !== false;
                } catch (e) {
                  canViewPaper.value = ((_q = examInfo.value) == null ? void 0 : _q.allowViewAfterExam) !== 0;
                }
                answerMap.value = startRes.data.answerMap || {};
                if (startRes.data.studentAnswers) {
                  formatAppLog("log", "at pages/student/exam-take.vue:703", "恢复已保存答案:", startRes.data.studentAnswers);
                  Object.assign(answers, typeof startRes.data.studentAnswers === "string" ? JSON.parse(startRes.data.studentAnswers) : startRes.data.studentAnswers);
                }
                formatAppLog("log", "at pages/student/exam-take.vue:706", "恢复后answers:", answers);
                if (startRes.data.leaveCount !== void 0) {
                  leaveCount.value = startRes.data.leaveCount;
                }
                const examConfig = getExamConfig();
                if (examConfig.shuffleQuestions && !isViewMode.value) {
                  questions.value = shuffleQuestionsByType(questions.value);
                }
                if (questions.value.length > 0) {
                  currentQuestionId.value = questions.value[0].id;
                }
                if (!isViewMode.value) {
                  examDuration.value = examInfo.value.duration || 0;
                  if (!examStartTime.value) {
                    if (startRes.data.startTime) {
                      formatAppLog("log", "at pages/student/exam-take.vue:726", "使用后端返回的startTime:", startRes.data.startTime);
                      examStartTime.value = new Date(startRes.data.startTime).getTime();
                    } else if (((_r = startRes.data.record) == null ? void 0 : _r.submitTime) && examDuration.value > 0) {
                      formatAppLog("log", "at pages/student/exam-take.vue:729", "startTime为空，使用submitTime倒推");
                      examStartTime.value = new Date(startRes.data.record.submitTime).getTime() - examDuration.value * 60 * 1e3;
                    } else {
                      formatAppLog("log", "at pages/student/exam-take.vue:732", "使用当前时间作为startTime");
                      examStartTime.value = Date.now();
                    }
                  }
                  formatAppLog("log", "at pages/student/exam-take.vue:736", "examStartTime:", examStartTime.value, ", examDuration:", examDuration.value);
                  recalculateRemainingTime();
                  formatAppLog("log", "at pages/student/exam-take.vue:739", "剩余时间:", remainingTime.value);
                  startTimer();
                  setupAutoSave();
                }
              }
            } else {
              uni.showToast({ title: examRes.message || "加载失败", icon: "none" });
            }
          }
        } catch (e) {
          formatAppLog("error", "at pages/student/exam-take.vue:749", "加载失败:", e);
          uni.showToast({ title: "网络错误", icon: "none" });
        }
      };
      onLoad((options) => {
        const examId = options.id;
        const reviewRecordId = options.recordId;
        const isReview = options.review === "1";
        if (examId) {
          loadExamData(examId, reviewRecordId, isReview);
        }
      });
      onShow(() => {
        formatAppLog("log", "at pages/student/exam-take.vue:764", "onShow触发");
        if (!isViewMode.value && examStartTime.value) {
          recalculateRemainingTime();
        }
        const warningData = uni.getStorageSync(`leaveWarning_${recordId.value}`);
        if (warningData && warningData.needShow) {
          formatAppLog("log", "at pages/student/exam-take.vue:771", "显示离开警告弹窗");
          uni.removeStorageSync(`leaveWarning_${recordId.value}`);
          uni.showModal({
            title: "警告",
            content: `您已离开考试页面！
离开次数：${warningData.leaveCount} / ${warningData.maxLeaveCount}
剩余 ${warningData.maxLeaveCount - warningData.leaveCount} 次机会，超出将自动交卷`,
            showCancel: false,
            confirmText: "继续作答"
          });
        }
      });
      onHide(() => {
        formatAppLog("log", "at pages/student/exam-take.vue:783", "onHide触发");
        handleLeaveDetection();
      });
      vue.onMounted(() => {
        uni.onAppHide(() => {
          formatAppLog("log", "at pages/student/exam-take.vue:789", "AppHide触发");
          handleLeaveDetection();
        });
        uni.onAppShow(() => {
          if (!isViewMode.value && examStartTime.value) {
            recalculateRemainingTime();
          }
        });
      });
      onUnload(() => {
        formatAppLog("log", "at pages/student/exam-take.vue:801", "onUnload触发");
        handleLeaveDetection();
      });
      vue.onUnmounted(() => {
        if (timer) {
          clearInterval(timer);
        }
        if (autoSaveTimer) {
          clearInterval(autoSaveTimer);
        }
        uni.offAppHide();
        uni.offAppShow();
      });
      return (_ctx, _cache) => {
        return examInfo.value ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "exam-container"
        }, [
          vue.createElementVNode("view", { class: "exam-header" }, [
            vue.createElementVNode("view", { class: "header-top" }, [
              vue.createElementVNode(
                "text",
                { class: "exam-title" },
                vue.toDisplayString(examInfo.value.title),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "view",
                {
                  class: vue.normalizeClass(["exam-status", vue.unref(examStatusClass)])
                },
                [
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString(vue.unref(examStatusText)),
                    1
                    /* TEXT */
                  )
                ],
                2
                /* CLASS */
              )
            ]),
            vue.createElementVNode("view", { class: "header-bottom" }, [
              isViewMode.value ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "view-mode-info"
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "score-text" },
                  "得分：" + vue.toDisplayString(studentScore.value) + " / " + vue.toDisplayString(examInfo.value.totalScore),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["tag", canViewPaper.value ? "tag-success" : "tag-warning"])
                  },
                  [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString(canViewPaper.value ? "已出分" : "待评分"),
                      1
                      /* TEXT */
                    )
                  ],
                  2
                  /* CLASS */
                )
              ])) : (vue.openBlock(), vue.createElementBlock("view", {
                key: 1,
                class: "timer-row"
              }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["timer", { warning: remainingTime.value < 300 }])
                  },
                  [
                    vue.createElementVNode("text", null, "⏱"),
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString(formatTime(remainingTime.value)),
                      1
                      /* TEXT */
                    )
                  ],
                  2
                  /* CLASS */
                ),
                vue.createElementVNode("button", {
                  class: "save-btn",
                  onClick: handleManualSave,
                  loading: saving.value
                }, "保存", 8, ["loading"]),
                vue.createElementVNode("button", {
                  class: "submit-btn",
                  onClick: handleSubmit,
                  loading: submitting.value
                }, "交卷", 8, ["loading"])
              ]))
            ])
          ]),
          !(isViewMode.value && !canViewPaper.value) ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "exam-body"
          }, [
            vue.createElementVNode("view", {
              class: "nav-toggle",
              onClick: _cache[0] || (_cache[0] = ($event) => showNav.value = true)
            }, [
              vue.createElementVNode("text", null, "📋"),
              vue.createElementVNode("text", null, "答题卡")
            ]),
            vue.unref(currentQuestion) ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "question-card"
            }, [
              vue.createElementVNode("view", { class: "question-header" }, [
                vue.createElementVNode("view", { class: "question-tag" }, [
                  vue.createElementVNode("view", { class: "tag tag-info" }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString(vue.unref(currentTypeName)),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode(
                    "text",
                    { class: "question-score" },
                    vue.toDisplayString(vue.unref(currentQuestion).score) + "分",
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode(
                  "text",
                  { class: "question-number" },
                  "第 " + vue.toDisplayString(vue.unref(currentQuestionNumber)) + " / " + vue.toDisplayString(vue.unref(totalQuestions)) + " 题",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode(
                "view",
                { class: "question-content-text" },
                vue.toDisplayString(vue.unref(currentQuestion).content),
                1
                /* TEXT */
              ),
              isSingleChoiceOrJudgment(vue.unref(currentQuestion).type) ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "question-options"
              }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(vue.unref(currentShuffledOptions), (item, index) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      key: item.key,
                      class: vue.normalizeClass(["option-item", {
                        selected: answers[vue.unref(currentQuestion).id] === item.key,
                        correct: isViewMode.value && canViewPaper.value && isCorrectAnswer(vue.unref(currentQuestion).id, item.key),
                        wrong: isViewMode.value && canViewPaper.value && answers[vue.unref(currentQuestion).id] === item.key && !isCorrectAnswer(vue.unref(currentQuestion).id, item.key)
                      }]),
                      onClick: ($event) => handleSelect(item.key)
                    }, [
                      vue.createElementVNode(
                        "view",
                        { class: "option-key" },
                        vue.toDisplayString(item.key),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "option-text" },
                        vue.toDisplayString(item.label),
                        1
                        /* TEXT */
                      )
                    ], 10, ["onClick"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])) : vue.unref(currentQuestion).type === "MULTIPLE_CHOICE" ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 1,
                class: "question-options"
              }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(vue.unref(currentShuffledOptions), (item, index) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      key: item.key,
                      class: vue.normalizeClass(["option-item", {
                        selected: isMultiSelected(vue.unref(currentQuestion).id, item.key),
                        correct: isViewMode.value && canViewPaper.value && isCorrectAnswer(vue.unref(currentQuestion).id, item.key),
                        wrong: isViewMode.value && canViewPaper.value && isMultiSelected(vue.unref(currentQuestion).id, item.key) && !isCorrectAnswer(vue.unref(currentQuestion).id, item.key)
                      }]),
                      onClick: ($event) => handleMultiSelect(item.key)
                    }, [
                      vue.createElementVNode(
                        "view",
                        { class: "option-key" },
                        vue.toDisplayString(item.key),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "option-text" },
                        vue.toDisplayString(item.label),
                        1
                        /* TEXT */
                      )
                    ], 10, ["onClick"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])) : (vue.openBlock(), vue.createElementBlock("view", {
                key: 2,
                class: "question-input"
              }, [
                vue.withDirectives(vue.createElementVNode("textarea", {
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => answers[vue.unref(currentQuestion).id] = $event),
                  placeholder: vue.unref(currentQuestion).type === "FILL_BLANK" ? "请输入答案" : "请输入答案内容",
                  maxlength: vue.unref(currentQuestion).type === "FILL_BLANK" ? 500 : 2e3,
                  disabled: isViewMode.value,
                  onBlur: saveAnswer
                }, null, 40, ["placeholder", "maxlength", "disabled"]), [
                  [vue.vModelText, answers[vue.unref(currentQuestion).id]]
                ]),
                isViewMode.value && canViewPaper.value ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "answer-comparison"
                }, [
                  vue.createElementVNode("view", { class: "answer-row" }, [
                    vue.createElementVNode("text", { class: "label" }, "你的答案："),
                    vue.createElementVNode(
                      "text",
                      { class: "value" },
                      vue.toDisplayString(answers[vue.unref(currentQuestion).id] || "未答"),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.unref(currentQuestion).type === "FILL_BLANK" ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "answer-row"
                  }, [
                    vue.createElementVNode("text", { class: "label" }, "正确答案："),
                    vue.createElementVNode(
                      "text",
                      { class: "value correct" },
                      vue.toDisplayString(vue.unref(currentQuestion).correctAnswer),
                      1
                      /* TEXT */
                    )
                  ])) : vue.createCommentVNode("v-if", true)
                ])) : vue.createCommentVNode("v-if", true)
              ])),
              vue.createElementVNode("view", { class: "question-actions" }, [
                vue.createElementVNode("button", {
                  class: "action-btn",
                  onClick: prevQuestion,
                  disabled: vue.unref(isFirstQuestion)
                }, "上一题", 8, ["disabled"]),
                vue.createElementVNode("button", {
                  class: "action-btn",
                  onClick: nextQuestion,
                  disabled: vue.unref(isLastQuestion)
                }, "下一题", 8, ["disabled"])
              ])
            ])) : (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "no-question"
            }, [
              vue.createElementVNode("text", null, "加载中...")
            ]))
          ])) : (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "paper-locked"
          }, [
            vue.createElementVNode("text", null, "🔒"),
            vue.createElementVNode("text", { class: "locked-text" }, "教师已关闭考后查看试卷权限，无法查看试卷内容")
          ])),
          showNav.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 2,
            class: "nav-drawer",
            onClick: _cache[4] || (_cache[4] = ($event) => showNav.value = false)
          }, [
            vue.createElementVNode("view", {
              class: "nav-content",
              onClick: _cache[3] || (_cache[3] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("view", { class: "nav-header" }, [
                vue.createElementVNode("text", { class: "nav-title" }, "答题卡"),
                vue.createElementVNode("view", {
                  class: "nav-close",
                  onClick: _cache[2] || (_cache[2] = ($event) => showNav.value = false)
                }, [
                  vue.createElementVNode("text", null, "×")
                ])
              ]),
              vue.createElementVNode("scroll-view", {
                class: "nav-body",
                "scroll-y": ""
              }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(vue.unref(questionSections), (section) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      key: section.type,
                      class: "nav-section"
                    }, [
                      vue.createElementVNode(
                        "view",
                        { class: "section-title" },
                        vue.toDisplayString(section.typeName) + " (" + vue.toDisplayString(section.questions.length) + "题)",
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode("view", { class: "question-grid" }, [
                        (vue.openBlock(true), vue.createElementBlock(
                          vue.Fragment,
                          null,
                          vue.renderList(section.questions, (q, qIndex) => {
                            return vue.openBlock(), vue.createElementBlock("view", {
                              key: q.id,
                              class: vue.normalizeClass(["question-item", {
                                current: isCurrentQuestion(q.id),
                                answered: isAnswered(q.id),
                                correct: isViewMode.value && canViewPaper.value && getQuestionResult(q.id) === true,
                                wrong: isViewMode.value && canViewPaper.value && getQuestionResult(q.id) === false
                              }]),
                              onClick: ($event) => jumpToQuestion(q.id)
                            }, [
                              vue.createElementVNode(
                                "text",
                                null,
                                vue.toDisplayString(section.startIndex + qIndex + 1),
                                1
                                /* TEXT */
                              )
                            ], 10, ["onClick"]);
                          }),
                          128
                          /* KEYED_FRAGMENT */
                        ))
                      ])
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ]),
              vue.createElementVNode("view", { class: "nav-legend" }, [
                isViewMode.value ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "legend-row"
                }, [
                  vue.createElementVNode("view", { class: "legend-item" }, [
                    vue.createElementVNode("view", { class: "dot correct" }),
                    vue.createElementVNode("text", null, "正确")
                  ]),
                  vue.createElementVNode("view", { class: "legend-item" }, [
                    vue.createElementVNode("view", { class: "dot wrong" }),
                    vue.createElementVNode("text", null, "错误")
                  ]),
                  vue.createElementVNode("view", { class: "legend-item" }, [
                    vue.createElementVNode("view", { class: "dot unanswered" }),
                    vue.createElementVNode("text", null, "未答")
                  ])
                ])) : (vue.openBlock(), vue.createElementBlock("view", {
                  key: 1,
                  class: "legend-row"
                }, [
                  vue.createElementVNode("view", { class: "legend-item" }, [
                    vue.createElementVNode("view", { class: "dot current" }),
                    vue.createElementVNode("text", null, "当前")
                  ]),
                  vue.createElementVNode("view", { class: "legend-item" }, [
                    vue.createElementVNode("view", { class: "dot answered" }),
                    vue.createElementVNode("text", null, "已答")
                  ]),
                  vue.createElementVNode("view", { class: "legend-item" }, [
                    vue.createElementVNode("view", { class: "dot unanswered" }),
                    vue.createElementVNode("text", null, "未答")
                  ])
                ]))
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true)
        ])) : (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "loading-container"
        }, [
          vue.createElementVNode("text", null, "加载考试信息...")
        ]));
      };
    }
  };
  const PagesStudentExamTake = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-35b9ed3e"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/student/exam-take.vue"]]);
  const _sfc_main$3 = {
    __name: "history",
    setup(__props) {
      const tableData = vue.ref([]);
      const keyword = vue.ref("");
      const loading = vue.ref(false);
      const current = vue.ref(1);
      const size = vue.ref(10);
      const loadStatus = vue.ref("more");
      const handleSearch = () => {
        current.value = 1;
        tableData.value = [];
        loadStatus.value = "more";
        loadData();
      };
      const handleDetail = (item) => {
        uni.navigateTo({
          url: `/pages/student/exam-take?id=${item.examId}&recordId=${item.id}&review=1`
        });
      };
      const loadData = async () => {
        if (loadStatus.value === "loading")
          return;
        loadStatus.value = "loading";
        try {
          const params = {
            current: current.value,
            size: size.value,
            keyword: keyword.value
          };
          const res = await examRecordApi.getStudentHistory(params);
          if (res.code === 200) {
            const data = res.data.records;
            tableData.value = [...tableData.value, ...data];
            loadStatus.value = data.length >= size.value ? "more" : "noMore";
            current.value++;
          } else {
            uni.showToast({
              title: res.message || "加载失败",
              icon: "none"
            });
            loadStatus.value = "more";
          }
        } catch (e) {
          formatAppLog("error", "at pages/student/history.vue:103", e);
          uni.showToast({
            title: "网络错误",
            icon: "none"
          });
          loadStatus.value = "more";
        } finally {
          loading.value = false;
        }
      };
      const handleBack = () => {
        uni.navigateBack({
          fail: () => {
            uni.switchTab({ url: "/pages/student/index" });
          }
        });
      };
      vue.onMounted(() => {
        loadData();
      });
      return (_ctx, _cache) => {
        const _component_uni_icons = vue.resolveComponent("uni-icons");
        const _component_uni_load_more = vue.resolveComponent("uni-load-more");
        return vue.openBlock(), vue.createElementBlock("view", { class: "history" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("view", { class: "header-top" }, [
              vue.createElementVNode("view", {
                class: "back-btn",
                onClick: handleBack
              }, [
                vue.createVNode(_component_uni_icons, {
                  type: "back",
                  size: "32",
                  color: "#333"
                })
              ]),
              vue.createElementVNode("text", { class: "title" }, "考试历史"),
              vue.createElementVNode("view", { class: "placeholder" })
            ]),
            vue.createElementVNode("text", { class: "subtitle" }, "查看已完成考试的成绩和答卷详情")
          ]),
          vue.createCommentVNode(" 搜索栏 "),
          vue.createElementVNode("view", { class: "search-bar" }, [
            vue.createElementVNode("view", { class: "search-input" }, [
              vue.createVNode(_component_uni_icons, {
                type: "search",
                size: "18",
                color: "#999"
              }),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  type: "text",
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => keyword.value = $event),
                  placeholder: "搜索考试名称",
                  onConfirm: handleSearch
                },
                null,
                544
                /* HYDRATE_EVENTS, NEED_PATCH */
              ), [
                [vue.vModelText, keyword.value]
              ])
            ]),
            vue.createElementVNode("button", {
              class: "search-btn",
              onClick: handleSearch
            }, "搜索")
          ]),
          vue.createCommentVNode(" 卡片列表 "),
          vue.createElementVNode("view", { class: "card-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(tableData.value, (item) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "card-item",
                  key: item.id
                }, [
                  vue.createElementVNode("view", { class: "card-header" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "card-title" },
                      vue.toDisplayString(item.examTitle),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "view",
                      {
                        class: vue.normalizeClass(["score-badge", item.score >= 60 ? "pass" : "fail"])
                      },
                      [
                        vue.createElementVNode(
                          "text",
                          null,
                          vue.toDisplayString(item.score) + "分",
                          1
                          /* TEXT */
                        )
                      ],
                      2
                      /* CLASS */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "card-info" }, [
                    vue.createElementVNode("view", { class: "info-row" }, [
                      vue.createVNode(_component_uni_icons, {
                        type: "clock",
                        size: "16",
                        color: "#666"
                      }),
                      vue.createElementVNode(
                        "text",
                        { class: "info-text" },
                        "交卷时间：" + vue.toDisplayString(item.submitTime),
                        1
                        /* TEXT */
                      )
                    ])
                  ]),
                  vue.createElementVNode("view", { class: "card-actions" }, [
                    vue.createElementVNode("button", {
                      class: "detail-btn",
                      onClick: ($event) => handleDetail(item)
                    }, "查看详情", 8, ["onClick"])
                  ])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createVNode(_component_uni_load_more, { status: loadStatus.value }, null, 8, ["status"]),
          !loading.value && tableData.value.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "empty"
          }, [
            vue.createVNode(_component_uni_icons, {
              type: "info",
              size: "80",
              color: "#999"
            }),
            vue.createElementVNode("text", { class: "empty-text" }, "暂无考试记录")
          ])) : vue.createCommentVNode("v-if", true)
        ]);
      };
    }
  };
  const PagesStudentHistory = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-cee26447"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/student/history.vue"]]);
  const _sfc_main$2 = {
    __name: "wrong-questions",
    setup(__props) {
      const tableData = vue.ref([]);
      const subjects = vue.ref([]);
      const params = vue.ref({
        subjectId: "",
        mastered: ""
      });
      const loadStatus = vue.ref("more");
      const current = vue.ref(1);
      const size = vue.ref(10);
      const answerVisible = vue.ref(false);
      const viewingAnswer = vue.ref(null);
      const practiceVisible = vue.ref(false);
      const practicingItem = vue.ref(null);
      const userAnswer = vue.ref([]);
      const showPracticeResult = vue.ref(false);
      const typeMap = {
        SINGLE_CHOICE: "单选题",
        MULTIPLE_CHOICE: "多选题",
        JUDGMENT: "判断题",
        FILL_BLANK: "填空题",
        ESSAY: "简答题",
        PROGRAMMING: "编程题"
      };
      const subjectOptions = vue.computed(() => {
        return [{ id: "", name: "全部科目" }, ...subjects.value];
      });
      const statusOptions = [
        { value: "", label: "全部状态" },
        { value: "0", label: "未学会" },
        { value: "1", label: "已学会" }
      ];
      const currentSubjectText = vue.computed(() => {
        const option = subjectOptions.value.find((s) => s.id === params.value.subjectId);
        return option ? option.name : "全部科目";
      });
      const currentStatusText = vue.computed(() => {
        const option = statusOptions.find((s) => s.value === params.value.mastered);
        return option ? option.label : "全部状态";
      });
      const typeText = (type) => typeMap[type] || type;
      const getTagClass = (type) => {
        return {
          "tag-info": true
        };
      };
      const getPassRate = (item) => {
        if (!item.practicedCount || item.practicedCount === 0)
          return 0;
        return Math.round(item.correctCount / item.practicedCount * 100);
      };
      const onSubjectChange = (e) => {
        const index = e.detail.value;
        params.value.subjectId = subjectOptions.value[index].id;
        loadData();
      };
      const onStatusChange = (e) => {
        const index = e.detail.value;
        params.value.mastered = statusOptions[index].value;
        loadData();
      };
      const handleViewAnswer = (item) => {
        viewingAnswer.value = item;
        answerVisible.value = true;
      };
      const handlePractice = (item) => {
        practicingItem.value = item;
        userAnswer.value = [];
        showPracticeResult.value = false;
        practiceVisible.value = true;
      };
      const parseOptions = (options) => {
        try {
          const parsed = typeof options === "string" ? JSON.parse(options) : options;
          if (Array.isArray(parsed)) {
            return parsed.map((item) => ({
              key: item.key || "",
              value: item.content || item.value || ""
            }));
          }
          return Object.entries(parsed).map(([key, value]) => ({ key, value }));
        } catch {
          return [];
        }
      };
      const isMultiChoiceItem = (item) => {
        const type = item == null ? void 0 : item.type;
        const correctAnswer = (item == null ? void 0 : item.correctAnswer) || "";
        return type === "MULTIPLE_CHOICE" || correctAnswer.includes(",");
      };
      const isMultiChoice = () => {
        return isMultiChoiceItem(practicingItem.value);
      };
      const selectOption = (key) => {
        if (showPracticeResult.value)
          return;
        if (isMultiChoice()) {
          const index = userAnswer.value.indexOf(key);
          if (index > -1) {
            userAnswer.value.splice(index, 1);
          } else {
            userAnswer.value.push(key);
          }
        } else {
          userAnswer.value = [key];
        }
      };
      const getCorrectAnswers = () => {
        var _a;
        const correct = ((_a = practicingItem.value) == null ? void 0 : _a.correctAnswer) || "";
        return correct.split(",").map((a) => a.trim()).filter((a) => a);
      };
      const isCorrectOption = (key) => {
        return getCorrectAnswers().includes(key);
      };
      const isWrongOption = (key) => {
        return userAnswer.value.includes(key) && !isCorrectOption(key);
      };
      const isAnswerCorrect = vue.computed(() => {
        const user = [...userAnswer.value].sort();
        const correct = getCorrectAnswers().sort();
        if (user.length !== correct.length)
          return false;
        return user.every((val, idx) => val === correct[idx]);
      });
      const formatAnswer = (answer) => {
        return answer.length > 0 ? answer.join("") : "未作答";
      };
      const submitPractice = async () => {
        if (userAnswer.value.length === 0) {
          uni.showToast({
            title: "请选择答案",
            icon: "none"
          });
          return;
        }
        try {
          await wrongQuestionApi.practice(practicingItem.value.id);
          if (isAnswerCorrect.value) {
            await wrongQuestionApi.correct(practicingItem.value.id);
          }
          showPracticeResult.value = true;
          const idx = tableData.value.findIndex((item) => item.id === practicingItem.value.id);
          if (idx > -1) {
            tableData.value[idx].practicedCount++;
            if (isAnswerCorrect.value) {
              tableData.value[idx].correctCount++;
            }
          }
        } catch (e) {
          formatAppLog("error", "at pages/student/wrong-questions.vue:356", e);
          uni.showToast({
            title: "练习提交失败",
            icon: "none"
          });
        }
      };
      const handleToggleMastered = async (item) => {
        try {
          const newMastered = item.mastered === 1 ? 0 : 1;
          const res = await wrongQuestionApi.updateMastered(item.id, newMastered);
          if (res.code === 200) {
            uni.showToast({
              title: "标记成功",
              icon: "success"
            });
            item.mastered = newMastered;
          } else {
            uni.showToast({
              title: res.message || "操作失败",
              icon: "none"
            });
          }
        } catch (e) {
          uni.showToast({
            title: "网络错误",
            icon: "none"
          });
        }
      };
      const loadSubjects = async () => {
        try {
          const res = await subjectApi.list();
          if (res.code === 200) {
            subjects.value = res.data;
          }
        } catch (e) {
          formatAppLog("error", "at pages/student/wrong-questions.vue:395", e);
        }
      };
      const loadData = async () => {
        if (loadStatus.value === "loading")
          return;
        loadStatus.value = "loading";
        current.value = 1;
        tableData.value = [];
        try {
          const res = await wrongQuestionApi.page({
            current: current.value,
            size: size.value,
            subjectId: params.value.subjectId,
            mastered: params.value.mastered
          });
          if (res.code === 200) {
            tableData.value = res.data.records;
            loadStatus.value = res.data.records.length >= size.value ? "more" : "noMore";
          } else {
            uni.showToast({
              title: res.message || "加载失败",
              icon: "none"
            });
            loadStatus.value = "more";
          }
        } catch (e) {
          formatAppLog("error", "at pages/student/wrong-questions.vue:423", e);
          uni.showToast({
            title: "网络错误",
            icon: "none"
          });
          loadStatus.value = "more";
        }
      };
      vue.onMounted(() => {
        loadSubjects();
        loadData();
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "wrong-questions" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("text", { class: "title" }, "错题本"),
            vue.createElementVNode("text", { class: "subtitle" }, "自动收录所有答错的题目，支持反复练习")
          ]),
          vue.createCommentVNode(" 工具栏 "),
          vue.createElementVNode("view", { class: "toolbar" }, [
            vue.createElementVNode("view", { class: "toolbar-left" }, [
              vue.createElementVNode("picker", {
                mode: "selector",
                range: vue.unref(subjectOptions),
                "range-key": "name",
                onChange: onSubjectChange
              }, [
                vue.createElementVNode("view", { class: "picker" }, [
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString(vue.unref(currentSubjectText)),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "picker-icon" }, "▼")
                ])
              ], 40, ["range"]),
              vue.createElementVNode(
                "picker",
                {
                  mode: "selector",
                  range: statusOptions,
                  "range-key": "label",
                  onChange: onStatusChange
                },
                [
                  vue.createElementVNode("view", { class: "picker" }, [
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString(vue.unref(currentStatusText)),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("text", { class: "picker-icon" }, "▼")
                  ])
                ],
                32
                /* HYDRATE_EVENTS */
              )
            ]),
            vue.createElementVNode("button", {
              class: "search-btn",
              onClick: loadData
            }, "搜索")
          ]),
          vue.createCommentVNode(" 题目列表 "),
          vue.createElementVNode("view", { class: "question-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(tableData.value, (item) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "question-item",
                  key: item.id
                }, [
                  vue.createElementVNode("view", { class: "question-content" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "question-text" },
                      vue.toDisplayString(item.content),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "question-meta" }, [
                    vue.createElementVNode("view", { class: "meta-row" }, [
                      vue.createElementVNode(
                        "view",
                        {
                          class: vue.normalizeClass(["tag", getTagClass(item.type)])
                        },
                        [
                          vue.createElementVNode(
                            "text",
                            null,
                            vue.toDisplayString(isMultiChoiceItem(item) ? "多选题" : typeText(item.type)),
                            1
                            /* TEXT */
                          )
                        ],
                        2
                        /* CLASS */
                      ),
                      vue.createElementVNode(
                        "view",
                        {
                          class: vue.normalizeClass(["tag", item.mastered === 1 ? "tag-success" : "tag-warning"])
                        },
                        [
                          vue.createElementVNode(
                            "text",
                            null,
                            vue.toDisplayString(item.mastered === 1 ? "已学会" : "未学会"),
                            1
                            /* TEXT */
                          )
                        ],
                        2
                        /* CLASS */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "progress-row" }, [
                      vue.createElementVNode("text", { class: "progress-label" }, "通过率："),
                      vue.createElementVNode("view", { class: "progress-bar" }, [
                        vue.createElementVNode(
                          "view",
                          {
                            class: "progress-fill",
                            style: vue.normalizeStyle({ width: getPassRate(item) + "%" })
                          },
                          null,
                          4
                          /* STYLE */
                        )
                      ]),
                      vue.createElementVNode(
                        "text",
                        { class: "progress-text" },
                        vue.toDisplayString(getPassRate(item)) + "%",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "practice-count" },
                      "练习次数：" + vue.toDisplayString(item.practicedCount),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "question-actions" }, [
                    vue.createElementVNode("button", {
                      class: "action-btn",
                      onClick: ($event) => handleViewAnswer(item)
                    }, "查看答案", 8, ["onClick"]),
                    vue.createElementVNode("button", {
                      class: "action-btn primary",
                      onClick: ($event) => handlePractice(item)
                    }, "练习", 8, ["onClick"]),
                    vue.createElementVNode("button", {
                      class: vue.normalizeClass(["action-btn", item.mastered === 1 ? "warning" : "success"]),
                      onClick: ($event) => handleToggleMastered(item)
                    }, vue.toDisplayString(item.mastered === 1 ? "标记未学会" : "标记已学会"), 11, ["onClick"])
                  ])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createElementVNode("view", { class: "load-more" }, [
            loadStatus.value === "loading" ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 0,
              class: "load-more-text"
            }, "加载中...")) : loadStatus.value === "noMore" ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 1,
              class: "load-more-text"
            }, "没有更多数据")) : (vue.openBlock(), vue.createElementBlock("text", {
              key: 2,
              class: "load-more-text load-more-more"
            }, "点击加载更多"))
          ]),
          vue.createCommentVNode(" 查看答案弹窗 "),
          answerVisible.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "modal",
            onClick: _cache[3] || (_cache[3] = ($event) => answerVisible.value = false)
          }, [
            vue.createElementVNode("view", {
              class: "modal-content",
              onClick: _cache[2] || (_cache[2] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("view", { class: "modal-header" }, [
                vue.createElementVNode("text", { class: "modal-title" }, "查看答案"),
                vue.createElementVNode("view", {
                  class: "modal-close",
                  onClick: _cache[0] || (_cache[0] = ($event) => answerVisible.value = false)
                }, [
                  vue.createElementVNode("text", { class: "close-icon" }, "✕")
                ])
              ]),
              viewingAnswer.value ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "answer-content"
              }, [
                vue.createElementVNode("view", { class: "question-type-tag" }, [
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString(typeText(viewingAnswer.value.type)),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode(
                  "text",
                  { class: "answer-question-text" },
                  vue.toDisplayString(viewingAnswer.value.content),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "answer-row" }, [
                  vue.createElementVNode("text", { class: "label" }, "错误答案："),
                  vue.createElementVNode(
                    "text",
                    { class: "value wrong" },
                    vue.toDisplayString(viewingAnswer.value.wrongAnswer || "未记录"),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "answer-row" }, [
                  vue.createElementVNode("text", { class: "label" }, "正确答案："),
                  vue.createElementVNode(
                    "text",
                    { class: "value correct" },
                    vue.toDisplayString(viewingAnswer.value.correctAnswer),
                    1
                    /* TEXT */
                  )
                ]),
                viewingAnswer.value.analysis ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "analysis"
                }, [
                  vue.createElementVNode("text", { class: "label" }, "解析："),
                  vue.createElementVNode(
                    "text",
                    { class: "value" },
                    vue.toDisplayString(viewingAnswer.value.analysis),
                    1
                    /* TEXT */
                  )
                ])) : vue.createCommentVNode("v-if", true)
              ])) : vue.createCommentVNode("v-if", true),
              vue.createElementVNode("view", { class: "modal-footer" }, [
                vue.createElementVNode("button", {
                  class: "close-btn",
                  onClick: _cache[1] || (_cache[1] = ($event) => answerVisible.value = false)
                }, "关闭")
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true),
          vue.createCommentVNode(" 练习弹窗 "),
          practiceVisible.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "modal",
            onClick: _cache[7] || (_cache[7] = ($event) => practiceVisible.value = false)
          }, [
            vue.createElementVNode("view", {
              class: "modal-content practice-content",
              onClick: _cache[6] || (_cache[6] = vue.withModifiers(() => {
              }, ["stop"]))
            }, [
              vue.createElementVNode("view", { class: "modal-header" }, [
                vue.createElementVNode("text", { class: "modal-title" }, "练习"),
                vue.createElementVNode("view", {
                  class: "modal-close",
                  onClick: _cache[4] || (_cache[4] = ($event) => practiceVisible.value = false)
                }, [
                  vue.createElementVNode("text", { class: "close-icon" }, "✕")
                ])
              ]),
              practicingItem.value ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "practice-body"
              }, [
                vue.createElementVNode("view", { class: "question-type-tag" }, [
                  vue.createElementVNode(
                    "text",
                    null,
                    vue.toDisplayString(isMultiChoice() ? "多选题" : typeText(practicingItem.value.type)),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode(
                  "text",
                  { class: "answer-question-text" },
                  vue.toDisplayString(practicingItem.value.content),
                  1
                  /* TEXT */
                ),
                practicingItem.value.options ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "options-list"
                }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList(parseOptions(practicingItem.value.options), (option, index) => {
                      return vue.openBlock(), vue.createElementBlock("view", {
                        key: index,
                        class: vue.normalizeClass(["option-item", { selected: userAnswer.value.includes(option.key), correct: showPracticeResult.value && isCorrectOption(option.key), wrong: showPracticeResult.value && isWrongOption(option.key) }]),
                        onClick: ($event) => selectOption(option.key)
                      }, [
                        vue.createElementVNode(
                          "text",
                          { class: "option-key" },
                          vue.toDisplayString(option.key),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode(
                          "text",
                          { class: "option-value" },
                          vue.toDisplayString(option.value),
                          1
                          /* TEXT */
                        )
                      ], 10, ["onClick"]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ])) : vue.createCommentVNode("v-if", true),
                showPracticeResult.value ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 1,
                  class: "practice-result"
                }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: vue.normalizeClass(["result-row", vue.unref(isAnswerCorrect) ? "correct" : "wrong"])
                    },
                    [
                      vue.createElementVNode(
                        "text",
                        { class: "result-icon" },
                        vue.toDisplayString(vue.unref(isAnswerCorrect) ? "✓" : "✗"),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "result-text" },
                        vue.toDisplayString(vue.unref(isAnswerCorrect) ? "回答正确！" : "回答错误"),
                        1
                        /* TEXT */
                      )
                    ],
                    2
                    /* CLASS */
                  ),
                  vue.createElementVNode("view", { class: "answer-row" }, [
                    vue.createElementVNode("text", { class: "label" }, "你的答案："),
                    vue.createElementVNode(
                      "text",
                      {
                        class: vue.normalizeClass(["value", vue.unref(isAnswerCorrect) ? "correct" : "wrong"])
                      },
                      vue.toDisplayString(formatAnswer(userAnswer.value)),
                      3
                      /* TEXT, CLASS */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "answer-row" }, [
                    vue.createElementVNode("text", { class: "label" }, "正确答案："),
                    vue.createElementVNode(
                      "text",
                      { class: "value correct" },
                      vue.toDisplayString(practicingItem.value.correctAnswer),
                      1
                      /* TEXT */
                    )
                  ]),
                  practicingItem.value.analysis ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "analysis"
                  }, [
                    vue.createElementVNode("text", { class: "label" }, "解析："),
                    vue.createElementVNode(
                      "text",
                      { class: "value" },
                      vue.toDisplayString(practicingItem.value.analysis),
                      1
                      /* TEXT */
                    )
                  ])) : vue.createCommentVNode("v-if", true)
                ])) : vue.createCommentVNode("v-if", true)
              ])) : vue.createCommentVNode("v-if", true),
              vue.createElementVNode("view", { class: "modal-footer" }, [
                !showPracticeResult.value ? (vue.openBlock(), vue.createElementBlock("button", {
                  key: 0,
                  class: "close-btn primary",
                  onClick: submitPractice
                }, "提交答案")) : (vue.openBlock(), vue.createElementBlock("button", {
                  key: 1,
                  class: "close-btn",
                  onClick: _cache[5] || (_cache[5] = ($event) => practiceVisible.value = false)
                }, "关闭"))
              ])
            ])
          ])) : vue.createCommentVNode("v-if", true)
        ]);
      };
    }
  };
  const PagesStudentWrongQuestions = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-352657ac"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/student/wrong-questions.vue"]]);
  const _sfc_main$1 = {
    __name: "statistics",
    setup(__props) {
      const userStore = useUserStore();
      const stats = vue.ref({
        totalExams: 0,
        avgScore: 0,
        correctCount: 0,
        wrongCount: 0,
        skippedCount: 0,
        passRate: 0
      });
      const subjectScores = vue.ref([]);
      const statItems = vue.computed(() => [
        {
          label: "总考试数",
          value: stats.value.totalExams,
          emoji: "📝",
          bgColor: "#667eea"
        },
        {
          label: "平均分",
          value: stats.value.avgScore,
          emoji: "⭐",
          bgColor: "#f56c6c"
        },
        {
          label: "通过率",
          value: stats.value.passRate + "%",
          emoji: "🏅",
          bgColor: "#67c23a"
        }
      ]);
      const totalAnswered = vue.computed(() => {
        return stats.value.correctCount + stats.value.wrongCount + stats.value.skippedCount;
      });
      const correctRate = vue.computed(() => {
        if (totalAnswered.value === 0)
          return 0;
        return Math.round(stats.value.correctCount / totalAnswered.value * 100);
      });
      const wrongRate = vue.computed(() => {
        if (totalAnswered.value === 0)
          return 0;
        return Math.round(stats.value.wrongCount / totalAnswered.value * 100);
      });
      const skippedRate = vue.computed(() => {
        if (totalAnswered.value === 0)
          return 0;
        return Math.round(stats.value.skippedCount / totalAnswered.value * 100);
      });
      const loadStatistics = async () => {
        var _a;
        try {
          const userId = (_a = userStore.userInfo) == null ? void 0 : _a.userId;
          if (!userId)
            return;
          const [statsRes, subjectRes] = await Promise.all([
            examRecordApi.getStudentStats(),
            examRecordApi.getStudentSubjectScores()
          ]);
          if (statsRes.code === 200) {
            const data = statsRes.data;
            stats.value = {
              totalExams: data.completedExams || 0,
              avgScore: data.averageScore || 0,
              correctCount: 0,
              wrongCount: data.wrongCount || 0,
              skippedCount: 0,
              passRate: 0
            };
          }
          if (subjectRes.code === 200) {
            subjectScores.value = subjectRes.data.map((subject, index) => ({
              ...subject,
              color: ["#409eff", "#67c23a", "#e6a23c", "#f56c6c", "#909399"][index % 5]
            }));
          }
        } catch (e) {
          formatAppLog("error", "at pages/student/statistics.vue:172", e);
          uni.showToast({
            title: "加载统计数据失败",
            icon: "none"
          });
        }
      };
      vue.onMounted(() => {
        loadStatistics();
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "statistics" }, [
          vue.createElementVNode("view", { class: "page-header" }, [
            vue.createElementVNode("text", { class: "title" }, "成绩分析"),
            vue.createElementVNode("text", { class: "subtitle" }, "查看您的学习数据分析")
          ]),
          vue.createCommentVNode(" 统计卡片 "),
          vue.createElementVNode("view", { class: "stat-grid" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(vue.unref(statItems), (item, index) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "stat-card",
                  key: index
                }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: "stat-icon",
                      style: vue.normalizeStyle({ background: item.bgColor })
                    },
                    [
                      vue.createElementVNode(
                        "text",
                        { class: "stat-emoji" },
                        vue.toDisplayString(item.emoji),
                        1
                        /* TEXT */
                      )
                    ],
                    4
                    /* STYLE */
                  ),
                  vue.createElementVNode("view", { class: "stat-info" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "stat-value" },
                      vue.toDisplayString(item.value),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "stat-label" },
                      vue.toDisplayString(item.label),
                      1
                      /* TEXT */
                    )
                  ])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createCommentVNode(" 科目成绩 "),
          vue.createElementVNode("view", { class: "card" }, [
            vue.createElementVNode("view", { class: "card-header" }, [
              vue.createElementVNode("text", { class: "card-title" }, "科目成绩")
            ]),
            vue.createElementVNode("view", { class: "subject-list" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(subjectScores.value, (subject) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "subject-item",
                    key: subject.subjectName
                  }, [
                    vue.createElementVNode("view", { class: "subject-info" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "subject-name" },
                        vue.toDisplayString(subject.subjectName),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "subject-exams" },
                        vue.toDisplayString(subject.examCount) + "次考试",
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("view", { class: "subject-score" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "score-value" },
                        vue.toDisplayString(subject.avgScore),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode("text", { class: "score-unit" }, "分")
                    ]),
                    vue.createElementVNode("view", { class: "score-bar" }, [
                      vue.createElementVNode(
                        "view",
                        {
                          class: "bar-fill",
                          style: vue.normalizeStyle({ width: subject.avgScore + "%", background: subject.color })
                        },
                        null,
                        4
                        /* STYLE */
                      )
                    ])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ]),
          vue.createCommentVNode(" 答题情况 "),
          vue.createElementVNode("view", { class: "card" }, [
            vue.createElementVNode("view", { class: "card-header" }, [
              vue.createElementVNode("text", { class: "card-title" }, "答题情况")
            ]),
            vue.createElementVNode("view", { class: "answer-stats" }, [
              vue.createElementVNode("view", { class: "answer-item" }, [
                vue.createElementVNode("view", { class: "answer-icon correct" }, [
                  vue.createElementVNode("text", { class: "answer-emoji" }, "✓")
                ]),
                vue.createElementVNode("view", { class: "answer-info" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "answer-count" },
                    vue.toDisplayString(stats.value.correctCount),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "answer-label" }, "答对题数")
                ]),
                vue.createElementVNode(
                  "text",
                  { class: "answer-rate" },
                  vue.toDisplayString(vue.unref(correctRate)) + "%",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "answer-item" }, [
                vue.createElementVNode("view", { class: "answer-icon wrong" }, [
                  vue.createElementVNode("text", { class: "answer-emoji" }, "✗")
                ]),
                vue.createElementVNode("view", { class: "answer-info" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "answer-count" },
                    vue.toDisplayString(stats.value.wrongCount),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "answer-label" }, "答错题数")
                ]),
                vue.createElementVNode(
                  "text",
                  { class: "answer-rate" },
                  vue.toDisplayString(vue.unref(wrongRate)) + "%",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "answer-item" }, [
                vue.createElementVNode("view", { class: "answer-icon skip" }, [
                  vue.createElementVNode("text", { class: "answer-emoji" }, "—")
                ]),
                vue.createElementVNode("view", { class: "answer-info" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "answer-count" },
                    vue.toDisplayString(stats.value.skippedCount),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "answer-label" }, "未答题数")
                ]),
                vue.createElementVNode(
                  "text",
                  { class: "answer-rate" },
                  vue.toDisplayString(vue.unref(skippedRate)) + "%",
                  1
                  /* TEXT */
                )
              ])
            ])
          ])
        ]);
      };
    }
  };
  const PagesStudentStatistics = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-508c3e4d"], ["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/pages/student/statistics.vue"]]);
  __definePage("pages/common/login", PagesCommonLogin);
  __definePage("pages/common/register", PagesCommonRegister);
  __definePage("pages/common/dashboard", PagesCommonDashboard);
  __definePage("pages/common/message", PagesCommonMessage);
  __definePage("pages/common/account", PagesCommonAccount);
  __definePage("pages/admin/user-manage", PagesAdminUserManage);
  __definePage("pages/admin/department-manage", PagesAdminDepartmentManage);
  __definePage("pages/admin/class-manage", PagesAdminClassManage);
  __definePage("pages/admin/log-manage", PagesAdminLogManage);
  __definePage("pages/admin/statistics", PagesAdminStatistics);
  __definePage("pages/teacher/my-classes", PagesTeacherMyClasses);
  __definePage("pages/teacher/class-chat", PagesTeacherClassChat);
  __definePage("pages/teacher/subject-manage", PagesTeacherSubjectManage);
  __definePage("pages/teacher/question-manage", PagesTeacherQuestionManage);
  __definePage("pages/teacher/paper-manage", PagesTeacherPaperManage);
  __definePage("pages/teacher/exam-manage", PagesTeacherExamManage);
  __definePage("pages/teacher/exam-record-manage", PagesTeacherExamRecordManage);
  __definePage("pages/teacher/exam-monitor", PagesTeacherExamMonitor);
  __definePage("pages/teacher/exam-edit", PagesTeacherExamEdit);
  __definePage("pages/teacher/paper-edit", PagesTeacherPaperEdit);
  __definePage("pages/teacher/paper-preview", PagesTeacherPaperPreview);
  __definePage("pages/teacher/exam-record-detail", PagesTeacherExamRecordDetail);
  __definePage("pages/teacher/exam-grade", PagesTeacherExamGrade);
  __definePage("pages/student/my-classes", PagesStudentMyClasses);
  __definePage("pages/student/class-chat", PagesStudentClassChat);
  __definePage("pages/student/exam-list", PagesStudentExamList);
  __definePage("pages/student/exam-take", PagesStudentExamTake);
  __definePage("pages/student/history", PagesStudentHistory);
  __definePage("pages/student/wrong-questions", PagesStudentWrongQuestions);
  __definePage("pages/student/statistics", PagesStudentStatistics);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:6", "App Launch");
      const token = uni.getStorageSync("token");
      if (token) {
        const userStore = useUserStore();
        userStore.getUserInfo();
      }
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:14", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:17", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/周超/Documents/大三下/J2EE/exam_pro/oes-uniapp/App.vue"]]);
  const pinia = createPinia();
  function createApp() {
    const app = vue.createVueApp(App);
    app.use(pinia);
    uni.onError((error) => {
      formatAppLog("error", "at main.js:24", "全局错误:", error);
    });
    uni.onNetworkStatusChange((res) => {
      formatAppLog("log", "at main.js:28", "网络状态变化:", res.isConnected, res.networkType);
    });
    return {
      app,
      pinia
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
