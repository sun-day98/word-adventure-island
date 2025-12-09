/**
 * 单词冒险岛 - 游戏数据模型
 * 包含单词库、关卡配置、角色系统等核心数据
 */

// ===== 游戏配置 =====
const GameConfig = {
    // 游戏基础配置
    version: '1.0.0',
    maxLevel: 60,
    dailyWordTarget: 10,
    reviewInterval: [1, 3, 7, 15, 30], // 艾宾浩斯遗忘曲线天数
    
    // 难度分级
    difficulty: {
        beginner: { minGrade: 1, maxGrade: 2, color: '#4CAF50' },
        intermediate: { minGrade: 3, maxGrade: 4, color: '#FF9800' },
        advanced: { minGrade: 5, maxGrade: 6, color: '#FF3B30' }
    },
    
    // 经验值配置
    expRewards: {
        wordLearn: 10,      // 学会新单词
        challengeWin: 20,   // 挑战胜利
        dailyLogin: 5,      // 每日登录
        streak: 15,         // 连续学习
        perfectGame: 50     // 完美通关
    }
};

// ===== 单词数据库 =====
const WordDatabase = {
    // 低年级单词 (1-2年级)
    beginner: [
        {
            id: 'w001',
            word: 'apple',
            chinese: '苹果',
            pronunciation: '/ˈæpl/',
            mnemonic: '俺爱跑，爱吃苹果',
           联想: '圆形的苹果像太阳一样温暖',
            grade: 1,
            category: 'fruit',
            difficulty: 'beginner',
            image: 'apple.png'
        },
        {
            id: 'w002',
            word: 'cat',
            chinese: '猫',
            pronunciation: '/kæt/',
            mnemonic: '可爱特，猫咪特别可爱',
           联想: '猫咪像老虎一样威风',
            grade: 1,
            category: 'animal',
            difficulty: 'beginner',
            image: 'cat.png'
        },
        {
            id: 'w003',
            word: 'red',
            chinese: '红色',
            pronunciation: '/red/',
            mnemonic: '热的，红色像火一样热',
           联想: '红色的苹果，红色的太阳',
            grade: 1,
            category: 'color',
            difficulty: 'beginner',
            image: 'red.png'
        },
        {
            id: 'w004',
            word: 'book',
            chinese: '书',
            pronunciation: '/bʊk/',
            mnemonic: '不可，书不可不读',
           联想: '打开书本，打开智慧之门',
            grade: 1,
            category: 'object',
            difficulty: 'beginner',
            image: 'book.png'
        },
        {
            id: 'w005',
            word: 'happy',
            chinese: '开心',
            pronunciation: '/ˈhæpi/',
            mnemonic: '嗨皮，开心得说嗨皮',
           联想: '开心时像小鸟一样飞翔',
            grade: 2,
            category: 'emotion',
            difficulty: 'beginner',
            image: 'happy.png'
        }
    ],
    
    // 中年级单词 (3-4年级)
    intermediate: [
        {
            id: 'w101',
            word: 'emphasize',
            chinese: '强调',
            pronunciation: '/ˈemfəsaɪz/',
            mnemonic: '俺发狮子，俺发狮子强调安全',
           联想: '火山口喷出的岩浆形成狮子形状，吼叫强调安全事项',
            grade: 3,
            category: 'action',
            difficulty: 'intermediate',
            image: 'emphasize.png'
        },
        {
            id: 'w102',
            word: 'discover',
            chinese: '发现',
            pronunciation: '/dɪˈskʌvər/',
            mnemonic: '迪斯科舞，发现新舞步',
           联想: '考古学家发现古代宝藏',
            grade: 3,
            category: 'action',
            difficulty: 'intermediate',
            image: 'discover.png'
        },
        {
            id: 'w103',
            word: 'adventure',
            chinese: '冒险',
            pronunciation: '/ədˈventʃər/',
            mnemonic: '俺的车辆，冒险旅行',
           联想: '勇敢的探险家踏上未知岛屿',
            grade: 4,
            category: 'concept',
            difficulty: 'intermediate',
            image: 'adventure.png'
        },
        {
            id: 'w104',
            word: 'courage',
            chinese: '勇气',
            pronunciation: '/ˈkɜːrɪdʒ/',
            mnemonic: '客睿智，有勇气的客人很睿智',
           联想: '骑士拔剑，勇气如火焰般燃烧',
            grade: 4,
            category: 'quality',
            difficulty: 'intermediate',
            image: 'courage.png'
        },
        {
            id: 'w105',
            word: 'protect',
            chinese: '保护',
            pronunciation: '/prəˈtekt/',
            mnemonic: '普瑞泰克，普遍防护泰克',
           联想: '盾牌保护城堡免受攻击',
            grade: 4,
            category: 'action',
            difficulty: 'intermediate',
            image: 'protect.png'
        }
    ],
    
    // 高年级单词 (5-6年级)
    advanced: [
        {
            id: 'w201',
            word: 'achievement',
            chinese: '成就',
            pronunciation: '/əˈtʃiːvmənt/',
            mnemonic: '阿奇v门，阿奇成就了v门',
           联想: '登山者登上山顶，获得成就奖杯',
            grade: 5,
            category: 'concept',
            difficulty: 'advanced',
            image: 'achievement.png'
        },
        {
            id: 'w202',
            word: 'knowledge',
            chinese: '知识',
            pronunciation: '/ˈnɑːlɪdʒ/',
            mnemonic: '那里知，知识就在那里',
           联想: '图书馆里满满的书籍代表知识',
            grade: 5,
            category: 'concept',
            difficulty: 'advanced',
            image: 'knowledge.png'
        },
        {
            id: 'w203',
            word: 'responsibility',
            chinese: '责任',
            pronunciation: '/rɪˌspɑːnsəˈbɪləti/',
            mnemonic: '瑞斯ponsibility，瑞斯承担责任',
           联想: '国王手握权杖，承担国家责任',
            grade: 6,
            category: 'quality',
            difficulty: 'advanced',
            image: 'responsibility.png'
        },
        {
            id: 'w204',
            word: 'imagination',
            chinese: '想象力',
            pronunciation: '/ɪˌmædʒɪˈneɪʃn/',
            mnemonic: '俺马真，俺的马真的会飞，靠想象力',
           联想: '画家的笔下出现奇幻世界',
            grade: 6,
            category: 'ability',
            difficulty: 'advanced',
            image: 'imagination.png'
        },
        {
            id: 'w205',
            word: 'determination',
            chinese: '决心',
            pronunciation: '/dɪˌtɜːrmɪˈneɪʃn/',
            mnemonic: '踢米内神，踢米的决心如神',
           联想: '运动员冲向终点线的决心',
            grade: 6,
            category: 'quality',
            difficulty: 'advanced',
            image: 'determination.png'
        }
    ]
};

