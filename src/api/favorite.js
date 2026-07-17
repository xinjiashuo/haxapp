import { request } from '../utils/request'

export const getTravelFavorites = (contentType) => request({ url: '/travel-favorites/travel', method: 'GET', data: { content_type: contentType } })
export const getMomentFavorites = () => request({ url: '/travel-favorites/moments', method: 'GET' })
