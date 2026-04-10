import type { Card, Player } from '../types/game';
import { SkillType, Faction } from '../types/game';

/**
 * 执行卡牌技能
 * @param card 卡牌
 * @param currentPlayer 当前玩家
 * @param allPlayers 所有玩家
 * @param deck 牌库
 * @param harmonyZone 调和区
 * @param params 技能参数(根据技能类型不同)
 * @returns 执行结果
 */
export function executeSkill(
  card: Card,
  currentPlayer: Player,
  allPlayers: Player[],
  deck: Card[],
  harmonyZone: Card[],
  params: any
): { success: boolean; message: string; updatedPlayers?: Player[]; updatedDeck?: Card[]; updatedHarmonyZone?: Card[] } {
  switch (card.skillType) {
    case SkillType.VIEW_ONE_CARD:
      return executeViewOneCard(currentPlayer, allPlayers, params);
    case SkillType.VIEW_ALL_CARDS:
      return executeViewAllCards(currentPlayer, allPlayers, params);
    case SkillType.SWAP_ONE_CARD:
      return executeSwapOneCard(currentPlayer, allPlayers, params);
    case SkillType.SWAP_ALL_CARDS:
      return executeSwapAllCards(allPlayers, params);
    case SkillType.BLOCK_SKILL:
      return executeBlockSkill(allPlayers, params);
    case SkillType.VIEW_HARMONY:
      return executeViewHarmony(harmonyZone);
    case SkillType.FORCE_HARMONIZE:
      return executeForceHarmonize(allPlayers, params);
    case SkillType.VIEW_IDENTITY:
      return executeViewIdentity(currentPlayer, allPlayers, params);
    case SkillType.SWAP_WITH_DECK:
      return executeSwapWithDeck(currentPlayer, deck);
    case SkillType.GIVE_CARD:
      return executeGiveCard(currentPlayer, allPlayers, params);
    case SkillType.INFECT_HARMONIZE:
      return executeInfectHarmonize(currentPlayer, harmonyZone, params);
    case SkillType.FLEXIBLE_PLACE:
      return executeFlexiblePlace(currentPlayer, allPlayers, harmonyZone, params);
    case SkillType.TAKE_USED_CARD:
      return executeTakeUsedCard(currentPlayer, allPlayers, params);
    case SkillType.MOVE_ACCUSE_CARD:
      return executeMoveAccuseCard(currentPlayer, allPlayers, params);
    case SkillType.PASS_CARD_LEFT:
      return executePassCardLeft(allPlayers, params);
    default:
      return { success: false, message: '无技能或技能类型未知' };
  }
}

/**
 * 学生会长/查看1张手牌
 */
function executeViewOneCard(
  currentPlayer: Player,
  allPlayers: Player[],
  params: { targetPlayerId: string; cardIndex: number }
): { success: boolean; message: string } {
  const targetPlayer = allPlayers.find(p => p.id === params.targetPlayerId);
  if (!targetPlayer || targetPlayer.hand.length === 0) {
    return { success: false, message: '目标玩家无效或没有手牌' };
  }
  
  if (params.cardIndex < 0 || params.cardIndex >= targetPlayer.hand.length) {
    return { success: false, message: '卡牌索引无效' };
  }
  
  const card = targetPlayer.hand[params.cardIndex];
  return { 
    success: true, 
    message: `查看了${targetPlayer.name}的${card.name}` 
  };
}

/**
 * 风纪委员/查看所有手牌
 */
function executeViewAllCards(
  currentPlayer: Player,
  allPlayers: Player[],
  params: { targetPlayerId: string }
): { success: boolean; message: string } {
  const targetPlayer = allPlayers.find(p => p.id === params.targetPlayerId);
  if (!targetPlayer || targetPlayer.hand.length === 0) {
    return { success: false, message: '目标玩家无效或没有手牌' };
  }
  
  const cardNames = targetPlayer.hand.map(c => c.name).join(', ');
  return { 
    success: true, 
    message: `查看了${targetPlayer.name}的所有手牌: ${cardNames}` 
  };
}

