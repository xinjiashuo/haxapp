<template>
  <view class="app-state" :class="[`is-${type}`, { compact }]">
    <view class="state-mark"><text>{{ mark }}</text></view>
    <text class="state-title">{{ displayTitle }}</text>
    <text v-if="displayDescription" class="state-description">{{ displayDescription }}</text>
    <button v-if="actionText" class="state-action" @click="$emit('action')">{{ actionText }}</button>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'empty' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  actionText: { type: String, default: '' },
  compact: { type: Boolean, default: false }
})

defineEmits(['action'])

const presets = {
  loading: { mark: '...', title: '正在加载', description: '' },
  empty: { mark: '—', title: '暂无内容', description: '' },
  error: { mark: '!', title: '加载失败', description: '请检查网络后重试' },
  login: { mark: 'i', title: '登录后查看', description: '登录后可查看并管理相关信息' },
  review: { mark: 'i', title: '审核中', description: '审核完成后会通过消息通知你' },
  'no-slot': { mark: '—', title: '暂无可约时段', description: '请调整预约日期后再试' }
}

const preset = computed(() => presets[props.type] || presets.empty)
const mark = computed(() => preset.value.mark)
const displayTitle = computed(() => props.title || preset.value.title)
const displayDescription = computed(() => props.description || preset.value.description)
</script>

<style scoped>
.app-state{display:flex;box-sizing:border-box;min-height:330rpx;flex-direction:column;align-items:center;justify-content:center;padding:52rpx 42rpx;color:#64748b;text-align:center}.state-mark{display:flex;align-items:center;justify-content:center;width:74rpx;height:74rpx;border-radius:50%;background:#edf3fb;color:#7890aa;font-size:38rpx;font-weight:600}.is-error .state-mark{background:#fff1f0;color:#dd5a52}.is-login .state-mark,.is-review .state-mark{background:#eaf3ff;color:#1677ff}.state-title{margin-top:20rpx;color:#334155;font-size:29rpx;font-weight:600}.state-description{margin-top:10rpx;color:#94a3b8;font-size:23rpx;line-height:1.55}.state-action{min-width:168rpx;margin-top:24rpx;padding:0 24rpx;border:1rpx solid #9fc5f8;border-radius:6rpx;background:#fff;color:#1677ff;font-size:24rpx;line-height:60rpx}.state-action::after{border:0}.compact{min-height:190rpx;padding:28rpx 24rpx}.compact .state-mark{width:56rpx;height:56rpx;font-size:30rpx}.compact .state-title{margin-top:13rpx;font-size:26rpx}.compact .state-description{font-size:21rpx}.compact .state-action{margin-top:16rpx;line-height:54rpx}
</style>
