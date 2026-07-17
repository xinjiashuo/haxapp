import { request } from '../utils/request'

export const getServices = () => request({
  url: '/services',
  method: 'GET'
})
export const getServiceQuote = (data = {}) => request({ url: '/services/quote', method: 'GET', data })
export const getServiceAvailability = (data = {}) => request({ url: '/services/availability', method: 'GET', data })

export const createServiceOrder = (data) => request({
  url: '/services/orders',
  method: 'POST',
  data
})

export const getServiceOrders = (data = {}) => request({
  url: '/services/orders',
  method: 'GET',
  data
})

export const getServiceOrder = (id) => request({
  url: `/services/orders/${id}`,
  method: 'GET'
})

export const getServiceVerificationCode = (id) => request({
  url: `/services/orders/${id}/verification-code`,
  method: 'GET'
})

export const payServiceOrder = (id, platform = 'wechat') => request({
  url: `/services/orders/${id}/pay`,
  method: 'POST',
  data: { platform }
})

export const confirmServiceQuote = (id) => request({ url: `/services/orders/${id}/confirm-quote`, method: 'POST' })

export const rescheduleServiceOrder = (id, data) => request({
  url: `/services/orders/${id}/reschedule`,
  method: 'POST',
  data
})

export const cancelServiceOrder = (id, reason = '用户取消预约') => request({
  url: `/services/orders/${id}/cancel`,
  method: 'POST',
  data: { reason }
})
