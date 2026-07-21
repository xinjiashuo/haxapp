<template>
  <view class="page">
    <AppState v-if="!isLoggedIn" type="login" title="登录后查看订单" description="租赁订单和汽车服务订单都会保留在这里" action-text="去登录" @action="goLogin" />
    <template v-else>
    <view class="tabs">
      <view class="tab" :class="{ active: activeTab === 'rental' }" @click="switchTab('rental')">租赁订单</view>
      <view class="tab" :class="{ active: activeTab === 'service' }" @click="switchTab('service')">服务订单</view>
    </view>
    <AppState v-if="activeTab === 'rental' && loading" type="loading" title="订单读取中" />
    <AppState v-else-if="activeTab === 'rental' && rentalError" type="error" :description="rentalError.msg" action-text="重新加载" @action="loadOrders" />
    <view v-else-if="activeTab === 'rental' && orders.length" class="order-list">
      <view v-for="order in orders" :key="order.id" class="order-card" @click="openDetail(order.id)">
        <view class="order-head"><text class="order-no">{{ order.order_no }}</text><text class="order-status">{{ order.user_status_text || order.status_text }}</text></view>
        <text class="car-name">{{ order.car_name }}</text>
        <text class="order-time">取车 {{ order.pickup_time }}</text>
        <text class="order-time">还车 {{ order.return_time }}</text>
        <text v-if="paymentCountdown(order)" class="payment-countdown">请在 {{ paymentCountdown(order) }} 内{{ order.payment_deadline_type === 'deposit' ? '支付押金' : '支付租金' }}</text>
        <view class="order-foot"><text class="order-amount">¥{{ order.total_amount }}</text><view class="order-actions"><button v-if="canPay(order)" class="pay-button" @click.stop="payOrder(order)">支付租金</button><button v-if="canPayDeposit(order)" class="pay-button" @click.stop="payDeposit(order)">支付押金</button><button v-if="canPayDeposit(order) && order.credit_deposit_available !== false" class="credit-button" @click.stop="chooseCreditDeposit(order)">信用免押</button><button v-else-if="canCancel(order)" class="cancel-button" @click.stop="cancelOrder(order)">取消订单</button><text v-else-if="!canPay(order) && !canPayDeposit(order)" class="order-action">查看详情</text><text v-if="canPayDeposit(order) && order.credit_deposit_available === false" class="credit-note">{{ order.credit_deposit_notice || '当前订单暂不支持信用免押，请支付普通押金。' }}</text></view></view>
      </view>
    </view>
    <AppState v-else-if="activeTab === 'service' && serviceLoading" type="loading" title="订单读取中" />
    <AppState v-else-if="activeTab === 'service' && serviceError" type="error" :description="serviceError.msg" action-text="重新加载" @action="loadServiceOrders" />
    <view v-else-if="activeTab === 'service' && serviceOrders.length" class="order-list">
      <view v-for="order in serviceOrders" :key="order.id" class="order-card" @click="openServiceDetail(order.id)">
        <view class="order-head"><text class="order-no">{{ order.order_no }}</text><text class="order-status">{{ order.status_text }}</text></view>
        <text class="car-name">{{ order.service_item_name }}</text>
        <text class="order-time">车牌号 {{ order.service_plate_no }}</text>
        <text class="order-time">预约 {{ order.appointment_time }}</text>
        <view class="order-foot"><text class="order-amount">{{ serviceAmountText(order) }}</text><view class="order-actions"><button v-if="canPayService(order)" class="pay-button" @click.stop="payService(order)">{{ Number(order.paid_amount||0)>0?'去补款':'去支付' }}</button><button v-else-if="canCancelService(order)" class="cancel-button" @click.stop="cancelService(order)">取消预约</button><text v-else class="order-action">查看详情</text></view></view>
      </view>
    </view>
    <AppState v-else type="empty" :title="activeTab === 'rental' ? '暂无租赁订单' : '暂无服务订单'" :description="activeTab === 'rental' ? '预约车辆后，订单会显示在这里' : '完成汽车服务预约后，订单会显示在这里'" />
    </template>
    <AppBottomNav active="profile" />
    <CreditDepositQrModal v-model="alipayQrVisible" :order-no="creditOrder?.order_no" :amount="creditOrder?.deposit_amount" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onHide, onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import AppBottomNav from '../../components/AppBottomNav.vue'
