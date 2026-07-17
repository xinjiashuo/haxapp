<template>
  <view class="page">
    <view class="notice">分享自己真实体验过的吃喝玩去处。内容会在审核通过后展示给其他用户。</view>
    <view class="form-card">
      <text class="field-label">推荐类型</text>
      <view class="type-tabs">
        <view v-for="item in types" :key="item.key" class="type-tab" :class="{ active: form.content_type === item.key }" @click="form.content_type = item.key">{{ item.name }}</view>
      </view>

      <text class="field-label">名称</text>
      <input v-model.trim="form.title" class="input" :placeholder="namePlaceholder" maxlength="150" />
      <text class="field-label">位置</text>
      <input v-model.trim="form.location" class="input" placeholder="所在区域、地址或导航关键词" maxlength="255" />
      <text class="field-label">{{ priceLabel }}</text>
      <input v-model.trim="priceValue" class="input" type="digit" :placeholder="pricePlaceholder" maxlength="20" />
      <text class="field-label">推荐理由</text>
      <textarea v-model.trim="form.content" class="textarea" placeholder="写下值得推荐的原因、体验和注意事项" maxlength="1000" />
      <text class="field-label">图片</text>
      <view class="image-list">
        <view v-for="(item, index) in images" :key="item" class="image-item">
          <image :src="item" mode="aspectFill" />
          <text class="remove" @click="removeImage(index)">x</text>
        </view>
        <view v-if="images.length < 6" class="image-add" @click="chooseImage">+</view>
      </view>
    </view>
    <button class="submit-btn" :loading="submitting" @click="submit">提交审核</button>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { submitRecommendation, uploadTravelImage } from '../../api/travel'

const types = [{ key: 'eat', name: '吃' }, { key: 'drink', name: '喝' }, { key: 'play', name: '玩' }]
const form = reactive({ content_type: 'eat', title: '', location: '', avg_price: '', ticket_price: '', content: '' })
const images = ref([])
const submitting = ref(false)

const namePlaceholder = computed(() => form.content_type === 'play' ? '例如：山顶观景台' : '例如：一家值得去的店')
const priceLabel = computed(() => form.content_type === 'play' ? '门票价格（选填）' : '人均消费（选填）')
const pricePlaceholder = computed(() => form.content_type === 'play' ? '例如：60' : '例如：80')
const priceValue = computed({
  get: () => form.content_type === 'play' ? form.ticket_price : form.avg_price,
  set: (value) => { if (form.content_type === 'play') form.ticket_price = value; else form.avg_price = value }
})

const chooseImage = () => {
  uni.chooseImage({
    count: 6 - images.value.length,
    sizeType: ['compressed'],
    success: async ({ tempFilePaths }) => {
      uni.showLoading({ title: '上传中' })
      try {
        for (const filePath of tempFilePaths) {
          const result = await uploadTravelImage(filePath)
          if (result.url) images.value.push(result.url)
        }
      } catch (error) {
        uni.showToast({ title: error.msg || '图片上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const removeImage = (index) => images.value.splice(index, 1)

const submit = async () => {
  if (!form.title || !form.content) {
    uni.showToast({ title: '请填写名称和推荐理由', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await submitRecommendation({ ...form, images: JSON.stringify(images.value) })
    uni.showToast({ title: '已提交审核', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 900)
  } catch (error) {
    uni.showToast({ title: error.msg || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; padding: 24rpx 32rpx 48rpx; }
.notice { margin-bottom: 20rpx; padding: 22rpx 24rpx; border-radius: 8rpx; background: #e6f8f2; color: #16735a; font-size: 24rpx; line-height: 1.7; }
.form-card { padding: 28rpx; border-radius: 8rpx; background: #fff; }
.field-label { display: block; margin: 28rpx 0 14rpx; color: #1f2937; font-size: 27rpx; font-weight: 600; }
.field-label:first-child { margin-top: 0; }
.type-tabs { display: flex; overflow: hidden; border: 1rpx solid #dce5e2; border-radius: 6rpx; }
.type-tab { flex: 1; padding: 19rpx 0; color: #6b7280; font-size: 28rpx; text-align: center; }
.type-tab.active { background: #12b886; color: #fff; }
.input, .textarea { box-sizing: border-box; width: 100%; border: 1rpx solid #e5e7eb; border-radius: 6rpx; background: #fff; color: #1f2937; font-size: 27rpx; }
.input { height: 84rpx; padding: 0 22rpx; }
.textarea { height: 188rpx; padding: 20rpx 22rpx; line-height: 1.5; }
.image-list { display: flex; flex-wrap: wrap; gap: 16rpx; }
.image-item, .image-add { position: relative; display: flex; align-items: center; justify-content: center; width: 142rpx; height: 142rpx; overflow: hidden; border-radius: 6rpx; }
.image-item image { width: 100%; height: 100%; }
.image-add { border: 1rpx dashed #9ca3af; color: #6b7280; font-size: 52rpx; }
.remove { position: absolute; top: 6rpx; right: 6rpx; display: flex; align-items: center; justify-content: center; width: 34rpx; height: 34rpx; border-radius: 50%; background: rgba(31, 41, 55, .7); color: #fff; font-size: 24rpx; }
.submit-btn { margin-top: 30rpx; border-radius: 6rpx; background: #12b886; color: #fff; font-size: 30rpx; }
</style>
