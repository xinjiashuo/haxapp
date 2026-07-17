<template>
  <view class="page">
    <view class="service-head">
      <text class="page-title">汽车服务</text>
      <text class="page-subtitle">洗车、养护、修复与贴膜服务</text>
    </view>

    <view class="service-layout">
      <scroll-view class="category-panel" scroll-y>
        <view v-for="category in categories" :key="category.id" class="category-item" :class="{ active: activeCategoryId === category.id }" @click="activeCategoryId = category.id">
          <text>{{ category.name }}</text>
          <text class="category-count">{{ itemCount(category.id) }}</text>
        </view>
        <view v-if="!loading && !categories.length" class="category-empty">暂无分类</view>
      </scroll-view>

      <scroll-view class="item-panel" scroll-y>
        <view v-if="loading" class="empty-state">服务项目读取中</view>
        <view v-else-if="currentItems.length" class="item-list">
          <view v-for="item in currentItems" :key="item.id" class="service-card">
            <image v-if="item.cover_image" class="service-image" :src="item.cover_image" mode="aspectFill" />
            <view v-else class="service-image image-placeholder">服</view>
            <view class="service-info">
              <view class="service-title-row"><text class="service-name">{{ item.name }}</text><text class="service-price">{{ priceText(item) }}<text class="service-unit"> / {{ item.unit || '次' }}</text></text></view>
              <text class="service-description">{{ item.description || '服务详情请咨询门店' }}</text>
              <view class="service-footer"><text class="service-hint">{{ item.estimated_work_units || 4 }} 工时 · 约 {{ item.estimated_duration_minutes || 60 }} 分钟</text><button class="reserve-button" @click.stop="book(item)">预约</button></view>
            </view>
          </view>
        </view>
        <view v-else class="empty-state">该分类暂无服务项目</view>
      </scroll-view>
    </view>
    <view v-if="selectedItem" class="booking-mask" @click="closeBooking">
      <view class="booking-sheet" @click.stop>
        <view class="booking-head"><view><text class="booking-title">预约{{ selectedItem.name }}</text><text class="booking-price">{{ priceText(selectedItem) }} / {{ selectedItem.unit || '次' }} · {{ selectedItem.estimated_work_units || 4 }} 工时（约{{ selectedItem.estimated_duration_minutes || 60 }}分钟）</text></view><text class="booking-close" @click="closeBooking">×</text></view>
        <view class="booking-body">
          <view class="form-row"><text class="form-label">预约日期</text><picker mode="date" :value="appointmentDate" :start="today" @change="changeAppointmentDate"><view class="picker-value primary">{{ appointmentDate }}</view></picker></view>
          <view class="time-section"><view class="time-section-head"><text class="form-label">可约时段</text><text class="time-section-tip">每格 15 分钟</text></view><view v-if="availableSlots.length" class="slot-grid"><view v-for="slot in availableSlots" :key="slot.time" class="slot-item" :class="{ selected: appointmentTime === slot.time, full: slot.status === 'full' }" @click="selectSlot(slot)"><text>{{ slot.time }}</text><text class="slot-status">{{ slot.status === 'full' ? '已满' : `余${slot.available_workstation_count}` }}</text></view></view><text v-else class="no-slot">当日暂无可预约时段</text></view>
          <view class="form-row"><text class="form-label">车牌号</text><input v-model.trim="form.plateNo" class="form-input" maxlength="30" placeholder="例如：鲁B12345" /></view>
          <view class="form-row"><text class="form-label">联系人</text><input v-model.trim="form.customerName" class="form-input" maxlength="100" placeholder="请输入联系人称呼" /></view>
          <view class="form-row"><text class="form-label">手机号</text><input v-model.trim="form.mobile" class="form-input" type="number" maxlength="11" placeholder="用于门店确认预约" /></view>
          <view class="form-row remark-row"><text class="form-label">备注</text><textarea v-model.trim="form.remark" class="form-textarea" maxlength="500" placeholder="例如车型、服务需求或到店说明" /></view>
          <view v-if="selectedItem.pricing_mode==='fixed' && serviceQuote" class="marketing-box"><text class="marketing-title">会员与活动优惠</text><view v-if="serviceQuote.promotions?.length" class="promotion-list"><text v-for="promotion in serviceQuote.promotions" :key="promotion.id" class="promotion-note">{{ promotion.rule_name }}{{ Number(promotion.discount_amount)>0 ? `，已减 ¥${promotion.discount_amount}` : '，完成订单后赠送积分' }}</text></view><view v-if="serviceQuote.coupon_options?.length"><view v-for="coupon in serviceQuote.coupon_options" :key="coupon.user_coupon_id" class="coupon-option" @click="toggleCoupon(coupon.user_coupon_id)"><text>{{ selectedCouponId===coupon.user_coupon_id?'●':'○' }} {{ coupon.coupon_name }} 减 ¥{{ coupon.discount_amount }}</text></view></view><text v-else class="marketing-note">暂无可用优惠券</text><view v-if="Number(serviceQuote.points_max_use)>0" class="points-line"><text>积分最多抵扣 {{ serviceQuote.points_max_use }}</text><input v-model.number="selectedPoints" type="number" @blur="loadQuote" /></view><view class="price-line"><text>原价 ¥{{ serviceQuote.original_amount }}</text><text>优惠 -¥{{ serviceQuote.discount_amount }}</text><text class="payable">应付 ¥{{ serviceQuote.payable_amount }}</text></view></view>
          <view v-else-if="selectedItem.pricing_mode!=='fixed'" class="pricing-note"><text>该项目需由门店现场核验后报价。报价将发送至订单详情，确认后再付款。</text></view>
          <view class="booking-note"><text>1 工时为 15 分钟。系统会从该项目可用工位中实时分配；全部工位占满的时段不可预约。提交订单后暂占工位，支付超时或取消后自动释放。</text></view>
        </view>
        <button class="submit-button" :loading="submitting" @click="submitBooking">提交预约</button>
      </view>
    </view>
    <AppBottomNav active="service" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppBottomNav from '../../components/AppBottomNav.vue'
