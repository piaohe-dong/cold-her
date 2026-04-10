// 游戏阶段
export const GamePhase = {
  SETUP: 'setup', // 准备阶段
  ACTION: 'action', // 行动中
  HARMONY_CHECK: 'harmony_check', // 调和判定
  IMPRISON_CHECK: 'imprison_check', // 监禁判定
  IDENTITY_REVEAL: 'identity_reveal', // 身份结算
  GAME_OVER: 'game_over' // 游戏结束
} as const;

export type GamePhase = typeof GamePhase[keyof typeof GamePhase];

// 行动类型
export const ActionType = {
  USE_SKILL: 'use_skill', // 发动技能
  HARMONIZE: 'harmonize', // 调和尸体
  ACCUSE: 'accuse' // 质疑玩家
} as const;

export type ActionType = typeof ActionType[keyof typeof ActionType];

// 卡牌接口
export interface Card {
  id: string; // 唯一标识
  name: string; // 卡牌名称
  strength: number; // 强度值(左上角)
  skill: string; // 技能说明
  skillType: SkillType; // 技能类型
  winCondition: string; // 胜利条件
  faction: Faction; // 阵营
  count: number; // 卡牌数量
}

// 技能类型
export const SkillType = {
  NONE: 'none', // 无技能
  VIEW_ONE_CARD: 'view_one_card', // 查看1张手牌
  VIEW_ALL_CARDS: 'view_all_cards', // 查看所有手牌
  SWAP_ONE_CARD: 'swap_one_card', // 交换1张牌
  SWAP_ALL_CARDS: 'swap_all_cards', // 交换所有手牌
  BLOCK_SKILL: 'block_skill', // 禁止发动技能
  VIEW_HARMONY: 'view_harmony', // 查看调和区
  FORCE_HARMONIZE: 'force_harmonize', // 强制调和
  VIEW_IDENTITY: 'view_identity', // 查看身份牌
  SWAP_WITH_DECK: 'swap_with_deck', // 与牌库交换
  GIVE_CARD: 'give_card', // 给予卡牌
  INFECT_HARMONIZE: 'infect_harmonize', // 感染者调和
  FLEXIBLE_PLACE: 'flexible_place', // 灵活放置
  TAKE_USED_CARD: 'take_used_card', // 夺走已使用的牌
  MOVE_ACCUSE_CARD: 'move_accuse_card', // 移动质疑位置的牌
  PASS_CARD_LEFT: 'pass_card_left' // 所有人将1张手牌传给左边玩家
} as const;

export type SkillType = typeof SkillType[keyof typeof SkillType];

// 阵营
export const Faction = {
  STUDENT: 'student', // 学生阵营
  CRIMINAL: 'criminal', // 犯人
  ACCOMPLICE: 'accomplice', // 共犯
  ALIEN: 'alien', // 宇宙人
  INFECTED: 'infected', // 感染者
  GO_HOME: 'go_home' // 归宅部
} as const;

export type Faction = typeof Faction[keyof typeof Faction];

// 玩家接口
export interface Player {
  id: string; // 玩家ID
  name: string; // 玩家名称
  hand: Card[]; // 手牌
  identityCard: Card | null; // 身份牌(锁定后确定)
  accuseZone: Card[]; // 质疑区卡牌
  usedCards: Card[]; // 已使用的卡牌（发动特技后放在玩家身前）
  isLocked: boolean; // 是否已锁定身份
  isAI: boolean; // 是否是AI
  isAlive: boolean; // 是否还在游戏中(锁定后为false)
  cannotUseSkill: boolean; // 本回合能否使用技能
}

// 游戏状态接口
export interface GameState {
  phase: GamePhase; // 当前阶段
  players: Player[]; // 所有玩家
  deck: Card[]; // 牌库
  harmonyZone: Card[]; // 调和区
  currentPlayerIndex: number; // 当前玩家索引
  playerCount: number; // 玩家总数
  harmonyTarget: number; // 调和目标值
  startingPlayerIndex: number; // 起始玩家索引
  turnCount: number; // 回合数
  gameOver: boolean; // 游戏是否结束
  results: GameResults | null; // 游戏结果
}

// 游戏结果
export interface GameResults {
  harmonySuccess: boolean; // 调和是否成功
  harmonyTotal: number; // 调和总强度
  imprisonedPlayers: string[]; // 被监禁的玩家ID列表
  winners: string[]; // 获胜玩家ID列表
  winnerFaction: Faction | null; // 获胜阵营
  revealOrder: Player[]; // 揭示顺序
}

// 调和目标值映射
export const HARMONY_TARGETS: Record<number, number> = {
  3: 9,
  4: 8,
  5: 7,
  6: 6
};
