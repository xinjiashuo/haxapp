import { APP_CONFIG } from '../config/app'
import { request } from '../utils/request'
import { getToken } from '../utils/user-session'

export const getMomentFeed = (params = {}) => request({ url: '/travel-moments/feed', method: 'GET', data: { page: 1, limit: 10, ...params } })
export const getMyMoments = (status = '', page = 1) => request({ url: '/travel-moments/mine', method: 'GET', data: { status, page, limit: 10 } })
export const getMomentTags = () => request({ url: '/travel-moments/tags', method: 'GET' })
export const getMomentTargets = () => request({ url: '/travel-moments/targets', method: 'GET' })
export const getMomentDrafts = () => request({ url: '/travel-moments/drafts', method: 'GET' })
export const saveMomentDraft = (data) => request({ url: '/travel-moments/save-draft', method: 'POST', data })
export const deleteMomentDraft = (id) => request({ url: '/travel-moments/delete-draft', method: 'POST', data: { id } })
export const getMomentCheckins = (targetType, targetId) => request({ url: '/travel-moments/checkins', method: 'GET', data: { target_type: targetType, target_id: targetId } })
export const submitMomentCheckin = (data) => request({ url: '/travel-moments/checkin', method: 'POST', data })
export const publishMoment = (data) => request({ url: '/travel-moments/publish', method: 'POST', data })
export const deleteMyMoment = (id) => request({ url: '/travel-moments/delete', method: 'POST', data: { id } })
export const reportMomentContent = (data) => request({ url: '/travel-moments/report', method: 'POST', data })
export const getMomentReports = () => request({ url: '/travel-moments/reports', method: 'GET' })
export const getMomentComments = (id) => request({ url: `/travel-moments/comments/${id}`, method: 'GET' })
export const publishMomentComment = (data) => request({ url: '/travel-moments/comment', method: 'POST', data })
export const toggleMomentLike = (postId) => request({ url: '/travel-moments/like', method: 'POST', data: { post_id: postId } })
export const toggleMomentFavorite = (postId) => request({ url: '/travel-moments/favorite', method: 'POST', data: { post_id: postId } })

export const uploadMomentImage = (filePath) => new Promise((resolve, reject) => {
  uni.uploadFile({
    url: `${APP_CONFIG.apiBaseUrl}/travel-moments/upload`,
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