import { createServiceOrder, getServiceAvailability, getServiceQuote, getServices } from '../../api/service'
import { getToken, getUser } from '../../utils/user-session'

const categories = ref([])
const items = ref([])
const activeCategoryId = ref(0)
const loading = ref(false)
const selectedItem = ref(null)
const submitting = ref(false)
const form = ref({ plateNo: '', customerName: '', mobile: '', remark: '' })
const serviceQuote = ref(null)
const selectedCouponId = ref(0)
const selectedPoints = ref(0)
const availableSlots = ref([])
const appointmentTime = ref('')

const formatDate = (date) => `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`
const today = formatDate(new Date())
const appointmentDate = ref(today)
const currentItems = computed(() => items.value.filter((item) => item.category_id === activeCategoryId.value))

const itemCount = (categoryId) => items.value.filter((item) => item.category_id === categoryId).length
const priceText = (item) => {
  if (!item) return ''
  if (item.pricing_mode === 'quote') return '现场报价'
  if (item.pricing_mode === 'range') return `¥${item.min_price || 0}-${item.max_price || 0}`
  return `¥${item.price}`
}

const book = (item) => {
  if (!getToken()) {
    uni.navigateTo({ url: '/pages/login/index' })
    return
  }
  const user = getUser() || {}
  selectedItem.value = item
  form.value = { plateNo: '', customerName: user.nickname || '', mobile: user.mobile || '', remark: '' }
  appointmentDate.value = today
  availableSlots.value = []
  appointmentTime.value = ''
  selectedCouponId.value = 0
  selectedPoints.value = 0
  loadAvailability(true)
  loadQuote()
}

const addDays = (date, days) => {
  const value = new Date(`${date}T00:00:00`)
  value.setDate(value.getDate() + days)
  return formatDate(value)
}

const loadAvailability = async (findNextDate = false, attempts = 0) => {
  if (!selectedItem.value) return
  try {
    const result = await getServiceAvailability({ service_item_id: selectedItem.value.id, date: appointmentDate.value })
    availableSlots.value = result.data?.slots || []
    const firstAvailable = availableSlots.value.find((slot) => slot.status === 'available')
    appointmentTime.value = firstAvailable?.time || ''
    if (findNextDate && !firstAvailable && attempts < 14) {
      appointmentDate.value = addDays(appointmentDate.value, 1)
      await loadAvailability(true, attempts + 1)
    }
  } catch (error) {
    availableSlots.value = []
    appointmentTime.value = ''
    uni.showToast({ title: error.msg || '预约时段读取失败', icon: 'none' })
  }
}

const changeAppointmentDate = async ({ detail }) => {
  appointmentDate.value = detail.value
  await loadAvailability()
}
const selectSlot = (slot) => {
  if (slot.status === 'full') {
    uni.showToast({ title: '该时段预约已满，请选择其他时间', icon: 'none' })
    return
  }
  appointmentTime.value = slot.time
}

