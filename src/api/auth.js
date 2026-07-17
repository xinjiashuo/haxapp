import { APP_CONFIG } from '../config/app'
import { request } from '../utils/request'
import { getToken } from '../utils/user-session'

export const login = (data) => request({ url: '/auth/login', method: 'POST', data })
export const getProfile = () => request({ url: '/auth/profile', method: 'GET' })
export const updateProfile = (data) => request({ url: '/auth/profile', method: 'POST', data })
export const bindMobile = (data) => request({ url: '/auth/mobile-bind', method: 'POST', data: typeof data === 'string' ? { mobile: data } : data })
export const submitCertification = (data) => request({ url: '/auth/certification', method: 'POST', data })
export const logout = () => request({ url: '/auth/logout', method: 'POST' })

export const uploadCertificationImage = (filePath) => new Promise((resolve, reject) => {
  uni.uploadFile({
    url: `${APP_CONFIG.apiBaseUrl}/auth/certification/upload`,
    filePath,
    name: 'file',
    header: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    success: ({ statusCode, data }) => {
      let result = {}
      try { result = JSON.parse(data) } catch (error) { reject({ msg: '上传响应格式错误' }); return }
      if (statusCode >= 200 && statusCode < 300 && result.code === 0) { resolve(result.data); return }
      reject(result.msg ? result : { msg: '上传失败' })
    },
    fail: () => reject({ msg: '图片上传失败，请稍后重试' })
  })
})

export const uploadProfileAvatar = (filePath) => new Promise((resolve, reject) => {
  uni.uploadFile({
    url: `${APP_CONFIG.apiBaseUrl}/auth/profile/avatar`,
    filePath,
    name: 'file',
    header: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    success: ({ statusCode, data }) => {
      let result = {}
      try { result = JSON.parse(data) } catch (error) { reject({ msg: '上传响应格式错误' }); return }
      if (statusCode >= 200 && statusCode < 300 && result.code === 0) { resolve(result.data); return }
      reject(result.msg ? result : { msg: '头像上传失败' })
    },
    fail: () => reject({ msg: '头像上传失败，请稍后重试' })
  })
})
