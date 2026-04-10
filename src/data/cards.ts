import type { Card } from '../types/game';
import { SkillType, Faction } from '../types/game';

// 完整卡牌数据库
export const ALL_CARDS: Omit<Card, 'id'>[] = [
  // 外星人 (1张) - 优先级1
  {
    name: '外星人',
    strength: -1,
    skill: '持有期间，可装作犯人',
    skillType: SkillType.NONE,
    winCondition: '被监禁即可获胜',
    faction: Faction.ALIEN,
    count: 1
  },
  // 感染者 (1张) - 优先级2
  {
    name: '感染者',
    strength: 0,
    skill: '下回合可夺走 1 张调和位置的牌',
    skillType: SkillType.INFECT_HARMONIZE,
    winCondition: '调和失败即可获胜',
    faction: Faction.INFECTED,
    count: 1
  },
  // 犯人 (1张) - 优先级3
  {
    name: '犯人',
    strength: 0,
    skill: '不能使用',
    skillType: SkillType.NONE,
    winCondition: '不被监禁',
    faction: Faction.CRIMINAL,
    count: 1
  },
  // 共犯 (1张) - 优先级3
  {
    name: '共犯',
    strength: 0,
    skill: '移动 1 张质疑位置的牌',
    skillType: SkillType.MOVE_ACCUSE_CARD,
    winCondition: '犯人未被监禁',
    faction: Faction.ACCOMPLICE,
    count: 1
  },
  // 学生会长 (1张) - 优先级4
  {
    name: '学生会长',
    strength: 3,
    skill: '作为起始玩家',
    skillType: SkillType.NONE,
    winCondition: '调和成功',
    faction: Faction.STUDENT,
    count: 1
  },
  // 班长 (2张) - 优先级4
  {
    name: '班长',
    strength: 2,
    skill: '和 1 名玩家互换 1 张手牌',
    skillType: SkillType.SWAP_ONE_CARD,
    winCondition: '调和成功',
    faction: Faction.STUDENT,
    count: 2
  },
  // 优等生 (2张) - 优先级4
  {
    name: '优等生',
    strength: 2,
    skill: '可以知道犯人在哪',
    skillType: SkillType.VIEW_IDENTITY,
    winCondition: '调和成功',
    faction: Faction.STUDENT,
    count: 2
  },
  // 风纪委员 (2张) - 优先级4
  {
    name: '风纪委员',
    strength: 1,
    skill: '可以查看某人的全部手牌',
    skillType: SkillType.VIEW_ALL_CARDS,
    winCondition: '调和成功',
    faction: Faction.STUDENT,
    count: 2
  },
  // 保健委员 (2张) - 优先级4
  {
    name: '保健委员',
    strength: 1,
    skill: '可以夺走 1 张已使用的牌',
    skillType: SkillType.TAKE_USED_CARD,
    winCondition: '调和成功',
    faction: Faction.STUDENT,
    count: 2
  },
  // 图书委员 (3张) - 优先级4
  {
    name: '图书委员',
    strength: 1,
    skill: '可以查看调和位置的牌',
    skillType: SkillType.VIEW_HARMONY,
    winCondition: '调和成功',
    faction: Faction.STUDENT,
    count: 3
  },
  // 大小姐 (3张) - 优先级4
  {
    name: '大小姐',
    strength: 1,
    skill: '夺走他人 1 张手牌并返还 1 张',
    skillType: SkillType.SWAP_ONE_CARD,
    winCondition: '调和成功',
    faction: Faction.STUDENT,
    count: 3
  },
  // 新闻部 (3张) - 优先级4
  {
    name: '新闻部',
    strength: 1,
    skill: '所有人将 1 张手牌传给左边玩家',
    skillType: SkillType.PASS_CARD_LEFT,
    winCondition: '调和成功',
    faction: Faction.STUDENT,
    count: 3
  },
  // 归宅部 (3张) - 优先级5
  {
    name: '归宅部',
    strength: 0,
    skill: '1 张手牌交换 1 张调和位置的牌',
    skillType: SkillType.FLEXIBLE_PLACE,
    winCondition: '无任何人胜利',
    faction: Faction.GO_HOME,
    count: 3
  }
];

// 3人局需要移除的卡牌名称
const CARDS_TO_REMOVE_3_PLAYERS = [
  '共犯',
  '优等生',
  '风纪委员',
  '图书委员',
  '大小姐',
  '新闻部',
  '归宅部'
];

// 4人或6人局需要移除的卡牌名称 (目前未使用，保留注释)

/**
 * 根据玩家数量获取卡牌列表
 * @param playerCount 玩家数量
 * @returns 卡牌列表
 */
export function getCardsForPlayerCount(playerCount: number): Omit<Card, 'id'>[] {
  let cards = [...ALL_CARDS];

  if (playerCount === 3) {
    // 3人局:去掉共犯、优等生、风纪委员、图书委员、大小姐、新闻部、归宅部各1张
    cards = cards.filter(card => {
      if (CARDS_TO_REMOVE_3_PLAYERS.includes(card.name)) {
        // 只移除1张
        const index = cards.indexOf(card);
        return cards.filter((c, i) => i < index && CARDS_TO_REMOVE_3_PLAYERS.includes(c.name)).length < card.count - 1;
      }
      return true;
    });
  } else if (playerCount === 4 || playerCount === 6) {
    // 4/6人局:去掉1张图书委员
    let removed = false;
    cards = cards.filter(card => {
      if (card.name === '图书委员' && !removed) {
        removed = true;
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
