<template>
  <div class="game-container">
    <div class="game-main">
      <div id="gameBoard"></div>
      <div class="game-info">
        <div class="info-box">
          <p>分数: <span id="score">{{ score }}</span></p>
        </div>
        <div class="info-box">
          <p>等级: <span id="level">{{ level }}</span></p>
        </div>
        <div class="info-box">
          <p>行数: <span id="lines">{{ lines }}</span></p>
        </div>
        <div class="info-box">
          <p>下一个:</p>
          <div id="nextPiece"></div>
        </div>
        <button id="helpBtn" class="help-btn" @click="showHelp">操作说明</button>
        <button id="pauseBtn" class="pause-btn" @click="togglePause">{{ isPaused ? '继续' : '暂停' }}</button>
        <button id="historyBtn" class="help-btn" @click="showHistory">历史记录</button>
      </div>
    </div>
    <div class="mobile-controls">
      <div class="mobile-controls-left">
        <button class="control-btn" id="leftBtn">←</button>
        <button class="control-btn" id="rotateBtn">↑</button>
        <button class="control-btn" id="rightBtn">→</button>
      </div>
      <div class="mobile-controls-right">
        <button class="control-btn" id="dropBtn">⏬</button>
      </div>
    </div>

    <!-- 帮助模态框 -->
    <div id="helpModal" class="modal" :class="{ show: showHelpModal }">
      <div class="modal-content">
        <button class="close-btn" @click="closeHelp">&times;</button>
        <h2>操作说明</h2>
        <p>桌面端：</p>
        <p>← →: 左右移动</p>
        <p>↑: 旋转</p>
        <p>↓: 加速下落</p>
        <p>空格: 直接下落</p>
        <p>移动端：</p>
        <p>← →: 左右移动</p>
        <p>↑: 旋转</p>
        <p>⏬: 点按直接下落，长按加速下落</p>
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
const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[1, 1, 1], [0, 1, 0]], // T
  [[1, 1, 1], [1, 0, 0]], // L
  [[1, 1, 1], [0, 0, 1]], // J
  [[1, 1, 0], [0, 1, 1]], // S
  [[0, 1, 1], [1, 1, 0]]  // Z
];

