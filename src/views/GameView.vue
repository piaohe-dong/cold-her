<template>
  <div class="game-view">
    <!-- 顶部游戏信息栏 -->
    <div class="game-info-bar">
      <div class="info-item">
        <span class="label">当前回合：</span>
        <span class="value">{{ currentPlayerName }}</span>
      </div>
      <div class="info-item">
        <span class="label">目标值：</span>
        <span class="value">{{ targetValue }}</span>
      </div>
      <div class="info-item">
        <span class="label">调和MP：</span>
        <span class="value">{{ harmonyTotalMP }}</span>
        <span class="status" :class="{ success: isHarmonySuccess, fail: !isHarmonySuccess }">
          {{ isHarmonySuccess ? '成功' : '失败' }}
        </span>
      </div>
      <div class="info-item">
        <el-button type="info" size="small" @click="endGame">结束游戏</el-button>
      </div>
    </div>

    <!-- 技能效果展示 -->
    <div v-if="recentSkillEffect" class="skill-effect-banner" :class="effectBannerClass">
      <div class="effect-icon">✨</div>
      <div class="effect-message">{{ recentSkillEffect }}</div>
      <div class="effect-close" @click="clearSkillEffect">×</div>
    </div>

    <!-- 上部分：游戏区域 -->
    <div class="upper-section">
      <!-- 左：调和区域 -->
      <div class="harmony-area card-area">
        <div class="area-header">
          <h3>调和区域</h3>
          <div class="stats">
            <span>目标值: {{ targetValue }}</span>
            <span>当前: {{ harmonyTotalMP }}</span>
            <span>卡牌: {{ harmonyArea.length }}</span>
          </div>
        </div>
        <div class="cards-container">
          <div 
            v-for="(card, index) in harmonyArea" 
            :key="`harmony-${index}`"
            class="harmony-card card-placeholder"
          >
            <div class="card-back"></div>
            <div class="card-order">{{ index + 1 }}</div>
          </div>
          <div v-if="harmonyArea.length === 0" class="empty-area">
            暂无卡牌
          </div>
        </div>
      </div>

      <!-- 中：AI玩家区域 -->
      <div class="ai-players-area">
        <div class="area-header">
          <h3>AI玩家</h3>
        </div>
        <div class="ai-players-list">
          <div 
            v-for="player in aiPlayers" 
            :key="player.id"
            class="ai-player-card"
            :class="{ 'current-turn': player.id === currentPlayerId, 'exited': player.isExited }"
          >
            <div class="player-header">
              <span class="player-name">{{ player.name }}</span>
              <span class="player-status">{{ player.isExited ? '已退出' : '进行中' }}</span>
            </div>
            <div class="player-stats">
              <div class="stat">
                <span class="label">手牌</span>
                <span class="value">{{ player.handCards.length }}</span>
              </div>
              <div class="stat">
                <span class="label">打出</span>
                <span class="value">{{ player.playedCards.length }}</span>
              </div>
              <div class="stat">
                <span class="label">质疑</span>
                <span class="value">{{ getDoubtCount(player.id) }}</span>
              </div>
            </div>
            <div class="player-actions">
              <el-button 
                size="small" 
                @click="viewPlayerDetails(player)"
                :disabled="player.isExited"
              >
                查看详情
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右：获胜条件/卡牌功能区域 -->
      <div class="info-area">
        <div class="area-header">
          <h3>{{ showCardAbilities ? '卡牌功能' : '获胜条件' }}</h3>
          <el-button 
            size="small" 
            @click="showCardAbilities = !showCardAbilities"
            class="toggle-button"
          >
            {{ showCardAbilities ? '查看获胜条件' : '查看卡牌功能' }}
          </el-button>
        </div>
        <div class="info-content">
          <div v-if="!showCardAbilities" class="victory-conditions">
            <div 
              v-for="card in cardsByPriority" 
              :key="card.id"
              class="victory-condition-item"
            >
              <div class="condition-header">
                <span class="card-name">{{ card.name }}</span>
                <span class="card-mp">MP: {{ card.mp }}</span>
                <span class="card-priority">优先级: {{ card.priority }}</span>
              </div>
              <div class="condition-details">
                <span class="condition">{{ card.victoryCondition }}</span>
                <span class="count">数量: {{ getCardCount(card.id) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="card-abilities">
            <div 
              v-for="card in cardsByPriority" 
              :key="card.id"
              class="ability-item"
            >
              <div class="ability-header">
                <span class="card-name">{{ card.name }}</span>
                <span class="card-mp">MP: {{ card.mp }}</span>
              </div>
              <div class="ability-details">
                {{ card.ability }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 下部分：玩家手牌区域 -->
    <div class="lower-section">
      <div class="player-hand-area">
        <div class="area-header">
          <h3>你的手牌</h3>
          <div class="hand-stats">
            <span>手牌数: {{ humanPlayer?.handCards.length || 0 }}</span>
            <span>状态: {{ humanPlayer?.isExited ? '已退出' : '进行中' }}</span>
          </div>
        </div>
        <div class="hand-cards">
          <div 
            v-for="card in humanPlayer?.handCards || []" 
            :key="card.id"
            class="hand-card"
            @click="selectCard(card)"
            :class="{ 'selected': selectedCard?.id === card.id }"
          >
            <div class="hand-card-content">
              <div class="card-name">{{ card.name }}</div>
              <div class="card-mp">MP: {{ card.mp }}</div>
              <div class="card-ability">{{ card.ability }}</div>
            </div>
            
            <!-- 卡牌操作按钮（选中时显示） -->
            <div v-if="selectedCard?.id === card.id" class="card-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click.stop="useCardAsSkill(card)"
                :disabled="!canUseCard(card)"
              >
                使用特技
              </el-button>
              <el-button 
                type="success" 
                size="small" 
                @click.stop="useCardAsHarmony(card)"
              >
                调和
              </el-button>
              <el-button 
                type="warning" 
                size="small" 
                @click.stop="showDoubtDialog(card)"
              >
                质疑
              </el-button>
            </div>
          </div>
          <div v-if="humanPlayer?.handCards.length === 0" class="empty-hand">
            手牌已空
          </div>
        </div>
      </div>
    </div>

    <!-- 质疑对话框 -->
    <el-dialog
      v-model="showDoubtDialogFlag"
      title="选择质疑目标"
      width="400px"
    >
      <div class="doubt-targets">
        <div 
          v-for="player in doubtTargets" 
          :key="player.id"
          class="doubt-target"
          @click="selectDoubtTarget(player)"
          :class="{ 'selected': selectedDoubtTarget?.id === player.id }"
        >
          <span class="player-name">{{ player.name }}</span>
          <span class="player-status">{{ player.isExited ? '已退出' : '进行中' }}</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDoubtDialogFlag = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="useCardAsDoubt"
            :disabled="!selectedDoubtTarget"
          >
            确认质疑
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- AI玩家详情对话框 -->
    <el-dialog
      v-model="showPlayerDialog"
      :title="selectedPlayer?.name + '的详情'"
      width="500px"
    >
      <div v-if="selectedPlayer" class="player-details">
        <div class="detail-section">
          <h4>手牌 ({{ selectedPlayer.handCards.length }})</h4>
          <div class="cards-list">
            <div 
              v-for="card in selectedPlayer.handCards" 
              :key="card.id"
              class="detail-card"
            >
              <span class="card-name">{{ card.name }}</span>
              <span class="card-mp">MP: {{ card.mp }}</span>
            </div>
            <div v-if="selectedPlayer.handCards.length === 0" class="empty">
              无手牌
            </div>
          </div>
        </div>
        <div class="detail-section">
          <h4>已打出卡牌 ({{ selectedPlayer.playedCards.length }})</h4>
          <div class="cards-list">
            <div 
              v-for="card in selectedPlayer.playedCards" 
              :key="card.id"
              class="detail-card"
            >
              <span class="card-name">{{ card.name }}</span>
              <span class="card-ability">{{ card.ability }}</span>
            </div>
            <div v-if="selectedPlayer.playedCards.length === 0" class="empty">
              无打出卡牌
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 技能选择对话框 -->
    <el-dialog
      v-model="showSkillDialog"
      :title="skillDialogTitle"
      width="500px"
      :before-close="handleSkillDialogClose"
    >
      <div v-if="pendingSkillAction">
        <!-- 感染者/共犯效果：夺走调和区域牌 -->
        <div v-if="pendingSkillAction.type === 'accomplice' && pendingSkillAction.data?.isInfected">
          <div class="skill-instruction">
            <p>你拥有感染者效果，可以夺走 1 张调和位置的牌。</p>
            <p>调和区域共有 {{ harmonyArea.length }} 张牌。</p>
          </div>
          <div class="skill-action">
            <el-button type="primary" @click="executeInfectedSkill">夺走最后一张调和牌</el-button>
            <el-button @click="cancelSkillAction">取消</el-button>
          </div>
        </div>

        <!-- 共犯：移动质疑位置的牌 -->
        <div v-else-if="pendingSkillAction.type === 'accomplice'">
          <div class="skill-instruction">
            <p>选择一张质疑位置的牌移动到其他玩家：</p>
          </div>
          <div class="doubt-cards-list">
            <div 
              v-for="(doubtItem, index) in pendingSkillAction.data?.doubtCards || []" 
              :key="index"
              class="doubt-card-item"
              @click="selectDoubtCard(index)"
              :class="{ 'selected': selectedDoubtCardIndex === index }"
            >
              <span class="card-name">{{ doubtItem.card.name }}</span>
              <span class="target-player">当前目标：{{ getPlayerName(doubtItem.playerId) }}</span>
            </div>
            <div v-if="!pendingSkillAction.data?.doubtCards?.length" class="empty-message">
              没有质疑位置的牌
            </div>
          </div>
          <div v-if="selectedDoubtCardIndex !== null" class="target-selection">
            <p>选择新目标玩家：</p>
            <div class="player-options">
              <div 
                v-for="player in availablePlayersForAccomplice" 
                :key="player.id"
                class="player-option"
                @click="selectTargetPlayer(player.id)"
                :class="{ 'selected': selectedTargetPlayerId === player.id }"
              >
                <span class="player-name">{{ player.name }}</span>
                <span class="player-status">{{ player.isExited ? '已退出' : '进行中' }}</span>
              </div>
            </div>
          </div>
          <div class="skill-action">
            <el-button 
              type="primary" 
              @click="executeAccompliceSkill"
              :disabled="selectedDoubtCardIndex === null || selectedTargetPlayerId === null"
            >
              移动质疑牌
            </el-button>
            <el-button @click="cancelSkillAction">取消</el-button>
          </div>
        </div>

        <!-- 班长：选择玩家互换手牌 -->
        <div v-else-if="pendingSkillAction.type === 'monitor'">
          <div class="skill-instruction">
            <p>选择一名玩家互换 1 张手牌：</p>
          </div>
          <div class="player-options">
            <div 
              v-for="player in pendingSkillAction.data?.availablePlayers || []" 
              :key="player.id"
              class="player-option"
              @click="selectTargetPlayer(player.id)"
              :class="{ 'selected': selectedTargetPlayerId === player.id }"
            >
              <span class="player-name">{{ player.name }}</span>
              <span class="hand-count">手牌数：{{ player.handCount }}</span>
            </div>
            <div v-if="!pendingSkillAction.data?.availablePlayers?.length" class="empty-message">
              没有其他玩家可以互换手牌
            </div>
          </div>
          <div class="skill-action">
            <el-button 
              type="primary" 
              @click="executeMonitorSkill"
              :disabled="selectedTargetPlayerId === null"
            >
              互换手牌
            </el-button>
            <el-button @click="cancelSkillAction">取消</el-button>
          </div>
        </div>

        <!-- 风纪委员：选择玩家查看手牌 -->
        <div v-else-if="pendingSkillAction.type === 'discipline'">
          <div class="skill-instruction">
            <p>选择一名玩家查看其全部手牌：</p>
          </div>
          <div class="player-options">
            <div 
              v-for="player in pendingSkillAction.data?.availablePlayers || []" 
              :key="player.id"
              class="player-option"
              @click="selectTargetPlayer(player.id)"
              :class="{ 'selected': selectedTargetPlayerId === player.id }"
            >
              <span class="player-name">{{ player.name }}</span>
              <span class="hand-count">手牌数：{{ player.handCount }}</span>
            </div>
            <div v-if="!pendingSkillAction.data?.availablePlayers?.length" class="empty-message">
              没有其他玩家可以查看手牌
            </div>
          </div>
          <div class="skill-action">
            <el-button 
              type="primary" 
              @click="executeDisciplineSkill"
              :disabled="selectedTargetPlayerId === null"
            >
              查看手牌
            </el-button>
            <el-button @click="cancelSkillAction">取消</el-button>
          </div>
        </div>

        <!-- 保健委员：选择已使用的牌 -->
        <div v-else-if="pendingSkillAction.type === 'health'">
          <div class="skill-instruction">
            <p>选择一张已使用的牌夺走：</p>
          </div>
          <div class="played-cards-list">
            <div 
              v-for="(cardItem, index) in pendingSkillAction.data?.availableCards || []" 
              :key="index"
              class="played-card-item"
              @click="selectHealthCard(index)"
              :class="{ 'selected': selectedHealthCardIndex === index }"
            >
              <span class="card-name">{{ cardItem.cardName }}</span>
              <span class="original-player">来自：{{ cardItem.playerName }}</span>
            </div>
            <div v-if="!pendingSkillAction.data?.availableCards?.length" class="empty-message">
              没有已使用的牌
            </div>
          </div>
          <div class="skill-action">
            <el-button 
              type="primary" 
              @click="executeHealthSkill"
              :disabled="selectedHealthCardIndex === null"
            >
              夺走选中的牌
            </el-button>
            <el-button @click="cancelSkillAction">取消</el-button>
          </div>
        </div>

        <!-- 大小姐：选择玩家交换手牌 -->
        <div v-else-if="pendingSkillAction.type === 'ojousama'">
          <div class="skill-instruction">
            <p>选择一名玩家夺走其 1 张手牌并返还 1 张：</p>
          </div>
          <div class="player-options">
            <div 
              v-for="player in pendingSkillAction.data?.availablePlayers || []" 
              :key="player.id"
              class="player-option"
              @click="selectTargetPlayer(player.id)"
              :class="{ 'selected': selectedTargetPlayerId === player.id }"
            >
              <span class="player-name">{{ player.name }}</span>
              <span class="hand-count">手牌数：{{ player.handCount }}</span>
            </div>
            <div v-if="!pendingSkillAction.data?.availablePlayers?.length" class="empty-message">
              没有其他玩家可以交换手牌
            </div>
          </div>
          <div class="skill-action">
            <el-button 
              type="primary" 
              @click="executeOjousamaSkill"
              :disabled="selectedTargetPlayerId === null"
            >
              交换手牌
            </el-button>
            <el-button @click="cancelSkillAction">取消</el-button>
          </div>
        </div>

        <!-- 归宅部：选择手牌和调和区域牌交换 -->
        <div v-else-if="pendingSkillAction.type === 'goHome'">
          <div class="skill-instruction">
            <p>选择 1 张手牌与 1 张调和位置的牌交换：</p>
          </div>
          <div class="card-selection-grid">
            <div class="hand-cards-section">
              <h4>你的手牌</h4>
              <div class="card-options">
                <div 
                  v-for="(card, index) in pendingSkillAction.data?.handCards || []" 
                  :key="index"
                  class="card-option"
                  @click="selectGoHomeHandCard(index)"
                  :class="{ 'selected': selectedGoHomeHandCardIndex === index }"
                >
                  <span class="card-name">{{ card.name }}</span>
                </div>
              </div>
            </div>
            <div class="harmony-cards-section">
              <h4>调和区域牌</h4>
              <div class="card-options">
                <div 
                  v-for="(card, index) in pendingSkillAction.data?.harmonyCards || []" 
                  :key="index"
                  class="card-option"
                  @click="selectGoHomeHarmonyCard(index)"
                  :class="{ 'selected': selectedGoHomeHarmonyCardIndex === index }"
                >
                  <span class="card-name">{{ card.name }}</span>
                  <span class="card-mp">MP: {{ card.mp }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="skill-action">
            <el-button 
              type="primary" 
              @click="executeGoHomeSkill"
              :disabled="selectedGoHomeHandCardIndex === null || selectedGoHomeHarmonyCardIndex === null"
            >
              交换卡牌
            </el-button>
            <el-button @click="cancelSkillAction">取消</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { ElButton, ElDialog } from 'element-plus'
import type { Card, Player } from '@/stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()

// 显示卡牌功能还是获胜条件
const showCardAbilities = ref(false)

// 选中的卡牌
const selectedCard = ref<Card | null>(null)

// 质疑对话框相关
const showDoubtDialogFlag = ref(false)
const selectedDoubtTarget = ref<Player | null>(null)

// AI玩家详情对话框相关
const showPlayerDialog = ref(false)
const selectedPlayer = ref<Player | null>(null)

// 技能选择对话框相关
const showSkillDialog = ref(false)
const pendingSkillAction = computed(() => gameStore.pendingSkillAction)
const skillDialogTitle = computed(() => {
  if (!pendingSkillAction.value) return '技能选择'
  const skillNames: Record<string, string> = {
    'accomplice': '共犯能力',
    'monitor': '班长能力',
    'discipline': '风纪委员能力',
    'health': '保健委员能力',
    'ojousama': '大小姐能力',
    'goHome': '归宅部能力'
  }
  return skillNames[pendingSkillAction.value.type] || '技能选择'
})

// 选择状态
const selectedDoubtCardIndex = ref<number | null>(null)
const selectedTargetPlayerId = ref<string | null>(null)
const selectedHealthCardIndex = ref<number | null>(null)
const selectedGoHomeHandCardIndex = ref<number | null>(null)
const selectedGoHomeHarmonyCardIndex = ref<number | null>(null)

// 技能效果展示
const recentSkillEffect = ref<string>('')
const effectBannerClass = computed(() => {
  if (recentSkillEffect.value.includes('成功') || recentSkillEffect.value.includes('夺走') || recentSkillEffect.value.includes('查看')) {
    return 'success'
  } else if (recentSkillEffect.value.includes('无效') || recentSkillEffect.value.includes('错误')) {
    return 'error'
  } else {
    return 'info'
  }
})

// 显示技能效果
const showSkillEffect = (message: string) => {
  recentSkillEffect.value = message
  // 5秒后自动清除
  setTimeout(() => {
    if (recentSkillEffect.value === message) {
      recentSkillEffect.value = ''
    }
  }, 5000)
}

// 清除技能效果
const clearSkillEffect = () => {
  recentSkillEffect.value = ''
}

// 计算属性
const currentPlayerIndex = computed(() => gameStore.currentPlayerIndex)
const currentPlayerId = computed(() => gameStore.players[currentPlayerIndex.value]?.id)
const currentPlayerName = computed(() => gameStore.players[currentPlayerIndex.value]?.name || '')
const targetValue = computed(() => gameStore.targetValue)
const harmonyTotalMP = computed(() => gameStore.harmonyTotalMP)
const isHarmonySuccess = computed(() => gameStore.isHarmonySuccess)
const harmonyArea = computed(() => gameStore.harmonyArea)

// AI玩家列表（排除人类玩家）
const aiPlayers = computed(() => {
  return gameStore.players.filter(p => p.type === 'ai')
})

// 人类玩家
const humanPlayer = computed(() => {
  return gameStore.players.find(p => p.type === 'human')
})

// 按优先级排序的卡牌列表
const cardsByPriority = computed(() => {
  return [...gameStore.cards].sort((a, b) => a.priority - b.priority)
})

// 质疑目标（排除自己）
const doubtTargets = computed(() => {
  return gameStore.players.filter(p => p.id !== humanPlayer.value?.id)
})

// 获取卡牌在当前游戏中的数量
const getCardCount = (cardId: string) => {
  const card = gameStore.cards.find(c => c.id === cardId)
  if (!card) return 0
  return card.countByPlayers[gameStore.settings.playerCount] || 0
}

// 获取玩家被质疑的卡牌数量
const getDoubtCount = (playerId: string) => {
  return gameStore.doubtArea.filter(item => item.playerId === playerId).length
}

// 根据玩家ID获取玩家名称
const getPlayerName = (playerId: string) => {
  const player = gameStore.players.find(p => p.id === playerId)
  return player?.name || '未知玩家'
}

// 共犯能力可用的玩家列表（排除当前质疑目标）
const availablePlayersForAccomplice = computed(() => {
  if (!pendingSkillAction.value || pendingSkillAction.value.type !== 'accomplice' || selectedDoubtCardIndex.value === null) {
    return []
  }
  
  const doubtCards = pendingSkillAction.value.data?.doubtCards || []
  if (selectedDoubtCardIndex.value >= doubtCards.length) {
    return []
  }
  
  const currentTargetId = doubtCards[selectedDoubtCardIndex.value]?.playerId
  return gameStore.players.filter(p => 
    p.id !== currentTargetId && !p.isExited
  )
})

// 选择卡牌
const selectCard = (card: Card) => {
  if (selectedCard.value?.id === card.id) {
    selectedCard.value = null
  } else {
    selectedCard.value = card
  }
}

// 判断卡牌是否可以使用（某些卡牌有使用限制）
const canUseCard = (card: Card) => {
  // 犯人牌不能使用
  if (card.id === 'prisoner') return false
  // 其他卡牌默认可以使用
  return true
}

// 使用卡牌作为特技
const useCardAsSkill = (card: Card) => {
  if (!canUseCard(card)) return
  
  // 获取当前玩家索引（应该是人类玩家）
  const playerIndex = gameStore.currentPlayerIndex
  const success = gameStore.useCardAsSkill(card, playerIndex)
  
  if (success) {
    // 移动到下一个玩家（AI）
    setTimeout(() => {
      gameStore.nextPlayer()
    }, 500)
  }
  
  selectedCard.value = null
}

// 使用卡牌进行调和
const useCardAsHarmony = (card: Card) => {
  // 获取当前玩家索引（应该是人类玩家）
  const playerIndex = gameStore.currentPlayerIndex
  const success = gameStore.useCardAsHarmony(card, playerIndex)
  
  if (success) {
    // 移动到下一个玩家（AI）
    setTimeout(() => {
      gameStore.nextPlayer()
    }, 500)
  }
  
  selectedCard.value = null
}

// 显示质疑对话框
const showDoubtDialog = (card: Card) => {
  selectedCard.value = card
  selectedDoubtTarget.value = null
  showDoubtDialogFlag.value = true
}

// 选择质疑目标
const selectDoubtTarget = (player: Player) => {
  selectedDoubtTarget.value = player
}

// 使用卡牌进行质疑
const useCardAsDoubt = () => {
  if (!selectedCard.value || !selectedDoubtTarget.value) return
  
  // 获取当前玩家索引（应该是人类玩家）
  const playerIndex = gameStore.currentPlayerIndex
  const success = gameStore.useCardAsDoubt(selectedCard.value, playerIndex, selectedDoubtTarget.value.id)
  
  if (success) {
    showDoubtDialogFlag.value = false
    selectedCard.value = null
    selectedDoubtTarget.value = null
    
    // 移动到下一个玩家（AI）
    setTimeout(() => {
      gameStore.nextPlayer()
    }, 500)
  }
}

// 查看玩家详情
const viewPlayerDetails = (player: Player) => {
  selectedPlayer.value = player
  showPlayerDialog.value = true
}

// 结束游戏
const endGame = () => {
  // TODO: 实现结束游戏逻辑
  router.push('/result')
}

// 技能对话框方法
// 监听pendingSkillAction变化，自动显示对话框
watch(pendingSkillAction, (newVal) => {
  if (newVal) {
    // 添加技能对话框显示动画
    setTimeout(() => {
      showSkillDialog.value = true
      resetSkillSelections()
    }, 100)
  } else {
    // 添加技能对话框关闭动画
    setTimeout(() => {
      showSkillDialog.value = false
    }, 300)
  }
}, { immediate: true })

// 技能执行状态
const isSkillExecuting = ref(false)

// 执行技能前的动画
const startSkillAnimation = () => {
  isSkillExecuting.value = true
  // 可以在这里添加全局的技能执行动画效果
}

// 执行技能后的动画
const endSkillAnimation = () => {
  setTimeout(() => {
    isSkillExecuting.value = false
  }, 500)
}

// 重置所有选择状态
const resetSkillSelections = () => {
  selectedDoubtCardIndex.value = null
  selectedTargetPlayerId.value = null
  selectedHealthCardIndex.value = null
  selectedGoHomeHandCardIndex.value = null
  selectedGoHomeHarmonyCardIndex.value = null
}

// 技能对话框关闭处理
const handleSkillDialogClose = () => {
  // 不清除pendingSkillAction，允许玩家稍后继续选择
  showSkillDialog.value = false
}

// 选择操作
const selectDoubtCard = (index: string | number) => {
  selectedDoubtCardIndex.value = typeof index === 'string' ? parseInt(index) : index
  selectedTargetPlayerId.value = null // 重置目标玩家选择
}

const selectTargetPlayer = (playerId: string) => {
  selectedTargetPlayerId.value = playerId
}

const selectHealthCard = (index: string | number) => {
  selectedHealthCardIndex.value = typeof index === 'string' ? parseInt(index) : index
}

const selectGoHomeHandCard = (index: string | number) => {
  selectedGoHomeHandCardIndex.value = typeof index === 'string' ? parseInt(index) : index
}

const selectGoHomeHarmonyCard = (index: string | number) => {
  selectedGoHomeHarmonyCardIndex.value = typeof index === 'string' ? parseInt(index) : index
}

// 取消技能操作
const cancelSkillAction = () => {
  gameStore.pendingSkillAction = null
  showSkillDialog.value = false
  resetSkillSelections()
}

// 执行感染者技能（夺走调和区域牌）
const executeInfectedSkill = () => {
  try {
    const playerIndex = gameStore.currentPlayerIndex
    if (playerIndex === -1) {
      showSkillEffect('错误：无法获取当前玩家索引')
      return
    }
    
    // 开始技能动画
    startSkillAnimation()
    
    // 执行技能
    const success = gameStore.executeInfectedEffect(playerIndex)
    
    // 结束技能动画
    endSkillAnimation()
    
    if (success) {
      gameStore.pendingSkillAction = null
      showSkillDialog.value = false
      resetSkillSelections()
      showSkillEffect('感染者效果生效：夺走了一张调和区域的牌')
    } else {
      showSkillEffect('错误：感染者技能执行失败')
    }
  } catch (error) {
    console.error('执行感染者技能失败:', error)
    endSkillAnimation()
    showSkillEffect('错误：技能执行失败，请重试')
  }
}

// 执行共犯技能（移动质疑牌）
const executeAccompliceSkill = () => {
  try {
    if (selectedDoubtCardIndex.value === null || selectedTargetPlayerId.value === null) {
      showSkillEffect('错误：请选择质疑牌和目标玩家')
      return
    }
    
    // 获取选中的质疑牌数据
    const doubtCards = pendingSkillAction.value?.data?.doubtCards || []
    if (selectedDoubtCardIndex.value >= doubtCards.length) {
      showSkillEffect('错误：选中的质疑牌不存在')
      return
    }
    
    const selectedDoubtCard = doubtCards[selectedDoubtCardIndex.value]
    if (!selectedDoubtCard) {
      showSkillEffect('错误：选中的质疑牌数据无效')
      return
    }
    
    // 在doubtArea中找到对应的索引
    const doubtArea = gameStore.doubtArea
    const actualDoubtIndex = doubtArea.findIndex(item => 
      item.card.id === selectedDoubtCard.card.id && item.playerId === selectedDoubtCard.playerId
    )
    
    if (actualDoubtIndex === -1) {
      // 如果找不到，使用随机选择
      showSkillEffect('警告：找不到选中的质疑牌，使用随机选择')
    }
    
    const playerIndex = gameStore.currentPlayerIndex
    if (playerIndex === -1) {
      showSkillEffect('错误：无法获取当前玩家索引')
      return
    }
    
    // 开始技能动画
    startSkillAnimation()
    
    // 调用store方法，传递选择的参数
    const success = gameStore.executeAccompliceEffect(
      playerIndex, 
      actualDoubtIndex !== -1 ? actualDoubtIndex : undefined, 
      selectedTargetPlayerId.value
    )
    
    // 结束技能动画
    endSkillAnimation()
    
    if (success) {
      gameStore.pendingSkillAction = null
      showSkillDialog.value = false
      resetSkillSelections()
      showSkillEffect('共犯能力生效：移动了一张质疑牌')
    } else {
      showSkillEffect('错误：共犯技能执行失败')
    }
  } catch (error) {
    console.error('执行共犯技能失败:', error)
    endSkillAnimation()
    showSkillEffect('错误：技能执行失败，请重试')
  }
}

// 执行班长技能（互换手牌）
const executeMonitorSkill = () => {
  try {
    if (selectedTargetPlayerId.value === null) {
      showSkillEffect('错误：请选择目标玩家')
      return
    }
    
    const playerIndex = gameStore.currentPlayerIndex
    if (playerIndex === -1) {
      showSkillEffect('错误：无法获取当前玩家索引')
      return
    }
    
    // 开始技能动画
    startSkillAnimation()
    
    const success = gameStore.executeMonitorEffect(playerIndex, selectedTargetPlayerId.value)
    
    // 结束技能动画
    endSkillAnimation()
    
    if (success) {
      gameStore.pendingSkillAction = null
      showSkillDialog.value = false
      resetSkillSelections()
      showSkillEffect('班长能力生效：与玩家互换了手牌')
    } else {
      showSkillEffect('错误：班长技能执行失败')
    }
  } catch (error) {
    console.error('执行班长技能失败:', error)
    endSkillAnimation()
    showSkillEffect('错误：技能执行失败，请重试')
  }
}

// 执行风纪委员技能（查看手牌）
const executeDisciplineSkill = () => {
  try {
    if (selectedTargetPlayerId.value === null) {
      showSkillEffect('错误：请选择目标玩家')
      return
    }
    
    const playerIndex = gameStore.currentPlayerIndex
    if (playerIndex === -1) {
      showSkillEffect('错误：无法获取当前玩家索引')
      return
    }
    
    // 开始技能动画
    startSkillAnimation()
    
    const success = gameStore.executeDisciplineEffect(playerIndex, selectedTargetPlayerId.value)
    
    // 结束技能动画
    endSkillAnimation()
    
    if (success) {
      gameStore.pendingSkillAction = null
      showSkillDialog.value = false
      resetSkillSelections()
      showSkillEffect('风纪委员能力生效：查看了玩家的手牌')
    } else {
      showSkillEffect('错误：风纪委员技能执行失败')
    }
  } catch (error) {
    console.error('执行风纪委员技能失败:', error)
    endSkillAnimation()
    showSkillEffect('错误：技能执行失败，请重试')
  }
}

// 执行保健委员技能（夺走已使用的牌）
const executeHealthSkill = () => {
  try {
    if (selectedHealthCardIndex.value === null) {
      showSkillEffect('错误：请选择要夺走的牌')
      return
    }
    
    const playerIndex = gameStore.currentPlayerIndex
    if (playerIndex === -1) {
      showSkillEffect('错误：无法获取当前玩家索引')
      return
    }
    
    // 开始技能动画
    startSkillAnimation()
    
    const success = gameStore.executeHealthEffect(playerIndex, selectedHealthCardIndex.value)
    
    // 结束技能动画
    endSkillAnimation()
    
    if (success) {
      gameStore.pendingSkillAction = null
      showSkillDialog.value = false
      resetSkillSelections()
      showSkillEffect('保健委员能力生效：夺走了一张已使用的牌')
    } else {
      showSkillEffect('错误：保健委员技能执行失败')
    }
  } catch (error) {
    console.error('执行保健委员技能失败:', error)
    endSkillAnimation()
    showSkillEffect('错误：技能执行失败，请重试')
  }
}

// 执行大小姐技能（交换手牌）
const executeOjousamaSkill = () => {
  try {
    if (selectedTargetPlayerId.value === null) {
      showSkillEffect('错误：请选择目标玩家')
      return
    }
    
    const playerIndex = gameStore.currentPlayerIndex
    if (playerIndex === -1) {
      showSkillEffect('错误：无法获取当前玩家索引')
      return
    }
    
    // 开始技能动画
    startSkillAnimation()
    
    const success = gameStore.executeOjousamaEffect(playerIndex, selectedTargetPlayerId.value)
    
    // 结束技能动画
    endSkillAnimation()
    
    if (success) {
      gameStore.pendingSkillAction = null
      showSkillDialog.value = false
      resetSkillSelections()
      showSkillEffect('大小姐能力生效：夺走并返还了一张手牌')
    } else {
      showSkillEffect('错误：大小姐技能执行失败')
    }
  } catch (error) {
    console.error('执行大小姐技能失败:', error)
    endSkillAnimation()
    showSkillEffect('错误：技能执行失败，请重试')
  }
}

// 执行归宅部技能（交换手牌和调和区域牌）
const executeGoHomeSkill = () => {
  try {
    if (selectedGoHomeHandCardIndex.value === null || selectedGoHomeHarmonyCardIndex.value === null) {
      showSkillEffect('错误：请选择手牌和调和区域牌')
      return
    }
    
    const playerIndex = gameStore.currentPlayerIndex
    if (playerIndex === -1) {
      showSkillEffect('错误：无法获取当前玩家索引')
      return
    }
    
    // 开始技能动画
    startSkillAnimation()
    
    const success = gameStore.executeGoHomeEffect(
      playerIndex, 
      selectedGoHomeHandCardIndex.value, 
      selectedGoHomeHarmonyCardIndex.value
    )
    
    // 结束技能动画
    endSkillAnimation()
    
    if (success) {
      gameStore.pendingSkillAction = null
      showSkillDialog.value = false
      resetSkillSelections()
      showSkillEffect('归宅部能力生效：用手牌交换了一张调和区域的牌')
    } else {
      showSkillEffect('错误：归宅部技能执行失败')
    }
  } catch (error) {
    console.error('执行归宅部技能失败:', error)
    endSkillAnimation()
    showSkillEffect('错误：技能执行失败，请重试')
  }
}

// 组件挂载时检查游戏状态
onMounted(() => {
  // 如果没有玩家数据，跳回菜单
  if (gameStore.players.length === 0) {
    router.push('/menu')
  }
})
</script>

<style scoped>
.game-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #0c2461 0%, #1e3799 50%, #4a69bd 100%);
  color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  animation: fadeIn 0.8s ease-out;
}

/* PC 端布局优化 */
@media (min-width: 1025px) {
  .game-view {
    max-width: 1920px;
    margin: 0 auto;
    width: 95vw;
    min-width: 1200px;
  }
  
  .upper-section {
    min-height: 400px;
  }
  
  .harmony-area {
    flex: 1;
  }
  
  .ai-players-area {
    flex: 2.5;
  }
  
  .info-area {
    flex: 1.8;
  }
  
  .hand-cards {
    justify-content: center;
  }
  
  .hand-card {
    width: 200px;
  }
  
  .ai-players-list {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  .info-content {
    height: 400px;
  }
  
  .game-info-bar {
    padding: 20px 30px;
  }
  
  .area-header {
    padding-bottom: 20px;
  }
  
  .area-header h3 {
    font-size: 1.6em;
  }
}

:deep(.el-button) {
  font-family: inherit;
}

/* 游戏信息栏 */
.game-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 18px 24px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-item .label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.info-item .value {
  font-weight: bold;
  color: #ffffff;
  font-size: 1.1em;
}

.info-item .status {
  margin-left: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  backdrop-filter: blur(8px);
}

.info-item .status.success {
  background: rgba(46, 204, 113, 0.3);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.4);
}

.info-item .status.fail {
  background: rgba(231, 76, 60, 0.3);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.4);
}

/* 上部分布局 */
.upper-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex: 1;
  min-height: 320px;
}

.harmony-area, .ai-players-area, .info-area {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.harmony-area:hover, .ai-players-area:hover, .info-area:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.harmony-area {
  flex: 1;
  border-top: 4px solid #3498db;
}

.ai-players-area {
  flex: 2;
  border-top: 4px solid #9b59b6;
}

.info-area {
  flex: 1.5;
  border-top: 4px solid #2ecc71;
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.area-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 1.4em;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.toggle-button {
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* 调和区域 */
.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 140px;
}

.harmony-card {
  position: relative;
  width: 70px;
  height: 105px;
  background: linear-gradient(145deg, #3498db, #2980b9);
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
}

.harmony-card:hover {
  transform: translateY(-8px) rotate(2deg);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.6);
}

.harmony-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent);
  border-radius: 12px 12px 0 0;
}

.card-back {
  width: 90%;
  height: 90%;
  background: linear-gradient(145deg, #2c3e50, #34495e);
  border-radius: 8px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}

.card-order {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: bold;
  color: #2c3e50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.empty-area {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 140px;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  font-size: 1.1em;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

/* AI玩家区域 */
.ai-players-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.ai-player-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 22px;
  border: 2px solid rgba(155, 89, 182, 0.4);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
}

.ai-player-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), transparent);
  border-radius: 16px 16px 0 0;
}

