<template>
  <view class="page">
    <view class="head"><text class="title">{{ name }}</text><text>{{ plate }} · 服务中</text></view>
    <view class="card">
      <text class="label first">施工领料</text>
      <view v-for="(row, index) in materials" :key="index" class="material-row">
        <picker class="material-picker" :range="inventoryItems" range-key="display_name" @change="chooseMaterial($event, index)">
          <text>{{ materialName(row.inventory_item_id) || '请选择库存物料' }}</text>
        </picker>
        <input v-model="row.quantity" class="material-qty" type="digit" placeholder="数量" />
        <input v-model="row.remark" class="material-note" placeholder="说明" />
        <text class="remove" @click="materials.splice(index, 1)">删除</text>
      </view>
      <view class="add-material" @click="addMaterial">+ 添加施工物料</view>
      <text class="hint">仅展示当前有库存的物料，提交完工后自动扣减库存。</text>
      <text class="label">完工说明</text>
      <textarea v-model="remark" placeholder="填写已完成项目和注意事项" maxlength="1000" />
      <text class="label">服务前照片</text>
      <view class="media"><image v-for="(url,i) in before" :key="url" :src="url" mode="aspectFill" @click="before.splice(i,1)"/><view class="add" @click="choose('before')">+</view></view>
      <text class="label">服务后照片</text>
      <view class="media"><image v-for="(url,i) in after" :key="url" :src="url" mode="aspectFill" @click="after.splice(i,1)"/><view class="add" @click="choose('after')">+</view></view>
    </view>
    <button class="submit" :loading="submitting" @click="complete">确认服务完成</button>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { completeServiceOrder, getEmployeeInventoryItems, uploadEmployeeMedia } from '../../api/employee'

const id = ref(0), name = ref(''), plate = ref(''), before = ref([]), after = ref([]), remark = ref(''), submitting = ref(false)
const inventoryItems = ref([]), materials = ref([])
onLoad(async (q) => {
  id.value = Number(q.id); name.value = decodeURIComponent(q.name || '汽车服务'); plate.value = decodeURIComponent(q.plate || '')
  try { inventoryItems.value = await getEmployeeInventoryItems() } catch (_) { inventoryItems.value = [] }
})
const addMaterial = () => materials.value.push({ inventory_item_id: 0, quantity: '', remark: '' })
const chooseMaterial = (event, index) => { materials.value[index].inventory_item_id = Number(inventoryItems.value[Number(event.detail.value)]?.id || 0) }
const materialName = (itemId) => inventoryItems.value.find(item => Number(item.id) === Number(itemId))?.display_name || ''
const choose = target => uni.chooseImage({ count: Math.max(1, 9 - (target === 'before' ? before.value.length : after.value.length)), sizeType: ['compressed'], success: async ({ tempFilePaths }) => {
  uni.showLoading({ title: '上传中', mask: true })
  try { for (const path of tempFilePaths) { const result = await uploadEmployeeMedia(path); (target === 'before' ? before.value : after.value).push(result.url) } } catch (error) { uni.showToast({ title: error.msg || '上传失败', icon: 'none' }) } finally { uni.hideLoading() }
} })
const complete = async () => {
  if (!after.value.length) return uni.showToast({ title: '请至少上传一张服务后照片', icon: 'none' })
  const selected = materials.value.filter(row => Number(row.inventory_item_id) || row.quantity)
  if (selected.some(row => !Number(row.inventory_item_id) || Number(row.quantity) <= 0)) return uni.showToast({ title: '请完整填写施工物料和数量', icon: 'none' })
  submitting.value = true
  try { await completeServiceOrder(id.value, { before_images: before.value, after_images: after.value, remark: remark.value, materials: selected }); uni.showToast({ title: '服务已完成', icon: 'success' }); setTimeout(() => uni.navigateBack(), 600) } catch (error) { uni.showToast({ title: error.msg || '提交失败', icon: 'none' }) } finally { submitting.value = false }
}
</script>
<style scoped>
.page{min-height:100vh;padding:24rpx 28rpx 70rpx;background:#f5f7fa}.head,.card{padding:28rpx;border-radius:8rpx;background:#fff}.head{display:flex;flex-direction:column;gap:12rpx;color:#64748b;font-size:24rpx}.title{color:#1f2937;font-size:36rpx;font-weight:700}.card{margin-top:20rpx}.label{display:block;margin-top:24rpx;color:#374151;font-size:25rpx;font-weight:600}.label.first{margin-top:0}.hint{display:block;margin-top:10rpx;color:#94a3b8;font-size:22rpx}.material-row{display:flex;gap:10rpx;align-items:center;margin-top:14rpx}.material-picker,.material-qty,.material-note{box-sizing:border-box;height:66rpx;padding:0 12rpx;border:1rpx solid #dbe3ef;border-radius:6rpx;background:#f8fafc;color:#334155;font-size:23rpx;line-height:66rpx}.material-picker{flex:1;min-width:0}.material-qty{width:116rpx}.material-note{width:132rpx}.remove{color:#f56c6c;font-size:22rpx;white-space:nowrap}.add-material{display:inline-block;margin-top:16rpx;color:#1677ff;font-size:25rpx}textarea{box-sizing:border-box;width:100%;height:150rpx;margin-top:12rpx;padding:18rpx;border:1rpx solid #dbe3ef;border-radius:6rpx;background:#f8fafc;font-size:26rpx}.media{display:flex;flex-wrap:wrap;gap:14rpx;margin-top:14rpx}.media image,.add{display:flex;align-items:center;justify-content:center;width:130rpx;height:130rpx;border-radius:6rpx;background:#eef2f7}.add{border:1rpx dashed #94a3b8;background:#fff;color:#1677ff;font-size:54rpx}.submit{margin-top:28rpx;border-radius:8rpx;background:#1677ff;color:#fff;font-size:30rpx}
</style>
