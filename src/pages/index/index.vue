<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">运营城市 · 游玩指南</text>
      <text class="title">吃好，喝好，玩好</text>
      <text class="subtitle">为自驾旅程挑选值得停留的地方</text>
    </view>

    <view class="category-tabs">
      <view v-for="item in categories" :key="item.key" class="category-tab" :class="{ active: activeTab === item.key }" @click="activeTab = item.key">{{ item.name }}</view>
    </view>
    <view class="recommendation-note">推荐内容来自真实体验与本地信息整理，展示不以商业合作或付费推广为依据。</view>
    <button class="planning-button" @click="planTrip"><text class="planning-icon">⌁</text><text>一键规划</text><text class="planning-note">按顺序安排吃喝玩路线</text></button>

    <view class="section">
      <view class="section-head">
        <view><text class="section-title">{{ activeTitle }}</text><text class="section-note">{{ activeTab === 'play' ? '停车、门票与游玩信息' : '位置、消费与推荐理由' }}</text></view>
        <view class="section-link" @click="openList"><text>全部</text><view class="arrow-icon"></view></view>
      </view>
      <scroll-view class="sort-bar" scroll-x>
        <view v-for="option in sortOptions" :key="option.key" class="sort-option" :class="{ active: sortKey === option.key }" @click="selectSort(option.key)">{{ option.name }}</view>
      </scroll-view>

      <view v-if="currentItems.length" class="item-list">
        <view v-for="item in currentItems" :key="item.id" class="recommendation-card" @click="openDetail(item)">
          <image v-if="item.cover_image" class="card-image" :src="item.cover_image" mode="aspectFill" />
          <view v-else class="card-image image-placeholder" :class="{ drink: activeTab === 'drink', play: activeTab === 'play' }">{{ activeTab === 'eat' ? '吃' : activeTab === 'drink' ? '喝' : '玩' }}</view>
          <view class="card-info">
            <view class="name-row"><text class="card-title">{{ item.name }}</text><text v-if="activeTab === 'play'" class="score">{{ item.recommendation_score || '推荐' }}</text></view>
            <text class="meta">{{ item.location || '位置待完善' }}</text>
            <text v-if="activeTab === 'play'" class="meta">门票 {{ item.ticket_price ? `¥${item.ticket_price}` : '以现场为准' }}</text>
            <text v-else class="meta">{{ item.avg_price ? `人均 ¥${item.avg_price}` : '本地推荐' }}</text>
            <text v-if="distanceText(item, userLocation)" class="meta">距离约 {{ distanceText(item, userLocation) }}</text>
            <text class="interaction-meta">赞 {{ item.like_count || 0 }} · 评论 {{ item.comment_count || 0 }} · 收藏 {{ item.favorite_count || 0 }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">{{ emptyText }}</view>
    </view>
    <AppBottomNav active="travel" />
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getTravelRecommendations } from '../../api/travel'
import AppBottomNav from '../../components/AppBottomNav.vue'
import { distanceText, sortOptions, sortTravelItems } from '../../utils/travel-sort'

const activeTab = ref('eat')
const foods = ref([])
const drinks = ref([])
const spots = ref([])
const categories = [{ key: 'eat', name: '吃' }, { key: 'drink', name: '喝' }, { key: 'play', name: '玩' }]
const sortKey = ref('default')
const userLocation = ref(null)

const rawItems = computed(() => ({ eat: foods.value, drink: drinks.value, play: spots.value })[activeTab.value] || [])
const currentItems = computed(() => sortTravelItems(rawItems.value, activeTab.value, sortKey.value, userLocation.value))
const activeTitle = computed(() => ({ eat: '本地好吃的', drink: '适合坐坐的', play: '值得去的景点' })[activeTab.value])
const emptyText = computed(() => ({ eat: '暂无餐饮推荐', drink: '暂无饮品推荐', play: '暂无景点推荐' })[activeTab.value])

const loadRecommendations = async () => {
  try {
    const result = await getTravelRecommendations(12)
    foods.value = result.data.foods || []
    drinks.value = result.data.drinks || []
    spots.value = result.data.scenic_spots || []
  } catch (error) {
    foods.value = []
    drinks.value = []
    spots.value = []
  }
}

const selectSort = async (key) => {
  if (key === 'distance' && !userLocation.value) {
    try {
      userLocation.value = await new Promise((resolve, reject) => {
        uni.getLocation({ type: 'gcj02', success: resolve, fail: reject })
      })
    } catch (error) {
      uni.showToast({ title: '需要授权定位后才能按距离排序', icon: 'none' })
      return
    }
  }
  sortKey.value = key
}