export default {
  name: 'Tetris',
  data() {
    return {
      board: [],
      score: 0,
      level: 1,
      lines: 0,
      gameOver: false,
      isPaused: false,
      currentPiece: null,
      nextPiece: null,
      currentPosition: { x: 0, y: 0 },
      dropBtnPressed: false,
      dropInterval: null,
      showHelpModal: false,
      showHistoryModal: false,
      scores: [],
      highScore: 0,
      isNewHighScore: false,
      gameLoop: null
    }
  },
  mounted() {
    this.init();
    this.createNewPiece();
    this.setupGame();
    this.loadScores();
  },
  methods: {
    init() {
      this.board = Array(20).fill().map(() => Array(10).fill(0));
      this.boardElement = document.getElementById('gameBoard');
      this.nextPieceElement = document.getElementById('nextPiece');

      // 初始化游戏板
      this.boardElement.style.display = 'grid';
      const cellSize = window.matchMedia('(max-width: 768px)').matches ? '6vw' : '30px';
      this.boardElement.style.gridTemplateColumns = `repeat(10, ${cellSize})`;

      // 创建格子
      for (let i = 0; i < 200; i++) {
        const cell = document.createElement('div');
        cell.style.width = cellSize;
        cell.style.height = cellSize;
        cell.style.backgroundColor = '#fff';
        cell.style.border = window.matchMedia('(max-width: 768px)').matches ? '0.1vw solid #ddd' : '1px solid #ddd';
        this.boardElement.appendChild(cell);
      }

      // 设置移动端控制
      this.setupMobileControls();
    },
    createNewPiece() {
      if (!this.nextPiece) {
        const shapeIndex = Math.floor(Math.random() * SHAPES.length);
        this.currentPiece = SHAPES[shapeIndex];
      } else {
        this.currentPiece = this.nextPiece;
      }

      const nextShapeIndex = Math.floor(Math.random() * SHAPES.length);
      this.nextPiece = SHAPES[nextShapeIndex];

      this.showNextPiece();
      
      this.currentPosition = {
        x: Math.floor((10 - this.currentPiece[0].length) / 2),
        y: 0
      };
      
      if (!this.isValidMove(this.currentPosition.x, this.currentPosition.y)) {
        this.gameOver = true;
        this.saveScore();
      }
    },
    showNextPiece() {
      this.nextPieceElement.innerHTML = '';
      this.nextPieceElement.style.display = 'grid';
      this.nextPieceElement.style.gridTemplateColumns = `repeat(${this.nextPiece[0].length}, 20px)`;
      this.nextPieceElement.style.gap = '1px';
      this.nextPieceElement.style.padding = '10px';
      this.nextPieceElement.style.backgroundColor = '#b8c8b8';
      this.nextPieceElement.style.borderRadius = '4px';

      for (let row = 0; row < this.nextPiece.length; row++) {
        for (let col = 0; col < this.nextPiece[row].length; col++) {
          const cell = document.createElement('div');
          cell.style.width = '20px';
          cell.style.height = '20px';
          cell.style.backgroundColor = this.nextPiece[row][col] ? '#222' : '#c3d4c3';
          cell.style.border = '1px solid #ddd';
          this.nextPieceElement.appendChild(cell);
        }
      }
    },
    isValidMove(x, y) {
      for (let row = 0; row < this.currentPiece.length; row++) {
        for (let col = 0; col < this.currentPiece[row].length; col++) {
          if (this.currentPiece[row][col]) {
            const newX = x + col;
            const newY = y + row;
            
            if (newX < 0 || newX >= 10 || newY >= 20) return false;
            if (newY >= 0 && this.board[newY][newX]) return false;
          }
        }
      }
      return true;
    },
    moveDown() {
      if (this.isValidMove(this.currentPosition.x, this.currentPosition.y + 1)) {
        this.currentPosition.y++;
        return true;
      }
      this.placePiece();
      return false;
    },
    moveLeft() {
      if (this.isValidMove(this.currentPosition.x - 1, this.currentPosition.y)) {
        this.currentPosition.x--;
      }
    },
    moveRight() {
      if (this.isValidMove(this.currentPosition.x + 1, this.currentPosition.y)) {
        this.currentPosition.x++;
      }
    },
    rotate() {
      const rotated = this.currentPiece[0].map((_, i) =>
        this.currentPiece.map(row => row[row.length - 1 - i])
      );
      
      const originalPiece = this.currentPiece;
      this.currentPiece = rotated;
      
      if (!this.isValidMove(this.currentPosition.x, this.currentPosition.y)) {
        this.currentPiece = originalPiece;
      }
    },
    placePiece() {
      for (let row = 0; row < this.currentPiece.length; row++) {
        for (let col = 0; col < this.currentPiece[row].length; col++) {
          if (this.currentPiece[row][col]) {
            const boardY = this.currentPosition.y + row;
            if (boardY >= 0) {
              this.board[boardY][this.currentPosition.x + col] = 1;
            }
          }
        }
      }
      this.checkLines();
      this.createNewPiece();
    },
    checkLines() {
      let linesCleared = 0;
      for (let row = this.board.length - 1; row >= 0; row--) {
        if (this.board[row].every(cell => cell === 1)) {
          this.board.splice(row, 1);
          this.board.unshift(Array(10).fill(0));
          linesCleared++;
          row++;
        }
      }
      
      if (linesCleared > 0) {
        this.lines += linesCleared;
        this.score += linesCleared * 100 * this.level;
        this.level = Math.floor(this.lines / 10) + 1;
      }
    },
    draw() {
      const cells = this.boardElement.children;
      const colors = {
        0: '#222',
        1: '#222'
      };
      
      // 清空游戏板
      for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
          const index = row * 10 + col;
          cells[index].style.backgroundColor = this.board[row][col] ? colors[this.board[row][col]] : '#c3d4c3';
        }
      }
      
      // 绘制当前方块
      for (let row = 0; row < this.currentPiece.length; row++) {
        for (let col = 0; col < this.currentPiece[row].length; col++) {
          if (this.currentPiece[row][col]) {
            const boardY = this.currentPosition.y + row;
            if (boardY >= 0) {
              const index = boardY * 10 + this.currentPosition.x + col;
              cells[index].style.backgroundColor = colors[this.currentPiece[row][col]];
            }
          }
        }
      }
    },
    setupGame() {
      // 键盘控制
      document.addEventListener('keydown', this.handleKeydown);

      // 开始游戏循环
      this.startGameLoop();
    },
    handleKeydown(e) {
      if (!this.gameOver && !this.isPaused) {
        switch (e.key) {
          case 'ArrowLeft':
            this.moveLeft();
            break;
          case 'ArrowRight':
            this.moveRight();
            break;
          case 'ArrowUp':
            this.rotate();
            break;
          case 'ArrowDown':
            this.moveDown();
            break;
          case ' ':
            while (this.moveDown()) {}
            break;
        }
        this.draw();
      }
    },
    setupMobileControls() {
      const setupMoveButton = (button, moveFunction) => {
        let moveInterval = null;
        let isPressing = false;

        const startMoving = () => {
          if (!this.gameOver && !this.isPaused) {
            isPressing = true;
            moveFunction.call(this);
            this.draw();
            
            setTimeout(() => {
              if (isPressing) {
                moveInterval = setInterval(() => {
                  if (!this.gameOver && !this.isPaused) {
                    moveFunction.call(this);
                    this.draw();
                  }
                }, 100);
              }
            }, 200);
          }
        };

        const stopMoving = () => {
          isPressing = false;
          if (moveInterval) {
            clearInterval(moveInterval);
            moveInterval = null;
          }
        };

        button.addEventListener('touchstart', startMoving);
        button.addEventListener('touchend', stopMoving);
        button.addEventListener('mousedown', startMoving);
        button.addEventListener('mouseup', stopMoving);
        button.addEventListener('mouseleave', stopMoving);
      };

      setupMoveButton(document.getElementById('leftBtn'), this.moveLeft);
      setupMoveButton(document.getElementById('rightBtn'), this.moveRight);

      const rotateBtn = document.getElementById('rotateBtn');
      rotateBtn.addEventListener('click', () => {
        if (!this.gameOver && !this.isPaused) {
          this.rotate();
          this.draw();
        }
      });

      const dropBtn = document.getElementById('dropBtn');
      dropBtn.addEventListener('touchstart', () => {
        if (!this.gameOver && !this.isPaused) {
          this.dropBtnPressed = true;
          while (this.moveDown()) {}
          this.draw();
        }
      });

      dropBtn.addEventListener('touchend', () => {
        this.dropBtnPressed = false;
      });
    },
    startGameLoop() {
      const gameLoop = () => {
        if (!this.gameOver && !this.isPaused) {
          this.moveDown();
          this.draw();
        }
        setTimeout(gameLoop, Math.max(100, 1000 - this.level * 100));
      };
      setTimeout(gameLoop, 1000);
    },
    showHelp() {
      this.showHelpModal = true;
      this.isPaused = true;
    },
    closeHelp() {
      this.showHelpModal = false;
      this.isPaused = false;
    },
    showHistory() {
      this.showHistoryModal = true;
      this.isPaused = true;
    },
    closeHistory() {
      this.showHistoryModal = false;
      this.isPaused = false;
    },
    togglePause() {
      this.isPaused = !this.isPaused;
    },
    restart() {
      this.board = Array(20).fill().map(() => Array(10).fill(0));
      this.score = 0;
      this.level = 1;
      this.lines = 0;
      this.gameOver = false;
      this.isPaused = false;
      this.createNewPiece();
      this.draw();
    },
    loadScores() {
      const savedScores = localStorage.getItem('tetrisScores');
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
      
      localStorage.setItem('tetrisScores', JSON.stringify(this.scores));
      
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

.pause-btn,
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

.pause-btn:hover,
.help-btn:hover {
  background-color: #3a4a3a;
}

#gameBoard {
  background-color: #c3d4c3;
}

