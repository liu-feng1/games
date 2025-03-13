<template>
  <div class="container">
    <div id="scene-container"></div>
    <!-- 加载提示蒙层 -->
    <div class="loading-overlay" v-if="isLoading">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">模型加载中...</div>
      </div>
    </div>
    <div class="joystick-container" ref="joystickContainer">
      <div class="joystick-base">
        <div class="joystick-handle" ref="joystickHandle"></div>
      </div>
    </div>
    <div
      class="controls"
      :class="{ expanded: isControlsExpanded }"
    >
      <button class="toggle-btn" @click="toggleControls">
        {{ isControlsExpanded ? "收起" : "展开" }}
      </button>
      <div class="controls-content">
        <!-- <div class="control-group">
          <h3>人物控制</h3>
          <button @click="setAction('armature')">奔跑</button>
          <button @click="stopAnimation">停止</button>
        </div> -->
        <div class="control-group">
          <h3>速度设置</h3>
          <div class="speed-options">
            <button @click="setSpeed('verySlow')" :class="{ active: currentSpeed === 'verySlow' }">极慢</button>
            <button @click="setSpeed('slow')" :class="{ active: currentSpeed === 'slow' }">慢</button>
            <button @click="setSpeed('medium')" :class="{ active: currentSpeed === 'medium' }">适中</button>
            <button @click="setSpeed('fast')" :class="{ active: currentSpeed === 'fast' }">快</button>
            <button @click="setSpeed('veryFast')" :class="{ active: currentSpeed === 'veryFast' }">极快</button>
          </div>
        </div>
        <!-- <div class="control-group">
          <h3>颜色修改</h3>
          <div class="color-picker">
            <label for="character-color">人物颜色:</label>
            <input
              type="color"
              v-model="characterColor"
              @input="updateCharacterColor"
            />
          </div>
        </div>
        <div class="control-group">
          <h3>光源控制</h3>
          <div class="light-control">
            <h4>环境光</h4>
            <div class="slider-group">
              <label>强度:</label>
              <input
                type="range"
                v-model="ambientLightIntensity"
                min="0"
                max="2"
                step="0.1"
              />
              <span>{{ ambientLightIntensity }}</span>
            </div>
            <div class="color-picker">
              <label>颜色:</label>
              <input type="color" v-model="ambientLightColor" />
            </div>
          </div>
          <div class="light-control">
            <h4>半球光</h4>
            <div class="slider-group">
              <label>强度:</label>
              <input
                type="range"
                v-model="hemisphereLightIntensity"
                min="0"
                max="2"
                step="0.1"
              />
              <span>{{ hemisphereLightIntensity }}</span>
            </div>
            <div class="color-picker">
              <label>颜色:</label>
              <input type="color" v-model="hemisphereLightColor" />
            </div>
          </div>
          <div class="light-control">
            <h4>方向光</h4>
            <div class="slider-group">
              <label>强度:</label>
              <input
                type="range"
                v-model="directionalLightIntensity"
                min="0"
                max="2"
                step="0.1"
              />
              <span>{{ directionalLightIntensity }}</span>
            </div>
            <div class="color-picker">
              <label>颜色:</label>
              <input type="color" v-model="directionalLightColor" />
            </div>
          </div>
        </div>
        <div class="control-group">
          <h3>曝光度控制</h3>
          <div class="slider-group">
            <label>曝光度:</label>
            <input type="range" v-model="exposure" min="0" max="2" step="0.1" />
            <span>{{ exposure }}</span>
          </div>
        </div> -->
        <div class="control-group">
          <h3>雨天效果</h3>
          <button @click="toggleRain">
            {{ isRaining ? "关闭" : "开启" }}下雨
          </button>
          <div class="slider-group">
            <label>雨量强度:</label>
            <input
              type="range"
              v-model="rainIntensity"
              min="0.1"
              max="2"
              step="0.1"
            />
            <span>{{ rainIntensity }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { onMounted, onBeforeUnmount, ref, watch, reactive } from "vue";

// 控制面板展开状态
const isControlsExpanded = ref(false);
// 人物颜色
const characterColor = ref("#3366ff");
// 速度设置
const currentSpeed = ref('medium');
const speedValues = {
  verySlow: 0.005,
  slow: 0.01,
  medium: 0.02,
  fast: 0.03,
  veryFast: 0.04
};

// 光源控制参数
const ambientLightIntensity = ref(0.7);
const hemisphereLightIntensity = ref(1.0);
const directionalLightIntensity = ref(1.0);
const ambientLightColor = ref("#ffffff");
const hemisphereLightColor = ref("#ffffff");
const directionalLightColor = ref("#ffffff");
// 曝光度控制
const exposure = ref(1.8);

// 窗口尺寸
const windowSize = ref({
  width: window.innerWidth,
  height: window.innerHeight,
});

// 切换控制面板展开状态
function toggleControls() {
  isControlsExpanded.value = !isControlsExpanded.value;
}

// 更新窗口尺寸
function handleResize() {
  windowSize.value = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

// 更新光源参数
function updateLights() {
  if (scene) {
    scene.traverse((node) => {
      if (node instanceof THREE.AmbientLight) {
        node.intensity = ambientLightIntensity.value;
        node.color.set(ambientLightColor.value);
      } else if (node instanceof THREE.HemisphereLight) {
        node.intensity = hemisphereLightIntensity.value;
        node.color.set(hemisphereLightColor.value);
      } else if (node instanceof THREE.DirectionalLight) {
        node.intensity = directionalLightIntensity.value;
        node.color.set(directionalLightColor.value);
      }
    });
  }
}

// 更新曝光度
function updateExposure() {
  if (renderer) {
    renderer.toneMappingExposure = exposure.value;
  }
}

// 监听光源参数变化
watch(
  [
    ambientLightIntensity,
    hemisphereLightIntensity,
    directionalLightIntensity,
    ambientLightColor,
    hemisphereLightColor,
    directionalLightColor,
  ],
  () => {
    updateLights();
  }
);

// 监听曝光度变化
watch(exposure, () => {
  updateExposure();
});

// 监听窗口尺寸变化
watch(windowSize, () => {
  if (camera && renderer) {
    const container = document.getElementById("scene-container");
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
});

// 场景、相机和渲染器
let scene, camera, renderer;

// 雨滴控制参数
const isRaining = ref(false);
const rainIntensity = ref(1.0);

// 雨滴系统
let rainParticles;
let rainGeo;
let rainCount = 15000;

// 创建雨滴系统
function createRain() {
  rainGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(rainCount * 3);
  const velocities = new Float32Array(rainCount);

  for (let i = 0; i < rainCount * 3; i += 3) {
    positions[i] = Math.random() * 400 - 200; // x
    positions[i + 1] = Math.random() * 500 - 250; // y
    positions[i + 2] = Math.random() * 400 - 200; // z
    velocities[i / 3] = 0.1 + Math.random() / 2;
  }

  rainGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  rainGeo.setAttribute("velocity", new THREE.BufferAttribute(velocities, 1));

  const rainMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.3,
    transparent: true,
    opacity: 0.8,
  });

  rainParticles = new THREE.Points(rainGeo, rainMaterial);
  rainParticles.visible = false;
  scene.add(rainParticles);
}

// 更新雨滴
function updateRain() {
  if (!rainGeo || !rainParticles || !isRaining.value) return;

  const positions = rainGeo.attributes.position.array;
  const velocities = rainGeo.attributes.velocity.array;

  for (let i = 0; i < rainCount * 3; i += 3) {
    positions[i + 1] -= velocities[i / 3] * rainIntensity.value;

    if (positions[i + 1] < -250) {
      positions[i + 1] = 250;
    }
  }

  rainGeo.attributes.position.needsUpdate = true;
}

// 切换雨天效果
function toggleRain() {
  isRaining.value = !isRaining.value;
  if (rainParticles) {
    rainParticles.visible = isRaining.value;
  }
}
// 控制器
let controls;
// 人物模型
let character;
// 当前动作状态
let currentAction = "idle";
// 动画混合器
let mixer;
// 上一帧时间
let prevTime = 0;
// 动画帧ID
let animationFrameId;
// 动画剪辑
let animations = {};
// 当前活动的动作
let activeAction;

// 摇杆控制相关变量
const joystickContainer = ref(null);
const joystickHandle = ref(null);
const joystickState = reactive({
  active: false,
  baseX: 0,
  baseY: 0,
  handleX: 0,
  handleY: 0,
  moveX: 0,
  moveY: 0,
  maxDistance: 50, // 摇杆最大移动距离
});

// 游戏相关变量
const gameState = ref("idle"); // idle, countdown, playing, gameover
const score = ref(0);
const countdownValue = ref(3);
let countdownTimer = null;

// 游戏对象
let startText = null;
let scoreText = null;
let countdownText = null;
let coins = [];
let bombs = [];
let powerups = []; // 新增：金色发光球数组
const itemDropInterval = 2500; // 物品掉落间隔(毫秒)，从1秒改为2.5秒
let lastDropTime = 0;
const coinValue = 1;
const bombValue = -2;

// 新增：道具效果相关变量
const hasPowerup = ref(false);
const powerupTimeLeft = ref(0);
let powerupTimer = null;
const powerupDuration = 10000; // 道具持续时间(毫秒)
const powerupSpeedBoost = 0.005; // 道具速度提升
let originalMoveSpeed = 0; // 记录原始移动速度

// 修改移动边界，缩小游戏范围
const moveBoundary = 5; // 从10改为5，缩小活动范围

// 路径相关变量
let movePath;
let pathPoints = [];
let currentPathIndex = 0;
let isFollowingPath = false;

// 添加加载状态变量
const isLoading = ref(true);

// 添加道具存在时间相关变量
const itemLifespan = 10000; // 道具存在时间(毫秒)

// 添加粒子系统相关变量
function createDisappearEffect(position, color) {
  // 创建粒子几何体
  const particleCount = 30;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSizes = new Float32Array(particleCount);
  const particleVelocities = [];

  // 初始化粒子位置和大小
  for (let i = 0; i < particleCount; i++) {
    // 所有粒子从物体中心开始
    particlePositions[i * 3] = position.x;
    particlePositions[i * 3 + 1] = position.y;
    particlePositions[i * 3 + 2] = position.z;
    
    // 随机大小
    particleSizes[i] = Math.random() * 0.1 + 0.05;
    
    // 随机速度向量
    particleVelocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      Math.random() * 0.1,
      (Math.random() - 0.5) * 0.1
    ));
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

  // 创建粒子材质
  const particleMaterial = new THREE.PointsMaterial({
    color: color,
    size: 0.1,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  // 创建粒子系统
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // 粒子动画
  let animationFrame;
  const animateParticles = () => {
    const positions = particles.geometry.attributes.position.array;
    
    // 更新每个粒子的位置
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += particleVelocities[i].x;
      positions[i * 3 + 1] += particleVelocities[i].y;
      positions[i * 3 + 2] += particleVelocities[i].z;
      
      // 添加重力效果
      particleVelocities[i].y -= 0.002;
    }
    
    particles.geometry.attributes.position.needsUpdate = true;
    
    // 淡出效果
    particleMaterial.opacity -= 0.02;
    
    if (particleMaterial.opacity > 0) {
      animationFrame = requestAnimationFrame(animateParticles);
    } else {
      // 动画结束，移除粒子系统
      scene.remove(particles);
      cancelAnimationFrame(animationFrame);
      particles.geometry.dispose();
      particleMaterial.dispose();
    }
  };
  
  // 开始动画
  animateParticles();
}

// 添加大便道具相关变量
let poopItems = []; // 大便道具数组
const poopPenaltyDuration = 5000; // 大便惩罚持续时间(毫秒)
const hasPoop = ref(false); // 是否有大便效果
const poopTimeLeft = ref(0); // 大便效果剩余时间
let poopTimer = null; // 大便效果计时器
let poopEffect = null; // 大便效果粒子系统

// 创建大便道具函数
function createPoop() {
  // 创建大便基础形状（使用多个球体组合）
  const poopGroup = new THREE.Group();
  
  // 底部大球
  const base = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.8,
      metalness: 0.1
    })
  );
  base.position.y = 0;
  poopGroup.add(base);
  
  // 中间球
  const middle = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.8,
      metalness: 0.1
    })
  );
  middle.position.y = 0.25;
  poopGroup.add(middle);
  
  // 顶部小球
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.8,
      metalness: 0.1
    })
  );
  top.position.y = 0.45;
  poopGroup.add(top);
  
  // 添加眼睛（可选）
  const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.1, 0.45, 0.15);
  poopGroup.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.1, 0.45, 0.15);
  poopGroup.add(rightEye);
  
  // 添加瞳孔
  const pupilGeometry = new THREE.SphereGeometry(0.02, 8, 8);
  const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
  const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  leftPupil.position.set(-0.1, 0.45, 0.19);
  poopGroup.add(leftPupil);
  
  const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
  rightPupil.position.set(0.1, 0.45, 0.19);
  poopGroup.add(rightPupil);
  
  // 添加微笑
  const smileGeometry = new THREE.TorusGeometry(0.08, 0.02, 8, 12, Math.PI);
  const smileMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const smile = new THREE.Mesh(smileGeometry, smileMaterial);
  smile.position.set(0, 0.35, 0.18);
  smile.rotation.x = -Math.PI / 2;
  smile.rotation.z = Math.PI;
  poopGroup.add(smile);
  
  // 尝试最多10次找到一个无碰撞的位置
  let attempts = 0;
  let validPosition = false;
  let randomX, randomZ;
  
  while (!validPosition && attempts < 10) {
    // 随机位置
    randomX = Math.random() * 8 - 4;
    randomZ = Math.random() * 8 - 4;
    
    // 检查这个位置是否与其他道具碰撞
    const tempPosition = new THREE.Vector3(randomX, 0, randomZ);
    if (!checkItemCollision(tempPosition, "poop")) {
      validPosition = true;
    }
    
    attempts++;
  }
  
  poopGroup.position.set(randomX, 10, randomZ); // 从高处掉落
  poopGroup.name = "poop";
  poopGroup.userData.createdAt = Date.now(); // 记录创建时间
  
  // 添加到场景和数组
  scene.add(poopGroup);
  poopItems.push(poopGroup);
  
  return poopGroup;
}

