<template>
  <view class="page">
    <view v-if="loading" class="empty-state">详情加载中</view>
    <block v-else-if="item">
      <image v-if="item.cover_image" class="hero-image" :src="item.cover_image" mode="aspectFill" />
      <view v-else class="hero-placeholder">{{ typeLabel }}</view>
      <view class="content-card">
        <view class="title-row"><text class="title">{{ item.name }}</text><text class="score">{{ item.recommendation_score || '用户推荐' }}</text></view>
        <text class="location">{{ item.location || '位置待完善' }}</text>
        <view class="stat-row"><text>赞 {{ item.like_count || 0 }}</text><text>评论 {{ item.comment_count || 0 }}</text><text>收藏 {{ item.favorite_count || 0 }}</text></view>
        <view class="price-row"><text>{{ priceLabel }}</text><text class="price">{{ priceValue }}</text></view>
      </view>

      <view v-if="hasCoordinates" class="section map-section">
        <view class="section-head"><text class="section-title">地点位置</text><text class="navigate-link" @click="navigateToPlace">导航前往</text></view>
        <map class="location-map" :latitude="Number(item.latitude)" :longitude="Number(item.longitude)" :scale="15" :markers="mapMarkers" :show-location="true" />
        <text class="map-address">{{ item.location || item.name }}</text>
      </view>

      <view v-if="item.reason" class="section"><text class="section-title">推荐理由</text><text class="section-content">{{ item.reason }}</text></view>
      <view v-if="item.description" class="section"><text class="section-title">内容说明</text><text class="section-content">{{ item.description }}</text></view>
      <view v-if="item.notices" class="section"><text class="section-title">注意事项</text><text class="section-content">{{ item.notices }}</text></view>
      <view v-if="targetType === 'restaurant'" class="section child-section">
        <view class="section-head"><text class="section-title">推荐菜品</text><text class="add-child" @click="openChildForm">添加菜品</text></view>
        <view v-if="item.recommended_dishes?.length" class="child-list">
          <view v-for="dish in item.recommended_dishes" :key="dish.id ? `dish-${dish.id}` : `legacy-dish-${dish.name}`" class="child-item">
            <view class="child-main"><text class="child-name">{{ dish.name }}</text><text v-if="dish.content" class="child-content">{{ dish.content }}</text></view>
            <view v-if="dish.id" class="child-votes"><button class="vote-button" :class="{ active: dish.user_vote === 'like' }" @click="voteChild(dish, 'like')">赞 {{ dish.like_count || 0 }}</button><button class="vote-button" :class="{ active: dish.user_vote === 'dislike' }" @click="voteChild(dish, 'dislike')">踩 {{ dish.dislike_count || 0 }}</button></view>
          </view>
        </view>
        <text v-else class="child-empty">暂无用户推荐菜品，欢迎补充</text>
      </view>
      <view class="section">
        <text class="section-title">实用信息</text>
        <view v-if="item.recommended_duration_minutes" class="info-row"><text>建议停留</text><text>{{ durationText(item.recommended_duration_minutes) }}</text></view>
        <view v-if="item.recommended_time_slots?.length" class="info-row"><text>建议时段</text><text>{{ item.recommended_time_slots.join('、') }}</text></view>
        <view v-if="item.open_time || item.close_time" class="info-row"><text>开放时间</text><text>{{ item.open_time || '--' }} - {{ item.close_time || '--' }}</text></view>
        <view v-if="item.parking_location || item.parking_note" class="info-row"><text>停车信息</text><text>{{ item.parking_location || item.parking_note }}</text></view>
        <view v-if="item.reservation_required" class="notice">{{ item.reservation_notice || '建议提前预约' }}</view>
        <view v-if="item.weather_notice" class="notice">{{ item.weather_notice }}</view>
      </view>
      <view v-if="targetType === 'scenic_spot'" class="section child-section">
        <view class="section-head"><text class="section-title">打卡点</text><text class="add-child" @click="openChildForm">添加打卡点</text></view>
        <view v-if="item.checkin_points?.length" class="child-list">
          <view v-for="point in item.checkin_points" :key="point.id ? `point-${point.id}` : `legacy-point-${point.name}`" class="child-item">
            <view class="child-main"><text class="child-name">{{ point.name }}</text><text v-if="point.content" class="child-content">{{ point.content }}</text></view>
            <view v-if="point.id" class="child-votes"><button class="vote-button" :class="{ active: point.user_vote === 'like' }" @click="voteChild(point, 'like')">赞 {{ point.like_count || 0 }}</button><button class="vote-button" :class="{ active: point.user_vote === 'dislike' }" @click="voteChild(point, 'dislike')">踩 {{ point.dislike_count || 0 }}</button></view>
          </view>
        </view>
        <text v-else class="child-empty">暂无用户提交打卡点，欢迎补充</text>
      </view>
      <view class="section checkin-section">
        <view class="section-head"><text class="section-title">{{ targetType === 'scenic_spot' ? '景点打卡墙' : '食客分享' }}</text><text class="add-child" @click="openCheckinForm">去打卡</text></view>
        <view v-if="checkins.length" class="checkin-list"><view v-for="checkin in checkins" :key="checkin.id" class="checkin-item"><view class="checkin-avatar"><image v-if="checkin.avatar_url" :src="checkin.avatar_url" mode="aspectFill" /><text v-else>{{ checkin.nickname.slice(0, 1) }}</text></view><view class="checkin-main"><text class="checkin-name">{{ checkin.nickname }}<text v-if="checkin.visit_date" class="checkin-date"> · {{ checkin.visit_date }}</text></text><text class="checkin-content">{{ checkin.content }}</text><view v-if="checkin.tags?.length" class="checkin-tags"><text v-for="tag in checkin.tags" :key="tag.id">#{{ tag.name }}</text></view></view></view></view>
        <text v-else class="child-empty">还没有人留下足迹，来分享第一条吧</text>
      </view>

      <view class="action-bar"><button class="action-button" :class="{ active: liked }" @click="toggleLike">♡ <text>{{ liked ? '已赞' : '点赞' }}</text></button><button class="action-button" :class="{ active: favorited }" @click="toggleFavorite">☆ <text>{{ favorited ? '已收藏' : '收藏' }}</text></button></view>
    </block>
    <view v-else class="empty-state">内容不存在或已下架</view>
    <view v-if="childFormVisible" class="form-mask" @click="closeChildForm">
      <view class="child-form" @click.stop>
        <view class="form-head"><text class="form-title">{{ childTitle }}</text><text class="form-close" @click="closeChildForm">×</text></view>
        <input v-model.trim="childForm.title" class="form-input" :placeholder="targetType === 'scenic_spot' ? '例如：海边观景平台' : '例如：海鲜锅贴'" maxlength="80" />
        <textarea v-model.trim="childForm.content" class="form-textarea" placeholder="写下你的真实体验，提交后由后台审核" maxlength="500" />
        <button class="form-submit" @click="submitChild">提交审核</button>
      </view>
    </view>
    <view v-if="checkinFormVisible" class="form-mask" @click="closeCheckinForm">
      <view class="child-form" @click.stop>
        <view class="form-head"><text class="form-title">{{ targetType === 'scenic_spot' ? '留下打卡足迹' : '分享用餐体验' }}</text><text class="form-close" @click="closeCheckinForm">×</text></view>
        <picker mode="date" :value="checkinForm.visitDate" @change="checkinForm.visitDate = $event.detail.value"><view class="form-input date-picker">到访日期：{{ checkinForm.visitDate }}</view></picker>
        <textarea v-model.trim="checkinForm.content" class="form-textarea" placeholder="写下真实感受，审核通过后展示" maxlength="500" />
        <view class="checkin-images"><view v-for="(image, index) in checkinForm.images" :key="image" class="checkin-image"><image :src="image" mode="aspectFill" /><text @click="checkinForm.images.splice(index, 1)">×</text></view><view v-if="checkinForm.images.length < 3" class="checkin-image-add" @click="chooseCheckinImage">+</view></view>
        <button class="form-submit" @click="submitCheckin">提交审核</button>
      </view>
    </view>
    <AppBottomNav active="travel" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppBottomNav from '../../components/AppBottomNav.vue'