/**
 * 图书委员/交换1张牌
 */
function executeSwapOneCard(
  currentPlayer: Player,
  allPlayers: Player[],
  params: { targetPlayerId: string; takeIndex: number; giveIndex: number }
): { success: boolean; message: string; updatedPlayers?: Player[] } {
  const targetPlayer = allPlayers.find(p => p.id === params.targetPlayerId);
  if (!targetPlayer || targetPlayer.hand.length === 0 || currentPlayer.hand.length === 0) {
    return { success: false, message: '目标玩家无效或手牌不足' };
  }
  
  if (params.takeIndex < 0 || params.takeIndex >= targetPlayer.hand.length) {
    return { success: false, message: '抽取索引无效' };
  }
  
  if (params.giveIndex < 0 || params.giveIndex >= currentPlayer.hand.length) {
    return { success: false, message: '给予索引无效' };
  }
  
  // 交换卡牌
  const takenCard = targetPlayer.hand.splice(params.takeIndex, 1)[0];
  const givenCard = currentPlayer.hand.splice(params.giveIndex, 1)[0];
  
  targetPlayer.hand.push(givenCard);
  currentPlayer.hand.push(takenCard);
  
  return { 
    success: true, 
    message: `从${targetPlayer.name}处获得${takenCard.name},给予${givenCard.name}`,
    updatedPlayers: allPlayers
  };
}

/**
 * 班长/交换所有手牌
 */
function executeSwapAllCards(
  allPlayers: Player[],
  params: { player1Id: string; player2Id: string }
): { success: boolean; message: string; updatedPlayers?: Player[] } {
  const player1 = allPlayers.find(p => p.id === params.player1Id);
  const player2 = allPlayers.find(p => p.id === params.player2Id);
  
  if (!player1 || !player2 || player1.isLocked || player2.isLocked) {
    return { success: false, message: '玩家无效或已锁定' };
  }
  
  // 交换手牌
  const temp = [...player1.hand];
  player1.hand = [...player2.hand];
  player2.hand = temp;
  
  return { 
    success: true, 
    message: `交换了${player1.name}和${player2.name}的所有手牌`,
    updatedPlayers: allPlayers
  };
}

/**
 * 保健委员/禁止发动技能
 */
function executeBlockSkill(
  allPlayers: Player[],
  params: { targetPlayerId: string }
): { success: boolean; message: string; updatedPlayers?: Player[] } {
  const targetPlayer = allPlayers.find(p => p.id === params.targetPlayerId);
  if (!targetPlayer || targetPlayer.isLocked) {
    return { success: false, message: '目标玩家无效或已锁定' };
  }
  
  targetPlayer.cannotUseSkill = true;
  
  return { 
    success: true, 
    message: `${targetPlayer.name}本回合不能发动技能`,
    updatedPlayers: allPlayers
  };
}

/**
 * 文艺委员/查看调和区
 */
function executeViewHarmony(
  harmonyZone: Card[]
): { success: boolean; message: string } {
  if (harmonyZone.length === 0) {
    return { success: false, message: '调和区为空' };
  }
  
  const topCard = harmonyZone[harmonyZone.length - 1];
  return { 
    success: true, 
    message: `调和区最上方的卡牌是: ${topCard.name}(强度${topCard.strength})` 
  };
}

/**
 * 体育委员/强制调和
 */
function executeForceHarmonize(
  allPlayers: Player[],
  params: { targetPlayerId: string; cardIndex: number }
): { success: boolean; message: string; updatedPlayers?: Player[] } {
  const targetPlayer = allPlayers.find(p => p.id === params.targetPlayerId);
  if (!targetPlayer || targetPlayer.isLocked || targetPlayer.hand.length === 0) {
    return { success: false, message: '目标玩家无效、已锁定或没有手牌' };
  }
  
  if (params.cardIndex < 0 || params.cardIndex >= targetPlayer.hand.length) {
    return { success: false, message: '卡牌索引无效' };
  }
  
  // 这个技能需要在游戏引擎层面处理,将卡牌加入调和区
  return { 
    success: true, 
    message: `${targetPlayer.name}必须打出1张调和牌`
  };
}

