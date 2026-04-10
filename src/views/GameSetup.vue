<template>
  <div class="game-setup">
    <div class="setup-container">
      <h1 class="game-title">在冰冷的她醒来之前</h1>
      <p class="game-subtitle">身份推理 · 恐怖悬疑 · 手牌管理</p>
      
      <div class="setup-form">
        <!-- 玩家人数选择 -->
        <div class="form-group">
          <label class="form-label">玩家人数</label>
          <div class="option-group">
            <button
              v-for="count in [3, 4, 5, 6]"
              :key="count"
              class="option-btn"
              :class="{ active: playerCount === count }"
              @click="playerCount = count"
            >
              {{ count }}人
            </button>
          </div>
        </div>
        
        <!-- AI对手数量选择 -->
        <div class="form-group">
          <label class="form-label">AI对手数量</label>
          <div class="option-group">
            <button
              v-for="count in maxAICount"
              :key="count - 1"
              class="option-btn"
              :class="{ active: aiCount === count - 1 }"
              @click="aiCount = count - 1"
            >
              {{ count - 1 }}个AI
            </button>
          </div>
          <p class="form-hint">至少需要1个真实玩家</p>
        </div>
        
        <!-- 游戏信息预览 -->
        <div class="game-info">
          <h3>游戏配置</h3>
          <div class="info-item">
            <span>真实玩家:</span>
            <span class="highlight">{{ playerCount - aiCount }}人</span>
          </div>
          <div class="info-item">
            <span>AI对手:</span>
            <span class="highlight">{{ aiCount }}个</span>
          </div>
          <div class="info-item">
            <span>调和目标:</span>
            <span class="highlight">{{ harmonyTarget }}点</span>
          </div>
          <div class="info-item">
            <span>使用卡牌:</span>
            <span class="highlight">{{ cardCount }}张</span>
          </div>
        </div>
        
        <!-- 开始游戏按钮 -->
        <button class="start-btn" @click="handleStartGame" :disabled="playerCount - aiCount < 1">
          开始游戏
        </button>
        
        <!-- 游戏规则 -->
        <div class="rules-section">
          <h3>游戏规则</h3>
          <div class="rules-content">
            <p><strong>游戏目标:</strong> 找出犯人并完成尸体调和</p>
            <p><strong>回合行动:</strong> 每位玩家必须选择以下行动之一:</p>
            <ul>
              <li>⚡ <strong>发动技能</strong> - 正面打出卡牌,执行技能效果</li>
              <li>🧪 <strong>调和尸体</strong> - 背面朝上放入调和区,增加强度值</li>
              <li>🔍 <strong>质疑玩家</strong> - 背面朝上放置到其他玩家面前</li>
            </ul>
            <p><strong>身份锁定:</strong> 当手牌只剩1张时,该牌成为身份牌,玩家退出游戏</p>
            <p><strong>游戏结束:</strong> 所有玩家身份锁定后进入结算</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { HARMONY_TARGETS } from '../types/game';
import { getCardsForPlayerCount } from '../data/cards';
import { startGame } from '../stores/gameStore';

const router = { push: (path: string) => window.location.hash = path };

const playerCount = ref(5);
const aiCount = ref(2);

const maxAICount = computed(() => playerCount.value);

const harmonyTarget = computed(() => HARMONY_TARGETS[playerCount.value]);

const cardCount = computed(() => {
  const cards = getCardsForPlayerCount(playerCount.value);
  return cards.reduce((total, card) => total + card.count, 0);
});

function handleStartGame() {
  if (playerCount.value - aiCount.value < 1) {
    alert('至少需要1个真实玩家!');
    return;
  }
  
  startGame(playerCount.value, aiCount.value);
  router.push('/game');
}
</script>

<style scoped>
.game-setup {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.setup-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.game-title {
  font-size: 36px;
  font-weight: bold;
  color: #2d3748;
  text-align: center;
  margin-bottom: 8px;
}

.game-subtitle {
  text-align: center;
  color: #718096;
  font-size: 16px;
  margin-bottom: 32px;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-label {
  font-size: 18px;
  font-weight: bold;
  color: #2d3748;
}

.option-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.option-btn {
  flex: 1;
  min-width: 80px;
  padding: 12px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 16px;
  font-weight: bold;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-btn:hover {
  border-color: #667eea;
  background: #f7fafc;
}

.option-btn.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.form-hint {
  font-size: 12px;
  color: #a0aec0;
  margin-top: 4px;
}

.game-info {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}

.game-info h3 {
  font-size: 18px;
  color: #2d3748;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item span:first-child {
  color: #4a5568;
}

.highlight {
  font-weight: bold;
  color: #667eea;
}

.start-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px 32px;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rules-section {
  background: #fffaf0;
  border: 1px solid #fbd38d;
  border-radius: 8px;
  padding: 20px;
}

.rules-section h3 {
  font-size: 18px;
  color: #2d3748;
  margin-bottom: 16px;
}

.rules-content {
  font-size: 14px;
  color: #4a5568;
  line-height: 1.8;
}

.rules-content p {
  margin-bottom: 8px;
}

.rules-content ul {
  margin-left: 20px;
  margin-bottom: 8px;
}

.rules-content li {
  margin-bottom: 4px;
}
</style>
