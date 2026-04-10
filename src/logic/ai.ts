import type { GameState, Player, Card } from '../types/game';
import { ActionType, Faction } from '../types/game';

/**
 * AI决策接口
 */
export interface AIDecision {
  actionType: ActionType;
  cardIndex: number;
  params?: any;
}

/**
 * AI做出决策
 */
export function makeAIDecision(state: GameState): AIDecision | null {
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  if (!currentPlayer.isAI || !currentPlayer.isAlive || currentPlayer.isLocked) {
    return null;
  }
  
  const hand = currentPlayer.hand;
  
  if (hand.length === 0) {
    return null;
  }
  
  // 策略决策
  const strategy = evaluateStrategy(state, currentPlayer);
  
  switch (strategy) {
    case 'harmonize':
      return makeHarmonizeDecision(currentPlayer, state);
    case 'accuse':
      return makeAccuseDecision(currentPlayer, state);
    case 'use_skill':
      return makeSkillDecision(currentPlayer, state);
    default:
      // 默认调和
      return makeHarmonizeDecision(currentPlayer, state);
  }
}

/**
 * 评估AI策略
 */
function evaluateStrategy(state: GameState, player: Player): 'harmonize' | 'accuse' | 'use_skill' {
  const harmonyTotal = calculateHarmonyTotal(state.harmonyZone);
  const harmonyTarget = state.harmonyTarget;
  const harmonyDeficit = harmonyTarget - harmonyTotal;
  
  // 如果调和值严重不足,优先调和
  if (harmonyDeficit > 5) {
    return 'harmonize';
  }
  
  // 如果手牌中有高价值技能卡,使用技能
  const hasUsefulSkill = player.hand.some(card => 
    card.skillType !== 'none' && card.strength <= 1
  );
  
  if (hasUsefulSkill && Math.random() > 0.5) {
    return 'use_skill';
  }
  
  // 随机选择质疑或调和
  return Math.random() > 0.6 ? 'accuse' : 'harmonize';
}

/**
 * 做出调和决策
 */
function makeHarmonizeDecision(player: Player, state: GameState): AIDecision | null {
  // 选择强度最低的卡牌进行调和
  let minStrength = Infinity;
  let cardIndex = 0;
  
  player.hand.forEach((card, index) => {
    if (card.strength < minStrength) {
      minStrength = card.strength;
      cardIndex = index;
    }
  });
  
  return {
    actionType: ActionType.HARMONIZE,
    cardIndex
  };
}

/**
 * 做出质疑决策
 */
function makeAccuseDecision(player: Player, state: GameState): AIDecision | null {
  // 随机选择一个其他玩家
  const otherPlayers = state.players.filter(p => p.id !== player.id);
  
  if (otherPlayers.length === 0) {
    return null;
  }
  
  // 随机选择目标
  const targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
  
  // 选择强度最高的卡牌质疑
  let maxStrength = -1;
  let cardIndex = 0;
  
  player.hand.forEach((card, index) => {
    if (card.strength > maxStrength) {
      maxStrength = card.strength;
      cardIndex = index;
    }
  });
  
  return {
    actionType: ActionType.ACCUSE,
    cardIndex,
    params: {
      targetPlayerId: targetPlayer.id
    }
  };
}

/**
 * 做出技能决策
 */
function makeSkillDecision(player: Player, state: GameState): AIDecision | null {
  // 找到有技能的卡牌
  const skillCards = player.hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.skillType !== 'none');
  
  if (skillCards.length === 0) {
    return null;
  }
  
  // 随机选择一个技能卡
  const { card, index: cardIndex } = skillCards[Math.floor(Math.random() * skillCards.length)];
  
  // 根据技能类型决定
  const otherPlayers = state.players.filter(p => p.id !== player.id && !p.isLocked);
  
  if (otherPlayers.length === 0) {
    // 没有其他玩家,只能调和
    return makeHarmonizeDecision(player, state);
  }
  
  const targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
  
  // 简化处理:对于需要复杂参数的技能,降级为调和
  if (card.skillType === 'swap_all_cards' || 
      card.skillType === 'swap_with_deck' ||
      card.skillType === 'flexible_place' ||
      card.skillType === 'take_used_card' ||
      card.skillType === 'move_accuse_card' ||
      card.skillType === 'pass_card_left') {
    return makeHarmonizeDecision(player, state);
  }
  
  return {
    actionType: ActionType.USE_SKILL,
    cardIndex,
    params: {
      targetPlayerId: targetPlayer.id
    }
  };
}

/**
 * 计算调和区总强度
 */
function calculateHarmonyTotal(harmonyZone: Card[]): number {
  return harmonyZone.reduce((total, card) => total + card.strength, 0);
}

/**
 * AI执行行动(异步,模拟思考时间)
 */
export async function executeAITurn(state: GameState, delay: number = 1500): Promise<AIDecision | null> {
  // 模拟思考时间
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return makeAIDecision(state);
}
