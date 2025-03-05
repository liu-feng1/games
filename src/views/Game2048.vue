<template>
  <div class="game-container">
    <div class="game-main">
      <div id="gameBoard"></div>
      <div class="game-info">
        <div class="info-box">
          <p>分数: <span id="score">{{ score }}</span></p>
        </div>
        <div class="info-box">
          <p>最高分: <span id="highScore">{{ highScore }}</span></p>
        </div>
        <button id="restartBtn" class="help-btn" @click="restart">重新开始</button>
        <button id="historyBtn" class="help-btn" @click="showHistory">历史记录</button>
      </div>
    </div>

    <!-- 帮助模态框 -->
    <div id="helpModal" class="modal" :class="{ show: showHelpModal }">
      <div class="modal-content">
        <button class="close-btn" @click="closeHelp">&times;</button>
        <h2>操作说明</h2>
        <p>桌面端：</p>
        <p>← → ↑ ↓: 方向键控制方块移动</p>
        <p>移动端：</p>
        <p>滑动屏幕控制方块移动</p>
      </div>
    </div>

    <!-- 历史记录模态框 -->
    <div id="historyModal" class="modal" :class="{ show: showHistoryModal }">
      <div class="modal-content">
        <button class="close-btn" @click="closeHistory">&times;</button>
        <h2>历史记录</h2>
        <div id="scoreHistory">
          <div v-if="scores.length === 0">
            <p>暂无记录</p>
          </div>
          <div v-else class="score-list">
            <div v-for="(score, index) in scores" :key="index" class="score-item">
              <div class="score">{{ score.score }}分</div>
              <div class="date">{{ score.date }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏结束模态框 -->
    <div id="gameOverModal" class="modal" :class="{ show: gameOver }">
      <div class="modal-content">
        <h2>游戏结束</h2>
        <div class="game-over-info">
          <p>最终得分：{{ score }}</p>
          <p v-if="isNewHighScore" class="high-score">恭喜你创造了新的最高分！</p>
          <p v-else-if="highScore > 0">最高分：{{ highScore }}</p>
        </div>
        <button id="restartBtn" class="help-btn" @click="restart">重新开始</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Game2048',
  data() {
    return {
      board: [],
      score: 0,
      highScore: 0,
      gameOver: false,
      showHelpModal: false,
      showHistoryModal: false,
      scores: [],
      isNewHighScore: false
    }
  },
  mounted() {
    this.init();
    this.setupGame();
    this.loadScores();
  },
  methods: {
    init() {
      this.board = Array(4).fill().map(() => Array(4).fill(0));
      this.boardElement = document.getElementById('gameBoard');

      // 初始化游戏板
      this.boardElement.style.display = 'grid';
      const cellSize = window.matchMedia('(max-width: 768px)').matches ? '20vw' : '100px';
      this.boardElement.style.gridTemplateColumns = `repeat(4, ${cellSize})`;
      this.boardElement.style.gap = window.matchMedia('(max-width: 768px)').matches ? '2vw' : '10px';

      // 创建格子
      for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.style.width = cellSize;
        cell.style.height = cellSize;
        this.boardElement.appendChild(cell);
      }

      // 初始添加两个数字
      this.addNewNumber();
      this.addNewNumber();
      this.draw();

      // 设置移动端控制
      this.setupMobileControls();
    },
    addNewNumber() {
      const emptyCells = [];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (this.board[i][j] === 0) {
            emptyCells.push({ x: i, y: j });
          }
        }
      }

      if (emptyCells.length > 0) {
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.board[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
      }
    },
    draw() {
      const cells = this.boardElement.children;
      const colors = {
        0: '#c3d4c3',
        2: '#eee4da',
        4: '#ede0c8',
        8: '#f2b179',
        16: '#f59563',
        32: '#f67c5f',
        64: '#f65e3b',
        128: '#edcf72',
        256: '#edcc61',
        512: '#edc850',
        1024: '#edc53f',
        2048: '#edc22e'
      };

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const value = this.board[i][j];
          const cell = cells[i * 4 + j];
          cell.textContent = value || '';
          cell.style.backgroundColor = colors[value] || '#edc22e';
          cell.style.color = value <= 4 ? '#776e65' : '#f9f6f2';
          cell.style.fontSize = value >= 1024 ? '24px' : '32px';
        }
      }
    },
    setupGame() {
      // 键盘控制
      document.addEventListener('keydown', this.handleKeydown);
    },
    handleKeydown(e) {
      if (!this.gameOver) {
        let moved = false;
        switch (e.key) {
          case 'ArrowLeft':
            moved = this.moveLeft();
            break;
          case 'ArrowRight':
            moved = this.moveRight();
            break;
          case 'ArrowUp':
            moved = this.moveUp();
            break;
          case 'ArrowDown':
            moved = this.moveDown();
            break;
        }

        if (moved) {
          this.addNewNumber();
          this.draw();
          this.checkGameOver();
        }
      }
    },
    setupMobileControls() {
      let touchStartX = 0;
      let touchStartY = 0;
      const minSwipeDistance = 30;

      this.boardElement.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      });

      this.boardElement.addEventListener('touchmove', (e) => {
        e.preventDefault();
      });

      this.boardElement.addEventListener('touchend', (e) => {
        if (this.gameOver) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (Math.max(absDeltaX, absDeltaY) < minSwipeDistance) return;

        let moved = false;
        if (absDeltaX > absDeltaY) {
          // 水平滑动
          if (deltaX > 0) {
            moved = this.moveRight();
          } else {
            moved = this.moveLeft();
          }
        } else {
          // 垂直滑动
          if (deltaY > 0) {
            moved = this.moveDown();
          } else {
            moved = this.moveUp();
          }
        }

        if (moved) {
          this.addNewNumber();
          this.draw();
          this.checkGameOver();
        }
      });
    },
    moveLeft() {
      return this.move((row) => {
        const newRow = row.filter(cell => cell !== 0);
        for (let i = 0; i < newRow.length - 1; i++) {
          if (newRow[i] === newRow[i + 1]) {
            newRow[i] *= 2;
            this.score += newRow[i];
            newRow.splice(i + 1, 1);
          }
        }
        while (newRow.length < 4) newRow.push(0);
        return newRow;
      });
    },
    moveRight() {
      return this.move((row) => {
        const newRow = row.filter(cell => cell !== 0);
        for (let i = newRow.length - 1; i > 0; i--) {
          if (newRow[i] === newRow[i - 1]) {
            newRow[i] *= 2;
            this.score += newRow[i];
            newRow.splice(i - 1, 1);
            i--;
          }
        }
        while (newRow.length < 4) newRow.unshift(0);
        return newRow;
      });
    },
    moveUp() {
      return this.move((col) => {
        const newCol = col.filter(cell => cell !== 0);
        for (let i = 0; i < newCol.length - 1; i++) {
          if (newCol[i] === newCol[i + 1]) {
            newCol[i] *= 2;
            this.score += newCol[i];
            newCol.splice(i + 1, 1);
          }
        }
        while (newCol.length < 4) newCol.push(0);
        return newCol;
      }, true);
    },
    moveDown() {
      return this.move((col) => {
        const newCol = col.filter(cell => cell !== 0);
        for (let i = newCol.length - 1; i > 0; i--) {
          if (newCol[i] === newCol[i - 1]) {
            newCol[i] *= 2;
            this.score += newCol[i];
            newCol.splice(i - 1, 1);
            i--;
          }
        }
        while (newCol.length < 4) newCol.unshift(0);
        return newCol;
      }, true);
    },
    move(callback, isVertical = false) {
      const oldBoard = JSON.stringify(this.board);
      
      if (isVertical) {
        // 处理列
        for (let j = 0; j < 4; j++) {
          const column = this.board.map(row => row[j]);
          const newColumn = callback(column);
          for (let i = 0; i < 4; i++) {
            this.board[i][j] = newColumn[i];
          }
        }
      } else {
        // 处理行
        for (let i = 0; i < 4; i++) {
          this.board[i] = callback([...this.board[i]]);
        }
      }

      return oldBoard !== JSON.stringify(this.board);
    },
    checkGameOver() {
      // 检查是否还有空格
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (this.board[i][j] === 0) return;
        }
      }

      // 检查是否还能合并
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          if (this.board[i][j] === this.board[i][j + 1]) return;
        }
      }
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 3; i++) {
          if (this.board[i][j] === this.board[i + 1][j]) return;
        }
      }

      this.gameOver = true;
      this.saveScore();
    },
    showHelp() {
      this.showHelpModal = true;
    },
    closeHelp() {
      this.showHelpModal = false;
    },
    showHistory() {
      this.showHistoryModal = true;
    },
    closeHistory() {
      this.showHistoryModal = false;
    },
    restart() {
      this.board = Array(4).fill().map(() => Array(4).fill(0));
      this.score = 0;
      this.gameOver = false;
      this.isNewHighScore = false;
      this.addNewNumber();
      this.addNewNumber();
      this.draw();
    },
    loadScores() {
      const savedScores = localStorage.getItem('game2048Scores');
      if (savedScores) {
        this.scores = JSON.parse(savedScores);
        this.highScore = Math.max(...this.scores.map(s => s.score));
      }
    },
    saveScore() {
      const currentDate = new Date().toLocaleDateString();
      const scoreEntry = {
        score: this.score,
        date: currentDate
      };
      
      this.scores.push(scoreEntry);
      this.scores.sort((a, b) => b.score - a.score);
      this.scores = this.scores.slice(0, 10);
      
      localStorage.setItem('game2048Scores', JSON.stringify(this.scores));
      
      if (this.score > this.highScore) {
        this.highScore = this.score;
        this.isNewHighScore = true;
      }
    }
  }
}
</script>

