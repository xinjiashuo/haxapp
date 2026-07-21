<template>
  <view class="page">
    <view v-if="!user" class="guest-head" @click="goLogin">
      <view class="avatar guest-avatar">H</view>
      <view class="guest-info">
        <text class="guest-title">登录账户</text>
        <text class="guest-subtitle">预订车辆，管理行程</text>
      </view>
      <button class="guest-login-button" @click.stop="goLogin">立即登录</button>
    </view>

    <view v-else class="user-head">
      <view class="avatar" :class="{ 'text-avatar': !user.avatar_url }">
        <image v-if="user.avatar_url" :src="user.avatar_url" mode="aspectFill" />
        <text v-else>{{ user.nickname.slice(0, 1) }}</text>
      </view>
      <view class="user-info">
        <view class="name-row">
          <text class="nickname">{{ user.nickname }}</text>
          <text v-if="user.vip" class="vip-tag">{{ user.vip.name }}</text>
        </view>
        <text class="mobile" @click="goBindMobile">{{ user.mobile || '绑定手机号' }}</text>
      </view>
      <view class="message-entry" @click="goMessages"><text>消息</text><text v-if="unreadMessages" class="message-badge">{{ unreadMessages > 99 ? '99+' : unreadMessages }}</text></view>
      <text class="logout" @click.stop="handleLogout">退出</text>
    </view>

    <view v-if="user" class="vip-card" @click="goMember">
      <view>
        <text class="vip-title">{{ user.vip ? user.vip.name : '普通会员' }}</text>
        <text class="vip-subtitle">成长值 {{ user.growth_value }} · 积分 {{ user.points }}</text>
      </view>
      <view class="vip-action"><text>会员权益</text><view class="arrow-icon light"></view></view>
    </view>

    <view v-if="user && !user.profile_completed" class="profile-tip-card">
      <view class="profile-tip-copy">
        <text class="profile-tip-title">完善昵称和头像</text>
        <text class="profile-tip-desc">发布旅记和评论时可展示你的个人资料</text>
      </view>
      <button class="profile-tip-button" @click="goProfileEdit">去完善</button>
    </view>

    <AppState v-if="user && profileError" type="error" compact title="账户信息读取失败" :description="profileError.msg" action-text="重新加载" @action="loadProfile" />

    <view class="stats-card">
      <view class="stat-item" @click="goPoints">
        <text class="stat-value">{{ user ? user.points : '--' }}</text>
        <text class="stat-label">积分</text>
      </view>
      <view class="stat-item" @click="goCoupons">
        <text class="stat-value">{{ coupons }}</text>
        <text class="stat-label">优惠券</text>
      </view>
      <view class="stat-item" @click="goOrders">
        <text class="stat-value">{{ orders }}</text>
        <text class="stat-label">订单</text>
      </view>
    </view>

    <view class="menu-section">
      <view class="menu-row" @click="handleCertification">
        <view class="menu-text"><text class="menu-title">驾驶人认证</text><text class="menu-note">{{ certificationText }}</text></view>
        <view class="arrow-icon"></view>
      </view>
      <view class="menu-row" @click="goOrders">
        <view class="menu-text"><text class="menu-title">我的订单</text><text class="menu-note">查看租赁订单和服务订单</text></view>
        <view class="arrow-icon"></view>
      </view>
      <view class="menu-row" @click="goMessages">
        <view class="menu-text"><text class="menu-title">消息通知</text><text class="menu-note">订单、服务与活动提醒</text></view>
        <view class="arrow-icon"></view>
      </view>
      <view v-if="user?.employee" class="menu-row employee-entry" @click="goEmployeeWorkbench">
        <view class="menu-text"><text class="menu-title">员工工作台</text><text class="menu-note">交还车验车、服务核销与履约</text></view>
        <view class="arrow-icon"></view>
      </view>
      <view class="menu-row" @click="goTravelSubmit">
        <view class="menu-text"><text class="menu-title">上传吃喝玩推荐</text><text class="menu-note">分享真实体验，审核后展示</text></view>
        <view class="arrow-icon"></view>
      </view>
      <view class="menu-row" @click="goFavorites">
        <view class="menu-text"><text class="menu-title">我的收藏</text><text class="menu-note">吃喝玩和旅记收藏</text></view>
        <view class="arrow-icon"></view>
      </view>
      <view class="menu-row" @click="goFeedback">
        <view class="menu-text"><text class="menu-title">意见反馈</text><text class="menu-note">提交建议并查看处理进度</text></view>
        <view class="arrow-icon"></view>
      </view>
    </view>

    <view class="menu-section secondary">
      <view class="menu-row" @click="openSettings"><text class="menu-title">账户设置</text><view class="arrow-icon"></view></view>
    </view>
    <view class="store-quick-actions">
      <text @click="contactStore">联系我们</text><text class="action-divider">/</text><text @click="navigateStore">导航到店</text>
    </view>
    <AppBottomNav active="profile" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getProfile, logout } from '../../api/auth'
