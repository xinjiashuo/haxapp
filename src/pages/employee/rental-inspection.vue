<template>
  <view class="page">
    <view class="head">
      <text class="title">{{ type === 'pickup' ? '交车验车' : '还车验车' }}</text>
      <text>{{ name }} · {{ plate }}</text>
    </view>

    <view class="card">
      <text class="section-title">车辆读数</text>
      <text class="label">当前里程</text>
      <input v-model="form.mileage" type="number" placeholder="请输入公里数" />
      <text class="label">油量/电量（%）</text>
      <input v-model="form.energy_level" type="digit" placeholder="例如 80" />
      <view class="handover-checks">
        <view class="check-item" :class="{ checked: form.has_license }" @click="form.has_license = !form.has_license"><text class="check-mark">{{ form.has_license ? '✓' : '' }}</text><text>行驶证已核对</text></view>
        <view class="check-item" :class="{ checked: form.has_key }" @click="form.has_key = !form.has_key"><text class="check-mark">{{ form.has_key ? '✓' : '' }}</text><text>车辆钥匙已交接</text></view>
      </view>

      <view class="section-head">
        <text class="section-title">必拍验车项</text>
        <text class="required-text">每项至少一张</text>
      </view>
      <view class="required-grid">
        <view v-for="item in requiredScenes" :key="item.key" class="scene-card">
          <text class="scene-name"><text class="star">*</text>{{ item.label }}</text>
          <text class="scene-note">{{ item.note }}</text>
          <view v-if="requiredMedia[item.key]" class="photo-wrap">
            <image :src="requiredMedia[item.key].url" mode="aspectFill" @click="previewImage(requiredMedia[item.key].url)" />
            <view class="remove" @click.stop="removeRequired(item.key)">×</view>
          </view>
          <view v-else class="photo-placeholder" @click="chooseRequired(item)">
            <text class="camera">+</text>
            <text>拍摄照片</text>
          </view>
          <view v-if="requiredMedia[item.key]" class="retake" @click="chooseRequired(item)">重新拍摄</view>
        </view>
      </view>

      <text class="label">验车说明</text>
      <textarea v-model="form.remark" placeholder="记录车况、随车物品或异常情况" maxlength="1000" />
      <template v-if="type === 'return'">
        <view class="section-head fee-head"><text class="section-title">需补收费用（可选）</text><text class="add-fee" @click="addFee">添加费用</text></view>
        <view v-for="(fee, index) in form.fees" :key="index" class="fee-card">
          <picker class="fee-category-picker" :range="feeCategories" range-key="label" :value="fee.category_index" @change="selectFeeCategory(index, $event)"><view class="fee-category-value">{{ fee.category_label || '请选择费用分类' }}</view></picker>
          <text v-if="fee.price_hint" class="fee-price-hint">收费规则：{{ fee.price_hint }}{{ fee.suggested_amount !== null ? `，已带入 ¥${fee.suggested_amount}` : '' }}</text>
          <input v-model="fee.fee_name" placeholder="费用名称，可补充具体说明" />
          <input v-model="fee.fee_amount" type="digit" placeholder="费用金额" />
          <input v-model="fee.fee_remark" placeholder="费用说明（可选）" />
          <text class="remove-fee" @click="removeFee(index)">删除本项</text>
        </view>
      </template>

      <view class="section-head other-head">
        <text class="section-title">其他补充</text>
        <text class="optional-text">可上传其他位置照片或现场视频</text>
      </view>
      <view class="other-media">
        <view v-for="(item, index) in otherMedia" :key="item.url" class="other-item">
          <image v-if="item.media_type === 'image'" :src="item.url" mode="aspectFill" @click="previewImage(item.url)" />
          <view v-else class="video-item" @click="previewVideo(item.url)"><text>视频</text></view>
          <view class="remove" @click.stop="otherMedia.splice(index, 1)">×</view>
        </view>
        <view v-if="otherMedia.length < 12" class="other-add" @click="chooseOther">
          <text class="camera">+</text>
          <text>添加</text>
        </view>
      </view>
    </view>

    <button class="submit" :loading="submitting" @click="submit">确认{{ type === 'pickup' ? '交车' : '还车' }}</button>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getEmployeeExtraFeeCategories, submitRentalInspection, uploadEmployeeMedia } from '../../api/employee'

const requiredScenes = [
  { key: 'dashboard', label: '仪表盘', note: '里程、油量/电量清晰可见' },
  { key: 'left_front_wheel', label: '左前轮胎/轮毂', note: '拍清轮胎与轮毂状态' },
  { key: 'right_front_wheel', label: '右前轮胎/轮毂', note: '拍清轮胎与轮毂状态' },
  { key: 'left_rear_wheel', label: '左后轮胎/轮毂', note: '拍清轮胎与轮毂状态' },
  { key: 'right_rear_wheel', label: '右后轮胎/轮毂', note: '拍清轮胎与轮毂状态' },
  { key: 'front_windshield', label: '前挡风玻璃', note: '检查裂痕、破损和划痕' },
  { key: 'rear_windshield', label: '后挡风玻璃', note: '检查裂痕、破损和划痕' },
  { key: 'vulnerable_parts', label: '易损件', note: '灯具、雨刮、钥匙或明显易损处' },
]

