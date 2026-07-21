<template>
  <view class="page">
    <view class="notice">举报处理结果会通过站内消息通知。这里会保留你的提交记录与处理说明。</view>
    <view v-if="loading" class="empty">举报记录读取中</view>
    <view v-else-if="!items.length" class="empty">暂无举报记录</view>
    <view v-else class="list"><view v-for="item in items" :key="item.id" class="card"><view class="head"><text>{{ item.target_name }}</text><text :class="['status', item.status]">{{ item.status_text }}</text></view><text class="reason">举报原因：{{ item.report_type }}</text><text v-if="item.content" class="content">补充说明：{{ item.content }}</text><text v-if="item.handle_result" class="result">处理结果：{{ item.handle_result }}</text><text class="time">{{ item.created_at }}</text></view></view>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMomentReports } from '../../api/moment'
const items = ref([]); const loading = ref(false)
const load = async () => { loading.value = true; try { items.value = (await getMomentReports()).data?.list || [] } catch (error) { uni.showToast({ title: error.msg || '举报记录读取失败', icon: 'none' }) } finally { loading.value = false } }
onShow(load)
</script>
<style scoped>.page{min-height:100vh;padding:24rpx 28rpx;background:#f5f7fa}.notice{padding:18rpx 20rpx;border-radius:7rpx;background:#eef6ff;color:#3976bf;font-size:22rpx;line-height:1.6}.list{display:flex;flex-direction:column;gap:16rpx;margin-top:18rpx}.card{padding:22rpx;border-radius:8rpx;background:#fff}.head{display:flex;justify-content:space-between;align-items:center;color:#1f2937;font-size:27rpx;font-weight:600}.status{padding:4rpx 10rpx;border-radius:4rpx;background:#fff4e5;color:#b7791f;font-size:20rpx}.status.resolved{background:#e6f8f2;color:#0f8e69}.status.rejected{background:#f1f5f9;color:#64748b}.reason,.content,.result,.time{display:block;margin-top:12rpx;color:#64748b;font-size:22rpx;line-height:1.5}.result{padding:12rpx;border-radius:5rpx;background:#f0f9ff;color:#3976bf}.time{color:#94a3b8;font-size:20rpx}.empty{padding:180rpx 0;color:#9ca3af;font-size:26rpx;text-align:center}</style>
