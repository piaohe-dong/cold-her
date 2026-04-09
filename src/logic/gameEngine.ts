import type { Card, Player, GameState } from '../types/game';
import { GamePhase, ActionType, Faction, HARMONY_TARGETS } from '../types/game';
import { getCardsForPlayerCount, createCardInstance } from '../data/cards';

/**
 * 初始化游戏
 */
export function initializeGame(playerCount: number, aiCount: number): GameState {
  // 获取卡牌列表
  const cardDataList = getCardsForPlayerCount(playerCount);
  
  // 生成卡牌实例
  let allCards: Card[] = [];
  cardDataList.forEach((cardData, index) => {
    for (let i = 0; i < cardData.count; i++) {
      allCards.push(createCardInstance(cardData, allCards.length));
    }
  });
  
  // 洗牌
  allCards = shuffleArray(allCards);
  
  // 创建玩家
  const players: Player[] = [];
  for (let i = 0; i < playerCount; i++) {
    const isAI = i < aiCount; // 前aiCount个玩家是AI
    players.push({
      id: `player_${i}`,
      name: isAI ? `AI玩家${i + 1}` : `玩家${i + 1}`,
      hand: [],
      identityCard: null,
      accuseZone: [],
      isLocked: false,
      isAI: isAI,
      isAlive: true,
      cannotUseSkill: false
    });
  }
  
  // 分发手牌(平均分配)
  const cardsPerPlayer = Math.floor(allCards.length / playerCount);
  const remainingCards = allCards.length % playerCount;
  
  let cardIndex = 0;
  for (let i = 0; i < playerCount; i++) {
    const count = cardsPerPlayer + (i < remainingCards ? 1 : 0);
    players[i].hand = allCards.slice(cardIndex, cardIndex + count);
    cardIndex += count;
  }
  
  // 牌库剩余卡牌
  const deck: Card[] = [];
  
  // 找到学生会长作为起始玩家
  let startingPlayerIndex = 0;
  players.forEach((player, index) => {
    const hasPresident = player.hand.some(card => card.name === '学生会长');
    if (hasPresident) {
      startingPlayerIndex = index;
    }
  });
  
  return {
    phase: GamePhase.ACTION,
    players,
    deck,
    harmonyZone: [],
    currentPlayerIndex: startingPlayerIndex,
    playerCount,
    harmonyTarget: HARMONY_TARGETS[playerCount],
    startingPlayerIndex,
    turnCount: 1,
    gameOver: false,
    results: null
  };
}

/**
 * 执行行动
 */
export function executeAction(
  state: GameState,
  actionType: ActionType,
  cardIndex: number,
  params?: any
): { success: boolean; message: string } {
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  // 验证卡牌索引
  if (cardIndex < 0 || cardIndex >= currentPlayer.hand.length) {
    return { success: false, message: '无效的卡牌索引' };
  }
  
  const card = currentPlayer.hand[cardIndex];
  
  switch (actionType) {
    case ActionType.USE_SKILL:
      return executeSkillAction(state, cardIndex, params);
    case ActionType.HARMONIZE:
      return executeHarmonizeAction(state, cardIndex);
    case ActionType.ACCUSE:
      return executeAccuseAction(state, cardIndex, params);
    default:
      return { success: false, message: '未知的行动类型' };
  }
}

/**
 * 发动技能行动
 */
function executeSkillAction(
  state: GameState,
  cardIndex: number,
  params?: any
): { success: boolean; message: string } {
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  if (currentPlayer.cannotUseSkill) {
    return { success: false, message: '本回合不能发动技能' };
  }
  
  const card = currentPlayer.hand[cardIndex];
  
  // 如果卡牌没有技能
  if (card.skillType === 'none') {
    return { success: false, message: '此卡牌没有技能' };
  }
  
  // 将卡牌正面打出,放在自己面前
  // 注意:这里简化处理,实际应该显示在UI上
  currentPlayer.hand.splice(cardIndex, 1);
  
  // TODO: 技能效果需要通过UI交互获取参数
  // 这里返回需要参数的信息
  return { 
    success: true, 
    message: `发动了${card.name}的技能: ${card.skill}` 
  };
}

/**
 * 调和尸体行动
 */
function executeHarmonizeAction(
  state: GameState,
  cardIndex: number
): { success: boolean; message: string } {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const card = currentPlayer.hand.splice(cardIndex, 1)[0];
  
  // 背面朝上放入调和区
  state.harmonyZone.push(card);
  
  return { 
    success: true, 
    message: `将${card.name}(强度${card.strength})背面朝上放入调和区` 
  };
}

/**
 * 质疑玩家行动
 */
function executeAccuseAction(
  state: GameState,
  cardIndex: number,
  params: { targetPlayerId: string }
): { success: boolean; message: string } {
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  if (!params || !params.targetPlayerId) {
    return { success: false, message: '需要指定质疑目标' };
  }
  
  const targetPlayer = state.players.find(p => p.id === params.targetPlayerId);
  if (!targetPlayer) {
    return { success: false, message: '目标玩家不存在' };
  }
  
  const card = currentPlayer.hand.splice(cardIndex, 1)[0];
  
  // 背面朝上放入目标玩家的质疑区
  targetPlayer.accuseZone.push(card);
  
  return { 
    success: true, 
    message: `质疑${targetPlayer.name},将${card.name}(强度${card.strength})放入其质疑区` 
  };
}

/**
 * 检查身份锁定
 */
export function checkIdentityLock(state: GameState): void {
  state.players.forEach(player => {
    if (!player.isLocked && player.hand.length === 1 && player.isAlive) {
      // 锁定身份
      player.isLocked = true;
      player.isAlive = false;
      player.identityCard = player.hand[0];
    }
  });
}

/**
 * 检查游戏是否结束
 */
export function checkGameOver(state: GameState): boolean {
  // 所有玩家都只剩1张手牌时,游戏结束
  const allLocked = state.players.every(player => player.isLocked);
  
  if (allLocked) {
    state.gameOver = true;
    state.phase = GamePhase.HARMONY_CHECK;
    return true;
  }
  
  return false;
}

/**
 * 切换到下一个玩家
 */
export function nextTurn(state: GameState): void {
  // 重置当前玩家的技能限制
  const currentPlayer = state.players[state.currentPlayerIndex];
  currentPlayer.cannotUseSkill = false;
  
  // 查找下一个活跃玩家
  let nextIndex = (state.currentPlayerIndex + 1) % state.playerCount;
  let attempts = 0;
  
  while (attempts < state.playerCount) {
    const nextPlayer = state.players[nextIndex];
    if (nextPlayer.isAlive && !nextPlayer.isLocked) {
      break;
    }
    nextIndex = (nextIndex + 1) % state.playerCount;
    attempts++;
  }
  
  // 如果回到原点,说明所有玩家都锁定了
  if (nextIndex === state.currentPlayerIndex) {
    checkGameOver(state);
    return;
  }
  
  state.currentPlayerIndex = nextIndex;
  
  // 如果回到起始玩家,回合数+1
  if (nextIndex === state.startingPlayerIndex) {
    state.turnCount++;
  }
}

/**
 * 洗牌
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 获取当前玩家
 */
export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

/**
 * 获取可调和其他玩家列表
 */
export function getAvailableTargets(state: GameState, excludeSelf: boolean = true): Player[] {
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  return state.players.filter(player => {
    if (excludeSelf && player.id === currentPlayer.id) return false;
    return player.isAlive || player.isLocked; // 锁定的玩家也可以被选择
  });
}