// ===== 关卡配置 =====
const LevelConfig = {
    // 奇妙生物岛 (1-2年级)
    creatureIsland: {
        id: 'creature_island',
        name: '奇妙生物岛',
        description: '生活着各种可爱动物的神秘岛屿',
        grade: [1, 2],
        difficulty: 'beginner',
        unlockRequirement: null,
        color: '#4CAF50',
        background: 'creature-island-bg.jpg',
        levels: [
            {
                id: 'l001',
                name: '动物聚会',
                words: ['w001', 'w002', 'w003'],
                challenges: ['pronunciation', 'spelling', 'matching'],
                rewards: { exp: 50, coins: 20, items: ['animal_sticker'] }
            },
            {
                id: 'l002', 
                name: '水果园地',
                words: ['w001', 'w004', 'w005'],
                challenges: ['pronunciation', 'matching', 'memory'],
                rewards: { exp: 60, coins: 25, items: ['fruit_sticker'] }
            }
        ]
    },
    
    // 能量火山岛 (3-4年级)
    volcanoIsland: {
        id: 'volcano_island',
        name: '能量火山岛',
        description: '充满力量与激情的活火山岛屿',
        grade: [3, 4],
        difficulty: 'intermediate',
        unlockRequirement: { island: 'creature_island', levels: 2 },
        color: '#FF9800',
        background: 'volcano-island-bg.jpg',
        levels: [
            {
                id: 'l101',
                name: '火山爆发',
                words: ['w101', 'w102', 'w103'],
                challenges: ['spelling', 'pronunciation', 'sentence'],
                rewards: { exp: 80, coins: 35, items: ['fire_crystal'] }
            },
            {
                id: 'l102',
                name: '勇气试炼',
                words: ['w104', 'w105', 'w101'],
                challenges: ['sentence', 'pronunciation', 'defense'],
                rewards: { exp: 90, coins: 40, items: ['courage_medal'] }
            }
        ]
    },
    
    // 智慧金字塔 (5-6年级)
    pyramidIsland: {
        id: 'pyramid_island',
        name: '智慧金字塔',
        description: '古老文明留下的知识圣殿',
        grade: [5, 6],
        difficulty: 'advanced',
        unlockRequirement: { island: 'volcano_island', levels: 2 },
        color: '#FF3B30',
        background: 'pyramid-island-bg.jpg',
        levels: [
            {
                id: 'l201',
                name: '法老之谜',
                words: ['w201', 'w202', 'w203'],
                challenges: ['comprehension', 'spelling', 'composition'],
                rewards: { exp: 120, coins: 60, items: ['wisdom_gem'] }
            },
            {
                id: 'l202',
                name: '创造之门',
                words: ['w204', 'w205', 'w201'],
                challenges: ['composition', 'comprehension', 'master'],
                rewards: { exp: 150, coins: 80, items: ['creativity_crown'] }
            }
        ]
    }
};

