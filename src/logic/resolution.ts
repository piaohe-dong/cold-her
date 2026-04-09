import type { GameState, Player, GameResults } from '../types/game';
import { GamePhase, Faction } from '../types/game';

/**
 * 执行游戏结算
 */
export function resolveGame(state: GameState): GameResults {
  // 1. 调和判定
  const harmonyResult = checkHarmony(state);
  
  // 2. 监禁判定
  const imprisonedPlayers = checkImprisonment(state);
  
  // 3. 身份结算
  const results = checkIdentities(state, harmonyResult.success, imprisonedPlayers);
  
  return results;
}

/**
 * 调和判定
 */
function checkHarmony(state: GameState): { success: boolean; total: number; target: number } {
  const total = state.harmonyZone.reduce((sum, card) => sum + card.strength, 0);
  const target = state.harmonyTarget;
  const success = total >= target;
  
  return { success, total, target };
}

/**
 * 监禁判定
 */
function checkImprisonment(state: GameState): string[] {
  // 计算每个玩家质疑区的总强度
  const accuseScores = state.players.map(player => ({
    id: player.id,
    name: player.name,
    total: player.accuseZone.reduce((sum, card) => sum + card.strength, 0)
  }));
  
  // 找出最高分
  const maxScore = Math.max(...accuseScores.map(score => score.total));
  
  // 如果所有玩家分数相同,无人被监禁
  const allSame = accuseScores.every(score => score.total === accuseScores[0].total);
  if (allSame) {
    return [];
  }
  
  // 分数最高的玩家被监禁
  return accuseScores
    .filter(score => score.total === maxScore)
    .map(score => score.id);
}

/**
 * 身份结算(按优先级判定)
 */
function checkIdentities(
  state: GameState,
  harmonySuccess: boolean,
  imprisonedPlayers: string[]
): GameResults {
  const results: GameResults = {
    harmonySuccess,
    harmonyTotal: state.harmonyZone.reduce((sum, card) => sum + card.strength, 0),
    imprisonedPlayers,
    winners: [],
    winnerFaction: null,
    revealOrder: [...state.players]
  };
  
  // 按优先级判定胜利
  // 优先级1: 宇宙人 - 被监禁即获胜
  const alienWinners = checkAlienWin(state, imprisonedPlayers);
  if (alienWinners.length > 0) {
    results.winners = alienWinners;
    results.winnerFaction = Faction.ALIEN;
    return results;
  }
  
  // 优先级2: 感染者 - 调和失败即获胜
  if (!harmonySuccess) {
    const infectedWinners = checkInfectedWin(state);
    if (infectedWinners.length > 0) {
      results.winners = infectedWinners;
      results.winnerFaction = Faction.INFECTED;
      return results;
    }
    
    // 归宅部也可能获胜(优先级5,但调和失败是前提)
    const goHomeWinners = checkGoHomeWin(state, imprisonedPlayers);
    if (goHomeWinners.length > 0) {
      results.winners = goHomeWinners;
      results.winnerFaction = Faction.GO_HOME;
      return results;
    }
  }
  
  // 优先级3: 犯人与共犯 - 犯人未被监禁
  const criminalWinners = checkCriminalWin(state, imprisonedPlayers);
  if (criminalWinners.length > 0) {
    results.winners = criminalWinners;
    results.winnerFaction = Faction.CRIMINAL;
    return results;
  }
  
  // 优先级4: 学生阵营 - 调和成功且犯人被监禁
  if (harmonySuccess) {
    const studentWinners = checkStudentWin(state, imprisonedPlayers);
    if (studentWinners.length > 0) {
      results.winners = studentWinners;
      results.winnerFaction = Faction.STUDENT;
      return results;
    }
  }
  
  // 无人获胜(平局)
  results.winners = [];
  results.winnerFaction = null;
  
  return results;
}

/**
 * 检查宇宙人是否获胜
 */
function checkAlienWin(state: GameState, imprisonedPlayers: string[]): string[] {
  return state.players
    .filter(player => 
      player.identityCard?.faction === Faction.ALIEN && 
      imprisonedPlayers.includes(player.id)
    )
    .map(player => player.id);
}

/**
 * 检查感染者是否获胜
 */
function checkInfectedWin(state: GameState): string[] {
  return state.players
    .filter(player => player.identityCard?.faction === Faction.INFECTED)
    .map(player => player.id);
}

/**
 * 检查归宅部是否获胜
 */
function checkGoHomeWin(state: GameState, imprisonedPlayers: string[]): string[] {
  return state.players
    .filter(player => 
      player.identityCard?.faction === Faction.GO_HOME && 
      !imprisonedPlayers.includes(player.id)
    )
    .map(player => player.id);
}

/**
 * 检查犯人/共犯是否获胜
 */
function checkCriminalWin(state: GameState, imprisonedPlayers: string[]): string[] {
  // 找到犯人
  const criminalPlayer = state.players.find(
    player => player.identityCard?.faction === Faction.CRIMINAL
  );
  
  if (!criminalPlayer) {
    return [];
  }
  
  // 犯人未被监禁,犯人和共犯获胜
  if (!imprisonedPlayers.includes(criminalPlayer.id)) {
    return state.players
      .filter(player => 
        player.identityCard?.faction === Faction.CRIMINAL || 
        player.identityCard?.faction === Faction.ACCOMPLICE
      )
      .map(player => player.id);
  }
  
  return [];
}

/**
 * 检查学生阵营是否获胜
 */
function checkStudentWin(state: GameState, imprisonedPlayers: string[]): string[] {
  // 找到犯人
  const criminalPlayer = state.players.find(
    player => player.identityCard?.faction === Faction.CRIMINAL
  );
  
  if (!criminalPlayer) {
    return [];
  }
  
  // 犯人被监禁,所有学生阵营获胜
  if (imprisonedPlayers.includes(criminalPlayer.id)) {
    return state.players
      .filter(player => player.identityCard?.faction === Faction.STUDENT)
      .map(player => player.id);
  }
  
  return [];
}

/**
 * 获取阵营名称
 */
export function getFactionName(faction: Faction | null): string {
  switch (faction) {
    case Faction.STUDENT:
      return '学生阵营';
    case Faction.CRIMINAL:
      return '犯人阵营';
    case Faction.ACCOMPLICE:
      return '共犯';
    case Faction.ALIEN:
      return '宇宙人';
    case Faction.INFECTED:
      return '感染者';
    case Faction.GO_HOME:
      return '归宅部';
    default:
      return '未知';
  }
}

/**
 * 获取结果描述
 */
export function getResultDescription(results: GameResults): string {
  if (results.winners.length === 0) {
    return '平局!无人获胜。';
  }
  
  const factionName = getFactionName(results.winnerFaction);
  const harmonyText = results.harmonySuccess ? '调和成功' : '调和失败';
  const imprisonedText = results.imprisonedPlayers.length > 0 
    ? `被监禁的玩家: ${results.imprisonedPlayers.join(', ')}` 
    : '无人被监禁';
  
  return `${factionName}获胜!\n${harmonyText}\n${imprisonedText}`;
}