// 修改checkItemCollision函数，添加对大便道具的检测
function checkItemCollision(position, itemType) {
  // 检查与现有金币的碰撞
  for (const coin of coins) {
    const dx = position.x - coin.position.x;
    const dz = position.z - coin.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // 如果距离太近，返回true表示有碰撞
    if (distance < 1.0) {
      return true;
    }
  }
  
  // 检查与现有炸弹的碰撞
  for (const bomb of bombs) {
    const dx = position.x - bomb.position.x;
    const dz = position.z - bomb.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 1.0) {
      return true;
    }
  }
  
  // 检查与现有金色发光球的碰撞
  for (const powerup of powerups) {
    const dx = position.x - powerup.position.x;
    const dz = position.z - powerup.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 1.0) {
      return true;
    }
  }
  
  // 检查与现有大便道具的碰撞
  for (const poop of poopItems) {
    const dx = position.x - poop.position.x;
    const dz = position.z - poop.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 1.0) {
      return true;
    }
  }
  
  // 没有碰撞
  return false;
}

// 创建大便效果粒子系统
function createPoopEffect() {
  if (poopEffect) {
    scene.remove(poopEffect);
  }
  
  // 创建粒子几何体
  const particleCount = 20;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  
  // 初始化粒子位置
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 0.5;
    particlePositions[i * 3 + 1] = Math.random() * 0.5 + 0.5;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  // 创建粒子材质
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x6b4423,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  
  // 创建粒子系统
  poopEffect = new THREE.Points(particleGeometry, particleMaterial);
  
  // 将粒子系统添加到角色上
  if (character) {
    character.add(poopEffect);
  }
  
  // 动画更新函数
  const updatePoopEffect = () => {
    if (!poopEffect || !hasPoop.value) return;
    
    const positions = poopEffect.geometry.attributes.position.array;
    
    for (let i = 0; i < particleCount; i++) {
      // 粒子上升
      positions[i * 3 + 1] += 0.02;
      
      // 如果粒子上升太高，重置到底部
      if (positions[i * 3 + 1] > 2) {
        positions[i * 3 + 1] = 0.5;
        positions[i * 3] = (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      }
    }
    
    poopEffect.geometry.attributes.position.needsUpdate = true;
  };
  
  // 添加到动画循环
  const originalAnimate = animate;
  animate = function() {
    originalAnimate();
    updatePoopEffect();
  };
}

// 添加激活大便效果函数
function activatePoopPenalty() {
  // 如果已经有大便效果，先清除之前的计时器
  if (poopTimer) {
    clearInterval(poopTimer);
  }
  
  // 设置大便状态
  hasPoop.value = true;
  poopTimeLeft.value = poopPenaltyDuration / 1000;
  
  // 创建大便效果粒子系统
  createPoopEffect();
  
  // 开始倒计时
  poopTimer = setInterval(() => {
    poopTimeLeft.value -= 0.1;
    updateScoreDisplay();
    
    // 大便效果结束
    if (poopTimeLeft.value <= 0) {
      deactivatePoopPenalty();
    }
  }, 100);
}

// 添加停用大便效果函数
function deactivatePoopPenalty() {
  hasPoop.value = false;
  clearInterval(poopTimer);
  poopTimer = null;
  
  // 移除大便效果粒子系统
  if (poopEffect && character) {
    character.remove(poopEffect);
    poopEffect.geometry.dispose();
    poopEffect.material.dispose();
    poopEffect = null;
  }
  
  updateScoreDisplay();
}

// 初始化场景
function init() {
  // 创建场景前先显示加载提示
  isLoading.value = true;

  // 创建场景
  scene = new THREE.Scene();

  // 加载天空盒
  const skyboxLoader = new THREE.CubeTextureLoader();
  skyboxLoader.setPath("./textures/skybox/");

  // 尝试加载天空盒贴图，如果贴图不存在则使用默认背景色
  skyboxLoader.load(
    ["posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", "posz.jpg", "negz.jpg"],
    (texture) => {
      scene.background = texture;
    },
    undefined,
    (error) => {
      console.warn("天空盒贴图加载失败:", error);
      // 使用默认背景色作为备选
      scene.background = new THREE.Color(0x87ceeb); // 天空蓝色背景
    }
  );

  // 创建相机 - 调整初始位置
  const container = document.getElementById("scene-container");
  camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 3, 7); // 调高相机位置，拉远距离

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  // 针对移动设备优化渲染器性能
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  // 设置色调映射
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure.value;
  container.appendChild(renderer.domElement);

  // 创建相机控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 确保没有限制垂直旋转
  controls.minPolarAngle = 0; // 允许向上看到天空
  controls.maxPolarAngle = Math.PI; // 允许向下看到地面

  // 设置缩放限制
  controls.minDistance = 2; // 最小缩放距离
  controls.maxDistance = 20; // 最大缩放距离

  // 确保启用了所有控制
  controls.enableZoom = true;
  controls.enableRotate = true;
  controls.enablePan = true;

  // 设置初始目标点
  controls.target.set(0, 1, 0);
  controls.update();

  // 添加光源
  addLights();

  // 创建地面 - 需要启用地面用于放置开始文字和碰撞检测
  addFloor();

  // 创建人物
  createCharacter();

  // 创建路径

  // 创建雨滴系统
  createRain();

  // 创建游戏UI
  createGameUI();

  // 创建开始游戏文字
  createStartText();

  // 添加窗口大小调整监听
  window.addEventListener("resize", onWindowResize);

  // 开始动画循环
  animate();
}

