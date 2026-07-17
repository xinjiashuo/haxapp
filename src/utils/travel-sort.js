export const sortOptions = [
  { key: 'default', name: '综合推荐' },
  { key: 'price', name: '价格优先' },
  { key: 'distance', name: '距离最近' },
  { key: 'score', name: '推荐星级' },
  { key: 'likes', name: '点赞最多' },
  { key: 'favorites', name: '收藏最多' }
]

export const distanceInKm = (item, location) => {
  if (!location || item.latitude === null || item.latitude === undefined || item.longitude === null || item.longitude === undefined) return null
  const toRadians = (value) => value * Math.PI / 180
  const lat1 = toRadians(Number(location.latitude))
  const lat2 = toRadians(Number(item.latitude))
  const deltaLat = lat2 - lat1
  const deltaLon = toRadians(Number(item.longitude) - Number(location.longitude))
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const distanceText = (item, location) => {
  const distance = distanceInKm(item, location)
  return distance === null ? '' : `${distance.toFixed(distance < 10 ? 1 : 0)} km`
}

export const sortTravelItems = (items, type, sortKey, location) => {
  if (sortKey === 'default') return items
  const priceValue = (item) => {
    const value = type === 'play' ? item.ticket_price : item.avg_price
    return value === '' || value === null || value === undefined ? Number.MAX_SAFE_INTEGER : Number(value)
  }
  const scoreValue = (item) => {
    const score = Number(item.recommendation_score)
    return Number.isFinite(score) ? score : 0
  }

  return [...items].sort((left, right) => {
    if (sortKey === 'distance') {
      const leftDistance = distanceInKm(left, location)
      const rightDistance = distanceInKm(right, location)
      if (leftDistance === null) return 1
      if (rightDistance === null) return -1
      return leftDistance - rightDistance
    }
    if (sortKey === 'price') return priceValue(left) - priceValue(right)
    if (sortKey === 'score') return scoreValue(right) - scoreValue(left)
    if (sortKey === 'likes') return Number(right.like_count || 0) - Number(left.like_count || 0)
    if (sortKey === 'favorites') return Number(right.favorite_count || 0) - Number(left.favorite_count || 0)
    return 0
  })
}
