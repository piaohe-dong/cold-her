import { reactive } from 'vue';
import type { GameState, GameResults } from '../types/game';
import { GamePhase, ActionType } from '../types/game';
import { initializeGame, executeAction, checkIdentityLock, checkGameOver, nextTurn, getCurrentPlayer } from '../logic/gameEngine';
import { resolveGame } from '../logic/resolution';
import { executeAITurn, makeAIDecision } from '../logic/ai';

// 游戏状态
const state = reactive<GameState>({
  phase: GamePhase.SETUP,
  players: [],
  deck: [],
  harmonyZone: [],
  currentPlayerIndex: 0,
  playerCount: 0,
  harmonyTarget: 0,
  startingPlayerIndex: 0,
  turnCount: 0,
  gameOver: false,
  results: null
});

// 消息日志
const messageLog = reactive<string[]>([]);

// 当前技能执行需要的参数
const skillParams = reactive<{
  needParams: boolean;
  skillType: string;
  cardIndex: number;
}>({
  needParams: false,
  skillType: '',
  cardIndex: -1
});

/**
 * 添加消息
 */
function addMessage(message: string) {
  messageLog.push(message);
  console.log(message);
}

/**
 * 开始游戏
 */
export function startGame(playerCount: number, aiCount: number) {
  const newState = initializeGame(playerCount, aiCount);
  
  // 复制状态
  Object.assign(state, newState);
  state.phase = GamePhase.ACTION;
  
  messageLog.length = 0;
  addMessage(`游戏开始! ${playerCount}人局, ${aiCount}个AI对手`);
  addMessage(`起始玩家: ${getCurrentPlayer(state).name}`);
  addMessage(`调和目标: ${state.harmonyTarget}`);
  
  // 如果起始玩家是AI,执行AI回合
  if (getCurrentPlayer(state).isAI) {
    executeAITurnAction();
  }
}

/**
 * 玩家执行行动
 */
export async function playerAction(actionType: ActionType, cardIndex: number, params?: any) {
  if (state.phase !== GamePhase.ACTION) {
    addMessage('当前不是行动阶段');
    return false;
  }
  
  const currentPlayer = getCurrentPlayer(state);
  
  if (currentPlayer.isAI) {
    addMessage('现在是AI的回合');
    return false;
  }
  
  // 执行行动
  const result = executeAction(state, actionType, cardIndex, params);
  
  if (!result.success) {
    addMessage(result.message);
    return false;
  }
  
  addMessage(`${currentPlayer.name}: ${result.message}`);
  
  // 检查身份锁定
  checkIdentityLock(state);
  addMessage('身份锁定检查完成');
  
  // 检查游戏结束
  if (checkGameOver(state)) {
    addMessage('游戏结束!进入结算阶段');
    await resolveGamePhase();
    return true;
  }
  
  // 切换到下一个玩家
  nextTurn(state);
  addMessage(`回合结束,下一个玩家: ${getCurrentPlayer(state).name}`);
  
  // 如果下一个玩家是AI,执行AI回合
  if (getCurrentPlayer(state).isAI) {
    await executeAITurnAction();
  }
  
  return true;
}

/**
 * 执行AI回合
 */
async function executeAITurnAction() {
  const aiPlayer = getCurrentPlayer(state);
  
  if (!aiPlayer.isAI || !aiPlayer.isAlive || aiPlayer.isLocked) {
    return;
  }
  
  addMessage(`${aiPlayer.name}正在思考...`);
  
  const decision = await executeAITurn(state, 1500);
  
  if (!decision) {
    addMessage(`${aiPlayer.name}无法做出决策`);
    nextTurn(state);
    
    // 检查游戏结束
    if (checkGameOver(state)) {
      await resolveGamePhase();
    } else if (getCurrentPlayer(state).isAI) {
      await executeAITurnAction();
    }
    return;
  }
  
  // 执行AI决策
  const result = executeAction(state, decision.actionType, decision.cardIndex, decision.params);
  
  if (result.success) {
    addMessage(`${aiPlayer.name}: ${result.message}`);
  } else {
    addMessage(`${aiPlayer.name}行动失败: ${result.message}`);
  }
  
  // 检查身份锁定
  checkIdentityLock(state);
  
  // 检查游戏结束
  if (checkGameOver(state)) {
    addMessage('游戏结束!进入结算阶段');
    await resolveGamePhase();
    return;
  }
  
  // 切换到下一个玩家
  nextTurn(state);
  addMessage(`${aiPlayer.name}回合结束,下一个玩家: ${getCurrentPlayer(state).name}`);
  
  // 如果下一个玩家还是AI,继续执行
  if (getCurrentPlayer(state).isAI) {
    await executeAITurnAction();
  }
}

/**
 * 结算阶段
 */
async function resolveGamePhase() {
  state.phase = GamePhase.HARMONY_CHECK;
  addMessage('=== 调和判定 ===');
  
  await delay(1000);
  
  const results = resolveGame(state);
  state.results = results;
  
  addMessage(`调和总强度: ${results.harmonyTotal}/${state.harmonyTarget}`);
  addMessage(results.harmonySuccess ? '调和成功!' : '调和失败!');
  
  state.phase = GamePhase.IMPRISON_CHECK;
  addMessage('=== 监禁判定 ===');
  
  await delay(1000);
  
  if (results.imprisonedPlayers.length > 0) {
    const imprisonedNames = results.imprisonedPlayers
      .map(id => state.players.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    addMessage(`被监禁的玩家: ${imprisonedNames}`);
  } else {
    addMessage('无人被监禁');
  }
  
  state.phase = GamePhase.IDENTITY_REVEAL;
  addMessage('=== 身份揭示 ===');
  
  await delay(1000);
  
  state.players.forEach((player, index) => {
    const identityName = player.identityCard?.name || '未知';
    addMessage(`${player.name}的身份: ${identityName}`);
  });
  
  state.phase = GamePhase.GAME_OVER;
  addMessage('=== 游戏结束 ===');
  
  if (results.winners.length > 0) {
    const winnerNames = results.winners
      .map(id => state.players.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    addMessage(`获胜者: ${winnerNames}`);
  } else {
    addMessage('平局!');
  }
  
  state.gameOver = true;
}

/**
 * 延迟函数
 */
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重置游戏
 */
export function resetGame() {
  state.phase = GamePhase.SETUP;
  state.players = [];
  state.deck = [];
  state.harmonyZone = [];
  state.currentPlayerIndex = 0;
  state.playerCount = 0;
  state.harmonyTarget = 0;
  state.startingPlayerIndex = 0;
  state.turnCount = 0;
  state.gameOver = false;
  state.results = null;
  
  messageLog.length = 0;
  
  skillParams.needParams = false;
  skillParams.skillType = '';
  skillParams.cardIndex = -1;
}

/**
 * 获取游戏状态
 */
export function getGameState() {
  return state;
}

/**
 * 获取消息日志
 */
export function getMessageLog() {
  return messageLog;
}

/**
 * 获取技能参数需求
 */
export function getSkillParams() {
  return skillParams;
}

/**
 * 设置技能参数需求
 */
export function setSkillParams(needParams: boolean, skillType: string, cardIndex: number) {
  skillParams.needParams = needParams;
  skillParams.skillType = skillType;
  skillParams.cardIndex = cardIndex;
}