function addFloor() {
  const planeGeometry = new THREE.PlaneGeometry(20, 20); // 从50x50改为20x20
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.8,
    metalness: 0.2,
    transparent: true,
    opacity: 0.8,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0;
  plane.receiveShadow = true;
  plane.name = "floor";
  scene.add(plane);
}

// 添加光源
function addLights() {
  // 环境光 - 增加强度并确保是纯白色
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  const lightness = new THREE.HemisphereLight(0xffffff, 0x444444);
  lightness.position.set(0, 20, 0);
  scene.add(lightness);
  // 方向光（模拟太阳光）- 使用纯白色
  const directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  scene.add(directionalLight);
}

// 创建人物（使用GLTF模型）
function createCharacter() {
  // 创建加载管理器
  const loadingManager = new THREE.LoadingManager();

  loadingManager.onProgress = function (url, loaded, total) {
    console.log("模型加载进度:", Math.round((loaded / total) * 100) + "%");
  };

  loadingManager.onLoad = function () {
    // 所有资源加载完成
    setTimeout(() => {
      isLoading.value = false;
    }, 500);
  };

  // 加载RobotExpressive模型
  // loader.setPath("./gltf/");
  // const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("./draco/");
  dracoLoader.setDecoderConfig({ type: "js" });
  // 创建加载器时传入loadingManager
  const loader = new GLTFLoader(loadingManager);
  loader.setDRACOLoader(dracoLoader);
  loader.load(
    "./gltf/goodboyrun.glb",
    function (gltf) {
      character = gltf.scene;
      character.scale.set(1, 1, 1);
      character.position.set(0, 0.6, 0);
      character.traverse(function (node) {
        if (node.isMesh) {
          node.castShadow = true;
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach((mat) => {
                if (mat.envMap) mat.envMap = null;
                mat.needsUpdate = true;
              });
            } else {
              if (node.material.envMap) node.material.envMap = null;
              node.material.needsUpdate = true;
            }
          }
        }
      });
      scene.add(character);

      // 设置动画
      mixer = new THREE.AnimationMixer(character);

      // 存储所有动画剪辑
      gltf.animations.forEach((clip) => {
        const name = clip.name.toLowerCase();
        animations[name] = clip;
      });

      // 设置默认动作为idle
      setAction("idle");
    },
    undefined,
    function (error) {
      console.error("模型加载出错:", error);
      isLoading.value = false; // 加载出错时也要关闭加载提示
    }
  );
}

