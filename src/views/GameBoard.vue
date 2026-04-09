<template>
  <div class="game-board">
    <!-- 顶部信息栏 -->
    <div class="game-header">
      <div class="header-left">
        <button class="back-btn" @click="backToMenu">← 返回</button>
      </div>
      <div class="header-center">
        <h2 class="game-title-small">在冰冷的她醒来之前</h2>
      </div>
      <div class="header-right">
        <div class="game-info-badge">
          <span>回合:</span>
          <span class="highlight">{{ gameState.turnCount }}</span>
        </div>
        <div class="game-info-badge">
          <span>调和:</span>
          <span class="highlight">{{ harmonyTotal }}/{{ gameState.harmonyTarget }}</span>
        </div>
      </div>
    </div>
    
    <!-- 游戏主区域 -->
    <div class="game-content">
      <!-- 左侧:玩家区域 -->
      <div class="players-area">
        <div class="current-turn-indicator" v-if="currentPlayer">
          当前回合: <strong>{{ currentPlayer.name }}</strong>
          <span v-if="currentPlayer.isAI" class="ai-thinking">(思考中...)</span>
        </div>
        
        <div class="players-grid">
          <PlayerArea
            v-for="(player, index) in gameState.players"
            :key="player.id"
            :player="player"
            :is-current-player="index === gameState.currentPlayerIndex"
            :show-hand="true"
            :show-accuse-cards="false"
            :show-identity="gameState.phase === 'game_over'"
            :can-select-card="false"
            :selected-card-index="-1"
          />
        </div>
      </div>
      
      <!-- 右侧:调和区 + 胜利条件 -->
      <div class="right-panel">
        <!-- 调和区 -->
        <div class="harmony-panel-compact">
          <h3>🧪 调和区</h3>
          <div class="harmony-compact-info">
            <div class="info-row">
              <span class="info-label">卡牌:</span>
              <span class="info-value">{{ gameState.harmonyZone.length }} 张</span>
            </div>
            <div class="info-row">
              <span class="info-label">目标:</span>
              <span class="info-value">{{ gameState.harmonyTarget }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">当前:</span>
              <span class="info-value" :class="{ 'value-success': harmonyTotal >= gameState.harmonyTarget }">
                {{ showHarmonyCards ? harmonyTotal : (lastKnownHarmonyValue !== null ? (harmonyChanged ? `${lastKnownHarmonyValue} + ?` : lastKnownHarmonyValue) : '?') }}
              </span>
            </div>
          </div>
          
          <div class="harmony-mini-progress">
            <div class="mini-progress-bar">
              <div 
                class="mini-progress-fill" 
                :style="{ width: `${Math.min(100, (harmonyTotal / gameState.harmonyTarget) * 100)}%` }"
              ></div>
            </div>
          </div>
          
          <button 
            v-if="gameState.harmonyZone.length > 0"
            class="view-harmony-btn-compact"
            @click="viewHarmony"
          >
            {{ showHarmonyCards ? '查看中...' : '查看卡牌' }}
          </button>
        </div>
        
        <!-- 胜利条件说明 -->
        <div class="win-conditions-panel">
          <h3>🏆 胜利条件</h3>
          <div class="conditions-list">
            <div v-for="(condition, idx) in winConditions" :key="idx" class="condition-item" :class="`priority-${condition.priority}`">
              <div class="condition-priority">{{ condition.priority }}</div>
              <div class="condition-content">
                <div class="condition-faction">{{ condition.faction }}</div>
                <div class="condition-desc">{{ condition.desc }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部:当前玩家手牌区 -->
    <div class="player-hand-section" v-if="currentPlayer && !currentPlayer.isAI">
      <div class="hand-section-header">
        <h3>🎴 我的手牌</h3>
        <span class="hand-count">{{ currentPlayer.hand.length }} 张</span>
      </div>
      
      <!-- 错误提示 -->
      <div v-if="actionError" class="action-error">
        {{ actionError }}
      </div>
      
      <div class="hand-cards-container">
        <div v-if="currentPlayer.hand.length === 0" class="empty-hand">
          无手牌
        </div>
        <div v-else class="hand-cards-grid">
          <div 
            v-for="(card, index) in currentPlayer.hand"
            :key="card.id"
            class="card-wrapper"
            :class="{ 'card-selected-wrapper': selectedCardIndex === index }"
          >
            <Card
              :card="card"
              :face-up="true"
              :clickable="isCurrentPlayerTurn"
              :selected="selectedCardIndex === index"
              @click="onCardSelect(index)"
            />
            
            <!-- 行动按钮菜单 -->
            <div v-if="selectedCardIndex === index && isCurrentPlayerTurn" class="card-action-menu">
              <button 
                class="action-menu-btn skill-btn"
                :disabled="!canUseSkill || card.skillType === 'none'"
                @click="onCardActionSelect('use_skill', index)"
              >
                <div class="btn-icon">⚡</div>
                <div class="btn-text">发动技能</div>
                <div class="btn-desc">正面打出卡牌</div>
              </button>
              
              <button 
                class="action-menu-btn harmonize-btn"
                @click="onCardActionSelect('harmonize', index)"
              >
                <div class="btn-icon">🧪</div>
                <div class="btn-text">调和尸体</div>
                <div class="btn-desc">背面朝上放入调和区</div>
              </button>
              
              <button 
                class="action-menu-btn accuse-btn"
                @click="onCardActionSelect('accuse', index)"
              >
                <div class="btn-icon">🔍</div>
                <div class="btn-text">质疑玩家</div>
                <div class="btn-desc">背面朝上放置到其他玩家面前</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 游戏结束面板 (悬浮居中) -->
    <div v-if="gameState.phase === 'game_over' && gameState.results && showResolutionPanel" class="resolution-modal">
      <div class="modal-overlay" @click="showResolutionPanel = false"></div>
      <div class="modal-content">
        <ResolutionPanel
          :results="gameState.results"
          :players="gameState.players"
          :harmony-target="gameState.harmonyTarget"
          @back-to-menu="backToMenu"
          @close="showResolutionPanel = false"
        />
      </div>
    </div>
    
    <!-- 消息日志 -->
    <div class="message-log">
      <div class="log-header" @click="toggleLog">
        <span>游戏日志</span>
        <span class="toggle-icon">{{ showLog ? '▼' : '▶' }}</span>
      </div>
      <!-- 结算详情按钮 -->
      <div v-if="gameState.phase === 'game_over' && gameState.results && !showResolutionPanel" class="resolution-button-container">
        <button class="resolution-toggle-btn" @click="showResolutionPanel = true">
          📊 结算详情
        </button>
      </div>
      <div v-if="showLog" class="log-content">
        <div v-for="(msg, index) in messageLog" :key="index" class="log-item">
          {{ msg }}
        </div>
      </div>
    </div>
    
    <!-- 目标选择器 -->
    <TargetSelector
      v-if="showTargetSelector"
      :title="selectorTitle"
      :description="selectorDescription"
      :players="availableTargets"
      :show-card-selection="needCardSelection"
      :current-player-id="currentPlayer.id"
      @confirm="onTargetConfirm"
      @cancel="onTargetCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { ActionType, Player } from '../types/game';
import { ActionType as ActionTypeEnum } from '../types/game';
import { getGameState, getMessageLog, playerAction, resetGame } from '../stores/gameStore';
import Card from '../components/Card.vue';
import PlayerArea from '../components/PlayerArea.vue';
import ResolutionPanel from '../components/ResolutionPanel.vue';
import TargetSelector from '../components/TargetSelector.vue';

const gameState = getGameState();
const messageLog = getMessageLog();

const selectedCardIndex = ref(-1);
const showLog = ref(false);
const actionError = ref('');
const showResolutionPanel = ref(true); // 游戏结束面板显示状态

// 调和区查看状态
const showHarmonyCards = ref(false);
const lastKnownHarmonyValue = ref<number | null>(null);
const harmonyChanged = ref(false);

// 胜利条件数据
const winConditions = [
  { faction: '宇宙人', desc: '被监禁即可获胜', priority: 1 },
  { faction: '感染者', desc: '调和失败即可获胜', priority: 2 },
  { faction: '犯人与共犯', desc: '犯人未被监禁', priority: 3 },
  { faction: '学生阵营', desc: '调和成功且犯人被监禁', priority: 4 },
  { faction: '归宅部', desc: '自己未被监禁且调和失败', priority: 5 }
];

// 目标选择器状态
const showTargetSelector = ref(false);
const selectorTitle = ref('');
const selectorDescription = ref('');
const needCardSelection = ref(false);
const pendingAction = ref<{actionType: ActionType; cardIndex: number} | null>(null);

const availableTargets = computed(() => {
  return gameState.players.filter(p => p.id !== currentPlayer.value.id);
});

const currentPlayer = computed(() => {
  return gameState.players[gameState.currentPlayerIndex];
});

const harmonyTotal = computed(() => {
  return gameState.harmonyZone.reduce((sum, card) => sum + card.strength, 0);
});

const harmonyDisplayValue = computed(() => {
  if (showHarmonyCards.value) {
    return `${harmonyTotal.value} / ${gameState.harmonyTarget}`;
  }
  
  if (lastKnownHarmonyValue.value !== null) {
    if (harmonyChanged.value) {
      return `${lastKnownHarmonyValue.value} + ? / ${gameState.harmonyTarget}`;
    }
    return `${lastKnownHarmonyValue.value} / ${gameState.harmonyTarget}`;
  }
  
  return `? / ${gameState.harmonyTarget}`;
});

// 计算当前是否是玩家回合
const isCurrentPlayerTurn = computed(() => {
  return currentPlayer.value && !currentPlayer.value.isAI;
});

// 计算是否可以发动技能
const canUseSkill = computed(() => {
  if (!currentPlayer.value) return false;
  return !currentPlayer.value.cannotUseSkill && 
         currentPlayer.value.hand.some(card => card.skillType !== 'none');
});

async function onCardSelect(index: number) {
  // 如果点击已经选中的卡牌,取消选择
  if (selectedCardIndex.value === index) {
    selectedCardIndex.value = -1;
  } else {
    selectedCardIndex.value = index;
  }
}

async function onCardActionSelect(actionType: ActionType, cardIndex: number) {
  await executeAction(actionType, cardIndex);
}

async function executeAction(actionType: ActionType, cardIndex: number) {
  const card = currentPlayer.value.hand[cardIndex];
  
  // 如果是质疑行动,需要选择目标
  if (actionType === ActionTypeEnum.ACCUSE) {
    pendingAction.value = { actionType, cardIndex };
    selectorTitle.value = '选择质疑目标';
    selectorDescription.value = `将使用 ${card.name} 质疑一名玩家`;
    needCardSelection.value = false;
    showTargetSelector.value = true;
    return;
  }
  
  // 如果是技能,且需要目标玩家,也弹出选择器
  if (actionType === ActionTypeEnum.USE_SKILL && card && card.skillType !== 'none') {
    // 检查技能是否需要目标
    const needsTarget = [
      'view_one_card',
      'view_all_cards',
      'swap_one_card',
      'block_skill',
      'view_identity',
      'give_card',
      'force_harmonize'
    ].includes(card.skillType);
    
    if (needsTarget) {
      pendingAction.value = { actionType, cardIndex };
      selectorTitle.value = `选择技能目标`;
      selectorDescription.value = `发动 ${card.name}: ${card.skill}`;
      // 图书委员需要选牌
      needCardSelection.value = card.skillType === 'view_one_card' || card.skillType === 'view_all_cards';
      showTargetSelector.value = true;
      return;
    }
  }
  
  // 不需要目标的行动,直接执行
  await performAction(actionType, cardIndex);
}

async function performAction(actionType: ActionType, cardIndex: number, targetPlayerId?: string, targetCardIndex?: number) {
  let params: any = {};
  
  if (targetPlayerId) {
    params.targetPlayerId = targetPlayerId;
  }
  
  if (targetCardIndex !== undefined) {
    params.cardIndex = targetCardIndex;
  }
  
  const success = await playerAction(actionType, cardIndex, Object.keys(params).length > 0 ? params : undefined);
  
  if (success) {
    resetSelection();
    actionError.value = '';
  } else {
    actionError.value = '行动执行失败,请重试';
  }
}

function onTargetConfirm(playerId: string, cardIndex?: number) {
  showTargetSelector.value = false;
  
  if (pendingAction.value) {
    performAction(pendingAction.value.actionType, pendingAction.value.cardIndex, playerId, cardIndex);
    pendingAction.value = null;
  }
}

function onTargetCancel() {
  showTargetSelector.value = false;
  pendingAction.value = null;
  resetSelection();
}

function resetSelection() {
  selectedCardIndex.value = -1;
}

function toggleLog() {
  showLog.value = !showLog.value;
}

function viewHarmony() {
  showHarmonyCards.value = true;
  lastKnownHarmonyValue.value = harmonyTotal.value;
  harmonyChanged.value = false;
  
  // 5秒后自动隐藏
  setTimeout(() => {
    showHarmonyCards.value = false;
  }, 5000);
}

function backToMenu() {
  resetGame();
  window.location.hash = '#/';
}

// 监听当前玩家变化,如果是AI则自动执行
watch(() => gameState.currentPlayerIndex, () => {
  resetSelection();
});

// 监听调和区变化
watch(() => gameState.harmonyZone.length, (newLen, oldLen) => {
  if (oldLen !== undefined && newLen !== oldLen) {
    // 调和区有变化
    if (lastKnownHarmonyValue.value !== null && !showHarmonyCards.value) {
      harmonyChanged.value = true;
    }
  }
});
</script>

<style scoped>
.game-board {
  min-height: 100vh;
  background: #f7fafc;
  display: flex;
  flex-direction: column;
}

.game-header {
  background: white;
  border-bottom: 2px solid #e2e8f0;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left,
.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.back-btn {
  background: #edf2f7;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #4a5568;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #e2e8f0;
}

.game-title-small {
  font-size: 20px;
  font-weight: bold;
  color: #2d3748;
  margin: 0;
}

.game-info-badge {
  background: #edf2f7;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  color: #4a5568;
}

.game-info-badge .highlight {
  font-weight: bold;
  color: #667eea;
  margin-left: 4px;
}

.game-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  gap: 20px;
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
}

/* 调和区精简样式 */
.harmony-panel-compact {
  min-width: 320px;
  background: white;
  border: 2px solid #667eea;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.harmony-panel-compact h3 {
  font-size: 18px;
  color: #2d3748;
  margin: 0 0 12px 0;
  text-align: center;
}

.harmony-compact-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f7fafc;
  border-radius: 6px;
}

.info-label {
  font-size: 14px;
  color: #718096;
  font-weight: bold;
}

.info-value {
  font-size: 16px;
  color: #2d3748;
  font-weight: bold;
}

.info-value.value-success {
  color: #48bb78;
}

.harmony-mini-progress {
  margin-bottom: 12px;
}

.mini-progress-bar {
  height: 12px;
  background: #edf2f7;
  border-radius: 6px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #68d391 0%, #48bb78 100%);
  transition: width 0.3s ease;
}

.view-harmony-btn-compact {
  width: 100%;
  padding: 10px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-harmony-btn-compact:hover {
  background: #5568d8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.view-harmony-btn-compact:disabled {
  background: #a0aec0;
  cursor: not-allowed;
  transform: none;
}

/* 胜利条件面板 */
.win-conditions-panel {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.win-conditions-panel h3 {
  font-size: 18px;
  color: #2d3748;
  margin: 0 0 12px 0;
  text-align: center;
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.condition-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  border-left: 3px solid;
  background: #f7fafc;
  transition: all 0.2s ease;
}

.condition-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.condition-item.priority-1 {
  border-left-color: #9f7aea;
  background: #faf5ff;
}

.condition-item.priority-2 {
  border-left-color: #f56565;
  background: #fff5f5;
}

.condition-item.priority-3 {
  border-left-color: #ed8936;
  background: #fffaf0;
}

.condition-item.priority-4 {
  border-left-color: #4299e1;
  background: #ebf8ff;
}

.condition-item.priority-5 {
  border-left-color: #a0aec0;
  background: #f7fafc;
}

.condition-priority {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.priority-1 .condition-priority {
  background: #9f7aea;
}

.priority-2 .condition-priority {
  background: #f56565;
}

.priority-3 .condition-priority {
  background: #ed8936;
}

.priority-4 .condition-priority {
  background: #4299e1;
}

.priority-5 .condition-priority {
  background: #a0aec0;
}

.condition-content {
  flex: 1;
}

.condition-faction {
  font-size: 14px;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 4px;
}

.condition-desc {
  font-size: 12px;
  color: #718096;
  line-height: 1.4;
}

/* 玩家手牌区域 */
.player-hand-section {
  background: white;
  border-top: 2px solid #e2e8f0;
  padding: 20px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.hand-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 20px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.hand-section-header h3 {
  font-size: 18px;
  color: #2d3748;
  margin: 0;
}

.hand-count {
  font-size: 14px;
  color: #667eea;
  font-weight: bold;
  padding: 6px 12px;
  background: #ebf4ff;
  border-radius: 6px;
}

.hand-cards-container {
  max-width: 1200px;
  margin: 0 auto;
  min-height: 140px;
}

.empty-hand {
  text-align: center;
  color: #a0aec0;
  padding: 30px;
  font-size: 14px;
}

.hand-cards-grid {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 20px;
}

.hand-cards-grid .card {
  width: 140px;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hand-cards-grid .card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.players-area {
  flex: 1;
  max-width: calc(100% - 320px);
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.current-turn-indicator {
  background: #ebf8ff;
  border: 2px solid #4299e1;
  border-radius: 8px;
  padding: 12px 16px;
  text-align: center;
  font-size: 16px;
  color: #2d3748;
}

.current-turn-indicator strong {
  color: #4299e1;
}

.ai-thinking {
  color: #9f7aea;
  margin-left: 8px;
  font-style: italic;
}

.resolution-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  z-index: 1001;
  max-width: 900px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.action-section {
  max-width: 1200px;
  margin: 0 auto;
}

.select-hint {
  background: #fefcbf;
  border: 1px solid #f6e05e;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  color: #975a16;
  font-weight: bold;
  margin-top: 12px;
}

.message-log {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 300px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.log-header {
  padding: 12px 16px;
  background: #f7fafc;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: #4a5568;
}

.log-header:hover {
  background: #edf2f7;
}

.log-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
}

.log-item {
  font-size: 12px;
  color: #4a5568;
  padding: 4px 0;
  border-bottom: 1px solid #f7fafc;
}

.log-item:last-child {
  border-bottom: none;
}

/* 卡牌行动菜单样式 */
.card-wrapper {
  position: relative;
  display: inline-block;
}

.card-selected-wrapper {
  z-index: 10;
}

.card-action-menu {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%) translateY(-100%);
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 20;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-menu-btn {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.action-menu-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-menu-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-btn:hover:not(:disabled) {
  border-color: #f6ad55;
  background: #fffaf0;
}

.harmonize-btn:hover:not(:disabled) {
  border-color: #68d391;
  background: #f0fff4;
}

.accuse-btn:hover:not(:disabled) {
  border-color: #fc8181;
  background: #fff5f5;
}

.action-menu-btn .btn-icon {
  font-size: 24px;
}

.action-menu-btn .btn-text {
  font-size: 14px;
  font-weight: bold;
  color: #2d3748;
}

.action-menu-btn .btn-desc {
  font-size: 10px;
  color: #718096;
  text-align: center;
  line-height: 1.3;
}

.action-error {
  background: #fed7d7;
  border: 1px solid #f56565;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  color: #c53030;
  font-weight: bold;
  margin: 12px auto;
  max-width: 800px;
}

.hand-cards-grid {
  position: relative;
}

/* 结算详情按钮样式 */
.resolution-button-container {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f7fafc;
}

.resolution-toggle-btn {
  width: 100%;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.resolution-toggle-btn:hover {
  background: #3182ce;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
}
</style>
