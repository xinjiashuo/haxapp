<template>
  <view class="page">
    <view v-if="loading" class="empty-state">订单读取中</view>
    <block v-else-if="order">
      <view class="hero-card">
        <text class="hero-kicker">{{ isDepositPayment ? '订单押金' : '本次订单' }}</text>
        <text class="hero-title">{{ order.car_name }}</text>
        <text class="hero-time">{{ order.pickup_time }} 至 {{ order.return_time }}</text>
        <text class="hero-no">订单号 {{ order.order_no }}</text>
      </view>

      <view v-if="isDepositPayment" class="section">
        <text class="section-title">押金支付</text>
        <view class="fee-row"><text>已支付租金</text><text>¥{{ money(order.total_amount) }}</text></view>
        <view class="fee-row total"><text>本次支付押金</text><text>¥{{ money(order.deposit_amount) }}</text></view>
      </view>
      <view v-else class="section">
        <text class="section-title">费用明细</text>
        <view class="fee-row"><text>基础租金</text><text>¥{{ money(order.base_amount) }}</text></view>
        <view v-if="Number(order.insurance_amount) > 0" class="fee-row"><text>车辆保障</text><text>¥{{ money(order.insurance_amount) }}</text></view>
        <view v-if="serviceAmount > 0" class="fee-row"><text>取还车服务</text><text>¥{{ money(serviceAmount) }}</text></view>
        <view v-if="vipDiscount > 0" class="fee-row discount"><text>会员优惠</text><text>-¥{{ money(vipDiscount) }}</text></view>
        <view v-if="promotionDiscount > 0" class="fee-row discount"><text>活动优惠</text><text>-¥{{ money(promotionDiscount) }}</text></view>
        <view v-if="couponDiscount > 0" class="fee-row discount"><text>优惠券</text><text>-¥{{ money(couponDiscount) }}</text></view>
        <view v-if="pointsDiscount > 0" class="fee-row discount"><text>积分抵扣</text><text>-¥{{ money(pointsDiscount) }}</text></view>
        <view v-if="otherDiscount > 0" class="fee-row discount"><text>其他优惠</text><text>-¥{{ money(otherDiscount) }}</text></view>
        <view class="fee-row total"><text>在线支付</text><text>¥{{ money(order.total_amount) }}</text></view>
      </view>

      <view v-if="!isDepositPayment" class="deposit-card">
        <view><text class="deposit-title">押金另付</text><text class="deposit-note">支付租金后，可支付押金或申请信用免押</text></view>
        <text class="deposit-value">¥{{ money(order.deposit_amount) }}</text>
      </view>

      <view class="notice">{{ isDepositPayment ? '押金支付完成后，订单将进入门店确认流程。' : '支付成功后车辆才会锁定；支付失败或取消不会占用车辆。' }}</view>
      <button class="detail-button" @click="openDetail">查看订单详情</button>
      <view class="bottom-safe"></view>
      <view v-if="canPay" class="bottom-bar"><view><text class="bottom-label">需支付</text><text class="bottom-amount">¥{{ money(paymentAmount) }}</text></view><button class="pay-button" :loading="paying" @click="pay">{{ isDepositPayment ? '支付押金' : '去支付' }}</button></view>
      <view v-else class="bottom-bar"><view><text class="bottom-label">订单状态</text><text class="bottom-amount">{{ order.status_text }}</text></view><button class="pay-button" @click="openDetail">查看详情</button></view>
    </block>
    <view v-else class="empty-state"><text>订单不存在或已失效</text><button class="list-button" @click="backToOrders">返回订单列表</button></view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { confirmRentalMockPayment, getRentalOrder, payRentalDeposit, payRentalOrder } from '../../api/rental'

const order = ref(null)
const orderId = ref(0)
const paymentType = ref('rent')
const loading = ref(true)
const paying = ref(false)
const isDepositPayment = computed(() => paymentType.value === 'deposit')
const snapshot = computed(() => {
  const value = order.value?.pricing_snapshot
  if (!value) return {}
  if (typeof value === 'object') return value
  try { return JSON.parse(value) } catch (_) { return {} }
})
const numberFrom = (names) => names.reduce((result, name) => result || Number(snapshot.value?.[name] || 0), 0)
const serviceAmount = computed(() => numberFrom(['service_amount', 'delivery_fee', 'service_fee']))
const vipDiscount = computed(() => numberFrom(['vip_discount_amount', 'member_discount_amount']))
const promotionDiscount = computed(() => numberFrom(['promotion_discount_amount']))
const couponDiscount = computed(() => numberFrom(['coupon_discount_amount']))
const pointsDiscount = computed(() => numberFrom(['points_discount_amount']))
const otherDiscount = computed(() => Math.max(0, Number(order.value?.discount_amount || 0) - vipDiscount.value - promotionDiscount.value - couponDiscount.value - pointsDiscount.value))
const canPay = computed(() => isDepositPayment.value
  ? order.value?.status === 'pending_deposit' && order.value?.deposit_status !== 'paid' && Number(order.value?.deposit_amount) > 0
  : order.value?.status === 'pending_payment' && order.value?.payment_status !== 'paid')
