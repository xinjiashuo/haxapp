<template>
  <view class="page">
    <view class="page-head">
      <text class="page-title">驾驶人认证</text>
      <text class="page-subtitle">完成认证并审核通过后即可在线预订车辆</text>
    </view>

    <view class="status-card" :class="statusClass">
      <view class="status-icon">{{ status === 'approved' ? '✓' : status === 'pending' ? '…' : '!' }}</view>
      <view class="status-info">
        <text class="status-title">{{ statusTitle }}</text>
        <text class="status-desc">{{ statusDescription }}</text>
      </view>
    </view>

    <view v-if="status === 'rejected' && user?.certification?.reject_reason" class="reject-card">
      <text class="reject-title">未通过原因</text>
      <text class="reject-content">{{ user.certification.reject_reason }}</text>
    </view>

    <view v-if="canSubmit" class="form-card">
      <view class="section-title">身份信息</view>
      <view class="field-row">
        <text class="field-label">真实姓名</text>
        <input v-model.trim="form.real_name" class="field-input" maxlength="50" placeholder="请输入真实姓名" />
      </view>
      <view class="field-row">
        <text class="field-label">身份证号</text>
        <input v-model.trim="form.id_card_no" class="field-input" maxlength="18" placeholder="请输入身份证号码" />
      </view>

      <view class="upload-section">
        <view class="upload-head"><text class="field-label">身份证照片</text><text class="upload-tip">请上传正反面</text></view>
        <view class="image-list">
          <view v-for="(image, index) in idCardImages" :key="image.path" class="image-item">
            <image :src="image.url" mode="aspectFill" @click="previewImages(idCardImages, index)" />
            <text class="remove-image" @click="removeImage(idCardImages, index)">×</text>
          </view>
          <view v-if="idCardImages.length < 2" class="upload-button" @click="chooseImages('idCard')">
            <text class="upload-plus">+</text><text>上传图片</text>
          </view>
        </view>
      </view>

      <view class="section-title driver-title">驾驶证信息</view>
      <view class="field-row">
        <text class="field-label">驾驶证号</text>
        <input v-model.trim="form.driver_license_no" class="field-input" maxlength="32" placeholder="请输入驾驶证号" />
      </view>
      <view class="field-row">
        <text class="field-label">准驾车型</text>
        <picker mode="selector" :range="licenseClasses" :value="licenseClassIndex" @change="changeLicenseClass">
          <view class="picker-value">{{ form.driver_license_class || '请选择准驾车型' }}<text class="picker-arrow">›</text></view>
        </picker>
      </view>
      <view class="field-row">
        <text class="field-label">有效期开始</text>
        <picker mode="date" :value="form.driver_license_valid_from" start="2000-01-01" @change="changeValidFrom">
          <view class="picker-value">{{ form.driver_license_valid_from || '请选择日期' }}<text class="picker-arrow">›</text></view>
        </picker>
      </view>
      <view class="field-row">
        <text class="field-label">有效期结束</text>
        <picker mode="date" :value="form.driver_license_valid_to" start="2000-01-01" @change="changeValidTo">
          <view class="picker-value">{{ form.driver_license_valid_to || '请选择日期' }}<text class="picker-arrow">›</text></view>
        </picker>
      </view>

      <view class="upload-section">
        <view class="upload-head"><text class="field-label">驾驶证照片</text><text class="upload-tip">请上传证件照片</text></view>
        <view class="image-list">
          <view v-for="(image, index) in driverLicenseImages" :key="image.path" class="image-item">
            <image :src="image.url" mode="aspectFill" @click="previewImages(driverLicenseImages, index)" />
            <text class="remove-image" @click="removeImage(driverLicenseImages, index)">×</text>
          </view>
          <view v-if="driverLicenseImages.length < 2" class="upload-button" @click="chooseImages('driverLicense')">
            <text class="upload-plus">+</text><text>上传图片</text>
          </view>
        </view>
      </view>

      <view class="notice">提交后将由后台工作人员审核，认证通过后才能在线创建租车订单。</view>
      <button class="submit-button" :loading="submitting" @click="submit">提交认证</button>
    </view>

    <view v-else-if="status === 'approved'" class="approved-card">
      <text>认证信息已审核通过，可以在线预订车辆。</text>
      <text v-if="user?.certification?.driver_license_class" class="approved-meta">准驾车型：{{ user.certification.driver_license_class }}</text>
    </view>

    <view v-else class="pending-card">
      <text>认证资料已提交，请等待后台审核。</text>
      <text class="pending-meta">审核通过后即可返回租车页面下单。</text>
    </view>

  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getProfile, submitCertification, uploadCertificationImage } from '../../api/auth'
