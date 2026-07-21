<template>
  <view class="page">
    <view class="notice-card"><view><text class="notice-title">消息通知</text><text class="notice-note">站内消息始终保留；微信提醒需在微信中授权订阅。</text></view><button class="subscribe-button" @click="subscribeWechat">开启微信提醒</button></view>
    <scroll-view scroll-x class="category-scroll"><view class="category-tabs"><text v-for="item in categories" :key="item.key" :class="['category-tab',{active:activeCategory===item.key}]" @click="switchCategory(item.key)">{{ item.name }}</text></view></scroll-view>
    <AppState v-if="loading" type="loading" title="消息读取中" />
    <AppState v-else-if="loadError" type="error" :description="loadError.msg" action-text="重新加载" @action="load" />
    <view v-else-if="filteredMessages.length" class="message-list"><view v-for="item in filteredMessages" :key="item.id" :class="['message-card', { unread: !item.is_read }]" @click="openMessage(item)"><view class="message-head"><text class="message-title">{{ item.title }}</text><text class="message-time">{{ item.created_at }}</text></view><text class="message-category">{{ categoryText(item.category) }}</text><text class="message-content">{{ item.content }}</text><text v-if="!item.is_read" class="unread-mark">未读</text></view></view>
    <AppState v-else type="empty" title="暂无消息通知" description="订单、服务和审核进度会在这里通知你" />
    <view v-if="messages.length" class="read-all" @click="readAll">全部标记为已读</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMessages, getWechatMessageTemplates, readAllMessages, readMessage } from '../../api/message'
import AppState from '../../components/AppState.vue'

const messages = ref([])
const categories = [{ key: '', name: '全部' }, { key: 'order', name: '订单' }, { key: 'service', name: '服务' }, { key: 'marketing', name: '营销' }, { key: 'system', name: '系统' }]
const activeCategory = ref('')
const categoryText = (category) => ({ order: '订单', service: '服务', marketing: '营销', system: '系统' }[category] || '系统')
const filteredMessages = computed(() => activeCategory.value ? messages.value.filter((item) => item.category === activeCategory.value) : messages.value)
const loading = ref(false)
const loadError = ref(null)
const load = async () => { loading.value = true; loadError.value = null; try { const result = await getMessages(); messages.value = result.data?.list || [] } catch (error) { loadError.value = error } finally { loading.value = false } }
const switchCategory = (category) => { activeCategory.value = category }
const openMessage = async (item) => { if (!item.is_read) { try { await readMessage(item.id); item.is_read = 1 } catch (_) {} } const routes = { rental_order: `/pages/order/detail?id=${item.related_id}`, service_order: `/pages/order/service-detail?id=${item.related_id}`, rental_settlement: `/pages/order/detail?id=${item.related_id}`, order_review: '/pages/order/list', travel_post: '/pages/moment/mine', content_report: '/pages/moment/mine' }; if (routes[item.related_type]) uni.navigateTo({ url: routes[item.related_type] }) }
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
.page{min-height:100vh;padding:24rpx 32rpx calc(48rpx + env(safe-area-inset-bottom))}.notice-card{display:flex;align-items:center;justify-content:space-between;gap:20rpx;margin-bottom:18rpx;padding:22rpx 24rpx;border-radius:8rpx;background:#eef6ff}.notice-title,.notice-note{display:block}.notice-title{color:#1f2937;font-size:28rpx;font-weight:600}.notice-note{margin-top:8rpx;color:#64748b;font-size:21rpx;line-height:1.45}.subscribe-button{flex:none;margin:0;padding:0 16rpx;border-radius:6rpx;background:#1677ff;color:#fff;font-size:22rpx;line-height:58rpx}.category-scroll{margin:0 -8rpx 18rpx;white-space:nowrap}.category-tabs{display:inline-flex;gap:12rpx;padding:0 8rpx}.category-tab{padding:10rpx 20rpx;border-radius:6rpx;background:#f1f5f9;color:#64748b;font-size:22rpx}.category-tab.active{background:#e6f1ff;color:#1677ff}.message-list{display:flex;flex-direction:column;gap:14rpx}.message-card{position:relative;padding:23rpx 24rpx;border-radius:8rpx;background:#fff}.message-card.unread{border-left:6rpx solid #1677ff}.message-head{display:flex;justify-content:space-between;gap:20rpx}.message-title{color:#1f2937;font-size:28rpx;font-weight:600}.message-time{flex:none;color:#9ca3af;font-size:20rpx}.message-category{display:inline-block;margin-top:10rpx;padding:3rpx 9rpx;border-radius:4rpx;background:#f1f5f9;color:#64748b;font-size:18rpx}.message-content{display:block;margin-top:13rpx;color:#64748b;font-size:23rpx;line-height:1.55}.unread-mark{display:block;margin-top:10rpx;color:#1677ff;font-size:20rpx}.empty{padding:180rpx 0;color:#9ca3af;font-size:26rpx;text-align:center}.read-all{margin:26rpx auto;color:#1677ff;font-size:24rpx;text-align:center}
</style>
