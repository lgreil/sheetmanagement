export default defineEventHandler(async (event) => {
  // Mock auth check - return mock user if there's a session
  return {
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    }
  }
})