import { clearSession, getToken, getUser, saveUser } from '../../utils/user-session'

const user = ref(getUser())
const submitting = ref(false)
const idCardImages = ref([])
const driverLicenseImages = ref([])
const licenseClasses = ['C1', 'C2', 'C3', 'C4', 'A1', 'A2', 'B1', 'B2', 'D', 'E', 'F']
const form = reactive({
  real_name: '',
  id_card_no: '',
  driver_license_no: '',
  driver_license_class: 'C1',
  driver_license_valid_from: '',
  driver_license_valid_to: ''
})

const status = computed(() => user.value?.certification?.status || 'unverified')
const canSubmit = computed(() => ['unverified', 'rejected', 'expired'].includes(status.value))
const statusClass = computed(() => `status-${status.value}`)
const statusTitle = computed(() => ({
  approved: '认证已通过',
  pending: '审核中',
  rejected: '认证未通过',
  expired: '认证已过期',
  unverified: '尚未认证'
}[status.value] || '尚未认证'))
const statusDescription = computed(() => ({
  approved: '当前账号可以在线预订车辆',
  pending: '后台正在审核认证资料',
  rejected: '请根据未通过原因修改后重新提交',
  expired: '请更新驾驶证资料后重新提交',
  unverified: '请填写并提交认证资料'
}[status.value] || '请填写并提交认证资料'))
const licenseClassIndex = computed(() => Math.max(0, licenseClasses.indexOf(form.driver_license_class)))

const loadProfile = async () => {
  if (!getToken()) {
    uni.navigateTo({ url: '/pages/login/index' })
    return
  }
  try {
    const result = await getProfile()
    user.value = result.data.user
    saveUser(user.value)
  } catch (error) {
    clearSession()
    user.value = null
    uni.navigateTo({ url: '/pages/login/index' })
  }
}