import { getTravelDetail, submitTravelChild, toggleTravelFavorite, toggleTravelLike, voteTravelChild } from '../../api/travel'
import { getMomentCheckins, submitMomentCheckin, uploadMomentImage } from '../../api/moment'
import { getToken } from '../../utils/user-session'

const item = ref(null)
const loading = ref(false)
const targetType = ref('')
const targetId = ref(0)
const liked = ref(false)
const favorited = ref(false)
const childFormVisible = ref(false)
const childForm = ref({ title: '', content: '' })
const checkins = ref([])
const checkinFormVisible = ref(false)
const checkinForm = ref({ visitDate: new Date().toISOString().slice(0, 10), content: '', images: [] })
const childTitle = computed(() => targetType.value === 'scenic_spot' ? '添加打卡点' : '添加推荐菜品')
const typeLabel = computed(() => targetType.value === 'scenic_spot' ? '玩' : targetType.value === 'restaurant' ? '吃喝' : '推荐')
const priceLabel = computed(() => targetType.value === 'scenic_spot' ? '门票' : '人均消费')
const priceValue = computed(() => targetType.value === 'scenic_spot' ? (item.value?.ticket_price ? `¥${item.value.ticket_price}` : '以现场为准') : (item.value?.avg_price ? `¥${item.value.avg_price}` : '价格待完善'))
const hasCoordinates = computed(() => {
  const latitude = item.value?.latitude
  const longitude = item.value?.longitude
  return latitude !== null && latitude !== undefined && latitude !== ''
    && longitude !== null && longitude !== undefined && longitude !== ''
    && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
})
const mapMarkers = computed(() => hasCoordinates.value ? [{
  id: 1,
  latitude: Number(item.value.latitude),
  longitude: Number(item.value.longitude),
  title: item.value.name,
  width: 30,
  height: 30,
  callout: { content: item.value.name, display: 'BYCLICK', color: '#1f2937', bgColor: '#ffffff', padding: 6, borderRadius: 4 }
}] : [])

