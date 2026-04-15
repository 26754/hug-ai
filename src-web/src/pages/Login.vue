<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const formError = ref('')
const successMessage = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

// 自动填充上次登录的邮箱
onMounted(() => {
  const lastEmail = localStorage.getItem('last_login_email')
  if (lastEmail) {
    email.value = lastEmail
  }
})

async function handleLogin() {
  formError.value = ''
  successMessage.value = ''
  
  if (!email.value) {
    formError.value = '请输入邮箱'
    return
  }
  
  if (!password.value) {
    formError.value = '请输入密码'
    return
  }
  
  isLoading.value = true
  
  try {
    const result = await authStore.login(email.value, password.value)
    
    if (result.success) {
      // 保存最后登录的邮箱
      localStorage.setItem('last_login_email', email.value)
      successMessage.value = `欢迎回来，${result.user?.username || result.user?.email}！正在跳转...`
      
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        router.push('/home')
      }, 800)
    } else {
      formError.value = result.message || '登录失败，请检查邮箱和密码'
    }
  } catch (err) {
    console.error('Login error:', err)
    formError.value = '网络连接失败，请检查网络后重试'
  } finally {
    isLoading.value = false
  }
}

function goToRegister() {
  router.push('/register')
}

// 回车键登录
function handleKeydown(event) {
  if (event.key === 'Enter') {
    handleLogin()
  }
}
</script>

<template>
  <div class="login-page">
    <!-- Animated Background -->
    <div class="bg-animation">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
      <div class="gradient-overlay"></div>
    </div>

    <!-- Main Content -->
    <div class="login-wrapper">
      <div class="login-card">
        <!-- Brand Section -->
        <div class="brand-section">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 class="brand-name">HUG AI</h1>
          <p class="brand-tagline">AI 短剧漫剧创作平台</p>
        </div>

        <!-- Form Section -->
        <div class="form-section">
          <h2 class="form-title">欢迎回来</h2>
          <p class="form-subtitle">登录您的账号继续创作</p>
          
          <!-- Success Message -->
          <div v-if="successMessage" class="success-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {{ successMessage }}
          </div>
          
          <form @submit.prevent="handleLogin" class="login-form" :class="{ 'has-success': successMessage }">
            <div class="input-group">
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <input
                v-model="email"
                type="email"
                class="input"
                :class="{ 'input-error': formError, 'input-success': successMessage }"
                placeholder="请输入邮箱地址"
                autocomplete="email"
                :disabled="isLoading"
                @keydown="handleKeydown"
              />
            </div>
            
            <div class="input-group">
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="input"
                :class="{ 'input-error': formError, 'input-success': successMessage }"
                placeholder="请输入密码"
                autocomplete="current-password"
                :disabled="isLoading"
                @keydown="handleKeydown"
              />
              <button
                type="button"
                class="input-action"
                @click="showPassword = !showPassword"
                :disabled="isLoading"
              >
                <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            
            <p v-if="formError" class="error-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {{ formError }}
            </p>
            
            <button type="submit" class="btn btn-primary" :disabled="isLoading || successMessage">
              <span v-if="isLoading" class="loading-spinner"></span>
              <span v-else-if="successMessage">登录成功</span>
              <span v-else>登 录</span>
            </button>
          </form>
          
          <div class="form-footer">
            <p>还没有账号？<a href="#" class="link" @click.prevent="goToRegister">立即注册</a></p>
          </div>
        </div>

        <!-- Features Preview -->
        <div class="features-preview">

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  overflow: hidden;
}

/* Animated Background */
.bg-animation {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.floating-shapes {
  position: absolute;
  inset: 0;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0.1) 100%);
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  top: 50%;
  right: -50px;
  animation-delay: -5s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  bottom: 10%;
  left: 10%;
  animation-delay: -10s;
}

.shape-4 {
  width: 250px;
  height: 250px;
  bottom: -100px;
  right: 20%;
  animation-delay: -15s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(30px, -30px) rotate(5deg);
  }
  50% {
    transform: translate(0, -50px) rotate(0deg);
  }
  75% {
    transform: translate(-30px, -30px) rotate(-5deg);
  }
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, transparent 0%, rgba(15, 15, 35, 0.8) 100%);
}

/* Login Card */
.login-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 900px;
}

.login-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Brand Section */
.brand-section {
  text-align: center;
  margin-bottom: 40px;
}

.brand-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
}

.brand-icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

.brand-name {
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.brand-tagline {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* Form Section */
.form-section {
  max-width: 360px;
  margin: 0 auto 40px;
}

.form-title {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 8px;
}

.form-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin-bottom: 32px;
}

/* Success Message */
.success-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 10px;
  color: #22c55e;
  font-size: 14px;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
}

.success-message svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-form.has-success .input {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.4);
  pointer-events: none;
  transition: color 0.3s;
}

.input-group:focus-within .input-icon {
  color: rgba(255, 255, 255, 0.7);
}

.input-icon svg {
  width: 100%;
  height: 100%;
}

.input {
  width: 100%;
  padding: 16px 48px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  transition: all 0.3s ease;
}

.input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.input:focus {
  outline: none;
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-error {
  border-color: #ef4444;
  animation: shake 0.4s ease;
}

.input-success {
  border-color: #22c55e;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.input-action {
  position: absolute;
  right: 12px;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.input-action:hover:not(:disabled) {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.input-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-action svg {
  width: 18px;
  height: 18px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
  animation: fadeIn 0.3s ease;
}

.error-message svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn {
  width: 100%;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(99, 102, 241, 0.5);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.form-footer {
  text-align: center;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.link {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.link:hover {
  color: #818cf8;
}

/* Features Preview */
.features-preview {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  transition: color 0.3s;
}

.feature-item:hover {
  color: rgba(255, 255, 255, 0.8);
}

.feature-icon {
  width: 32px;
  height: 32px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon svg {
  width: 16px;
  height: 16px;
  color: #6366f1;
}

/* Responsive */
@media (max-width: 640px) {
  .login-card {
    padding: 32px 24px;
  }
  
  .brand-name {
    font-size: 28px;
  }
  
  .features-preview {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
}
</style>
