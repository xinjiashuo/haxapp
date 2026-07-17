<template>
  <view class="page">
    <view class="notice">旅记会在审核通过后展示。可关联一个真实去过的景点或餐馆。</view>
    <view class="draft-entry"><text>{{ draftId ? '正在编辑草稿' : '内容会自动保存为草稿' }}</text><view><text @click="goPhotoTool">照片处理</text><text @click="goDrafts">草稿箱</text></view></view>
    <view class="form-card">
      <textarea v-model.trim="content" class="content-input" placeholder="记录这一段旅程、感受或实用信息" maxlength="2000" />
      <view class="image-list">
        <view v-for="(item, index) in images" :key="item" class="image-item"><image :src="item" mode="aspectFill" /><text class="remove" @click="removeImage(index)">x</text></view>
        <view v-if="images.length < 9" class="image-add" @click="chooseImage">+</view>
      </view>
    </view>
    <picker :range="targetNames" :value="targetIndex" @change="targetChange"><view class="target-picker"><text class="picker-label">关联地点</text><text class="picker-value">{{ selectedTarget ? `${selectedTarget.type_name} · ${selectedTarget.name}` : '不关联地点' }}</text><view class="arrow-icon"></view></view></picker>
    <view v-if="tags.length" class="tag-card"><text class="tag-title">内容标签</text><view class="tag-list"><text v-for="tag in tags" :key="tag.id" class="tag" :class="{ active: selectedTagIds.includes(tag.id) }" @click="toggleTag(tag.id)">{{ tag.name }}</text></view></view>
    <view class="button-row"><button class="draft-button" @click="saveDraft(false)">保存草稿</button><button class="submit-button" :loading="submitting" @click="submit">提交审核</button></view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onHide, onLoad } from '@dcloudio/uni-app'
import { getMomentDrafts, getMomentTags, getMomentTargets, publishMoment, saveMomentDraft, uploadMomentImage } from '../../api/moment'

const content = ref('')
const images = ref([])
const targets = ref([])
const selectedTarget = ref(null)
const targetIndex = ref(0)
const submitting = ref(false)
const tags = ref([])
const selectedTagIds = ref([])
const draftId = ref(0)
const targetNames = computed(() => ['不关联地点', ...targets.value.map((item) => `${item.type_name} · ${item.name}`)])

