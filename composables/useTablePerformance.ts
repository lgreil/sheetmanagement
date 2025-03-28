import { ref, onMounted, onUnmounted } from 'vue'

export function useTablePerformance() {
  const renderTime = ref(0)
  const fps = ref(0)
  const isScrolling = ref(false)
  const debugInfo = ref('')

  let frameCount = 0
  let lastTime = 0

  const measureRenderTime = () => {
    const start = performance.now()
    requestAnimationFrame(() => {
      renderTime.value = performance.now() - start
    })
  }

  const measureFPS = () => {
    const updateFPS = (time: number) => {
      if (lastTime) {
        const diff = time - lastTime
        fps.value = Math.round(1000 / diff)
      }
      lastTime = time
      frameCount++
      requestAnimationFrame(updateFPS)
    }
    requestAnimationFrame(updateFPS)
  }

  const onScroll = () => {
    isScrolling.value = true
    clearTimeout()
    setTimeout(() => {
      isScrolling.value = false
    }, 200)
  }

  onMounted(() => {
    debugInfo.value = 'Performance monitoring started...'
  })

  onUnmounted(() => {
    debugInfo.value = 'Performance monitoring stopped.'
  })

  return {
    renderTime,
    fps,
    isScrolling,
    measureRenderTime,
    measureFPS,
    onScroll,
    debugInfo
  }
}
