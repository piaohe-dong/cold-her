<template>
  <div 
    class="card" 
    :class="{ 
      'card-face-up': faceUp, 
      'card-face-down': !faceUp,
      'card-clickable': clickable,
      'card-selected': selected
    }"
    @click="handleClick"
  >
    <!-- 卡牌正面 -->
    <div v-if="faceUp" class="card-front">
      <div class="card-strength">{{ card.strength }}</div>
      <div class="card-name">{{ card.name }}</div>
      <div class="card-skill">{{ card.skill }}</div>
      <div class="card-faction" :class="`faction-${card.faction}`">
        {{ getFactionText(card.faction) }}
      </div>
    </div>
    
    <!-- 卡牌背面 -->
    <div v-else class="card-back">
      <div class="card-back-design">?</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card, Faction } from '../types/game';

const props = defineProps<{
  card: Card;
  faceUp?: boolean;
  clickable?: boolean;
  selected?: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();

function getFactionText(faction: Faction): string {
  const factionMap: Record<Faction, string> = {
    student: '学生',
    criminal: '犯人',
    accomplice: '共犯',
    alien: '宇宙人',
    infected: '感染者',
    go_home: '归宅部'
  };
  return factionMap[faction] || '未知';
}

function handleClick() {
  if (props.clickable) {
    emit('click');
  }
}
</script>

<style scoped>
.card {
  width: 120px;
  height: 170px;
  border-radius: 8px;
  position: relative;
  transition: all 0.3s ease;
  cursor: default;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-face-up {
  background: white;
  border: 2px solid #e0e0e0;
}

.card-face-down {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid #5a67d8;
}

.card-clickable {
  cursor: pointer;
}

.card-clickable:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.card-selected {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
  transform: translateY(-8px);
}

.card-front {
  padding: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-strength {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  background: #4a5568;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.card-name {
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  margin-top: 30px;
  margin-bottom: 8px;
  color: #2d3748;
}

.card-skill {
  flex: 1;
  font-size: 11px;
  color: #4a5568;
  padding: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.card-faction {
  font-size: 10px;
  text-align: center;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
  font-weight: bold;
}

.faction-student {
  background: #bee3f8;
  color: #2c5282;
}

.faction-criminal {
  background: #fed7d7;
  color: #c53030;
}

.faction-accomplice {
  background: #feebc8;
  color: #c05621;
}

.faction-alien {
  background: #e9d8fd;
  color: #6b46c1;
}

.faction-infected {
  background: #c6f6d5;
  color: #276749;
}

.faction-go_home {
  background: #fefcbf;
  color: #975a16;
}

.card-back {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-back-design {
  font-size: 48px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: bold;
}
</style>
