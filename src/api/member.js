import { request } from '../utils/request'

export const getMemberOverview = () => request({ url: '/member/overview', method: 'GET' })
export const getPoints = (data = {}) => request({ url: '/member/points', method: 'GET', data })
export const getCoupons = (status = 'unused') => request({ url: '/member/coupons', method: 'GET', data: { status } })
export const getCouponCenter = () => request({ url: '/member/coupon-center', method: 'GET' })
export const receiveCoupon = (id) => request({ url: `/member/coupons/${id}/receive`, method: 'POST' })