import CreditDepositQrModal from '../../components/CreditDepositQrModal.vue'
import AppState from '../../components/AppState.vue'
import { cancelRentalOrder, getRentalOrders, prepareRentalCreditDeposit } from '../../api/rental'
import { cancelServiceOrder, getServiceOrders } from '../../api/service'
import { getToken } from '../../utils/user-session'

const activeTab = ref('rental')
const isLoggedIn = computed(() => !!getToken())
const orders = ref([])
const loading = ref(false)
const serviceOrders = ref([])
const serviceLoading = ref(false)
const rentalError = ref(null)
const serviceError = ref(null)
const alipayQrVisible = ref(false)
const creditOrder = ref(null)
let countdownTimer = null

const loadOrders = async () => {
  if (!getToken()) return
  loading.value = true
  rentalError.value = null
  try {
    const result = await getRentalOrders()
    orders.value = result.data?.data || []
  } catch (error) {
    rentalError.value = error
  } finally {
    loading.value = false
  }
}

const loadServiceOrders = async () => {
  if (!getToken()) return
  serviceLoading.value = true
  serviceError.value = null
  try {
    const result = await getServiceOrders()
    serviceOrders.value = result.data?.data || []
  } catch (error) {
    serviceError.value = error
  } finally {
    serviceLoading.value = false
  }
}

const switchTab = async (tab) => {
  activeTab.value = tab
  if (tab === 'service') await loadServiceOrders()
  else await loadOrders()
}
const goLogin = () => {
  uni.setStorageSync('hax_login_redirect', '/pages/order/list')
  uni.navigateTo({ url: '/pages/login/index' })
}

const openDetail = (id) => uni.navigateTo({ url: `/pages/order/detail?id=${id}` })
const openServiceDetail = (id) => uni.navigateTo({ url: `/pages/order/service-detail?id=${id}` })
const canPay = (order) => order.status === 'pending_payment' && order.payment_status !== 'paid'
const canPayDeposit = (order) => order.status === 'pending_deposit' && order.deposit_status !== 'paid' && Number(order.deposit_amount) > 0
const canCancel = (order) => ['pending_payment', 'pending_deposit', 'pending_review', 'reserved', 'pending_pickup'].includes(order.status)
const paymentCountdown = (order) => {
  const seconds = Number(order.payment_remaining_seconds)
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}
const startCountdown = () => {
  if (countdownTimer) return
  countdownTimer = setInterval(() => {
    orders.value.forEach((order) => {
      if (Number(order.payment_remaining_seconds) > 0) order.payment_remaining_seconds -= 1
    })
  }, 1000)
}
const stopCountdown = () => {
  if (!countdownTimer) return
  clearInterval(countdownTimer)
  countdownTimer = null
}
const payOrder = (order) => uni.navigateTo({ url: `/pages/order/payment?id=${order.id}` })
const payDeposit = (order) => uni.navigateTo({ url: `/pages/order/payment?id=${order.id}&type=deposit` })
const chooseCreditDeposit = (order) => uni.showActionSheet({ itemList: ['微信信用免押', '支付宝信用免押'], success: async ({ tapIndex }) => { const provider = tapIndex === 0 ? 'wechat' : 'alipay'; try { uni.showLoading({ title: '正在发起授权', mask: true }); const result = await prepareRentalCreditDeposit(order.id, provider); uni.hideLoading(); if (provider === 'alipay') { creditOrder.value = order; alipayQrVisible.value = true; return } const data = result.data || {}; if (!data.gateway_configured) { uni.showModal({ title: '微信信用免押', content: result.msg || '微信信用免押接口待配置', showCancel: false }); return } uni.showModal({ title: '微信信用免押', content: '微信信用授权参数已准备，接入正式凭证后将在此唤起授权。', showCancel: false }); } catch (error) { uni.hideLoading(); uni.showToast({ title: error.msg || '信用免押发起失败', icon: 'none' }); } } })
const cancelOrder = (order) => {
  uni.showModal({
    title: '取消订单',
    content: '确认取消这笔租车订单吗？系统将按照取消政策计算退款。',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        const result = await cancelRentalOrder(order.id)
        uni.showToast({ title: result.data?.message || '订单已取消', icon: 'none' })
        await loadOrders()
      } catch (error) {
        uni.showToast({ title: error.msg || '取消失败', icon: 'none' })
      }
    }
  })
}

