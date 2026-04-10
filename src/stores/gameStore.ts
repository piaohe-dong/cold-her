import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'

// 卡牌类型
export interface Card {
  id: string // 唯一标识，如'alien', 'infected'
  name: string // 卡牌名称，如'外星人'
  mp: number // MP值
  victoryCondition: string // 胜利条件
  priority: number // 优先顺序，1-5
  totalCount: number // 总张数
  countByPlayers: { [players: number]: number } // 不同玩家人数时的张数
  ability: string // 能力概述
  description?: string // 详细描述（可选）
  uniqueId?: string // 唯一实例ID，用于区分同名卡牌
}

// 玩家类型
export interface Player {
  id: string // 玩家ID
  name: string // 玩家名称，如'玩家1'、'AI1'
  type: 'human' | 'ai' // 玩家类型
  handCards: Card[] // 手牌
  playedCards: Card[] // 已打出的牌（正面朝上使用特技的牌）
  isExited: boolean // 是否暂时退出游戏（手牌只剩1张）
  isVisible: boolean // 手牌是否对玩家可见（仅在使用查看手牌技能后）
}

// 卡牌位置类型
export type CardLocation = 'hand' | 'harmony' | 'doubt' | 'played'

// 游戏状态
export type GamePhase = 'menu' | 'playing' | 'result'

// 游戏设置
export interface GameSettings {
  playerCount: 3 | 4 | 5 | 6 // 玩家人数
  enableChaosMode: boolean // 是否启用混沌模式（变体规则）
}

// 出牌记录
export interface PlayRecord {
  playerId: string
  playerName: string
  action: 'skill' | 'harmony' | 'doubt'
  card: Card
  targetPlayerId?: string // 质疑目标或技能目标
  timestamp: number
}

