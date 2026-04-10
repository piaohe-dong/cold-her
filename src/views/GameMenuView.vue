<template>
  <div class="game-menu">
    <div class="menu-container">
      <h1 class="title">《在冰冷的她醒来之前》</h1>
      <p class="subtitle">单人游戏模式</p>
      
      <div class="settings-card">
        <h2 class="settings-title">游戏设置</h2>
        
        <!-- 玩家人数选择 -->
        <div class="setting-item">
          <div class="setting-label">玩家人数</div>
          <div class="player-count-options">
            <el-radio-group v-model="playerCount" size="large">
              <el-radio-button :label="3">3人场</el-radio-button>
              <el-radio-button :label="4">4人场</el-radio-button>
              <el-radio-button :label="5">5人场</el-radio-button>
              <el-radio-button :label="6">6人场</el-radio-button>
            </el-radio-group>
          </div>
          <div class="setting-description">
            根据人数自动调整卡牌数量和目标值
          </div>
        </div>
        
        <!-- 变体规则开关 -->
        <div class="setting-item">
          <div class="setting-label">变体规则</div>
          <div class="chaos-mode-option">
            <el-switch
              v-model="enableChaosMode"
              active-text="混沌模式"
              inactive-text="标准模式"
              size="large"
            />
          </div>
          <div class="setting-description">
            混沌模式下，最后一张手牌可通过卡牌能力转移（基础规则中最后一张手牌被保护）
          </div>
        </div>
        
        <!-- 目标值显示 -->
        <div class="setting-item">
          <div class="setting-label">目标值</div>
          <div class="target-value">
            <span class="value">{{ targetValue }}</span>
          </div>
          <div class="setting-description">
            调和成功需要达到的MP合计值
          </div>
        </div>
        
        <!-- 开始游戏按钮 -->
        <div class="action-buttons">
          <el-button
            type="primary"
            size="large"
            @click="startGame"
            class="start-button"
          >
            开始游戏
          </el-button>
          <el-button
            size="large"
            @click="goToHome"
            class="back-button"
          >
            返回首页
          </el-button>
        </div>
      </div>
      
      <!-- 游戏规则摘要 -->
      <div class="rules-summary">
        <h3>游戏规则摘要</h3>
        <ul>
          <li>游戏目标：通过卡牌能力影响调和结果，达成自己的胜利条件</li>
          <li>调和区域：放置卡牌计算MP值，达到目标值即调和成功</li>
          <li>质疑区域：放置卡牌给其他玩家，被质疑MP合计值最高者被监禁</li>
          <li>胜利条件：每个角色有独特的胜利条件，按优先级判定</li>
          <li>暂时退出：手牌只剩1张时暂时退出游戏，不受手牌移动能力影响</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { ElRadioGroup, ElRadioButton, ElSwitch, ElButton } from 'element-plus'

const router = useRouter()
const gameStore = useGameStore()

// 玩家人数选择
const playerCount = ref<3 | 4 | 5 | 6>(4)

// 混沌模式开关
const enableChaosMode = ref(false)

// 计算目标值
const targetValue = computed(() => {
  switch (playerCount.value) {
    case 3: return 9
    case 4: return 8
    case 5: return 7
    case 6: return 6
    default: return 8
  }
})

// 开始游戏
const startGame = () => {
  // 保存设置到store
  gameStore.settings.playerCount = playerCount.value
  gameStore.settings.enableChaosMode = enableChaosMode.value
  
  // 初始化游戏
  gameStore.startGame(playerCount.value, enableChaosMode.value)
  
  // 跳转到游戏页面
  router.push('/game')
}

// 返回首页
const goToHome = () => {
  router.push('/')
}
</script>

<style scoped>
.game-menu {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #0c2461 0%, #1e3799 50%, #4a69bd 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  color: #f8f9fa;
  animation: fadeIn 0.8s ease-out;
}

