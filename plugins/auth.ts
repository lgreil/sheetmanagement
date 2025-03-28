import { useAuth } from '~/composables/useAuth'

export default defineNuxtPlugin(async () => {
  const { checkAuth } = useAuth()
  
  // Check auth state on app initialization
  await checkAuth()
})