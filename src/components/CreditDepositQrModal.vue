<template>
  <view v-if="modelValue" class="mask" @click.self="close">
    <view class="dialog">
      <text class="title">支付宝信用免押</text>
      <text class="subtitle">请使用支付宝扫描二维码完成信用授权</text>
      <view class="qr-wrap"><view class="qr-grid"><view v-for="(dark, index) in qrCells" :key="index" class="qr-cell" :class="{ dark }"></view></view></view>
      <text class="amount">本次免押金额 ¥{{ money(amount) }}</text>
      <text class="order-no">订单服务码：{{ orderNo || '--' }}</text>
      <text class="hint">当前为固定二维码占位。接入支付宝后将替换为该订单的实时授权二维码。</text>
      <button class="close-button" @click="close">我知道了</button>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ modelValue: Boolean, orderNo: String, amount: [String, Number] })
const emit = defineEmits(['update:modelValue'])
const inFinder = (row, column, top, left) => {
  const r = row - top
  const c = column - left
  if (r < 0 || r > 6 || c < 0 || c > 6) return false
  return r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)
}
const qrCells = computed(() => Array.from({ length: 441 }, (_, index) => {
  const row = Math.floor(index / 21)
  const column = index % 21
  if (inFinder(row, column, 0, 0) || inFinder(row, column, 0, 14) || inFinder(row, column, 14, 0)) return true
  if ((row < 8 && column < 8) || (row < 8 && column > 12) || (row > 12 && column < 8)) return false
  return (row * 13 + column * 7 + row * column) % 5 < 2
}))
const money = (value) => Number(value || 0).toFixed(2)
const close = () => emit('update:modelValue', false)
</script>

<style scoped>
.mask{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:48rpx;box-sizing:border-box;background:rgba(15,23,42,.56)}.dialog{width:100%;max-width:600rpx;padding:42rpx 36rpx 32rpx;box-sizing:border-box;border-radius:12rpx;background:#fff;text-align:center}.title{display:block;color:#172033;font-size:34rpx;font-weight:700}.subtitle{display:block;margin-top:12rpx;color:#64748b;font-size:24rpx}.qr-wrap{display:inline-flex;margin:30rpx auto 20rpx;padding:18rpx;background:#fff;border:1rpx solid #e5e7eb}.qr-grid{display:grid;grid-template-columns:repeat(21,10rpx);grid-template-rows:repeat(21,10rpx);width:210rpx;height:210rpx}.qr-cell{width:10rpx;height:10rpx;background:#fff}.qr-cell.dark{background:#111827}.amount{display:block;color:#f97316;font-size:30rpx;font-weight:700}.order-no{display:block;margin-top:10rpx;color:#475569;font-size:22rpx}.hint{display:block;margin-top:22rpx;color:#94a3b8;font-size:21rpx;line-height:1.55;text-align:left}.close-button{margin-top:28rpx;border-radius:8rpx;background:#1677ff;color:#fff;font-size:27rpx}
</style>
