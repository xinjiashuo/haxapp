import { APP_CONFIG } from '../config/app'
import { clearSession } from './user-session'

let redirectingToLogin = false

const currentPageUrl = () => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (!page?.route || page.route === 'pages/login/index') return ''
  const query = Object.entries(page.options || {})
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
  return `/${page.route}${query ? `?${query}` : ''}`
}

const handleLoginExpired = () => {
  clearSession()
  const redirect = currentPageUrl()
  if (redirect) uni.setStorageSync('hax_login_redirect', redirect)
  if (redirectingToLogin || !redirect) return
  redirectingToLogin = true
  uni.showToast({ title: '登录已失效，请重新登录', icon: 'none' })
  uni.reLaunch({
    url: '/pages/login/index',
    complete: () => setTimeout(() => { redirectingToLogin = false }, 500)
  })
}

const normalizeError = (data = {}, statusCode = 0, fallback = '请求失败') => {
  const code = Number(data.code || statusCode || 1)
  const isAuth = code === 401 || statusCode === 401
  return {
    ...data,
    code,
    msg: data.msg || fallback,
    type: isAuth ? 'auth' : (statusCode === 0 ? 'network' : 'business'),
    retryable: !isAuth && (statusCode === 0 || statusCode >= 500)
  }
}

export const request = (options) => {
  const token = uni.getStorageSync('hax_user_token')

  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: `${APP_CONFIG.apiBaseUrl}${options.url}`,
      header: {
        ...(options.header || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success: (response) => {
        const data = response.data || {}
        if (response.statusCode >= 200 && response.statusCode < 300 && data.code === 0) {
          resolve(data)
          return
        }
        const error = normalizeError(data, response.statusCode)
        if (error.type === 'auth') handleLoginExpired()
        reject(error)
      },
      fail: () => reject(normalizeError({}, 0, '网络连接失败，请稍后重试'))
    })
  })
}
