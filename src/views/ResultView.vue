<template>
  <div class="result-view">
    <div class="result-container">
      <h1 class="title">游戏结算</h1>
      
      <!-- 主要结果区域 -->
      <div class="main-results">
        <!-- 调和结果 -->
        <div class="result-card harmony-result">
          <div class="result-header">
            <h2>调和结果</h2>
          </div>
          <div class="result-content">
            <div class="harmony-status" :class="harmonyStatusClass">
              <span class="status-text">{{ harmonyResultText }}</span>
            </div>
            <div class="harmony-details">
              <div class="detail-item">
                <span class="label">目标值：</span>
                <span class="value">{{ targetValue }}</span>
              </div>
              <div class="detail-item">
                <span class="label">调和MP：</span>
                <span class="value">{{ harmonyTotalMP }}</span>
              </div>
              <div class="detail-item">
                <span class="label">卡牌数量：</span>
                <span class="value">{{ harmonyArea.length }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 监禁者 -->
        <div class="result-card prisoner-result">
          <div class="result-header">
            <h2>监禁者</h2>
          </div>
          <div class="result-content">
            <div v-if="prisoners.length > 0" class="prisoner-list">
              <div 
                v-for="player in prisoners" 
                :key="player.id"
                class="prisoner-item"
              >
                <span class="player-name">{{ player.name }}</span>
                <span class="player-role">({{ getPlayerRole(player) }})</span>
                <span class="doubt-count">被质疑MP: {{ getPlayerDoubtMP(player.id) }}</span>
              </div>
            </div>
            <div v-else class="no-prisoner">
              无人被监禁
            </div>
          </div>
        </div>
        
        <!-- 获胜者 -->
        <div class="result-card winner-result">
          <div class="result-header">
            <h2>获胜者</h2>
          </div>
          <div class="result-content">
            <div v-if="winners.length > 0" class="winner-list">
              <div 
                v-for="player in winners" 
                :key="player.id"
                class="winner-item"
              >
                <span class="player-name">{{ player.name }}</span>
                <span class="player-role">({{ getPlayerRole(player) }})</span>
                <span class="victory-condition">胜利条件: {{ getPlayerVictoryCondition(player) }}</span>
              </div>
            </div>
            <div v-else class="no-winner">
              全灭结局（无人满足胜利条件）
            </div>
          </div>
        </div>
      </div>
      
      <!-- 玩家身份列表 -->
      <div class="player-roles-card">
        <div class="result-header">
          <h2>玩家身份</h2>
        </div>
        <div class="player-roles-list">
          <div 
            v-for="player in players" 
            :key="player.id"
            class="player-role-item"
            :class="{ 'prisoner': isPlayerPrisoner(player.id), 'winner': isPlayerWinner(player.id) }"
          >
            <div class="player-info">
              <span class="player-name">{{ player.name }}</span>
              <span class="player-type">{{ player.type === 'human' ? '玩家' : 'AI' }}</span>
            </div>
            <div class="role-info">
              <span class="role">身份: {{ getPlayerRole(player) }}</span>
              <span class="hand-count">手牌: {{ player.handCards.length }}</span>
            </div>
            <div class="status-info">
              <span class="exit-status">{{ player.isExited ? '已退出' : '进行中' }}</span>
              <span class="victory-condition">条件: {{ getPlayerVictoryCondition(player) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 出牌记录 -->
      <div class="play-history-card">
        <div class="result-header">
          <h2>出牌记录</h2>
        </div>
        <div class="play-history-list">
          <div 
            v-for="(record, index) in playHistory" 
            :key="index"
            class="play-record"
          >
            <div class="record-header">
              <span class="turn">回合 {{ index + 1 }}</span>
              <span class="player">玩家: {{ record.playerName }}</span>
              <span class="action">{{ record.action }}</span>
            </div>
            <div class="record-details">
              <span class="card">卡牌: {{ record.cardName }} (MP: {{ record.cardMP }})</span>
              <span class="target" v-if="record.target">目标: {{ record.target }}</span>
              <span class="location" v-if="record.location">位置: {{ record.location }}</span>
            </div>
          </div>
          <div v-if="playHistory.length === 0" class="no-history">
            无出牌记录
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button
          type="primary"
          size="large"
          @click="playAgain"
          class="play-again-button"
        >
          再玩一次
        </el-button>
        <el-button
          size="large"
          @click="backToMenu"
          class="menu-button"
        >
          返回菜单
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { ElButton } from 'element-plus'

const router = useRouter()
const gameStore = useGameStore()

// 计算调和结果
const harmonyResultText = computed(() => {
  return gameStore.isHarmonySuccess ? '调和成功' : '调和失败'
})

const harmonyStatusClass = computed(() => {
  return gameStore.isHarmonySuccess ? 'success' : 'fail'
})

// 获取监禁者（被质疑MP合计值最高的玩家）
const prisoners = computed(() => {
  return gameStore.getPrisoners()
})

// 获取获胜者
const winners = computed(() => {
  return gameStore.getWinners()
})

// 辅助函数
const targetValue = computed(() => gameStore.targetValue)
const harmonyTotalMP = computed(() => gameStore.harmonyTotalMP)
const harmonyArea = computed(() => gameStore.harmonyArea)
const players = computed(() => gameStore.players)

// 获取玩家角色（手牌中的身份牌）
const getPlayerRole = (player: any) => {
  // TODO: 实现角色获取逻辑
  // 玩家可能有多张手牌，但只有一张身份牌（犯人、外星人等）
  // 暂时返回未知
  return '未知'
}

// 获取玩家被质疑的MP合计值
const getPlayerDoubtMP = (playerId: string) => {
  // TODO: 实现被质疑MP计算
  return 0
}

// 获取玩家胜利条件
const getPlayerVictoryCondition = (player: any) => {
  // TODO: 实现胜利条件获取
  return '未知'
}

// 判断玩家是否为监禁者
const isPlayerPrisoner = (playerId: string) => {
  return prisoners.value.some(p => p.id === playerId)
}

// 判断玩家是否为获胜者
const isPlayerWinner = (playerId: string) => {
  return winners.value.some(p => p.id === playerId)
}

// 出牌记录（模拟数据）
const playHistory = computed(() => {
  // TODO: 实现真实的出牌记录
  return [
    { playerName: '玩家', action: '调和', cardName: '学生会长', cardMP: 3, location: '调和区域' },
    { playerName: 'AI1', action: '质疑', cardName: '风纪委员', cardMP: 1, target: '玩家' },
    { playerName: 'AI2', action: '特技', cardName: '班长', cardMP: 2, actionDetail: '和玩家互换手牌' }
  ]
})

// 再玩一次
const playAgain = () => {
  // 重新开始游戏，保留设置
  const { playerCount, enableChaosMode } = gameStore.settings
  gameStore.startGame(playerCount, enableChaosMode)
  router.push('/game')
}

// 返回菜单
const backToMenu = () => {
  router.push('/menu')
}

// 组件挂载时检查游戏状态
onMounted(() => {
  // 如果没有游戏数据，跳回菜单
  if (gameStore.players.length === 0) {
    router.push('/menu')
  }
})
</script>

<style scoped>
.result-view {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #0c2461 0%, #1e3799 50%, #4a69bd 100%);
  padding: 20px;
  animation: fadeIn 0.8s ease-out;
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

.result-container {
  width: 100%;
  max-width: 1200px;
  background-color: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* PC 端布局优化 */
@media (min-width: 1025px) {
  .result-container {
    width: 80vw;
    min-width: 1000px;
    max-width: 1400px;
  }
  
  .main-results {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .player-roles-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .play-history-list {
    max-height: 500px;
  }
  
  .title {
    font-size: 3rem;
    margin-bottom: 50px;
  }
  
  .result-card {
    padding: 30px;
  }
  
  .result-header h2 {
    font-size: 1.8rem;
  }
  
  .harmony-status {
    font-size: 2rem;
    padding: 25px;
  }
  
  .action-buttons {
    gap: 30px;
  }
  
  .play-again-button, .menu-button {
    min-width: 250px;
    height: 70px;
    font-size: 1.3rem;
  }
}

.title {
  text-align: center;
  color: #ffffff;
  margin-bottom: 40px;
  font-size: 2.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

/* 主要结果区域 */
.main-results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 30px;
}

.result-card {
  background-color: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
  border-top: 4px solid;
  animation: cardSlideIn 0.6s ease-out;
  transition: all 0.3s ease;
}

.result-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.harmony-result {
  border-top-color: #3498db;
}

.prisoner-result {
  border-top-color: #e74c3c;
}

.winner-result {
  border-top-color: #2ecc71;
}

.result-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #dee2e6;
}

.result-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

/* 调和结果 */
.harmony-status {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 1.8rem;
  font-weight: bold;
}

.harmony-status.success {
  background-color: #d4edda;
  color: #155724;
}

.harmony-status.fail {
  background-color: #f8d7da;
  color: #721c24;
}

.harmony-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item .label {
  font-weight: 600;
  color: #495057;
}

.detail-item .value {
  font-weight: bold;
  color: #212529;
}

/* 监禁者和获胜者列表 */
.prisoner-list, .winner-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.prisoner-item, .winner-item {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  border-left: 4px solid;
}

.prisoner-item {
  border-left-color: #e74c3c;
}

.winner-item {
  border-left-color: #2ecc71;
}

.player-name {
  font-weight: bold;
  color: #2c3e50;
  margin-right: 10px;
}

.player-role, .victory-condition, .doubt-count {
  font-size: 14px;
  color: #6c757d;
  margin-right: 15px;
}

.no-prisoner, .no-winner {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  font-style: italic;
}

/* 玩家身份列表 */
.player-roles-card {
  background-color: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 30px;
  border-top: 4px solid #f39c12;
}

.player-roles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-role-item {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid #dee2e6;
  transition: all 0.3s;
}

.player-role-item.prisoner {
  border-color: #e74c3c;
  background-color: #fff5f5;
}

.player-role-item.winner {
  border-color: #2ecc71;
  background-color: #f0fff4;
}

.player-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.player-name {
  font-weight: bold;
  color: #2c3e50;
  font-size: 1.2rem;
}

.player-type {
  padding: 4px 12px;
  background-color: #e9ecef;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  color: #495057;
}

.role-info, .status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.role, .hand-count, .exit-status, .victory-condition {
  font-size: 14px;
  color: #6c757d;
}

.role {
  font-weight: bold;
  color: #495057;
}

/* 出牌记录 */
.play-history-card {
  background-color: #f8f9fa;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 30px;
  border-top: 4px solid #9b59b6;
}

.play-history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.play-record {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid #9b59b6;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dee2e6;
}

.turn {
  font-weight: bold;
  color: #2c3e50;
}

.player, .action {
  color: #6c757d;
  font-size: 14px;
}

.record-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.card, .target, .location {
  font-size: 14px;
  color: #495057;
}

.card {
  font-weight: bold;
}

.no-history {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  font-style: italic;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.play-again-button, .menu-button {
  min-width: 200px;
  height: 56px;
  font-size: 1.1rem;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.play-again-button:hover, .menu-button:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

/* 平板设备适配 */
@media (max-width: 1024px) {
  .main-results {
    grid-template-columns: 1fr;
  }
  
  .player-roles-list {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .play-again-button, .menu-button {
    width: 100%;
  }
  
  .result-container {
    width: 95vw;
    min-width: 0;
  }
}

/* 小平板和大屏手机适配 */
@media (max-width: 768px) {
  .result-container {
    padding: 25px;
    margin: 10px;
    width: 98vw;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .record-header, .record-details, .player-info, .role-info, .status-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .player-name {
    font-size: 1.1rem;
  }
  
  .result-card {
    padding: 20px;
  }
  
  .result-header h2 {
    font-size: 1.4rem;
  }
  
  .harmony-status {
    font-size: 1.6rem;
  }
}

/* 手机设备适配 */
@media (max-width: 480px) {
  .result-container {
    padding: 20px;
    margin: 5px;
    width: 100vw;
  }
  
  .title {
    font-size: 1.8rem;
    margin-bottom: 30px;
  }
  
  .result-card {
    padding: 15px;
  }
  
  .result-header h2 {
    font-size: 1.2rem;
  }
  
  .harmony-status {
    font-size: 1.4rem;
    padding: 15px;
  }
  
  .play-again-button, .menu-button {
    min-width: 100%;
    height: 50px;
    font-size: 1rem;
  }
  
  .play-history-list {
    max-height: 300px;
  }
  
  .play-record {
    padding: 15px;
  }
  
  .player-role-item {
    padding: 15px;
  }
}
</style>