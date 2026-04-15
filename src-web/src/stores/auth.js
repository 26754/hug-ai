import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = '/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('neon_token') || null)
  const refreshToken = ref(localStorage.getItem('neon_refresh_token') || null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function checkAuth() {
    if (token.value) {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
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
          // Token 过期，尝试刷新
          if (refreshToken.value) {
            const refreshed = await refreshAccessToken()
            if (refreshed) {
              await checkAuth()
            } else {
              logout()
            }
          } else {
            logout()
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        logout()
      }
    }
  }

  async function refreshAccessToken() {
    try {
      const response = await fetch(`${API_BASE}/login/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken.value })
      })
      
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        token.value = result.data.token
        refreshToken.value = result.data.refresh_token
        localStorage.setItem('neon_token', token.value)
        localStorage.setItem('neon_refresh_token', refreshToken.value)
        return true
      }
      return false
    } catch (err) {
      console.error('Refresh token failed:', err)
      return false
    }
  }

  async function login(email, password) {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE}/auth/register/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        token.value = result.data.token
        refreshToken.value = result.data.refresh_token
        user.value = result.data.user
        
        localStorage.setItem('neon_token', token.value)
        localStorage.setItem('neon_refresh_token', refreshToken.value)
        
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
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, username })
      })
      
      const result = await response.json()
      
      if (result.code === 200 && result.data) {
        token.value = result.data.token
        refreshToken.value = result.data.refresh_token
        user.value = {
          id: result.data.id,
          email: result.data.email,
          username: result.data.username
        }
        
        localStorage.setItem('neon_token', token.value)
        localStorage.setItem('neon_refresh_token', refreshToken.value)
        
        return { success: true, user: user.value }
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

  async function logout() {
    try {
      // 调用后端退出接口
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify({ refresh_token: refreshToken.value })
      })
    } catch (err) {
      console.error('Logout API call failed:', err)
    }
    
    user.value = null
    token.value = null
    refreshToken.value = null
    localStorage.removeItem('neon_token')
    localStorage.removeItem('neon_refresh_token')
  }

  return {
    user,
    token,
    refreshToken,
    loading,
    error,
    isAuthenticated,
    checkAuth,
    login,
    register,
    logout
  }
})
