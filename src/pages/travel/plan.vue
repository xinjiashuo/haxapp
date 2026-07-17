<template>
  <view class="page">
    <view class="header-row"><view><text class="title">规划行程</text><text class="subtitle">按地点时段、停留时间和车程自动安排</text></view><text class="saved-link" @click="goItineraries">我的行程</text></view>
    <view class="setting-card">
      <input v-model.trim="planName" class="name-input" placeholder="行程名称，例如：青岛两日游" maxlength="80" />
      <view class="setting-row"><text>出发日期</text><picker mode="date" :value="planDate" @change="planDate = $event.detail.value"><view class="picker-value">{{ planDate }}</view></picker></view>
      <view class="setting-row"><text>游玩天数</text><view class="stepper"><text @click="changeDays(-1)">−</text><text>{{ dayCount }} 天</text><text @click="changeDays(1)">＋</text></view></view>
      <view class="setting-row"><text>每日时间</text><view class="time-group"><picker mode="time" :value="dayStart" @change="dayStart = $event.detail.value"><text>{{ dayStart }}</text></picker><text>至</text><picker mode="time" :value="dayEnd" @change="dayEnd = $event.detail.value"><text>{{ dayEnd }}</text></picker></view></view>
      <view class="location-row"><text>{{ locationText }}</text><text class="location-action" @click="locate">{{ locating ? '定位中' : '更新定位' }}</text></view>
    </view>

    <view class="auto-plan-card">
      <view><text class="auto-plan-title">按停留天数生成推荐行程</text><text class="auto-plan-desc">无需勾选地点，自动生成 3-5 条吃喝玩路线</text></view>
      <button class="auto-plan-button" :loading="planning" @click="generateSuggestions">生成推荐</button>
    </view>

    <view v-if="suggestions.length" class="suggestion-list">
      <view class="suggestion-heading"><text>为你生成的行程方案</text><text>可按偏好选择一条保存</text></view>
      <view v-for="plan in suggestions" :key="plan.key" class="suggestion-card">
        <view class="suggestion-title-row"><text class="suggestion-name">{{ plan.name }}</text><text class="suggestion-days">{{ plan.day_count }} 天</text></view>
        <text class="suggestion-desc">{{ plan.description }}</text>
        <text class="suggestion-meta">约 {{ distanceText(plan.distance_meters) }} · {{ durationText(plan.duration_minutes) }}</text>
        <view v-for="day in plan.days" :key="`${plan.key}-${day.day_no}`" class="suggestion-day">
          <text class="suggestion-day-label">D{{ day.day_no }}</text>
          <view class="suggestion-stops"><text v-for="stop in day.stops" :key="`${stop.target_type}-${stop.target_id}`">{{ stop.start_time }} {{ stop.name }}</text></view>
        </view>
        <button class="save-suggestion" :loading="savingSuggestion === plan.key" @click="saveSuggestion(plan)">选择并保存</button>
      </view>
    </view>

    <view class="category-tabs"><view v-for="category in categories" :key="category.key" class="category-tab" :class="{ active: activeType === category.key }" @click="activeType = category.key">{{ category.name }}</view></view>
    <view class="selection-tip">手动选点：已选择 {{ selected.length }}/16 个地点</view>
    <view class="place-list">
      <view v-for="place in currentPlaces" :key="keyOf(place)" class="place-item" :class="{ selected: isSelected(place) }" @click="togglePlace(place)">
        <view class="place-check">{{ isSelected(place) ? '✓' : '' }}</view>
        <view class="place-info"><text class="place-name">{{ place.name }}</text><text class="place-meta">{{ timeText(place) }} · {{ durationText(place.recommended_duration_minutes) }}</text></view>
        <text class="place-price">{{ priceText(place) }}</text>
      </view>
      <view v-if="!loading && !currentPlaces.length" class="empty-state">暂无可规划地点</view>
    </view>
    <button v-if="selected.length" class="plan-button" :loading="planning" @click="createAndSave">一键生成并保存</button>
    <AppBottomNav active="travel" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppBottomNav from '../../components/AppBottomNav.vue'
import { getTravelItinerarySuggestions, getTravelRecommendations, saveTravelItinerary } from '../../api/travel'
import { getToken } from '../../utils/user-session'