const durationText = (minutes) => minutes >= 60 ? `${Math.floor(minutes / 60)}小时${minutes % 60 ? `${minutes % 60}分钟` : ''}` : `${minutes}分钟`

const loadDetail = async () => {
  loading.value = true
  try {
    const result = await getTravelDetail(targetType.value, targetId.value)
    item.value = result.data?.item || null
  } catch (error) {
    item.value = null
    uni.showToast({ title: error.msg || '详情加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
const loadCheckins = async () => { try { const result = await getMomentCheckins(targetType.value, targetId.value); checkins.value = result.data?.list || [] } catch (_) { checkins.value = [] } }

const requireLogin = () => {
  if (getToken()) return true
  uni.navigateTo({ url: '/pages/login/index' })
  return false
}

const toggleLike = async () => {
  if (!requireLogin()) return
  try {
    const result = await toggleTravelLike({ target_type: targetType.value, target_id: targetId.value })
    liked.value = !!result.data?.active
    if (item.value) item.value.like_count = result.data?.like_count || 0
    uni.showToast({ title: liked.value ? '点赞成功' : '已取消点赞', icon: 'none' })
  } catch (error) { uni.showToast({ title: error.msg || '操作失败', icon: 'none' }) }
}

const toggleFavorite = async () => {
  if (!requireLogin()) return
  try {
    const result = await toggleTravelFavorite({ target_type: targetType.value, target_id: targetId.value })
    favorited.value = !!result.data?.active
    if (item.value) item.value.favorite_count = result.data?.favorite_count || 0
    uni.showToast({ title: favorited.value ? '收藏成功' : '已取消收藏', icon: 'none' })
  } catch (error) { uni.showToast({ title: error.msg || '操作失败', icon: 'none' }) }
}

const openChildForm = () => {
  if (!requireLogin()) return
  childForm.value = { title: '', content: '' }
  childFormVisible.value = true
}

const closeChildForm = () => { childFormVisible.value = false }
const openCheckinForm = () => { if (!requireLogin()) return; checkinForm.value = { visitDate: new Date().toISOString().slice(0, 10), content: '', images: [] }; checkinFormVisible.value = true }
const closeCheckinForm = () => { checkinFormVisible.value = false }
const chooseCheckinImage = () => uni.chooseImage({ count: 3 - checkinForm.value.images.length, sizeType: ['compressed'], success: async ({ tempFilePaths }) => { uni.showLoading({ title: '上传中' }); try { for (const filePath of tempFilePaths) { const result = await uploadMomentImage(filePath); if (result.url) checkinForm.value.images.push(result.url) } } catch (error) { uni.showToast({ title: error.msg || '图片上传失败', icon: 'none' }) } finally { uni.hideLoading() } } })
const submitCheckin = async () => { if (!checkinForm.value.content) return uni.showToast({ title: '请写下打卡感受', icon: 'none' }); try { await submitMomentCheckin({ target_type: targetType.value, target_id: targetId.value, content: checkinForm.value.content, visit_date: checkinForm.value.visitDate, images: JSON.stringify(checkinForm.value.images) }); checkinFormVisible.value = false; uni.showToast({ title: '打卡已提交审核', icon: 'success' }) } catch (error) { uni.showToast({ title: error.msg || '提交失败', icon: 'none' }) } }

const navigateToPlace = () => {
  if (!hasCoordinates.value) return
  uni.openLocation({
    latitude: Number(item.value.latitude),
    longitude: Number(item.value.longitude),
    name: item.value.name,
    address: item.value.location || '',
    scale: 16
  })
}

const submitChild = async () => {
  if (!childForm.value.title || !childForm.value.content) {
    uni.showToast({ title: '请填写名称和真实体验', icon: 'none' })
    return
  }
  try {
    await submitTravelChild({
      item_type: targetType.value === 'scenic_spot' ? 'checkin_point' : 'recommended_dish',
      target_type: targetType.value,
      target_id: targetId.value,
      title: childForm.value.title,
      content: childForm.value.content
    })
    childFormVisible.value = false
    uni.showToast({ title: '已提交，审核通过后展示', icon: 'none' })
  } catch (error) {
    uni.showToast({ title: error.msg || '提交失败', icon: 'none' })
  }
}

const voteChild = async (child, voteType) => {
  if (!requireLogin()) return
  if (child.user_vote) {
    uni.showToast({ title: '你已经评价过这个内容', icon: 'none' })
    return
  }
  try {
    const result = await voteTravelChild({ item_id: child.id, vote_type: voteType })
    child.user_vote = result.data?.active || voteType
    child.like_count = result.data?.like_count || 0
    child.dislike_count = result.data?.dislike_count || 0
    uni.showToast({ title: voteType === 'like' ? '点赞成功' : '已踩一下', icon: 'none' })
  } catch (error) {
    uni.showToast({ title: error.msg || '评价失败', icon: 'none' })
  }
}

onLoad((options) => {
  targetType.value = options?.target_type || ''
  targetId.value = Number(options?.target_id || 0)
  loadDetail()
  loadCheckins()
})
</script>

<style scoped>
.page { min-height: 100vh; padding-bottom: calc(310rpx + env(safe-area-inset-bottom)); background: #f5f7fa; }
.hero-image, .hero-placeholder { display: block; width: 100%; height: 420rpx; }
.hero-placeholder { display: flex; align-items: center; justify-content: center; background: #d8f3ea; color: #0f8e69; font-size: 72rpx; font-weight: 700; }
.content-card, .section { margin: 18rpx 24rpx 0; padding: 24rpx; border-radius: 8rpx; background: #fff; }
.section-head, .child-item, .child-votes { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.add-child { color: #1677ff; font-size: 23rpx; }
.child-list { margin-top: 16rpx; }
.child-item { align-items: flex-start; padding: 16rpx 0; border-top: 1rpx solid #eef0f4; }
.child-main { display: flex; flex: 1; flex-direction: column; gap: 8rpx; min-width: 0; }
.child-name { color: #1f2937; font-size: 26rpx; font-weight: 600; }
.child-content { color: #6b7280; font-size: 23rpx; line-height: 1.5; }
.child-votes { flex: 0 0 auto; }
.vote-button { margin: 0; padding: 0 12rpx; border-radius: 5rpx; background: #f1f5f9; color: #64748b; font-size: 20rpx; line-height: 48rpx; }
.vote-button::after { border: 0; }.vote-button.active { background: #e6f8f2; color: #0f8e69; }
.child-empty { display: block; margin-top: 16rpx; color: #9ca3af; font-size: 23rpx; }
.checkin-list { margin-top: 16rpx; }.checkin-item { display: flex; gap: 14rpx; padding: 16rpx 0; border-top: 1rpx solid #eef0f4; }.checkin-avatar { display: flex; flex: 0 0 54rpx; align-items: center; justify-content: center; width: 54rpx; height: 54rpx; overflow: hidden; border-radius: 50%; background: #dbeafe; color: #1677ff; font-size: 22rpx; }.checkin-avatar image { width: 100%; height: 100%; }.checkin-main { display: flex; flex: 1; flex-direction: column; min-width: 0; }.checkin-name { color: #334155; font-size: 23rpx; font-weight: 600; }.checkin-date { color: #94a3b8; font-weight: 400; }.checkin-content { margin-top: 7rpx; color: #64748b; font-size: 22rpx; line-height: 1.55; }.checkin-tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 7rpx; color: #3976bf; font-size: 20rpx; }
.form-mask { position: fixed; inset: 0; z-index: 120; display: flex; align-items: flex-end; background: rgba(15, 23, 42, .45); }
.child-form { width: 100%; padding: 28rpx 28rpx calc(30rpx + env(safe-area-inset-bottom)); border-radius: 24rpx 24rpx 0 0; background: #fff; box-sizing: border-box; }
.form-head { display: flex; align-items: center; justify-content: space-between; }.form-title { color: #1f2937; font-size: 32rpx; font-weight: 700; }.form-close { color: #94a3b8; font-size: 44rpx; }
.form-input, .form-textarea { display: block; width: 100%; margin-top: 22rpx; border: 1rpx solid #e5e7eb; border-radius: 8rpx; background: #f8fafc; box-sizing: border-box; color: #1f2937; font-size: 25rpx; }
.form-input { height: 80rpx; padding: 0 20rpx; line-height: 80rpx; }
.form-textarea { height: 180rpx; padding: 20rpx; line-height: 1.6; }
.date-picker { color: #64748b; }.checkin-images { display: flex; gap: 12rpx; margin-top: 16rpx; }.checkin-image, .checkin-image-add { position: relative; display: flex; align-items: center; justify-content: center; width: 118rpx; height: 118rpx; overflow: hidden; border-radius: 6rpx; }.checkin-image image { width: 100%; height: 100%; }.checkin-image text { position: absolute; top: 4rpx; right: 4rpx; width: 30rpx; height: 30rpx; border-radius: 50%; background: rgba(15,23,42,.65); color: #fff; text-align: center; line-height: 30rpx; }.checkin-image-add { border: 1rpx dashed #9ca3af; color: #64748b; font-size: 42rpx; }
.form-submit { margin-top: 22rpx; border-radius: 8rpx; background: #1677ff; color: #fff; font-size: 28rpx; }
.title-row, .stat-row, .price-row, .info-row { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; }
.title { color: #1f2937; font-size: 38rpx; font-weight: 700; }
.score { flex: 0 0 auto; padding: 6rpx 10rpx; border-radius: 5rpx; background: #e6f8f2; color: #0f8e69; font-size: 21rpx; }
.location { display: block; margin-top: 14rpx; color: #6b7280; font-size: 24rpx; }
.stat-row { margin-top: 22rpx; color: #9ca3af; font-size: 22rpx; }
.price-row { margin-top: 22rpx; padding-top: 18rpx; border-top: 1rpx solid #eef0f4; color: #6b7280; font-size: 24rpx; }
.price { color: #f97316; font-size: 30rpx; font-weight: 700; }
.section-title { display: block; color: #1f2937; font-size: 29rpx; font-weight: 700; }
.section-content { display: block; margin-top: 14rpx; color: #4b5563; font-size: 25rpx; line-height: 1.7; white-space: pre-wrap; }
.navigate-link { color: #1677ff; font-size: 24rpx; }
.location-map { width: 100%; height: 300rpx; margin-top: 20rpx; border-radius: 8rpx; overflow: hidden; }
.map-address { display: block; margin-top: 14rpx; color: #6b7280; font-size: 23rpx; }
.info-row { align-items: flex-start; margin-top: 18rpx; color: #6b7280; font-size: 24rpx; line-height: 1.5; }.info-row text:last-child { flex: 1; color: #374151; text-align: right; }
.tag-list { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 16rpx; }.tag { padding: 8rpx 14rpx; border-radius: 5rpx; background: #eff6ff; color: #3976bf; font-size: 22rpx; }
.notice { margin-top: 18rpx; padding: 14rpx 16rpx; border-radius: 6rpx; background: #fff7ed; color: #c2410c; font-size: 23rpx; line-height: 1.6; }
.action-bar { position: fixed; right: 0; bottom: var(--hax-bottom-nav-clearance, calc(174rpx + env(safe-area-inset-bottom))); left: 0; z-index: 90; display: flex; gap: 16rpx; padding: 16rpx 24rpx; background: #fff; box-shadow: 0 -4rpx 16rpx rgba(15, 23, 42, .08); }
.action-button { flex: 1; margin: 0; border-radius: 7rpx; background: #f1f5f9; color: #4b5563; font-size: 26rpx; line-height: 72rpx; }.action-button::after { border: 0; }.action-button.active { background: #e6f8f2; color: #0f8e69; }
.empty-state { padding: 180rpx 32rpx; color: #9ca3af; text-align: center; font-size: 26rpx; }
</style>