// ===== 角色系统 =====
const Characters = {
    // 玩家主角
    player: {
        id: 'feifei',
        name: '霏霏',
        title: '勇敢的小学生',
        avatar: 'feifei-avatar.png',
        description: '一个普通但充满勇气的小学生',
        initialStats: {
            level: 1,
            exp: 0,
            health: 100,
            magic: 50,
            coins: 100
        },
        growth: {
            initialDefect: '不自信，认为"我英语不好"',
            turningPoint: '在"能量火山"首次用单词魔法成功帮助队友',
            finalState: '自信勇敢，明白"努力与勇气比天赋更重要"'
        }
    },
    
    // 引导者丘比
    quiby: {
        id: 'quiby',
        name: '丘比',
        title: '童话引导者',
        avatar: 'quiby-avatar.png',
        description: '来自童话世界的神奇玩偶，知识渊博',
        personality: '温和、智慧，有时有点教条',
        growth: {
            initialDefect: '拘泥于书本知识，有点教条',
            turningPoint: '在"动力雨林"被霏霏灵活的联想记忆法所震撼',
            finalState: '懂得学习需要创造力，变得开放包容'
        }
    },
    
    // 伙伴雷
    lei: {
        id: 'lei',
        name: '雷',
        title: '大魔法师之子',
        avatar: 'lei-avatar.png',
        description: '强大的魔法师后代，拥有天生魔法天赋',
        personality: '骄傲、直接，渴望证明自己',
        growth: {
            initialDefect: '迷信个人力量，缺乏团队意识',
            turningPoint: '在"天赋神殿"决战中，因独自行动陷入危机，被团队所救',
            finalState: '领悟合作的真谛，成为可靠的团队成员'
        }
    },
    
    // 反派邓彼
    dumby: {
        id: 'dumby',
        name: '邓彼',
        title: '遗忘魔法师',
        avatar: 'dumby-avatar.png',
        description: '邪恶的魔法师，使用遗忘迷雾统治童话世界',
        motivation: '因童年创伤而憎恨知识，想让所有人都遗忘'
    }
};

