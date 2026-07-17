<template>
  <view class="page" @click="closeActionMenu">
    <view class="head">
      <view><text class="title">旅记</text><text class="subtitle">记录沿途风景，分享真实体验</text></view>
      <view class="head-actions"><text class="my-moments" @click.stop="goMyMoments">我的</text><button class="publish-button" @click.stop="goPublish">发布</button></view>
    </view>
    <view class="notice">动态和评论经审核后公开展示，优质旅记将被置顶推荐。</view>
    <view class="search-row"><input v-model.trim="keyword" placeholder="搜索旅记内容或用户" confirm-type="search" @confirm="searchFeed" /><text @click="searchFeed">搜索</text></view>
    <view class="filter-row"><scroll-view class="tag-scroll" scroll-x><view class="tag-list"><text class="filter-tag" :class="{ active: selectedTagId === 0 }" @click="selectTag(0)">全部标签</text><text v-for="tag in tags" :key="tag.id" class="filter-tag" :class="{ active: selectedTagId === tag.id }" @click="selectTag(tag.id)">{{ tag.name }}</text></view></scroll-view><text class="sort" @click="switchSort">{{ sortText }}</text></view>

    <view v-if="loading" class="empty-state">加载中...</view>
    <view v-else-if="!posts.length" class="empty-state">暂时没有旅记，来分享第一段旅程吧</view>
    <view v-else class="post-list">
      <view v-for="post in posts" :key="post.id" class="post-card" @click.stop>
        <view class="moment-layout">
          <view class="avatar"><image v-if="post.user.avatar_url" :src="post.user.avatar_url" mode="aspectFill" /><text v-else>{{ post.user.nickname.slice(0, 1) }}</text></view>
          <view class="moment-body">
            <view class="moment-name-row"><text class="nickname">{{ post.user.nickname }}</text><text v-if="post.pinned" class="pinned">置顶</text></view>
            <text class="moment-content">{{ post.content }}</text>
            <view v-if="post.images.length" class="moment-image-grid" :class="`count-${Math.min(post.images.length, 3)}`">
              <image v-for="image in post.images" :key="image" :src="image" mode="aspectFill" @click="previewImages(post.images, image)" />
            </view>
            <view v-if="post.target" class="moment-target"><text>{{ post.target.type_name }}</text><text class="target-name">{{ post.target.name }}</text></view>
            <view v-if="post.tags?.length" class="post-tags"><text v-for="tag in post.tags" :key="tag.id">#{{ tag.name }}</text></view>
            <view class="moment-bottom-row">
              <text class="time">{{ post.created_at }}</text>
              <view class="moment-more-wrap">
                <view class="moment-more-button" @click.stop="toggleActionMenu(post.id)"><text></text><text></text><text></text></view>
                <view v-if="actionPostId === post.id" class="moment-action-menu">
                  <view class="menu-item" :class="{ selected: post.liked }" @click.stop="toggleLike(post)">赞</view>
                  <view class="menu-divider"></view>
                  <view class="menu-item" @click.stop="openComment(post)">评论</view>
                  <view class="menu-divider"></view>
                  <view class="menu-item" :class="{ selected: post.favorited }" @click.stop="toggleFavorite(post)">收藏</view>
                  <view class="menu-divider"></view>
                  <view class="menu-item" @click.stop="reportPost(post)">举报</view>
                </view>
              </view>
            </view>
            <view class="interaction-box">
              <text class="stat-line">赞 {{ post.like_count }} · 收藏 {{ post.favorite_count }} · 评论 {{ post.comment_count }}</text>
              <view>
                <view v-for="comment in post.comments" :key="comment.id" class="comment-line"><text class="comment-name">{{ comment.nickname }}：</text><text>{{ comment.content }}</text></view>
                <text v-if="!post.comments.length" class="comment-empty">暂无公开评论</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="composerPost" class="composer-bar">
      <input v-model.trim="composerValue" class="composer-input" :focus="composerFocus" maxlength="500" placeholder="请输入评论" confirm-type="send" @confirm="submitComment" />
      <button class="send-button" :loading="commentSubmitting" @click="submitComment">发送</button>
    </view>
    <view class="photo-float" @click.stop="goPhotoTool"><view class="photo-float-icon"><view></view></view><text>图片加工</text></view>
    <AppBottomNav active="moment" />
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMomentComments, getMomentFeed, getMomentTags, publishMomentComment, reportMomentContent, toggleMomentFavorite, toggleMomentLike } from '../../api/moment'
import { getToken } from '../../utils/user-session'
import AppBottomNav from '../../components/AppBottomNav.vue'

