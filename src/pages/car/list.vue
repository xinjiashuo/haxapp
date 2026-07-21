<template>
  <view class="page">
    <view class="booking-panel">
      <text class="page-title">在线订车</text>
      <text class="page-subtitle">选择取还时间，查看可订车辆</text>
      <view class="date-card">
        <view class="date-item">
          <text class="date-label">取车</text>
          <view class="picker-row">
            <picker mode="date" :value="pickupDate" @change="changePickupDate"><view class="date-value">{{ pickupDate }}</view></picker>
            <picker mode="time" :value="pickupClock" @change="changePickupClock"><view class="date-time">{{ pickupClock }}</view></picker>
          </view>
          <text class="date-place">市区门店</text>
        </view>
        <view class="date-divider"></view>
        <view class="date-item">
          <text class="date-label">还车</text>
          <view class="picker-row">
            <picker mode="date" :value="returnDate" @change="changeReturnDate"><view class="date-value">{{ returnDate }}</view></picker>
            <picker mode="time" :value="returnClock" @change="changeReturnClock"><view class="date-time">{{ returnClock }}</view></picker>
          </view>
          <text class="date-place">市区门店</text>
        </view>
      </view>
      <view class="rule-entry" @click="openRules">
        <view class="rule-entry-main">
          <text class="rule-entry-title">租车须知</text>
          <text class="rule-entry-desc">限行区域、每日里程、超时还车等规则请在下单前确认</text>
        </view>
        <text class="rule-entry-action">查看</text>
      </view>
    </view>

    <view class="section-head"><text class="section-title">可订车辆</text><text class="section-note">{{ carsLoading ? '读取中' : `${cars.length} 辆可选` }}</text></view>
    <view class="car-list">
      <AppState v-if="carsLoading" type="loading" title="正在查询可订车辆" compact />
      <AppState v-else-if="carsError" type="error" :description="carsError.msg" action-text="重新查询" compact @action="loadCars" />
      <view v-for="car in cars" :key="car.id" class="car-card">
        <image v-if="car.cover_image" class="car-image" :src="car.cover_image" mode="aspectFill" />
        <view v-else class="car-visual">{{ car.brand }}</view>
        <view class="car-info"><text class="car-name">{{ car.name }}</text><text class="car-meta">{{ car.energy_type_text }} · {{ car.seats || '-' }}座 · {{ car.car_type_text }}</text><text class="car-price">¥{{ car.daily_price }}<text class="price-unit"> / 天起</text></text></view>
        <button class="reserve-button" @click="reserve(car)">订车</button>
      </view>
      <AppState v-if="!carsLoading && !carsError && !cars.length" type="empty" title="当前时段暂无可租车辆" description="可调整取还车日期和时间后重新查询" action-text="重新查询" compact @action="loadCars" />
    </view>

    <view v-if="rulesVisible" class="rule-mask" @click="closeRules">
      <view class="rule-sheet" @click.stop>
        <view class="rule-sheet-head">
          <view>
            <text class="rule-sheet-title">{{ pendingCar ? '确认租车订单' : '租车须知' }}</text>
            <text v-if="rulesVersion" class="rule-version">规则版本 {{ rulesVersion }}</text>
          </view>
          <text class="rule-close" @click="closeRules">×</text>
        </view>
        <scroll-view scroll-y class="rule-content-scroll">
          <view v-if="pendingCar" class="selected-car">
            <text class="selected-car-name">{{ pendingCar.name }}</text>
            <text class="selected-car-time">{{ pickupTimeText }} 至 {{ returnTimeText }}</text>
          </view>
          <view v-if="pendingCar && quoteLoading" class="rule-empty">费用计算中</view>
          <view v-if="pendingCar && quote && !quoteLoading" class="quote-summary">
            <view class="quote-row"><text>基础租金</text><text>¥{{ quote.base_amount }}</text></view>
            <view class="quote-row"><text>保险费用</text><text>¥{{ quote.insurance_amount }}</text></view>
            <view v-if="Number(quote.delivery_amount) > 0" class="quote-row"><text>{{ quote.delivery_name || '送车上门' }}</text><text>¥{{ quote.delivery_amount }}</text></view>
            <view v-if="Number(quote.return_amount) > 0" class="quote-row"><text>{{ quote.return_name || '异地还车' }}</text><text>¥{{ quote.return_amount }}</text></view>
            <view v-if="Number(quote.vip_discount_amount) > 0" class="quote-row discount"><text>VIP优惠</text><text>-¥{{ quote.vip_discount_amount }}</text></view>
            <view v-for="promotion in quote.promotions || []" :key="promotion.id" class="quote-row discount"><text>{{ promotion.rule_name }}</text><text v-if="Number(promotion.discount_amount)>0">-¥{{ promotion.discount_amount }}</text><text v-else>完成订单后赠送积分</text></view>
            <view v-if="Number(quote.coupon_discount_amount) > 0" class="quote-row discount"><text>优惠券</text><text>-¥{{ quote.coupon_discount_amount }}</text></view>
            <view v-if="Number(quote.points_discount_amount) > 0" class="quote-row discount"><text>积分抵扣</text><text>-¥{{ quote.points_discount_amount }}</text></view>
            <view class="quote-row total"><text>应付租金</text><text>¥{{ quote.total_amount }}</text></view>
            <view class="quote-row deposit"><text>另付押金</text><text>¥{{ quote.deposit_amount }}</text></view>
          </view>
          <view v-if="pendingCar && quote && !quoteLoading && rentalAccess.notice" class="booking-access" :class="rentalAccess.notice_type">
            <text class="booking-access-title">{{ bookingAccessTitle }}</text>
            <text class="booking-access-content">{{ rentalAccess.notice }}</text>
          </view>
          <view v-if="pendingCar && quote && !quoteLoading" class="booking-options">
            <text class="options-title">取车方式</text>
            <view class="delivery-options">
              <view v-for="option in deliveryOptions" :key="option.mode" class="delivery-option" :class="{ active: selectedDeliveryMode === option.mode, disabled: !option.available }" @click="selectDeliveryMode(option.mode)">
                <text>{{ option.name }}</text>
                <text class="delivery-amount">{{ Number(option.amount) > 0 ? `¥${option.amount}` : '免费' }}</text>
              </view>
            </view>
            <input v-if="selectedDeliveryMode === 'delivery'" v-model.trim="deliveryAddress" class="delivery-address" maxlength="120" placeholder="请输入青岛市区送车地址" />
            <text v-if="selectedDeliveryMode === 'delivery' && selectedDeliveryOption?.notice" class="option-notice">{{ selectedDeliveryOption.notice }}</text>
            <view class="return-options-section">
              <text class="options-title">还车方式</text>
              <view class="delivery-options">
                <view v-for="option in returnOptions" :key="option.mode" class="delivery-option" :class="{ active: selectedReturnMode === option.mode, disabled: !option.available }" @click="selectReturnMode(option.mode)">
                  <text>{{ option.name }}</text>
                  <text class="delivery-amount">{{ Number(option.amount) > 0 ? `¥${option.amount}` : '免费' }}</text>
                </view>
              </view>
              <input v-if="selectedReturnMode === 'remote'" v-model.trim="returnAddress" class="delivery-address" maxlength="120" placeholder="请输入异地还车地址" />
              <text v-if="selectedReturnMode === 'remote' && selectedReturnOption?.notice" class="option-notice">{{ selectedReturnOption.notice }}</text>
            </view>
            <view class="insurance-section visible-insurance">
              <view class="insurance-heading"><text class="insurance-title">车辆 / 行车保障</text><text class="insurance-link" @click="showInsuranceGuide">保障说明</text></view>
              <view v-if="quote.insurance_options?.length" class="insurance-compare-wrap"><scroll-view scroll-x class="insurance-scroll"><view class="insurance-compare"><view class="insurance-label-column"><view class="insurance-head-spacer">保障项目</view><view class="insurance-label">保障说明</view><view class="insurance-label">免赔 / 自付</view><view class="insurance-label">承保范围</view><view class="insurance-label">三者保障</view><view class="insurance-label">易损件</view><view class="insurance-label">免责说明</view><view class="insurance-label insurance-price-label">费用</view></view><view v-for="option in quote.insurance_options" :key="option.id" class="insurance-plan" :class="{ selected: selectedInsuranceIds.includes(option.id) }"><view class="insurance-plan-head" @click="toggleInsurance(option.id)"><view class="plan-badge">保</view><text class="plan-name">{{ option.name }}</text><text v-if="selectedInsuranceIds.includes(option.id)" class="plan-selected">已选</text><text v-else class="plan-select">选择</text></view><view class="insurance-cell"><text>{{ option.description || '基础保障' }}</text></view><view class="insurance-cell strong"><text>{{ Number(option.deductible_amount)>0 ? `¥${option.deductible_amount}` : '免赔额为 0' }}</text></view><view class="insurance-cell"><text>{{ option.coverage_scope || '以保险条款为准' }}</text></view><view class="insurance-cell strong"><text>{{ option.third_party_amount_text || '未包含' }}</text></view><view class="insurance-cell"><text>{{ option.includes_vulnerable_parts ? '包含' : '不包含' }}</text></view><view class="insurance-cell"><text>{{ option.exclusions || '无额外说明' }}</text></view><view class="insurance-price"><text>¥{{ option.amount }}</text><text>{{ option.pricing_type === 'per_day' ? `¥${option.unit_price} / 天` : '按单收取' }}</text><button class="plan-action" @click.stop="toggleInsurance(option.id)">{{ selectedInsuranceIds.includes(option.id) ? '已选择' : '选择' }}</button><text class="plan-detail" @click.stop="toggleInsuranceDetail(option.id)">{{ expandedInsuranceId===option.id ? '收起详情' : '查看详情' }}</text></view><view v-if="expandedInsuranceId===option.id" class="insurance-detail"><text v-if="option.terms">条款备注：{{ option.terms }}</text><text>最终保障以门店合同及保险条款为准。</text></view></view></view></scroll-view></view>
              <text v-else class="no-insurance">当前车辆暂无可选商业保险，默认仅含交强险</text>
            </view>
            <view class="insurance-section">
              <text v-if="quote.promotions?.length" class="insurance-title">已享活动</text>
              <view v-if="quote.promotions?.length" class="promotion-list"><text v-for="promotion in quote.promotions" :key="promotion.id" class="promotion-note">{{ promotion.rule_name }}{{ Number(promotion.gift_days)>0 ? `，赠送 ${promotion.gift_days} 天租金` : '' }}</text></view>
              <text class="insurance-title">优惠券</text>
              <view v-if="quote.coupon_options?.length"><view v-for="option in quote.coupon_options" :key="option.user_coupon_id" class="insurance-option" @click="toggleCoupon(option.user_coupon_id)"><view class="insurance-check" :class="{ checked: selectedUserCouponId === option.user_coupon_id }">✓</view><view class="insurance-info"><text>{{ option.coupon_name }}</text><text class="insurance-note">减 ¥{{ option.discount_amount }}</text></view></view></view>
              <text v-else class="no-insurance">暂无可用优惠券</text>
            </view>
            <view class="insurance-section"><text class="insurance-title">积分抵扣</text><view v-if="Number(quote.points_max_use)>0" class="points-row"><text>可用 {{ quote.points_available }} 积分，最多抵扣 {{ quote.points_max_use }} 积分</text><input v-model.number="selectedPoints" type="number" class="points-input" @blur="loadQuote" /></view><text v-else class="no-insurance">当前订单暂无可用积分抵扣</text></view>
          </view>
          <view class="rule-list">
            <view v-if="rulesLoading" class="rule-empty">规则读取中</view>
            <view v-else-if="!rentalRules.length" class="rule-empty">暂无下单规则</view>
            <block v-else>
              <view v-for="rule in rentalRules" :key="rule.code" class="rule-item">
                <view class="rule-item-head">
                  <text class="rule-title">{{ rule.title }}</text>
                  <text v-if="rule.required_ack" class="rule-required">需确认</text>
                </view>
                <text class="rule-content">{{ rule.content }}</text>
                <text v-if="formatRuleValue(rule)" class="rule-value">{{ formatRuleValue(rule) }}</text>
              </view>
            </block>
          </view>
        </scroll-view>
        <view v-if="requiredRuleCount > 0" class="rule-ack" @click="ackChecked = !ackChecked">
          <view class="ack-box" :class="{ checked: ackChecked }"></view>
          <text class="ack-text">我已阅读并同意以上租车须知</text>
        </view>
        <button class="rule-confirm" :class="{ disabled: (requiredRuleCount > 0 && !ackChecked) || quoteLoading || !canCreateOnline }" @click="confirmRules">{{ pendingCar ? (canCreateOnline ? '提交订单' : '请联系门店') : '关闭' }}</button>
      </view>
    </view>
    <AppBottomNav active="car" />
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppBottomNav from '../../components/AppBottomNav.vue'
import AppState from '../../components/AppState.vue'
import { getBookingRentalRules } from '../../api/rentalRule'
import { createRentalOrder, getRentalCars, getRentalQuote } from '../../api/rental'

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatTime = (date) => {
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${hour}:${minute}`
}

const parseBookingDate = (dateText, timeText) => {
  const [year, month, day] = dateText.split('-').map(Number)
  const [hour, minute] = timeText.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, 0)
}

const syncReturnTime = () => {
  const pickup = parseBookingDate(pickupDate.value, pickupClock.value)
  const nextDay = new Date(pickup.getTime() + 24 * 60 * 60 * 1000)
  returnDate.value = formatDate(nextDay)
  returnClock.value = formatTime(nextDay)
}

const now = new Date()
const nextHour = new Date(now)
nextHour.setMinutes(0, 0, 0)
nextHour.setHours(nextHour.getHours() + 1)
const later = new Date(nextHour.getTime() + 24 * 60 * 60 * 1000)
const cars = ref([])
const carsLoading = ref(false)
const carsError = ref(null)
const pickupDate = ref(formatDate(nextHour))
const pickupClock = ref(formatTime(nextHour))
const returnDate = ref(formatDate(later))
const returnClock = ref(formatTime(later))

const rentalRules = ref([])
const rulesVersion = ref('')
const rulesVisible = ref(false)
const rulesLoading = ref(false)
const ackChecked = ref(false)
const pendingCar = ref(null)
const quote = ref(null)
const quoteLoading = ref(false)
const selectedInsuranceIds = ref([])
const expandedInsuranceId = ref(0)
const selectedUserCouponId = ref(0)
const selectedPoints = ref(0)
const selectedDeliveryMode = ref('store')
const deliveryAddress = ref('')
const selectedReturnMode = ref('store')
const returnAddress = ref('')
const requiredRuleCount = computed(() => rentalRules.value.filter((rule) => rule.required_ack).length)
const pickupTimeText = computed(() => `${pickupDate.value} ${pickupClock.value}`)
const returnTimeText = computed(() => `${returnDate.value} ${returnClock.value}`)
const deliveryOptions = computed(() => quote.value?.delivery_options || [
  { mode: 'store', name: '到店取车', amount: '0.00', available: true },
  { mode: 'delivery', name: '送车上门', amount: '0.00', available: false, notice: '送车上门暂未配置' }
])
const selectedDeliveryOption = computed(() => deliveryOptions.value.find((option) => option.mode === selectedDeliveryMode.value) || deliveryOptions.value[0])
const returnOptions = computed(() => quote.value?.return_options || [
  { mode: 'store', name: '原门店还车', amount: '0.00', available: true },
  { mode: 'remote', name: '异地还车', amount: '0.00', available: false, notice: '异地还车暂未配置' }
])
const selectedReturnOption = computed(() => returnOptions.value.find((option) => option.mode === selectedReturnMode.value) || returnOptions.value[0])
const rentalAccess = computed(() => quote.value?.rental_access || { can_create_order: true, credit_deposit_available: true, notice_type: '', notice: '' })
const canCreateOnline = computed(() => rentalAccess.value.can_create_order !== false)
const bookingAccessTitle = computed(() => rentalAccess.value.notice_type === 'deposit_required' ? '押金方式提示' : '订车提示')

const loadRules = async () => {
  rulesLoading.value = true
  try {
    const res = await getBookingRentalRules()
    rentalRules.value = res.data?.rules || []
    rulesVersion.value = res.data?.version || ''
  } catch (error) {
    rentalRules.value = []
    rulesVersion.value = ''
  } finally {
    rulesLoading.value = false
  }
}

const loadCars = async () => {
  carsLoading.value = true
  carsError.value = null
  try {
    const result = await getRentalCars({ pickup_time: pickupTimeText.value, return_time: returnTimeText.value })
    cars.value = result.data?.data || []
  } catch (error) {
    cars.value = []
    carsError.value = error
  } finally {
    carsLoading.value = false
  }
}

const loadQuote = async () => {
  if (!pendingCar.value) return
  quoteLoading.value = true
  try {
    const result = await getRentalQuote({
      car_id: pendingCar.value.id,
      pickup_time: pickupTimeText.value,
      return_time: returnTimeText.value,
      insurance_ids: selectedInsuranceIds.value.join(','),
      delivery_mode: selectedDeliveryMode.value,
      return_mode: selectedReturnMode.value,
      user_coupon_id: selectedUserCouponId.value,
      points_to_use: selectedPoints.value || 0
    })
    quote.value = result.data || null
  } catch (error) {
    quote.value = null
    uni.showToast({ title: error.msg || '费用计算失败', icon: 'none' })
  } finally {
    quoteLoading.value = false
  }
}

const refreshBookingData = async () => {
  await loadCars()
  if (pendingCar.value) await loadQuote()
}

const openRules = () => {
  pendingCar.value = null
  quote.value = null
  selectedInsuranceIds.value = []
  expandedInsuranceId.value = 0
  selectedUserCouponId.value = 0
  selectedPoints.value = 0
  selectedDeliveryMode.value = 'store'
  deliveryAddress.value = ''
  selectedReturnMode.value = 'store'
  returnAddress.value = ''
  ackChecked.value = false
  rulesVisible.value = true
  if (!rentalRules.value.length && !rulesLoading.value) loadRules()
}

const closeRules = () => {
  rulesVisible.value = false
}

const formatRuleValue = (rule) => {
  if (rule.value === null || rule.value === undefined || rule.value === '') return ''
  if (Array.isArray(rule.value) || typeof rule.value === 'object') return ''
  return `${rule.value}${rule.unit ? ' ' + rule.unit : ''}`
}

const reserve = (car) => {
  pendingCar.value = car
  quote.value = null
  selectedInsuranceIds.value = []
  expandedInsuranceId.value = 0
  selectedUserCouponId.value = 0
  selectedPoints.value = 0
  selectedDeliveryMode.value = 'store'
  deliveryAddress.value = ''
  selectedReturnMode.value = 'store'
  returnAddress.value = ''
  ackChecked.value = false
  rulesVisible.value = true
  if (!rentalRules.value.length && !rulesLoading.value) loadRules()
  loadQuote()
}

const toggleInsurance = async (id) => {
  selectedInsuranceIds.value = selectedInsuranceIds.value.includes(id)
    ? selectedInsuranceIds.value.filter((item) => item !== id)
    : [...selectedInsuranceIds.value, id]

  // 保险选项的完整价格已在当前报价中返回，先在本地更新展示，避免每次点选重绘整个下单面板。
  if (quote.value) {
    const options = quote.value.insurance_options || []
    const selected = options.filter((option) => selectedInsuranceIds.value.includes(option.id))
    const insuranceAmount = selected.reduce((sum, option) => sum + Number(option.amount || 0), 0)
    const previousInsurance = Number(quote.value.insurance_amount || 0)
    const baseTotal = Number(quote.value.total_amount || 0) - previousInsurance
    quote.value = {
      ...quote.value,
      insurance_amount: insuranceAmount.toFixed(2),
      total_amount: Math.max(0, baseTotal + insuranceAmount).toFixed(2)
    }
  }
}

const toggleInsuranceDetail = (id) => { expandedInsuranceId.value = expandedInsuranceId.value === id ? 0 : id }
const showInsuranceGuide = () => uni.showModal({ title: '保障说明', content: '商业保险为可选服务。免赔额、承保范围、三者保障、易损件和免责事项以所选产品条款及最终租赁合同为准。', showCancel: false })

const toggleCoupon = async (id) => {
  selectedUserCouponId.value = selectedUserCouponId.value === id ? 0 : id
  await loadQuote()
}

const selectDeliveryMode = async (mode) => {
  const option = deliveryOptions.value.find((item) => item.mode === mode)
  if (!option || !option.available) {
    uni.showToast({ title: option?.notice || '该取车方式暂不可用', icon: 'none' })
    return
  }
  if (selectedDeliveryMode.value === mode) return
  selectedDeliveryMode.value = mode
  await loadQuote()
}

const selectReturnMode = async (mode) => {
  const option = returnOptions.value.find((item) => item.mode === mode)
  if (!option || !option.available) {
    uni.showToast({ title: option?.notice || '该还车方式暂不可用', icon: 'none' })
    return
  }
  if (selectedReturnMode.value === mode) return
  selectedReturnMode.value = mode
  await loadQuote()
}

const confirmRules = async () => {
  if (!pendingCar.value) {
    closeRules()
    return
  }
  if (!canCreateOnline.value) {
    uni.showModal({ title: bookingAccessTitle.value, content: rentalAccess.value.notice || '当前订单需门店处理，请在个人中心联系门店。', showCancel: false })
    return
  }
  if (requiredRuleCount.value > 0 && !ackChecked.value) {
    uni.showToast({ title: '请先确认租车须知', icon: 'none' })
    return
  }
  if (selectedDeliveryMode.value === 'delivery' && !deliveryAddress.value) {
    uni.showToast({ title: '请填写送车上门地址', icon: 'none' })
    return
  }
  if (selectedReturnMode.value === 'remote' && !returnAddress.value) {
    uni.showToast({ title: '请填写异地还车地址', icon: 'none' })
    return
  }
  if (!quote.value || quoteLoading.value) {
    uni.showToast({ title: '费用还在计算，请稍候', icon: 'none' })
    return
  }

  try {
    const result = await createRentalOrder({
      car_id: pendingCar.value.id,
      pickup_time: pickupTimeText.value,
      return_time: returnTimeText.value,
      pickup_location: deliveryAddress.value || '市区门店',
      return_location: returnAddress.value || '市区门店',
      insurance_ids: selectedInsuranceIds.value,
      user_coupon_id: selectedUserCouponId.value,
      points_to_use: selectedPoints.value || 0,
      delivery_mode: selectedDeliveryMode.value,
      delivery_address: deliveryAddress.value,
      return_mode: selectedReturnMode.value,
      return_address: returnAddress.value,
      rules_acknowledged: true
    })
    rulesVisible.value = false
    const orderId = result.data?.id || 0
    if (!orderId) {
      uni.showToast({ title: '订单创建成功，请在订单中支付', icon: 'none' })
      uni.reLaunch({ url: '/pages/order/list' })
      return
    }
    uni.navigateTo({ url: `/pages/order/payment?id=${orderId}` })
  } catch (error) {
    if (error.code === 403 && error.data?.offline_booking_available) {
      uni.showModal({
        title: '需要实名认证',
        content: error.msg || '完成实名认证并通过审核后才可以在线下单。',
        cancelText: '暂不认证',
        confirmText: '去认证',
        success: ({ confirm }) => {
          if (!confirm) return
          rulesVisible.value = false
          uni.navigateTo({ url: '/pages/profile/certification' })
        }
      })
      return
    }
    uni.showToast({ title: error.msg || '订单创建失败', icon: 'none' })
  }
}

const changePickupDate = async (event) => {
  pickupDate.value = event.detail.value
  syncReturnTime()
  await refreshBookingData()
}

const changePickupClock = async (event) => {
  pickupClock.value = event.detail.value
  syncReturnTime()
  await refreshBookingData()
}

const changeReturnDate = async (event) => {
  returnDate.value = event.detail.value
  await refreshBookingData()
}

const changeReturnClock = async (event) => {
  returnClock.value = event.detail.value
  await refreshBookingData()
}

onMounted(async () => {
  await Promise.all([loadCars(), loadRules()])
})
</script>

<style scoped>
.page { min-height: 100vh; padding: 32rpx 32rpx calc(260rpx + env(safe-area-inset-bottom)); }
.booking-panel { padding: 30rpx; border-radius: 8rpx; background: #fff; }
.page-title { display: block; font-size: 38rpx; font-weight: 700; }
.page-subtitle { display: block; margin-top: 12rpx; color: #6b7280; font-size: 24rpx; }
.date-card { display: flex; align-items: stretch; margin-top: 28rpx; padding: 22rpx 0; border-top: 1rpx solid #e5e7eb; }
.date-item { display: flex; flex: 1; flex-direction: column; }
.date-label { color: #6b7280; font-size: 22rpx; }
.picker-row { display: flex; align-items: baseline; gap: 12rpx; margin-top: 8rpx; }
.date-value { margin-top: 8rpx; font-size: 28rpx; font-weight: 600; }
.date-time { color: #1677ff; font-size: 28rpx; font-weight: 600; }
.date-place { margin-top: 8rpx; color: #6b7280; font-size: 22rpx; }
.date-divider { width: 1rpx; margin: 0 20rpx; background: #e5e7eb; }
.rule-entry { display: flex; align-items: center; justify-content: space-between; margin-top: 20rpx; padding: 18rpx 20rpx; border: 1rpx solid #dce8ff; border-radius: 8rpx; background: #f7fbff; }
.rule-entry-main { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.rule-entry-title { color: #1f2937; font-size: 26rpx; font-weight: 700; }
.rule-entry-desc { margin-top: 8rpx; color: #6b7280; font-size: 22rpx; line-height: 1.45; }
.rule-entry-action { flex: 0 0 auto; margin-left: 16rpx; color: #1677ff; font-size: 24rpx; font-weight: 600; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; margin: 38rpx 0 20rpx; }
.section-title { font-size: 34rpx; font-weight: 700; }
.section-note { color: #6b7280; font-size: 22rpx; }
.car-list { display: flex; flex-direction: column; gap: 18rpx; }
.car-card { display: flex; align-items: center; gap: 16rpx; padding: 18rpx; border-radius: 8rpx; background: #fff; }
.car-image { flex: 0 0 142rpx; width: 142rpx; height: 104rpx; border-radius: 6rpx; }
.car-visual { display: flex; flex: 0 0 142rpx; align-items: center; justify-content: center; width: 142rpx; height: 104rpx; border-radius: 6rpx; background: #e8f1ff; color: #1677ff; font-size: 20rpx; font-weight: 700; }
.car-info { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.car-name { font-size: 28rpx; font-weight: 600; }
.car-meta { margin-top: 8rpx; color: #6b7280; font-size: 21rpx; }
.car-price { margin-top: 12rpx; color: #ff8a00; font-size: 28rpx; font-weight: 700; }
.price-unit { color: #6b7280; font-size: 19rpx; font-weight: 400; }
.reserve-button { flex: 0 0 88rpx; width: 88rpx; padding: 0; border-radius: 6rpx; background: #1677ff; color: #fff; font-size: 24rpx; line-height: 64rpx; }
.list-empty { padding: 70rpx 24rpx; border-radius: 8rpx; background: #fff; color: #9ca3af; text-align: center; font-size: 25rpx; }
.rule-mask { position: fixed; z-index: 200; top: 0; right: 0; bottom: 0; left: 0; display: flex; align-items: flex-end; background: rgba(15, 23, 42, .42); }
.rule-sheet { display: flex; flex-direction: column; width: 100%; height: 88vh; max-height: calc(100vh - 24rpx); padding: 28rpx 32rpx calc(40rpx + env(safe-area-inset-bottom)); border-radius: 18rpx 18rpx 0 0; background: #fff; box-sizing: border-box; overflow: hidden; }
.rule-sheet-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20rpx; }
.rule-sheet-title { display: block; color: #111827; font-size: 34rpx; font-weight: 700; }
.rule-version { display: block; margin-top: 8rpx; color: #9ca3af; font-size: 22rpx; }
.rule-close { flex: 0 0 auto; color: #6b7280; font-size: 44rpx; line-height: 40rpx; }
.selected-car { margin-top: 18rpx; padding: 18rpx; border-radius: 8rpx; background: #f7fbff; }
.selected-car-name { display: block; color: #1f2937; font-size: 28rpx; font-weight: 700; }
.selected-car-time { display: block; margin-top: 8rpx; color: #6b7280; font-size: 22rpx; }
.quote-summary { margin-top: 16rpx; padding: 18rpx; border-radius: 8rpx; background: #f8fafc; }
.quote-row { display: flex; justify-content: space-between; padding: 7rpx 0; color: #4b5563; font-size: 24rpx; }
.quote-row.discount { color: #0f8e69; }
.quote-row.total { margin-top: 6rpx; padding-top: 14rpx; border-top: 1rpx solid #e5e7eb; color: #111827; font-size: 29rpx; font-weight: 700; }
.quote-row.deposit { color: #9a6700; font-size: 22rpx; }
.booking-access { display:flex; flex-direction:column; gap:8rpx; margin-top:16rpx; padding:18rpx; border-radius:8rpx; background:#fff7ed; color:#9a6700; }.booking-access.deposit_required { background:#eef6ff; color:#2563eb; }.booking-access-title { font-size:24rpx; font-weight:700; }.booking-access-content { font-size:22rpx; line-height:1.5; }
.points-row { display:flex; align-items:center; justify-content:space-between; gap:16rpx; color:#64748b; font-size:22rpx; }.points-input{width:150rpx;height:56rpx;padding:0 12rpx;border-radius:6rpx;background:#f8fafc;color:#1677ff;font-size:24rpx;text-align:right;box-sizing:border-box;}
.booking-options { margin-top: 16rpx; padding: 18rpx; border-radius: 8rpx; background: #f8fafc; }
.options-title { display: block; color: #1f2937; font-size: 25rpx; font-weight: 700; }
.delivery-options { display: flex; gap: 12rpx; margin-top: 12rpx; }
.delivery-option { flex: 1; padding: 18rpx 10rpx; border: 1rpx solid #dbe3ef; border-radius: 8rpx; color: #374151; text-align: center; font-size: 24rpx; }
.delivery-option.active { border-color: #1677ff; background: #eff6ff; color: #1677ff; }
.delivery-option.disabled { opacity: .5; }
.delivery-amount { display: block; margin-top: 6rpx; color: #6b7280; font-size: 21rpx; }
.delivery-address { height: 76rpx; margin-top: 12rpx; padding: 0 16rpx; border: 1rpx solid #dbe3ef; border-radius: 6rpx; background: #fff; box-sizing: border-box; font-size: 24rpx; }
.option-notice { display: block; margin-top: 8rpx; color: #d97706; font-size: 21rpx; }
.return-options-section { margin-top: 18rpx; padding-top: 16rpx; border-top: 1rpx solid #e5e7eb; }
.insurance-section { margin-top: 14rpx; padding-top: 14rpx; border-top: 1rpx solid #e5e7eb; }
.visible-insurance { margin-top: 20rpx; padding-top: 16rpx; }
.no-insurance { display: block; margin-top: 12rpx; color: #9ca3af; font-size: 22rpx; }
.insurance-title { display: block; color: #1f2937; font-size: 25rpx; font-weight: 700; }
.promotion-list { display: flex; flex-direction: column; gap: 8rpx; margin-top: 12rpx; }
.promotion-note { color: #0f8e69; font-size: 22rpx; }
.insurance-heading { display: flex; align-items: center; justify-content: space-between; }
.insurance-link { color: #64748b; font-size: 22rpx; }
.insurance-compare-wrap { margin-top: 14rpx; overflow: hidden; border: 1rpx solid #dbe3ef; border-radius: 8rpx; background: #fff; }
.insurance-scroll { width: 100%; white-space: nowrap; }
.insurance-compare { display: inline-flex; min-width: 100%; align-items: stretch; white-space: normal; }
.insurance-label-column { position: sticky; left: 0; z-index: 2; flex: 0 0 156rpx; width: 156rpx; background: #f8fafc; box-shadow: 3rpx 0 8rpx rgba(15, 23, 42, .04); }
.insurance-head-spacer, .insurance-label { display: flex; align-items: center; min-height: 98rpx; padding: 0 14rpx; border-bottom: 1rpx solid #edf1f5; box-sizing: border-box; color: #64748b; font-size: 21rpx; line-height: 1.35; }
.insurance-head-spacer { min-height: 128rpx; color: #1f2937; font-size: 23rpx; font-weight: 700; }
.insurance-price-label { min-height: 160rpx; border-bottom: 0; }
.insurance-plan { position: relative; flex: 0 0 216rpx; width: 216rpx; border-right: 1rpx solid #edf1f5; background: #fff; }
.insurance-plan.selected { background: #f1f7ff; box-shadow: inset 0 0 0 2rpx #1677ff; }
.insurance-plan-head { display: flex; align-items: center; flex-direction: column; justify-content: center; min-height: 128rpx; padding: 12rpx; box-sizing: border-box; text-align: center; }
.plan-badge { display: flex; align-items: center; justify-content: center; width: 38rpx; height: 38rpx; border-radius: 50%; background: #dbeafe; color: #1677ff; font-size: 21rpx; font-weight: 700; }
.plan-name { display: block; margin-top: 8rpx; color: #1f2937; font-size: 23rpx; font-weight: 700; line-height: 1.25; }
.plan-select, .plan-selected { display: block; margin-top: 7rpx; font-size: 20rpx; }.plan-select { color: #94a3b8; }.plan-selected { color: #1677ff; }
.insurance-cell { display: flex; align-items: flex-start; justify-content: center; min-height: 98rpx; padding: 14rpx 12rpx; border-top: 1rpx solid #edf1f5; box-sizing: border-box; color: #475569; font-size: 20rpx; line-height: 1.45; text-align: center; word-break: break-all; }
.insurance-cell.strong { align-items: center; color: #1f2937; font-size: 23rpx; font-weight: 700; }
.insurance-price { display: flex; align-items: center; flex-direction: column; justify-content: center; min-height: 160rpx; padding: 12rpx; border-top: 1rpx solid #edf1f5; box-sizing: border-box; color: #ef4444; font-size: 30rpx; font-weight: 700; }.insurance-price text:nth-child(2) { margin-top: 5rpx; color: #94a3b8; font-size: 19rpx; font-weight: 400; }
.plan-action { width: 148rpx; margin: 10rpx 0 0; padding: 0; border: 1rpx solid #1677ff; border-radius: 6rpx; background: #fff; color: #1677ff; font-size: 22rpx; line-height: 48rpx; }.selected .plan-action { background: #1677ff; color: #fff; }
.plan-detail { margin-top: 8rpx; color: #64748b; font-size: 19rpx; font-weight: 400; }
.insurance-detail { padding: 14rpx; border-top: 1rpx solid #bfdbfe; background: #eff6ff; color: #42658e; font-size: 20rpx; line-height: 1.5; }.insurance-detail text { display: block; margin-top: 6rpx; }.insurance-detail text:first-child { margin-top: 0; }
.insurance-option { display: flex; align-items: center; gap: 12rpx; margin-top: 12rpx; padding: 12rpx 0; }
.insurance-check { display: flex; align-items: center; justify-content: center; width: 32rpx; height: 32rpx; border: 2rpx solid #cbd5e1; border-radius: 6rpx; color: transparent; font-size: 22rpx; }
.insurance-check.checked { border-color: #1677ff; background: #1677ff; color: #fff; }
.insurance-info { display: flex; flex: 1; justify-content: space-between; color: #374151; font-size: 24rpx; }
.insurance-note { color: #6b7280; font-size: 22rpx; }
.rule-content-scroll { flex: 1; height: 0; min-height: 0; margin-top: 20rpx; }
.rule-list { padding-bottom: 8rpx; }
.rule-item { padding: 20rpx 0; border-bottom: 1rpx solid #eef0f4; }
.rule-item-head { display: flex; align-items: center; gap: 12rpx; }
.rule-title { color: #1f2937; font-size: 28rpx; font-weight: 700; }
.rule-required { padding: 4rpx 10rpx; border-radius: 6rpx; background: #fff3e6; color: #f97316; font-size: 20rpx; }
.rule-content { display: block; margin-top: 10rpx; color: #4b5563; font-size: 24rpx; line-height: 1.65; }
.rule-value { display: inline-flex; margin-top: 12rpx; padding: 6rpx 12rpx; border-radius: 6rpx; background: #eff6ff; color: #1677ff; font-size: 22rpx; }
.rule-empty { padding: 50rpx 0; color: #9ca3af; text-align: center; font-size: 24rpx; }
.rule-ack { display: flex; flex: 0 0 auto; align-items: center; gap: 12rpx; margin-top: 18rpx; padding: 16rpx 0; }
.ack-box { width: 34rpx; height: 34rpx; border: 2rpx solid #cbd5e1; border-radius: 6rpx; box-sizing: border-box; }
.ack-box.checked { border-color: #1677ff; background: #1677ff; }
.ack-text { color: #374151; font-size: 24rpx; }
.rule-confirm { flex: 0 0 auto; margin-top: 8rpx; border-radius: 8rpx; background: #1677ff; color: #fff; font-size: 28rpx; line-height: 78rpx; }
.rule-confirm.disabled { background: #b7cef5; }
</style>