// ===== 挑战类型 =====
const ChallengeTypes = {
    pronunciation: {
        id: 'pronunciation',
        name: '发音挑战',
        description: '跟读单词，语音识别评分',
        icon: '🎤',
        duration: 60,
        scoring: {
            accuracy: 0.6,
            fluency: 0.2,
            completeness: 0.2
        }
    },
    
    spelling: {
        id: 'spelling',
        name: '拼写防御',
        description: '正确拼写单词抵御怪物进攻',
        icon: '⚔️',
        duration: 90,
        scoring: {
            accuracy: 0.8,
            speed: 0.2
        }
    },
    
    matching: {
        id: 'matching',
        name: '单词消消乐',
        description: '连接单词与释义或图片',
        icon: '🎯',
        duration: 120,
        scoring: {
            accuracy: 0.7,
            speed: 0.3
        }
    },
    
    memory: {
        id: 'memory',
        description: '记忆翻牌游戏',
        icon: '🧠',
        duration: 100,
        scoring: {
            accuracy: 0.6,
            attempts: 0.4
        }
    },
    
    sentence: {
        id: 'sentence',
        name: '句子构建',
        description: '用所学单词构建正确句子',
        icon: '📝',
        duration: 150,
        scoring: {
            grammar: 0.5,
            meaning: 0.3,
            creativity: 0.2
        }
    },
    
    defense: {
        id: 'defense',
        name: '单词塔防',
        description: '用单词力量抵御敌人入侵',
        icon: '🛡️',
        duration: 180,
        scoring: {
            strategy: 0.4,
            accuracy: 0.4,
            speed: 0.2
        }
    },
    
    comprehension: {
        id: 'comprehension',
        name: '阅读理解',
        description: '理解含有目标单词的短文',
        icon: '📖',
        duration: 200,
        scoring: {
            understanding: 0.6,
            detail: 0.2,
            inference: 0.2
        }
    },
    
    composition: {
        id: 'composition',
        name: '创意写作',
        description: '用多个单词创作小故事',
        icon: '✍️',
        duration: 300,
        scoring: {
            creativity: 0.4,
            grammar: 0.3,
            vocabulary: 0.3
        }
    },
    
    master: {
        id: 'master',
        name: '综合大师',
        description: '综合运用所有技能的终极挑战',
        icon: '👑',
        duration: 400,
        scoring: {
            comprehensive: 0.5,
            perfect: 0.3,
            creativity: 0.2
        }
    }
};

// ===== 道具系统 =====
const Items = {
    // 学习道具
    hintScroll: {
        id: 'hint_scroll',
        name: '提示卷轴',
        description: '显示单词的第一个字母',
        type: 'hint',
        effect: 'show_first_letter',
        icon: '📜'
    },
    
    timeCrystal: {
        id: 'time_crystal',
        name: '时间水晶',
        description: '延长挑战时间30秒',
        type: 'time',
        effect: 'extend_time_30',
        icon: '⏰'
    },
    
    heartPotion: {
        id: 'heart_potion',
        name: '生命药剂',
        description: '恢复一次错误机会',
        type: 'life',
        effect: 'extra_life',
        icon: '❤️'
    },
    
    // 装饰品
    animalSticker: {
        id: 'animal_sticker',
        name: '动物贴纸',
        description: '可爱的动物装饰贴纸',
        type: 'decoration',
        rarity: 'common',
        icon: '🐾'
    },
    
    fireCrystal: {
        id: 'fire_crystal',
        name: '火焰水晶',
        description: '蕴含火之力量的神秘水晶',
        type: 'decoration',
        rarity: 'rare',
        icon: '🔥'
    },
    
    wisdomGem: {
        id: 'wisdom_gem',
        name: '智慧宝石',
        description: '散发智慧光芒的珍贵宝石',
        type: 'decoration',
        rarity: 'legendary',
        icon: '💎'
    }
};

