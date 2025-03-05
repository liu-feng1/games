// 定义俄罗斯方块的形状
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]]  // Z
];

class Tetris {
    constructor() {
        this.init();
        this.createNewPiece();
        this.setupGame();
        this.setupHelpModal();
        this.setupScoreHistory();
    }

    setupScoreHistory() {
        // 初始化历史记录按钮
        const historyBtn = document.createElement('button');
        historyBtn.id = 'historyBtn';
        historyBtn.className = 'help-btn';
        historyBtn.textContent = '历史记录';
        document.querySelector('.game-info').appendChild(historyBtn);

        // 创建历史记录模态框
        const historyModal = document.createElement('div');
        historyModal.id = 'historyModal';
        historyModal.className = 'modal';
        historyModal.innerHTML = `
            <div class="modal-content">
                <button class="close-btn">&times;</button>
                <h2>历史记录</h2>
                <div id="scoreHistory"></div>
            </div>
        `;
        document.body.appendChild(historyModal);

        // 添加事件监听
        historyBtn.addEventListener('click', () => {
            this.showHistory();
        });

        const closeBtn = historyModal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            historyModal.classList.remove('show');
        });

        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) {
                historyModal.classList.remove('show');
            }
        });
    }

    saveScore() {
        const scores = JSON.parse(localStorage.getItem('tetrisScores') || '[]');
        const newScore = {
            score: this.score,
            lines: this.lines,
            level: this.level,
            date: new Date().toLocaleString()
        };
        scores.push(newScore);
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem('tetrisScores', JSON.stringify(scores));
    }

    showHistory() {
        const historyModal = document.getElementById('historyModal');
        const scoreHistory = document.getElementById('scoreHistory');
        const scores = JSON.parse(localStorage.getItem('tetrisScores') || '[]');

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
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
        `;
        document.head.appendChild(style);

        if (scores.length === 0) {
            scoreHistory.innerHTML = '<p>暂无记录</p>';
        } else {
            let html = '<div class="score-list">';
            scores.forEach((score, index) => {
                html += `
                    <div class="score-item">
                        <div class="score">${score.score}分</div>
                        <div class="date">${score.date}</div>
                    </div>
                `;
            });
            html += '</div>';
            scoreHistory.innerHTML = html;
        }

        historyModal.classList.add('show');
    }

    showGameOver() {
        const scores = JSON.parse(localStorage.getItem('tetrisScores') || '[]');
        const highScore = scores.length > 0 ? scores[0].score : 0;
        const isNewHighScore = this.score > highScore;

        // 创建游戏结束模态框
        const gameOverModal = document.createElement('div');
        gameOverModal.id = 'gameOverModal';
        gameOverModal.className = 'modal';
        gameOverModal.innerHTML = `
            <div class="modal-content">
                <h2>游戏结束</h2>
                <div class="game-over-info">
                    <p>最终得分：${this.score}</p>
                    ${isNewHighScore ? '<p class="high-score">恭喜你创造了新的最高分！</p>' : 
                     scores.length > 0 ? `<p>最高分：${highScore}</p>` : ''}
                </div>
                <button id="restartBtn" class="help-btn">重新开始</button>
            </div>
        `;
        document.body.appendChild(gameOverModal);

        // 添加重新开始按钮事件
        const restartBtn = gameOverModal.querySelector('#restartBtn');
        restartBtn.addEventListener('click', () => {
            document.body.removeChild(gameOverModal);
            this.restart();
        });

        gameOverModal.classList.add('show');
    }

    restart() {
        // 重置游戏状态
        this.board = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.currentPiece = null;
        this.currentPosition = { x: 0, y: 0 };

        // 更新显示
        this.updateScore();
        
        // 开始新游戏
        this.createNewPiece();
        this.draw();

        // 重新启动游戏循环
        const gameLoop = () => {
            if (!this.gameOver && !this.isPaused) {
                this.moveDown();
                this.draw();
                setTimeout(gameLoop, Math.max(100, 1000 - this.level * 100));
            } else if (this.gameOver) {
                this.saveScore();
                this.showGameOver();
            }
        };

        setTimeout(gameLoop, 1000);
    }

    init() {
        this.board = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.currentPiece = null;
        this.currentPosition = { x: 0, y: 0 };
        
        // 获取DOM元素
        this.boardElement = document.getElementById('gameBoard');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.linesElement = document.getElementById('lines');
        this.nextPieceElement = document.getElementById('nextPiece');
        this.pauseBtn = document.getElementById('pauseBtn');
        
        // 获取移动端控制按钮
        this.leftBtn = document.getElementById('leftBtn');
        this.rightBtn = document.getElementById('rightBtn');
        this.rotateBtn = document.getElementById('rotateBtn');
        this.dropBtn = document.getElementById('dropBtn');
        this.hardDropBtn = document.getElementById('hardDropBtn');
        
        // 用于跟踪长按状态
        this.dropBtnPressed = false;
        this.dropInterval = null;
        
        // 初始化游戏板
        this.boardElement.style.display = 'grid';
        const cellSize = window.matchMedia('(max-width: 768px)').matches ? '6vw' : '30px';
        this.boardElement.style.gridTemplateColumns = `repeat(10, ${cellSize})`;
        // this.boardElement.style.gap = window.matchMedia('(max-width: 768px)').matches ? '0.1vw' : '1px';
        
        // 创建格子
        for (let i = 0; i < 200; i++) {
            const cell = document.createElement('div');
            cell.style.width = cellSize;
            cell.style.height = cellSize;
            cell.style.backgroundColor = '#fff';
            cell.style.border = window.matchMedia('(max-width: 768px)').matches ? '0.1vw solid #ddd' : '1px solid #ddd';
            this.boardElement.appendChild(cell);
        }
    }

    setupHelpModal() {
        const helpBtn = document.getElementById('helpBtn');
        const helpModal = document.getElementById('helpModal');
        const closeBtn = helpModal.querySelector('.close-btn');

        helpBtn.addEventListener('click', () => {
            helpModal.classList.add('show');
        });

        closeBtn.addEventListener('click', () => {
            helpModal.classList.remove('show');
        });

        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.remove('show');
            }
        });
    }

    createNewPiece() {
        if (!this.nextPiece) {
            const shapeIndex = Math.floor(Math.random() * SHAPES.length);
            this.currentPiece = SHAPES[shapeIndex];
        } else {
            this.currentPiece = this.nextPiece;
        }

        const nextShapeIndex = Math.floor(Math.random() * SHAPES.length);
        this.nextPiece = SHAPES[nextShapeIndex];

        // 显示下一个方块
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

        this.currentPosition = {
            x: Math.floor((10 - this.currentPiece[0].length) / 2),
            y: 0
        };
        
        if (!this.isValidMove(this.currentPosition.x, this.currentPosition.y)) {
            this.gameOver = true;
        }
    }

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
    }

    moveDown() {
        if (this.isValidMove(this.currentPosition.x, this.currentPosition.y + 1)) {
            this.currentPosition.y++;
            return true;
        }
        this.placePiece();
        return false;
    }

    moveLeft() {
        if (this.isValidMove(this.currentPosition.x - 1, this.currentPosition.y)) {
            this.currentPosition.x--;
        }
    }

    moveRight() {
        if (this.isValidMove(this.currentPosition.x + 1, this.currentPosition.y)) {
            this.currentPosition.x++;
        }
    }

    rotate() {
        const rotated = this.currentPiece[0].map((_, i) =>
            this.currentPiece.map(row => row[row.length - 1 - i])
        );
        
        const originalPiece = this.currentPiece;
        this.currentPiece = rotated;
        
        if (!this.isValidMove(this.currentPosition.x, this.currentPosition.y)) {
            this.currentPiece = originalPiece;
        }
    }

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
    }

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
            
            this.updateScore();
        }
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.linesElement.textContent = this.lines;
    }

    draw() {
        const cells = this.boardElement.children;
        const colors = {
            0: '#222',
            1: '#222',  // 深色
            2: '#222',  // 深色
            3: '#222',  // 深色
            4: '#222',  // 深色
            5: '#222',  // 深色
            6: '#222',  // 深色
            7: '#222'   // 深色
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
    }

    setupGame() {
        this.pauseBtn.addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            this.pauseBtn.textContent = this.isPaused ? '继续' : '暂停';
        });

        // 键盘控制
        document.addEventListener('keydown', (e) => {
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
        });

        // 移动端控制
        // 左右移动按钮的长按处理
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
                                } else {
                                    clearInterval(moveInterval);
                                }
                            }, 100);
                        }
                    }, 300);
                }
            };

            const stopMoving = () => {
                isPressing = false;
                clearInterval(moveInterval);
                moveInterval = null;
            };

            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startMoving();
            });

            button.addEventListener('touchend', () => {
                stopMoving();
            });

            button.addEventListener('touchcancel', () => {
                stopMoving();
            });

            // 桌面端支持
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                startMoving();
            });

            button.addEventListener('mouseup', () => {
                stopMoving();
            });

            button.addEventListener('mouseleave', () => {
                stopMoving();
            });
        };

        if (this.leftBtn) {
            setupMoveButton(this.leftBtn, this.moveLeft);
        }

        if (this.rightBtn) {
            setupMoveButton(this.rightBtn, this.moveRight);
        }

        if (this.rotateBtn) {
            this.rotateBtn.addEventListener('click', () => {
                if (!this.gameOver && !this.isPaused) {
                    this.rotate();
                    this.draw();
                }
            });
        }

        if (this.dropBtn) {
            // 触摸开始事件
            this.dropBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.gameOver && !this.isPaused) {
                    this.dropBtnPressed = true;
                    // 设置定时器，延迟300ms后开始快速下落
                    setTimeout(() => {
                        if (this.dropBtnPressed) {
                            this.dropInterval = setInterval(() => {
                                if (!this.gameOver && !this.isPaused) {
                                    this.moveDown();
                                    this.draw();
                                } else {
                                    clearInterval(this.dropInterval);
                                }
                            }, 50);
                        }
                    }, 300);
                }
            });

            // 触摸结束事件
            this.dropBtn.addEventListener('touchend', () => {
                if (!this.gameOver && !this.isPaused) {
                    if (this.dropBtnPressed) {
                        // 如果按下时间小于300ms，执行直接落下
                        if (!this.dropInterval) {
                            while (this.moveDown()) {}
                            this.draw();
                        }
                        // 清理定时器和状态
                        clearInterval(this.dropInterval);
                        this.dropInterval = null;
                        this.dropBtnPressed = false;
                    }
                }
            });

            // 触摸取消事件
            this.dropBtn.addEventListener('touchcancel', () => {
                clearInterval(this.dropInterval);
                this.dropInterval = null;
                this.dropBtnPressed = false;
            });

            // 鼠标事件（用于桌面端测试）
            this.dropBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (!this.gameOver && !this.isPaused) {
                    this.dropBtnPressed = true;
                    setTimeout(() => {
                        if (this.dropBtnPressed) {
                            this.dropInterval = setInterval(() => {
                                if (!this.gameOver && !this.isPaused) {
                                    this.moveDown();
                                    this.draw();
                                } else {
                                    clearInterval(this.dropInterval);
                                }
                            }, 50);
                        }
                    }, 300);
                }
            });

            this.dropBtn.addEventListener('mouseup', () => {
                if (!this.gameOver && !this.isPaused) {
                    if (this.dropBtnPressed) {
                        if (!this.dropInterval) {
                            while (this.moveDown()) {}
                            this.draw();
                        }
                        clearInterval(this.dropInterval);
                        this.dropInterval = null;
                        this.dropBtnPressed = false;
                    }
                }
            });

            this.dropBtn.addEventListener('mouseleave', () => {
                clearInterval(this.dropInterval);
                this.dropInterval = null;
                this.dropBtnPressed = false;
            });
        }

        if (this.hardDropBtn) {
            this.hardDropBtn.addEventListener('click', () => {
                if (!this.gameOver && !this.isPaused) {
                    while (this.moveDown()) {}
                    this.draw();
                }
            });
        }

        // 游戏主循环
        const gameLoop = () => {
            if (!this.gameOver && !this.isPaused) {
                this.moveDown();
                this.draw();
                setTimeout(gameLoop, Math.max(100, 1000 - this.level * 100));
            } else if (this.gameOver) {
                this.saveScore();
                this.showGameOver();
            }
        };

        setTimeout(gameLoop, 1000);
    }
}

// 启动游戏
window.onload = () => {
    new Tetris();
};