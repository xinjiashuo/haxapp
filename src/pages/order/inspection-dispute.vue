<template>
  <view class="page">
    <view class="notice">请说明验车单中与实际情况不符的内容，并补充现场照片或凭证。门店重新核对后会更新确认单。</view>
    <textarea v-model.trim="reason" class="reason" maxlength="1000" placeholder="例如：右侧车门原有划痕未在交车单中注明" />
    <text class="section-title">补充证据（最多 6 张）</text>
    <view class="image-grid"><view v-for="(image,index) in images" :key="image" class="image-box"><image :src="image" mode="aspectFill"/><text @click="remove(index)">×</text></view><view v-if="images.length < 6" class="add-image" @click="choose">+</view></view>
    <button class="submit" :loading="submitting" @click="submit">提交验车异议</button>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { disputeRentalInspection, uploadRentalEvidence } from '../../api/rental'
const id=ref(0),hash=ref(''),reason=ref(''),images=ref([]),submitting=ref(false)
onLoad(q=>{id.value=Number(q.id);hash.value=q.hash?decodeURIComponent(q.hash):''})
const choose=()=>uni.chooseImage({count:6-images.value.length,sizeType:['compressed'],success:({tempFilePaths})=>images.value.push(...tempFilePaths)})
const remove=index=>images.value.splice(index,1)
const submit=async()=>{if(!reason.value)return uni.showToast({title:'请填写验车异议原因',icon:'none'});submitting.value=true;try{uni.showLoading({title:'上传证据',mask:true});const evidence=[];for(const path of images.value)evidence.push(await uploadRentalEvidence(path));await disputeRentalInspection(id.value,reason.value,evidence,hash.value);uni.hideLoading();uni.showToast({title:'异议已提交',icon:'success'});setTimeout(()=>uni.navigateBack(),600)}catch(error){uni.hideLoading();uni.showToast({title:error.msg||'提交失败',icon:'none'})}finally{submitting.value=false}}
</script>
<style scoped>
.page{min-height:100vh;padding:32rpx;background:#f5f7fa}.notice{padding:22rpx;border-radius:8rpx;background:#fff7ed;color:#9a3412;font-size:24rpx;line-height:1.6}.reason{box-sizing:border-box;width:100%;height:250rpx;margin-top:22rpx;padding:20rpx;border-radius:8rpx;background:#fff;color:#1f2937;font-size:26rpx;line-height:1.5}.section-title{display:block;margin:30rpx 0 16rpx;color:#374151;font-size:27rpx;font-weight:700}.image-grid{display:flex;flex-wrap:wrap;gap:16rpx}.image-box,.add-image{position:relative;width:200rpx;height:200rpx;border-radius:8rpx;overflow:hidden}.image-box image{width:100%;height:100%}.image-box text{position:absolute;top:0;right:0;width:44rpx;height:44rpx;background:rgba(0,0,0,.55);color:#fff;text-align:center;line-height:44rpx}.add-image{display:flex;align-items:center;justify-content:center;border:1rpx dashed #94a3b8;background:#fff;color:#94a3b8;font-size:60rpx}.submit{margin-top:48rpx;border-radius:8rpx;background:#1677ff;color:#fff;font-size:28rpx}
</style>
