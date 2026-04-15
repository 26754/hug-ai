import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('@/pages/Projects.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/novels',
    name: 'Novels',
    component: () => import('@/pages/Novels.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/scripts',
    name: 'Scripts',
    component: () => import('@/pages/Scripts.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/characters',
    name: 'Characters',
    component: () => import('@/pages/Characters.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/storyboard',
    name: 'Storyboard',
    component: () => import('@/pages/Storyboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/images',
    name: 'Images',
    component: () => import('@/pages/Images.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/videos',
    name: 'Videos',
    component: () => import('@/pages/Videos.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 如果需要认证且未认证
  if (to.meta.requiresAuth) {
    // 先检查是否有 token
    if (!authStore.token) {
      return next({ name: 'Login' })
    }
    
    // 如果有 token 但没有用户信息，尝试获取
    if (!authStore.user) {
      try {
        await authStore.checkAuth()
        if (!authStore.user) {
          return next({ name: 'Login' })
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        return next({ name: 'Login' })
      }
    }
    
    return next()
  }
  
  // 如果是游客页面且已登录，重定向到首页
  if (to.meta.guest && authStore.isAuthenticated) {
    return next({ name: 'Home' })
  }
  
  next()
})

export default router