const posts = ref([])
const loading = ref(false)
const actionPostId = ref(0)
const composerPost = ref(null)
const composerValue = ref('')
const composerFocus = ref(false)
const commentSubmitting = ref(false)
const keyword = ref('')
const tags = ref([])
const selectedTagId = ref(0)
const sort = ref('latest')
const sortText = computed(() => ({ latest: '最新', hot: '最热', favorite: '收藏最多' })[sort.value] || '最新')

const loadFeed = async () => {
  loading.value = true
  try {
    const result = await getMomentFeed({ keyword: keyword.value, tag_id: selectedTagId.value || '', sort: sort.value })
    posts.value = (result.data.list || []).map((post) => ({ ...post, comment_open: false, comments_loaded: true, comments: post.comments || [] }))
  } catch (error) {
    posts.value = []
    uni.showToast({ title: error.msg || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
const loadTags = async () => { try { const result = await getMomentTags(); tags.value = result.data?.list || [] } catch (_) { tags.value = [] } }

const ensureLogin = () => {
  if (getToken()) return true
  uni.navigateTo({ url: '/pages/login/index' })
  return false
}
const goPublish = () => { if (ensureLogin()) uni.navigateTo({ url: '/pages/moment/publish' }) }
const goMyMoments = () => { if (ensureLogin()) uni.navigateTo({ url: '/pages/moment/mine' }) }
const goPhotoTool = () => uni.navigateTo({ url: '/pages/moment/photo-tool' })
const previewImages = (urls, current) => uni.previewImage({ urls, current })
const closeActionMenu = () => { actionPostId.value = 0 }
const toggleActionMenu = (postId) => { actionPostId.value = actionPostId.value === postId ? 0 : postId }
const searchFeed = () => loadFeed()
const selectTag = (id) => { selectedTagId.value = id; loadFeed() }
const switchSort = () => { const values = ['latest', 'hot', 'favorite']; sort.value = values[(values.indexOf(sort.value) + 1) % values.length]; loadFeed() }

const toggleLike = async (post) => {
  if (!ensureLogin()) return
  try {
    const result = await toggleMomentLike(post.id)
    post.liked = result.data.liked
    post.like_count = result.data.like_count
    actionPostId.value = 0
    uni.showToast({ title: post.liked ? '点赞成功' : '已取消点赞', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.msg || '操作失败', icon: 'none' })
  }
}

const toggleFavorite = async (post) => {
  if (!ensureLogin()) return
  try {
    const result = await toggleMomentFavorite(post.id)
    post.favorited = result.data.favorited
    post.favorite_count = result.data.favorite_count
    actionPostId.value = 0
    uni.showToast({ title: post.favorited ? '收藏成功' : '已取消收藏', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.msg || '操作失败', icon: 'none' })
  }
}

const reportPost = (post) => {
  if (!ensureLogin()) return
  actionPostId.value = 0
  const reasons = ['虚假信息或营销', '违法违规', '不当内容', '人身攻击', '侵犯隐私', '其他']
  uni.showActionSheet({ itemList: reasons, success: async ({ tapIndex }) => {
    try { await reportMomentContent({ target_type: 'travel_post', target_id: post.id, report_type: reasons[tapIndex] }); uni.showToast({ title: '举报已提交', icon: 'success' }) }
    catch (error) { uni.showToast({ title: error.msg || '举报失败', icon: 'none' }) }
  } })
}

const loadComments = async (post) => {
  if (post.comments_loaded) return
  const result = await getMomentComments(post.id)
  post.comments = result.data.list || []
  post.comments_loaded = true
}

const openComment = async (post) => {
  if (!ensureLogin()) return
  actionPostId.value = 0
  try {
    await loadComments(post)
    post.comment_open = true
    composerPost.value = post
    composerFocus.value = false
    await nextTick()
    composerFocus.value = true
  } catch (error) {
    uni.showToast({ title: error.msg || '评论加载失败', icon: 'none' })
  }
}

const submitComment = async () => {
  if (!composerPost.value || !composerValue.value || commentSubmitting.value) return
  commentSubmitting.value = true
  try {
    await publishMomentComment({ post_id: composerPost.value.id, content: composerValue.value })
    composerValue.value = ''
    composerFocus.value = false
    uni.showToast({ title: '评论已提交审核', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.msg || '评论失败', icon: 'none' })
  } finally {
    commentSubmitting.value = false
  }
}

onShow(() => { loadFeed(); loadTags() })
</script>

<style scoped>
.page { min-height: 100vh; padding-bottom: calc(300rpx + env(safe-area-inset-bottom)); }
.head { display: flex; align-items: center; justify-content: space-between; padding: 36rpx 32rpx 28rpx; background: #fff; }.title { display: block; color: #1f2937; font-size: 40rpx; font-weight: 700; }.subtitle { display: block; margin-top: 10rpx; color: #6b7280; font-size: 23rpx; }.head-actions { display: flex; align-items: center; gap: 22rpx; }.my-moments { color: #526174; font-size: 25rpx; }.publish-button { margin: 0; padding: 0 26rpx; border-radius: 6rpx; background: #12b886; color: #fff; font-size: 26rpx; line-height: 64rpx; }
.photo-float { position: fixed; right: 22rpx; bottom: calc(224rpx + env(safe-area-inset-bottom)); z-index: 90; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 120rpx; height: 120rpx; border-radius: 50%; background: #1677ff; box-shadow: 0 8rpx 20rpx rgba(22, 119, 255, .24); color: #fff; font-size: 19rpx; }.photo-float-icon { position: relative; width: 38rpx; height: 29rpx; margin-bottom: 7rpx; border: 3rpx solid #fff; border-radius: 4rpx; box-sizing: border-box; }.photo-float-icon::before { position: absolute; top: -7rpx; left: 8rpx; width: 14rpx; height: 6rpx; border-radius: 2rpx 2rpx 0 0; background: #fff; content: ''; }.photo-float-icon view { position: absolute; top: 6rpx; left: 11rpx; width: 10rpx; height: 10rpx; border: 2rpx solid #fff; border-radius: 50%; }
.notice { margin: 20rpx 32rpx; padding: 18rpx 20rpx; border-radius: 6rpx; background: #e6f8f2; color: #16735a; font-size: 22rpx; line-height: 1.6; }.search-row { display: flex; gap: 14rpx; margin: 0 28rpx; padding: 12rpx 14rpx 12rpx 20rpx; border-radius: 7rpx; background: #fff; }.search-row input { flex: 1; height: 50rpx; color: #1f2937; font-size: 24rpx; }.search-row text { color: #1677ff; font-size: 24rpx; line-height: 50rpx; }.filter-row { display: flex; align-items: center; gap: 14rpx; margin: 14rpx 28rpx 18rpx; }.tag-scroll { flex: 1; white-space: nowrap; }.tag-list { display: inline-flex; gap: 12rpx; }.filter-tag { padding: 9rpx 15rpx; border-radius: 5rpx; background: #fff; color: #64748b; font-size: 21rpx; }.filter-tag.active { background: #e6f1ff; color: #1677ff; }.sort { flex: 0 0 auto; color: #526174; font-size: 22rpx; }.post-list { display: flex; flex-direction: column; gap: 16rpx; padding: 0 28rpx; }.post-card { padding: 26rpx 20rpx; background: #fff; }.moment-layout { display: flex; align-items: flex-start; }.avatar { display: flex; flex: 0 0 72rpx; align-items: center; justify-content: center; width: 72rpx; height: 72rpx; overflow: hidden; border-radius: 50%; background: #dbeafe; color: #1677ff; font-size: 28rpx; font-weight: 700; }.avatar image { width: 100%; height: 100%; }.moment-body { flex: 1; min-width: 0; margin-left: 18rpx; }.moment-name-row { display: flex; align-items: center; min-height: 38rpx; }.nickname { overflow: hidden; color: #1f2937; font-size: 28rpx; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }.pinned { margin-left: 12rpx; padding: 3rpx 8rpx; border-radius: 4rpx; background: #fff0d9; color: #b45309; font-size: 19rpx; }.moment-content { display: block; margin-top: 12rpx; color: #334155; font-size: 28rpx; line-height: 1.65; white-space: pre-wrap; }.moment-image-grid { display: grid; gap: 8rpx; margin-top: 16rpx; }.moment-image-grid.count-1 { grid-template-columns: 290rpx; }.moment-image-grid.count-2 { grid-template-columns: repeat(2, 1fr); }.moment-image-grid.count-3 { grid-template-columns: repeat(3, 1fr); }.moment-image-grid image { width: 100%; height: 164rpx; border-radius: 4rpx; }.moment-image-grid.count-1 image { height: 290rpx; }.moment-target { display: flex; align-items: center; gap: 10rpx; margin-top: 14rpx; overflow: hidden; color: #3976bf; font-size: 22rpx; }.target-name { overflow: hidden; color: #4b5563; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }.post-tags { display: flex; flex-wrap: wrap; gap: 9rpx; margin-top: 12rpx; }.post-tags text { color: #3976bf; font-size: 21rpx; }.moment-bottom-row { position: relative; display: flex; align-items: center; justify-content: space-between; min-height: 48rpx; margin-top: 16rpx; }.time { color: #94a3b8; font-size: 21rpx; }.moment-more-wrap { position: relative; }.moment-more-button { display: flex; align-items: center; justify-content: center; gap: 7rpx; width: 62rpx; height: 46rpx; border-radius: 7rpx; background: #f0f4ff; }.moment-more-button text { width: 9rpx; height: 9rpx; border-radius: 50%; background: #4d8af0; }.moment-action-menu { position: absolute; right: 0; bottom: 58rpx; z-index: 20; display: flex; align-items: center; min-width: 338rpx; height: 70rpx; padding: 0 12rpx; border-radius: 8rpx; background: #404040; box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, .18); color: #fff; }.moment-action-menu::after { position: absolute; right: 18rpx; bottom: -14rpx; width: 0; height: 0; border-top: 16rpx solid #404040; border-right: 12rpx solid transparent; border-left: 12rpx solid transparent; content: ''; }.menu-item { flex: 1; padding: 14rpx 8rpx; color: #fff; font-size: 22rpx; text-align: center; }.menu-item.selected { color: #9ff2d9; }.menu-divider { width: 1rpx; height: 30rpx; background: rgba(255, 255, 255, .35); }.interaction-box { margin-top: 8rpx; padding: 16rpx 18rpx; border-radius: 7rpx; background: #f0f1f4; color: #3f4650; font-size: 24rpx; line-height: 1.65; }.stat-line { display: block; padding-bottom: 10rpx; border-bottom: 1rpx solid #d9dde3; color: #526f9e; }.comment-line { margin-top: 8rpx; word-break: break-all; }.comment-name { color: #526f9e; font-weight: 600; }.comment-empty { display: block; margin-top: 10rpx; color: #94a3b8; font-size: 22rpx; }.composer-bar { position: fixed; right: 0; bottom: var(--hax-bottom-nav-clearance, calc(174rpx + env(safe-area-inset-bottom))); left: 0; z-index: 110; display: flex; gap: 14rpx; padding: 16rpx 24rpx; border-top: 1rpx solid #e5e7eb; background: #fff; box-shadow: 0 -4rpx 18rpx rgba(15, 23, 42, .08); }.composer-input { flex: 1; height: 72rpx; padding: 0 20rpx; border-radius: 7rpx; background: #f2f5fb; color: #1f2937; font-size: 27rpx; }.send-button { flex: 0 0 104rpx; width: 104rpx; margin: 0; padding: 0; border-radius: 7rpx; background: #4d9cf7; color: #fff; font-size: 27rpx; line-height: 72rpx; }.empty-state { margin: 24rpx 32rpx; padding: 70rpx 24rpx; border-radius: 8rpx; background: #fff; color: #9ca3af; font-size: 26rpx; text-align: center; }
</style>