/**
 * 新闻部/查看身份牌
 */
function executeViewIdentity(
  currentPlayer: Player,
  allPlayers: Player[],
  params: { targetPlayerId: string }
): { success: boolean; message: string } {
  const targetPlayer = allPlayers.find(p => p.id === params.targetPlayerId);
  if (!targetPlayer || !targetPlayer.identityCard) {
    return { success: false, message: '目标玩家无效或身份未锁定' };
  }
  
  return { 
    success: true, 
    message: `${targetPlayer.name}的身份是: ${targetPlayer.identityCard.name}(仅自己可见)` 
  };
}

/**
 * 优等生/与牌库交换
 */
function executeSwapWithDeck(
  currentPlayer: Player,
  deck: Card[]
): { success: boolean; message: string; updatedDeck?: Card[] } {
  if (deck.length === 0 || currentPlayer.hand.length === 0) {
    return { success: false, message: '牌库为空或没有手牌' };
  }
  
  // 简化实现:与牌库顶牌交换第一张手牌
  const deckTop = deck.shift()!;
  const handCard = currentPlayer.hand.shift()!;
  
  currentPlayer.hand.push(deckTop);
  deck.push(handCard);
  
  return { 
    success: true, 
    message: `与牌库交换了卡牌`,
    updatedDeck: deck
  };
}

/**
 * 共犯/给予卡牌
 */
function executeGiveCard(
  currentPlayer: Player,
  allPlayers: Player[],
  params: { targetPlayerId: string; cardIndex: number }
): { success: boolean; message: string; updatedPlayers?: Player[] } {
  const targetPlayer = allPlayers.find(p => p.id === params.targetPlayerId);
  if (!targetPlayer || targetPlayer.isLocked) {
    return { success: false, message: '目标玩家无效或已锁定' };
  }
  
  if (currentPlayer.hand.length === 0) {
    return { success: false, message: '没有手牌可以给予' };
  }
  
  if (params.cardIndex < 0 || params.cardIndex >= currentPlayer.hand.length) {
    return { success: false, message: '卡牌索引无效' };
  }
  
  const card = currentPlayer.hand.splice(params.cardIndex, 1)[0];
  targetPlayer.hand.push(card);
  
  return { 
    success: true, 
    message: `将${card.name}交给${targetPlayer.name}`,
    updatedPlayers: allPlayers
  };
}

/**
 * 感染者/调和
 */
function executeInfectHarmonize(
  currentPlayer: Player,
  harmonyZone: Card[],
  params: { cardIndex: number }
): { success: boolean; message: string } {
  if (currentPlayer.hand.length === 0) {
    return { success: false, message: '没有手牌' };
  }
  
  if (params.cardIndex < 0 || params.cardIndex >= currentPlayer.hand.length) {
    return { success: false, message: '卡牌索引无效' };
  }
  
  return { 
    success: true, 
    message: '将手牌放入调和区(背面朝上)'
  };
}

/**
 * 归宅部/灵活放置
 */
function executeFlexiblePlace(
  currentPlayer: Player,
  allPlayers: Player[],
  harmonyZone: Card[],
  params: { cardIndex: number; target: 'harmony' | 'accuse'; accuseTargetId?: string }
): { success: boolean; message: string } {
  if (currentPlayer.hand.length === 0) {
    return { success: false, message: '没有手牌' };
  }
  
  if (params.cardIndex < 0 || params.cardIndex >= currentPlayer.hand.length) {
    return { success: false, message: '卡牌索引无效' };
  }
  
  const card = currentPlayer.hand[params.cardIndex];
  
  if (params.target === 'harmony') {
    return { success: true, message: `将${card.name}放入调和区` };
  } else {
    const targetPlayer = allPlayers.find(p => p.id === params.accuseTargetId);
    if (!targetPlayer) {
      return { success: false, message: '目标玩家无效' };
    }
    return { success: true, message: `将${card.name}放入${targetPlayer.name}的质疑区` };
  }
}

