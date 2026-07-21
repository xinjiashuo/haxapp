<template>
  <view class="page">
    <view class="top-bar" @click="goBack">取消</view>
    <view class="content">
      <view class="brand-mark">H</view>
      <text class="title">欢迎来到 Hax租车</text>
      <text class="subtitle">登录后即可预订车辆和管理行程</text>

      <button class="login-button" :loading="loading" @click="handleLogin">微信一键登录</button>
      <text class="agreement">登录即表示同意《用户协议》和《隐私政策》</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { login } from '../../api/auth'
import { saveSession } from '../../utils/user-session'

const loading = ref(false)

const getLoginCode = () => new Promise((resolve) => {
  uni.login({
    provider: 'weixin',
    success: (result) => resolve(result.code || ''),
    fail: () => resolve('')
  })
})

const handleLogin = async () => {
  if (loading.value) return
  loading.value = true

  try {
    // 登录仅交换微信临时凭证，资料授权在用户后续主动完善资料时再处理。
    const code = await getLoginCode()
    if (!code) {
      uni.showToast({ title: '未获取到微信登录凭证，请重新点击登录', icon: 'none' })
      return
    }
    const result = await login({
      platform: 'wechat',
      code
    })
    saveSession(result.data)
    if (!result.data.user?.profile_completed) uni.setStorageSync('hax_profile_prompt_after_login', '1')
    const redirect = uni.getStorageSync('hax_login_redirect') || '/pages/profile/index'
    uni.removeStorageSync('hax_login_redirect')
    uni.reLaunch({ url: redirect })
  } catch (error) {
    uni.showToast({ title: error.msg || '登录失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  uni.removeStorageSync('hax_login_redirect')
  uni.reLaunch({ url: '/pages/profile/index' })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #fff; }
.top-bar { padding: 42rpx 32rpx 22rpx; color: #6b7280; font-size: 28rpx; }
.content { display: flex; flex-direction: column; align-items: center; padding: 120rpx 56rpx 0; }
.brand-mark { display: flex; align-items: center; justify-content: center; width: 132rpx; height: 132rpx; border-radius: 12rpx; background: #1677ff; color: #fff; font-size: 64rpx; font-weight: 700; }
.title { margin-top: 46rpx; font-size: 42rpx; font-weight: 700; }
.subtitle { margin-top: 18rpx; color: #6b7280; font-size: 28rpx; }
.login-button { width: 100%; margin-top: 118rpx; border-radius: 6rpx; background: #1677ff; color: #fff; font-size: 30rpx; line-height: 94rpx; }
.agreement { margin-top: 28rpx; color: #9ca3af; font-size: 22rpx; }
</style>