// ===== 成就系统 =====
const Achievements = {
    firstWord: {
        id: 'first_word',
        name: '初学者',
        description: '学会第一个单词',
        icon: '🌟',
        expReward: 20,
        condition: { type: 'word_count', value: 1 }
    },
    
    tenWords: {
        id: 'ten_words',
        name: '词汇新手',
        description: '学会10个单词',
        icon: '📚',
        expReward: 100,
        condition: { type: 'word_count', value: 10 }
    },
    
    perfectChallenge: {
        id: 'perfect_challenge',
        name: '完美挑战者',
        description: '完成一次完美挑战',
        icon: '🏆',
        expReward: 50,
        condition: { type: 'perfect_score', value: 1 }
    },
    
    sevenDayStreak: {
        id: 'seven_day_streak',
        name: '坚持之星',
        description: '连续学习7天',
        icon: '🔥',
        expReward: 200,
        condition: { type: 'streak', value: 7 }
    },
    
    islandExplorer: {
        id: 'island_explorer',
        name: '岛屿探险家',
        description: '解锁所有岛屿',
        icon: '🏝️',
        expReward: 500,
        condition: { type: 'island_unlock', value: 3 }
    }
};

// ===== 剧情章节 =====
const StoryChapters = {
    chapter1: {
        id: 'chapter1',
        title: '奇妙的相遇',
        setting: '现实世界 - 霏霏的房间',
       主角: '霏霏',
        supporting: ['丘比'],
        synopsis: '普通的小学生霏霏在整理旧物时，意外复活了来自童话世界的引导玩偶丘比。',
        dialogue: [
            {
                speaker: '霏霏',
                text: '这是什么？一个旧玩偶...好可爱！',
                emotion: 'curious'
            },
            {
                speaker: '丘比',
                text: '呜...终于醒了！小朋友，你能帮助我吗？',
                emotion: 'worried'
            },
            {
                speaker: '霏霏',
                text: '你会说话？！你是从哪里来的？',
                emotion: 'surprised'
            },
            {
                speaker: '丘比',
                text: '我来自童话世界，那里被邪恶魔法师邓彼用"遗忘迷雾"笼罩了...',
                emotion: 'serious'
            }
        ],
        transition: '丘比向霏霏展示了童话世界的惨状，邀请她踏上拯救之旅'
    },
    
    chapter2: {
        id: 'chapter2',
        title: '力量的觉醒',
        setting: '奇妙生物岛',
        主角: '霏霏、丘比',
        supporting: [],
        synopsis: '霏霏在丘比的引导下，第一次使用单词魔法，发现自己的潜在力量。',
        dialogue: [
            {
                speaker: '丘比',
                text: '看，那只小熊！它忘记了如何表达"开心"，我们需要教会它"happy"这个词！',
                emotion: 'teaching'
            },
            {
                speaker: '霏霏',
                text: 'Happy...嗨皮！就像开心时说"嗨！"一样！',
                emotion: 'confident'
            },
            {
                speaker: '丘比',
                text: '太棒了！你发现了记忆的秘密！这就是单词魔法的本质！',
                emotion: 'impressed'
            }
        ],
        transition: '霏霏成功帮助小熊恢复记忆，获得第一个单词魔方'
    },
    
    chapter3: {
        id: 'chapter3',
        title: '骄傲的伙伴',
        setting: '能量火山岛',
        主角: '霏霏、丘比、雷',
        supporting: [],
        synopsis: '团队遇到了大魔法师之子雷，他起初不屑与霏霏合作，但最终学会了团队精神。',
        dialogue: [
            {
                speaker: '雷',
                text: '就凭你们这些小孩也想拯救童话世界？太可笑了！',
                emotion: 'arrogant'
            },
            {
                speaker: '霏霏',
                text: '我们也许不强大，但我们有智慧和勇气！',
                emotion: 'determined'
            },
            {
                speaker: '丘比',
                text: '雷，真正的力量不是来自天赋，而是来自团结。',
                emotion: 'wise'
            }
        ],
        transition: '雷在危机中被团队所救，开始反思自己的态度'
    }
};

// 导出到全局
window.WordAdventureData = {
    GameConfig,
    WordDatabase,
    LevelConfig,
    Characters,
    ChallengeTypes,
    Items,
    Achievements,
    StoryChapters
};