const id = ref(0)
const type = ref('pickup')
const name = ref('')
const plate = ref('')
const submitting = ref(false)
const requiredMedia = reactive({})
const otherMedia = ref([])
const feeCategories = ref([])
const form = ref({ mileage: '', energy_level: '', remark: '', has_license: true, has_key: true, fees: [] })
const inspectionMedia = computed(() => [
  ...requiredScenes.filter((item) => requiredMedia[item.key]).map((item) => requiredMedia[item.key]),
  ...otherMedia.value,
])

onLoad((query) => {
  id.value = Number(query.id)
  type.value = query.type === 'return' ? 'return' : 'pickup'
  name.value = decodeURIComponent(query.name || '')
  plate.value = decodeURIComponent(query.plate || '')
  if (type.value === 'return') loadFeeCategories()
})

const loadFeeCategories = async () => {
  try {
    const result = await getEmployeeExtraFeeCategories()
    feeCategories.value = Array.isArray(result.data) ? result.data : []
  } catch (error) {
    uni.showToast({ title: error.msg || '费用分类读取失败', icon: 'none' })
  }
}

const selectFeeCategory = (feeIndex, event) => {
  const index = Number(event.detail.value)
  const category = feeCategories.value[index]
  const fee = form.value.fees[feeIndex]
  if (!fee) return
  fee.category_index = index
  fee.fee_category_id = category?.id || ''
  fee.category_label = category?.label || ''
  fee.price_hint = category?.price_hint || ''
  fee.suggested_amount = category?.suggested_amount ?? null
  if (category?.suggested_amount !== null && category?.suggested_amount !== undefined) fee.fee_amount = category.suggested_amount
}

const addFee = () => {
  if (form.value.fees.length >= 5) return uni.showToast({ title: '一次最多添加5项费用', icon: 'none' })
  form.value.fees.push({ fee_category_id: '', fee_name: '', fee_amount: '', fee_remark: '', category_index: -1, category_label: '', price_hint: '', suggested_amount: null })
}
const removeFee = (index) => form.value.fees.splice(index, 1)

const uploadFiles = async (files, scene) => {
  uni.showLoading({ title: '上传中', mask: true })
  try {
    const uploaded = []
    for (const file of files) {
      const result = await uploadEmployeeMedia(file.tempFilePath)
      uploaded.push({
        url: result.url,
        media_type: file.fileType === 'video' ? 'video' : 'image',
        scene,
      })
    }
    return uploaded
  } catch (error) {
    uni.showToast({ title: error.msg || '上传失败', icon: 'none' })
    return []
  } finally {
    uni.hideLoading()
  }
}

const chooseRequired = (item) => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera'],
    success: async ({ tempFilePaths }) => {
      const uploaded = await uploadFiles(tempFilePaths.map((tempFilePath) => ({ tempFilePath, fileType: 'image' })), item.key)
      if (uploaded[0]) requiredMedia[item.key] = uploaded[0]
    },
  })
}

const chooseOther = () => {
  uni.chooseMedia({
    count: Math.max(1, 12 - otherMedia.value.length),
    mediaType: ['image', 'video'],
    success: async ({ tempFiles }) => {
      const uploaded = await uploadFiles(tempFiles, 'other')
      otherMedia.value.push(...uploaded)
    },
  })
}

const removeRequired = (key) => { delete requiredMedia[key] }
const previewImage = (url) => uni.previewImage({ urls: [url], current: url })
const previewVideo = (url) => uni.previewMedia({ sources: [{ url, type: 'video' }] })

