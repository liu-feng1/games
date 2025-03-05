import { createRouter, createWebHashHistory } from 'vue-router'
import Tetris from './views/Tetris.vue'
import GameList from './views/GameList.vue'
import Game2048 from './views/Game2048.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: GameList
  },
  {
    path: '/tetris',
    name: 'tetris',
    component: Tetris
  },
  {
    path: '/2048',
    name: '2048',
    component: Game2048
  }
]

const router = createRouter({
  history: createWebHashHistory(process.env.NODE_ENV === "production" ? "/games/" : ""),
  routes
})

export default router