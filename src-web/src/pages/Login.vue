<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const formError = ref('')
const showPassword = ref(false)

async function handleLogin() {
  formError.value = ''
  
  if (!email.value) {
    formError.value = '请输入邮箱'
    return
  }
  
  if (!password.value) {
    formError.value = '请输入密码'
    return
  }
  
  const result = await authStore.login(email.value, password.value)
  
  if (result.success) {
    router.push('/home')
  } else {
    formError.value = result.message
  }
}

function goToRegister() {
  router.push('/register')
}
</script>

<template>
  <div class="login-container">
    <div class="login-card card fade-in">
      <div class="login-header">
        <h1 class="logo">Toonflow</h1>
        <p class="subtitle">AI 短剧漫剧创作平台</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input
            v-model="email"
            type="email"
            class="input"
            :class="{ 'input-error': formError }"
            placeholder="请输入邮箱"
            autocomplete="email"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="password-input">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="input"
              :class="{ 'input-error': formError }"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
        </div>
        
        <p v-if="formError" class="form-error">{{ formError }}</p>
        
        <button type="submit" class="btn btn-primary btn-block" :disabled="authStore.loading">
          <span v-if="authStore.loading" class="spinner"></span>
          <span v-else>登录</span>
        </button>
      </form>
      
      <div class="login-footer">
        <p>
          还没有账号？
          <a href="#" class="link" @click.prevent="goToRegister">立即注册</a>
        </p>
      </div>
    </div>
    
    <div class="login-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
      <div class="decoration-circle circle-3"></div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  z-index: 10;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
}

.password-toggle:hover {
  color: var(--text);
}

.btn-block {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  margin-top: 8px;
}

.login-footer {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

/* Decoration */
.login-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
}

.circle-1 {
  width: 600px;
  height: 600px;
  background: var(--primary);
  top: -200px;
  right: -200px;
}

.circle-2 {
  width: 400px;
  height: 400px;
  background: var(--primary-light);
  bottom: -100px;
  left: -100px;
}

.circle-3 {
  width: 200px;
  height: 200px;
  background: var(--primary);
  top: 50%;
  left: 10%;
}
</style>