.ai-player-card:hover {
  transform: translateY(-8px) scale(1.03);
  border-color: rgba(155, 89, 182, 0.8);
  box-shadow: 0 15px 35px rgba(155, 89, 182, 0.5);
}

.ai-player-card.current-turn {
  border-color: #f1c40f;
  background: linear-gradient(145deg, rgba(241, 196, 15, 0.2), rgba(241, 196, 15, 0.1));
  box-shadow: 0 0 0 4px rgba(241, 196, 15, 0.4), 0 12px 35px rgba(241, 196, 15, 0.5);
  animation: pulse-turn 2s infinite, card-glow 3s ease-in-out infinite;
}

.ai-player-card.exited {
  opacity: 0.6;
  border-color: rgba(149, 165, 166, 0.4);
  background: linear-gradient(145deg, rgba(149, 165, 166, 0.1), rgba(149, 165, 166, 0.05));
  transform: scale(0.98);
}

@keyframes pulse-turn {
  0%, 100% { box-shadow: 0 0 0 4px rgba(241, 196, 15, 0.4), 0 12px 35px rgba(241, 196, 15, 0.5); }
  50% { box-shadow: 0 0 0 8px rgba(241, 196, 15, 0.6), 0 16px 45px rgba(241, 196, 15, 0.7); }
}

