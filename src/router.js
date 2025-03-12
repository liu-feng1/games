import { createRouter, createWebHashHistory } from 'vue-router'
import Tetris from './views/Tetris.vue'
import GameList from './views/GameList.vue'
import Game2048 from './views/Game2048.vue'
import ThreeScene from './views/ThreeScene.vue'

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
  },
  {
    path: '/three',
    name: 'three',
    component: ThreeScene
  }
]

const router = createRouter({
  history: createWebHashHistory('./'),
  routes
})

export default router