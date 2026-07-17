<script>
export default {
  onLaunch: function () {
    console.log('App Launch')
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
}
</script>

<style>
page {
  --hax-bottom-nav-height: calc(122rpx + env(safe-area-inset-bottom));
  --hax-bottom-nav-clearance: calc(174rpx + env(safe-area-inset-bottom));
  background: #f5f7fa;
  color: #1f2937;
  font-size: 28rpx;
}

button::after {
  border: 0;
}

/* #ifdef H5 */
.uni-tabbar-bottom {
  display: none !important;
}
/* #endif */
</style>

<style>
/*每个页面公共css */
</style>
