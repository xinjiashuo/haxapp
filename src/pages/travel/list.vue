<template>
  <view class="page">
    <view class="page-head"><text class="page-title">{{ pageTitle }}</text><text class="page-subtitle">青岛本地真实推荐</text></view>
    <scroll-view class="sort-bar" scroll-x>
      <view v-for="option in sortOptions" :key="option.key" class="sort-option" :class="{ active: sortKey === option.key }" @click="selectSort(option.key)">{{ option.name }}</view>
    </scroll-view>
    <view v-if="loading" class="empty-state">推荐内容加载中</view>
    <view v-else-if="items.length" class="item-list">
      <view v-for="item in items" :key="`${item.target_type}-${item.target_id}`" class="recommendation-card" @click="openDetail(item)">
        <image v-if="item.cover_image" class="card-image" :src="item.cover_image" mode="aspectFill" />
        <view v-else class="card-image image-placeholder">{{ type === 'eat' ? '吃' : type === 'drink' ? '喝' : '玩' }}</view>
        <view class="card-info">
          <view class="name-row"><text class="card-title">{{ item.name }}</text><text class="score">{{ item.recommendation_score || '推荐' }}</text></view>
          <text class="meta">{{ item.location || '位置待完善' }}</text>
          <text class="meta">{{ priceText(item) }}</text>
          <text v-if="distanceText(item, userLocation)" class="meta">距离约 {{ distanceText(item, userLocation) }}</text>
          <text v-if="item.reason" class="reason">{{ item.reason }}</text>
          <text class="interaction-meta">赞 {{ item.like_count || 0 }} · 评论 {{ item.comment_count || 0 }} · 收藏 {{ item.favorite_count || 0 }}</text>
        </view>
        <view class="arrow-icon"></view>
      </view>
    </view>
    <view v-else class="empty-state">暂无{{ pageTitle }}内容</view>
    <AppBottomNav active="travel" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppBottomNav from '../../components/AppBottomNav.vue'
import { getTravelRecommendations } from '../../api/travel'
import { distanceText, sortOptions, sortTravelItems } from '../../utils/travel-sort'

const type = ref('eat')
const foods = ref([])
const drinks = ref([])
const spots = ref([])
const sortKey = ref('default')
const userLocation = ref(null)
const loading = ref(false)
const pageTitle = computed(() => ({ eat: '吃', drink: '喝', play: '玩' })[type.value] || '吃喝玩')
const rawItems = computed(() => ({ eat: foods.value, drink: drinks.value, play: spots.value })[type.value] || [])
const items = computed(() => sortTravelItems(rawItems.value, type.value, sortKey.value, userLocation.value))

const priceText = (item) => type.value === 'play'
  ? (item.ticket_price ? `门票 ¥${item.ticket_price}` : '门票以现场为准')
  : (item.avg_price ? `人均 ¥${item.avg_price}` : '价格待完善')

const loadItems = async () => {
  loading.value = true
  try {
    const result = await getTravelRecommendations(100)
    foods.value = result.data?.foods || []
    drinks.value = result.data?.drinks || []
    spots.value = result.data?.scenic_spots || []
  } catch (error) {
    foods.value = []
    drinks.value = []
    spots.value = []
    uni.showToast({ title: error.msg || '列表加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const selectSort = async (key) => {
  if (key === 'distance' && !userLocation.value) {
    try {
      userLocation.value = await new Promise((resolve, reject) => uni.getLocation({ type: 'gcj02', success: resolve, fail: reject }))
    } catch (error) {
      uni.showToast({ title: '需要授权定位后才能按距离排序', icon: 'none' })
      return
    }
  }
  sortKey.value = key
}

const openDetail = (item) => uni.navigateTo({ url: `/pages/travel/detail?target_type=${item.target_type}&target_id=${item.target_id}` })

onLoad((options) => {
  if (['eat', 'drink', 'play'].includes(options?.type)) type.value = options.type
  loadItems()
})
</script>

<style scoped>
.page { min-height: 100vh; padding-bottom: calc(260rpx + env(safe-area-inset-bottom)); background: #f5f7fa; }
.page-head { padding: 34rpx 32rpx 28rpx; background: #fff; }
.page-title { display: block; color: #1f2937; font-size: 38rpx; font-weight: 700; }
.page-subtitle { display: block; margin-top: 10rpx; color: #6b7280; font-size: 23rpx; }
.sort-bar { display: flex; padding: 20rpx 32rpx; background: #fff; white-space: nowrap; }
.sort-option { display: inline-block; margin-right: 12rpx; padding: 12rpx 18rpx; border: 1rpx solid #e5e7eb; border-radius: 20rpx; background: #fff; color: #6b7280; font-size: 22rpx; }
.sort-option.active { border-color: #1677ff; background: #eff6ff; color: #1677ff; font-weight: 600; }
.item-list { display: flex; flex-direction: column; gap: 16rpx; padding: 20rpx 32rpx 60rpx; }
.recommendation-card { position: relative; display: flex; gap: 16rpx; padding: 16rpx; border-radius: 8rpx; background: #fff; }
.card-image { flex: 0 0 178rpx; width: 178rpx; height: 142rpx; border-radius: 6rpx; }
.image-placeholder { display: flex; align-items: center; justify-content: center; background: #e6f8f2; color: #0f8e69; font-size: 40rpx; font-weight: 700; }
.card-info { display: flex; flex: 1; flex-direction: column; min-width: 0; padding-right: 18rpx; }
.name-row { display: flex; align-items: center; gap: 10rpx; }
.card-title { overflow: hidden; color: #1f2937; font-size: 29rpx; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.score { flex: 0 0 auto; padding: 4rpx 8rpx; border-radius: 4rpx; background: #e6f8f2; color: #0f8e69; font-size: 20rpx; }
.meta { display: block; margin-top: 9rpx; overflow: hidden; color: #6b7280; font-size: 22rpx; text-overflow: ellipsis; white-space: nowrap; }
.reason { display: block; margin-top: 9rpx; overflow: hidden; color: #9ca3af; font-size: 21rpx; text-overflow: ellipsis; white-space: nowrap; }
.interaction-meta { display: block; margin-top: auto; padding-top: 10rpx; color: #9ca3af; font-size: 20rpx; }
.arrow-icon { position: absolute; top: 68rpx; right: 18rpx; width: 12rpx; height: 12rpx; border-top: 3rpx solid #cbd5e1; border-right: 3rpx solid #cbd5e1; transform: rotate(45deg); }
.empty-state { padding: 140rpx 32rpx; color: #9ca3af; text-align: center; font-size: 25rpx; }
</style>
