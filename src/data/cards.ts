import type { Card } from '../types/game';
import { SkillType, Faction } from '../types/game';

// 完整卡牌数据库
export const ALL_CARDS: Omit<Card, 'id'>[] = [
  // 学生会长 (1张)
  {
    name: '学生会长',
    strength: 2,
    skill: '作为起始玩家,可查看任意1名玩家的1张手牌',
    skillType: SkillType.VIEW_ONE_CARD,
    winCondition: '调和成功且犯人被监禁',
    faction: Faction.STUDENT,
    count: 1
  },
  // 风纪委员 (2张)
  {
    name: '风纪委员',
    strength: 3,
    skill: '查看任意1名玩家的所有手牌',
    skillType: SkillType.VIEW_ALL_CARDS,
    winCondition: '调和成功且犯人被监禁',
    faction: Faction.STUDENT,
    count: 2
  },
  // 图书委员 (3张)
  {
    name: '图书委员',
    strength: 1,
    skill: '从任意1名玩家手中抽1张牌,然后给其1张牌',
    skillType: SkillType.SWAP_ONE_CARD,
    winCondition: '调和成功且犯人被监禁',
    faction: Faction.STUDENT,
    count: 3
  },
  // 班长 (2张)
  {
    name: '班长',
    strength: 2,
    skill: '交换任意两名玩家的所有手牌',
    skillType: SkillType.SWAP_ALL_CARDS,
    winCondition: '调和成功且犯人被监禁',
    faction: Faction.STUDENT,
    count: 2
  },
  // 保健委员 (2张)
  {
    name: '保健委员',
    strength: 1,
    skill: '选择1名玩家,其本回合不能发动技能',
    skillType: SkillType.BLOCK_SKILL,
    winCondition: '调和成功且犯人被监禁',
    faction: Faction.STUDENT,
    count: 2
  },
  // 文艺委员 (2张)
  {
    name: '文艺委员',
    strength: 0,
    skill: '查看调和区最上方1张卡牌(背面)',
    skillType: SkillType.VIEW_HARMONY,
    winCondition: '调和成功且犯人被监禁',
    faction: Faction.STUDENT,
    count: 2
  },
  // 体育委员 (2张)
  {
    name: '体育委员',
    strength: 3,
    skill: '指定1名玩家,其必须将1张手牌作为调和牌打出',
    skillType: SkillType.FORCE_HARMONIZE,
    winCondition: '调和成功且犯人被监禁',
    faction: Faction.STUDENT,
    count: 2
  },
  // 新闻部 (2张)
  {
    name: '新闻部',
    strength: 1,
    skill: '查看任意1名玩家的最终身份牌(不可公开)',
    skillType: SkillType.VIEW_IDENTITY,
    winCondition: '调和成功且犯人被监禁',
    faction: Faction.STUDENT,
    count: 2
  },
  // 优等生 (2张)
  {
    name: '优等生',
    strength: 2,
    skill: '将自己的1张手牌与牌库顶牌交换',
    skillType: SkillType.SWAP_WITH_DECK,
    winCondition: '调和成功且犯人被监禁',
    faction: Faction.STUDENT,
    count: 2
  },
  // 普通学生 (3张)
  {
    name: '普通学生',
    strength: 0,
    skill: '无特殊技能',
    skillType: SkillType.NONE,
    winCondition: '调和成功且犯人被监禁',
    faction: Faction.STUDENT,
    count: 3
  },
  // 犯人 (1张)
  {
    name: '犯人',
    strength: 2,
    skill: '无特殊技能',
    skillType: SkillType.NONE,
    winCondition: '犯人未被监禁',
    faction: Faction.CRIMINAL,
    count: 1
  },
  // 共犯 (1张)
  {
    name: '共犯',
    strength: 1,
    skill: '可将1张手牌交给任意1名玩家',
    skillType: SkillType.GIVE_CARD,
    winCondition: '犯人未被监禁',
    faction: Faction.ACCOMPLICE,
    count: 1
  },
  // 宇宙人 (1张)
  {
    name: '宇宙人',
    strength: 2,
    skill: '可声称自己是犯人(诱导被监禁)',
    skillType: SkillType.NONE,
    winCondition: '被监禁即可获胜',
    faction: Faction.ALIEN,
    count: 1
  },
  // 感染者 (1张)
  {
    name: '感染者',
    strength: 1,
    skill: '可将1张手牌背面朝上放在调和区(降低调和值)',
    skillType: SkillType.INFECT_HARMONIZE,
    winCondition: '调和失败即可获胜',
    faction: Faction.INFECTED,
    count: 1
  },
  // 归宅部 (1张)
  {
    name: '归宅部',
    strength: 0,
    skill: '可将任意1张手牌放入调和区或质疑区',
    skillType: SkillType.FLEXIBLE_PLACE,
    winCondition: '自己未被监禁且调和失败',
    faction: Faction.GO_HOME,
    count: 1
  }
];

// 3人局需要移除的卡牌名称
const CARDS_TO_REMOVE_3_PLAYERS = [
  '共犯',
  '优等生',
  '风纪委员',
  '图书委员',
  '归宅部'
];

// 4人或6人局需要移除的卡牌名称
const CARDS_TO_REMOVE_4_6_PLAYERS = ['图书委员'];

/**
 * 根据玩家数量获取卡牌列表
 * @param playerCount 玩家数量
 * @returns 卡牌列表
 */
export function getCardsForPlayerCount(playerCount: number): Omit<Card, 'id'>[] {
  let cards = [...ALL_CARDS];

  if (playerCount === 3) {
    // 3人局:去掉共犯、优等生、风纪委员、图书委员、归宅部各1张
    cards = cards.filter(card => {
      if (CARDS_TO_REMOVE_3_PLAYERS.includes(card.name)) {
        // 只移除1张
        const index = cards.indexOf(card);
        return cards.filter((c, i) => i < index && CARDS_TO_REMOVE_3_PLAYERS.includes(c.name)).length < card.count - 1;
      }
      return true;
    });
  } else if (playerCount === 4 || playerCount === 6) {
    // 4/6人局:去掉1张图书委员会
    const removed = false;
    cards = cards.filter(card => {
      if (card.name === '图书委员' && !removed) {
        return false;
      }
      return true;
    });
  }
  // 5人局使用全部卡牌

  return cards;
}

/**
 * 生成带ID的卡牌实例
 * @param cardData 卡牌数据
 * @param index 索引
 * @returns 带ID的卡牌
 */
export function createCardInstance(cardData: Omit<Card, 'id'>, index: number): Card {
  return {
    ...cardData,
    id: `${cardData.name}_${index}`
  };
}