// 角色移动相关状态
let moveSpeed = 0;
let moveDirection = new THREE.Vector3();

// 设置动作
function setAction(action) {
  if (!mixer || !character) return;

  // 如果游戏结束，只允许idle动作
  if (gameState.value === "gameover" && action !== "idle") {
    action = "idle";
  }

  currentAction = action;
  isFollowingPath =
    action === "walk" || action === "run" || action === "armature";

  // 根据动作设置移动速度
  switch (action) {
    case "walk":
      moveSpeed = 0.5;
      break;
    case "run":
    case "armature":
      moveSpeed = 0.02;
      break;
    case "jump":
    case "idle":
    default:
      moveSpeed = 0;
      isFollowingPath = false;
      break;
  }

  // 映射动作名称到模型的动画名称
  let clipName;
  switch (action) {
    case "walk":
      clipName = "walking";
      break;
    case "run":
      clipName = "running";
      break;
    case "jump":
      clipName = "jump";
      break;
    case "armature":
      clipName = "armature";
      break;
    case "idle":
    default:
      clipName = "idle";
      break;
  }

  // 获取动画剪辑
  const clip = animations[clipName];
  if (!clip) {
    console.warn(`动画 ${clipName} 不存在，使用默认动画`);
    return;
  }

  // 淡出之前的动作
  if (activeAction) {
    activeAction.fadeOut(0.5);
  }

  // 创建新的动作并播放
  const animAction = mixer.clipAction(clip);
  animAction.reset();
  animAction.fadeIn(0.5);
  animAction.play();

  // 更新当前活动动作
  activeAction = animAction;
}

// 停止动画
function stopAnimation() {
  if (!mixer || !character) return;

  // 停止所有动画
  if (activeAction) {
    activeAction.fadeOut(0.5);
    activeAction.stop();
    activeAction = null;
  }

  // 重置移动状态
  moveSpeed = 0;
  isFollowingPath = false;
  currentAction = "stop";
}

// 更新人物颜色
function updateCharacterColor() {
  if (character) {
    character.traverse((node) => {
      if (node.isMesh && node.material) {
        if (Array.isArray(node.material)) {
          node.material.forEach((mat) => {
            if (mat.color) mat.color.set(characterColor.value);
          });
        } else {
          if (node.material.color)
            node.material.color.set(characterColor.value);
        }
      }
    });
  }
}

// 修复摇杆控制功能
function initJoystick() {
  const container = joystickContainer.value;
  const handle = container.querySelector(".joystick-handle");

  if (!container || !handle) return;

  // 计算摇杆基础位置
  const rect = container.getBoundingClientRect();
  joystickState.baseX = rect.width / 2;
  joystickState.baseY = rect.height / 2;

  // 设置手柄初始位置
  joystickState.handleX = joystickState.baseX;
  joystickState.handleY = joystickState.baseY;
  updateJoystickPosition();

  // 添加鼠标事件监听
  container.addEventListener("mousedown", startJoystick);
  document.addEventListener("mousemove", moveJoystick);
  document.addEventListener("mouseup", endJoystick);

  // 添加触摸事件监听
  container.addEventListener("touchstart", startJoystick);
  document.addEventListener("touchmove", moveJoystick);
  document.addEventListener("touchend", endJoystick);
}

// 开始控制摇杆
function startJoystick(event) {
  joystickState.active = true;
  moveJoystick(event);
}

// 移动摇杆
function moveJoystick(event) {
  if (!joystickState.active) return;

  event.preventDefault();

  // 获取触摸/鼠标位置
  const clientX = event.clientX || (event.touches && event.touches[0].clientX);
  const clientY = event.clientY || (event.touches && event.touches[0].clientY);

  if (clientX === undefined || clientY === undefined) return;

  const rect = joystickContainer.value.getBoundingClientRect();
  const relativeX = clientX - rect.left;
  const relativeY = clientY - rect.top;

  // 计算摇杆移动向量
  let moveX = relativeX - joystickState.baseX;
  let moveY = relativeY - joystickState.baseY;

  // 计算移动距离
  const distance = Math.sqrt(moveX * moveX + moveY * moveY);

  // 限制摇杆移动范围
  if (distance > joystickState.maxDistance) {
    const angle = Math.atan2(moveY, moveX);
    moveX = Math.cos(angle) * joystickState.maxDistance;
    moveY = Math.sin(angle) * joystickState.maxDistance;
  }

  // 更新摇杆位置
  joystickState.handleX = joystickState.baseX + moveX;
  joystickState.handleY = joystickState.baseY + moveY;
  joystickState.moveX = moveX;
  joystickState.moveY = moveY;

  updateJoystickPosition();
  updateCharacterMovement();
}

// 结束摇杆控制
function endJoystick() {
  if (!joystickState.active) return;
  joystickState.active = false;
  joystickState.moveX = 0;
  joystickState.moveY = 0;

  // 重置摇杆位置
  joystickState.handleX = joystickState.baseX;
  joystickState.handleY = joystickState.baseY;
  stopAnimation();
  updateJoystickPosition();
  updateCharacterMovement();
}

// 更新摇杆位置
function updateJoystickPosition() {
  if (!joystickHandle.value) return;

  joystickHandle.value.style.transform = `translate(${
    joystickState.handleX - joystickState.baseX
  }px, ${joystickState.handleY - joystickState.baseY}px)`;
}

// 更新角色移动 - 修改为使用相机方向
function updateCharacterMovement() {
  if (!character) return;

  // 计算移动方向和速度
  const moveVector = new THREE.Vector2(
    joystickState.moveX,
    joystickState.moveY
  );
  const moveDistance = moveVector.length();

  if (moveDistance > 0) {
    // 设置移动速度（根据摇杆偏移量和当前选择的速度调整）
    moveSpeed = (moveDistance / joystickState.maxDistance) * speedValues[currentSpeed.value];

    // 创建一个表示摇杆方向的向量（屏幕空间）
    const joystickDirection = new THREE.Vector2(
      joystickState.moveX,
      -joystickState.moveY
    ).normalize();

    // 创建一个表示"向前"的三维向量
    const forward = new THREE.Vector3(0, 0, -1);

    // 将这个向量应用相机的旋转
    forward.applyQuaternion(camera.quaternion);
    forward.y = 0; // 我们只关心水平方向
    forward.normalize();

    // 创建一个表示"向右"的三维向量
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion);
    right.y = 0; // 我们只关心水平方向
    right.normalize();

    // 根据摇杆方向计算最终移动方向
    moveDirection.copy(forward.multiplyScalar(joystickDirection.y));
    moveDirection.add(right.multiplyScalar(joystickDirection.x));
    moveDirection.normalize();

    // 设置角色朝向
    const targetAngle = Math.atan2(moveDirection.x, moveDirection.z);
    character.rotation.y = targetAngle;

    // 如果角色当前不在移动状态，切换到奔跑动画
    if (currentAction !== "armature" && currentAction !== "run") {
      setAction("armature");
    }
  } else {
    // 停止移动
    moveSpeed = 0;

    // 如果角色当前在移动状态，切换到待机动画
    if (currentAction === "armature" || currentAction === "run") {
      setAction("idle");
    }
  }
}