.menu-container {
  width: 100%;
  max-width: 650px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border-radius: 24px;
  padding: 50px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.menu-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #3498db, #9b59b6, #2ecc71);
  border-radius: 24px 24px 0 0;
}

.title {
  text-align: center;
  color: #ffffff;
  margin-bottom: 12px;
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  position: relative;
  z-index: 1;
}

.title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 2px;
}

.subtitle {
  text-align: center;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 50px;
  font-size: 1.3rem;
  font-weight: 300;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}

.settings-card {
  margin-bottom: 40px;
}

.settings-title {
  color: #ffffff;
  margin-bottom: 35px;
  padding-bottom: 18px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}

.setting-item {
  margin-bottom: 35px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.setting-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}

.setting-label {
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 14px;
  font-size: 1.2rem;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-label::before {
  content: '⚙️';
  font-size: 1rem;
}

.setting-description {
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.95rem;
  margin-top: 10px;
  line-height: 1.5;
  font-weight: 300;
  padding-left: 26px;
}

.player-count-options {
  margin-top: 10px;
}

.chaos-mode-option {
  margin-top: 10px;
}

.target-value {
  margin-top: 10px;
}

.target-value .value {
  font-size: 2.5rem;
  font-weight: 900;
  color: #2ecc71;
  text-shadow: 0 4px 12px rgba(46, 204, 113, 0.5);
  background: rgba(0, 0, 0, 0.3);
  padding: 10px 25px;
  border-radius: 16px;
  display: inline-block;
  border: 2px solid rgba(46, 204, 113, 0.5);
  backdrop-filter: blur(8px);
}

.action-buttons {
  display: flex;
  gap: 25px;
  margin-top: 50px;
}

.start-button {
  flex: 2;
  height: 70px;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  border: none;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(46, 204, 113, 0.5);
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}

.start-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(46, 204, 113, 0.7);
  background: linear-gradient(135deg, #27ae60, #219653);
}

.start-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
  border-radius: 16px 16px 0 0;
}

.back-button {
  flex: 1;
  height: 70px;
  font-size: 1.3rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  color: white;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(255, 255, 255, 0.2);
}

.rules-summary {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 18px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-top: 5px solid #9b59b6;
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.3);
  margin-top: 20px;
  transition: transform 0.3s ease;
}

.rules-summary:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 45px rgba(155, 89, 182, 0.4);
}

.rules-summary h3 {
  color: #ffffff;
  margin-bottom: 20px;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.rules-summary h3::before {
  content: '📘';
  font-size: 1.3rem;
}

.rules-summary ul {
  list-style-type: none;
  padding-left: 0;
}

.rules-summary li {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 14px;
  padding-left: 36px;
  position: relative;
  line-height: 1.6;
  font-size: 1.05rem;
  font-weight: 300;
}

.rules-summary li:before {
  content: '✦';
  color: #9b59b6;
  font-size: 1.2rem;
  position: absolute;
  left: 0;
  top: 0;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(155, 89, 182, 0.7);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .menu-container {
    padding: 25px;
    margin: 10px;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .start-button,
  .back-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .menu-container {
    padding: 20px;
    margin: 5px;
  }
  
  .title {
    font-size: 1.7rem;
  }
  
  .title::after {
    width: 80px;
  }
  
  .subtitle {
    font-size: 1rem;
    margin-bottom: 30px;
  }
  
  .settings-title {
    font-size: 1.5rem;
  }
  
  .setting-item {
    padding: 15px;
  }
  
  .setting-label {
    font-size: 1.1rem;
  }
  
  .target-value .value {
    font-size: 2rem;
    padding: 8px 20px;
  }
  
  .start-button,
  .back-button {
    height: 60px;
    font-size: 1.1rem;
  }
  
  .rules-summary {
    padding: 20px;
  }
  
  .rules-summary h3 {
    font-size: 1.3rem;
  }
  
  .rules-summary li {
    font-size: 1rem;
    padding-left: 30px;
  }
}
</style>