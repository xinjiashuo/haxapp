const TOKEN_KEY = 'hax_user_token'
const USER_KEY = 'hax_user_profile'

export const getToken = () => uni.getStorageSync(TOKEN_KEY) || ''
export const getUser = () => uni.getStorageSync(USER_KEY) || null

export const saveSession = ({ token, user }) => {
  uni.setStorageSync(TOKEN_KEY, token)
  uni.setStorageSync(USER_KEY, user)
}

export const saveUser = (user) => uni.setStorageSync(USER_KEY, user)

export const clearSession = () => {
  uni.removeStorageSync(TOKEN_KEY)
  uni.removeStorageSync(USER_KEY)
}