.mobile-controls {
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  padding: 20px;
  margin-top: 20px;
}

.mobile-controls-left {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto;
  gap: 10px;
}

.mobile-controls-left #rotateBtn {
  grid-row: 1;
  grid-column: 2;
  margin-bottom: 10px;
}

.mobile-controls-left #leftBtn {
  grid-row: 2;
  grid-column: 1;
}

.mobile-controls-left #rightBtn {
  grid-row: 2;
  grid-column: 3;
}

.mobile-controls-right {
  display: flex;
  align-items: center;
  margin-left: 20px;
}

.control-btn {
  width: 50px;
  height: 50px;
  padding: 0;
  background-color: #4a5a4a;
  color: #c3d4c3;
  border: none;
  border-radius: 8px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

#dropBtn {
  width: 70px;
  height: 70px;
}

.control-btn:active {
  background-color: #3a4a3a;
  transform: translateY(1px);
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
    justify-content: center;
  }

  #gameBoard {
    width: 70vw;
    /* max-height: 70vh; */
  }

  .game-info {
    flex: none;
    font-size: 14px;
    margin-left: 10px;
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2vh;
  }

  .mobile-controls-left {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto auto;
    gap: 2vw;
    padding-left: 2vw;
  }

  .mobile-controls-left #rotateBtn {
    grid-row: 1;
    grid-column: 2;
    margin-bottom: 2vw;
  }

  .mobile-controls-left #leftBtn {
    grid-row: 2;
    grid-column: 1;
  }

  .mobile-controls-left #rightBtn {
    grid-row: 2;
    grid-column: 3;
  }

  .mobile-controls-right {
    margin-right: 2vw;
  }

  .control-btn {
    width: 12vw;
    height: 12vw;
    font-size: 6vw;
    border-radius: 2vw;
    background-color: #4a5a4a;
    color: #c3d4c3;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
    transition: transform 0.1s, background-color 0.2s;
  }

  #dropBtn {
    width: 16vw;
    height: 16vw;
    font-size: 8vw;
  }

  .control-btn:active {
    background-color: #3a4a3a;
    transform: scale(0.95);
  }

  #hardDropBtn {
    display: none;
  }

  .modal-content {
    margin: 20px;
    max-width: calc(100% - 40px);
  }
}
</style>