const planTrip = () => uni.navigateTo({ url: '/pages/travel/plan' })
const openList = () => uni.navigateTo({ url: `/pages/travel/list?type=${activeTab.value}` })
const openDetail = (item) => uni.navigateTo({ url: `/pages/travel/detail?target_type=${item.target_type}&target_id=${item.target_id}` })

onShow(loadRecommendations)
</script>

<style scoped>
.page { min-height: 100vh; padding-bottom: calc(260rpx + env(safe-area-inset-bottom)); }
.hero { padding: 42rpx 32rpx 46rpx; background: #12b886; color: #fff; }
.eyebrow { display: block; font-size: 24rpx; opacity: .9; }
.title { display: block; margin-top: 24rpx; font-size: 44rpx; font-weight: 700; }
.subtitle { display: block; margin-top: 14rpx; font-size: 26rpx; opacity: .88; }
.category-tabs { display: flex; margin: 24rpx 32rpx 0; overflow: hidden; border-radius: 8rpx; background: #fff; }
.category-tab { flex: 1; padding: 24rpx 0; color: #6b7280; font-size: 30rpx; text-align: center; }
.category-tab.active { background: #e6f8f2; color: #0f8e69; font-weight: 700; }
.recommendation-note { margin: 18rpx 32rpx 0; color: #6b7280; font-size: 22rpx; line-height: 1.7; }
.planning-button { display: flex; align-items: center; margin: 22rpx 32rpx 0; padding: 0 22rpx; border: 0; border-radius: 8rpx; background: #1677ff; color: #fff; font-size: 26rpx; line-height: 76rpx; }
.planning-button::after { border: 0; }
.planning-icon { margin-right: 10rpx; font-size: 34rpx; line-height: 1; }
.planning-note { margin-left: auto; color: rgba(255, 255, 255, .78); font-size: 21rpx; }
.section { padding: 30rpx 32rpx 0; }
.section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.section-title { display: block; font-size: 34rpx; font-weight: 700; }
.section-note { display: block; margin-top: 8rpx; color: #6b7280; font-size: 22rpx; }
.section-link { color: #6b7280; font-size: 24rpx; }
.section-link { display: flex; align-items: center; gap: 10rpx; }
.arrow-icon { width: 12rpx; height: 12rpx; border-top: 3rpx solid #9ca3af; border-right: 3rpx solid #9ca3af; transform: rotate(45deg); }
.sort-bar { display: flex; width: 100%; margin-bottom: 18rpx; white-space: nowrap; }
.sort-option { display: inline-block; margin-right: 12rpx; padding: 12rpx 18rpx; border: 1rpx solid #e5e7eb; border-radius: 20rpx; background: #fff; color: #6b7280; font-size: 22rpx; }
.sort-option.active { border-color: #1677ff; background: #eff6ff; color: #1677ff; font-weight: 600; }
.item-list { display: flex; flex-direction: column; gap: 18rpx; padding-bottom: 60rpx; }
.recommendation-card { display: flex; gap: 20rpx; padding: 16rpx; border-radius: 8rpx; background: #fff; }
.card-image { flex: 0 0 180rpx; width: 180rpx; height: 136rpx; border-radius: 6rpx; }
.image-placeholder { display: flex; align-items: center; justify-content: center; background: #fff0d9; color: #d97706; font-size: 40rpx; font-weight: 700; }
.image-placeholder.drink { background: #e8f1ff; color: #1677ff; }
.image-placeholder.play { background: #d8f3ea; color: #0f8e69; }
.card-info { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.name-row { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.card-title { overflow: hidden; color: #1f2937; font-size: 30rpx; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.score { padding: 4rpx 8rpx; border-radius: 4rpx; background: #e6f8f2; color: #0f8e69; font-size: 20rpx; }
.meta { display: block; margin-top: 10rpx; overflow: hidden; color: #6b7280; font-size: 22rpx; text-overflow: ellipsis; white-space: nowrap; }
.interaction-meta { display: block; margin-top: auto; padding-top: 12rpx; color: #9ca3af; font-size: 20rpx; }
.empty-state { padding: 52rpx 0; border-radius: 8rpx; background: #fff; color: #9ca3af; font-size: 26rpx; text-align: center; }
</style>