// 窗口大小调整处理
function onWindowResize() {
  const container = document.getElementById("scene-container");
  // 确保相机宽高比与容器一致
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  // 调整渲染器大小以匹配容器
  renderer.setSize(container.clientWidth, container.clientHeight);
  // 重新设置像素比以适应高分辨率设备
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// 创建移动路径
function createPath() {
  // 定义路径点
  pathPoints = [
    new THREE.Vector3(-5, 0.1, -5),
    new THREE.Vector3(5, 0.1, -5),
    new THREE.Vector3(5, 0.1, 5),
    new THREE.Vector3(-5, 0.1, 5),
  ];

  // 创建闭合曲线
  const curve = new THREE.CatmullRomCurve3(pathPoints);
  curve.closed = true;

  // 创建路径几何体
  const points = curve.getPoints(50);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  // 创建路径材质
  const material = new THREE.LineBasicMaterial({ color: 0xffff00 });

  // 创建路径线条
  movePath = new THREE.Line(geometry, material);
  scene.add(movePath);

  // 在路径点位置添加标记
  const sphereGeometry = new THREE.SphereGeometry(0.2);
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  pathPoints.forEach((point) => {
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.copy(point);
    scene.add(sphere);
  });
}

// 更新角色位置到路径上
function updateCharacterOnPath() {
  if (!character || !isFollowingPath) return;

  const currentPoint = pathPoints[currentPathIndex];
  const nextPoint = pathPoints[(currentPathIndex + 1) % pathPoints.length];

  // 计算当前位置到下一个点的方向
  const direction = nextPoint.clone().sub(character.position);
  const distance = direction.length();

  // 如果距离足够近，移动到下一个点
  if (distance < 0.1) {
    currentPathIndex = (currentPathIndex + 1) % pathPoints.length;
    return;
  }

  // 更新角色位置
  direction.normalize();
  const moveAmount = moveSpeed * 0.05;
  const targetPosition = character.position
    .clone()
    .add(direction.multiplyScalar(moveAmount));
  targetPosition.y = 0.6; // 保持y轴位置固定
  character.position.copy(targetPosition);

  // 平滑更新角色朝向
  const targetRotation = Math.atan2(direction.x, direction.z);
  const currentRotation = character.rotation.y;
  const rotationDiff = targetRotation - currentRotation;

  // 确保旋转角度在-π到π之间
  const normalizedRotationDiff =
    ((rotationDiff + Math.PI) % (Math.PI * 2)) - Math.PI;

  // 平滑插值旋转
  character.rotation.y += normalizedRotationDiff * 0.1;
}

// 创建游戏UI
function createGameUI() {
  // 创建HTML分数显示
  const scoreDiv = document.createElement("div");
  scoreDiv.id = "score-display";
  scoreDiv.style.position = "absolute";
  scoreDiv.style.top = "20px";
  scoreDiv.style.left = "50%";
  scoreDiv.style.transform = "translateX(-50%)";
  scoreDiv.style.padding = "10px 20px";
  scoreDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  scoreDiv.style.color = "white";
  scoreDiv.style.borderRadius = "10px";
  scoreDiv.style.fontSize = "24px";
  scoreDiv.style.fontWeight = "bold";
  scoreDiv.style.zIndex = "100";
  scoreDiv.style.textAlign = "center";
  scoreDiv.style.fontFamily = "Arial, sans-serif";
  scoreDiv.style.boxShadow = "0 0 10px rgba(255, 255, 255, 0.3)";
  scoreDiv.innerHTML = "分数: 0";

  // 将分数显示添加到容器
  const container = document.getElementById("scene-container");
  container.parentNode.appendChild(scoreDiv);

  // 创建倒计时显示
  const countdownCanvas = document.createElement("canvas");
  countdownCanvas.width = 256;
  countdownCanvas.height = 256;
  const countdownContext = countdownCanvas.getContext("2d");

  // 创建纹理
  const countdownTexture = new THREE.CanvasTexture(countdownCanvas);
  const countdownMaterial = new THREE.MeshBasicMaterial({
    map: countdownTexture,
    transparent: true,
  });

  // 创建平面几何体
  const countdownGeometry = new THREE.PlaneGeometry(3, 3);
  countdownText = new THREE.Mesh(countdownGeometry, countdownMaterial);
  countdownText.position.set(0, 2, 0);
  countdownText.visible = false;
  scene.add(countdownText);
}

// 修改updateScoreDisplay函数，添加大便效果显示
function updateScoreDisplay() {
  const scoreDiv = document.getElementById("score-display");
  if (!scoreDiv) return;

  let scoreHtml = `分数: ${score.value}`;

  // 如果有道具效果，显示剩余时间
  if (hasPowerup.value) {
    scoreHtml += `<br><span style="color: #ffcc00; font-size: 18px;">双倍积分: ${Math.ceil(
      powerupTimeLeft.value
    )}秒</span>`;
  }
  
  // 如果有大便效果，显示剩余时间
  if (hasPoop.value) {
    scoreHtml += `<br><span style="color: blue; font-size: 18px;">臭臭效果: ${Math.ceil(
      poopTimeLeft.value
    )}秒</span>`;
  }

  scoreDiv.innerHTML = scoreHtml;
}

// 修改createCoin函数，添加碰撞检测
function createCoin() {
  // 创建金币几何体
  const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    metalness: 1,
    roughness: 0.3,
    emissive: 0xffff00,
    emissiveIntensity: 0.2,
  });

  const coin = new THREE.Mesh(geometry, material);

  // 尝试最多10次找到一个无碰撞的位置
  let attempts = 0;
  let validPosition = false;
  let randomX, randomZ;
  
  while (!validPosition && attempts < 10) {
    // 随机位置 - 缩小范围
    randomX = Math.random() * 8 - 4; // -4 到 4
    randomZ = Math.random() * 8 - 4; // -4 到 4
    
    // 检查这个位置是否与其他道具碰撞
    const tempPosition = new THREE.Vector3(randomX, 0, randomZ);
    if (!checkItemCollision(tempPosition, "coin")) {
      validPosition = true;
    }
    
    attempts++;
  }
  
  // 如果找不到无碰撞的位置，就使用最后一次尝试的位置
  coin.position.set(randomX, 10, randomZ); // 从高处掉落
  coin.rotation.x = Math.PI / 2; // 平放
  coin.name = "coin";
  coin.userData.createdAt = Date.now(); // 记录创建时间

  // 添加到场景和数组
  scene.add(coin);
  coins.push(coin);

  return coin;
}

