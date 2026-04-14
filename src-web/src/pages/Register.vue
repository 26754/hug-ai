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
    { text: '非常弱', color: 'var(--danger)' },
    { text: '弱', color: 'var(--warning)' },
    { text: '中等', color: '#f59e0b' },
    { text: '强', color: 'var(--success)' },
    { text: '非常强', color: 'var(--success)' }
  ]
  
  return { level: strength, ...levels[strength - 1] }
})

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
  
  const result = await authStore.register(email.value, password.value, username.value)
  
  if (result.success) {
    if (result.needRelogin) {
      router.push('/login')
    } else {
      router.push('/home')
    }
  } else {
    formError.value = result.message
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-card card fade-in">
      <div class="register-header">
        <h1 class="logo">Toonflow</h1>
        <p class="subtitle">创建您的账号</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input
            v-model="email"
            type="email"
            class="input"
            placeholder="请输入邮箱"
            autocomplete="email"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">用户名（可选）</label>
          <input
            v-model="username"
            type="text"
            class="input"
            placeholder="请输入用户名"
            autocomplete="username"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="password-input">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="input"
              placeholder="至少 8 个字符，包含大小写字母和数字"
              autocomplete="new-password"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
          <div v-if="password" class="password-strength">
            <div class="strength-bar">
              <div
                class="strength-fill"
                :style="{
                  width: `${(passwordStrength.level / 5) * 100}%`,
                  backgroundColor: passwordStrength.color
                }"
              ></div>
            </div>
            <span class="strength-text" :style="{ color: passwordStrength.color }">
              {{ passwordStrength.text }}
            </span>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">确认密码</label>
          <input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            class="input"
            placeholder="请再次输入密码"
            autocomplete="new-password"
          />
        </div>
        
        <p v-if="formError" class="form-error">{{ formError }}</p>
        
        <button type="submit" class="btn btn-primary btn-block" :disabled="authStore.loading">
          <span v-if="authStore.loading" class="spinner"></span>
          <span v-else>注册</span>
        </button>
      </form>
      
      <div class="register-footer">
        <p>
          已有账号？
          <a href="#" class="link" @click.prevent="goToLogin">立即登录</a>
        </p>
      </div>
    </div>
    
    <div class="register-decoration">
      <div class="decoration-circle circle-1"></div>
      <div class="decoration-circle circle-2"></div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.register-card {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  z-index: 10;
}

.register-header {
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

.register-form {
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

.password-strength {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
}

.btn-block {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  margin-top: 8px;
}

.register-footer {
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.register-decoration {
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
  width: 500px;
  height: 500px;
  background: var(--primary);
  top: -150px;
  left: -150px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: var(--primary-light);
  bottom: -100px;
  right: -100px;
}
</style>
