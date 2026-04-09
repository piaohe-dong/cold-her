<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="close">✕</button>
      </div>
      
      <div class="modal-body">
        <p class="modal-description">{{ description }}</p>
        
        <!-- 玩家选择列表 -->
        <div class="player-selection">
          <div
            v-for="player in players"
            :key="player.id"
            class="player-option"
            :class="{ selected: selectedPlayerId === player.id }"
            @click="selectPlayer(player.id)"
          >
            <div class="player-option-info">
              <div class="player-option-name">
                {{ player.name }}
                <span v-if="player.isAI" class="ai-badge">AI</span>
              </div>
              <div class="player-option-stats">
                手牌: {{ player.hand.length }} 张
                <span v-if="player.accuseZone.length > 0"> | 质疑: {{ player.accuseZone.length }} 张</span>
              </div>
            </div>
            <div class="player-option-icon">
              {{ selectedPlayerId === player.id ? '✓' : '👉' }}
            </div>
          </div>
        </div>
        
        <!-- 第二步:选择手牌 -->
        <div v-if="selectedPlayerId && showCardSelection" class="card-selection">
          <h4>选择该玩家的一张手牌</h4>
          <div class="card-list">
            <div
              v-for="(card, index) in selectedPlayerHand"
              :key="index"
              class="card-option"
              :class="{ selected: selectedCardIndex === index }"
              @click="selectCard(index)"
            >
              <div class="card-option-number">{{ index + 1 }}</div>
              <div class="card-option-info">
                <div class="card-option-name">{{ card.name }}</div>
                <div class="card-option-strength">强度: {{ card.strength }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" @click="close">取消</button>
        <button
          class="btn-confirm"
          :disabled="!canConfirm"
          @click="confirm"
        >
          确认
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Player, Card } from '../types/game';

const props = defineProps<{
  title: string;
  description: string;
  players: Player[];
  showCardSelection?: boolean;
  currentPlayerId: string;
}>();

const emit = defineEmits<{
  confirm: [playerId: string, cardIndex?: number];
  cancel: [];
}>();

const selectedPlayerId = ref<string>('');
const selectedCardIndex = ref<number>(-1);

const selectedPlayerHand = computed(() => {
  const player = props.players.find(p => p.id === selectedPlayerId.value);
  return player?.hand || [];
});

const canConfirm = computed(() => {
  if (!selectedPlayerId.value) return false;
  if (props.showCardSelection && selectedCardIndex.value < 0) return false;
  return true;
});

function selectPlayer(playerId: string) {
  selectedPlayerId.value = playerId;
  selectedCardIndex.value = -1;
}

function selectCard(index: number) {
  selectedCardIndex.value = index;
}

function confirm() {
  if (!canConfirm.value) return;
  
  emit('confirm', selectedPlayerId.value, selectedCardIndex.value >= 0 ? selectedCardIndex.value : undefined);
}

function close() {
  emit('cancel');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  color: #a0aec0;
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

.modal-description {
  font-size: 14px;
  color: #718096;
  margin-bottom: 16px;
}

.player-selection {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.player-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.player-option:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.player-option.selected {
  border-color: #667eea;
  background: #e0e7ff;
}

.player-option-info {
  flex: 1;
}

.player-option-name {
  font-size: 16px;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 4px;
}

.player-option-stats {
  font-size: 13px;
  color: #718096;
}

.player-option-icon {
  font-size: 24px;
  color: #a0aec0;
}

.player-option.selected .player-option-icon {
  color: #667eea;
}

.card-selection {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #e2e8f0;
}

.card-selection h4 {
  font-size: 16px;
  color: #2d3748;
  margin-bottom: 12px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card-option:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.card-option.selected {
  border-color: #667eea;
  background: #e0e7ff;
}

.card-option-number {
  width: 32px;
  height: 32px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.card-option-info {
  flex: 1;
}

.card-option-name {
  font-size: 14px;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 2px;
}

.card-option-strength {
  font-size: 12px;
  color: #718096;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 2px solid #e2e8f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.btn-cancel {
  background: #edf2f7;
  color: #4a5568;
  border-color: #e2e8f0;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-confirm {
  background: #667eea;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #5568d8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-badge {
  background: #9f7aea;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}
</style>