// 修改createBomb函数，添加碰撞检测
function createBomb() {
  // 创建炸弹几何体
  const geometry = new THREE.SphereGeometry(0.3, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0x000000,
    metalness: 0.7,
    roughness: 0.2,
  });

  const bomb = new THREE.Mesh(geometry, material);

  // 尝试最多10次找到一个无碰撞的位置
  let attempts = 0;
  let validPosition = false;
  let randomX, randomZ;
  
  while (!validPosition && attempts < 10) {
    // 随机位置 - 缩小范围
    randomX = Math.random() * 8 - 4; // -4 到 4
    randomZ = Math.random() * 8 - 4; // -4 到 4
    
    // 检查这个位置是否与其他道具碰撞
    const tempPosition = new THREE.Vector3(randomX, 0, randomZ);
    if (!checkItemCollision(tempPosition, "bomb")) {
      validPosition = true;
    }
    
    attempts++;
  }

  bomb.position.set(randomX, 10, randomZ); // 从高处掉落
  bomb.name = "bomb";
  bomb.userData.createdAt = Date.now(); // 记录创建时间

  // 添加到场景和数组
  scene.add(bomb);
  bombs.push(bomb);

  // 添加引线和火花
  const fuseGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
  const fuseMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const fuse = new THREE.Mesh(fuseGeometry, fuseMaterial);
  fuse.position.y = 0.35;
  bomb.add(fuse);

  const sparkGeometry = new THREE.SphereGeometry(0.05, 16, 16);
  const sparkMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff5500,
    emissiveIntensity: 1,
  });
  const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
  spark.position.y = 0.6;
  bomb.add(spark);

  return bomb;
}

// 修改createPowerup函数，添加碰撞检测
function createPowerup() {
  // 创建金色发光球几何体 - 缩小一点
  const geometry = new THREE.SphereGeometry(0.25, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0xffcc00,
    emissiveIntensity: 0.4,
  });

  const powerup = new THREE.Mesh(geometry, material);

  // 尝试最多10次找到一个无碰撞的位置
  let attempts = 0;
  let validPosition = false;
  let randomX, randomZ;
  
  while (!validPosition && attempts < 10) {
    // 随机位置
    randomX = Math.random() * 8 - 4;
    randomZ = Math.random() * 8 - 4;
    
    // 检查这个位置是否与其他道具碰撞
    const tempPosition = new THREE.Vector3(randomX, 0, randomZ);
    if (!checkItemCollision(tempPosition, "powerup")) {
      validPosition = true;
    }
    
    attempts++;
  }

  powerup.position.set(randomX, 10, randomZ);
  powerup.name = "powerup";
  powerup.userData.createdAt = Date.now(); // 记录创建时间

  // 添加点光源使其发光
  const light = new THREE.PointLight(0xffcc00, 0.5, 1);
  light.position.set(0, 0, 0);
  powerup.add(light);

  // 添加到场景和数组
  scene.add(powerup);
  powerups.push(powerup);

  return powerup;
}

// 修改showPointsAnimation函数，使用HTML元素显示得分动画
function showPointsAnimation(points, position) {
  // 将3D位置转换为屏幕坐标
  const vector = new THREE.Vector3();
  vector.copy(position);
  vector.project(camera);
  const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

  // 创建HTML元素
  const pointsDiv = document.createElement("div");
  pointsDiv.style.position = "absolute";
  pointsDiv.style.left = `${x}px`;
  pointsDiv.style.top = `${y}px`;
  pointsDiv.style.transform = "translate(-50%, -50%)";
  pointsDiv.style.color = points > 0 ? "#ffff00" : "#ff0000";
  pointsDiv.style.fontSize = "24px";
  pointsDiv.style.fontWeight = "bold";
  pointsDiv.style.textShadow = "0 0 5px rgba(0, 0, 0, 0.8)";
  pointsDiv.style.zIndex = "101";
  pointsDiv.style.pointerEvents = "none";
  pointsDiv.style.fontFamily = "Arial, sans-serif";
  pointsDiv.innerHTML = `${points > 0 ? "+" : ""}${points}`;

  document.body.appendChild(pointsDiv);

  // 动画效果
  let animationTime = 0;
  const animate = () => {
    animationTime += 0.05;

    // 上升并淡出
    const newY = parseFloat(pointsDiv.style.top) - 2;
    pointsDiv.style.top = `${newY}px`;
    pointsDiv.style.opacity = 1 - animationTime / 1.5;

    if (animationTime < 1.5) {
      requestAnimationFrame(animate);
    } else {
      document.body.removeChild(pointsDiv);
    }
  };

  animate();
}

// 修改createStartText函数，优化文字样式
function createStartText() {
  // 创建画布
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  // 设置渐变背景
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#4CAF50");
  gradient.addColorStop(1, "#45a049");

  // 设置文本样式
  context.fillStyle = gradient;
  context.font = "bold 72px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";

  // 添加文字阴影
  context.shadowColor = "rgba(0, 0, 0, 0.5)";
  context.shadowBlur = 15;
  context.shadowOffsetX = 5;
  context.shadowOffsetY = 5;

  // 绘制文字描边
  context.strokeStyle = "#ffffff";
  context.lineWidth = 8;
  context.strokeText("开始游戏", canvas.width / 2, canvas.height / 2);

  // 绘制文字
  context.fillText("开始游戏", canvas.width / 2, canvas.height / 2);

  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // 创建平面几何体
  const geometry = new THREE.PlaneGeometry(3, 1.5);
  startText = new THREE.Mesh(geometry, material);

  // 放置在角色前方
  startText.position.set(0, 1.2, -2);
  startText.name = "startText";

  // 添加发光效果
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x4caf50,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const glowGeometry = new THREE.PlaneGeometry(3.2, 1.7);
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.set(0, 0, -0.1);
  startText.add(glow);

  scene.add(startText);

  // 添加动画效果
  const animate = () => {
    if (!startText) return;
    startText.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
    startText.position.y = 1.2 + Math.sin(Date.now() * 0.002) * 0.1;
    requestAnimationFrame(animate);
  };
  animate();
}

// 开始游戏倒计时
function startGameCountdown() {
  if (gameState.value !== "idle") return;

  // 移除开始文字
  if (startText) {
    scene.remove(startText);
    startText = null;
  }

  // 设置游戏状态为倒计时
  gameState.value = "countdown";
  countdownValue.value = 3;

  // 显示倒计时
  if (countdownText) {
    countdownText.visible = true;
    updateCountdownDisplay();
  }

  // 开始倒计时
  countdownTimer = setInterval(() => {
    countdownValue.value--;
    updateCountdownDisplay();

    if (countdownValue.value <= 0) {
      // 倒计时结束
      clearInterval(countdownTimer);
      if (countdownText) {
        countdownText.visible = false;
      }
      startGame();
    }
  }, 1000);
}

// 开始游戏
function startGame() {
  // 设置游戏状态为游戏中
  gameState.value = "playing";
  score.value = 0;
  updateScoreDisplay();

  // 清空所有物品
  clearAllItems();

  // 游戏开始时只生成一个金币
  createCoin();

  // 更新分数显示
  updateScoreDisplay();
}

