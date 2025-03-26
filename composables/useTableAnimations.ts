import { ref } from 'vue'

export function useTableAnimations() {
  const isScrolling = ref(false)

  function smoothScrollToRow(element: HTMLElement, offset = 100) {
    if (!element || isScrolling.value) return

    isScrolling.value = true
    
    const container = document.querySelector('.music-table-container')
    if (!container) return

    const elementRect = element.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    
    // Check if element is not fully visible
    if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
      const scrollTarget = element.offsetTop - offset
      
      container.scrollTo({
        top: scrollTarget,
        behavior: 'smooth'
      })

      // Reset scrolling state after animation
      setTimeout(() => {
        isScrolling.value = false
      }, 300)
    } else {
      isScrolling.value = false
    }
  }

  // Add touch gesture support
  let touchStartY = 0
  let touchStartX = 0

  function handleTouchStart(e: TouchEvent) {
    touchStartY = e.touches[0].clientY
    touchStartX = e.touches[0].clientX
  }

  function handleTouchMove(e: TouchEvent, onSwipe?: (direction: 'left' | 'right') => void) {
    if (!onSwipe) return

    const touchEndX = e.touches[0].clientX
    const touchEndY = e.touches[0].clientY
    
    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY
    
    // Only trigger swipe if horizontal movement is greater than vertical
    // and exceeds minimum threshold
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      onSwipe(deltaX > 0 ? 'right' : 'left')
    }
  }

  return {
    isScrolling: readonly(isScrolling),
    smoothScrollToRow,
    handleTouchStart,
    handleTouchMove
  }
}