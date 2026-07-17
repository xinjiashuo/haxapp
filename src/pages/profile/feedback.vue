<template>
  <view class="page">
    <view class="tabs"><text :class="['tab', { active: activeTab === 'create' }]" @click="activeTab = 'create'">提交反馈</text><text :class="['tab', { active: activeTab === 'history' }]" @click="showHistory">历史记录</text></view>
    <template v-if="activeTab === 'create'">
      <view class="card"><text class="label">反馈类型</text><view class="type-list"><text v-for="item in types" :key="item.value" :class="['type-item', { selected: form.feedback_type === item.value }]" @click="form.feedback_type = item.value">{{ item.label }}</text></view></view>
      <view class="card"><text class="label">反馈内容</text><textarea v-model.trim="form.content" class="content-input" maxlength="1000" placeholder="请描述您遇到的问题或建议，我们会尽快处理。" /><text class="counter">{{ form.content.length }}/1000</text><view class="image-list"><view v-for="(image, index) in images" :key="image" class="image-item"><image :src="image" mode="aspectFill" @click="preview(images, image)"/><text class="remove" @click="images.splice(index, 1)">×</text></view><view v-if="images.length < 9" class="image-add" @click="chooseImage">+</view></view></view>
      <view class="card"><text class="label">联系电话</text><input v-model.trim="form.contact_mobile" class="mobile-input" type="number" maxlength="11" placeholder="便于门店联系您（可选）" /></view>
      <button class="submit-button" :loading="submitting" @click="submit">提交反馈</button>
    </template>
    <view v-else class="history-list"><view v-if="loading" class="empty">反馈记录加载中</view><template v-else><view v-for="item in feedbacks" :key="item.id" class="history-card"><view class="history-head"><text class="type-badge">{{ item.feedback_type_text }}</text><text :class="['status', item.status]">{{ item.status_text }}</text></view><text class="history-content">{{ item.content }}</text><view v-if="item.images?.length" class="history-images"><image v-for="url in item.images" :key="url" :src="url" mode="aspectFill" @click="preview(item.images, url)"/></view><text class="history-time">{{ item.created_at }}</text><view v-if="item.reply_content" class="reply"><text class="reply-title">门店回复</text><text>{{ item.reply_content }}</text><text v-if="item.replied_at" class="reply-time">{{ item.replied_at }}</text></view></view><view v-if="!feedbacks.length" class="empty">暂无反馈记录</view></template></view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { createFeedback, getFeedbacks, uploadFeedbackImage } from '../../api/feedback'
import { getUser } from '../../utils/user-session'

const activeTab = ref('create')
const submitting = ref(false)
const loading = ref(false)
const feedbacks = ref([])
const images = ref([])
const types = [{ value: 'suggestion', label: '功能建议' }, { value: 'issue', label: '使用问题' }, { value: 'complaint', label: '投诉建议' }, { value: 'other', label: '其他' }]
const form = reactive({ feedback_type: 'suggestion', content: '', contact_mobile: getUser()?.mobile || '' })
const loadHistory = async () => { loading.value = true; try { feedbacks.value = (await getFeedbacks()).data?.list || [] } catch (error) { uni.showToast({ title: error.msg || '反馈记录读取失败', icon: 'none' }) } finally { loading.value = false } }
const showHistory = () => { activeTab.value = 'history'; loadHistory() }
const preview = (urls, current) => uni.previewImage({ urls, current })
const chooseImage = () => uni.chooseImage({ count: 9 - images.value.length, sizeType: ['compressed'], success: async ({ tempFilePaths }) => { uni.showLoading({ title: '上传中', mask: true }); try { for (const filePath of tempFilePaths) { const url = await uploadFeedbackImage(filePath); if (url) images.value.push(url) } } catch (error) { uni.showToast({ title: error.msg || '图片上传失败', icon: 'none' }) } finally { uni.hideLoading() } } })
const submit = async () => { if (form.content.length < 5) return uni.showToast({ title: '请至少填写5个字', icon: 'none' }); submitting.value = true; try { await createFeedback({ ...form, images: JSON.stringify(images.value) }); uni.showToast({ title: '反馈已提交', icon: 'success' }); form.content = ''; images.value = []; showHistory() } catch (error) { uni.showToast({ title: error.msg || '提交失败', icon: 'none' }) } finally { submitting.value = false } }
onShow(() => { if (activeTab.value === 'history') loadHistory() })
</script>

<style scoped>
.page{min-height:100vh;padding:24rpx 32rpx calc(56rpx + env(safe-area-inset-bottom))}.tabs{display:flex;margin-bottom:20rpx;border-bottom:1rpx solid #e5e7eb;background:#fff}.tab{flex:1;padding:23rpx 0;color:#6b7280;font-size:28rpx;text-align:center}.tab.active{position:relative;color:#1677ff;font-weight:600}.tab.active:after{position:absolute;bottom:0;left:50%;width:56rpx;height:4rpx;border-radius:2rpx;background:#1677ff;content:'';transform:translateX(-50%)}.card,.history-card{margin-bottom:18rpx;padding:26rpx;border-radius:8rpx;background:#fff}.label{display:block;margin-bottom:20rpx;color:#1f2937;font-size:28rpx;font-weight:600}.type-list{display:flex;flex-wrap:wrap;gap:14rpx}.type-item{padding:12rpx 20rpx;border:1rpx solid #dbe2ea;border-radius:6rpx;color:#64748b;font-size:24rpx}.type-item.selected{border-color:#1677ff;background:#eef6ff;color:#1677ff}.content-input{box-sizing:border-box;width:100%;height:250rpx;color:#374151;font-size:27rpx;line-height:1.55}.counter{display:block;color:#9ca3af;font-size:21rpx;text-align:right}.mobile-input{height:62rpx;color:#374151;font-size:27rpx}.image-list,.history-images{display:flex;flex-wrap:wrap;gap:14rpx;margin-top:16rpx}.image-item,.image-add{position:relative;display:flex;align-items:center;justify-content:center;width:142rpx;height:142rpx;overflow:hidden;border-radius:6rpx}.image-item image,.history-images image{width:100%;height:100%}.image-add{border:1rpx dashed #9ca3af;color:#6b7280;font-size:52rpx}.remove{position:absolute;top:6rpx;right:6rpx;display:flex;align-items:center;justify-content:center;width:34rpx;height:34rpx;border-radius:50%;background:rgba(31,41,55,.7);color:#fff;font-size:24rpx}.submit-button{margin-top:24rpx;border-radius:6rpx;background:#1677ff;color:#fff;font-size:30rpx}.history-head{display:flex;justify-content:space-between;align-items:center}.type-badge{padding:5rpx 12rpx;border-radius:4rpx;background:#eef6ff;color:#1677ff;font-size:21rpx}.status{font-size:23rpx}.status.pending{color:#d97706}.status.processing{color:#1677ff}.status.replied{color:#0f8e69}.status.closed{color:#9ca3af}.history-content{display:block;margin-top:18rpx;color:#374151;font-size:27rpx;line-height:1.55}.history-images image{width:150rpx;height:150rpx;border-radius:6rpx}.history-time,.reply-time{display:block;margin-top:14rpx;color:#9ca3af;font-size:21rpx}.reply{display:flex;flex-direction:column;gap:8rpx;margin-top:18rpx;padding:18rpx;border-radius:6rpx;background:#f8fafc;color:#475569;font-size:24rpx;line-height:1.5}.reply-title{color:#1f2937;font-weight:600}.reply-time{margin-top:0}.empty{padding:140rpx 24rpx;color:#9ca3af;font-size:26rpx;text-align:center}
</style>
