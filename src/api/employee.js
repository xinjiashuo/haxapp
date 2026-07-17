import { APP_CONFIG } from '../config/app'
import { request } from '../utils/request'
import { getToken } from '../utils/user-session'

export const getEmployeeWorkbench = () => request({ url: '/employee/workbench', method: 'GET' })
export const getRentalTasks = () => request({ url: '/employee/rental-tasks', method: 'GET' })
export const claimRental = (id) => request({ url: `/employee/rental-orders/${id}/claim`, method: 'POST' })
export const submitRentalInspection = (id, data) => request({ url: `/employee/rental-orders/${id}/inspection`, method: 'POST', data })
export const getServiceTasks = () => request({ url: '/employee/service-tasks', method: 'GET' })
export const getEmployeeInventoryItems = () => request({ url: '/employee/inventory-items', method: 'GET' })
export const verifyServiceOrder = (payload) => request({ url: '/employee/service-orders/verify', method: 'POST', data: { payload } })
export const completeServiceOrder = (id, data) => request({ url: `/employee/service-orders/${id}/complete`, method: 'POST', data })
export const quoteServiceOrder = (id, data) => request({ url: `/employee/service-orders/${id}/quote`, method: 'POST', data })

export const uploadEmployeeMedia = (filePath) => new Promise((resolve, reject) => {
  uni.uploadFile({
    url: `${APP_CONFIG.apiBaseUrl}/employee/upload`, filePath, name: 'file',
    header: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    success: ({ statusCode, data }) => {
      let result = {}
      try { result = JSON.parse(data) } catch (_) { reject({ msg: '上传响应格式错误' }); return }
      if (statusCode >= 200 && statusCode < 300 && result.code === 0) { resolve(result.data); return }
      reject(result.msg ? result : { msg: '上传失败' })
    },
    fail: () => reject({ msg: '文件上传失败' })
  })
})
