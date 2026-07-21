import { request } from '../utils/request'
import { APP_CONFIG } from '../config/app'

export const createOrderReview = (data) => request({ url: '/order-reviews', method: 'POST', data })
export const followUpOrderReview = (id, data) => request({ url: `/order-reviews/${id}/follow-up`, method: 'POST', data })
export const hideOrderReview = (id) => request({ url: `/order-reviews/${id}/hide`, method: 'POST' })
export const appealOrderReview = (id, data) => request({ url: `/order-reviews/${id}/appeal`, method: 'POST', data })

export const uploadOrderReviewImage = (filePath) => new Promise((resolve, reject) => {
  const token = uni.getStorageSync('hax_user_token')
  uni.uploadFile({
    url: `${APP_CONFIG.apiBaseUrl}/order-reviews/upload`,
    filePath,
    name: 'file',
    header: token ? { Authorization: `Bearer ${token}` } : {},
    success: (response) => {
      try {
        const data = JSON.parse(response.data)
        data.code === 0 ? resolve(data.data?.url) : reject(data)
      } catch (_) { reject({ msg: '上传失败' }) }
    },
    fail: () => reject({ msg: '上传失败' })
  })
})
