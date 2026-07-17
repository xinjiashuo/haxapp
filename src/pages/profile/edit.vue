<template>
  <view class="page">
    <view class="page-head">
      <text class="page-title">完善个人资料</text>
      <text class="page-subtitle">头像和昵称将用于旅记、评论等公开内容展示</text>
    </view>

    <view class="form-card">
      <view class="avatar-field">
        <text class="field-label">头像</text>
        <button class="avatar-picker" open-type="chooseAvatar" @chooseavatar="chooseAvatar">
          <view class="avatar-circle">
            <image v-if="avatarPreview" :src="avatarPreview" mode="aspectFill" />
            <text v-else>{{ nickname.slice(0, 1) || '微' }}</text>
          </view>
          <text class="avatar-edit">更换头像</text>
        </button>
      </view>
      <view class="field-row">
        <text class="field-label">昵称</text>
        <input v-model.trim="nickname" class="nickname-input" type="nickname" maxlength="24" placeholder="请输入昵称" confirm-type="done" />
      </view>
    </view>

    <view class="notice">昵称和头像仅用于小程序内的公开互动展示，可随时在此修改。</view>
    <button class="save-button" :loading="saving" @click="save">保存资料</button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getProfile, updateProfile, uploadProfileAvatar } from '../../api/auth'
import { clearSession, getToken, getUser, saveUser } from '../../utils/user-session'

const user = ref(getUser())
const nickname = ref(user.value?.nickname === '微信用户' ? '' : (user.value?.nickname || ''))
const avatarPreview = ref(user.value?.avatar_url || '')
const avatarPath = ref('')
const saving = ref(false)

const loadProfile = async () => {
  if (!getToken()) {
    uni.redirectTo({ url: '/pages/login/index' })
    return
  }
  try {
    const result = await getProfile()
    user.value = result.data.user
    nickname.value = user.value.nickname === '微信用户' ? '' : user.value.nickname
    avatarPreview.value = user.value.avatar_url || ''
    saveUser(user.value)
  } catch (error) {
    clearSession()
    uni.redirectTo({ url: '/pages/login/index' })
  }
}

const chooseAvatar = async ({ detail }) => {
  const filePath = detail?.avatarUrl || ''
  if (!filePath) {
    uni.showToast({ title: '未获取到头像，请重新选择', icon: 'none' })
    return
  }
  uni.showLoading({ title: '上传头像' })
  try {
    const result = await uploadProfileAvatar(filePath)
    avatarPath.value = result.url || ''
    avatarPreview.value = result.absolute_url || result.static_url || result.url || ''
  } catch (error) {
    uni.showToast({ title: error.msg || '头像上传失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const save = async () => {
  if (saving.value) return
  if (!nickname.value || nickname.value === '微信用户') {
    uni.showToast({ title: '请填写个人昵称', icon: 'none' })
    return
  }
  if (!avatarPreview.value) {
    uni.showToast({ title: '请选择头像', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const result = await updateProfile({ nickname: nickname.value, ...(avatarPath.value ? { avatar_url: avatarPath.value } : {}) })
    user.value = result.data.user
    saveUser(user.value)
    uni.showToast({ title: '资料已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 350)
  } catch (error) {
    if (error.code === 401) {
      clearSession()
      uni.redirectTo({ url: '/pages/login/index' })
      return
    }
    uni.showToast({ title: error.msg || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onLoad(loadProfile)
</script>

<style scoped>
.page { min-height: 100vh; padding: 34rpx 32rpx 64rpx; box-sizing: border-box; }
.page-head { padding: 12rpx 0 28rpx; }.page-title { display: block; color: #111827; font-size: 40rpx; font-weight: 700; }.page-subtitle { display: block; margin-top: 12rpx; color: #6b7280; font-size: 24rpx; line-height: 1.6; }
.form-card { overflow: hidden; border-radius: 8rpx; background: #fff; }.avatar-field, .field-row { display: flex; align-items: center; min-height: 128rpx; margin: 0 24rpx; border-bottom: 1rpx solid #eef2f6; }.field-row { min-height: 98rpx; border-bottom: 0; }.field-label { flex: 0 0 148rpx; color: #374151; font-size: 28rpx; }.avatar-picker { display: flex; align-items: center; justify-content: flex-start; width: 224rpx; height: 96rpx; margin: 0; padding: 0; background: transparent; color: #1677ff; text-align: left; }.avatar-picker::after { border: 0; }.avatar-circle { display: flex; align-items: center; justify-content: center; width: 88rpx; height: 88rpx; overflow: hidden; border-radius: 50%; background: #dbeafe; color: #1677ff; font-size: 34rpx; font-weight: 700; }.avatar-circle image { width: 88rpx; height: 88rpx; border-radius: 50%; }.avatar-edit { margin-left: 16rpx; color: #1677ff; font-size: 23rpx; font-weight: 400; }.nickname-input { flex: 1; height: 94rpx; color: #111827; font-size: 27rpx; }.nickname-input::placeholder { color: #9ca3af; }.notice { margin-top: 22rpx; color: #8a94a6; font-size: 22rpx; line-height: 1.6; }.save-button { margin-top: 46rpx; border-radius: 8rpx; background: #1677ff; color: #fff; font-size: 30rpx; line-height: 88rpx; }.save-button::after { border: 0; }
</style>
