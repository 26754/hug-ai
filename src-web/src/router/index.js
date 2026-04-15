import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 路由懒加载预取配置
const routeOptions = {
  Login: () => import('@/pages/Login.vue'),
  Register: () => import('@/pages/Register.vue'),
  Dashboard: () => import('@/pages/Dashboard.vue'),
  Home: () => import('@/pages/Home.vue'),
  Projects: () => import('@/pages/Projects.vue'),
  Novels: () => import('@/pages/Novels.vue'),
  Scripts: () => import('@/pages/Scripts.vue'),
  Characters: () => import('@/pages/Characters.vue'),
  Images: () => import('@/pages/Images.vue'),
  Videos: () => import('@/pages/Videos.vue'),
  Storyboard: () => import('@/pages/Storyboard.vue'),
  Workbench: () => import('@/pages/Workbench.vue'),
  Settings: () => import('@/pages/Setting/index.vue'),
  Profile: () => import('@/pages/Profile.vue'),
  CornerScape: () => import('@/pages/CornerScape/index.vue'),
}

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: routeOptions.Login,
    meta: { guest: true, title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: routeOptions.Register,
    meta: { guest: true, title: '注册' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: routeOptions.Dashboard,
    meta: { requiresAuth: true, title: '数据看板' }
  },
  {
    path: '/home',
    name: 'Home',
    component: routeOptions.Home,
    meta: { requiresAuth: true, title: '首页' }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: routeOptions.Projects,
    meta: { requiresAuth: true, title: '项目管理' }
  },
  {
    path: '/novels',
    name: 'Novels',
    component: routeOptions.Novels,
    meta: { requiresAuth: true, title: '小说编辑' }
  },
  {
    path: '/scripts',
    name: 'Scripts',
    component: routeOptions.Scripts,
    meta: { requiresAuth: true, title: '剧本编辑' }
  },
  {
    path: '/characters',
    name: 'Characters',
    component: routeOptions.Characters,
    meta: { requiresAuth: true, title: '角色素材' }
  },
  {
    path: '/storyboard',
    name: 'Storyboard',
    component: routeOptions.Storyboard,
    meta: { requiresAuth: true, title: '分镜设计' }
  },
  {
    path: '/images',
    name: 'Images',
    component: routeOptions.Images,
    meta: { requiresAuth: true, title: '图片素材' }
  },
  {
    path: '/videos',
    name: 'Videos',
    component: routeOptions.Videos,
    meta: { requiresAuth: true, title: '视频管理' }
  },
  {
    path: '/workbench/:projectId?/:scriptId?',
    name: 'Workbench',
    component: routeOptions.Workbench,
    meta: { requiresAuth: true, title: '工作台' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: routeOptions.Settings,
    meta: { requiresAuth: true, title: '系统设置' }
  },
  {
    path: '/settings/:tab',
    name: 'SettingsTab',
    component: routeOptions.Settings,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: routeOptions.Profile,
    meta: { requiresAuth: true, title: '个人信息' }
  },
  {
    path: '/cornerScape',
    name: 'CornerScape',
    component: routeOptions.CornerScape,
    meta: { requiresAuth: true, title: '全景素材' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 更新页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - HUG AI`
  }
  
  // 如果需要认证且未认证
  if (to.meta.requiresAuth) {
    if (!authStore.token) {
      return next({ name: 'Login', query: { redirect: to.fullPath } })
    }
  }
  
  // 如果是访客页面且已登录，跳转首页
  if (to.meta.guest && authStore.token) {
    return next({ name: 'Dashboard' })
  }
  
  next()
})

// 路由后置守卫 - 用于页面切换动画
router.afterEach((to, from) => {
  // 添加过渡动画类
  document.body.classList.add('page-transition')
  setTimeout(() => {
    document.body.classList.remove('page-transition')
  }, 300)
})

export default router
