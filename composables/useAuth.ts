import { defineNuxtRouteMiddleware, navigateTo } from '#app'

interface User {
  id: string;
  email: string;
  name?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

// Mock user for testing
const MOCK_USER: User = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User'
}

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)
  const isAuthenticated = computed(() => !!user.value)

  const login = async (credentials: LoginCredentials) => {
    // Mock login - always succeeds with test credentials
    console.log('Mock login with credentials:', credentials)
    user.value = MOCK_USER
    return navigateTo('/')
  }

  const logout = async () => {
    // Mock logout
    console.log('Mock logout')
    user.value = null
    return navigateTo('/login')
  }

  const checkAuth = async () => {
    // Mock auth check - user stays logged in until explicit logout
    console.log('Mock auth check')
    if (!user.value) {
      user.value = null
    }
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
    checkAuth
  }
}

// Create auth middleware
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth()
  const publicPages = ['/login', '/signup']
  
  if (!auth.isAuthenticated.value && !publicPages.includes(to.path)) {
    return navigateTo('/login')
  }
})