@keyframes card-glow {
  0%, 100% { border-color: #f1c40f; }
  50% { border-color: #f39c12; }
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  position: relative;
  z-index: 1;
}

.player-name {
  font-weight: 700;
  color: #ffffff;
  font-size: 1.3em;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.player-status {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  letter-spacing: 0.5px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.player-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
  position: relative;
  z-index: 1;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  min-width: 70px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.stat:hover {
  background: rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
}

.stat .label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat .value {
  font-weight: 800;
  color: #ffffff;
  font-size: 1.4em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.player-actions {
  position: relative;
  z-index: 1;
}

.player-actions :deep(.el-button) {
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  width: 100%;
  border-radius: 12px;
  padding: 8px 16px;
  font-size: 14px;
}

.player-actions :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.player-actions :deep(.el-button:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

.player-actions :deep(.el-button:disabled:hover) {
  transform: none;
  box-shadow: none;
}

/* 信息区域 */
.info-content {
  height: 320px;
  overflow-y: auto;
  padding-right: 8px;
}

.info-content::-webkit-scrollbar {
  width: 6px;
}

.info-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.info-content::-webkit-scrollbar-thumb {
  background: rgba(46, 204, 113, 0.6);
  border-radius: 10px;
}

.info-content::-webkit-scrollbar-thumb:hover {
  background: rgba(46, 204, 113, 0.8);
}

.victory-condition-item, .ability-item {
  padding: 16px;
  margin-bottom: 14px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  border-left: 5px solid #2ecc71;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.victory-condition-item:hover, .ability-item:hover {
  transform: translateX(4px);
  box-shadow: 0 8px 25px rgba(46, 204, 113, 0.3);
}

.condition-header, .ability-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-name {
  font-weight: 700;
  color: #ffffff;
  font-size: 1.1em;
  letter-spacing: 0.3px;
}

.card-mp, .card-priority {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.condition-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.condition {
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  line-height: 1.5;
  flex: 1;
}

.count {
  font-size: 12px;
  color: #2ecc71;
  font-weight: 800;
  background: rgba(46, 204, 113, 0.2);
  padding: 4px 10px;
  border-radius: 20px;
  margin-left: 12px;
}

.ability-details {
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  line-height: 1.5;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 下部分：玩家手牌区域 */
.lower-section {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-top: 6px solid #e74c3c;
}

.hand-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  min-height: 200px;
}

.hand-card {
  width: 180px;
  background: linear-gradient(145deg, rgba(52, 152, 219, 0.9), rgba(41, 128, 185, 0.9));
  backdrop-filter: blur(8px);
  border-radius: 16px;
  padding: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.5);
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.hand-card:hover {
  border-color: rgba(255, 255, 255, 0.8);
  transform: translateY(-10px) scale(1.05) rotateX(5deg);
  box-shadow: 0 20px 40px rgba(52, 152, 219, 0.7);
  z-index: 10;
}

.hand-card.selected {
  border-color: #f1c40f;
  background: linear-gradient(145deg, rgba(241, 196, 15, 0.9), rgba(243, 156, 18, 0.9));
  box-shadow: 0 0 0 4px rgba(241, 196, 15, 0.5), 0 20px 40px rgba(241, 196, 15, 0.6);
  animation: card-pulse 1.5s infinite, card-float 3s ease-in-out infinite;
  transform: translateY(-15px) scale(1.08) rotateX(8deg);
}

@keyframes card-float {
  0%, 100% { transform: translateY(-15px) scale(1.08) rotateX(8deg); }
  50% { transform: translateY(-25px) scale(1.08) rotateX(12deg); }
}

.hand-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.25), transparent);
  border-radius: 16px 16px 0 0;
}

.hand-card:hover {
  border-color: rgba(255, 255, 255, 0.8);
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 20px 40px rgba(52, 152, 219, 0.7);
  z-index: 10;
}

.hand-card.selected {
  border-color: #f1c40f;
  background: linear-gradient(145deg, rgba(241, 196, 15, 0.9), rgba(243, 156, 18, 0.9));
  box-shadow: 0 0 0 4px rgba(241, 196, 15, 0.5), 0 20px 40px rgba(241, 196, 15, 0.6);
  animation: card-pulse 1.5s infinite;
}

@keyframes card-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(241, 196, 15, 0.5), 0 20px 40px rgba(241, 196, 15, 0.6); }
  50% { box-shadow: 0 0 0 8px rgba(241, 196, 15, 0.8), 0 25px 50px rgba(241, 196, 15, 0.8); }
}

.hand-card-content {
  margin-bottom: 18px;
  position: relative;
  z-index: 1;
}

.hand-card .card-name {
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 12px;
  font-size: 18px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
}

.hand-card .card-mp {
  color: #f1c40f;
  font-weight: 900;
  margin-bottom: 12px;
  font-size: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hand-card .card-ability {
  color: rgba(255, 255, 255, 0.95);
  font-size: 13px;
  line-height: 1.5;
  font-weight: 500;
}

.hand-card .card-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.hand-card .card-actions :deep(.el-button) {
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  border-radius: 12px;
  padding: 8px 16px;
  font-size: 14px;
}

.hand-card .card-actions :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.empty-hand {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 200px;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  font-size: 1.2em;
  border: 3px dashed rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
}

/* 质疑对话框 */
.doubt-targets {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doubt-target {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.doubt-target:hover {
  background-color: #ecf5ff;
}

.doubt-target.selected {
  background-color: #ecf5ff;
  border: 2px solid #409eff;
}

/* 玩家详情对话框 */
.player-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 10px;
}

.detail-section {
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.detail-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.detail-section h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 1.2em;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-section h4::before {
  content: '📋';
  font-size: 1.1em;
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #ffffff;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.detail-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
}

.detail-card .card-name {
  font-weight: 700;
  color: #2c3e50;
  font-size: 14px;
  flex: 1;
}

.detail-card .card-mp, .detail-card .card-ability {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.empty {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
  font-size: 14px;
}

/* 质疑对话框样式优化 */
.doubt-targets {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
}

.doubt-targets::-webkit-scrollbar {
  width: 6px;
}

.doubt-targets::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.doubt-targets::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.doubt-targets::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.doubt-target {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.doubt-target:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.doubt-target.selected {
  background-color: #ecf5ff;
  border: 2px solid #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.doubt-target .player-name {
  font-weight: 700;
  color: #2c3e50;
  font-size: 14px;
}

.doubt-target .player-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 16px;
  background: #e9ecef;
  color: #6c757d;
  font-weight: 600;
}

/* 技能对话框样式 */
.skill-instruction {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9eb 0%, #e6f7ee 100%);
  border-radius: 12px;
  border-left: 4px solid #67c23a;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.15);
  animation: slideIn 0.3s ease-out;
}

.skill-instruction p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.doubt-cards-list, .played-cards-list, .player-options, .card-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
}

.doubt-cards-list::-webkit-scrollbar, .played-cards-list::-webkit-scrollbar, .player-options::-webkit-scrollbar, .card-options::-webkit-scrollbar {
  width: 6px;
}

.doubt-cards-list::-webkit-scrollbar-track, .played-cards-list::-webkit-scrollbar-track, .player-options::-webkit-scrollbar-track, .card-options::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.doubt-cards-list::-webkit-scrollbar-thumb, .played-cards-list::-webkit-scrollbar-thumb, .player-options::-webkit-scrollbar-thumb, .card-options::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.doubt-cards-list::-webkit-scrollbar-thumb:hover, .played-cards-list::-webkit-scrollbar-thumb:hover, .player-options::-webkit-scrollbar-thumb:hover, .card-options::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.doubt-card-item, .played-card-item, .player-option, .card-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 10px;
  border: 2px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.doubt-card-item::before, .played-card-item::before, .player-option::before, .card-option::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.2), transparent);
  transition: left 0.5s;
}

.doubt-card-item:hover::before, .played-card-item:hover::before, .player-option:hover::before, .card-option:hover::before {
  left: 100%;
}

.doubt-card-item:hover, .played-card-item:hover, .player-option:hover, .card-option:hover {
  background: linear-gradient(145deg, #ecf5ff, #e3f0ff);
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.doubt-card-item.selected, .played-card-item.selected, .player-option.selected, .card-option.selected {
  background: linear-gradient(145deg, #ecf5ff, #d6eaff);
  border-color: #409eff;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.3);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(64, 158, 255, 0.15); }
}

.target-selection {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e8eb 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out 0.1s both;
}

.target-selection p {
  margin-bottom: 12px;
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.card-selection-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  animation: slideIn 0.3s ease-out 0.2s both;
}

.hand-cards-section, .harmony-cards-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hand-cards-section h4, .harmony-cards-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

.empty-message {
  text-align: center;
  color: #c0c4cc;
  font-style: italic;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 2px dashed #e4e7ed;
  animation: fadeIn 0.5s ease-out;
}

.skill-action {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
  animation: slideIn 0.3s ease-out 0.3s both;
}

.skill-action :deep(.el-button) {
  padding: 10px 20px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 12px;
  font-size: 14px;
}

.skill-action :deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 技能效果横幅 */
.skill-effect-banner {
  display: flex;
  align-items: center;
  padding: 18px 24px;
  margin-bottom: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), pulse-glow 2s ease-in-out infinite;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.skill-effect-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s;
}

.skill-effect-banner:hover::before {
  left: 100%;
}

.skill-effect-banner.success {
  background: linear-gradient(135deg, rgba(240, 249, 235, 0.9), rgba(230, 247, 238, 0.9));
  border-left: 6px solid #67c23a;
  color: #67c23a;
  box-shadow: 0 4px 20px rgba(103, 194, 58, 0.25);
}

.skill-effect-banner.error {
  background: linear-gradient(135deg, rgba(254, 240, 240, 0.9), rgba(252, 227, 227, 0.9));
  border-left: 6px solid #f56c6c;
  color: #f56c6c;
  box-shadow: 0 4px 20px rgba(245, 108, 108, 0.25);
}

.skill-effect-banner.info {
  background: linear-gradient(135deg, rgba(236, 245, 255, 0.9), rgba(227, 243, 255, 0.9));
  border-left: 6px solid #409eff;
  color: #409eff;
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.25);
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); }
  50% { box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25); }
}

