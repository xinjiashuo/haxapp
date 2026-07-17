import { request } from '../utils/request'

export const getStoreProfile = () => request({ url: '/store-config/profile', method: 'GET' })
