import { request } from '../utils/request'
import { APP_CONFIG } from '../config/app'

export const getFeedbacks = () => request({ url: '/feedback', method: 'GET' })
export const createFeedback = (data) => request({ url: '/feedback', method: 'POST', data })

export const uploadFeedbackImage = (filePath) => new Promise((resolve, reject) => {
  const token = uni.getStorageSync('hax_user_token')
  uni.uploadFile({
    url: `${APP_CONFIG.apiBaseUrl}/feedback/upload`, filePath, name: 'file',
    header: token ? { Authorization: `Bearer ${token}` } : {},
    success: (response) => {
      try { const data = JSON.parse(response.data); data.code === 0 ? resolve(data.data?.url) : reject(data) } catch (_) { reject({ msg: '上传失败' }) }
    },
    fail: () => reject({ msg: '上传失败' })
  })
})
