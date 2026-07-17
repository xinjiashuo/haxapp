<template>
  <view class="page">
    <view v-if="loading" class="empty-state">订单读取中</view>
    <block v-else-if="order">
      <view class="status-card"><text class="status-label">服务状态</text><text class="status-value">{{ order.status_text }}</text><text class="status-no">{{ order.order_no }}</text></view>
      <view v-if="order.price_confirmation_status==='pending'" class="section quote-section"><text class="section-title">门店报价待确认</text><view class="info-row"><text>本次报价</text><text class="quote-amount">¥{{ order.quoted_amount }}</text></view><view v-if="order.price_adjust_reason" class="quote-reason">{{ order.price_adjust_reason }}</view><text class="section-note">确认后将按该金额支付；如已有付款，页面会展示待补缴金额。</text><button class="confirm-quote" :loading="confirming" @click="confirmQuote">确认价格</button></view>
      <view class="section">
        <text class="section-title">预约信息</text>
        <view class="info-row"><text>服务项目</text><text>{{ order.service_item_name }}</text></view>
        <view class="info-row"><text>预约车辆</text><text>{{ order.service_plate_no }}</text></view>
        <view class="info-row"><text>预约时间</text><text>{{ order.appointment_time }}</text></view>
        <view v-if="order.appointment_end_time" class="info-row"><text>预计结束</text><text>{{ order.appointment_end_time }}</text></view>
        <view v-if="order.workstation_name_snapshot" class="info-row"><text>服务工位</text><text>{{ order.workstation_name_snapshot }}</text></view>
        <view v-if="order.remark" class="info-row"><text>备注</text><text>{{ order.remark }}</text></view>
      </view>
      <view v-if="order.reschedules?.length" class="section"><text class="section-title">改期记录</text><view v-for="record in order.reschedules" :key="record.created_at" class="record-card"><text class="record-time">{{ record.old_appointment_time }} 调整为 {{ record.new_appointment_time }}</text><text v-if="record.reason" class="record-note">{{ record.reason }}</text></view></view>
      <view class="section">
        <text class="section-title">费用说明</text>
        <view v-if="order.pricing_mode_snapshot==='range'" class="info-row"><text>参考价格区间</text><text>¥{{ order.price_min_snapshot }} - ¥{{ order.price_max_snapshot }}</text></view><view v-else-if="order.pricing_mode_snapshot==='quote'" class="info-row"><text>计价方式</text><text>现场报价</text></view>
        <view class="info-row"><text>服务原价</text><text>¥{{ order.original_amount || order.amount }}</text></view>
        <view v-for="promotion in order.promotions || []" :key="promotion.rule_name" class="info-row discount"><text>{{ promotion.rule_name }}</text><text v-if="Number(promotion.discount_amount)>0">-¥{{ promotion.discount_amount }}</text><text v-else>完成后赠送积分</text></view>
        <view v-if="Number(order.discount_amount)>0" class="info-row discount"><text>会员优惠</text><text>-¥{{ order.discount_amount }}</text></view>
        <view class="info-row total"><text>预计服务费</text><text>¥{{ order.payable_amount || order.amount }}</text></view>
        <view class="info-row"><text>支付状态</text><text>{{ paymentStatusText }}</text></view>
        <text class="section-note">线上支付完成后，门店将确认服务时间和到店安排。</text>
      </view>
      <view v-if="order.records?.length" class="section">
        <text class="section-title">服务记录</text>
        <view v-for="record in order.records" :key="record.service_no" class="record-card"><view class="record-head"><text>{{ record.service_no }}</text><text class="record-status">{{ record.status_text }}</text></view><text v-if="record.started_at" class="record-time">开始：{{ record.started_at }}</text><text v-if="record.finished_at" class="record-time">完成：{{ record.finished_at }}</text><text v-if="record.remark" class="record-note">{{ record.remark }}</text></view>
      </view>
      <view v-if="order.warranty" class="section"><text class="section-title">服务质保</text><view class="record-card"><view class="record-head"><text>{{ order.warranty.service_item_name }}</text><text class="record-status">{{ order.warranty.status_text }}</text></view><text class="record-time">质保期限：{{ order.warranty.started_at }} 至 {{ order.warranty.expires_at }}</text><text v-if="order.warranty.warranty_terms" class="record-note">{{ order.warranty.warranty_terms }}</text></view></view>
      <view v-if="canShowCode" class="section verification-section">
        <text class="section-title">到店核销</text>
        <text class="section-note">请在支付完成后 30 天内向门店员工出示核销码，核销后开始服务。</text>
        <button class="code-button" @click="showVerificationCode">出示核销码</button>
      </view>
      <view v-if="order.status === 'completed'" class="section"><text class="section-title">订单评价</text><template v-if="order.review"><view class="info-row"><text>整体评分</text><text class="review-score">{{ order.review.overall_rating }} / 5</text></view><view class="info-row"><text>服务质量</text><text>{{ order.review.service_rating }} / 5</text></view><view class="info-row"><text>价格透明</text><text>{{ order.review.price_rating || '-' }} / 5</text></view><view class="info-row"><text>服务效率</text><text>{{ order.review.efficiency_rating || '-' }} / 5</text></view><view v-if="order.review.tags?.length" class="review-tags"><text v-for="tag in order.review.tags" :key="tag">{{ tag }}</text></view><text v-if="order.review.content" class="review-content">{{ order.review.content }}</text><view v-if="order.review.images?.length" class="image-list"><image v-for="url in order.review.images" :key="url" :src="url" mode="aspectFill" @click="preview(order.review.images)"/></view><view v-if="order.review.reply_content" class="merchant-reply"><text>商家回复</text><text>{{ order.review.reply_content }}</text></view><view v-if="order.review.followup_content" class="merchant-reply"><text>我的补充</text><text>{{ order.review.followup_content }}</text></view><button v-if="order.review.can_followup" class="review-button followup-button" @click="followUpReview">补充评价</button></template><template v-else><text class="section-note">分享本次服务体验，帮助我们持续改进。</text><button class="review-button" @click="writeReview">去评价</button></template></view>
      <view v-if="canPay || canReschedule || canCancel" class="action-section"><button v-if="canPay" class="pay-button" @click="payOrder">去支付</button><button v-if="canReschedule" class="reschedule-button" @click="reschedule">调整预约</button><button v-if="canCancel" class="cancel-button" @click="cancelOrder">取消预约</button></view><text v-if="canReschedule" class="reschedule-note">每单最多改期 {{ order.reschedule_limit || 2 }} 次；服务开始前 {{ order.reschedule_cutoff_hours || 0 }} 小时停止改期。</text>
    </block>
    <view v-else class="empty-state">订单不存在或已失效</view>
    <view v-if="verification.visible" class="code-mask" @click="verification.visible=false"><view class="code-panel" @click.stop><text class="code-title">服务订单核销码</text><image v-if="verification.url" :src="verification.url" mode="aspectFit"/><text class="code-no">{{ verification.orderNo }}</text><text class="code-tip">有效期至 {{ verification.expiresAt }}</text><button @click="verification.visible=false">关闭</button></view></view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { cancelServiceOrder, confirmServiceQuote, getServiceOrder, getServiceVerificationCode } from '../../api/service'

