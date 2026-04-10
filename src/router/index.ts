import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'menu',
           // 菜单页面
      component: () => import('../views/GameMenuView.vue'),
    },
    {
      path: '/game',
      name: 'game',
      // 游戏页面
      component: () => import('../views/GameView.vue'),
    },
    {
      path: '/result',
      name: 'result',
      // 结算页面
      component: () => import('../views/ResultView.vue'),
    },
  ],
})

export default router