const submit = async () => {
  if (!form.value.mileage) return uni.showToast({ title: '请填写当前里程', icon: 'none' })
  if (form.value.energy_level === '') return uni.showToast({ title: '请填写当前油量或电量', icon: 'none' })
  const missing = requiredScenes.find((item) => !requiredMedia[item.key])
  if (missing) return uni.showToast({ title: `请拍摄${missing.label}`, icon: 'none' })
  if (type.value === 'return') {
    const invalidFee = form.value.fees.find((fee) => !fee.fee_category_id || !fee.fee_amount)
    if (invalidFee) return uni.showToast({ title: '请补全费用分类和金额', icon: 'none' })
  }
  submitting.value = true
  try {
    await submitRentalInspection(id.value, {
      inspection_type: type.value,
      ...form.value,
      has_license: form.value.has_license ? 1 : 0,
      has_key: form.value.has_key ? 1 : 0,
      media: inspectionMedia.value,
    })
    uni.showToast({ title: type.value === 'pickup' ? '已提交，等待用户确认' : '已提交还车验车，等待用户确认', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch (error) {
    uni.showToast({ title: error.msg || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; box-sizing: border-box; padding: 24rpx 28rpx 104rpx; background: #f5f7fa; }
.head, .card { padding: 28rpx; border-radius: 8rpx; background: #fff; }
.head { display: flex; flex-direction: column; gap: 12rpx; color: #64748b; font-size: 24rpx; }
.title { color: #1f2937; font-size: 36rpx; font-weight: 700; }
.card { margin-top: 20rpx; }
.section-title { color: #1f2937; font-size: 29rpx; font-weight: 700; }
.section-head { display: flex; align-items: center; justify-content: space-between; margin-top: 36rpx; }
.required-text { color: #e8594f; font-size: 22rpx; }
.optional-text { color: #94a3b8; font-size: 22rpx; }
.label { display: block; margin-top: 24rpx; color: #374151; font-size: 25rpx; font-weight: 600; }
.handover-checks { display: flex; flex-wrap: wrap; gap: 16rpx; margin-top: 18rpx; }
.check-item { display: flex; align-items: center; gap: 8rpx; color: #64748b; font-size: 23rpx; }
.check-mark { display: flex; align-items: center; justify-content: center; width: 28rpx; height: 28rpx; border: 1rpx solid #94a3b8; border-radius: 50%; color: #fff; font-size: 20rpx; }
.check-item.checked { color: #0f8e69; }.check-item.checked .check-mark { border-color: #0f8e69; background: #0f8e69; }
input, textarea { box-sizing: border-box; width: 100%; margin-top: 12rpx; padding: 18rpx; border: 1rpx solid #dbe3ef; border-radius: 6rpx; background: #f8fafc; color: #1f2937; font-size: 26rpx; }
.fee-category-picker { box-sizing: border-box; width: 100%; margin-top: 12rpx; border: 1rpx solid #dbe3ef; border-radius: 6rpx; background: #f8fafc; }
.fee-category-value { position: relative; padding: 18rpx 52rpx 18rpx 18rpx; color: #475569; font-size: 26rpx; line-height: 38rpx; }
.fee-category-value::after { position: absolute; top: 50%; right: 20rpx; width: 12rpx; height: 12rpx; border-right: 3rpx solid #94a3b8; border-bottom: 3rpx solid #94a3b8; content: ''; transform: translateY(-70%) rotate(45deg); }
.fee-price-hint { display: block; margin-top: 8rpx; color: #9a6700; font-size: 22rpx; line-height: 1.5; }
.fee-head { margin-top: 32rpx; }.add-fee { color: #1677ff; font-size: 24rpx; }.fee-card { margin-top: 16rpx; padding: 16rpx; border: 1rpx solid #dbe3ef; border-radius: 8rpx; background: #fbfdff; }.fee-card input { background: #fff; }.remove-fee { display: block; margin-top: 14rpx; color: #dc2626; font-size: 22rpx; text-align: right; }
textarea { height: 150rpx; }
.required-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; margin-top: 18rpx; }
.scene-card { min-width: 0; padding: 16rpx; border: 1rpx solid #e2e8f0; border-radius: 8rpx; background: #fbfdff; }
.scene-name { display: block; overflow: hidden; color: #334155; font-size: 24rpx; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }
.star { margin-right: 5rpx; color: #e8594f; }
.scene-note { display: block; min-height: 56rpx; margin-top: 6rpx; color: #94a3b8; font-size: 20rpx; line-height: 28rpx; }
.photo-wrap, .photo-placeholder { position: relative; display: flex; align-items: center; justify-content: center; height: 176rpx; margin-top: 12rpx; overflow: hidden; border-radius: 6rpx; }
.photo-wrap image { width: 100%; height: 100%; }
.photo-placeholder { flex-direction: column; gap: 4rpx; border: 1rpx dashed #9bbbdc; background: #f3f8fe; color: #4b83b8; font-size: 22rpx; }
.camera { font-size: 42rpx; font-weight: 300; line-height: 40rpx; }
.retake { margin-top: 12rpx; color: #1677ff; font-size: 22rpx; text-align: center; }
.remove { position: absolute; top: 0; right: 0; z-index: 2; display: flex; align-items: center; justify-content: center; width: 38rpx; height: 38rpx; border-radius: 0 0 0 8rpx; background: rgba(15, 23, 42, .72); color: #fff; font-size: 30rpx; line-height: 1; }
.other-head { margin-top: 34rpx; }
.other-media { display: flex; flex-wrap: wrap; gap: 14rpx; margin-top: 16rpx; }
.other-item, .other-add { position: relative; display: flex; align-items: center; justify-content: center; width: 148rpx; height: 148rpx; overflow: hidden; border-radius: 6rpx; background: #eef2f7; }
.other-item image { width: 100%; height: 100%; }
.video-item { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #334155; color: #fff; font-size: 24rpx; }
.other-add { flex-direction: column; gap: 4rpx; border: 1rpx dashed #94a3b8; background: #fff; color: #1677ff; font-size: 22rpx; }
.submit { margin-top: 28rpx; border-radius: 8rpx; background: #1677ff; color: #fff; font-size: 30rpx; }
</style>
