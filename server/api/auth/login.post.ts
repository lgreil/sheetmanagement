export default defineEventHandler(async (event) => {
  // Mock successful login response
  return {
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    }
  }
})