// 结束游戏
function endGame() {
  // 设置游戏状态为游戏结束
  gameState.value = "gameover";

  // 显示游戏结束文字
  const gameOverDiv = document.createElement("div");
  gameOverDiv.id = "game-over";
  gameOverDiv.style.position = "absolute";
  gameOverDiv.style.top = "50%";
  gameOverDiv.style.left = "50%";
  gameOverDiv.style.transform = "translate(-50%, -50%)";
  gameOverDiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  gameOverDiv.style.color = "white";
  gameOverDiv.style.padding = "20px";
  gameOverDiv.style.borderRadius = "10px";
  gameOverDiv.style.textAlign = "center";
  gameOverDiv.style.zIndex = "102";
  gameOverDiv.style.fontFamily = "Arial, sans-serif";
  gameOverDiv.innerHTML = `
    <h2 style="color: #ff0000; margin-bottom: 10px;">游戏结束</h2>
    <p style="font-size: 20px; margin-bottom: 20px;">最终分数: ${score.value}</p>
    <button id="restart-btn" style="padding: 10px 20px; background-color: #4caf50; color: white; border: none; border-radius: 5px; cursor: pointer;">重新开始</button>
  `;

  document.body.appendChild(gameOverDiv);

  // 添加重新开始按钮事件
  document.getElementById("restart-btn").addEventListener("click", () => {
    document.body.removeChild(gameOverDiv);
    resetGame();
  });

  // 3秒后自动重置游戏
  setTimeout(() => {
    if (document.getElementById("game-over")) {
      document.body.removeChild(gameOverDiv);
    }
    resetGame();
  }, 5000);
}

// 重置游戏
function resetGame() {
  // 重置游戏状态
  gameState.value = "idle";
  score.value = 0;

  // 清空所有物品
  clearAllItems();

  // 重新创建开始游戏文字
  createStartText();

  // 更新分数显示
  updateScoreDisplay();
}

// 清空所有物品
function clearAllItems() {
  // 移除所有金币
  for (let i = coins.length - 1; i >= 0; i--) {
    scene.remove(coins[i]);
  }
  coins = [];

  // 移除所有炸弹
  for (let i = bombs.length - 1; i >= 0; i--) {
    scene.remove(bombs[i]);
  }
  bombs = [];

  // 移除所有金色发光球
  for (let i = powerups.length - 1; i >= 0; i--) {
    scene.remove(powerups[i]);
  }
  powerups = [];
  
  // 移除所有大便道具
  for (let i = poopItems.length - 1; i >= 0; i--) {
    scene.remove(poopItems[i]);
  }
  poopItems = [];

  // 停用道具效果
  if (hasPowerup.value) {
    deactivatePowerup();
  }
  
  // 停用大便效果
  if (hasPoop.value) {
    deactivatePoopPenalty();
  }
}

// 修改updateItems函数，添加大便道具的更新
function updateItems() {
  const gravity = 0.05;
  const currentTime = Date.now();

  // 更新金币
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];

    // 检查存在时间
    if (currentTime - coin.userData.createdAt > itemLifespan) {
      // 超过10秒，创建消失效果并移除金币
      createDisappearEffect(coin.position.clone(), 0xffff00);
      scene.remove(coin);
      coins.splice(i, 1);
      continue;
    }

    // 应用重力
    coin.position.y -= gravity;

    // 旋转金币
    coin.rotation.z += 0.02;

    // 检查是否落地
    if (coin.position.y <= 0.3) {
      coin.position.y = 0.3;
    }

    // 检查与角色的碰撞
    if (character && checkCollision(character, coin)) {
      // 碰撞到金币，创建消失效果
      createDisappearEffect(coin.position.clone(), 0xffff00);
      scene.remove(coin);
      coins.splice(i, 1);

      // 如果有大便效果，不增加分数
      if (!hasPoop.value) {
        // 增加分数，如果有道具效果则加倍
        const pointsToAdd = hasPowerup.value ? coinValue * 2 : coinValue;
        score.value += pointsToAdd;

        // 显示得分动画
        showPointsAnimation(pointsToAdd, coin.position);
      } else {
        // 显示无法得分提示
        showPointsAnimation("臭臭中!", coin.position, 0x6b4423);
      }

      updateScoreDisplay();
    }
  }

  // 更新炸弹
  for (let i = bombs.length - 1; i >= 0; i--) {
    const bomb = bombs[i];

    // 检查存在时间
    if (currentTime - bomb.userData.createdAt > itemLifespan) {
      // 超过10秒，创建消失效果并移除炸弹
      createDisappearEffect(bomb.position.clone(), 0xff0000);
      scene.remove(bomb);
      bombs.splice(i, 1);
      continue;
    }

    // 应用重力
    bomb.position.y -= gravity;

    // 检查是否落地
    if (bomb.position.y <= 0.3) {
      bomb.position.y = 0.3;
    }

    // 检查与角色的碰撞
    if (character && checkCollision(character, bomb)) {
      // 碰撞到炸弹，创建消失效果
      createDisappearEffect(bomb.position.clone(), 0xff0000);
      scene.remove(bomb);
      bombs.splice(i, 1);

      // 减少分数
      score.value += bombValue;
      updateScoreDisplay();

      // 检查游戏结束条件
      if (score.value < 0) {
        endGame();
      }
    }
  }

  // 新增：更新金色发光球
  for (let i = powerups.length - 1; i >= 0; i--) {
    const powerup = powerups[i];

    // 检查存在时间
    if (currentTime - powerup.userData.createdAt > itemLifespan) {
      // 超过10秒，创建消失效果并移除金色发光球
      createDisappearEffect(powerup.position.clone(), 0xffcc00);
      scene.remove(powerup);
      powerups.splice(i, 1);
      continue;
    }

    // 应用重力
    powerup.position.y -= gravity;

    // 旋转道具，使其看起来更有活力
    powerup.rotation.y += 0.03;
    powerup.rotation.x += 0.01;

    // 检查是否落地
    if (powerup.position.y <= 0.3) {
      powerup.position.y = 0.3;
    }

    // 检查与角色的碰撞
    if (character && checkCollision(character, powerup)) {
      // 碰撞到金色发光球，创建消失效果
      createDisappearEffect(powerup.position.clone(), 0xffcc00);
      scene.remove(powerup);
      powerups.splice(i, 1);

      // 激活道具效果
      activatePowerup();
    }
  }

  // 更新大便道具
  for (let i = poopItems.length - 1; i >= 0; i--) {
    const poop = poopItems[i];
    
    // 检查存在时间
    if (currentTime - poop.userData.createdAt > itemLifespan) {
      // 超过10秒，创建消失效果并移除大便道具
      createDisappearEffect(poop.position.clone(), 0x6b4423);
      scene.remove(poop);
      poopItems.splice(i, 1);
      continue;
    }
    
    // 应用重力
    poop.position.y -= gravity;
    
    // 旋转大便道具，使其看起来更有趣
    poop.rotation.y += 0.02;
    
    // 检查是否落地
    if (poop.position.y <= 0.6) {
      poop.position.y = 0.6;
    }
    
    // 检查与角色的碰撞
    if (character && checkCollision(character, poop)) {
      // 碰撞到大便道具，创建消失效果
      createDisappearEffect(poop.position.clone(), 0x6b4423);
      scene.remove(poop);
      poopItems.splice(i, 1);
      
      // 激活大便效果
      activatePoopPenalty();
      
      // 显示提示
      showPointsAnimation("臭臭!", poop.position, 0x6b4423);
    }
  }

  // 定时生成新物品
  if (
    gameState.value === "playing" &&
    currentTime - lastDropTime > itemDropInterval
  ) {
    lastDropTime = currentTime;

    // 随机决定生成什么物品
    const rand = Math.random();
    if (rand < 0.6) {
      // 70%概率生成金币
      createCoin();
    } else if (rand < 0.825) {
      // 22.5%概率生成炸弹（原来是25%，现在减半）
      createBomb();
    } else if (rand < 0.95) {
      // 12.5%概率生成大便道具（替换掉一半的炸弹）
      createPoop();
    } else {
      // 5%概率生成金色发光球
      createPowerup();
    }
  }
}