const categories = [{ key: 'eat', name: '吃' }, { key: 'drink', name: '喝' }, { key: 'play', name: '玩' }]
const activeType = ref('eat'), foods = ref([]), drinks = ref([]), spots = ref([]), selected = ref([]), location = ref(null), locating = ref(false), planning = ref(false), loading = ref(false), suggestions = ref([]), savingSuggestion = ref('')
const planName = ref(''), planDate = ref(new Date().toISOString().slice(0, 10)), dayCount = ref(1), dayStart = ref('09:00'), dayEnd = ref('20:00')
const currentPlaces = computed(() => (({ eat: foods.value, drink: drinks.value, play: spots.value })[activeType.value] || []).filter((place) => place.latitude !== null && place.latitude !== undefined && place.latitude !== '' && place.longitude !== null && place.longitude !== undefined && place.longitude !== ''))
const locationText = computed(() => location.value ? '已获取当前位置，将按实际位置规划' : '请授权定位，用于计算路线')
const keyOf = (place) => `${place.target_type}-${place.target_id}`
const isSelected = (place) => selected.value.some((item) => keyOf(item) === keyOf(place))
const durationText = (minutes) => Number(minutes || 0) ? `建议 ${Number(minutes)} 分钟` : '建议停留以现场为准'
const distanceText = (meters) => Number(meters || 0) >= 1000 ? `${(Number(meters) / 1000).toFixed(1)} 公里` : `${Number(meters || 0)} 米`
const timeText = (place) => place.recommended_time_slots?.length ? place.recommended_time_slots.join('、') : (place.open_time && place.close_time ? `${place.open_time}-${place.close_time}` : '全天可安排')
const priceText = (place) => place.target_type === 'scenic_spot' ? (place.ticket_price ? `门票 ¥${place.ticket_price}` : '景点') : (place.avg_price ? `人均 ¥${place.avg_price}` : '餐馆')
const changeDays = (delta) => { dayCount.value = Math.min(7, Math.max(1, dayCount.value + delta)) }
const goItineraries = () => uni.navigateTo({ url: '/pages/travel/itineraries' })

const loadPlaces = async () => { loading.value = true; try { const result = await getTravelRecommendations(100); foods.value = result.data?.foods || []; drinks.value = result.data?.drinks || []; spots.value = result.data?.scenic_spots || [] } catch (error) { uni.showToast({ title: error.msg || '地点加载失败', icon: 'none' }) } finally { loading.value = false } }
const locate = async () => { if (locating.value) return false; locating.value = true; try { location.value = await new Promise((resolve, reject) => uni.getLocation({ type: 'gcj02', success: resolve, fail: reject })); return true } catch (_) { uni.showToast({ title: '需要授权定位后才能规划路线', icon: 'none' }); return false } finally { locating.value = false } }
const togglePlace = (place) => { suggestions.value = []; const index = selected.value.findIndex((item) => keyOf(item) === keyOf(place)); if (index >= 0) { selected.value.splice(index, 1); return } if (selected.value.length >= 16) return uni.showToast({ title: '一次最多选择 16 个地点', icon: 'none' }); selected.value.push(place) }
const planPayload = (targets, name = planName.value) => ({ name, start_date: planDate.value, day_count: dayCount.value, day_start_time: dayStart.value, day_end_time: dayEnd.value, latitude: location.value.latitude, longitude: location.value.longitude, targets })
const createAndSave = async () => {
  if (!getToken()) return uni.navigateTo({ url: '/pages/login/index' })
  if (!selected.value.length) return uni.showToast({ title: '请先选择至少一个地点', icon: 'none' })
  if (!location.value && !(await locate())) return
  planning.value = true
  try {
    const result = await saveTravelItinerary(planPayload(selected.value.map((item) => ({ target_type: item.target_type, target_id: item.target_id }))))
    uni.showToast({ title: '行程已保存', icon: 'success' })
    setTimeout(() => uni.navigateTo({ url: `/pages/travel/itinerary?id=${result.data.id}` }), 350)
  } catch (error) { uni.showToast({ title: error.msg || '行程规划失败', icon: 'none' }) } finally { planning.value = false }
}
const generateSuggestions = async () => {
  if (!location.value && !(await locate())) return
  planning.value = true
  try {
    const result = await getTravelItinerarySuggestions({ start_date: planDate.value, day_count: dayCount.value, day_start_time: dayStart.value, day_end_time: dayEnd.value, latitude: location.value.latitude, longitude: location.value.longitude })
    suggestions.value = result.data?.list || []
    if (!suggestions.value.length) uni.showToast({ title: '暂未生成推荐方案，请调整日期后重试', icon: 'none' })
  } catch (error) { uni.showToast({ title: error.msg || '推荐行程生成失败', icon: 'none' }) } finally { planning.value = false }
}
const saveSuggestion = async (plan) => {
  if (!getToken()) return uni.navigateTo({ url: '/pages/login/index' })
  if (!location.value && !(await locate())) return
  savingSuggestion.value = plan.key
  try {
    const result = await saveTravelItinerary(planPayload(plan.targets, planName.value || plan.name))
    uni.showToast({ title: '行程已保存', icon: 'success' })
    setTimeout(() => uni.navigateTo({ url: `/pages/travel/itinerary?id=${result.data.id}` }), 350)
  } catch (error) { uni.showToast({ title: error.msg || '行程保存失败', icon: 'none' }) } finally { savingSuggestion.value = '' }
}
onLoad(() => { loadPlaces(); locate() })
</script>

