<template>
  <view class="page">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!drafts.length" class="empty">暂无草稿，发布旅记时会自动保存</view>
    <view v-else class="draft-list"><view v-for="draft in drafts" :key="draft.id" class="draft-card" @click="editDraft(draft.id)"><text class="content">{{ draft.content }}</text><view class="meta"><text>{{ draft.target ? draft.target.name : '未关联地点' }}</text><text>{{ draft.updated_at }}</text></view><text class="delete" @click.stop="removeDraft(draft.id)">删除</text></view></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { deleteMomentDraft, getMomentDrafts } from '../../api/moment'

const drafts = ref([])
const loading = ref(false)
const loadDrafts = async () => { loading.value = true; try { const result = await getMomentDrafts(); drafts.value = result.data?.list || [] } catch (error) { uni.showToast({ title: error.msg || '草稿加载失败', icon: 'none' }) } finally { loading.value = false } }
const editDraft = (id) => uni.navigateTo({ url: `/pages/moment/publish?draft_id=${id}` })
const removeDraft = (id) => uni.showModal({ title: '删除草稿', content: '删除后无法恢复，是否继续？', confirmColor: '#e35d5b', success: async ({ confirm }) => { if (!confirm) return; try { await deleteMomentDraft(id); uni.showToast({ title: '已删除', icon: 'success' }); loadDrafts() } catch (error) { uni.showToast({ title: error.msg || '删除失败', icon: 'none' }) } } })
onShow(loadDrafts)
</script>

<style scoped>
.page { min-height: 100vh; padding: 22rpx 28rpx; box-sizing: border-box; background: #f5f7fa; }.draft-list { display: flex; flex-direction: column; gap: 16rpx; }.draft-card { position: relative; padding: 24rpx; border-radius: 8rpx; background: #fff; }.content { display: block; padding-right: 70rpx; overflow: hidden; color: #334155; font-size: 27rpx; line-height: 1.6; text-overflow: ellipsis; white-space: nowrap; }.meta { display: flex; justify-content: space-between; gap: 18rpx; margin-top: 16rpx; color: #94a3b8; font-size: 21rpx; }.delete { position: absolute; top: 24rpx; right: 22rpx; color: #d04b4b; font-size: 22rpx; }.empty { margin-top: 22rpx; padding: 100rpx 24rpx; border-radius: 8rpx; background: #fff; color: #9ca3af; font-size: 26rpx; text-align: center; }
</style>
