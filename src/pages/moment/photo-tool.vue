<template>
  <view class="page">
    <view class="intro"><text class="title">旅行照片处理</text><text>本地 Canvas 处理，不上传服务器。</text></view>
    <view class="tabs"><text :class="{ active: mode === 'collage' }" @click="changeMode('collage')">拼图</text><text :class="{ active: mode === 'split' }" @click="changeMode('split')">九宫格切图</text></view>
    <view v-if="mode === 'collage'" class="templates"><text v-for="n in [1,2,4,6,9]" :key="n" :class="{ active: count === n }" @click="changeCount(n)">{{ n }} 张</text></view>
    <view class="images"><view v-for="(image,index) in images" :key="image" class="image"><image :src="image" mode="aspectFill" /><text @click="remove(index)">×</text></view><view v-if="images.length < limit" class="add" @click="choose">+</view></view>
    <text class="tip">{{ mode === 'split' ? '选择一张照片，按井字切割为 9 张独立图片。' : `最多选择 ${count} 张照片，生成一张留白拼图。` }}</text>
    <button class="generate" :loading="loading" @click="generate">{{ mode === 'split' ? '生成九张图片' : '生成图片' }}</button>
    <view v-if="results.length" class="result"><text>{{ mode === 'split' ? '已生成 9 张图片' : '生成预览' }}</text><view v-if="mode === 'split'" class="split-result"><image v-for="image in results" :key="image" :src="image" mode="aspectFill" @click="preview(image)" /></view><image v-else :src="results[0]" mode="widthFix" @click="preview(results[0])" /><button @click="save">{{ mode === 'split' ? '保存九张图片到相册' : '保存到相册' }}</button></view>
    <canvas canvas-id="momentPhotoCanvas" id="momentPhotoCanvas" class="canvas" :style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"></canvas>
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, ref } from 'vue'

const proxy = getCurrentInstance()?.proxy
const size = 900
const canvasWidth = ref(size)
const canvasHeight = ref(size)
const mode = ref('collage')
const count = ref(4)
const images = ref([])
const results = ref([])
const loading = ref(false)
const limit = computed(() => mode.value === 'split' ? 1 : count.value)

const changeMode = (value) => { mode.value = value; images.value = []; results.value = [] }
const changeCount = (value) => { count.value = value; images.value = images.value.slice(0, value); results.value = [] }
const remove = (index) => { images.value.splice(index, 1); results.value = [] }
const choose = () => uni.chooseImage({ count: limit.value - images.value.length, sizeType: ['compressed'], success: ({ tempFilePaths }) => { images.value.push(...tempFilePaths.slice(0, limit.value - images.value.length)); results.value = [] } })
const imageInfo = (src) => new Promise((resolve, reject) => uni.getImageInfo({ src, success: resolve, fail: reject }))
const canvasDraw = (ctx) => new Promise((resolve) => ctx.draw(false, resolve))
const canvasOutput = (width, height) => new Promise((resolve, reject) => uni.canvasToTempFilePath({ canvasId: 'momentPhotoCanvas', width, height, destWidth: width, destHeight: height, fileType: 'jpg', quality: .92, success: ({ tempFilePath }) => resolve(tempFilePath), fail: reject }, proxy))
const drawCover = (ctx, source, meta, x, y, width, height) => { const scale = Math.max(width / meta.width, height / meta.height); const drawWidth = meta.width * scale; const drawHeight = meta.height * scale; ctx.drawImage(source, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight) }
const generate = async () => {
  if (!images.value.length) return uni.showToast({ title: '请先选择照片', icon: 'none' })
  loading.value = true
  try {
    if (mode.value === 'split') {
      const meta = await imageInfo(images.value[0])
      const width = size; const height = Math.max(1, Math.round(size * meta.height / meta.width))
      canvasWidth.value = width; canvasHeight.value = height
      await nextTick()
      const pieces = []
      for (let row = 0; row < 3; row++) {
        for (let column = 0; column < 3; column++) {
          const ctx = uni.createCanvasContext('momentPhotoCanvas', proxy)
          ctx.setFillStyle('#ffffff'); ctx.fillRect(0, 0, width, height)
          ctx.drawImage(images.value[0], meta.width / 3 * column, meta.height / 3 * row, meta.width / 3, meta.height / 3, 0, 0, width, height)
          await canvasDraw(ctx)
          pieces.push(await canvasOutput(width, height))
        }
      }
      results.value = pieces
    } else {
      canvasWidth.value = size; canvasHeight.value = size
      await nextTick()
      const ctx = uni.createCanvasContext('momentPhotoCanvas', proxy)
      ctx.setFillStyle('#ffffff'); ctx.fillRect(0, 0, size, size)
      const cols = images.value.length <= 1 ? 1 : images.value.length <= 4 ? 2 : 3; const rows = Math.ceil(images.value.length / cols); const gap = 12; const width = (size - gap * (cols + 1)) / cols; const height = (size - gap * (rows + 1)) / rows
      for (let index = 0; index < images.value.length; index++) { const meta = await imageInfo(images.value[index]); drawCover(ctx, images.value[index], meta, gap + (index % cols) * (width + gap), gap + Math.floor(index / cols) * (height + gap), width, height) }
      await canvasDraw(ctx); results.value = [await canvasOutput(size, size)]
    }
  } catch (_) { uni.showToast({ title: '图片生成失败，请更换照片重试', icon: 'none' }) } finally { loading.value = false }
}
const preview = (current) => uni.previewImage({ urls: results.value, current })
const save = async () => {
  if (!results.value.length) return
  let saved = 0
  for (const filePath of results.value) {
    try { await new Promise((resolve, reject) => uni.saveImageToPhotosAlbum({ filePath, success: resolve, fail: reject })); saved++ } catch (_) { break }
  }
  uni.showToast({ title: saved === results.value.length ? `已保存 ${saved} 张图片` : '请允许保存图片到相册', icon: saved ? 'success' : 'none' })
}
</script>

