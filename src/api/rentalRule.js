import { request } from '../utils/request'

export const getBookingRentalRules = () => request({
  url: '/rental-rules/booking',
  method: 'GET'
})
