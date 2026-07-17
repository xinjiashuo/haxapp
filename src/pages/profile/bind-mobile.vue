<template>
  <view class="page">
    <view class="form-card">
      <!-- #ifdef MP-WEIXIN -->
      <text class="label">微信手机号授权</text>
      <text class="hint">授权后将自动绑定当前微信手机号</text>
      <button class="submit-button" open-type="getPhoneNumber" :loading="loading" @getphonenumber="bindWechatMobile">微信授权绑定手机号</button>
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <text class="label">手机号</text>
      <input v-model="mobile" class="mobile-input" type="number" maxlength="11" placeholder="请输入手机号" />
      <button class="submit-button" :loading="loading" @click="submitManual">确认绑定</button>
      <!-- #endif -->
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { bindMobile } from '../../api/auth'
import { saveUser } from '../../utils/user-session'

const mobile = ref('')
const loading = ref(false)

const saveBinding = async (data) => {
  loading.value = true
  try {
    const result = await bindMobile(data)
    saveUser(result.data.user)
    uni.showToast({ title: '绑定成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 250)
  } catch (error) {
    uni.showToast({ title: error.msg || '绑定失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const submitManual = async () => {
  if (!/^1[3-9]\d{9}$/.test(mobile.value)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  await saveBinding({ mobile: mobile.value })
}

const bindWechatMobile = async (event) => {
  const code = event.detail?.code || ''
  if (!code) {
    uni.showToast({ title: '未完成手机号授权', icon: 'none' })
    return
  }
  await saveBinding({ phone_code: code })
}
</script>

<style scoped>
.page { min-height: 100vh; padding: 32rpx; }
.form-card { padding: 32rpx; border-radius: 8rpx; background: #fff; }
.label { display: block; color: #374151; font-size: 28rpx; font-weight: 600; }
.hint { display: block; margin-top: 18rpx; color: #6b7280; font-size: 24rpx; line-height: 1.6; }
.mobile-input { height: 92rpx; margin-top: 24rpx; padding: 0 20rpx; border: 1rpx solid #d1d5db; border-radius: 6rpx; font-size: 30rpx; }
.submit-button { margin-top: 36rpx; border-radius: 6rpx; background: #1677ff; color: #fff; font-size: 30rpx; line-height: 88rpx; }
</style>