<style scoped>
body {
  touch-action: none;
}

.game-container {
  background-color: #a8b8a8;
  border: 8px solid #4a5a4a;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.game-main {
  display: flex;
}

.game-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px;
  min-width: 120px;
}

.info-box {
  padding: 15px;
  border-radius: 8px;
  color: #2a3a2a;
  background-color: #b8c8b8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-box p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.info-box span {
  font-size: 20px;
  font-weight: bold;
  color: #4a5a4a;
}

.help-btn {
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #4a5a4a;
  color: #c3d4c3;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
  transition: all 0.3s ease;
}

.help-btn:hover {
  background-color: #3a4a3a;
}

#gameBoard {
  background-color: #c3d4c3;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.grid-cell {
  background-color: #c3d4c3;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  transition: all 0.15s ease-in-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}



.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.modal.show {
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #a8b8a8;
  padding: 30px;
  border-radius: 10px;
  position: relative;
  max-width: 95%;
  width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.close-btn {
  position: absolute;
  right: 15px;
  top: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #4a5a4a;
}

.close-btn:hover {
  color: #2a3a2a;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #4a5a4a;
  font-size: 24px;
}

.modal-content p {
  margin: 15px 0;
  color: #4a5a4a;
  font-size: 16px;
  line-height: 1.5;
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #c3d4c3;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.score-item .score {
  font-size: 24px;
  font-weight: bold;
  color: #4a5a4a;
}

.score-item .date {
  color: #6a7a6a;
  font-size: 14px;
}

.high-score {
  color: #4a5d4a;
  font-weight: bold;
}

@media (max-width: 768px) {
  body {
    overflow: hidden;
    width: 100vw;
    height: 100vh;
    padding: 0;
    margin: 0;
  }

  .game-container {
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    justify-content: flex-start;
    align-items: center;
    gap: 10px;
  }

  .game-main {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .game-info {
    flex: none;
    font-size: 14px;
    margin: 10px;
    min-width: 80px;
    gap: 10px;
  }

  .info-box {
    padding: 10px;
  }

  .info-box p {
    font-size: 14px;
  }

  .info-box span {
    font-size: 16px;
  }

  .mobile-controls {
    width: 100%;
    padding: 2vh;
    gap: 2vh;
  }

  .mobile-controls-row {
    gap: 2vw;
  }

  .control-btn {
    width: 12vw;
    height: 12vw;
    font-size: 6vw;
    border-radius: 2vw;
  }

  .modal-content {
    margin: 20px;
    max-width: calc(100% - 40px);
  }
}
</style>