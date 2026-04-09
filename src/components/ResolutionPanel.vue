<template>
  <div class="resolution-panel">
    <div class="panel-title">游戏结算</div>
    
    <div v-if="results" class="results-content">
      <!-- 调和判定 -->
      <div class="result-section">
        <h3>调和判定</h3>
        <div class="result-item">
          <span class="label">调和总强度:</span>
          <span class="value">{{ results.harmonyTotal }} / {{ harmonyTarget }}</span>
        </div>
        <div class="result-status" :class="results.harmonySuccess ? 'success' : 'failure'">
          {{ results.harmonySuccess ? '✓ 调和成功' : '✗ 调和失败' }}
        </div>
      </div>
      
      <!-- 监禁判定 -->
      <div class="result-section">
        <h3>监禁判定</h3>
        <div v-if="results.imprisonedPlayers.length > 0" class="imprisoned-list">
          <div v-for="playerId in results.imprisonedPlayers" :key="playerId" class="imprisoned-item">
            🔒 {{ getPlayerName(playerId) }}
          </div>
        </div>
        <div v-else class="no-imprisoned">
          无人被监禁
        </div>
      </div>
      
      <!-- 身份揭示 -->
      <div class="result-section">
        <h3>身份揭示</h3>
        <div class="identity-list">
          <div v-for="player in players" :key="player.id" class="identity-item">
            <div class="player-name">{{ player.name }}</div>
            <div class="player-identity" v-if="player.identityCard">
              {{ player.identityCard.name }}
              <span class="faction-badge" :class="`faction-${player.identityCard.faction}`">
                {{ getFactionName(player.identityCard.faction) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 最终结果 -->
      <div class="result-section final-result">
        <h3>最终结果</h3>
        <div v-if="results.winners.length > 0" class="winners">
          <div class="winner-text">
            🎉 {{ getFactionName(results.winnerFaction) }} 获胜!
          </div>
          <div class="winner-list">
            <div v-for="playerId in results.winners" :key="playerId" class="winner-item">
              👑 {{ getPlayerName(playerId) }}
            </div>
          </div>
        </div>
        <div v-else class="draw">
          平局!无人获胜
        </div>
      </div>
    </div>
    
    <div class="action-buttons">
      <button class="btn-secondary" @click="$emit('close')">
        关闭
      </button>
      <button class="btn-primary" @click="$emit('backToMenu')">
        返回主菜单
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameResults, Player, Faction } from '../types/game';

const props = defineProps<{
  results: GameResults;
  players: Player[];
  harmonyTarget: number;
}>();

const emit = defineEmits<{
  backToMenu: [];
  close: [];
}>();

function getPlayerName(playerId: string): string {
  const player = props.players.find(p => p.id === playerId);
  return player?.name || '未知玩家';
}

function getFactionName(faction: Faction | null): string {
  const factionMap: Record<string, string> = {
    student: '学生阵营',
    criminal: '犯人阵营',
    accomplice: '共犯',
    alien: '宇宙人',
    infected: '感染者',
    go_home: '归宅部'
  };
  return faction ? factionMap[faction] || '未知' : '无';
}
</script>

<style scoped>
.resolution-panel {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 32px;
  max-width: 800px;
  margin: 0 auto;
}

.panel-title {
  font-size: 32px;
  font-weight: bold;
  color: #2d3748;
  text-align: center;
  margin-bottom: 32px;
}

.results-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.result-section {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}

.result-section h3 {
  font-size: 20px;
  color: #2d3748;
  margin-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.label {
  font-size: 16px;
  color: #4a5568;
}

.value {
  font-size: 20px;
  font-weight: bold;
  color: #2d3748;
}

.result-status {
  text-align: center;
  padding: 12px;
  border-radius: 6px;
  font-size: 18px;
  font-weight: bold;
}

.result-status.success {
  background: #c6f6d5;
  color: #276749;
}

.result-status.failure {
  background: #fed7d7;
  color: #c53030;
}

.imprisoned-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.imprisoned-item {
  background: #fed7d7;
  color: #c53030;
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: bold;
}

.no-imprisoned {
  text-align: center;
  color: #718096;
  padding: 12px;
}

.identity-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.identity-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
}

.player-name {
  font-size: 14px;
  color: #718096;
  margin-bottom: 4px;
}

.player-identity {
  font-size: 16px;
  font-weight: bold;
  color: #2d3748;
}

.faction-badge {
  display: inline-block;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
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

.final-result {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.final-result h3 {
  color: white;
  border-bottom-color: rgba(255, 255, 255, 0.3);
}

.winners {
  text-align: center;
}

.winner-text {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
}

.winner-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.winner-item {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 18px;
  font-weight: bold;
}

.draw {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  padding: 20px;
}

.action-buttons {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

.btn-primary {
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #3182ce;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
}

.btn-secondary {
  background: #a0aec0;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 12px;
}

.btn-secondary:hover {
  background: #718096;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(113, 128, 150, 0.4);
}
</style>
