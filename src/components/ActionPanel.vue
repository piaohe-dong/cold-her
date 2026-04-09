<template>
  <div class="action-panel">
    <div class="panel-title">选择行动</div>
    
    <div class="action-buttons">
      <button 
        class="action-btn skill-btn" 
        @click="selectAction('use_skill')"
        :disabled="!canUseSkill"
      >
        <div class="btn-icon">⚡</div>
        <div class="btn-text">发动技能</div>
        <div class="btn-desc">正面打出卡牌,执行技能</div>
      </button>
      
      <button 
        class="action-btn harmonize-btn" 
        @click="selectAction('harmonize')"
      >
        <div class="btn-icon">🧪</div>
        <div class="btn-text">调和尸体</div>
        <div class="btn-desc">背面朝上放入调和区</div>
      </button>
      
      <button 
        class="action-btn accuse-btn" 
        @click="selectAction('accuse')"
      >
        <div class="btn-icon">🔍</div>
        <div class="btn-text">质疑玩家</div>
        <div class="btn-desc">背面朝上放置到其他玩家面前</div>
      </button>
    </div>
    
    <!-- 提示信息 -->
    <div v-if="message" class="action-message">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ActionType, Player } from '../types/game';
import { ActionType as ActionTypeEnum } from '../types/game';

const props = defineProps<{
  currentPlayer: Player;
  harmonyProgress: number;
  harmonyTarget: number;
  message?: string;
}>();

const emit = defineEmits<{
  actionSelect: [actionType: ActionType];
}>();

const canUseSkill = computed(() => {
  return !props.currentPlayer.cannotUseSkill && 
         props.currentPlayer.hand.some(card => card.skillType !== 'none');
});

function selectAction(actionType: ActionType) {
  emit('actionSelect', actionType);
}
</script>

<style scoped>
.action-panel {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
}

.panel-title {
  font-size: 20px;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 16px;
  text-align: center;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.action-btn {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn:disabled {
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

.btn-icon {
  font-size: 32px;
}

.btn-text {
  font-size: 16px;
  font-weight: bold;
  color: #2d3748;
}

.btn-desc {
  font-size: 12px;
  color: #718096;
  text-align: center;
}

.action-message {
  background: #fefcbf;
  border: 1px solid #f6e05e;
  border-radius: 6px;
  padding: 12px;
  color: #975a16;
  text-align: center;
  font-size: 14px;
}
</style>
