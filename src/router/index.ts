import { createRouter, createWebHashHistory } from 'vue-router';
import GameSetup from '../views/GameSetup.vue';
import GameBoard from '../views/GameBoard.vue';

const routes = [
  {
    path: '/',
    name: 'GameSetup',
    component: GameSetup
  },
  {
    path: '/game',
    name: 'GameBoard',
    component: GameBoard
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
