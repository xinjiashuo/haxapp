<template>
  <view class="page">
    <view class="intro"><text class="intro-title">评价订单</text><text class="intro-note">您的反馈将帮助门店持续改进服务。</text></view>
    <view class="card">
      <view class="rating-row"><text>整体体验</text><view class="stars"><text v-for="n in 5" :key="n" :class="['star', { active: overallRating >= n }]" @click="overallRating = n">★</text></view></view>
      <template v-if="orderType === 'rental'"><view class="rating-row"><text>车辆状况</text><view class="stars"><text v-for="n in 5" :key="n" :class="['star', { active: vehicleRating >= n }]" @click="vehicleRating = n">★</text></view></view><view class="rating-row"><text>交接服务</text><view class="stars"><text v-for="n in 5" :key="n" :class="['star', { active: handoverRating >= n }]" @click="handoverRating = n">★</text></view></view></template>
      <view v-else class="rating-row"><text>服务质量</text><view class="stars"><text v-for="n in 5" :key="n" :class="['star', { active: serviceRating >= n }]" @click="serviceRating = n">★</text></view></view>
      <view class="rating-row"><text>价格透明</text><view class="stars"><text v-for="n in 5" :key="n" :class="['star', { active: priceRating >= n }]" @click="priceRating = n">★</text></view></view>
      <view class="rating-row"><text>服务效率</text><view class="stars"><text v-for="n in 5" :key="n" :class="['star', { active: efficiencyRating >= n }]" @click="efficiencyRating = n">★</text></view></view>
    </view>
    <view class="card"><text class="section-title">服务印象</text><view class="tag-list"><text v-for="tag in availableTags" :key="tag" :class="['tag', { selected: selectedTags.includes(tag) }]" @click="toggleTag(tag)">{{ tag }}</text></view></view>
    <view class="card"><textarea v-model.trim="content" class="content-input" maxlength="500" placeholder="写下真实感受，最多500字" /><text class="counter">{{ content.length }}/500</text><view class="image-list"><view v-for="(image, index) in images" :key="image" class="image-item"><image :src="image" mode="aspectFill"/><text class="remove" @click="images.splice(index, 1)">×</text></view><view v-if="images.length < 9" class="image-add" @click="chooseImage">+</view></view></view>
    <button class="submit-button" :loading="submitting" @click="submit">提交评价</button>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createOrderReview, uploadOrderReviewImage } from '../../api/review'

const orderType = ref('rental')
const orderId = ref(0)
const overallRating = ref(0)
const vehicleRating = ref(0)
const handoverRating = ref(0)
const serviceRating = ref(0)
const priceRating = ref(0)
const efficiencyRating = ref(0)
const selectedTags = ref([])
const content = ref('')
const images = ref([])
const submitting = ref(false)
const availableTags = computed(() => orderType.value === 'rental'
  ? ['车辆整洁', '车况良好', '交接高效', '客服耐心', '价格透明', '下次还会选择']
  : ['服务专业', '施工细致', '价格透明', '沟通顺畅', '门店整洁', '值得推荐'])

const toggleTag = (tag) => { const index = selectedTags.value.indexOf(tag); index >= 0 ? selectedTags.value.splice(index, 1) : selectedTags.value.length < 8 && selectedTags.value.push(tag) }
const chooseImage = () => uni.chooseImage({ count: 9 - images.value.length, sizeType: ['compressed'], success: async ({ tempFilePaths }) => { uni.showLoading({ title: '上传中' }); try { for (const filePath of tempFilePaths) { const url = await uploadOrderReviewImage(filePath); if (url) images.value.push(url) } } catch (error) { uni.showToast({ title: error.msg || '图片上传失败', icon: 'none' }) } finally { uni.hideLoading() } } })
const submit = async () => {
  if (!overallRating.value || !priceRating.value || !efficiencyRating.value || (orderType.value === 'rental' && (!vehicleRating.value || !handoverRating.value)) || (orderType.value === 'service' && !serviceRating.value)) { uni.showToast({ title: '请完成所有评分', icon: 'none' }); return }
  submitting.value = true
  try {
    await createOrderReview({ order_type: orderType.value, order_id: orderId.value, overall_rating: overallRating.value, vehicle_rating: vehicleRating.value, handover_rating: handoverRating.value, service_rating: serviceRating.value, price_rating: priceRating.value, efficiency_rating: efficiencyRating.value, tags: JSON.stringify(selectedTags.value), content: content.value, images: JSON.stringify(images.value) })
    uni.showToast({ title: '评价提交成功', icon: 'success' }); setTimeout(() => uni.navigateBack(), 800)
  } catch (error) { uni.showToast({ title: error.msg || '评价提交失败', icon: 'none' }) } finally { submitting.value = false }
}
onLoad(({ type, id }) => { orderType.value = type === 'service' ? 'service' : 'rental'; orderId.value = Number(id) })
</script>

<style scoped>
.page{min-height:100vh;padding:24rpx 32rpx calc(56rpx + env(safe-area-inset-bottom))}.intro{margin-bottom:20rpx}.intro-title,.intro-note{display:block}.intro-title{color:#1f2937;font-size:38rpx;font-weight:700}.intro-note{margin-top:8rpx;color:#6b7280;font-size:24rpx}.card{margin-bottom:18rpx;padding:26rpx;border-radius:8rpx;background:#fff}.rating-row{display:flex;align-items:center;justify-content:space-between;padding:16rpx 0;color:#374151;font-size:28rpx}.rating-row+.rating-row{border-top:1rpx solid #eef0f4}.stars{display:flex;gap:9rpx}.star{color:#d1d5db;font-size:43rpx;line-height:1}.star.active{color:#f59e0b}.section-title{display:block;margin-bottom:20rpx;color:#1f2937;font-size:28rpx;font-weight:600}.tag-list{display:flex;flex-wrap:wrap;gap:14rpx}.tag{padding:11rpx 18rpx;border:1rpx solid #dbe2ea;border-radius:6rpx;color:#64748b;font-size:23rpx}.tag.selected{border-color:#1677ff;background:#eef6ff;color:#1677ff}.content-input{box-sizing:border-box;width:100%;height:220rpx;color:#374151;font-size:27rpx;line-height:1.6}.counter{display:block;color:#9ca3af;font-size:21rpx;text-align:right}.image-list{display:flex;flex-wrap:wrap;gap:14rpx;margin-top:16rpx}.image-item,.image-add{position:relative;display:flex;align-items:center;justify-content:center;width:142rpx;height:142rpx;overflow:hidden;border-radius:6rpx}.image-item image{width:100%;height:100%}.image-add{border:1rpx dashed #9ca3af;color:#6b7280;font-size:52rpx}.remove{position:absolute;top:6rpx;right:6rpx;display:flex;align-items:center;justify-content:center;width:34rpx;height:34rpx;border-radius:50%;background:rgba(31,41,55,.7);color:#fff;font-size:24rpx}.submit-button{margin-top:28rpx;border-radius:6rpx;background:#1677ff;color:#fff;font-size:30rpx}
</style>