import { clearSession, getToken, getUser, saveUser } from '../../utils/user-session'
import AppBottomNav from '../../components/AppBottomNav.vue'
import AppState from '../../components/AppState.vue'
import { getMemberOverview } from '../../api/member'
import { getMessages } from '../../api/message'
import { getStoreProfile } from '../../api/store-config'

const user = ref(getUser())
const coupons = ref(0)
const orders = ref(0)
const unreadMessages = ref(0)
const profileError = ref(null)
const store = ref({ merchant_name: 'Hax租车', contact_phones: [], address: '', latitude: null, longitude: null })
const profilePromptKey = 'hax_profile_prompt_after_login'
const certificationText = computed(() => {
  if (!user.value) return '登录后认证'
  const statuses = { approved: '已认证', pending: '审核中', rejected: '认证未通过', expired: '认证已过期', unverified: '立即认证' }
  return statuses[user.value.certification?.status] || '立即认证'
})

const loadProfile = async () => {
  if (!getToken()) {
    user.value = null
    coupons.value = 0
    orders.value = 0
    unreadMessages.value = 0
    profileError.value = null
    return
  }
  profileError.value = null
  try {
    const result = await getProfile()
    user.value = result.data.user
    saveUser(user.value)
    showProfilePromptAfterLogin()
    try {
      const member = await getMemberOverview()
      coupons.value = member.data?.coupon_count || 0
      orders.value = member.data?.rental_order_count || 0
    } catch (error) {
      coupons.value = 0
      orders.value = 0
    }
    try { unreadMessages.value = (await getMessages({ limit: 1 })).data?.unread_count || 0 } catch (_) { unreadMessages.value = 0 }
  } catch (error) {
    if (error.type !== 'auth') profileError.value = error
  }
}

const showProfilePromptAfterLogin = () => {
  if (uni.getStorageSync(profilePromptKey) !== '1') return
  uni.removeStorageSync(profilePromptKey)
  if (user.value?.profile_completed) return

  setTimeout(() => {
    uni.showModal({
      title: '完善昵称和头像',
      content: '完善后，旅记和评论将展示你的个人资料。',
      cancelText: '暂不设置',
      confirmText: '去完善',
      success: ({ confirm }) => {
        if (confirm) goProfileEdit()
      }
    })
  }, 120)
}

const loadStoreProfile = async () => {
  try { store.value = { ...store.value, ...((await getStoreProfile()).data || {}) } } catch (_) { /* 门店配置未完成时保留默认展示。 */ }
}

const goLogin = () => {
  uni.setStorageSync('hax_login_redirect', '/pages/profile/index')
  uni.navigateTo({ url: '/pages/login/index' })
}
const goProfileEdit = () => user.value && uni.navigateTo({ url: '/pages/profile/edit' })
const goBindMobile = () => user.value && !user.value.mobile && uni.navigateTo({ url: '/pages/profile/bind-mobile' })
const goOrders = () => user.value ? uni.reLaunch({ url: '/pages/order/list' }) : goLogin()
const goMember = () => user.value ? uni.navigateTo({ url: '/pages/profile/member' }) : goLogin()
const goPoints = () => user.value ? uni.navigateTo({ url: '/pages/profile/points' }) : goLogin()
const goCoupons = () => user.value ? uni.navigateTo({ url: '/pages/profile/coupons' }) : goLogin()
const goEmployeeWorkbench = () => user.value?.employee ? uni.navigateTo({ url: '/pages/employee/index' }) : uni.showToast({ title: '当前账号未关联员工档案', icon: 'none' })
const goTravelSubmit = () => user.value ? uni.navigateTo({ url: '/pages/travel/submit' }) : goLogin()
const goFavorites = () => user.value ? uni.navigateTo({ url: '/pages/profile/favorites' }) : goLogin()
const goFeedback = () => user.value ? uni.navigateTo({ url: '/pages/profile/feedback' }) : goLogin()
const goMessages = () => user.value ? uni.navigateTo({ url: '/pages/profile/messages' }) : goLogin()
const contactStore = () => {
  const phones = store.value.contact_phones || []
  if (!phones.length) return uni.showToast({ title: '商家暂未配置联系电话', icon: 'none' })
  if (phones.length === 1) return uni.makePhoneCall({ phoneNumber: phones[0] })
  uni.showActionSheet({ itemList: phones, success: ({ tapIndex }) => uni.makePhoneCall({ phoneNumber: phones[tapIndex] }) })
}
const navigateStore = () => {
  const latitude = Number(store.value.latitude), longitude = Number(store.value.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude === 0 || longitude === 0) return uni.showToast({ title: '商家暂未配置门店坐标', icon: 'none' })
  uni.openLocation({ latitude, longitude, name: store.value.merchant_name || '门店', address: store.value.address || '', scale: 16 })
}
const openSettings = () => {
  if (!user.value) return goLogin()
  uni.showActionSheet({
    itemList: ['编辑个人资料', '消息通知设置', '退出当前账号'],
    success: ({ tapIndex }) => {
      if (tapIndex === 0) return goProfileEdit()
      if (tapIndex === 1) return uni.openSetting({})
      if (tapIndex === 2) handleLogout()
    }
  })
}
const handleCertification = () => user.value
  ? uni.navigateTo({ url: '/pages/profile/certification' })
  : goLogin()

