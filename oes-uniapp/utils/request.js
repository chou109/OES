/**
 * UniApp请求封装
 * 替代axios，使用uni.request
 */

// API基础URL配置
// 在H5环境下使用代理，其他环境直接使用服务器地址
// #ifndef H5
const BASE_URL = 'http://192.168.1.92:8081/api' // 替换为你的电脑IP地址
// const BASE_URL = 'http://192.168.34.49:8081/api' 
// #endif

/**
 * 请求拦截器
 * @param {Object} config - 请求配置
 */
const requestInterceptor = (config) => {
  console.log('请求拦截器 - 原始配置:', JSON.stringify(config))

  // 确保 config 和 header 对象存在
  if (!config) {
    config = {}
  }

  if (!config.header || typeof config.header !== 'object') {
    config.header = {}
  }

  // 获取token
  const token = uni.getStorageSync('token')
  if (token) {
    config.header['Authorization'] = `Bearer ${token}`
  }

  // 设置Content-Type
  if (!config.header['Content-Type']) {
    config.header['Content-Type'] = 'application/json;charset=UTF-8'
  }

  console.log('请求拦截器 - 处理后配置:', JSON.stringify(config))

  // 添加防缓存头
  config.header['Cache-Control'] = 'no-cache, no-store, must-revalidate'
  config.header['Pragma'] = 'no-cache'

  // GET请求添加时间戳防止缓存
  if (config.method === 'GET') {
    config.data = {
      ...config.data,
      _t: Date.now()
    }
  }

  return config
}

/**
 * 响应拦截器
 * @param {Object} response - 响应数据
 * @param {Object} config - 原请求配置
 */
const responseInterceptor = (response, config) => {
  const { statusCode, data } = response

  // 成功响应
  if (statusCode === 200) {
    return data
  }

  // 错误处理
  handleError(statusCode, data)
  return Promise.reject(response)
}

/**
 * 错误处理
 * @param {Number} statusCode - 状态码
 * @param {Object} data - 响应数据
 */
const handleError = (statusCode, data) => {
  switch (statusCode) {
    case 401:
      // 登录过期，清除状态并跳转登录页
      uni.removeStorageSync('token')
      uni.showToast({
        title: '登录已过期',
        icon: 'none'
      })
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/common/login'
        })
      }, 1500)
      break
    case 403:
      uni.showToast({
        title: '没有权限访问',
        icon: 'none'
      })
      break
    case 404:
      uni.showToast({
        title: '请求的资源不存在',
        icon: 'none'
      })
      break
    case 500:
      uni.showToast({
        title: '服务器错误',
        icon: 'none'
      })
      break
    default:
      uni.showToast({
        title: data?.message || '请求失败',
        icon: 'none'
      })
  }
}

/**
 * 统一请求方法
 * @param {Object} options - 请求选项
 * @returns {Promise}
 */
const request = (options) => {
  // 处理请求拦截
  options = requestInterceptor(options)

  // 设置基础URL
  options.url = BASE_URL + options.url

  // 设置超时时间
  options.timeout = options.timeout || 60000

  // 返回Promise
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      success: (response) => {
        try {
          const result = responseInterceptor(response, options)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      },
      fail: (error) => {
        // 网络错误处理
        if (error.errMsg === 'request:fail') {
          uni.showToast({
            title: '网络连接失败',
            icon: 'none'
          })
        } else {
          uni.showToast({
            title: '请求失败',
            icon: 'none'
          })
        }
        reject(error)
      }
    })
  })
}

/**
 * GET请求
 * @param {String} url - 请求路径
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他选项
 */
export const get = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  })
}

/**
 * POST请求
 * @param {String} url - 请求路径
 * @param {Object} data - 请求体
 * @param {Object} options - 其他选项
 */
export const post = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  })
}

/**
 * PUT请求
 * @param {String} url - 请求路径
 * @param {Object} data - 请求体
 * @param {Object} options - 其他选项
 */
export const put = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

/**
 * DELETE请求
 * @param {String} url - 请求路径
 * @param {Object} data - 请求参数
 * @param {Object} options - 其他选项
 */
export const del = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}

/**
 * 上传文件
 * @param {String} url - 上传路径
 * @param {String} filePath - 文件路径
 * @param {Object} formData - 表单数据
 */
export const upload = (url, filePath, formData = {}) => {
  const token = uni.getStorageSync('token')

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + url,
      filePath,
      name: 'file',
      formData,
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (response) => {
        if (response.statusCode === 200) {
          try {
            const data = JSON.parse(response.data)
            resolve(data)
          } catch (e) {
            resolve(response.data)
          }
        } else {
          handleError(response.statusCode, response.data)
          reject(response)
        }
      },
      fail: (error) => {
        uni.showToast({
          title: '上传失败',
          icon: 'none'
        })
        reject(error)
      }
    })
  })
}

export default request