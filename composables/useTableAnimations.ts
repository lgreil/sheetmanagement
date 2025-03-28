import { nextTick } from 'vue'

export function useTableAnimations() {
  const smoothScrollToRow = (row: HTMLElement) => {
    row.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    })
  }

  return {
    smoothScrollToRow
  }
}