// 碰撞检测
function checkCollision(object1, object2) {
  // 简单的球体碰撞检测
  const position1 = object1.position;
  const position2 = object2.position;

  // 计算距离
  const dx = position1.x - position2.x;
  const dy = position1.y - position2.y;
  const dz = position1.z - position2.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // 碰撞距离阈值
  const collisionThreshold = 0.8;

  return distance < collisionThreshold;
}

// 修改animate函数，确保角色不会跑出屏幕
function animate() {
  animationFrameId = requestAnimationFrame(animate);

  // 更新控制器
  controls.update();

  // 更新雨滴
  updateRain();

  // 更新游戏物品
  if (gameState.value === "playing") {
    updateItems();
  }

  // 更新动画混合器
  const currentTime = Date.now();
  if (prevTime && mixer) {
    const delta = (currentTime - prevTime) / 1000;
    mixer.update(delta);
  }
  prevTime = currentTime;

  // 更新角色位置
  if (moveSpeed > 0 && character) {
    const newPosition = character.position
      .clone()
      .add(moveDirection.clone().multiplyScalar(moveSpeed));

    // 边界限制
    newPosition.x = THREE.MathUtils.clamp(
      newPosition.x,
      -moveBoundary,
      moveBoundary
    );
    newPosition.z = THREE.MathUtils.clamp(
      newPosition.z,
      -moveBoundary,
      moveBoundary
    );

    character.position.copy(newPosition);

    // 检查是否碰到开始游戏文字
    if (startText && gameState.value === "idle") {
      const dx = character.position.x - startText.position.x;
      const dz = character.position.z - startText.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 1) {
        // 减小触发距离
        startGameCountdown();
      }
    }
  }

  // 渲染场景
  renderer.render(scene, camera);
}

// 添加缺失的updateCountdownDisplay函数
function updateCountdownDisplay() {
  if (!countdownText) return;

  const canvas = countdownText.material.map.image;
  const context = canvas.getContext("2d");

  // 清除画布
  context.clearRect(0, 0, canvas.width, canvas.height);

  // 设置文本样式
  context.fillStyle = "#ff0000";
  context.font = "bold 120px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";

  // 绘制倒计时
  context.fillText(
    `${countdownValue.value}`,
    canvas.width / 2,
    canvas.height / 2
  );

  // 更新纹理
  countdownText.material.map.needsUpdate = true;
}

// 设置移动速度
function setSpeed(speed) {
  currentSpeed.value = speed;
  if (moveSpeed > 0) {
    // 如果角色正在移动，立即应用新速度
    moveSpeed = speedValues[speed];
    // 如果有道具效果，添加速度提升
    if (hasPowerup.value) {
      moveSpeed += powerupSpeedBoost;
    }
  }
}

// 新增：激活道具效果
function activatePowerup() {
  // 如果已经有道具效果，先清除之前的计时器
  if (powerupTimer) {
    clearInterval(powerupTimer);
  }

  // 设置道具状态
  hasPowerup.value = true;
  powerupTimeLeft.value = powerupDuration / 1000;

  // 记录原始移动速度并提升速度
  if (moveSpeed > 0) {
    originalMoveSpeed = moveSpeed;
    moveSpeed += powerupSpeedBoost;
  }

  // 开始倒计时
  powerupTimer = setInterval(() => {
    powerupTimeLeft.value -= 0.1;
    updateScoreDisplay();

    // 道具效果结束
    if (powerupTimeLeft.value <= 0) {
      deactivatePowerup();
    }
  }, 100);
}

// 新增：停用道具效果
function deactivatePowerup() {
  hasPowerup.value = false;
  clearInterval(powerupTimer);
  powerupTimer = null;

  // 恢复原始移动速度
  if (originalMoveSpeed > 0) {
    moveSpeed = originalMoveSpeed;
    originalMoveSpeed = 0;
  }

  updateScoreDisplay();
}

// 组件挂载后初始化
onMounted(() => {
  init();
  window.addEventListener("resize", handleResize);
  // 初始化摇杆控制
  initJoystick();
});

// 组件卸载前清理
onBeforeUnmount(() => {
  // 移除事件监听器
  window.removeEventListener("resize", handleResize);

  // 移除摇杆事件监听
  if (joystickContainer.value) {
    joystickContainer.value.removeEventListener("mousedown", startJoystick);
    joystickContainer.value.removeEventListener("touchstart", startJoystick);
  }
  document.removeEventListener("mousemove", moveJoystick);
  document.removeEventListener("mouseup", endJoystick);
  document.removeEventListener("touchmove", moveJoystick);
  document.removeEventListener("touchend", endJoystick);

  // 停止动画循环
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  // 清理Three.js资源
  if (renderer) {
    renderer.dispose();
  }

  // 清理道具计时器
  if (powerupTimer) {
    clearInterval(powerupTimer);
  }
  
  // 清理大便效果计时器
  if (poopTimer) {
    clearInterval(poopTimer);
  }

  // 移除HTML分数显示
  const scoreDiv = document.getElementById("score-display");
  if (scoreDiv) {
    scoreDiv.parentNode.removeChild(scoreDiv);
  }
});
</script>
<style scoped>
.container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

#scene-container {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
}

.controls {
  position: absolute;
  right: -200px; /* 初始状态隐藏在右侧 */
  top: 0;
  width: 200px;
  height: 100%;
  background-color: rgba(51, 51, 51, 0.9);
  color: white;
  transition: right 0.3s ease;
  display: flex;
  flex-direction: row;
}

.controls.expanded {
  right: 0; /* 展开状态 */
}

.toggle-btn {
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 60px;
  background-color: rgba(51, 51, 51, 0.9);
  color: white;
  border: none;
  border-radius: 4px 0 0 4px;
  cursor: pointer;
  padding: 10px 5px;
  writing-mode: vertical-lr;
  text-orientation: upright;
}

.controls-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.control-group {
  margin-bottom: 20px;
}

h3 {
  margin-top: 0;
  border-bottom: 1px solid #555;
  padding-bottom: 10px;
}

button {
  display: block;
  width: 100%;
  padding: 8px;
  margin-bottom: 8px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #45a049;
}

.toggle-btn:hover {
  background-color: #444;
}

.color-picker {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input[type="color"] {
  width: 100%;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.light-control {
  margin-bottom: 15px;
}

.light-control h4 {
  margin: 5px 0;
  color: #ddd;
}

.slider-group {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.slider-group label {
  width: 50px;
}

.slider-group input[type="range"] {
  flex: 1;
  margin: 0 10px;
}

.slider-group span {
  width: 30px;
  text-align: right;
}

.joystick-container {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 150px;
  height: 150px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  touch-action: none;
  z-index: 10;
}

.joystick-base {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.joystick-handle {
  position: absolute;
  width: 60px;
  height: 60px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

@media (max-width: 768px) {
  .joystick-container {
    width: 120px;
    height: 120px;
  }

  .joystick-handle {
    width: 50px;
    height: 50px;
  }
}

/* 添加加载提示样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-text {
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.speed-options {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.speed-options button {
  flex: 1 0 calc(50% - 5px);
  margin-bottom: 5px;
  background-color: #555;
}

.speed-options button.active {
  background-color: #4caf50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.8);
}
</style>