<style scoped>
.page { min-height: 100vh; padding: 26rpx 24rpx calc(292rpx + env(safe-area-inset-bottom)); box-sizing: border-box; background: #f5f7fa; }.header-row { display: flex; justify-content: space-between; align-items: center; }.title { display: block; color: #1f2937; font-size: 36rpx; font-weight: 700; }.subtitle { display: block; margin-top: 10rpx; color: #748093; font-size: 23rpx; }.saved-link,.location-action { color: #1677ff; font-size: 25rpx; }.setting-card,.place-list { margin-top: 22rpx; overflow: hidden; border-radius: 8rpx; background: #fff; }.name-input { height: 86rpx; padding: 0 22rpx; border-bottom: 1rpx solid #edf0f5; font-size: 28rpx; }.setting-row,.location-row { display: flex; justify-content: space-between; align-items: center; min-height: 86rpx; padding: 0 22rpx; border-bottom: 1rpx solid #edf0f5; color: #38465a; font-size: 26rpx; }.setting-row:last-of-type { border-bottom: 0; }.picker-value,.time-group,.stepper { display: flex; align-items: center; gap: 18rpx; color: #1677ff; }.stepper { gap: 24rpx; font-weight: 600; }.stepper text:first-child,.stepper text:last-child { width: 42rpx; height: 42rpx; border-radius: 21rpx; background: #edf5ff; text-align: center; line-height: 42rpx; }.auto-plan-card { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin-top: 22rpx; padding: 24rpx; border: 1rpx solid #cce6ff; border-radius: 8rpx; background: #edf6ff; }.auto-plan-title,.auto-plan-desc { display: block; }.auto-plan-title { color: #1f4f85; font-size: 28rpx; font-weight: 700; }.auto-plan-desc { margin-top: 8rpx; color: #58718e; font-size: 21rpx; }.auto-plan-button { flex: 0 0 auto; margin: 0; padding: 0 20rpx; border-radius: 6rpx; background: #1677ff; color: #fff; font-size: 24rpx; line-height: 66rpx; }.auto-plan-button::after { border: 0; }.category-tabs { display: flex; margin-top: 24rpx; overflow: hidden; border-radius: 8rpx; background: #fff; }.category-tab { flex: 1; padding: 22rpx 0; color: #6b7280; text-align: center; font-size: 28rpx; }.category-tab.active { background: #e6f8f2; color: #0f8e69; font-weight: 700; }.selection-tip { margin: 18rpx 2rpx 12rpx; color: #6b7280; font-size: 23rpx; }.place-item { display: flex; align-items: center; gap: 16rpx; padding: 22rpx; border-bottom: 1rpx solid #edf0f5; }.place-item:last-child { border: 0; }.place-check { display: flex; align-items: center; justify-content: center; width: 38rpx; height: 38rpx; border: 2rpx solid #cbd5e1; border-radius: 50%; color: transparent; }.place-item.selected .place-check { border-color: #1677ff; background: #1677ff; color: #fff; }.place-info { display: flex; flex: 1; flex-direction: column; min-width: 0; }.place-name { overflow: hidden; color: #1f2937; font-size: 27rpx; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }.place-meta { margin-top: 8rpx; overflow: hidden; color: #8b96a7; font-size: 21rpx; text-overflow: ellipsis; white-space: nowrap; }.place-price { flex: 0 0 auto; color: #f97316; font-size: 22rpx; }.empty-state { padding: 52rpx; color: #9ca3af; text-align: center; font-size: 24rpx; }.suggestion-list { margin-top: 24rpx; }.suggestion-heading { display: flex; align-items: baseline; justify-content: space-between; margin: 0 4rpx 12rpx; }.suggestion-heading text:first-child { color: #1f2937; font-size: 28rpx; font-weight: 700; }.suggestion-heading text:last-child { color: #8b96a7; font-size: 21rpx; }.suggestion-card { margin-bottom: 16rpx; padding: 24rpx; border-radius: 8rpx; background: #fff; }.suggestion-title-row { display: flex; justify-content: space-between; gap: 16rpx; }.suggestion-name { color: #1f2937; font-size: 29rpx; font-weight: 700; }.suggestion-days { flex: 0 0 auto; color: #0f8e69; font-size: 23rpx; }.suggestion-desc,.suggestion-meta { display: block; margin-top: 10rpx; color: #748093; font-size: 22rpx; }.suggestion-meta { color: #1677ff; }.suggestion-day { display: flex; gap: 14rpx; margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #edf0f5; }.suggestion-day-label { flex: 0 0 auto; color: #0f8e69; font-size: 23rpx; font-weight: 700; }.suggestion-stops { display: flex; flex: 1; flex-direction: column; gap: 7rpx; min-width: 0; color: #526174; font-size: 22rpx; }.save-suggestion { margin-top: 20rpx; border: 1rpx solid #1677ff; border-radius: 6rpx; background: #fff; color: #1677ff; font-size: 25rpx; }.save-suggestion::after { border: 0; }.plan-button { margin-top: 24rpx; border-radius: 8rpx; background: #1677ff; color: #fff; font-size: 28rpx; }.plan-button::after { border: 0; }
</style>
