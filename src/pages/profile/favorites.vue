<template>
  <view class="page">
    <view class="main-tabs">
      <view class="main-tab" :class="{ active: activeType === 'travel' }" @click="switchType('travel')">吃喝玩</view>
      <view class="main-tab" :class="{ active: activeType === 'moment' }" @click="switchType('moment')">旅记</view>
    </view>

    <view v-if="activeType === 'travel'" class="sub-tabs">
      <view v-for="item in travelTypes" :key="item.key" class="sub-tab" :class="{ active: activeTravelType === item.key }" @click="switchTravelType(item.key)">{{ item.name }}</view>
    </view>

    <view v-if="loading" class="empty-state">加载中...</view>
    <view v-else-if="!items.length" class="empty-state">{{ activeType === 'travel' ? '暂无该分类收藏' : '暂无旅记收藏' }}</view>

    <view v-else-if="activeType === 'travel'" class="travel-list">
      <view v-for="item in items" :key="item.id" class="travel-card">
        <image v-if="item.cover_image" class="cover" :src="item.cover_image" mode="aspectFill" />
        <view v-else class="cover placeholder">{{ activeTravelType === 'eat' ? '吃' : activeTravelType === 'drink' ? '喝' : '玩' }}</view>
        <view class="travel-info">
          <text class="travel-name">{{ item.name }}</text>
          <text class="travel-location">{{ item.location || '位置待完善' }}</text>
          <text v-if="item.price_text" class="travel-price">{{ item.price_text }}</text>
          <text v-if="item.description" class="travel-desc">{{ item.description }}</text>
        </view>
      </view>
    </view>

    <view v-else class="moment-list">
      <view v-for="item in items" :key="item.id" class="moment-card">
        <view class="avatar"><image v-if="item.user.avatar_url" :src="item.user.avatar_url" mode="aspectFill" /><text v-else>{{ item.user.nickname.slice(0, 1) }}</text></view>
        <view class="moment-content"><text class="nickname">{{ item.user.nickname }}</text><text class="content">{{ item.content }}</text><view v-if="item.images.length" class="image-grid"><image v-for="image in item.images.slice(0, 3)" :key="image" :src="image" mode="aspectFill" /></view><text class="time">{{ item.created_at }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMomentFavorites, getTravelFavorites } from '../../api/favorite'
import { getToken } from '../../utils/user-session'

const activeType = ref('travel')
const activeTravelType = ref('eat')
const travelTypes = [{ key: 'eat', name: '吃' }, { key: 'drink', name: '喝' }, { key: 'play', name: '玩' }]
const items = ref([])
const loading = ref(false)

const loadFavorites = async () => {
  if (!getToken()) {
    uni.navigateTo({ url: '/pages/login/index' })
    return
  }
  loading.value = true
  try {
    const result = activeType.value === 'travel' ? await getTravelFavorites(activeTravelType.value) : await getMomentFavorites()
    items.value = result.data.list || []
  } catch (error) {
    items.value = []
    uni.showToast({ title: error.msg || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const switchType = (type) => { if (activeType.value !== type) { activeType.value = type; loadFavorites() } }
const switchTravelType = (type) => { if (activeTravelType.value !== type) { activeTravelType.value = type; loadFavorites() } }

onShow(loadFavorites)
</script>

<style scoped>
.page { min-height: 100vh; padding-bottom: 40rpx; }.main-tabs { display: flex; padding: 0 32rpx; background: #fff; }.main-tab { flex: 1; padding: 30rpx 0 22rpx; color: #6b7280; font-size: 30rpx; text-align: center; }.main-tab.active { border-bottom: 4rpx solid #1677ff; color: #1677ff; font-weight: 700; }.sub-tabs { display: flex; margin: 20rpx 32rpx; overflow: hidden; border-radius: 7rpx; background: #fff; }.sub-tab { flex: 1; padding: 20rpx 0; color: #6b7280; font-size: 27rpx; text-align: center; }.sub-tab.active { background: #e6f8f2; color: #0f8e69; font-weight: 700; }.travel-list, .moment-list { display: flex; flex-direction: column; gap: 16rpx; padding: 0 32rpx; }.travel-card { display: flex; gap: 18rpx; padding: 16rpx; border-radius: 8rpx; background: #fff; }.cover { flex: 0 0 174rpx; width: 174rpx; height: 132rpx; border-radius: 6rpx; }.placeholder { display: flex; align-items: center; justify-content: center; background: #e6f8f2; color: #0f8e69; font-size: 38rpx; font-weight: 700; }.travel-info { display: flex; flex: 1; flex-direction: column; min-width: 0; }.travel-name { overflow: hidden; color: #1f2937; font-size: 29rpx; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }.travel-location, .travel-price { display: block; margin-top: 9rpx; color: #6b7280; font-size: 22rpx; }.travel-desc { display: block; margin-top: auto; overflow: hidden; color: #9ca3af; font-size: 21rpx; text-overflow: ellipsis; white-space: nowrap; }.moment-card { display: flex; padding: 24rpx 0; border-bottom: 1rpx solid #e5e7eb; }.avatar { display: flex; flex: 0 0 68rpx; align-items: center; justify-content: center; width: 68rpx; height: 68rpx; overflow: hidden; border-radius: 50%; background: #dbeafe; color: #1677ff; font-size: 27rpx; font-weight: 700; }.avatar image { width: 100%; height: 100%; }.moment-content { display: flex; flex: 1; flex-direction: column; min-width: 0; margin-left: 18rpx; }.nickname { color: #1f2937; font-size: 27rpx; font-weight: 700; }.content { margin-top: 10rpx; color: #374151; font-size: 27rpx; line-height: 1.6; white-space: pre-wrap; }.image-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8rpx; margin-top: 14rpx; }.image-grid image { width: 100%; height: 160rpx; border-radius: 5rpx; }.time { margin-top: 12rpx; color: #94a3b8; font-size: 21rpx; }.empty-state { margin: 32rpx; padding: 80rpx 24rpx; border-radius: 8rpx; background: #fff; color: #9ca3af; font-size: 26rpx; text-align: center; }
</style>
