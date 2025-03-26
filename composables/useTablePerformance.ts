import { ref, onMounted, onUnmounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

export function useTablePerformance() {
  const renderTime = ref(0)
  const fps = ref(0)
  const isScrolling = ref(false)
  const scrollTimeout = ref<NodeJS.Timeout>()

  // Performance monitoring
  function measureRenderTime() {
    const start = performance.now()
    requestAnimationFrame(() => {
      renderTime.value = performance.now() - start
    })
  }

  // FPS monitoring
  let frameCount = 0
  let lastTime = performance.now()

  function measureFPS() {
    frameCount++
    const currentTime = performance.now()
    
    if (currentTime - lastTime >= 1000) {
      fps.value = Math.round(frameCount * 1000 / (currentTime - lastTime))
      frameCount = 0
      lastTime = currentTime
    }
    
    requestAnimationFrame(measureFPS)
  }

  // Scroll performance optimization
  function onScroll() {
    isScrolling.value = true
    
    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }
    
    scrollTimeout.value = setTimeout(() => {
      isScrolling.value = false
    }, 150)
  }

  // Intersection observer for lazy loading
  function useLazyLoad(target: Ref<HTMLElement | undefined>, callback: () => void) {
    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          callback()
          stop()
        }
      },
      { threshold: 0.1 }
    )
  }

  // Cleanup
  onUnmounted(() => {
    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }
  })

  // Debug info for development
  const debugInfo = computed(() => ({
    renderTime: `${renderTime.value.toFixed(2)}ms`,
    fps: fps.value,
    isScrolling: isScrolling.value
  }))

  return {
    renderTime,
    fps,
    isScrolling,
    measureRenderTime,
    measureFPS,
    onScroll,
    useLazyLoad,
    debugInfo
  }
}