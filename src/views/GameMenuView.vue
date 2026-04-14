<template>
  <div class="game-menu">
    <div class="menu-container">
      <h1 class="title">《在冰冷的她醒来之前》</h1>
      <p class="subtitle">单人游戏模式</p>
      
      <div class="settings-card">
        <h2 class="settings-title">游戏设置</h2>
        
        <!-- 玩家数量卡牌选择 -->
        <div class="player-cards-grid">
          <div 
            v-for="count in [3, 4, 5, 6]" 
            :key="count"
            class="player-card"
            :class="{ 'selected': playerCount === count }"
            @click="playerCount = count as 3 | 4 | 5 | 6"
          >
            <div class="card-header">
              <div class="player-count">{{ count }}人</div>
              <div class="card-label">玩家数量</div>
            </div>
            <div class="card-content">
              <div class="target-info">
                <div class="target-label">调和目标值</div>
                <div class="target-value">{{ getTargetValue(count) }}</div>
              </div>
              <div class="card-description">
                适合{{ count }}名玩家的游戏规模
              </div>
            </div>
            <div class="card-indicator" v-if="playerCount === count">
              <span class="indicator-icon">✓</span>
            </div>
          </div>
        </div>
        
        <!-- 混沌模式选择 -->
        <div class="setting-item">
          <div class="setting-label">混沌模式</div>
          <div class="setting-description">启用后，最后一张手牌可通过卡牌能力转移</div>
          <div class="mode-selector">
            <div 
              class="mode-option" 
              :class="{ 'selected': !enableChaosMode }"
              @click="enableChaosMode = false"
            >
              标准模式
            </div>
            <div 
              class="mode-option" 
              :class="{ 'selected': enableChaosMode }"
              @click="enableChaosMode = true"
            >
              混沌模式
            </div>
          </div>
        </div>

        <!-- 当前设置汇总 -->
        <div class="current-setting-summary">
          <div class="summary-item">
            <span class="summary-label">已选择：</span>
            <span class="summary-value">{{ playerCount }}人场</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">目标值：</span>
            <span class="summary-value">{{ targetValue }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">模式：</span>
            <span class="summary-value">{{ enableChaosMode ? '混沌模式' : '标准模式' }}</span>
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
import { ElButton } from 'element-plus'

const router = useRouter()
const gameStore = useGameStore()

// 玩家人数选择
const playerCount = ref<3 | 4 | 5 | 6>(4)
// 混沌模式选择
const enableChaosMode = ref(false)

// 计算目标值的函数
const getTargetValue = (count: number): number => {
  switch (count) {
    case 3: return 9
    case 4: return 8
    case 5: return 7
    case 6: return 6
    default: return 8
  }
}

// 当前选择的目标值（计算属性）
const targetValue = computed(() => getTargetValue(playerCount.value))

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
  min-width: 90vw;
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

/* 玩家卡牌网格 */
.player-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 30px;
}

/* 玩家卡牌 */
.player-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.player-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.player-card.selected {
  background: rgba(46, 204, 113, 0.15);
  border: 2px solid rgba(46, 204, 113, 0.7);
  box-shadow: 0 8px 20px rgba(46, 204, 113, 0.3);
}

/* 混沌模式选择 */
.setting-item {
  margin-bottom: 30px;
}

.setting-label {
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
  display: block;
}

.setting-description {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 20px;
  line-height: 1.4;
}

.mode-selector {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.mode-option {
  flex: 1;
  min-width: 150px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.mode-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.mode-option.selected {
  background: rgba(155, 89, 182, 0.2);
  border: 2px solid rgba(155, 89, 182, 0.7);
  box-shadow: 0 6px 16px rgba(155, 89, 182, 0.3);
  color: #ffffff;
}

/* 卡牌头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.player-count {
  font-size: 2.2rem;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
}

.card-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 卡牌内容 */
.card-content {
  padding-top: 10px;
}

.target-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.target-label {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
}

.target-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #2ecc71;
  text-shadow: 0 3px 8px rgba(46, 204, 113, 0.5);
}

.card-description {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
  font-weight: 300;
}

/* 选中指示器 */
.card-indicator {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 24px;
  height: 24px;
  background: #2ecc71;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(46, 204, 113, 0.5);
}

.indicator-icon {
  color: white;
  font-size: 1rem;
  font-weight: bold;
}

/* 当前设置汇总 */
.current-setting-summary {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin: 30px 0;
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.summary-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #ffffff;
}

.summary-value:last-child {
  color: #2ecc71;
}



.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.start-button {
  width: 280px;
  height: 60px;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  border: none;
  border-radius: 20px;
  box-shadow: 0 6px 20px rgba(46, 204, 113, 0.5);
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.start-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(46, 204, 113, 0.7);
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
  border-radius: 20px 20px 0 0;
}



.rules-summary {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-top: 5px solid #9b59b6;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  margin-top: 24px;
  transition: transform 0.3s ease;
}

.rules-summary:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 35px rgba(155, 89, 182, 0.4);
}

.rules-summary h3 {
  color: #ffffff;
  margin-bottom: 16px;
  font-size: 1.5rem;
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
  margin-bottom: 12px;
  padding-left: 32px;
  position: relative;
  line-height: 1.5;
  font-size: 1rem;
  font-weight: 300;
}

.rules-summary li:before {
  content: '✦';
  color: #9b59b6;
  font-size: 1.1rem;
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

/* 中等屏幕优化 */
@media (min-width: 1024px) {
  .menu-container {
    min-width: 70vw;
    max-width: 900px;
  }
  
  .title {
    font-size: 3.2rem;
  }
  
  .title::after {
    width: 140px;
  }
  
  .settings-title {
    font-size: 2rem;
  }
  
  .action-buttons {
    gap: 28px;
  }
}

/* PC布局优化 */
@media (min-width: 1200px) {
  .menu-container {
    min-width: 80vw;
    max-width: 1200px;
    padding: 60px;
  }
  
  .title {
    font-size: 3.5rem;
    margin-bottom: 20px;
  }
  
  .title::after {
    width: 160px;
    height: 5px;
  }
  
  .subtitle {
    font-size: 1.5rem;
    margin-bottom: 60px;
  }
  
  .settings-title {
    font-size: 2.2rem;
    margin-bottom: 45px;
    padding-bottom: 22px;
  }
  
  .setting-item {
    padding: 25px;
    margin-bottom: 45px;
  }
  
  .setting-label {
    font-size: 1.3rem;
    margin-bottom: 18px;
  }
  
  .setting-description {
    font-size: 1.05rem;
    margin-top: 12px;
  }
  
  .target-value .value {
    font-size: 3rem;
    padding: 12px 30px;
  }
  
  .action-buttons {
    gap: 30px;
    margin-top: 60px;
  }
  
  .start-button,
  .back-button {
    height: 80px;
    font-size: 1.5rem;
  }
  
  .rules-summary {
    padding: 40px;
    border-top-width: 6px;
  }
  
  .rules-summary h3 {
    font-size: 1.8rem;
    margin-bottom: 25px;
  }
  
  .rules-summary li {
    font-size: 1.15rem;
    margin-bottom: 18px;
    padding-left: 40px;
  }
  
  .rules-summary li:before {
    font-size: 1.3rem;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .menu-container {
    min-width: 95vw;
    max-width: none;
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
    min-width: 95vw;
    max-width: none;
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