const order = ref(null)
const loading = ref(true)
const orderId = ref(0)
const canPay = computed(() => order.value?.status === 'pending_payment' && order.value?.payment_status !== 'paid')
const canCancel = computed(() => ['pending_payment', 'pending', 'confirmed'].includes(order.value?.status))
const canReschedule = computed(() => ['pending_quote', 'pending_price_confirmation', 'pending_payment', 'pending', 'confirmed'].includes(order.value?.status) && Number(order.value?.reschedule_count || 0) < Number(order.value?.reschedule_limit || 2))
const canShowCode = computed(() => order.value?.payment_status === 'paid' && ['pending', 'confirmed'].includes(order.value?.status))
const verification = ref({ visible: false, url: '', expiresAt: '', orderNo: '' })
const confirming = ref(false)
const paymentStatusText = computed(() => ({ unpaid: '待支付', partial_paid: '待补款', paid: '已支付', refund_pending: '退款处理中', partial_refunded: '部分退款', refunded: '已退款' }[order.value?.payment_status] || '待支付'))

const loadOrder = async () => {
  try {
    const result = await getServiceOrder(orderId.value)
    order.value = result.data?.order || null
  } catch (error) {
    uni.showToast({ title: error.msg || '订单读取失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const cancelOrder = () => {
  uni.showModal({
    title: '取消预约',
    content: '确认取消这笔汽车服务预约吗？',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        const result = await cancelServiceOrder(orderId.value)
        uni.showToast({ title: result.msg || '预约已取消', icon: 'none' })
        await loadOrder()
      } catch (error) {
        uni.showToast({ title: error.msg || '取消失败', icon: 'none' })
      }
    }
  })
}
const confirmQuote = async () => { if (confirming.value) return; confirming.value=true; try { const result=await confirmServiceQuote(orderId.value); uni.showToast({title:result.msg||'价格已确认',icon:'success'}); await loadOrder() } catch (error) { uni.showToast({title:error.msg||'确认失败',icon:'none'}) } finally { confirming.value=false } }
const writeReview = () => uni.navigateTo({ url: `/pages/order/review?type=service&id=${orderId.value}` })
const payOrder = () => uni.navigateTo({ url: `/pages/order/service-payment?id=${orderId.value}` })
const reschedule = () => uni.navigateTo({ url: `/pages/order/service-reschedule?id=${orderId.value}` })
const showVerificationCode = async () => {
  try { const result = await getServiceVerificationCode(orderId.value); verification.value = { visible: true, url: result.data?.qr_image || '', expiresAt: result.data?.expires_at || '', orderNo: result.data?.order_no || order.value?.order_no || '' } }
  catch (error) { uni.showToast({ title: error.msg || '核销码生成失败', icon: 'none' }) }
}
const followUpReview = () => uni.navigateTo({ url: `/pages/order/review-followup?id=${order.value.review.id}` })
const preview = (urls) => uni.previewImage({ urls, current: urls[0] })

onLoad(({ id }) => {
  orderId.value = Number(id)
  loadOrder()
})
onShow(() => { if (orderId.value && !loading.value) loadOrder() })
</script>

<style scoped>
.page { min-height: 100vh; padding: 24rpx 32rpx 60rpx; }
.status-card, .section { margin-bottom: 18rpx; padding: 26rpx; border-radius: 8rpx; background: #fff; }
.status-card { display: flex; flex-direction: column; }.status-label { color: #6b7280; font-size: 23rpx; }.status-value { margin-top: 10rpx; color: #1677ff; font-size: 38rpx; font-weight: 700; }.status-no { margin-top: 12rpx; color: #9ca3af; font-size: 22rpx; }
.section-title { display: block; margin-bottom: 18rpx; color: #1f2937; font-size: 29rpx; font-weight: 700; }.info-row { display: flex; justify-content: space-between; gap: 24rpx; padding: 12rpx 0; color: #6b7280; font-size: 24rpx; }.info-row text:last-child { color: #374151; text-align: right; }.info-row.discount text:last-child{color:#0f8e69}.info-row.total { color: #1f2937; font-size: 28rpx; font-weight: 700; }.info-row.total text:last-child,.quote-amount { color: #f97316; }.section-note { display: block; margin-top: 12rpx; color: #9ca3af; font-size: 22rpx; line-height: 1.5; }.quote-section{border:1rpx solid #fed7aa;background:#fffaf5}.quote-reason{margin-top:10rpx;padding:14rpx;border-radius:6rpx;background:#fff;color:#9a5a20;font-size:23rpx;line-height:1.5}.confirm-quote{width:100%;margin-top:20rpx;border-radius:8rpx;background:#f97316;color:#fff;font-size:27rpx}
.record-card { margin-top: 14rpx; padding: 18rpx; border-radius: 6rpx; background: #f8fafc; }.record-head { display: flex; justify-content: space-between; color: #374151; font-size: 23rpx; }.record-status { color: #1677ff; }.record-time, .record-note { display: block; margin-top: 8rpx; color: #6b7280; font-size: 22rpx; }.review-score{color:#0f8e69}.review-tags{display:flex;flex-wrap:wrap;gap:10rpx;margin-top:12rpx}.review-tags text{padding:6rpx 12rpx;border-radius:4rpx;background:#eef6ff;color:#1677ff;font-size:20rpx}.review-content{display:block;margin-top:12rpx;color:#475569;font-size:23rpx;line-height:1.5}.image-list{display:grid;grid-template-columns:repeat(3,1fr);gap:10rpx;margin-top:14rpx}.image-list image{width:100%;height:150rpx;border-radius:6rpx}.merchant-reply{display:flex;flex-direction:column;gap:7rpx;margin-top:16rpx;padding:16rpx;border-radius:6rpx;background:#f8fafc;color:#475569;font-size:22rpx}.merchant-reply text:first-child{color:#1f2937;font-weight:600}.review-button{width:100%;margin-top:16rpx;border-radius:8rpx;background:#1677ff;color:#fff;font-size:27rpx}.action-section{display:flex;gap:16rpx;padding:12rpx 0}.pay-button,.reschedule-button,.cancel-button{flex:1;border-radius:8rpx;font-size:25rpx}.pay-button{background:#1677ff;color:#fff}.reschedule-button{border:1rpx solid #93c5fd;background:#fff;color:#1677ff}.cancel-button{border:1rpx solid #fecaca;background:#fff;color:#dc2626}.empty-state { padding: 160rpx 24rpx; color: #9ca3af; text-align: center; font-size: 26rpx; }
.code-button{width:100%;margin-top:20rpx;border-radius:8rpx;background:#1677ff;color:#fff;font-size:27rpx}.reschedule-note{display:block;margin-top:2rpx;color:#94a3b8;font-size:21rpx;text-align:center}.code-mask{position:fixed;z-index:99;inset:0;display:flex;align-items:center;justify-content:center;padding:44rpx;background:rgba(15,23,42,.58)}.code-panel{display:flex;box-sizing:border-box;width:100%;max-width:580rpx;flex-direction:column;align-items:center;padding:34rpx;border-radius:10rpx;background:#fff}.code-title{color:#1f2937;font-size:32rpx;font-weight:700}.code-panel image{width:420rpx;height:420rpx;margin:20rpx 0}.code-no,.code-tip{color:#64748b;font-size:22rpx}.code-tip{margin-top:10rpx}.code-panel button{width:100%;margin-top:24rpx;border-radius:8rpx;background:#f1f5f9;color:#475569;font-size:26rpx}
</style>
