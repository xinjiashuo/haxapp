import { request } from '../utils/request'

export const getMessages = (data = {}) => request({ url: '/messages', method: 'GET', data })
export const readMessage = (id) => request({ url: `/messages/${id}/read`, method: 'POST' })
export const readAllMessages = () => request({ url: '/messages/read-all', method: 'POST' })
export const getWechatMessageTemplates = () => request({ url: '/messages/wechat-templates', method: 'GET' })