export const useGameStore = defineStore('game', () => {
  // 游戏状态
  const gamePhase = ref<GamePhase>('menu')
  const currentPlayerIndex = ref(0) // 当前回合玩家索引
  const roundCount = ref(0) // 当前回合数
  const settings = reactive<GameSettings>({
    playerCount: 4,
    enableChaosMode: false
  })

  // 卡牌数据
  const cards = ref<Card[]>([
    // 数据来自规则文档
    { id: 'alien', name: '外星人', mp: -1, victoryCondition: '被监禁', priority: 1, totalCount: 1, countByPlayers: { 3: 1, 4: 1, 5: 1, 6: 1 }, ability: '持有期间，可装作犯人' },
    { id: 'infected', name: '感染者', mp: 0, victoryCondition: '调和失败', priority: 2, totalCount: 1, countByPlayers: { 3: 1, 4: 1, 5: 1, 6: 1 }, ability: '下回合可夺走 1 张调和位置的牌' },
    { id: 'prisoner', name: '犯人', mp: 0, victoryCondition: '不被监禁', priority: 3, totalCount: 1, countByPlayers: { 3: 1, 4: 1, 5: 1, 6: 1 }, ability: '不能使用' },
    { id: 'accomplice', name: '共犯', mp: 0, victoryCondition: '犯人胜利', priority: 3, totalCount: 1, countByPlayers: { 3: 0, 4: 1, 5: 1, 6: 1 }, ability: '移动 1 张质疑位置的牌' },
    { id: 'president', name: '学生会长', mp: 3, victoryCondition: '调和成功', priority: 4, totalCount: 1, countByPlayers: { 3: 1, 4: 1, 5: 1, 6: 1 }, ability: '作为起始玩家' },
    { id: 'monitor', name: '班长', mp: 2, victoryCondition: '调和成功', priority: 4, totalCount: 2, countByPlayers: { 3: 2, 4: 2, 5: 2, 6: 2 }, ability: '和 1 名玩家互换 1 张手牌' },
    { id: 'excellent', name: '优等生', mp: 2, victoryCondition: '调和成功', priority: 4, totalCount: 2, countByPlayers: { 3: 1, 4: 2, 5: 2, 6: 2 }, ability: '可以知道犯人在哪' },
    { id: 'discipline', name: '风纪委员', mp: 1, victoryCondition: '调和成功', priority: 4, totalCount: 2, countByPlayers: { 3: 1, 4: 2, 5: 2, 6: 2 }, ability: '可以查看某人的全部手牌' },
    { id: 'health', name: '保健委员', mp: 1, victoryCondition: '调和成功', priority: 4, totalCount: 2, countByPlayers: { 3: 2, 4: 2, 5: 2, 6: 2 }, ability: '可以夺走 1 张已使用的牌' },
    { id: 'library', name: '图书委员', mp: 1, victoryCondition: '调和成功', priority: 4, totalCount: 3, countByPlayers: { 3: 3, 4: 2, 5: 3, 6: 2 }, ability: '可以查看调和位置的牌' },
    { id: 'ojousama', name: '大小姐', mp: 1, victoryCondition: '调和成功', priority: 4, totalCount: 3, countByPlayers: { 3: 2, 4: 3, 5: 3, 6: 3 }, ability: '夺走他人 1 张手牌并返还 1 张' },
    { id: 'news', name: '新闻部', mp: 1, victoryCondition: '调和成功', priority: 4, totalCount: 3, countByPlayers: { 3: 2, 4: 3, 5: 3, 6: 3 }, ability: '所有人将 1 张手牌传给左边玩家' },
    { id: 'goHome', name: '归宅部', mp: 0, victoryCondition: '无任何人胜利', priority: 5, totalCount: 3, countByPlayers: { 3: 2, 4: 3, 5: 3, 6: 3 }, ability: '1 张手牌交换 1 张调和位置的牌' }
  ])

  // 玩家列表
  const players = ref<Player[]>([])

  // 游戏区域
  const harmonyArea = ref<Card[]>([]) // 调和区域
  const doubtArea = ref<{ playerId: string, card: Card }[]>([]) // 质疑区域，记录卡牌和被质疑的玩家

  // 卡牌池（用于发牌）
  const cardPool = ref<Card[]>([])

  // 游戏日志
  const gameLog = ref<string[]>([])

  // 出牌记录
  const playRecords = ref<PlayRecord[]>([])
  
  // 游戏结果
  const gameWinners = ref<Player[]>([]) // 获胜者列表

  // 技能效果状态
  const infectedEffect = ref<{ playerId: string, cardId: string } | null>(null) // 感染者效果：下回合可夺走1张调和位置的牌
  const pendingSkillAction = ref<{
    type: 'monitor' | 'discipline' | 'health' | 'ojousama' | 'goHome' | 'accomplice'
    playerId: string
    card: Card
    data?: any // 额外数据
  } | null>(null) // 需要玩家选择的技能动作

  // 目标值计算
  const targetValue = computed(() => {
    switch (settings.playerCount) {
      case 3: return 9
      case 4: return 8
      case 5: return 7
      case 6: return 6
      default: return 8
    }
  })

  // 当前调和MP合计值
  const harmonyTotalMP = computed(() => {
    return harmonyArea.value.reduce((sum, card) => sum + card.mp, 0)
  })

  // 是否调和成功
  const isHarmonySuccess = computed(() => {
    return harmonyTotalMP.value >= targetValue.value
  })

  // 当前玩家
  const currentPlayer = computed(() => {
    return players.value[currentPlayerIndex.value]
  })

  // 游戏是否结束（所有玩家暂时退出）
  const isGameEnded = computed(() => {
    return players.value.every(player => player.isExited)
  })

  // 获取卡牌图片路径（预留）
  const getCardImage = (cardId: string) => {
    return `/cards/${cardId}.png`
  }

  // 创建卡牌池（根据玩家人数调整卡牌数量）
  const createCardPool = () => {
    const pool: Card[] = []
    const playerCount = settings.playerCount
    
    // 遍历所有卡牌类型，根据数量添加
    cards.value.forEach(card => {
      const count = card.countByPlayers[playerCount] || 0
      for (let i = 0; i < count; i++) {
        // 创建卡牌副本，添加唯一ID
        const cardCopy = { ...card, uniqueId: `${card.id}-${i}` }
        pool.push(cardCopy)
      }
    })
    
    // 洗牌算法
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = pool[i]!
      pool[i] = pool[j]!
      pool[j] = temp
    }
    
    cardPool.value = pool
    addLog(`创建卡牌池，共 ${pool.length} 张卡牌`)
  }

  // 发牌
  const dealCards = () => {
    const playerCount = settings.playerCount
    let cardsPerPlayer: number
    
    switch (playerCount) {
      case 3:
      case 4:
        cardsPerPlayer = 6
        break
      case 5:
        cardsPerPlayer = 5
        break
      case 6:
        cardsPerPlayer = 4
        break
      default:
        cardsPerPlayer = 6
    }
    
    // 给每个玩家发牌
    players.value.forEach(player => {
      player.handCards = []
      for (let i = 0; i < cardsPerPlayer; i++) {
        if (cardPool.value.length > 0) {
          const card = cardPool.value.shift()!
          player.handCards.push(card)
        }
      }
      addLog(`${player.name} 获得 ${cardsPerPlayer} 张手牌`)
    })
    
    // 确定起始玩家（持有学生会长的玩家）
    const presidentPlayerIndex = players.value.findIndex(player =>
      player.handCards.some(card => card.id === 'president')
    )
    
    if (presidentPlayerIndex !== -1) {
      currentPlayerIndex.value = presidentPlayerIndex
      addLog(`${players.value[presidentPlayerIndex]!.name} 持有学生会长，成为起始玩家`)
    } else {
      // 随机选择起始玩家
      currentPlayerIndex.value = Math.floor(Math.random() * players.value.length)
      addLog(`随机选择 ${players.value[currentPlayerIndex.value]!.name} 为起始玩家`)
    }
  }

  // 添加日志
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    gameLog.value.push(`[${timestamp}] ${message}`)
    console.log(`[Game Log] ${message}`)
  }

  // 添加出牌记录
  const addPlayRecord = (record: Omit<PlayRecord, 'timestamp'>) => {
    playRecords.value.push({
      ...record,
      timestamp: Date.now()
    })
  }

  // 初始化游戏
  const initGame = (playerCount: number, enableChaosMode: boolean) => {
    settings.playerCount = playerCount as 3 | 4 | 5 | 6
    settings.enableChaosMode = enableChaosMode
    
    // 创建玩家
    players.value = []
    // 第一个玩家是人类，其余是AI
    players.value.push({
      id: 'player-0',
      name: '玩家',
      type: 'human',
      handCards: [],
      playedCards: [],
      isExited: false,
      isVisible: false
    })
    
    for (let i = 1; i < playerCount; i++) {
      players.value.push({
        id: `ai-${i}`,
        name: `AI${i}`,
        type: 'ai',
        handCards: [],
        playedCards: [],
        isExited: false,
        isVisible: false
      })
    }
    
    // 清空区域
    harmonyArea.value = []
    doubtArea.value = []
    gameLog.value = []
    playRecords.value = []
    gameWinners.value = []
    roundCount.value = 0
    
    // 创建卡牌池并发牌
    createCardPool()
    dealCards()
    
    gamePhase.value = 'playing'
    addLog(`游戏开始，${playerCount}人游戏，目标值: ${targetValue.value}`)
  }

  // 开始游戏（从菜单调用）
  const startGame = (playerCount: number, enableChaosMode: boolean) => {
    initGame(playerCount, enableChaosMode)
  }

  // 结束游戏，进入结算
  const endGame = () => {
    gamePhase.value = 'result'
    addLog('游戏结束，进入结算阶段')
    
    // 计算获胜者
    gameWinners.value = getWinners()
    
    // 记录获胜者信息
    if (gameWinners.value.length > 0) {
      const winnerNames = gameWinners.value.map(p => p.name).join(', ')
      addLog(`获胜者：${winnerNames}`)
    } else {
      addLog('全灭结局：无获胜者')
    }
  }

  // 返回菜单
  const backToMenu = () => {
    gamePhase.value = 'menu'
  }

  // 使用卡牌作为特技
  const useCardAsSkill = (card: Card, playerIndex: number) => {
    const player = players.value[playerIndex]
    if (!player) {
      addLog(`错误：玩家索引 ${playerIndex} 不存在`)
      return false
    }
    if (!player.handCards.some(c => c.id === card.id)) {
      addLog(`错误：玩家 ${player.name} 没有卡牌 ${card.name}`)
      return false
    }
    
    // 犯人牌不能使用
    if (card.id === 'prisoner') {
      addLog(`犯人牌不能使用`)
      return false
    }
    
    // 从手牌移除
    player.handCards = player.handCards.filter(c => c.id !== card.id)
    // 添加到已打出区域
    player.playedCards.push(card)
    
    addPlayRecord({
      playerId: player.id,
      playerName: player.name,
      action: 'skill',
      card,
      targetPlayerId: undefined
    })
    
    addLog(`${player.name} 使用特技: ${card.name}`)
    
    // 根据卡牌能力执行效果
    executeCardAbility(card, player)
    
    // 检查是否暂时退出（手牌只剩1张）
    checkPlayerExit(player)
    
    return true
  }

  // 执行卡牌特殊能力
  const executeCardAbility = (card: Card, player: Player) => {
    switch (card.id) {
      case 'alien': // 外星人：持有期间，可装作犯人
        // 外星人能力是被动效果，在胜利判定时起作用
        addLog(`${player.name} 使用外星人能力：可以装作犯人`)
        break
        
      case 'infected': // 感染者：下回合可夺走 1 张调和位置的牌
        // 感染者特殊规则：手牌不足2张时使用该牌无效
        if (player.handCards.length < 2) {
          addLog(`${player.name} 手牌不足2张，感染者能力无效`)
          // 将卡牌返还给玩家（因为useCardAsSkill已经移除了卡牌）
          player.handCards.push(card)
          player.playedCards = player.playedCards.filter(c => c.id !== card.id)
          return
        }
        
        // 设置感染者效果标记
        infectedEffect.value = { playerId: player.id, cardId: card.id }
        addLog(`${player.name} 使用感染者能力：下回合可夺走 1 张调和位置的牌`)
        break
        
      case 'accomplice': // 共犯：移动 1 张质疑位置的牌
        // 共犯能力需要选择一张质疑位置的牌移动
        if (doubtArea.value.length === 0) {
          addLog('没有质疑位置的牌，共犯能力无效')
          return
        }
        
        addLog(`${player.name} 使用共犯能力：可以移动 1 张质疑位置的牌`)
        
        // 对于AI玩家，自动移动一张质疑牌到随机玩家
        if (player.type === 'ai') {
          setTimeout(() => {
            executeAccompliceEffect(players.value.findIndex(p => p.id === player.id))
          }, 500)
        } else {
          // 对于人类玩家，设置pending状态等待选择
          pendingSkillAction.value = {
            type: 'accomplice',
            playerId: player.id,
            card,
            data: { doubtCards: [...doubtArea.value] }
          }
        }
        break
        
      case 'monitor': // 班长：和 1 名玩家互换 1 张手牌
        // 班长能力需要选择目标玩家
        // 检查是否有其他玩家可以互换手牌
        const otherPlayersForMonitor = players.value.filter(p => 
          p.id !== player.id && !p.isExited && p.handCards.length > 0
        )
        
        if (otherPlayersForMonitor.length === 0) {
          addLog('没有其他玩家可以互换手牌，班长能力无效')
          return
        }
        
        addLog(`${player.name} 使用班长能力：可以和 1 名玩家互换 1 张手牌`)
        
        // 对于AI玩家，自动选择目标和手牌
        if (player.type === 'ai') {
          setTimeout(() => {
            executeMonitorEffect(players.value.findIndex(p => p.id === player.id))
          }, 500)
        } else {
          // 对于人类玩家，设置pending状态等待选择
          pendingSkillAction.value = {
            type: 'monitor',
            playerId: player.id,
            card,
            data: { 
              availablePlayers: otherPlayersForMonitor.map(p => ({
                id: p.id,
                name: p.name,
                handCount: p.handCards.length
              }))
            }
          }
        }
        break
        
      case 'excellent': // 优等生：可以知道犯人在哪
        // 优等生能力：揭示犯人在哪个玩家手中
        const prisonerPlayer = players.value.find(p => 
          p.handCards.some(c => c.id === 'prisoner')
        )
        if (prisonerPlayer) {
          addLog(`${player.name} 使用优等生能力：犯人卡在 ${prisonerPlayer.name} 手中`)
          player.isVisible = true // 标记为已查看犯人位置
        } else {
          addLog(`${player.name} 使用优等生能力：犯人卡不在任何玩家手中（可能在调和区域或被使用）`)
        }
        break
        
      case 'discipline': // 风纪委员：可以查看某人的全部手牌
        // 风纪委员能力需要选择目标玩家
        // 检查是否有其他玩家可以查看手牌
        const otherPlayersForDiscipline = players.value.filter(p => 
          p.id !== player.id && !p.isExited
        )
        
        if (otherPlayersForDiscipline.length === 0) {
          addLog('没有其他玩家可以查看手牌，风纪委员能力无效')
          return
        }
        
        addLog(`${player.name} 使用风纪委员能力：可以查看某人的全部手牌`)
        
        // 对于AI玩家，自动选择一个目标查看手牌
        if (player.type === 'ai') {
          setTimeout(() => {
            executeDisciplineEffect(players.value.findIndex(p => p.id === player.id))
          }, 500)
        } else {
          // 对于人类玩家，设置pending状态等待选择
          pendingSkillAction.value = {
            type: 'discipline',
            playerId: player.id,
            card,
            data: { 
              availablePlayers: otherPlayersForDiscipline.map(p => ({
                id: p.id,
                name: p.name,
                handCount: p.handCards.length
              }))
            }
          }
        }
        break
        
      case 'health': // 保健委员：可以夺走 1 张已使用的牌
        // 保健委员能力需要选择一张已使用的牌
        // 收集所有已使用的牌（所有玩家的playedCards）
        const allPlayedCards: { playerId: string, playerName: string, card: Card }[] = []
        players.value.forEach(p => {
          p.playedCards.forEach(card => {
            allPlayedCards.push({ playerId: p.id, playerName: p.name, card })
          })
        })
        
        if (allPlayedCards.length === 0) {
          addLog('没有已使用的牌，保健委员能力无效')
          return
        }
        
        addLog(`${player.name} 使用保健委员能力：可以夺走 1 张已使用的牌`)
        
        // 对于AI玩家，自动选择一张已使用的牌
        if (player.type === 'ai') {
          setTimeout(() => {
            executeHealthEffect(players.value.findIndex(p => p.id === player.id))
          }, 500)
        } else {
          // 对于人类玩家，设置pending状态等待选择
          pendingSkillAction.value = {
            type: 'health',
            playerId: player.id,
            card,
            data: { 
              availableCards: allPlayedCards.map(item => ({
                playerId: item.playerId,
                playerName: item.playerName,
                cardId: item.card.id,
                cardName: item.card.name
              }))
            }
          }
        }
        break
        
      case 'library': // 图书委员：可以查看调和位置的牌
        // 图书委员能力：查看所有调和位置的牌
        addLog(`${player.name} 使用图书委员能力：查看调和位置的牌`)
        if (harmonyArea.value.length > 0) {
          const harmonyCardsInfo = harmonyArea.value.map(card => `${card.name} (MP: ${card.mp})`).join(', ')
          addLog(`调和区域卡牌：${harmonyCardsInfo}`)
          player.isVisible = true // 标记为已查看调和区域
        } else {
          addLog(`调和区域没有卡牌`)
        }
        break
        
      case 'ojousama': // 大小姐：夺走他人 1 张手牌并返还 1 张
        // 大小姐能力需要选择目标玩家
        // 检查是否有其他玩家可以交换手牌
        const otherPlayersForOjousama = players.value.filter(p => 
          p.id !== player.id && !p.isExited && p.handCards.length > 0
        )
        
        if (otherPlayersForOjousama.length === 0) {
          addLog('没有其他玩家可以交换手牌，大小姐能力无效')
          return
        }
        
        // 检查自己是否有手牌可以返还
        if (player.handCards.length === 0) {
          addLog('自己没有手牌可以返还，大小姐能力无效')
          return
        }
        
        addLog(`${player.name} 使用大小姐能力：夺走他人 1 张手牌并返还 1 张`)
        
        // 对于AI玩家，自动执行
        if (player.type === 'ai') {
          setTimeout(() => {
            executeOjousamaEffect(players.value.findIndex(p => p.id === player.id))
          }, 500)
        } else {
          // 对于人类玩家，设置pending状态等待选择
          pendingSkillAction.value = {
            type: 'ojousama',
            playerId: player.id,
            card,
            data: { 
              availablePlayers: otherPlayersForOjousama.map(p => ({
                id: p.id,
                name: p.name,
                handCount: p.handCards.length
              }))
            }
          }
        }
        break
        
      case 'news': // 新闻部：所有人将 1 张手牌传给左边玩家
        // 新闻部能力：所有玩家传递手牌
        addLog(`${player.name} 使用新闻部能力：所有人将 1 张手牌传给左边玩家`)
        executeNewsAbility(player)
        break
        
      case 'goHome': // 归宅部：1 张手牌交换 1 张调和位置的牌
        // 归宅部特殊规则：需要手牌和调和区域都有牌
        if (player.handCards.length === 0) {
          addLog('没有手牌可以交换，归宅部能力无效')
          return
        }
        
        if (harmonyArea.value.length === 0) {
          addLog('调和区域没有牌，归宅部能力无效')
          return
        }
        
        addLog(`${player.name} 使用归宅部能力：1 张手牌交换 1 张调和位置的牌`)
        
        // 对于AI玩家，自动执行
        if (player.type === 'ai') {
          setTimeout(() => {
            executeGoHomeEffect(players.value.findIndex(p => p.id === player.id))
          }, 500)
        } else {
          // 对于人类玩家，设置pending状态等待选择
          pendingSkillAction.value = {
            type: 'goHome',
            playerId: player.id,
            card,
            data: { 
              handCards: player.handCards.map(c => ({ id: c.id, name: c.name })),
              harmonyCards: harmonyArea.value.map(c => ({ id: c.id, name: c.name, mp: c.mp }))
            }
          }
        }
        break
        
      default:
        addLog(`${card.name} 没有特殊能力或能力已默认处理`)
        break
    }
  }

  // 新闻部能力实现
  const executeNewsAbility = (player: Player) => {
    // 所有玩家将 1 张手牌传给左边玩家
    // 标准模式：暂时退出的玩家不受影响
    // 混沌模式：所有玩家都参与，包括已退出的玩家
    const participants = settings.enableChaosMode 
      ? players.value // 混沌模式：所有玩家
      : players.value.filter(p => !p.isExited) // 标准模式：仅活跃玩家
    
    if (participants.length < 2) {
      addLog('新闻部能力：参与玩家不足2人，效果不生效')
      return
    }
    
    // 收集每名玩家要传递的卡牌（第一张手牌）
    const cardsToPass: { playerId: string, card: Card | null }[] = []
    
    participants.forEach(p => {
      if (p.handCards.length > 0) {
        const card = p.handCards[0]!
        cardsToPass.push({ playerId: p.id, card })
      } else {
        cardsToPass.push({ playerId: p.id, card: null })
      }
    })
    
    // 执行传递：每名玩家将卡牌传给左边玩家
    cardsToPass.forEach((item, index) => {
      if (!item.card) return
      
      const fromPlayer = participants[index]!
      const toPlayerIndex = (index + 1) % participants.length
      const toPlayer = participants[toPlayerIndex]!
      
      // 从来源玩家手牌移除
      fromPlayer.handCards = fromPlayer.handCards.filter(c => c.id !== item.card!.id)
      // 添加到目标玩家手牌
      toPlayer.handCards.push(item.card)
      
      addLog(`${fromPlayer.name} 将 ${item.card.name} 传给 ${toPlayer.name}`)
    })
    
    // 检查是否有玩家因手牌变化而退出
    // 在混沌模式下，即使玩家已退出，手牌变化也可能影响状态
    participants.forEach(p => checkPlayerExit(p))
  }

  // 使用卡牌进行调和
  const useCardAsHarmony = (card: Card, playerIndex: number) => {
    const player = players.value[playerIndex]
    if (!player) {
      addLog(`错误：玩家索引 ${playerIndex} 不存在`)
      return false
    }
    if (!player.handCards.some(c => c.id === card.id)) {
      addLog(`错误：玩家 ${player.name} 没有卡牌 ${card.name}`)
      return false
    }
    
    // 从手牌移除
    player.handCards = player.handCards.filter(c => c.id !== card.id)
    // 添加到调和区域
    harmonyArea.value.push(card)
    
    addPlayRecord({
      playerId: player.id,
      playerName: player.name,
      action: 'harmony',
      card,
      targetPlayerId: undefined
    })
    
    addLog(`${player.name} 进行调和: ${card.name} (MP: ${card.mp})`)
    
    // 检查是否暂时退出（手牌只剩1张）
    checkPlayerExit(player)
    
    return true
  }

  // 使用卡牌进行质疑
  const useCardAsDoubt = (card: Card, playerIndex: number, targetPlayerId: string) => {
    const player = players.value[playerIndex]
    if (!player) {
      addLog(`错误：玩家索引 ${playerIndex} 不存在`)
      return false
    }
    
    const targetPlayer = players.value.find(p => p.id === targetPlayerId)
    
    if (!player.handCards.some(c => c.id === card.id)) {
      addLog(`错误：玩家 ${player.name} 没有卡牌 ${card.name}`)
      return false
    }
    
    if (!targetPlayer) {
      addLog(`错误：目标玩家不存在`)
      return false
    }
    
    if (player.id === targetPlayer.id) {
      addLog(`错误：不能质疑自己`)
      return false
    }
    
    // 从手牌移除
    player.handCards = player.handCards.filter(c => c.id !== card.id)
    // 添加到质疑区域
    doubtArea.value.push({ playerId: targetPlayer.id, card })
    
    addPlayRecord({
      playerId: player.id,
      playerName: player.name,
      action: 'doubt',
      card,
      targetPlayerId: targetPlayer.id
    })
    
    addLog(`${player.name} 质疑 ${targetPlayer.name}: ${card.name} (MP: ${card.mp})`)
    
    // 检查是否暂时退出（手牌只剩1张）
    checkPlayerExit(player)
    
    return true
  }

  // 检查玩家是否暂时退出
  const checkPlayerExit = (player: Player) => {
    if (player.handCards.length <= 1 && !player.isExited) {
      player.isExited = true
      addLog(`${player.name} 手牌只剩 ${player.handCards.length} 张，暂时退出游戏`)
      
      // 检查是否所有玩家都退出了
      if (isGameEnded.value) {
        addLog('所有玩家均已退出，进入判定阶段')
        endGame()
      }
    }
  }

  // 执行感染者效果：夺走1张调和位置的牌
  const executeInfectedEffect = (playerIndex: number) => {
    const player = players.value[playerIndex]
    if (!player || !infectedEffect.value || infectedEffect.value.playerId !== player.id) {
      return
    }
    
    // 从调和区域夺走一张牌（夺走最后一张放入的牌）
    if (harmonyArea.value.length > 0) {
      const stolenCard = harmonyArea.value.pop()!
      player.handCards.push(stolenCard)
      
      addLog(`${player.name} 使用感染者效果夺走调和区域的牌：${stolenCard.name}`)
      addPlayRecord({
        playerId: player.id,
        playerName: player.name,
        action: 'skill',
        card: cards.value.find(c => c.id === 'infected')!,
        targetPlayerId: undefined
      })
    }
    
    // 清除感染者效果
    infectedEffect.value = null
  }

  // 执行共犯效果：移动1张质疑位置的牌
  const executeAccompliceEffect = (playerIndex: number, doubtIndex?: number, targetPlayerId?: string) => {
    const player = players.value[playerIndex]
    if (!player || doubtArea.value.length === 0) {
      return
    }
    
    let selectedDoubtIndex = doubtIndex
    let selectedTargetPlayerId = targetPlayerId
    
    // 如果没有提供参数，随机选择
    if (selectedDoubtIndex === undefined) {
      selectedDoubtIndex = Math.floor(Math.random() * doubtArea.value.length)
    }
    
    if (selectedDoubtIndex < 0 || selectedDoubtIndex >= doubtArea.value.length) {
      addLog('错误：选择的质疑牌索引无效')
      return
    }
    
    const doubtItem = doubtArea.value[selectedDoubtIndex]!
    
    // 找到可以移动到的其他玩家（不包括当前目标）
    const otherPlayers = players.value.filter(p => 
      p.id !== doubtItem.playerId && !p.isExited
    )
    
    if (otherPlayers.length === 0) {
      addLog('没有其他玩家可以移动质疑牌，共犯能力无效')
      return
    }
    
    // 如果没有提供目标玩家，随机选择
    if (selectedTargetPlayerId === undefined) {
      selectedTargetPlayerId = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]!.id
    }
    
    // 验证目标玩家有效
    const targetPlayer = players.value.find(p => p.id === selectedTargetPlayerId)
    if (!targetPlayer || targetPlayer.id === doubtItem.playerId || targetPlayer.isExited) {
      addLog('错误：选择的目标玩家无效')
      return
    }
    
    // 更新质疑牌的目标
    doubtArea.value[selectedDoubtIndex]!.playerId = selectedTargetPlayerId
    
    addLog(`${player.name} 使用共犯能力将 ${doubtItem.card.name} 从 ${players.value.find(p => p.id === doubtItem.playerId)!.name} 移动到 ${targetPlayer.name}`)
    
    // 清除pending状态
    pendingSkillAction.value = null
  }

  // 执行班长效果：和1名玩家互换1张手牌
  const executeMonitorEffect = (playerIndex: number) => {
    const player = players.value[playerIndex]
    if (!player) return
    
    // 找到可以互换手牌的其他玩家
    const otherPlayers = players.value.filter(p => 
      p.id !== player.id && !p.isExited && p.handCards.length > 0
    )
    
    if (otherPlayers.length === 0) {
      addLog('没有其他玩家可以互换手牌，班长能力无效')
      return
    }
    
    // 随机选择一个目标玩家
    const targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]!
    
    // 随机选择一张自己的手牌和目标玩家的手牌
    if (player.handCards.length === 0 || targetPlayer.handCards.length === 0) {
      addLog('手牌不足，班长能力无效')
      return
    }
    
    const playerCardIndex = Math.floor(Math.random() * player.handCards.length)
    const targetCardIndex = Math.floor(Math.random() * targetPlayer.handCards.length)
    
    const playerCard = player.handCards[playerCardIndex]!
    const targetCard = targetPlayer.handCards[targetCardIndex]!
    
    // 交换手牌
    player.handCards.splice(playerCardIndex, 1)
    targetPlayer.handCards.splice(targetCardIndex, 1)
    
    player.handCards.push(targetCard)
    targetPlayer.handCards.push(playerCard)
    
    addLog(`${player.name} 使用班长能力与 ${targetPlayer.name} 互换手牌：${playerCard.name} ↔ ${targetCard.name}`)
    
    // 检查玩家是否因手牌变化而退出
    checkPlayerExit(player)
    checkPlayerExit(targetPlayer)
    
    // 清除pending状态
    pendingSkillAction.value = null
  }

  // 执行风纪委员效果：查看某人的全部手牌
  const executeDisciplineEffect = (playerIndex: number) => {
    const player = players.value[playerIndex]
    if (!player) return
    
    // 找到可以查看手牌的其他玩家
    const otherPlayers = players.value.filter(p => 
      p.id !== player.id && !p.isExited
    )
    
    if (otherPlayers.length === 0) {
      addLog('没有其他玩家可以查看手牌，风纪委员能力无效')
      return
    }
    
    // 随机选择一个目标玩家
    const targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]!
    
    // 记录目标玩家的手牌信息
    const handCardsInfo = targetPlayer.handCards.map(card => card.name).join(', ')
    addLog(`${player.name} 使用风纪委员能力查看 ${targetPlayer.name} 的手牌：${handCardsInfo || '空手牌'}`)
    
    // 标记玩家已查看目标手牌（UI可以显示这些信息）
    player.isVisible = true // 这可能用于UI显示，但需要扩展以存储查看的目标
    
    // 清除pending状态
    pendingSkillAction.value = null
  }

  // 执行保健委员效果：夺走1张已使用的牌
  const executeHealthEffect = (playerIndex: number) => {
    const player = players.value[playerIndex]
    if (!player) return
    
    // 收集所有已使用的牌（所有玩家的playedCards）
    const allPlayedCards: { playerId: string, playerName: string, card: Card, playerIndex: number }[] = []
    players.value.forEach((p, index) => {
      p.playedCards.forEach(card => {
        allPlayedCards.push({ playerId: p.id, playerName: p.name, card, playerIndex: index })
      })
    })
    
    if (allPlayedCards.length === 0) {
      addLog('没有已使用的牌，保健委员能力无效')
      return
    }
    
    // 随机选择一张已使用的牌
    const randomIndex = Math.floor(Math.random() * allPlayedCards.length)
    const selected = allPlayedCards[randomIndex]!
    
    // 从原玩家的playedCards中移除
    const originalPlayer = players.value[selected.playerIndex]
    if (!originalPlayer) {
      addLog('错误：找不到原玩家')
      return
    }
    originalPlayer.playedCards = originalPlayer.playedCards.filter(c => c.id !== selected.card.id)
    
    // 添加到当前玩家的手牌中
    player.handCards.push(selected.card)
    
    addLog(`${player.name} 使用保健委员能力夺走 ${originalPlayer.name} 已使用的牌：${selected.card.name}`)
    
    // 检查玩家是否因手牌变化而退出
    checkPlayerExit(player)
    
    // 清除pending状态
    pendingSkillAction.value = null
  }

  // 执行大小姐效果：夺走他人1张手牌并返还1张
  const executeOjousamaEffect = (playerIndex: number) => {
    const player = players.value[playerIndex]
    if (!player) return
    
    // 找到可以交换手牌的其他玩家
    const otherPlayers = players.value.filter(p => 
      p.id !== player.id && !p.isExited && p.handCards.length > 0
    )
    
    if (otherPlayers.length === 0 || player.handCards.length === 0) {
      addLog('无法执行大小姐能力：手牌不足或无目标玩家')
      return
    }
    
    // 随机选择一个目标玩家
    const targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]!
    
    // 随机选择一张目标玩家的手牌
    const targetCardIndex = Math.floor(Math.random() * targetPlayer.handCards.length)
    const targetCard = targetPlayer.handCards[targetCardIndex]!
    
    // 随机选择一张自己的手牌作为返还
    const playerCardIndex = Math.floor(Math.random() * player.handCards.length)
    const playerCard = player.handCards[playerCardIndex]!
    
    // 执行交换：夺走目标玩家的牌，返还自己的牌
    targetPlayer.handCards.splice(targetCardIndex, 1)
    player.handCards.splice(playerCardIndex, 1)
    
    // 大小姐获得目标玩家的牌
    player.handCards.push(targetCard)
    // 目标玩家获得大小姐返还的牌
    targetPlayer.handCards.push(playerCard)
    
    addLog(`${player.name} 使用大小姐能力：夺走 ${targetPlayer.name} 的 ${targetCard.name}，返还 ${playerCard.name}`)
    
    // 检查玩家是否因手牌变化而退出
    checkPlayerExit(player)
    checkPlayerExit(targetPlayer)
    
    // 清除pending状态
    pendingSkillAction.value = null
  }

  // 执行归宅部效果：1张手牌交换1张调和位置的牌
  const executeGoHomeEffect = (playerIndex: number) => {
    const player = players.value[playerIndex]
    if (!player) return
    
    if (player.handCards.length === 0 || harmonyArea.value.length === 0) {
      addLog('无法执行归宅部能力：手牌或调和区域牌不足')
      return
    }
    
    // 随机选择一张手牌
    const handCardIndex = Math.floor(Math.random() * player.handCards.length)
    const handCard = player.handCards[handCardIndex]!
    
    // 随机选择一张调和区域的牌
    const harmonyCardIndex = Math.floor(Math.random() * harmonyArea.value.length)
    const harmonyCard = harmonyArea.value[harmonyCardIndex]!
    
    // 执行交换
    player.handCards.splice(handCardIndex, 1)
    harmonyArea.value.splice(harmonyCardIndex, 1)
    
    // 玩家获得调和区域的牌
    player.handCards.push(harmonyCard)
    // 调和区域获得玩家的手牌
    harmonyArea.value.push(handCard)
    
    addLog(`${player.name} 使用归宅部能力：用手牌 ${handCard.name} 交换调和区域的牌 ${harmonyCard.name}`)
    
    // 检查玩家是否因手牌变化而退出
    checkPlayerExit(player)
    
    // 清除pending状态
    pendingSkillAction.value = null
  }

  // 移动到下一个玩家
  const nextPlayer = () => {
    // 找到下一个未退出的玩家
    let nextIndex = (currentPlayerIndex.value + 1) % players.value.length
    let attempts = 0
    
    while (players.value[nextIndex]!.isExited && attempts < players.value.length) {
      nextIndex = (nextIndex + 1) % players.value.length
      attempts++
    }
    
    // 如果所有玩家都退出了，结束游戏
    if (players.value[nextIndex]!.isExited) {
      endGame()
      return
    }
    
    currentPlayerIndex.value = nextIndex
    roundCount.value++
    
    const nextPlayer = players.value[nextIndex]!
    addLog(`轮到 ${nextPlayer.name} 的回合`)
    
    // 检查感染者效果
    if (infectedEffect.value && infectedEffect.value.playerId === nextPlayer.id) {
      // 感染者效果：可以夺走1张调和位置的牌
      addLog(`${nextPlayer.name} 有感染者效果，可以夺走1张调和位置的牌`)
      
      if (harmonyArea.value.length > 0) {
        // 对于AI玩家，自动夺走一张牌
        if (nextPlayer.type === 'ai') {
          setTimeout(() => {
            executeInfectedEffect(nextIndex)
          }, 500)
        } else {
          // 对于人类玩家，设置pending状态等待选择
          pendingSkillAction.value = {
            type: 'accomplice', // 使用accomplice类型，但实际上是感染者效果
            playerId: nextPlayer.id,
            card: cards.value.find(c => c.id === 'infected')!,
            data: { isInfected: true }
          }
        }
      } else {
        addLog('调和区域没有卡牌，感染者效果无效')
        infectedEffect.value = null
      }
    }
    
    // 如果是AI玩家，自动执行AI回合
    if (nextPlayer.type === 'ai') {
      // 延迟执行AI行动
      setTimeout(() => {
        executeAITurn(nextIndex)
      }, 1000)
    }
  }

  // 执行AI回合
  const executeAITurn = (playerIndex: number) => {
    const player = players.value[playerIndex]
    if (!player || player.isExited) return
    
    addLog(`AI ${player.name} 正在思考...`)
    
    // 优化AI策略
    if (player.handCards.length === 0) {
      addLog(`${player.name} 没有手牌，跳过回合`)
      nextPlayer()
      return
    }
    
    // 分析游戏状态
    const currentHarmonyMP = harmonyTotalMP.value
    const harmonyNeeded = targetValue.value - currentHarmonyMP
    const hasAlienCard = player.handCards.some(c => c.id === 'alien')
    const hasPrisonerCard = player.handCards.some(c => c.id === 'prisoner')
    const hasValuableSkill = player.handCards.some(c => 
      ['president', 'monitor', 'excellent', 'discipline', 'health', 'library', 'ojousama', 'news'].includes(c.id)
    )
    
    // 策略决策
    let chosenCard: Card | null = null
    let chosenAction: 'skill' | 'harmony' | 'doubt' | null = null
    let targetPlayerId: string | null = null
    
    // 策略1：如果持有外星人牌，尽量让自己被质疑（通过质疑自己或其他方式）
    if (hasAlienCard) {
      const alienCard = player.handCards.find(c => c.id === 'alien')
      if (alienCard) {
        // 外星人希望被监禁，所以可以选择质疑自己（如果允许）或进行调和
        // 由于不能质疑自己，选择调和外星人牌（MP为负，降低调和成功概率）
        chosenCard = alienCard
        chosenAction = 'harmony'
        addLog(`${player.name}（外星人持有者）选择调和外星人牌以增加被监禁机会`)
      }
    }
    // 策略2：如果持有犯人牌，尽量不被质疑（通过调和犯人牌）
    else if (hasPrisonerCard) {
      const prisonerCard = player.handCards.find(c => c.id === 'prisoner')
      if (prisonerCard) {
        chosenCard = prisonerCard
        chosenAction = 'harmony' // 调和犯人牌（MP为0）
        addLog(`${player.name}（犯人持有者）选择调和犯人牌以避免被质疑`)
      }
    }
    // 策略3：根据调和需求决定行动
    else {
      // 评估每张卡牌的最佳行动
      const cardEvaluations: Array<{
        card: Card
        action: 'skill' | 'harmony' | 'doubt'
        score: number
        targetPlayerId?: string
      }> = []
      
      player.handCards.forEach(card => {
        // 评估调和行动
        if (card.id !== 'prisoner') { // 犯人牌不能使用特技
          // 特技评分：根据卡牌能力价值
          let skillScore = 0
          if (['president', 'monitor', 'excellent', 'discipline', 'health', 'library', 'ojousama', 'news'].includes(card.id)) {
            skillScore = 3 // 高价值能力
          } else if (card.id === 'infected' || card.id === 'accomplice') {
            skillScore = 2 // 中等价值能力
          } else {
            skillScore = 1 // 低价值能力
          }
          cardEvaluations.push({ card, action: 'skill', score: skillScore })
        }
        
        // 评估调和行动
        let harmonyScore = 0
        if (harmonyNeeded > 0 && card.mp > 0) {
          // 需要正MP且卡牌提供正MP
          harmonyScore = Math.min(card.mp * 2, 5) // MP越高得分越高
        } else if (harmonyNeeded <= 0 && card.mp < 0) {
          // 调和已足够，可以添加负MP牌
          harmonyScore = 2
        } else if (card.mp === 0) {
          harmonyScore = 1 // 中性牌
        } else {
          harmonyScore = 0 // 不合适
        }
        cardEvaluations.push({ card, action: 'harmony', score: harmonyScore })
        
        // 评估质疑行动
        // 找到可能的目标玩家
        const potentialTargets = players.value.filter(p => 
          p.id !== player.id && !p.isExited
        )
        
        if (potentialTargets.length > 0) {
          // 简单策略：质疑手牌最少的玩家
          const target = potentialTargets.reduce((prev, curr) => 
            prev.handCards.length < curr.handCards.length ? prev : curr
          )
          let doubtScore = 0
          if (card.mp > 0) {
            doubtScore = 2 // 正MP牌质疑有价值
          } else if (card.mp < 0) {
            doubtScore = 1 // 负MP牌质疑价值较低
          } else {
            doubtScore = 1 // 0MP牌
          }
          cardEvaluations.push({ 
            card, 
            action: 'doubt', 
            score: doubtScore,
            targetPlayerId: target.id
          })
        }
      })
      
      // 选择最佳评分行动
      if (cardEvaluations.length > 0) {
        const bestAction = cardEvaluations.reduce((prev, curr) => 
          curr.score > prev.score ? curr : prev
        )
        chosenCard = bestAction.card
        chosenAction = bestAction.action
        targetPlayerId = bestAction.targetPlayerId || null
        
        addLog(`${player.name} AI选择最佳行动：${chosenCard.name} - ${chosenAction} (评分: ${bestAction.score})`)
      }
    }
    
    // 如果没有选择，使用随机策略作为后备
    if (!chosenCard || !chosenAction) {
      addLog(`${player.name} AI使用随机策略`)
      // 随机选择一张卡牌
      const randomCardIndex = Math.floor(Math.random() * player.handCards.length)
      chosenCard = player.handCards[randomCardIndex]!
      
      // 随机选择行动
      const actions: Array<'skill' | 'harmony' | 'doubt'> = ['skill', 'harmony', 'doubt']
      chosenAction = actions[Math.floor(Math.random() * actions.length)]!
      
      // 如果是质疑，选择目标
      if (chosenAction === 'doubt') {
        const otherPlayers = players.value.filter(p => p.id !== player.id && !p.isExited)
        if (otherPlayers.length > 0) {
          targetPlayerId = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]!.id
        } else {
          chosenAction = 'harmony' // 没有目标，改为调和
        }
      }
    }
    
    // 执行选择的行动
    if (!chosenCard || !chosenAction) {
      addLog(`${player.name} AI无法做出决策，跳过回合`)
    } else {
      switch (chosenAction) {
        case 'skill':
          if (chosenCard.id !== 'prisoner') {
            useCardAsSkill(chosenCard, playerIndex)
          } else {
            // 犯人牌不能使用，改为调和
            useCardAsHarmony(chosenCard, playerIndex)
          }
          break
        case 'harmony':
          useCardAsHarmony(chosenCard, playerIndex)
          break
        case 'doubt':
          if (targetPlayerId) {
            useCardAsDoubt(chosenCard, playerIndex, targetPlayerId)
          } else {
            // 没有目标，改为调和
            useCardAsHarmony(chosenCard, playerIndex)
          }
          break
      }
    }
    
    // 移动到下一个玩家
    setTimeout(() => {
      nextPlayer()
    }, 1500)
  }

  // 获取玩家被质疑的MP合计值
  const getPlayerDoubtMP = (playerId: string) => {
    const doubts = doubtArea.value.filter(item => item.playerId === playerId)
    return doubts.reduce((sum, item) => sum + item.card.mp, 0)
  }

  // 获取监禁者（被质疑MP合计值最高的玩家）
  const getPrisoners = () => {
    const playerDoubtMP = new Map<string, number>()
    
    // 计算每个玩家被质疑的MP合计值
    players.value.forEach(player => {
      const mp = getPlayerDoubtMP(player.id)
      // 质疑合计值为负时按0计算
      playerDoubtMP.set(player.id, Math.max(mp, 0))
    })
    
    // 找到最高值
    let maxMP = -1
    playerDoubtMP.forEach(mp => {
      if (mp > maxMP) maxMP = mp
    })
    
    // 找到所有MP等于最高值的玩家
    const prisoners: Player[] = []
    players.value.forEach(player => {
      if (playerDoubtMP.get(player.id) === maxMP && maxMP > 0) {
        prisoners.push(player)
      }
    })
    
    // 如果所有人合计值相同则无人被监禁
    if (prisoners.length === players.value.length) {
      return []
    }
    
    return prisoners
  }

  // 获取获胜者（按优先顺序判定）
  const getWinners = () => {
    const winners: Player[] = []
    const harmonySuccess = isHarmonySuccess.value
    const prisoners = getPrisoners()
    const prisonerIds = prisoners.map(p => p.id)
    
    // 获取每个玩家的主要身份（手牌中优先级最高的身份牌）
    const playerRoles = new Map<string, Card>()
    
    players.value.forEach(player => {
      // 查找玩家手牌中的所有身份卡牌
      const roleCards = player.handCards.filter(card => 
        ['alien', 'infected', 'prisoner', 'accomplice', 'president', 'monitor', 
         'excellent', 'discipline', 'health', 'library', 'ojousama', 'news', 'goHome'].includes(card.id)
      )
      
      if (roleCards.length > 0) {
        // 按优先级排序，取优先级最高的（数字小的优先级高）
        const mainRole = roleCards.sort((a, b) => a.priority - b.priority)[0]!
        playerRoles.set(player.id, mainRole)
      }
    })
    
    // 按优先级1→5依次判定
    // 优先级1：外星人 - 被监禁
    for (const [playerId, role] of playerRoles.entries()) {
      if (role.id === 'alien') {
        const player = players.value.find(p => p.id === playerId)
        if (player && prisonerIds.includes(playerId)) {
          winners.push(player)
          addLog(`${player.name}（外星人）被监禁，获得胜利（优先级1）`)
          return winners // 外星人获胜，后续不再判定
        }
      }
    }
    
    // 优先级2：感染者 - 调和失败
    for (const [playerId, role] of playerRoles.entries()) {
      if (role.id === 'infected') {
        const player = players.value.find(p => p.id === playerId)
        if (player && !harmonySuccess) {
          winners.push(player)
          addLog(`${player.name}（感染者）调和失败，获得胜利（优先级2）`)
          return winners // 感染者获胜，后续不再判定
        }
      }
    }
    
    // 优先级3：犯人 - 不被监禁
    for (const [playerId, role] of playerRoles.entries()) {
      if (role.id === 'prisoner') {
        const player = players.value.find(p => p.id === playerId)
        if (player && !prisonerIds.includes(playerId)) {
          winners.push(player)
          addLog(`${player.name}（犯人）不被监禁，获得胜利（优先级3）`)
          // 犯人获胜需要检查共犯
          // 查找是否有共犯
          for (const [accomplicePlayerId, accompliceRole] of playerRoles.entries()) {
            if (accompliceRole.id === 'accomplice') {
              const accomplicePlayer = players.value.find(p => p.id === accomplicePlayerId)
              if (accomplicePlayer) {
                winners.push(accomplicePlayer)
                addLog(`${accomplicePlayer.name}（共犯）因犯人胜利而获得胜利（优先级3）`)
              }
            }
          }
          return winners // 犯人/共犯获胜，后续不再判定
        }
      }
    }
    
    // 优先级3：共犯 - 犯人胜利（已在上面处理）
    
    // 优先级4：调和成功角色 - 调和成功
    if (harmonySuccess) {
      const harmonyRoles = ['president', 'monitor', 'excellent', 'discipline', 'health', 'library', 'ojousama', 'news']
      for (const [playerId, role] of playerRoles.entries()) {
        if (harmonyRoles.includes(role.id)) {
          const player = players.value.find(p => p.id === playerId)
          if (player) {
            winners.push(player)
            addLog(`${player.name}（${role.name}）调和成功，获得胜利（优先级4）`)
          }
        }
      }
      if (winners.length > 0) {
        return winners // 调和成功角色获胜，后续不再判定
      }
    }
    
    // 优先级5：归宅部 - 无任何人胜利
    for (const [playerId, role] of playerRoles.entries()) {
      if (role.id === 'goHome') {
        const player = players.value.find(p => p.id === playerId)
        // 归宅部胜利条件：无任何人胜利
        // 如果执行到这里还没有获胜者，则归宅部获胜
        if (player && winners.length === 0) {
          winners.push(player)
          addLog(`${player.name}（归宅部）无任何人胜利，获得胜利（优先级5）`)
          return winners
        }
      }
    }
    
    // 全灭结局：无人满足胜利条件
    if (winners.length === 0) {
      addLog('全灭结局：无人满足胜利条件')
    }
    
    return winners
  }

  return {
    // 状态
    gamePhase,
    currentPlayerIndex,
    roundCount,
    settings,
    cards,
    players,
    harmonyArea,
    doubtArea,
    cardPool,
    gameLog,
    playRecords,
    infectedEffect,
    pendingSkillAction,
    
    // 计算属性
    targetValue,
    harmonyTotalMP,
    isHarmonySuccess,
    currentPlayer,
    isGameEnded,
    
    // 方法
    getCardImage,
    startGame,
    endGame,
    backToMenu,
    initGame,
    useCardAsSkill,
    useCardAsHarmony,
    useCardAsDoubt,
    nextPlayer,
    getPlayerDoubtMP,
    getPrisoners,
    getWinners,
    addLog,
    // 技能执行方法
    executeInfectedEffect,
    executeAccompliceEffect,
    executeMonitorEffect,
    executeDisciplineEffect,
    executeHealthEffect,
    executeOjousamaEffect,
    executeGoHomeEffect
  }
})