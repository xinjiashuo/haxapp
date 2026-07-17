<template>
  <view class="page">
    <view class="hint">评论审核通过后才会公开显示。</view>
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!comments.length" class="empty">暂无公开评论</view>
    <view v-else class="comment-list"><view v-for="item in comments" :key="item.id" class="comment-item"><view class="avatar"><image v-if="item.avatar_url" :src="item.avatar_url" mode="aspectFill" /><text v-else>{{ item.nickname.slice(0, 1) }}</text></view><view class="comment-body"><text class="nickname">{{ item.nickname }}</text><text class="comment-content">{{ item.content }}</text><text class="time">{{ item.reviewed_at || item.created_at }}</text></view></view></view>
    <view class="input-bar"><input v-model.trim="content" class="input" maxlength="500" placeholder="写下你的评论" confirm-type="send" @confirm="submit" /><button class="send" :loading="submitting" @click="submit">发送</button></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getMomentComments, publishMomentComment } from '../../api/moment'
import { getToken } from '../../utils/user-session'

const postId = ref(0), comments = ref([]), content = ref(''), loading = ref(false), submitting = ref(false)
const loadComments = async () => { if (!postId.value) return; loading.value = true; try { const result = await getMomentComments(postId.value); comments.value = result.data.list || [] } catch (error) { uni.showToast({ title: error.msg || '加载失败', icon: 'none' }) } finally { loading.value = false } }
const submit = async () => {
  if (!getToken()) { uni.navigateTo({ url: '/pages/login/index' }); return }
  if (!content.value) { uni.showToast({ title: '请填写评论内容', icon: 'none' }); return }
  submitting.value = true
  try { await publishMomentComment({ post_id: postId.value, content: content.value }); content.value = ''; uni.showToast({ title: '评论已提交审核', icon: 'success' }) } catch (error) { uni.showToast({ title: error.msg || '评论失败', icon: 'none' }) } finally { submitting.value = false }
}
onLoad((query) => { postId.value = Number(query.id || 0); loadComments() })
onShow(loadComments)
</script>

<style scoped>
.page { min-height: 100vh; padding-bottom: 120rpx; }.hint { margin: 20rpx 32rpx; padding: 18rpx 20rpx; border-radius: 6rpx; background: #e6f8f2; color: #16735a; font-size: 22rpx; }.comment-list { padding: 0 32rpx; }.comment-item { display: flex; padding: 24rpx 0; border-bottom: 1rpx solid #e5e7eb; }.avatar { display: flex; align-items: center; justify-content: center; width: 64rpx; height: 64rpx; overflow: hidden; border-radius: 50%; background: #dbeafe; color: #1677ff; font-size: 26rpx; font-weight: 700; }.avatar image { width: 100%; height: 100%; }.comment-body { display: flex; flex: 1; flex-direction: column; margin-left: 18rpx; }.nickname { color: #374151; font-size: 25rpx; font-weight: 600; }.comment-content { margin-top: 10rpx; color: #1f2937; font-size: 27rpx; line-height: 1.55; }.time { margin-top: 10rpx; color: #9ca3af; font-size: 20rpx; }.empty { margin: 44rpx 32rpx; padding: 60rpx 20rpx; border-radius: 8rpx; background: #fff; color: #9ca3af; font-size: 26rpx; text-align: center; }.input-bar { position: fixed; right: 0; bottom: 0; left: 0; display: flex; align-items: center; gap: 16rpx; padding: 16rpx 24rpx; border-top: 1rpx solid #e5e7eb; background: #fff; }.input { flex: 1; height: 72rpx; padding: 0 20rpx; border-radius: 6rpx; background: #f3f4f6; color: #1f2937; font-size: 26rpx; }.send { margin: 0; padding: 0 24rpx; border-radius: 6rpx; background: #12b886; color: #fff; font-size: 25rpx; line-height: 68rpx; }
</style>