const paymentAmount = computed(() => isDepositPayment.value ? order.value?.deposit_amount : order.value?.total_amount)
const paymentLabel = computed(() => isDepositPayment.value ? '押金支付' : '租金支付')
const money = (value) => Number(value || 0).toFixed(2)

const loadOrder = async () => {
  if (!orderId.value) return
  loading.value = true
  try { order.value = (await getRentalOrder(orderId.value)).data?.order || null }
  catch (error) { uni.showToast({ title: error.msg || '订单读取失败', icon: 'none' }) }
  finally { loading.value = false }
}
const backToOrders = () => uni.reLaunch({ url: '/pages/order/list' })
const openDetail = () => order.value?.id && uni.redirectTo({ url: `/pages/order/detail?id=${order.value.id}` })
const paymentFailed = (message) => { uni.showToast({ title: message || '支付未完成，请稍后重试', icon: 'none' }); setTimeout(backToOrders, 900) }
const pay = async () => {
  if (!canPay.value || paying.value) return
  paying.value = true
  try {
    uni.showLoading({ title: '正在发起支付', mask: true })
    const result = await (isDepositPayment.value ? payRentalDeposit(order.value.id) : payRentalOrder(order.value.id))
    const payment = result.data || {}
    if (!payment.mock_callback_enabled) {
      uni.hideLoading()
      paymentFailed(payment.gateway_configured ? '支付未完成，请在订单列表重试' : '支付通道暂未配置')
      return
    }
    uni.showLoading({ title: '正在确认支付', mask: true })
    await confirmRentalMockPayment(payment.payment_id, payment.platform)
    uni.hideLoading()
    uni.showToast({ title: `${paymentLabel.value}成功`, icon: 'success' })
    setTimeout(openDetail, 700)
  } catch (error) {
    uni.hideLoading()
    paymentFailed(error.msg || `${paymentLabel.value}失败`)
  } finally { paying.value = false }
}

onLoad((options = {}) => {
  orderId.value = Number(options.id || 0)
  paymentType.value = options.type === 'deposit' ? 'deposit' : 'rent'
  loadOrder()
})
</script>

<style scoped>
.page{min-height:100vh;padding:24rpx 32rpx calc(150rpx + env(safe-area-inset-bottom));box-sizing:border-box}.hero-card,.section,.deposit-card{margin-bottom:18rpx;padding:28rpx;border-radius:10rpx;background:#fff}.hero-card{background:linear-gradient(135deg,#eaf3ff,#f8fbff)}.hero-kicker,.hero-time,.hero-no,.bottom-label{display:block;color:#64748b;font-size:23rpx}.hero-title{display:block;margin:10rpx 0;color:#172033;font-size:34rpx;font-weight:700}.hero-time{font-size:24rpx}.hero-no{margin-top:12rpx;color:#94a3b8;font-size:21rpx}.section-title{display:block;margin-bottom:16rpx;color:#1f2937;font-size:29rpx;font-weight:700}.fee-row{display:flex;justify-content:space-between;gap:20rpx;padding:12rpx 0;color:#64748b;font-size:25rpx}.fee-row text:last-child{color:#374151}.fee-row.discount text:last-child{color:#0f8e69}.fee-row.total{margin-top:10rpx;padding-top:20rpx;border-top:1rpx solid #e9eef5;color:#1f2937;font-size:29rpx;font-weight:700}.fee-row.total text:last-child{color:#f97316}.deposit-card{display:flex;align-items:center;justify-content:space-between;gap:20rpx;background:#fffaf0}.deposit-title{display:block;color:#8a5a12;font-size:27rpx;font-weight:700}.deposit-note{display:block;margin-top:8rpx;color:#927344;font-size:21rpx;line-height:1.45}.deposit-value{color:#b96d00;font-size:30rpx;font-weight:700;white-space:nowrap}.notice{margin:24rpx 4rpx;color:#718096;font-size:22rpx;line-height:1.55}.detail-button,.list-button{border:1rpx solid #bcd7ff;background:#fff;color:#1677ff;font-size:25rpx}.bottom-safe{height:32rpx}.bottom-bar{position:fixed;right:0;bottom:0;left:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:24rpx;padding:20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));box-sizing:border-box;border-top:1rpx solid #e8edf4;background:#fff}.bottom-amount{display:block;margin-top:4rpx;color:#f97316;font-size:34rpx;font-weight:700}.pay-button{width:260rpx;margin:0;border-radius:8rpx;background:#1677ff;color:#fff;font-size:29rpx}.empty-state{padding:180rpx 24rpx;color:#94a3b8;text-align:center;font-size:26rpx}.list-button{width:300rpx;margin-top:30rpx}
</style>
