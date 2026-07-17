<template>
  <view class="bottom-nav">
    <view class="nav-shell">
      <view v-for="item in leftTabs" :key="item.key" class="nav-item" :class="{ active: active === item.key }" @click="navigate(item)">
        <view class="nav-mark" :class="item.key"></view>
        <text>{{ item.label }}</text>
      </view>
      <view class="moment-slot">
        <view class="moment-button" :class="{ active: active === 'moment' }" @click="navigate(momentTab)"><text>+</text></view>
        <text class="moment-label" :class="{ active: active === 'moment' }">旅记</text>
      </view>
      <view v-for="item in rightTabs" :key="item.key" class="nav-item" :class="{ active: active === item.key }" @click="navigate(item)">
        <view class="nav-mark" :class="item.key"></view>
        <text>{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted } from 'vue'

const props = defineProps({ active: { type: String, required: true } })

const leftTabs = [
  { key: 'travel', label: '游玩', path: '/pages/index/index' },
  { key: 'car', label: '租车', path: '/pages/car/list' }
]
const momentTab = { key: 'moment', label: '旅记', path: '/pages/moment/index' }
const rightTabs = [
  { key: 'service', label: '服务', path: '/pages/service/index' },
  { key: 'profile', label: '我的', path: '/pages/profile/index' }
]

const navigate = (item) => {
  if (props.active === item.key) return
  uni.reLaunch({ url: item.path })
}

onMounted(() => {
  // #ifdef MP-WEIXIN
  uni.hideTabBar({ animation: false })
  // #endif
  // #ifdef MP-TOUTIAO
  uni.hideTabBar({ animation: false })
  // #endif
})
</script>

<style scoped>
.bottom-nav { position: fixed; right: 0; bottom: 0; left: 0; z-index: 99; height: var(--hax-bottom-nav-height, calc(122rpx + env(safe-area-inset-bottom))); box-sizing: border-box; background: #fff; box-shadow: 0 -4rpx 20rpx rgba(15, 23, 42, .08); }
.nav-shell { display: flex; align-items: flex-end; height: var(--hax-bottom-nav-height, calc(122rpx + env(safe-area-inset-bottom))); padding-bottom: env(safe-area-inset-bottom); box-sizing: border-box; }
.nav-item, .moment-slot { position: relative; display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: flex-end; height: 122rpx; color: #7b8794; font-size: 21rpx; }
.nav-item.active { color: #1677ff; font-weight: 600; }
.nav-mark { position: relative; width: 33rpx; height: 33rpx; margin-bottom: 9rpx; border: 3rpx solid currentColor; border-radius: 5rpx; color: #7b8794; }
.nav-item.active .nav-mark { color: #1677ff; }
.nav-mark.travel { border-radius: 50% 50% 6rpx 6rpx; }.nav-mark.travel::after { position: absolute; right: 8rpx; bottom: 4rpx; width: 10rpx; height: 10rpx; border: 3rpx solid currentColor; border-radius: 50%; content: ''; }
.nav-mark.car { width: 39rpx; height: 20rpx; margin-bottom: 15rpx; border-radius: 8rpx 8rpx 5rpx 5rpx; }.nav-mark.car::before, .nav-mark.car::after { position: absolute; bottom: -8rpx; width: 8rpx; height: 8rpx; border: 3rpx solid currentColor; border-radius: 50%; background: #fff; content: ''; }.nav-mark.car::before { left: 2rpx; }.nav-mark.car::after { right: 2rpx; }
.nav-mark.order { border-radius: 4rpx; }.nav-mark.order::after { position: absolute; top: 7rpx; left: 7rpx; width: 14rpx; height: 3rpx; background: currentColor; box-shadow: 0 8rpx 0 currentColor; content: ''; }
.nav-mark.service { width: 27rpx; height: 27rpx; margin-bottom: 12rpx; border-radius: 50%; }.nav-mark.service::before { position: absolute; top: -9rpx; left: 8rpx; width: 6rpx; height: 42rpx; border-radius: 4rpx; background: currentColor; transform: rotate(45deg); content: ''; }.nav-mark.service::after { position: absolute; right: -8rpx; bottom: -5rpx; width: 12rpx; height: 12rpx; border: 3rpx solid currentColor; border-radius: 50%; background: #fff; content: ''; }
.nav-mark.profile { border-radius: 50%; }.nav-mark.profile::after { position: absolute; right: 4rpx; bottom: -12rpx; left: 4rpx; height: 13rpx; border: 3rpx solid currentColor; border-bottom: 0; border-radius: 16rpx 16rpx 0 0; background: #fff; content: ''; }
.moment-slot { justify-content: flex-end; }.moment-button { position: absolute; top: -38rpx; display: flex; align-items: center; justify-content: center; width: 94rpx; height: 94rpx; border: 8rpx solid #fff; border-radius: 50%; background: #12b886; box-shadow: 0 8rpx 18rpx rgba(18, 184, 134, .28); color: #fff; font-size: 58rpx; font-weight: 300; line-height: 1; }.moment-button.active { background: #0f9f75; }.moment-label { margin-top: 0; color: #7b8794; font-size: 21rpx; }.moment-label.active { color: #0f9f75; font-weight: 600; }
</style>
