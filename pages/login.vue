<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <UFormGroup label="Email" name="email">
            <UInput
              v-model="form.email"
              type="email"
              required
              placeholder="Email address"
              :error="errors.email"
            />
          </UFormGroup>
          <UFormGroup label="Password" name="password" class="mt-4">
            <UInput
              v-model="form.password"
              type="password"
              required
              placeholder="Password"
              :error="errors.password"
            />
          </UFormGroup>
        </div>

        <div>
          <UButton
            type="submit"
            block
            :loading="loading"
            color="primary"
          >
            Sign in
          </UButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'default'
})

const loading = ref(false)
const errors = ref({
  email: '',
  password: ''
})

const auth = useAuth()
const { login, isAuthenticated } = auth

// Redirect if already authenticated
watchEffect(() => {
  if (isAuthenticated.value) {
    navigateTo('/')
  }
})

const form = reactive({
  email: '',
  password: ''
})

async function handleSubmit() {
  try {
    loading.value = true
    errors.value = { email: '', password: '' }
    await login(form)
  } catch (error) {
    errors.value.email = 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>

<style>

</style>