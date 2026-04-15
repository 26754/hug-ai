<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const username = ref('')
const formError = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

const passwordStrength = computed(() => {
  const pwd = password.value
  if (!pwd) return { level: 0, text: '', color: '' }
  
  let strength = 0
  if (pwd.length >= 8) strength++
  if (/[a-z]/.test(pwd)) strength++
  if (/[A-Z]/.test(pwd)) strength++
  if (/[0-9]/.test(pwd)) strength++
  if (/[^a-zA-Z0-9]/.test(pwd)) strength++
  
  const levels = [
    { text: '非常弱', color: '#ef4444' },
    { text: '弱', color: '#f97316' },
    { text: '中等', color: '#eab308' },
    { text: '强', color: '#22c55e' },
    { text: '非常强', color: '#10b981' }
  ]
  
  return { level: strength, ...levels[strength - 1] }
})

const passwordRequirements = computed(() => [
  { text: '至少 8 个字符', valid: password.value.length >= 8 },
  { text: '包含小写字母', valid: /[a-z]/.test(password.value) },
  { text: '包含大写字母', valid: /[A-Z]/.test(password.value) },
  { text: '包含数字', valid: /[0-9]/.test(password.value) }
])

async function handleRegister() {
  formError.value = ''
  
  if (!email.value) {
    formError.value = '请输入邮箱'
    return
  }
  
  if (!password.value) {
    formError.value = '请输入密码'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    formError.value = '两次输入的密码不一致'
    return
  }
  
  if (password.value.length < 8) {
    formError.value = '密码长度至少为 8 个字符'
    return
  }
  
  if (!/[a-z]/.test(password.value) || !/[A-Z]/.test(password.value) || !/[0-9]/.test(password.value)) {
    formError.value = '密码必须包含大小写字母和数字'
    return
  }
  
  isLoading.value = true
  
  const result = await authStore.register(email.value, password.value, username.value)
  
  isLoading.value = false
  
  if (result.success) {
    router.push('/home')
  } else {
    formError.value = result.message
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="register-page">
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
    <div class="register-wrapper">
      <div class="register-card">
        <!-- Brand Section -->
        <div class="brand-section">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 class="brand-name">Toonflow</h1>
          <p class="brand-tagline">AI 短剧漫剧创作平台</p>
        </div>

        <!-- Form Section -->
        <div class="form-section">
          <h2 class="form-title">创建账号</h2>
          <p class="form-subtitle">开始您的创作之旅</p>
          
          <form @submit.prevent="handleRegister" class="register-form">
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
                placeholder="请输入邮箱地址"
                autocomplete="email"
              />
            </div>
            
            <div class="input-group">
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <input
                v-model="username"
                type="text"
                class="input"
                placeholder="用户名（可选）"
                autocomplete="username"
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
                placeholder="创建密码（至少 8 位）"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="input-action"
                @click="showPassword = !showPassword"
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
            
            <!-- Password Strength -->
            <div v-if="password" class="password-strength">
              <div class="strength-header">
                <span class="strength-label">密码强度</span>
                <span class="strength-value" :style="{ color: passwordStrength.color }">
                  {{ passwordStrength.text }}
                </span>
              </div>
              <div class="strength-bar">
                <div
                  class="strength-fill"
                  :style="{
                    width: `${(passwordStrength.level / 5) * 100}%`,
                    backgroundColor: passwordStrength.color
                  }"
                ></div>
              </div>
              <div class="requirements">
                <div
                  v-for="req in passwordRequirements"
                  :key="req.text"
                  class="requirement"
                  :class="{ valid: req.valid }"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline v-if="req.valid" points="20 6 9 17 4 12"/>
                    <circle v-else cx="12" cy="12" r="10"/>
                  </svg>
                  {{ req.text }}
                </div>
              </div>
            </div>
            
            <div class="input-group">
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                class="input"
                :class="{ 'input-error': confirmPassword && confirmPassword !== password }"
                placeholder="确认密码"
                autocomplete="new-password"
              />
            </div>
            
            <p v-if="formError" class="error-message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {{ formError }}
            </p>
            
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              <span v-if="isLoading" class="loading-spinner"></span>
              <span v-else>创建账号</span>
            </button>
          </form>
          
          <div class="form-footer">
            <p>已有账号？<a href="#" class="link" @click.prevent="goToLogin">立即登录</a></p>
          </div>
        </div>

        <!-- Agreement Note -->
        <div class="agreement-note">
          <p>注册即表示您同意我们的<a href="#" class="link">服务条款</a>和<a href="#" class="link">隐私政策</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
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
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(236, 72, 153, 0.1) 100%);
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  top: 30%;
  left: -50px;
  animation-delay: -5s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  right: 10%;
  animation-delay: -10s;
}

.shape-4 {
  width: 250px;
  height: 250px;
  bottom: -100px;
  left: 20%;
  animation-delay: -15s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(-30px, -30px) rotate(5deg);
  }
  50% {
    transform: translate(0, -50px) rotate(0deg);
  }
  75% {
    transform: translate(30px, -30px) rotate(-5deg);
  }
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, transparent 0%, rgba(15, 15, 35, 0.8) 100%);
}

/* Register Card */
.register-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 440px;
}

.register-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px;
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
  margin-bottom: 32px;
}

.brand-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 14px;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
}

.brand-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

.brand-name {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6px;
  letter-spacing: -0.5px;
}

.brand-tagline {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  letter-spacing: 1px;
}

/* Form Section */
.form-section {
  margin-bottom: 24px;
}

.form-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 6px;
}

.form-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  margin-bottom: 28px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.4);
  pointer-events: none;
}

.input-icon svg {
  width: 100%;
  height: 100%;
}

.input {
  width: 100%;
  padding: 14px 44px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  transition: all 0.3s ease;
}

.input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.input:focus {
  outline: none;
  border-color: #a855f7;
  background: rgba(168, 85, 247, 0.1);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
}

.input-error {
  border-color: #ef4444;
}

.input-action {
  position: absolute;
  right: 10px;
  width: 30px;
  height: 30px;
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

.input-action:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.input-action svg {
  width: 16px;
  height: 16px;
}

/* Password Strength */
.password-strength {
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.strength-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.strength-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.strength-value {
  font-size: 12px;
  font-weight: 600;
}

.strength-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.requirements {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.requirement svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.requirement.valid {
  color: #22c55e;
}

.requirement.valid svg {
  color: #22c55e;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 13px;
}

.error-message svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn {
  width: 100%;
  padding: 14px 24px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  color: #fff;
  box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(168, 85, 247, 0.5);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 18px;
  height: 18px;
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
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.link {
  color: #a855f7;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.link:hover {
  color: #c084fc;
}

/* Agreement Note */
.agreement-note {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.agreement-note p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.agreement-note .link {
  color: rgba(255, 255, 255, 0.6);
}

/* Responsive */
@media (max-width: 480px) {
  .register-card {
    padding: 32px 20px;
  }
  
  .requirements {
    grid-template-columns: 1fr;
  }
}
</style>
