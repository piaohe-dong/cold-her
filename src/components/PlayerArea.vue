<template>
  <div class="player-area" :class="{ 'current-player': isCurrentPlayer, 'locked': player.isLocked }">
    <!-- 玩家信息 -->
    <div class="player-header">
      <div class="player-name">
        {{ player.name }}
        <span v-if="player.isAI" class="ai-badge">AI</span>
        <span v-if="player.isLocked" class="locked-badge">已锁定</span>
      </div>
    </div>
    
    <!-- 简化信息展示 -->
    <div class="player-summary">
      <div class="summary-item" @click="showDetail('hand')">
        <span class="summary-icon">🎴</span>
        <span class="summary-value">{{ player.hand.length }}</span>
        <span class="summary-label">手牌</span>
        <span class="click-hint">点击查看详情</span>
      </div>
      <div class="summary-item" @click="showDetail('accuse')" v-if="player.accuseZone.length > 0">
        <span class="summary-icon">🔍</span>
        <span class="summary-value">{{ player.accuseZone.length }}</span>
        <span class="summary-label">质疑</span>
        <span class="click-hint">点击查看详情</span>
      </div>
    </div>
    
    <!-- 身份牌(游戏结束后显示) -->
    <div v-if="showIdentity && player.identityCard" class="identity-zone">
      <div class="zone-label">身份牌</div>
      <Card :card="player.identityCard" :face-up="true" />
    </div>
    
    <!-- 详情弹窗 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="close-btn" @click="closeDetail">✕</button>
        </div>
        <div class="modal-body">
          <!-- 手牌详情 -->
          <div v-if="detailType === 'hand'" class="detail-cards">
            <div v-if="player.hand.length === 0" class="empty-detail">
              无手牌
            </div>
            <div v-else class="cards-grid">
              <Card
                v-for="(card, index) in player.hand"
                :key="card.id"
                :card="card"
                :face-up="true"
                :clickable="isCurrentPlayer && canSelectCard"
                :selected="isCurrentPlayer && selectedCardIndex === index"
                @click="isCurrentPlayer && canSelectCard ? selectCard(index) : null"
              />
            </div>
          </div>
          
          <!-- 质疑区详情 -->
          <div v-if="detailType === 'accuse'" class="detail-cards">
            <div v-if="player.accuseZone.length === 0" class="empty-detail">
              无质疑牌
            </div>
            <div v-else class="cards-grid">
              <Card
                v-for="card in player.accuseZone"
                :key="card.id"
                :card="card"
                :face-up="true"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Player } from '../types/game';
import Card from './Card.vue';

const props = defineProps<{
  player: Player;
  isCurrentPlayer?: boolean;
  showHand?: boolean;
  showAccuseCards?: boolean;
  showIdentity?: boolean;
  canSelectCard?: boolean;
  selectedCardIndex?: number;
}>();

const emit = defineEmits<{
  cardSelect: [index: number];
}>();

// 详情弹窗状态
const showDetailModal = ref(false);
const detailType = ref<'hand' | 'accuse' | ''>('');

const modalTitle = computed(() => {
  if (detailType.value === 'hand') {
    return `${props.player.name} 的手牌 (${props.player.hand.length} 张)`;
  } else if (detailType.value === 'accuse') {
    return `${props.player.name} 的质疑区 (${props.player.accuseZone.length} 张)`;
  }
  return '';
});

function showDetail(type: 'hand' | 'accuse') {
  detailType.value = type;
  showDetailModal.value = true;
}

function closeDetail() {
  showDetailModal.value = false;
  detailType.value = '';
}

function selectCard(index: number) {
  if (props.canSelectCard) {
    emit('cardSelect', index);
  }
}
</script>

<style scoped>
.player-area {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  min-height: 120px;
}

.current-player {
  border-color: #4299e1;
  background: #ebf8ff;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.locked {
  opacity: 0.7;
  border-style: dashed;
}

.player-header {
  margin-bottom: 16px;
}

.player-name {
  font-size: 18px;
  font-weight: bold;
  color: #2d3748;
}

.ai-badge {
  background: #9f7aea;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

.locked-badge {
  background: #a0aec0;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

/* 简化信息展示 */
.player-summary {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.summary-item {
  flex: 1;
  min-width: 120px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.summary-item:hover {
  border-color: #667eea;
  background: #ebf4ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.summary-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 32px;
  font-weight: bold;
  color: #2d3748;
  display: block;
  margin-bottom: 4px;
}

.summary-label {
  font-size: 13px;
  color: #718096;
  font-weight: bold;
  display: block;
  margin-bottom: 4px;
}

.click-hint {
  font-size: 11px;
  color: #667eea;
  opacity: 0;
  transition: opacity 0.3s ease;
  display: block;
}

.summary-item:hover .click-hint {
  opacity: 1;
}

.identity-zone {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px solid #4299e1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.zone-label {
  font-size: 12px;
  color: #718096;
  margin-bottom: 8px;
  font-weight: bold;
}

.identity-zone .card {
  width: 100px;
  height: 142px;
}

/* 详情弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid #e2e8f0;
}

.modal-header h3 {
  font-size: 20px;
  color: #2d3748;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #718096;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f7fafc;
  color: #2d3748;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.detail-cards {
  min-height: 100px;
}

.empty-detail {
  text-align: center;
  color: #a0aec0;
  padding: 40px;
  font-size: 16px;
}

.cards-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.cards-grid .card {
  width: 140px;
  flex-shrink: 0;
}
</style>
