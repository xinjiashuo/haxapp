import { APP_CONFIG } from '../config/app'
import { request } from '../utils/request'
import { getToken } from '../utils/user-session'

export const submitRecommendation = (data) => request({ url: '/travel/submit', method: 'POST', data })

export const getTravelRecommendations = (limit = 12) => request({ url: '/travel/recommendations', method: 'GET', data: { limit } })

export const getTravelDetail = (targetType, targetId) => request({
  url: '/travel/detail',
  method: 'GET',
  data: { target_type: targetType, target_id: targetId }
})

export const planTravelRoute = (data) => request({ url: '/map/route-plan', method: 'POST', data })

export const getTravelItinerarySuggestions = (data) => request({ url: '/travel-itineraries/suggestions', method: 'POST', data })

export const saveTravelItinerary = (data) => request({ url: '/travel-itineraries/plan', method: 'POST', data })

export const getTravelItineraries = () => request({ url: '/travel-itineraries', method: 'GET' })

export const getTravelItinerary = (id) => request({ url: `/travel-itineraries/${id}`, method: 'GET' })

export const reorderTravelItinerary = (id, data) => request({ url: `/travel-itineraries/${id}/reorder`, method: 'POST', data })

export const moveTravelItineraryStop = (id, data) => request({ url: `/travel-itineraries/${id}/move-stop`, method: 'POST', data })

export const deleteTravelItinerary = (id) => request({ url: `/travel-itineraries/${id}/delete`, method: 'POST' })

export const toggleTravelLike = (data) => request({ url: '/travel/like', method: 'POST', data })

export const toggleTravelFavorite = (data) => request({ url: '/travel/favorite', method: 'POST', data })

export const submitTravelChild = (data) => request({
  url: data.item_type === 'checkin_point' ? '/travel/checkin-point' : '/travel/recommended-dish',
  method: 'POST',
  data
})

export const voteTravelChild = (data) => request({ url: '/travel/review-item/vote', method: 'POST', data })

export const uploadTravelImage = (filePath) => new Promise((resolve, reject) => {
  uni.uploadFile({
    url: `${APP_CONFIG.apiBaseUrl}/travel/upload`,
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