const coordinateDistance = (from, target) => {
  const latitude = Number(target.latitude); const longitude = Number(target.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  const radians = (value) => value * Math.PI / 180
  const earthRadius = 6371
  const deltaLatitude = radians(latitude - from.latitude)
  const deltaLongitude = radians(longitude - from.longitude)
  const a = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(latitude)) * Math.sin(deltaLongitude / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const sortTargetsByDistance = () => new Promise((resolve) => {
  uni.getLocation({
    type: 'gcj02',
    success: (location) => {
      targets.value = [...targets.value].sort((left, right) => {
        const leftDistance = coordinateDistance(location, left); const rightDistance = coordinateDistance(location, right)
        if (leftDistance === null && rightDistance === null) return 0
        if (leftDistance === null) return 1
        if (rightDistance === null) return -1
        return leftDistance - rightDistance
      })
      resolve()
    },
    fail: () => resolve(),
  })
})

const loadTargets = async () => {
  try {
    const result = await getMomentTargets()
    targets.value = result.data.list || []
    await sortTargetsByDistance()
  } catch (error) { uni.showToast({ title: '地点加载失败', icon: 'none' }) }
}
const loadTags = async () => { try { const result = await getMomentTags(); tags.value = result.data?.list || [] } catch (_) { tags.value = [] } }
const targetChange = ({ detail }) => { const index = Number(detail.value); targetIndex.value = index; selectedTarget.value = index === 0 ? null : targets.value[index - 1] }
const removeImage = (index) => images.value.splice(index, 1)
const toggleTag = (id) => { const index = selectedTagIds.value.indexOf(id); if (index >= 0) { selectedTagIds.value.splice(index, 1); return } if (selectedTagIds.value.length >= 8) return uni.showToast({ title: '最多选择8个标签', icon: 'none' }); selectedTagIds.value.push(id) }
const goDrafts = () => uni.navigateTo({ url: '/pages/moment/drafts' })
const goPhotoTool = () => uni.navigateTo({ url: '/pages/moment/photo-tool' })

const chooseImage = () => {
  uni.chooseImage({ count: 9 - images.value.length, sizeType: ['compressed'], success: async ({ tempFilePaths }) => {
    uni.showLoading({ title: '上传中' })
    try { for (const filePath of tempFilePaths) { const result = await uploadMomentImage(filePath); if (result.url) images.value.push(result.url) } }
    catch (error) { uni.showToast({ title: error.msg || '图片上传失败', icon: 'none' }) }
    finally { uni.hideLoading() }
  } })
}

const saveDraft = async (silent = false) => {
  if (!content.value) { if (!silent) uni.showToast({ title: '请先填写旅记内容', icon: 'none' }); return }
  try {
    const result = await saveMomentDraft({ id: draftId.value, content: content.value, images: JSON.stringify(images.value), target_type: selectedTarget.value?.target_type || '', target_id: selectedTarget.value?.target_id || 0, tag_ids: JSON.stringify(selectedTagIds.value) })
    draftId.value = result.data?.id || draftId.value
    if (!silent) uni.showToast({ title: '草稿已保存', icon: 'success' })
  } catch (error) { if (!silent) uni.showToast({ title: error.msg || '草稿保存失败', icon: 'none' }) }
}

const submit = async () => {
  if (!content.value) { uni.showToast({ title: '请填写旅记内容', icon: 'none' }); return }
  submitting.value = true
  try {
    await publishMoment({ content: content.value, images: JSON.stringify(images.value), target_type: selectedTarget.value?.target_type || '', target_id: selectedTarget.value?.target_id || 0, tag_ids: JSON.stringify(selectedTagIds.value), draft_id: draftId.value })
    uni.showToast({ title: '已提交审核', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 900)
  } catch (error) { uni.showToast({ title: error.msg || '提交失败', icon: 'none' }) } finally { submitting.value = false }
}

onLoad(async (query) => {
  await Promise.all([loadTargets(), loadTags()])
  const id = Number(query?.draft_id || 0)
  if (!id) return
  try {
    const result = await getMomentDrafts()
    const draft = (result.data?.list || []).find((item) => item.id === id)
    if (!draft) return
    draftId.value = draft.id; content.value = draft.content || ''; images.value = draft.images || []; selectedTagIds.value = draft.tag_ids || []
    const targetIndexValue = targets.value.findIndex((item) => item.target_type === draft.target_type && Number(item.target_id) === Number(draft.target_id))
    if (targetIndexValue >= 0) { targetIndex.value = targetIndexValue + 1; selectedTarget.value = targets.value[targetIndexValue] }
  } catch (_) { }
})
onHide(() => { saveDraft(true) })
</script>

<style scoped>
.page { min-height: 100vh; padding: 24rpx 32rpx 48rpx; }.notice { margin-bottom: 20rpx; padding: 20rpx 24rpx; border-radius: 8rpx; background: #e6f8f2; color: #16735a; font-size: 23rpx; line-height: 1.65; }.draft-entry { display: flex; justify-content: space-between; margin: -5rpx 4rpx 18rpx; color: #8b96a7; font-size: 22rpx; }.draft-entry view { display: flex; gap: 22rpx; }.draft-entry view text { color: #1677ff; }
.form-card { padding: 24rpx; border-radius: 8rpx; background: #fff; }.content-input { box-sizing: border-box; width: 100%; height: 260rpx; color: #374151; font-size: 29rpx; line-height: 1.6; }
.image-list { display: flex; flex-wrap: wrap; gap: 14rpx; margin-top: 18rpx; }.image-item, .image-add { position: relative; display: flex; align-items: center; justify-content: center; width: 142rpx; height: 142rpx; overflow: hidden; border-radius: 6rpx; }.image-item image { width: 100%; height: 100%; }.image-add { border: 1rpx dashed #9ca3af; color: #6b7280; font-size: 52rpx; }.remove { position: absolute; top: 6rpx; right: 6rpx; display: flex; align-items: center; justify-content: center; width: 34rpx; height: 34rpx; border-radius: 50%; background: rgba(31, 41, 55, .7); color: #fff; font-size: 24rpx; }
.target-picker { display: flex; align-items: center; margin-top: 20rpx; padding: 27rpx 24rpx; border-radius: 8rpx; background: #fff; }.picker-label { color: #1f2937; font-size: 28rpx; font-weight: 600; }.picker-value { flex: 1; margin-left: 24rpx; overflow: hidden; color: #6b7280; font-size: 25rpx; text-align: right; text-overflow: ellipsis; white-space: nowrap; }.arrow-icon { width: 12rpx; height: 12rpx; margin-left: 20rpx; border-top: 3rpx solid #9ca3af; border-right: 3rpx solid #9ca3af; transform: rotate(45deg); }.tag-card { margin-top: 20rpx; padding: 24rpx; border-radius: 8rpx; background: #fff; }.tag-title { color: #1f2937; font-size: 28rpx; font-weight: 600; }.tag-list { display: flex; flex-wrap: wrap; gap: 14rpx; margin-top: 18rpx; }.tag { padding: 9rpx 16rpx; border-radius: 5rpx; background: #f1f5f9; color: #64748b; font-size: 22rpx; }.tag.active { background: #e6f1ff; color: #1677ff; }.button-row { display: flex; gap: 16rpx; margin-top: 32rpx; }.button-row button { flex: 1; margin: 0; border-radius: 6rpx; font-size: 28rpx; }.draft-button { border: 1rpx solid #12b886; background: #fff; color: #0f8e69; }.submit-button { background: #12b886; color: #fff; }
</style>
