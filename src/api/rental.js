import { request } from '../utils/request'
import { APP_CONFIG } from '../config/app'

export const getRentalCars = (data = {}) => request({
  url: '/rental/cars',
  method: 'GET',
  data
})

export const getRentalQuote = (data = {}) => request({
  url: '/rental/quote',
  method: 'GET',
  data
})

export const createRentalOrder = (data) => request({
  url: '/rental/orders',
  method: 'POST',
  data
})

export const payRentalOrder = (id, platform = 'wechat') => request({
  url: `/rental/orders/${id}/pay`,
  method: 'POST',
  data: { platform }
})

export const payRentalDeposit = (id, platform = 'wechat') => request({
  url: `/rental/orders/${id}/pay-deposit`,
  method: 'POST',
  data: { platform }
})

export const prepareRentalCreditDeposit = (id, provider) => request({
  url: `/rental/orders/${id}/credit-deposit`,
  method: 'POST',
  data: { provider }
})

export const confirmRentalMockPayment = (paymentId, platform = 'wechat') => request({
  url: '/payment/mock-callback',
  method: 'POST',
  data: { payment_id: paymentId, platform }
})

export const getRentalOrders = (data = {}) => request({
  url: '/rental/orders',
  method: 'GET',
  data
})

export const getRentalOrder = (id) => request({
  url: `/rental/orders/${id}`,
  method: 'GET'
})

export const cancelRentalOrder = (id, reason = '用户取消订单') => request({
  url: `/rental/orders/${id}/cancel`,
  method: 'POST',
  data: { reason }
})

export const confirmRentalInspection = (id, data) => request({
  url: `/rental/inspections/${id}/confirm`, method: 'POST', data
})

export const disputeRentalInspection = (id, reason, evidence = [], contentHash = '') => request({
  url: `/rental/inspections/${id}/dispute`, method: 'POST', data: { reason, evidence, content_hash: contentHash }
})

export const confirmRentalContract = (id, data) => request({
  url: `/rental/contracts/${id}/sign`, method: 'POST', data
})

export const confirmRentalSettlement = (id, data) => request({
  url: `/rental/settlements/${id}/confirm`, method: 'POST', data
})

export const disputeRentalSettlement = (id, reason, evidence = []) => request({
  url: `/rental/settlements/${id}/dispute`, method: 'POST', data: { reason, evidence }
})

export const payRentalSettlement = (id, platform = 'wechat') => request({
  url: `/rental/settlements/${id}/pay`, method: 'POST', data: { platform }
})

export const uploadRentalEvidence = (filePath) => new Promise((resolve, reject) => {
  const token = uni.getStorageSync('hax_user_token')
  uni.uploadFile({
    url: `${APP_CONFIG.apiBaseUrl}/rental/evidence/upload`, filePath, name: 'file',
    header: token ? { Authorization: `Bearer ${token}` } : {},
    success: (response) => { try { const data = JSON.parse(response.data); data.code === 0 ? resolve(data.data?.url) : reject(data) } catch (_) { reject({ msg: '上传失败' }) } },
    fail: () => reject({ msg: '上传失败' })
  })
})
