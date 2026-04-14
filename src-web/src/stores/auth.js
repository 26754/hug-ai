import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function checkAuth() {
    if (token.value) {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.code === 200 && result.data) {
            user.value = result.data
          }
        } else {
          logout()
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        logout()
      }
    }
  }

  async function login(email, password) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/login/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        token.value = result.data.token
        user.value = result.data.user
        localStorage.setItem('token', token.value)
        return { success: true, user: result.data.user }
      } else {
        error.value = result.message || '登录失败'
        return { success: false, message: result.message }
      }
    } catch (err) {
      console.error('Login error:', err)
      error.value = '网络错误，请稍后重试'
      return { success: false, message: '网络错误，请稍后重试' }
    } finally {
      loading.value = false
    }
  }

  async function register(email, password, username) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, username })
      })
      
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        if (result.data.need_relogin) {
          return { success: true, needRelogin: true }
        }
        token.value = result.data.token
        user.value = result.data.user
        localStorage.setItem('token', token.value)
        return { success: true, user: result.data.user }
      } else {
        error.value = result.message || '注册失败'
        return { success: false, message: result.message }
      }
    } catch (err) {
      console.error('Register error:', err)
      error.value = '网络错误，请稍后重试'
      return { success: false, message: '网络错误，请稍后重试' }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    checkAuth,
    login,
    register,
    logout
  }
})