const chooseImages = (type) => {
  const images = type === 'idCard' ? idCardImages : driverLicenseImages
  const count = Math.max(1, 2 - images.value.length)
  uni.chooseImage({
    count,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async ({ tempFilePaths }) => {
      uni.showLoading({ title: '上传中' })
      try {
        for (const filePath of tempFilePaths) {
          const result = await uploadCertificationImage(filePath)
          if (result?.url) images.value.push({ path: result.url, url: result.absolute_url || result.static_url || result.url })
        }
      } catch (error) {
        uni.showToast({ title: error.msg || '图片上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const removeImage = (images, index) => images.splice(index, 1)
const previewImages = (images, index) => uni.previewImage({ urls: images.map((image) => image.url), current: images[index].url })
const changeLicenseClass = ({ detail }) => { form.driver_license_class = licenseClasses[Number(detail.value)] }
const changeValidFrom = ({ detail }) => { form.driver_license_valid_from = detail.value }
const changeValidTo = ({ detail }) => { form.driver_license_valid_to = detail.value }

const submit = async () => {
  if (submitting.value) return
  if (!form.real_name || !form.id_card_no || !form.driver_license_no || !form.driver_license_class || !form.driver_license_valid_from || !form.driver_license_valid_to) {
    uni.showToast({ title: '请完整填写认证信息', icon: 'none' })
    return
  }
  if (!idCardImages.value.length || !driverLicenseImages.value.length) {
    uni.showToast({ title: '请上传身份证和驾驶证照片', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const result = await submitCertification({
      ...form,
      id_card_images: JSON.stringify(idCardImages.value.map((image) => image.path)),
      driver_license_images: JSON.stringify(driverLicenseImages.value.map((image) => image.path))
    })
    user.value = result.data.user
    saveUser(user.value)
    uni.showModal({
      title: '提交成功',
      content: '认证资料已提交，请等待后台审核。',
      showCancel: false,
      success: () => uni.navigateBack()
    })
  } catch (error) {
    if (error.code === 401) {
      uni.navigateTo({ url: '/pages/login/index' })
      return
    }
    uni.showToast({ title: error.msg || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onShow(loadProfile)
</script>

<style scoped>
.page { min-height: 100vh; padding: 32rpx 32rpx 48rpx; box-sizing: border-box; }
.page-head { padding: 16rpx 0 26rpx; }
.page-title { display: block; color: #111827; font-size: 40rpx; font-weight: 700; }
.page-subtitle { display: block; margin-top: 10rpx; color: #6b7280; font-size: 24rpx; }
.status-card, .form-card, .reject-card, .approved-card, .pending-card { border-radius: 8rpx; background: #fff; }
.status-card { display: flex; align-items: center; gap: 20rpx; padding: 24rpx; border-left: 8rpx solid #1677ff; }
.status-card.status-approved { border-left-color: #12b886; }.status-card.status-pending { border-left-color: #f59e0b; }.status-card.status-rejected, .status-card.status-expired { border-left-color: #ef4444; }
.status-icon { display: flex; flex: 0 0 58rpx; align-items: center; justify-content: center; width: 58rpx; height: 58rpx; border-radius: 50%; background: #e8f1ff; color: #1677ff; font-size: 34rpx; font-weight: 700; }
.status-approved .status-icon { background: #e6f8f2; color: #0f8e69; }.status-pending .status-icon { background: #fff7df; color: #d97706; }.status-rejected .status-icon, .status-expired .status-icon { background: #fff0f0; color: #dc2626; }
.status-info { display: flex; flex: 1; flex-direction: column; }.status-title { color: #1f2937; font-size: 30rpx; font-weight: 700; }.status-desc { margin-top: 8rpx; color: #6b7280; font-size: 23rpx; }
.reject-card { margin-top: 18rpx; padding: 22rpx; background: #fff7f7; }.reject-title { display: block; color: #b91c1c; font-size: 26rpx; font-weight: 700; }.reject-content { display: block; margin-top: 10rpx; color: #7f1d1d; font-size: 24rpx; line-height: 1.55; }
.form-card { margin-top: 18rpx; padding: 26rpx 24rpx; }.section-title { padding-bottom: 8rpx; color: #111827; font-size: 30rpx; font-weight: 700; }.driver-title { margin-top: 26rpx; }
.field-row { display: flex; align-items: center; min-height: 92rpx; border-bottom: 1rpx solid #eef0f4; }.field-label { flex: 0 0 180rpx; color: #374151; font-size: 26rpx; }.field-input { flex: 1; height: 84rpx; color: #111827; font-size: 26rpx; text-align: right; }.field-input::placeholder { color: #9ca3af; }
.picker-value { display: flex; align-items: center; justify-content: flex-end; min-width: 300rpx; color: #111827; font-size: 26rpx; }.picker-arrow { margin-left: 12rpx; color: #9ca3af; font-size: 36rpx; line-height: 1; }
.upload-section { padding-top: 24rpx; }.upload-head { display: flex; align-items: baseline; justify-content: space-between; }.upload-tip { color: #9ca3af; font-size: 22rpx; }.image-list { display: flex; flex-wrap: wrap; gap: 16rpx; margin-top: 16rpx; }.image-item, .upload-button { position: relative; width: 196rpx; height: 156rpx; border-radius: 6rpx; overflow: hidden; }.image-item image { width: 100%; height: 100%; }.remove-image { position: absolute; top: 6rpx; right: 8rpx; display: flex; align-items: center; justify-content: center; width: 36rpx; height: 36rpx; border-radius: 50%; background: rgba(17, 24, 39, .7); color: #fff; font-size: 28rpx; }.upload-button { display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1rpx dashed #cbd5e1; background: #f8fafc; color: #6b7280; font-size: 22rpx; }.upload-plus { color: #1677ff; font-size: 48rpx; font-weight: 300; line-height: 52rpx; }
.notice { margin-top: 24rpx; color: #8a94a6; font-size: 22rpx; line-height: 1.6; }.submit-button { margin-top: 22rpx; border-radius: 8rpx; background: #1677ff; color: #fff; font-size: 29rpx; line-height: 84rpx; }.approved-card, .pending-card { display: flex; flex-direction: column; margin-top: 18rpx; padding: 28rpx 24rpx; color: #374151; font-size: 26rpx; line-height: 1.6; }.approved-meta, .pending-meta { margin-top: 10rpx; color: #6b7280; font-size: 23rpx; }
</style>
