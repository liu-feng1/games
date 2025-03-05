<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const games = [
  {
    id: 'tetris',
    title: '俄罗斯方块',
    description: '经典的俄罗斯方块游戏，使用键盘或触摸控制方块下落和旋转。',
    thumbnail: '/img/tetris.png'
  },
  {
    id: '2048',
    title: '2048',
    description: '益智数字游戏，通过滑动合并相同的数字，目标是得到2048。',
    thumbnail: '/img/2048.png'
  }
  // 后续可以添加更多游戏
]

const navigateToGame = (gameId) => {
  router.push(`/${gameId}`)
}
</script>

<template>
  <div class="game-list-container">
    <h1>小游戏合集</h1>
    <div class="game-grid">
      <div
        v-for="game in games"
        :key="game.id"
        class="game-card"
        @click="navigateToGame(game.id)"
      >
        <div class="game-thumbnail">
          <img :src="game.thumbnail" :alt="game.title" onerror="this.src='/vite.svg'">
        </div>
        <div class="game-info">
          <h2>{{ game.title }}</h2>
          <p>{{ game.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-list-container {
  padding: 1.2rem;
  max-width: 800px;
  margin: 0 auto;
  color: #2a3a2a;
}

.game-list-container h1 {
  color: #4a5a4a;
  text-align: center;
  margin-bottom: 2rem;
}

.game-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-top: 1rem;
}

.game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.2rem;
  background: #a8b8a8;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid #4a5a4a;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  background: #b8c8b8;
}

.game-thumbnail {
  width: 85%;
  height: 200px;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 2px solid #4a5a4a;
}

.game-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.game-info {
  padding: 0.8rem;
  width: 100%;
  text-align: center;
}

.game-info h2 {
  margin: 0 0 0.8rem;
  font-size: 1.3rem;
  color: #2a3a2a;
}

.game-info p {
  margin: 0;
  color: #4a5a4a;
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .game-grid {
    gap: 2rem;
  }

  .game-card {
    box-sizing: border-box;
    margin: 1rem;
    width: 100%;
  }

  .game-thumbnail {
    height: 160px;
  }

  .game-info {
    padding: 0.6rem;
  }

  .game-info h2 {
    font-size: 1.1rem;
    margin-bottom: 0.6rem;
  }

  .game-info p {
    font-size: 0.85rem;
  }
}
</style>