const canPayService = (order) => order.status === 'pending_payment' && order.payment_status !== 'paid'
const serviceAmountText = (order) => {
  if (order.status === 'pending_quote') return '等待报价'
  if (order.status === 'pending_price_confirmation') return `待确认 ¥${Number(order.quoted_amount || 0).toFixed(2)}`
  return `¥${Math.max(0, Number(order.payable_amount || order.amount) - Number(order.paid_amount || 0)).toFixed(2)}`
}
const payService = (order) => uni.navigateTo({ url: `/pages/order/service-payment?id=${order.id}` })
const canCancelService = (order) => ['pending_quote', 'pending_price_confirmation', 'pending_payment', 'pending', 'confirmed'].includes(order.status)
const cancelService = (order) => {
  uni.showModal({
    title: '取消预约',
    content: '确认取消这笔汽车服务预约吗？',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        const result = await cancelServiceOrder(order.id)
        uni.showToast({ title: result.msg || '预约已取消', icon: 'none' })
        await loadServiceOrders()
      } catch (error) {
        uni.showToast({ title: error.msg || '取消失败', icon: 'none' })
      }
    }
  })
}

onLoad(async (options) => {
  if (options.tab === 'service') activeTab.value = 'service'
  startCountdown()
  await switchTab(activeTab.value)
})
onShow(() => { startCountdown(); return activeTab.value === 'service' ? loadServiceOrders() : loadOrders() })
onHide(stopCountdown)
onUnload(stopCountdown)
</script>

<style scoped>
.page { min-height: 100vh; padding-bottom: calc(260rpx + env(safe-area-inset-bottom)); }
.tabs { display: flex; padding: 0 32rpx; background: #fff; }
.tab { flex: 1; padding: 30rpx 0 24rpx; color: #6b7280; font-size: 30rpx; text-align: center; }
.tab.active { border-bottom: 4rpx solid #1677ff; color: #1677ff; font-weight: 600; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 180rpx 32rpx; }
.empty-title { color: #374151; font-size: 32rpx; font-weight: 600; }
.empty-note { margin-top: 16rpx; color: #9ca3af; font-size: 25rpx; }
.order-list { display: flex; flex-direction: column; gap: 18rpx; padding: 24rpx 32rpx 160rpx; }
.order-card { padding: 24rpx; border-radius: 8rpx; background: #fff; }
.order-head, .order-foot { display: flex; align-items: center; justify-content: space-between; }
.order-no { color: #6b7280; font-size: 22rpx; }
.order-status { color: #1677ff; font-size: 23rpx; font-weight: 600; }
.car-name { display: block; margin-top: 20rpx; color: #1f2937; font-size: 30rpx; font-weight: 700; }
.order-time { display: block; margin-top: 10rpx; color: #6b7280; font-size: 23rpx; }
.payment-countdown { display: block; margin-top: 12rpx; color: #e8594f; font-size: 23rpx; font-weight: 600; }
.order-foot { margin-top: 22rpx; padding-top: 18rpx; border-top: 1rpx solid #eef0f4; }
.order-actions { display: flex; align-items: center; gap: 12rpx; }
.order-amount { color: #f97316; font-size: 30rpx; font-weight: 700; }
.order-action { color: #6b7280; font-size: 23rpx; }
.pay-button, .credit-button { margin: 0; padding: 0 20rpx; border-radius: 6rpx; font-size: 22rpx; line-height: 54rpx; }
.pay-button { background: #1677ff; color: #fff; }
.credit-button { border: 1rpx solid #80b5ff; background: #eef6ff; color: #1677ff; }
.cancel-button { margin: 0; padding: 0 20rpx; border: 1rpx solid #fecaca; border-radius: 6rpx; background: #fff; color: #dc2626; font-size: 22rpx; line-height: 54rpx; }
.credit-note{flex-basis:100%;display:block;margin-top:8rpx;color:#9a6700;font-size:20rpx;line-height:1.45}
</style>
