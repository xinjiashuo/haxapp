<template>
  <view class="page">
    <view class="page-intro">在这里查看你的旅记审核进度。撤回后将不再公开展示。<text @click="goReports">查看举报记录</text></view>
    <view class="tabs">
      <view v-for="item in tabs" :key="item.key" class="tab" :class="{ active: status === item.key }" @click="switchStatus(item.key)">{{ item.name }}</view>
    </view>
    <view v-if="loading" class="empty-state">加载中...</view>
    <view v-else-if="!posts.length" class="empty-state">暂无{{ currentStatusName }}旅记</view>
    <view v-else class="post-list">
      <view v-for="post in posts" :key="post.id" class="post-card">
        <view class="post-head"><text class="status" :class="post.status">{{ post.status_text }}</text><text class="time">{{ post.created_at }}</text></view>
        <text class="content">{{ post.content }}</text>
        <view v-if="post.images.length" class="image-grid"><image v-for="image in post.images.slice(0, 3)" :key="image" :src="image" mode="aspectFill" @click="previewImages(post.images, image)" /></view>
        <view v-if="post.target" class="target"><text>{{ post.target.type_name }}</text><text>{{ post.target.name }}</text></view>
        <view v-if="post.status === 'rejected' && post.reject_reason" class="reject-box"><text>未通过原因：{{ post.reject_reason }}</text></view>
        <view v-if="post.status === 'approved'" class="stats">赞 {{ post.like_count }} · 收藏 {{ post.favorite_count }} · 评论 {{ post.comment_count }}</view>
        <view class="post-footer"><text v-if="post.status === 'pending'" class="pending-tip">审核完成后会通过消息通知你</text><text class="withdraw" @click="confirmDelete(post)">撤回</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { deleteMyMoment, getMyMoments } from '../../api/moment'
import { getToken } from '../../utils/user-session'

const tabs = [{ key: '', name: '全部' }, { key: 'pending', name: '审核中' }, { key: 'approved', name: '已通过' }, { key: 'rejected', name: '未通过' }]
const status = ref('')
const posts = ref([])
const loading = ref(false)
const currentStatusName = computed(() => tabs.find((item) => item.key === status.value)?.name || '全部')

const loadPosts = async () => {
  if (!getToken()) {
    uni.navigateTo({ url: '/pages/login/index' })
    return
  }
  loading.value = true
  try {
    const result = await getMyMoments(status.value)
    posts.value = result.data?.list || []
  } catch (error) {
    posts.value = []
    uni.showToast({ title: error.msg || '旅记加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const switchStatus = (value) => { if (status.value !== value) { status.value = value; loadPosts() } }
const goReports = () => uni.navigateTo({ url: '/pages/moment/reports' })
const previewImages = (urls, current) => uni.previewImage({ urls, current })
const confirmDelete = (post) => uni.showModal({ title: '撤回旅记', content: '撤回后该旅记不再公开展示，是否继续？', confirmColor: '#e35d5b', success: async ({ confirm }) => {
  if (!confirm) return
  try {
    await deleteMyMoment(post.id)
    uni.showToast({ title: '已撤回', icon: 'success' })
    loadPosts()
  } catch (error) {
    uni.showToast({ title: error.msg || '撤回失败', icon: 'none' })
  }
} })

onShow(loadPosts)
</script>

<style scoped>
.page { min-height: 100vh; padding: 22rpx 28rpx 48rpx; box-sizing: border-box; background: #f5f7fa; }.page-intro { padding: 18rpx 20rpx; border-radius: 7rpx; background: #e6f8f2; color: #16735a; font-size: 22rpx; line-height: 1.65; }.page-intro text { margin-left: 14rpx; color: #1677ff; }.tabs { display: flex; margin-top: 18rpx; overflow: hidden; border-radius: 7rpx; background: #fff; }.tab { flex: 1; padding: 21rpx 0; color: #6b7280; font-size: 25rpx; text-align: center; }.tab.active { background: #edf6ff; color: #1677ff; font-weight: 700; }.post-list { display: flex; flex-direction: column; gap: 16rpx; margin-top: 18rpx; }.post-card { padding: 22rpx; border-radius: 8rpx; background: #fff; }.post-head,.post-footer { display: flex; align-items: center; justify-content: space-between; }.status { padding: 4rpx 10rpx; border-radius: 4rpx; background: #fff4e5; color: #c27803; font-size: 20rpx; }.status.approved { background: #e6f8f2; color: #0f8e69; }.status.rejected { background: #fff0f0; color: #d04b4b; }.status.hidden { background: #f1f5f9; color: #64748b; }.time { color: #94a3b8; font-size: 20rpx; }.content { display: block; margin-top: 16rpx; color: #334155; font-size: 27rpx; line-height: 1.65; white-space: pre-wrap; }.image-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8rpx; margin-top: 14rpx; }.image-grid image { width: 100%; height: 190rpx; border-radius: 5rpx; }.target { display: flex; gap: 10rpx; margin-top: 14rpx; color: #3976bf; font-size: 22rpx; }.target text:last-child { color: #4b5563; font-weight: 600; }.reject-box { margin-top: 16rpx; padding: 14rpx 16rpx; border-radius: 5rpx; background: #fff4f4; color: #c24949; font-size: 22rpx; line-height: 1.55; }.stats { margin-top: 15rpx; color: #526f9e; font-size: 22rpx; }.post-footer { min-height: 52rpx; margin-top: 14rpx; border-top: 1rpx solid #edf0f5; }.pending-tip { color: #9ca3af; font-size: 21rpx; }.withdraw { margin-left: auto; color: #d04b4b; font-size: 23rpx; }.empty-state { margin-top: 22rpx; padding: 90rpx 24rpx; border-radius: 8rpx; background: #fff; color: #9ca3af; font-size: 26rpx; text-align: center; }
</style>
