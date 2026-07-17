<template>
  <view class="page">
    <view v-if="loading" class="empty">订单读取中</view>
    <block v-else-if="order">
      <view class="hero"><text class="kicker">汽车服务订单</text><text class="title">{{ order.service_item_name }}</text><text class="time">预约时间 {{ order.appointment_time }}</text><text class="no">订单号 {{ order.order_no }}</text></view>
      <view class="section"><text class="section-title">支付明细</text><view class="row"><text>服务原价</text><text>¥{{ money(order.original_amount || order.amount) }}</text></view><view v-if="Number(order.discount_amount)>0" class="row discount"><text>会员优惠</text><text>-¥{{ money(order.discount_amount) }}</text></view><view v-if="Number(order.paid_amount)>0" class="row"><text>已支付</text><text>-¥{{ money(order.paid_amount) }}</text></view><view class="row total"><text>{{ Number(order.paid_amount)>0?'本次补缴':'本次应付' }}</text><text>¥{{ dueAmount }}</text></view></view>
      <view class="notice">支付成功后，订单将进入待门店确认状态，门店会根据预约时间安排服务。</view>
      <button class="detail-button" @click="openDetail">查看订单详情</button>
      <view class="bottom-safe" />
      <view class="bottom-bar"><view><text class="label">需支付</text><text class="amount">¥{{ dueAmount }}</text></view><button class="pay-button" :loading="paying" :disabled="!canPay" @click="pay">{{ canPay ? (Number(order?.paid_amount)>0?'去补缴':'去支付') : '查看详情' }}</button></view>
    </block>
    <view v-else class="empty">订单不存在或已关闭</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { confirmRentalMockPayment } from '../../api/rental'
import { getServiceOrder, payServiceOrder } from '../../api/service'

const order = ref(null)
const orderId = ref(0)
const loading = ref(true)
const paying = ref(false)
const canPay = computed(() => order.value?.status === 'pending_payment' && order.value?.payment_status !== 'paid')
const dueAmount = computed(() => money(Math.max(0, Number(order.value?.payable_amount || order.value?.amount || 0) - Number(order.value?.paid_amount || 0))))
const money = (value) => Number(value || 0).toFixed(2)
const openDetail = () => uni.redirectTo({ url: `/pages/order/service-detail?id=${orderId.value}` })

const loadOrder = async () => {
  loading.value = true
  try { order.value = (await getServiceOrder(orderId.value)).data?.order || null }
  catch (error) { uni.showToast({ title: error.msg || '订单读取失败', icon: 'none' }) }
  finally { loading.value = false }
}
const pay = async () => {
  if (!canPay.value || paying.value) return openDetail()
  paying.value = true
  try {
    uni.showLoading({ title: '正在发起支付', mask: true })
    const result = await payServiceOrder(orderId.value)
    const payment = result.data || {}
    if (!payment.mock_callback_enabled) {
      uni.hideLoading()
      uni.showToast({ title: payment.gateway_configured ? '支付未完成，请稍后重试' : '支付通道暂未配置', icon: 'none' })
      return
    }
    uni.showLoading({ title: '正在确认支付', mask: true })
    await confirmRentalMockPayment(payment.payment_id, payment.platform)
    uni.hideLoading()
    uni.showToast({ title: '支付成功', icon: 'success' })
    setTimeout(openDetail, 700)
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: error.msg || '支付失败，请稍后重试', icon: 'none' })
  } finally { paying.value = false }
}
onLoad((options = {}) => { orderId.value = Number(options.id || 0); loadOrder() })
</script>

<style scoped>
.page{min-height:100vh;padding:24rpx 32rpx calc(150rpx + env(safe-area-inset-bottom));box-sizing:border-box}.hero,.section{margin-bottom:18rpx;padding:28rpx;border-radius:10rpx;background:#fff}.hero{background:#eef6ff}.kicker,.time,.no,.label{display:block;color:#718096;font-size:23rpx}.title{display:block;margin:10rpx 0;color:#172033;font-size:34rpx;font-weight:700}.no{margin-top:12rpx;color:#94a3b8;font-size:21rpx}.section-title{display:block;margin-bottom:16rpx;color:#1f2937;font-size:29rpx;font-weight:700}.row{display:flex;justify-content:space-between;gap:20rpx;padding:12rpx 0;color:#64748b;font-size:25rpx}.row text:last-child{color:#374151}.row.discount text:last-child{color:#0f8e69}.row.total{margin-top:10rpx;padding-top:20rpx;border-top:1rpx solid #e9eef5;color:#1f2937;font-size:29rpx;font-weight:700}.row.total text:last-child,.amount{color:#f97316;font-weight:700}.notice{margin:24rpx 4rpx;color:#718096;font-size:22rpx;line-height:1.55}.detail-button{border:1rpx solid #bcd7ff;background:#fff;color:#1677ff;font-size:25rpx}.bottom-safe{height:32rpx}.bottom-bar{position:fixed;right:0;bottom:0;left:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:24rpx;padding:20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));box-sizing:border-box;border-top:1rpx solid #e8edf4;background:#fff}.amount{display:block;margin-top:4rpx;font-size:34rpx}.pay-button{width:260rpx;margin:0;border-radius:8rpx;background:#1677ff;color:#fff;font-size:29rpx}.pay-button[disabled]{background:#aebbd0}.empty{padding:180rpx 24rpx;color:#94a3b8;text-align:center;font-size:26rpx}
</style>