/**
 * 保健委员/夺走已使用的牌
 */
function executeTakeUsedCard(
  currentPlayer: Player,
  allPlayers: Player[],
  params: { targetPlayerId: string; usedCardIndex: number }
): { success: boolean; message: string; updatedPlayers?: Player[] } {
  const targetPlayer = allPlayers.find(p => p.id === params.targetPlayerId);
  if (!targetPlayer || targetPlayer.usedCards.length === 0) {
    return { success: false, message: '目标玩家无效或没有已使用的牌' };
  }
  
  if (params.usedCardIndex < 0 || params.usedCardIndex >= targetPlayer.usedCards.length) {
    return { success: false, message: '卡牌索引无效' };
  }
  
  // 夺走目标玩家的已使用卡牌
  const takenCard = targetPlayer.usedCards.splice(params.usedCardIndex, 1)[0];
  currentPlayer.usedCards.push(takenCard);
  
  return { 
    success: true, 
    message: `从${targetPlayer.name}处夺走了已使用的${takenCard.name}`,
    updatedPlayers: allPlayers
  };
}

/**
 * 共犯/移动质疑位置的牌
 */
function executeMoveAccuseCard(
  currentPlayer: Player,
  allPlayers: Player[],
  params: { sourcePlayerId: string; targetPlayerId: string; accuseCardIndex: number }
): { success: boolean; message: string; updatedPlayers?: Player[] } {
  const sourcePlayer = allPlayers.find(p => p.id === params.sourcePlayerId);
  const targetPlayer = allPlayers.find(p => p.id === params.targetPlayerId);
  
  if (!sourcePlayer || !targetPlayer || sourcePlayer.isLocked || targetPlayer.isLocked) {
    return { success: false, message: '玩家无效或已锁定' };
  }
  
  if (sourcePlayer.accuseZone.length === 0) {
    return { success: false, message: '源玩家质疑区没有卡牌' };
  }
  
  if (params.accuseCardIndex < 0 || params.accuseCardIndex >= sourcePlayer.accuseZone.length) {
    return { success: false, message: '卡牌索引无效' };
  }
  
  // 移动质疑位置的牌
  const movedCard = sourcePlayer.accuseZone.splice(params.accuseCardIndex, 1)[0];
  targetPlayer.accuseZone.push(movedCard);
  
  return { 
    success: true, 
    message: `将${sourcePlayer.name}质疑区的${movedCard.name}移动到${targetPlayer.name}的质疑区`,
    updatedPlayers: allPlayers
  };
}

/**
 * 新闻部/所有人将1张手牌传给左边玩家
 */
function executePassCardLeft(
  allPlayers: Player[],
  params: { cardIndex: number }
): { success: boolean; message: string; updatedPlayers?: Player[] } {
  // 检查所有玩家都有至少1张手牌
  for (const player of allPlayers) {
    if (player.hand.length === 0) {
      return { success: false, message: `${player.name}没有手牌,无法传递` };
    }
  }
  
  // 检查卡牌索引是否有效
  for (const player of allPlayers) {
    if (params.cardIndex < 0 || params.cardIndex >= player.hand.length) {
      return { success: false, message: `卡牌索引对${player.name}无效` };
    }
  }
  
  // 收集每个玩家要传递的卡牌
  const cardsToPass: Card[] = [];
  for (const player of allPlayers) {
    const card = player.hand.splice(params.cardIndex, 1)[0];
    cardsToPass.push(card);
  }
  
  // 将卡牌传递给左边玩家（按玩家顺序循环）
  for (let i = 0; i < allPlayers.length; i++) {
    const receiverIndex = (i + 1) % allPlayers.length; // 左边玩家（顺时针顺序）
    const card = cardsToPass[i];
    allPlayers[receiverIndex].hand.push(card);
  }
  
  return { 
    success: true, 
    message: '所有人将1张手牌传给了左边玩家',
    updatedPlayers: allPlayers
  };
}