.effect-icon {
  font-size: 28px;
  margin-right: 16px;
  animation: bounce 1s ease-in-out infinite;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.effect-message {
  flex: 1;
  font-weight: 600;
  font-size: 16px;
  line-height: 1.5;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.effect-close {
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  padding: 0 10px;
  opacity: 0.7;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12px;
}

.effect-close:hover {
  opacity: 1;
  transform: rotate(90deg) scale(1.1);
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 平板设备适配 */
@media (max-width: 1024px) {
  .upper-section {
    flex-direction: column;
  }
  
  .ai-players-list {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
  
  .hand-card {
    width: 160px;
  }
  
  .game-view {
    width: 95vw;
    min-width: 0;
  }
}

/* 小平板和大屏手机适配 */
@media (max-width: 768px) {
  .game-view {
    padding: 10px;
    width: 98vw;
  }
  
  .game-info-bar {
    flex-wrap: wrap;
    gap: 10px;
    padding: 15px;
  }
  
  .ai-players-list {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
  
  .hand-card {
    width: 130px;
  }
  
  .harmony-card {
    width: 50px;
    height: 75px;
  }
  
  .area-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .area-header h3 {
    font-size: 1.2em;
  }
  
  .toggle-button {
    width: 100%;
  }
}

/* 手机设备适配 */
@media (max-width: 480px) {
  .game-view {
    padding: 8px;
    width: 100vw;
  }
  
  .game-info-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 15px;
  }
  
  .info-item {
    width: 100%;
    justify-content: space-between;
  }
  
  .ai-players-list {
    grid-template-columns: 1fr;
  }
  
  .hand-card {
    width: 100%;
    padding: 15px;
  }
  
  .hand-card .card-name {
    font-size: 16px;
  }
  
  .hand-card .card-mp {
    font-size: 18px;
  }
  
  .harmony-card {
    width: 45px;
    height: 68px;
  }
  
  .card-order {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
  
  .info-content {
    height: 250px;
  }
  
  .lower-section {
    padding: 20px;
  }
  
  .hand-cards {
    gap: 15px;
  }
}
</style>