<style scoped>
.page { min-height:100vh; padding:24rpx 28rpx 50rpx; box-sizing:border-box; background:#f5f7fa; }.intro,.result { display:flex; flex-direction:column; gap:8rpx; padding:24rpx; border-radius:8rpx; background:#fff; color:#64748b; font-size:23rpx; }.title { color:#1f2937; font-size:31rpx; font-weight:700; }.tabs { display:flex; margin-top:20rpx; overflow:hidden; border-radius:7rpx; background:#fff; }.tabs text { flex:1; padding:22rpx 0; color:#6b7280; font-size:27rpx; text-align:center; }.tabs .active { background:#e6f8f2; color:#0f8e69; font-weight:700; }.templates { display:flex; gap:12rpx; margin-top:18rpx; }.templates text { flex:1; padding:16rpx 0; border-radius:6rpx; background:#fff; color:#64748b; font-size:23rpx; text-align:center; }.templates .active { background:#e6f1ff; color:#1677ff; }.images { display:flex; flex-wrap:wrap; gap:14rpx; margin-top:24rpx; }.image,.add { position:relative; display:flex; align-items:center; justify-content:center; width:154rpx; height:154rpx; overflow:hidden; border-radius:7rpx; background:#fff; }.image image { width:100%; height:100%; }.image text { position:absolute; top:6rpx; right:6rpx; width:34rpx; height:34rpx; border-radius:50%; background:rgba(15,23,42,.68); color:#fff; font-size:24rpx; line-height:32rpx; text-align:center; }.add { border:1rpx dashed #9ca3af; box-sizing:border-box; color:#64748b; font-size:54rpx; }.tip { display:block; margin-top:17rpx; color:#8b96a7; font-size:22rpx; }.generate { margin-top:26rpx; border-radius:7rpx; background:#1677ff; color:#fff; font-size:28rpx; }.result { margin-top:24rpx; color:#1f2937; font-size:27rpx; font-weight:600; }.result image { display:block; width:100%; margin-top:16rpx; border-radius:5rpx; }.split-result { display:grid; grid-template-columns:repeat(3, 1fr); gap:8rpx; margin-top:16rpx; }.result .split-result image { width:100%; height:180rpx; margin:0; border-radius:4rpx; }.result button { margin-top:18rpx; border-radius:6rpx; background:#12b886; color:#fff; font-size:26rpx; }.canvas { position:fixed; top:-10000px; left:-10000px; opacity:0; }
</style>
