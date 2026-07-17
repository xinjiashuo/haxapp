<template>
  <view class="page">
    <view v-if="loading" class="empty">订单读取中</view>
    <block v-else-if="order">
      <view class="card">
        <text class="title">{{ order.service_item_name }}</text>
        <text class="sub">原预约：{{ order.appointment_time }}</text>
        <text class="sub">服务时长：约 {{ order.service_duration_minutes || 0 }} 分钟</text>
      </view>
      <view class="card">
        <text class="section-title">选择新的预约日期</text>
        <picker mode="date" :value="date" :start="minDate" @change="changeDate"><view class="date-picker">{{ date }}<text>选择日期</text></view></picker>
      </view>
      <view class="card">
        <view class="slot-heading"><text class="section-title">选择到店时段</text><text class="slot-tip">每 15 分钟一个时段</text></view>
        <view v-if="slotLoading" class="empty compact">加载可预约时段</view>
        <view v-else-if="!slots.length" class="empty compact">当天暂无可预约时段</view>
        <view v-else class="slot-grid"><view v-for="slot in slots" :key="slot.time" class="slot" :class="{ selected: selectedTime === slot.time, full: slot.status === 'full' }" @click="selectSlot(slot)"><text>{{ slot.time }}</text><text class="slot-end">至 {{ slot.end_time }}</text><text v-if="slot.status === 'full'" class="full-text">已满</text></view></view>
      </view>
      <view class="card"><text class="section-title">调整说明</text><textarea v-model="reason" maxlength="500" placeholder="例如：行程变化，需要调整到其他时间" /></view>
      <button class="submit" :disabled="!selectedTime || submitting" :loading="submitting" @click="submit">确认改期</button>
    </block>
    <view v-else class="empty">订单不存在或无法改期</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getServiceAvailability, getServiceOrder, rescheduleServiceOrder } from '../../api/service'

const order = ref(null)
const loading = ref(true)
const slotLoading = ref(false)
const slots = ref([])
const selectedTime = ref('')
const reason = ref('')
const submitting = ref(false)
const orderId = ref(0)
const today = new Date()
const pad = (value) => String(value).padStart(2, '0')
const minDate = computed(() => `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`)
const date = ref(minDate.value)

const loadSlots = async () => {
  if (!order.value) return
  selectedTime.value = ''
  slotLoading.value = true
  try {
    const result = await getServiceAvailability({ service_item_id: order.value.service_item_id, date: date.value })
    slots.value = result.data?.slots || []
  } catch (error) {
    slots.value = []
    uni.showToast({ title: error.msg || '可预约时段读取失败', icon: 'none' })
  } finally { slotLoading.value = false }
}
const changeDate = ({ detail }) => { date.value = detail.value; loadSlots() }
const selectSlot = (slot) => { if (slot.status !== 'full') selectedTime.value = slot.time }
const submit = async () => {
  if (!selectedTime.value || submitting.value) return
  submitting.value = true
  try {
    const result = await rescheduleServiceOrder(orderId.value, { appointment_time: `${date.value} ${selectedTime.value}:00`, reason: reason.value || '用户调整预约时间' })
    uni.showToast({ title: result.msg || '预约时间已调整', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (error) {
    uni.showToast({ title: error.msg || '改期失败，请重试', icon: 'none' })
    await loadSlots()
  } finally { submitting.value = false }
}

onLoad(async ({ id }) => {
  orderId.value = Number(id)
  try {
    const result = await getServiceOrder(orderId.value)
    order.value = result.data?.order || null
    if (order.value?.appointment_time) date.value = order.value.appointment_time.slice(0, 10)
    await loadSlots()
  } catch (error) {
    uni.showToast({ title: error.msg || '订单读取失败', icon: 'none' })
  } finally { loading.value = false }
})
</script>

<style scoped>
.page{min-height:100vh;padding:24rpx 32rpx 56rpx;box-sizing:border-box}.card{margin-bottom:18rpx;padding:26rpx;border-radius:8rpx;background:#fff}.title,.section-title{display:block;color:#1f2937;font-size:30rpx;font-weight:700}.sub{display:block;margin-top:12rpx;color:#64748b;font-size:23rpx}.date-picker{display:flex;justify-content:space-between;align-items:center;margin-top:18rpx;padding:22rpx;border:1rpx solid #dbe3ee;border-radius:6rpx;color:#273142;font-size:27rpx}.date-picker text{color:#1677ff;font-size:23rpx}.slot-heading{display:flex;justify-content:space-between;align-items:center}.slot-tip{color:#94a3b8;font-size:21rpx}.slot-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14rpx;margin-top:22rpx}.slot{display:flex;min-height:84rpx;flex-direction:column;justify-content:center;align-items:center;border:1rpx solid #dbe3ee;border-radius:6rpx;color:#334155;font-size:25rpx}.slot-end{margin-top:5rpx;color:#94a3b8;font-size:19rpx}.slot.selected{border-color:#1677ff;background:#eef6ff;color:#1677ff}.slot.full{border-color:#edf0f3;background:#f8fafc;color:#a7b1bd}.full-text{margin-top:4rpx;color:#ef4444;font-size:19rpx}.card textarea{box-sizing:border-box;width:100%;height:150rpx;margin-top:18rpx;padding:18rpx;border:1rpx solid #dbe3ee;border-radius:6rpx;color:#334155;font-size:25rpx}.submit{width:100%;border-radius:8rpx;background:#1677ff;color:#fff;font-size:29rpx}.submit[disabled]{background:#b7cdf1}.empty{padding:150rpx 0;color:#94a3b8;text-align:center;font-size:26rpx}.compact{padding:45rpx 0}
</style>
