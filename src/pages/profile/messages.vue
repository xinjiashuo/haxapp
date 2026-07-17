<template>
  <view class="page">
    <view class="notice-card"><view><text class="notice-title">消息通知</text><text class="notice-note">站内消息始终保留；微信提醒需在微信中授权订阅。</text></view><button class="subscribe-button" @click="subscribeWechat">开启微信提醒</button></view>
    <view v-if="messages.length" class="message-list"><view v-for="item in messages" :key="item.id" :class="['message-card', { unread: !item.is_read }]" @click="openMessage(item)"><view class="message-head"><text class="message-title">{{ item.title }}</text><text class="message-time">{{ item.created_at }}</text></view><text class="message-content">{{ item.content }}</text><text v-if="!item.is_read" class="unread-mark">未读</text></view></view>
    <view v-else-if="!loading" class="empty">暂无消息通知</view>
    <view v-if="messages.length" class="read-all" @click="readAll">全部标记为已读</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMessages, getWechatMessageTemplates, readAllMessages, readMessage } from '../../api/message'

const messages = ref([])
const loading = ref(false)
const load = async () => { loading.value = true; try { const result = await getMessages(); messages.value = result.data?.list || [] } catch (error) { uni.showToast({ title: error.msg || '消息读取失败', icon: 'none' }) } finally { loading.value = false } }
const openMessage = async (item) => { if (!item.is_read) { try { await readMessage(item.id); item.is_read = 1 } catch (_) {} } if (item.related_type === 'rental_order') uni.navigateTo({ url: `/pages/order/detail?id=${item.related_id}` }); else if (item.related_type === 'service_order') uni.navigateTo({ url: `/pages/order/service-detail?id=${item.related_id}` }) }
const readAll = async () => { try { await readAllMessages(); messages.value.forEach(item => { item.is_read = 1 }); uni.showToast({ title: '已全部标记为已读', icon: 'success' }) } catch (error) { uni.showToast({ title: error.msg || '操作失败', icon: 'none' }) } }
const subscribeWechat = async () => {
  // #ifdef MP-WEIXIN
  try { const result = await getWechatMessageTemplates(); const ids = result.data?.tmpl_ids || []; if (!ids.length) { uni.showToast({ title: '商家暂未配置微信通知模板', icon: 'none' }); return } uni.requestSubscribeMessage({ tmplIds: ids.slice(0, 3), success: () => uni.showToast({ title: '微信提醒授权结果已提交', icon: 'success' }), fail: () => uni.showToast({ title: '未开启微信提醒，站内消息仍会保留', icon: 'none' }) }) } catch (error) { uni.showToast({ title: error.msg || '微信提醒配置读取失败', icon: 'none' }) }
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '请在微信小程序中开启微信提醒', icon: 'none' })
  // #endif
}
onShow(load)
</script>

<style scoped>
.page{min-height:100vh;padding:24rpx 32rpx calc(48rpx + env(safe-area-inset-bottom))}.notice-card{display:flex;align-items:center;justify-content:space-between;gap:20rpx;margin-bottom:18rpx;padding:22rpx 24rpx;border-radius:8rpx;background:#eef6ff}.notice-title,.notice-note{display:block}.notice-title{color:#1f2937;font-size:28rpx;font-weight:600}.notice-note{margin-top:8rpx;color:#64748b;font-size:21rpx;line-height:1.45}.subscribe-button{flex:none;margin:0;padding:0 16rpx;border-radius:6rpx;background:#1677ff;color:#fff;font-size:22rpx;line-height:58rpx}.message-list{display:flex;flex-direction:column;gap:14rpx}.message-card{position:relative;padding:23rpx 24rpx;border-radius:8rpx;background:#fff}.message-card.unread{border-left:6rpx solid #1677ff}.message-head{display:flex;justify-content:space-between;gap:20rpx}.message-title{color:#1f2937;font-size:28rpx;font-weight:600}.message-time{flex:none;color:#9ca3af;font-size:20rpx}.message-content{display:block;margin-top:13rpx;color:#64748b;font-size:23rpx;line-height:1.55}.unread-mark{display:block;margin-top:10rpx;color:#1677ff;font-size:20rpx}.empty{padding:180rpx 0;color:#9ca3af;font-size:26rpx;text-align:center}.read-all{margin:26rpx auto;color:#1677ff;font-size:24rpx;text-align:center}
</style>
