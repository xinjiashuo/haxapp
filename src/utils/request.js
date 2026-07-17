import { APP_CONFIG } from '../config/app'

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
        reject(data.msg ? data : { msg: '请求失败' })
      },
      fail: () => reject({ msg: '网络连接失败，请稍后重试' })
    })
  })
}