const loadQuote = async () => {
  if (!selectedItem.value) return
  try { serviceQuote.value = (await getServiceQuote({ service_item_id:selectedItem.value.id, user_coupon_id:selectedCouponId.value, points_to_use:selectedPoints.value || 0 })).data || null } catch (_) { serviceQuote.value = null }
}
const toggleCoupon = async (id) => { selectedCouponId.value = selectedCouponId.value === id ? 0 : id; await loadQuote() }

const closeBooking = () => {
  if (submitting.value) return
  selectedItem.value = null
}

const submitBooking = async () => {
  if (!selectedItem.value || submitting.value) return
  if (!form.value.plateNo || !form.value.customerName || !form.value.mobile) {
    uni.showToast({ title: '请填写车牌、联系人和手机号', icon: 'none' })
    return
  }
  if (!appointmentTime.value) {
    uni.showToast({ title: '请选择可预约时段', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const result = await createServiceOrder({
      service_item_id: selectedItem.value.id,
      appointment_time: `${appointmentDate.value} ${appointmentTime.value}:00`,
      service_plate_no: form.value.plateNo,
      customer_name: form.value.customerName,
      customer_mobile: form.value.mobile,
      remark: form.value.remark,
      user_coupon_id: selectedCouponId.value,
      points_to_use: selectedPoints.value || 0
    })
    selectedItem.value = null
    uni.showModal({
      title: '订单已创建',
      content: result.msg || '请先完成支付，门店将尽快确认服务时间。',
      showCancel: false,
      success: () => uni.redirectTo({ url: `/pages/order/service-payment?id=${result.data?.id}` })
    })
  } catch (error) {
    if (error.code === 401) {
      uni.navigateTo({ url: '/pages/login/index' })
      return
    }
    uni.showToast({ title: error.msg || '预约提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

const loadServices = async () => {
  loading.value = true
  try {
    const result = await getServices()
    categories.value = result.data?.categories || []
    items.value = result.data?.items || []
    if (!categories.value.some((category) => category.id === activeCategoryId.value)) {
      activeCategoryId.value = categories.value[0]?.id || 0
    }
  } catch (error) {
    categories.value = []
    items.value = []
    activeCategoryId.value = 0
    uni.showToast({ title: error.msg || '服务读取失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onShow(loadServices)
</script>

<style scoped>
.page { min-height: 100vh; padding-bottom: calc(260rpx + env(safe-area-inset-bottom)); background: #f5f7fa; }
.service-head { padding: 34rpx 32rpx 28rpx; background: #fff; }
.page-title { display: block; color: #1f2937; font-size: 38rpx; font-weight: 700; }
.page-subtitle { display: block; margin-top: 10rpx; color: #6b7280; font-size: 23rpx; }
.service-layout { display: flex; height: calc(100vh - 304rpx - env(safe-area-inset-bottom)); min-height: 520rpx; margin-top: 16rpx; }
.category-panel { flex: 0 0 188rpx; width: 188rpx; padding-bottom: 40rpx; box-sizing: border-box; background: #fff; }
.category-item { position: relative; display: flex; align-items: center; justify-content: space-between; min-height: 94rpx; padding: 0 22rpx; border-bottom: 1rpx solid #f1f5f9; color: #6b7280; font-size: 25rpx; }
.category-item.active { background: #eff6ff; color: #1677ff; font-weight: 700; }
.category-item.active::before { position: absolute; top: 22rpx; bottom: 22rpx; left: 0; width: 6rpx; border-radius: 0 4rpx 4rpx 0; background: #1677ff; content: ''; }
.category-count { color: #9ca3af; font-size: 20rpx; }
.category-item.active .category-count { color: #1677ff; }
.category-empty { padding: 40rpx 20rpx; color: #9ca3af; text-align: center; font-size: 22rpx; }
.item-panel { flex: 1; min-width: 0; padding: 0 22rpx 60rpx; box-sizing: border-box; }
.item-list { display: flex; flex-direction: column; gap: 16rpx; }
.service-card { display: flex; gap: 16rpx; padding: 16rpx; border-radius: 8rpx; background: #fff; }
.service-image { flex: 0 0 142rpx; width: 142rpx; height: 142rpx; border-radius: 6rpx; }
.image-placeholder { display: flex; align-items: center; justify-content: center; background: #e8f1ff; color: #1677ff; font-size: 42rpx; font-weight: 700; }
.service-info { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.service-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12rpx; }
.service-name { color: #1f2937; font-size: 28rpx; font-weight: 700; }
.service-price { flex: 0 0 auto; color: #f97316; font-size: 27rpx; font-weight: 700; }
.service-unit { color: #9ca3af; font-size: 20rpx; font-weight: 400; }
.service-description { display: block; margin-top: 16rpx; color: #6b7280; font-size: 23rpx; line-height: 1.55; }
.service-footer { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; margin-top: auto; padding-top: 16rpx; }
.service-hint { color: #9ca3af; font-size: 20rpx; }
.reserve-button { flex: 0 0 auto; min-width: 84rpx; margin: 0; padding: 0 16rpx; border-radius: 6rpx; background: #1677ff; color: #fff; font-size: 22rpx; line-height: 52rpx; }
.empty-state { padding: 120rpx 20rpx; color: #9ca3af; text-align: center; font-size: 25rpx; }
.booking-mask { position: fixed; z-index: 220; top: 0; right: 0; bottom: 0; left: 0; display: flex; align-items: flex-end; background: rgba(15, 23, 42, .45); }
.booking-sheet { display: flex; flex-direction: column; width: 100%; max-height: 82vh; padding: 30rpx 32rpx calc(28rpx + env(safe-area-inset-bottom)); border-radius: 18rpx 18rpx 0 0; background: #fff; box-sizing: border-box; }
.booking-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20rpx; }
.booking-title { display: block; color: #1f2937; font-size: 34rpx; font-weight: 700; }
.booking-price { display: block; margin-top: 8rpx; color: #f97316; font-size: 24rpx; }
.booking-close { color: #94a3b8; font-size: 44rpx; line-height: 40rpx; }
.booking-body { flex: 1; min-height: 0; margin-top: 20rpx; overflow-y: auto; }
.form-row { display: flex; align-items: center; min-height: 88rpx; border-bottom: 1rpx solid #eef0f4; }
.form-label { flex: 0 0 132rpx; color: #374151; font-size: 25rpx; }
.picker-value { color: #374151; font-size: 25rpx; }.picker-value.primary { color: #1677ff; font-weight: 600; }.no-slot { display:block;padding:20rpx 0;color:#9ca3af;font-size:24rpx; }
.time-section { padding: 18rpx 0; border-bottom: 1rpx solid #eef0f4; }
.time-section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:14rpx; }
.time-section-tip { color:#94a3b8; font-size:21rpx; }
.slot-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:12rpx; }
.slot-item { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:80rpx; border:1rpx solid #dbeafe; border-radius:6rpx; background:#f8fbff; color:#1677ff; font-size:23rpx; box-sizing:border-box; }
.slot-status { margin-top:4rpx; color:#7c9bc4; font-size:18rpx; }
.slot-item.selected { border-color:#1677ff; background:#e8f3ff; font-weight:700; box-shadow:0 0 0 2rpx rgba(22,119,255,.12); }
.slot-item.full { border-color:#edf0f4; background:#f5f6f8; color:#a5afbd; }
.slot-item.full .slot-status { color:#b3bac5; }
.form-input { flex: 1; min-width: 0; height: 72rpx; color: #1f2937; font-size: 25rpx; text-align: right; }
.remark-row { align-items: flex-start; padding: 16rpx 0; }
.form-textarea { flex: 1; height: 126rpx; min-width: 0; padding: 12rpx; border-radius: 6rpx; background: #f8fafc; box-sizing: border-box; color: #1f2937; font-size: 24rpx; line-height: 1.5; }
.booking-note { margin-top: 18rpx; padding: 16rpx; border-radius: 6rpx; background: #f7fbff; color: #5b7aa3; font-size: 22rpx; line-height: 1.5; }
.marketing-box,.pricing-note{margin-top:18rpx;padding:16rpx;border-radius:6rpx;background:#f8fafc}.pricing-note{background:#fff7ed;color:#b45309;font-size:22rpx;line-height:1.55}.marketing-title{display:block;color:#374151;font-size:24rpx;font-weight:700}.promotion-list{display:flex;flex-direction:column;gap:8rpx;padding-top:12rpx}.promotion-note{color:#0f8e69;font-size:22rpx}.coupon-option{padding:12rpx 0;color:#1677ff;font-size:22rpx}.marketing-note{display:block;padding:12rpx 0;color:#94a3b8;font-size:22rpx}.points-line,.price-line{display:flex;justify-content:space-between;gap:12rpx;padding-top:12rpx;color:#64748b;font-size:22rpx}.points-line input{width:120rpx;height:48rpx;background:#fff;color:#1677ff;text-align:right}.price-line .payable{color:#f97316;font-weight:700}
.submit-button { flex: 0 0 auto; margin-top: 22rpx; border-radius: 8rpx; background: #1677ff; color: #fff; font-size: 28rpx; line-height: 82rpx; }
</style>