const handleLogout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定退出当前账号吗？',
    success: async ({ confirm }) => {
      if (!confirm) return
      try { await logout() } catch (error) { /* Token失效时仍清理本地状态。 */ }
      clearSession()
      user.value = null
      coupons.value = 0
      orders.value = 0
      unreadMessages.value = 0
      uni.showToast({ title: '已退出登录', icon: 'success' })
    }
  })
}

onShow(() => { loadProfile(); loadStoreProfile() })
</script>

<style scoped>
.page { min-height: 100vh; padding-bottom: calc(300rpx + env(safe-area-inset-bottom)); }
.guest-head, .user-head { display: flex; align-items: center; padding: 48rpx 32rpx 42rpx; background: #fff; }
.avatar { display: flex; flex: 0 0 112rpx; align-items: center; justify-content: center; width: 112rpx; height: 112rpx; overflow: hidden; border-radius: 50%; background: #dbeafe; color: #1677ff; font-size: 42rpx; font-weight: 700; }
.avatar image { width: 100%; height: 100%; }
.guest-avatar { background: #1677ff; color: #fff; }
.guest-info, .user-info { display: flex; flex: 1; flex-direction: column; margin-left: 24rpx; }
.guest-title, .nickname { font-size: 36rpx; font-weight: 700; }
.guest-subtitle, .mobile { margin-top: 12rpx; color: #6b7280; font-size: 26rpx; }
.guest-login-button { flex: 0 0 auto; margin: 0; padding: 0 22rpx; border-radius: 6rpx; background: #1677ff; color: #fff; font-size: 24rpx; line-height: 62rpx; }.guest-login-button::after { border: 0; }
.name-row { display: flex; align-items: center; gap: 12rpx; }
.vip-tag { padding: 4rpx 10rpx; border-radius: 4rpx; background: #fff0d9; color: #c76b00; font-size: 20rpx; }
.logout { color: #9ca3af; font-size: 24rpx; }
.message-entry{position:relative;margin-right:24rpx;color:#64748b;font-size:23rpx}.message-badge{position:absolute;top:-14rpx;right:-18rpx;min-width:28rpx;padding:0 5rpx;border-radius:18rpx;background:#ef4444;color:#fff;font-size:17rpx;line-height:28rpx;text-align:center}
.arrow-icon { flex: 0 0 14rpx; width: 14rpx; height: 14rpx; margin-right: 4rpx; border-right: 3rpx solid #9ca3af; border-bottom: 3rpx solid #9ca3af; transform: rotate(-45deg); }
.vip-card { display: flex; align-items: center; justify-content: space-between; margin: 24rpx 32rpx 0; padding: 28rpx; border-radius: 8rpx; background: #1f2937; color: #fff; }
.vip-title { display: block; font-size: 32rpx; font-weight: 700; }
.vip-subtitle { display: block; margin-top: 12rpx; color: #d1d5db; font-size: 23rpx; }
.vip-action { display: flex; align-items: center; gap: 12rpx; color: #fbbf24; font-size: 24rpx; }.arrow-icon.light { border-color: #fbbf24; }
.profile-tip-card { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin: 20rpx 32rpx 0; padding: 22rpx 24rpx; border-radius: 8rpx; background: #e8f3ff; }.profile-tip-copy { display: flex; flex: 1; flex-direction: column; min-width: 0; }.profile-tip-title { color: #1d4f91; font-size: 27rpx; font-weight: 700; }.profile-tip-desc { margin-top: 7rpx; color: #5c789d; font-size: 21rpx; line-height: 1.45; }.profile-tip-button { flex: 0 0 auto; margin: 0; padding: 0 18rpx; border-radius: 6rpx; background: #1677ff; color: #fff; font-size: 23rpx; line-height: 58rpx; }.profile-tip-button::after { border: 0; }
.stats-card { display: flex; margin: 24rpx 32rpx; padding: 28rpx 0; border-radius: 8rpx; background: #fff; }
.stat-item { display: flex; flex: 1; flex-direction: column; align-items: center; }
.stat-value { font-size: 36rpx; font-weight: 700; }
.stat-label { margin-top: 12rpx; color: #6b7280; font-size: 24rpx; }
.menu-section { margin: 24rpx 32rpx 0; border-radius: 8rpx; background: #fff; }
.secondary { margin-top: 20rpx; }
.menu-row { display: flex; align-items: center; justify-content: space-between; min-height: 108rpx; margin: 0 28rpx; border-bottom: 1rpx solid #f1f5f9; }
.menu-row:last-child { border-bottom: 0; }
.menu-text { display: flex; flex-direction: column; gap: 10rpx; }
.menu-title { color: #1f2937; font-size: 29rpx; }
.menu-note { color: #9ca3af; font-size: 23rpx; }
.store-quick-actions { display: flex; align-items: center; justify-content: center; gap: 24rpx; margin: 44rpx 0 0; color: #64748b; font-size: 25rpx; }
.store-quick-actions text { padding: 12rpx 4rpx; }
.store-quick-actions .action-divider { padding: 0; color: #cbd5e1; }
</style>
