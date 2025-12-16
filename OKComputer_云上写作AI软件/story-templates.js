/**
 * 故事模板和创作素材库
 * 为小说创作提供丰富的模板、素材和灵感
 */

class StoryTemplates {
    constructor() {
        this.templates = this.initTemplates();
        this.materials = this.initMaterials();
        this.inspirations = this.initInspirations();
        this.characterProfiles = this.initCharacterProfiles();
        this.plotElements = this.initPlotElements();
        this.settings = this.initSettings();
    }

    /**
     * 初始化故事模板
     */
    initTemplates() {
        return {
            romance: {
                name: '言情小说模板',
                templates: [
                    {
                        id: 'modern_city_love',
                        title: '现代都市爱情',
                        description: '发生在现代都市背景下的浪漫爱情故事',
                        structure: {
                            opening: '男女主角在偶然的场合相遇',
                            development: '经历误会、挑战和成长',
                            climax: '重大危机考验感情',
                            resolution: '克服困难，走到一起'
                        },
                        elements: {
                            characters: ['职场精英', '艺术家', '学生', '创业者'],
                            settings: ['繁华都市', '咖啡馆', '办公室', '海边'],
                            conflicts: ['身份差距', '第三者介入', '家庭反对', '职业冲突']
                        }
                    },
                    {
                        id: 'historical_romance',
                        title: '古代宫斗爱情',
                        description: '以古代宫廷为背景的爱情权谋故事',
                        structure: {
                            opening: '女主角入宫或与王子相遇',
                            development: '宫中明争暗斗，感情升温',
                            climax: '重大政治变故或感情危机',
                            resolution: '获得爱情与权力的平衡'
                        },
                        elements: {
                            characters: ['王子', '公主', '宫女', '太监', '大臣'],
                            settings: ['皇宫', '御花园', '冷宫', '边疆'],
                            conflicts: ['权力斗争', '宫廷阴谋', '身世之谜', '情感背叛']
                        }
                    },
                    {
                        id: 'campus_youth',
                        title: '校园青春爱情',
                        description: '发生在校园里的纯真爱情故事',
                        structure: {
                            opening: '新生入学或校园活动中的相遇',
                            development: '学习生活中的点滴互动',
                            climax: '高考、毕业等重要节点',
                            resolution: '共同面对未来'
                        },
                        elements: {
                            characters: ['学霸', '校草', '转校生', '社团成员'],
                            settings: ['教室', '图书馆', '操场', '食堂'],
                            conflicts: ['学业压力', '家庭期望', '未来选择', '误会猜疑']
                        }
                    }
                ]
            },
            fantasy: {
                name: '玄幻小说模板',
                templates: [
                    {
                        id: 'magic_world',
                        title: '魔法世界冒险',
                        description: '充满魔法和奇幻元素的冒险故事',
                        structure: {
                            opening: '平凡世界的主角发现魔法天赋',
                            development: '进入魔法世界，学习成长',
                            climax: '对抗邪恶势力，拯救世界',
                            resolution: '成为英雄，世界和平'
                        },
                        elements: {
                            characters: ['魔法师', '战士', '精灵', '矮人', '兽人'],
                            settings: ['魔法学院', '精灵森林', '龙穴', '黑暗城堡'],
                            conflicts: ['魔法禁忌', '种族战争', '邪恶势力', '内心挣扎']
                        }
                    },
                    {
                        id: 'cultivation_xianxia',
                        title: '玄幻修仙传奇',
                        description: '东方玄幻修仙题材的成长故事',
                        structure: {
                            opening: '凡人获得修仙机缘',
                            development: '经历重重考验，修为提升',
                            climax: '对抗天劫或强大敌人',
                            resolution: '飞升成仙或得道成佛'
                        },
                        elements: {
                            characters: ['修仙者', '妖魔', '神仙', '凡人', '上古神兽'],
                            settings: ['修仙门派', '妖界', '天界', '人间'],
                            conflicts: ['修仙资源争夺', '正邪大战', '天劫考验', '情劫磨难']
                        }
                    }
                ]
            },
            mystery: {
                name: '悬疑推理模板',
                templates: [
                    {
                        id: 'detective_mystery',
                        title: '侦探破案故事',
                        description: '侦探破解悬案的推理故事',
                        structure: {
                            opening: '案件发生，侦探介入调查',
                            development: '收集线索，分析推理',
                            climax: '揭露真凶，还原真相',
                            resolution: '案件告破，正义伸张'
                        },
                        elements: {
                            characters: ['侦探', '警察', '嫌疑人', '被害人', '目击者'],
                            settings: ['犯罪现场', '警察局', '审讯室', '城市街道'],
                            conflicts: ['线索缺失', '证据不足', '时间紧迫', '真凶狡猾']
                        }
                    },
                    {
                        id: 'psychological_thriller',
                        title: '心理悬疑惊悚',
                        description: '注重心理描写的悬疑故事',
                        structure: {
                            opening: '异常事件发生，心理阴影出现',
                            development: '心理状态恶化，幻觉与现实交错',
                            climax: '真相揭示，心理崩溃或重建',
                            resolution: '走出阴影，重获新生'
                        },
                        elements: {
                            characters: ['病人', '心理医生', '神秘人物', '家人'],
                            settings: ['精神病院', '老宅', '梦境', '记忆深处'],
                            conflicts: ['心理创伤', '记忆篡改', '身份迷失', '现实幻觉']
                        }
                    }
                ]
            },
            historical: {
                name: '历史小说模板',
                templates: [
                    {
                        id: 'ancient_warfare',
                        title: '古代战争史诗',
                        description: '以古代战争为背景的宏大故事',
                        structure: {
                            opening: '战乱年代，英雄崛起',
                            development: '征战沙场，建功立业',
                            climax: '决定性战役，生死存亡',
                            resolution: '战争结束，新时代来临'
                        },
                        elements: {
                            characters: ['将军', '士兵', '君王', '谋士', '平民'],
                            settings: ['战场', '军营', '皇宫', '村庄'],
                            conflicts: ['国家战争', '权力争夺', '忠诚背叛', '生死抉择']
                        }
                    }
                ]
            }
        };
    }

    /**
     * 初始化创作素材
     */
    initMaterials() {
        return {
            names: {
                male: {
                    chinese: ['李明', '王强', '张伟', '刘洋', '陈杰', '杨帆', '赵磊', '周涛', '吴昊', '郑凯'],
                    english: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles'],
                    fantasy: ['艾瑞克', '凯恩', '雷欧', '赛缪尔', '奥利弗', '维克多', '塞巴斯蒂安', '亚历山大', '克里斯托弗', '本杰明']
                },
                female: {
                    chinese: ['李娜', '王芳', '张敏', '刘静', '陈丽', '杨雪', '赵琳', '周婷', '吴秀', '郑雯'],
                    english: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'],
                    fantasy: ['艾莉娅', '塞拉菲娜', '卢娜', '奥萝拉', '伊莎贝拉', '维多利亚', '亚历珊德拉', '卡特琳娜', '伊莲娜', '索菲亚']
                }
            },
            places: {
                urban: ['摩天大楼', '购物中心', '咖啡厅', '公园', '地铁站', '大学校园', '医院', '博物馆', '图书馆', '体育馆'],
                rural: ['小村庄', '农田', '山间小屋', '溪流', '森林', '牧场', '果园', '渔村', '草原', '山谷'],
                fantasy: ['魔法塔', '龙穴', '精灵森林', '矮人矿场', '亡灵城堡', '天空之城', '海底宫殿', '时光之门', '魔法学院', '神殿'],
                historical: ['宫殿', '城楼', '书院', '茶馆', '驿站', '寺庙', '战场', '码头', '集市', '庄园']
            },
            objects: {
                modern: ['手机', '电脑', '汽车', '手表', '相机', '书籍', '钥匙', '钱包', '眼镜', '首饰'],
                ancient: ['玉佩', '古剑', '铜镜', '毛笔', '宣纸', '印章', '古琴', '茶具', '瓷器', '兵符'],
                magical: ['魔法棒', '水晶球', '魔法书', '护身符', '魔法戒指', '飞行扫帚', '隐身斗篷', '时光沙漏', '预言石', '治愈药水']
            },
            emotions: {
                positive: ['爱', '希望', '勇气', '快乐', '感动', '温暖', '兴奋', '自豪', '满足', '平静'],
                negative: ['恐惧', '愤怒', '悲伤', '绝望', '嫉妒', '羞耻', '焦虑', '孤独', '失望', '痛苦'],
                complex: ['矛盾', '挣扎', '困惑', '怀念', '期待', '紧张', '期待', '迷茫', '坚定', '矛盾']
            }
        };
    }

    /**
     * 初始化灵感素材
     */
    initInspirations() {
        return {
            writingPrompts: [
                '如果时间可以倒流，你会改变什么？',
                '描述一个你从未见过的颜色',
                '写一封给未来自己的信',
                '如果你的影子会说话，它会说什么？',
                '在一座废弃的城市里，你发现了什么？',
                '一个能听到别人心声的人会怎样生活？',
                '如果有一天醒来发现自己拥有了超能力',
                '描述一个只存在于梦境中的地方',
                '一本永远不会结束的书会写些什么？',
                '如果能和动物交流，你最想问什么？'
            ],
            storyHooks: [
                '一封神秘的信件改变了一切',
                '主角在某个平凡的日子里发现了不平凡的秘密',
                '一个看似普通的物品背后隐藏着惊天真相',
                '意外穿越到另一个时空或世界',
                '失忆后，必须重新找回自己的身份',
                '继承了一个神秘的遗产',
                '一个预言将主角卷入命运的漩涡',
                '双胞胎中一人替另一人承担了不白之冤',
                '一座孤岛上的神秘事件',
                '一个重复发生的梦暗示着什么？'
            ],
            dialogueStarters: [
                '"我一直想告诉你一个秘密..."',
                '"如果我能回到过去，我会..."',
                '"这不是意外，有人要害我！"',
                '"你相信命运吗？"',
                '"我有一个疯狂的提议..."',
                '"我们见过的，在另一个时空里"',
                '"这把钥匙能打开一扇特殊的门"',
                '"我的记忆可能不是真实的"',
                '"我们必须在日落前赶到那里"',
                '"如果我说我能预知未来呢？"'
            ]
        };
    }

    /**
     * 初始化角色档案
     */
    initCharacterProfiles() {
        return {
            archetypes: {
                hero: {
                    traits: ['勇敢', '正义感强', '有领导力', '牺牲精神', '坚韧不拔'],
                    motivations: ['拯救他人', '维护正义', '寻求真理', '保护所爱之人'],
                    flaws: ['过于自信', '鲁莽冲动', '不善表达情感', '过度承担'],
                    backstory: '通常出身平凡，通过努力和机遇成为英雄'
                },
                mentor: {
                    traits: ['智慧', '经验丰富', '耐心', '神秘', '有远见'],
                    motivations: ['传承知识', '指导后辈', '弥补过去', '保护重要事物'],
                    flaws: ['过于保守', '藏着秘密', '有时固执', '情感疏离'],
                    backstory: '有过丰富的经历，现在选择指导他人'
                },
                villain: {
                    traits: ['聪明', '有魅力', '决心坚定', '不择手段', '有说服力'],
                    motivations: ['权力', '复仇', '扭曲的正义', '控制欲', '证明自己'],
                    flaws: ['过度自负', '缺乏同情心', '偏执', '低估对手'],
                    backstory: '通常有悲惨的过去或扭曲的理想'
                },
                sidekick: {
                    traits: ['忠诚', '幽默', '勇敢', '支持主角', '独特技能'],
                    motivations: ['友谊', '正义', '归属感', '证明自己', '共同目标'],
                    flaws: ['依赖性强', '能力有限', '冲动', '缺乏自信'],
                    backstory: '被主角的品格吸引，成为忠实伙伴'
                },
                love_interest: {
                    traits: ['独立', '有魅力', '聪明', '有原则', '有勇气'],
                    motivations: ['爱情', '自我实现', '帮助他人', '寻求真相', '自由'],
                    flaws: ['固执', '过于理性', '情感封闭', '完美主义'],
                    backstory: '有自己的生活和目标，爱情只是人生的一部分'
                }
            },
            characterDetails: {
                physical: {
                    bodyTypes: ['高大健壮', '中等身材', '瘦弱精干', '丰满圆润', '肌肉发达'],
                    hairColors: ['黑色', '棕色', '金色', '红色', '银色', '白色'],
                    eyeColors: ['黑色', '棕色', '蓝色', '绿色', '灰色', '琥珀色'],
                    specialFeatures: ['疤痕', '纹身', '胎记', '特殊发色', '异色瞳', '眼镜']
                },
                personality: {
                    mbti: ['INTJ', 'INFP', 'INFJ', 'INTP', 'ENTJ', 'ENFP', 'ENFJ', 'ENTP', 'ISTJ', 'ISFP', 'ISFJ', 'ISTP', 'ESTJ', 'ESFP', 'ESFJ', 'ESTP'],
                    temperament: ['胆汁质', '多血质', '粘液质', '抑郁质'],
                    virtues: ['诚实', '善良', '勇敢', '智慧', '节制', '公正', '坚毅', '谦逊'],
                    vices: ['贪婪', '愤怒', '骄傲', '嫉妒', '懒惰', '暴食', '色欲', '欺骗']
                },
                background: {
                    socialClass: ['贵族', '中产阶级', '平民', '贫民', '无家可归'],
                    familyType: ['完整家庭', '单亲家庭', '孤儿', '寄养家庭', '与祖父母同住'],
                    education: ['未受教育', '基础教育', '高等教育', '专业训练', '自学成才'],
                    occupation: ['学生', '工人', '商人', '艺术家', '军人', '医生', '教师', '农民', '无业']
                }
            }
        };
    }

    /**
     * 初始化情节元素
     */
    initPlotElements() {
        return {
            conflicts: {
                internal: ['道德困境', '身份认同', '恐惧克服', '情感纠葛', '自我怀疑', '选择困难', '成长痛苦', '责任vs自由'],
                external: ['战争', '自然灾害', '经济危机', '社会不公', '疾病', '犯罪', '政治斗争', '种族冲突'],
                interpersonal: ['背叛', '误解', '竞争', '家族恩怨', '友情考验', '爱情三角', '权力斗争', '代际冲突']
            },
            plotDevices: {
                classic: ['契诃夫之枪', '伏笔', '闪回', '梦境', '预言', '讽刺', '象征', '隐喻'],
                modern: ['时间循环', '平行时空', '记忆操控', '虚拟现实', '基因编辑', '人工智能', '社交媒体', '网络病毒'],
                fantasy: ['魔法物品', '神秘预言', '古老诅咒', '血脉传承', '异界传送', '灵魂契约', '时间魔法', '变身能力']
            },
            twists: [
                '主角的盟友其实是敌人',
                '看似无关的事件暗藏联系',
                '主角的身份并非表面那样',
                '一直相信的真相是谎言',
                '敌人其实是想保护主角',
                '整个世界是虚拟的',
                '时间旅行者创造了现在的局面',
                '主角失去了关键记忆',
                '预言的含义完全被误解',
                '看似胜利其实是更大阴谋的开始'
            ]
        };
    }

    /**
     * 初始化场景设置
     */
    initSettings() {
        return {
            timePeriods: {
                ancient: ['远古时代', '青铜时代', '古典时期', '中世纪', '文艺复兴'],
                modern: ['工业革命', '维多利亚时代', '20世纪初', '二战时期', '冷战时期', '当代', '近未来'],
                future: ['22世纪', '23世纪', '24世纪', '遥远未来', '末日之后']
            },
            locations: {
                earth: {
                    urban: ['大都市', '小城镇', '郊区', '贫民窟', '富人区', '工业园区'],
                    rural: ['山区', '平原', '沿海', '岛屿', '森林', '沙漠', '草原', '湿地'],
                    extreme: ['北极', '南极', '高山', '深海', '火山', '荒漠', '雨林']
                },
                fictional: {
                    fantasy: ['魔法王国', '精灵国度', '龙族领地', '矮人地下城', '神界', '魔界'],
                    scifi: ['空间站', '外星殖民地', '赛博朋克城市', '废土世界', '海底基地', '火星殖民地']
                }
            },
            atmospheres: {
                positive: ['温馨', '浪漫', '希望', '激励', '宁静', '欢乐', '庄严', '神圣'],
                negative: ['阴森', '压抑', '恐怖', '绝望', '悲伤', '愤怒', '紧张', '诡异'],
                neutral: ['神秘', '悬疑', '平静', '普通', '日常', '忙碌', '混乱', '有序']
            }
        };
    }

    /**
     * 根据类型获取模板
     */
    getTemplatesByGenre(genre) {
        return this.templates[genre]?.templates || [];
    }

    /**
     * 获取特定模板
     */
    getTemplate(genre, templateId) {
        const genreTemplates = this.templates[genre]?.templates || [];
        return genreTemplates.find(t => t.id === templateId);
    }

    /**
     * 获取随机素材
     */
    getRandomMaterial(category, subcategory = null) {
        const material = this.materials[category];
        
        if (!material) return null;
        
        if (subcategory && material[subcategory]) {
            const items = material[subcategory];
            const randomIndex = Math.floor(Math.random() * items.length);
            return items[randomIndex];
        }
        
        if (Array.isArray(material)) {
            const randomIndex = Math.floor(Math.random() * material.length);
            return material[randomIndex];
        }
        
        // 如果是对象，随机选择一个子类别
        const keys = Object.keys(material);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const subItems = material[randomKey];
        const randomIndex = Math.floor(Math.random() * subItems.length);
        return subItems[randomIndex];
    }

    /**
     * 获取角色生成器
     */
    generateCharacter(archetype = null) {
        const character = {
            name: this.getRandomMaterial('names', 'male') || this.getRandomMaterial('names', 'female'),
            archetype: archetype || this.getRandomKey(this.characterProfiles.archetypes),
            physical: {
                bodyType: this.getRandomMaterial('characterDetails', 'physical')?.bodyTypes?.random(),
                hairColor: this.getRandomMaterial('characterDetails', 'physical')?.hairColors?.random(),
                eyeColor: this.getRandomMaterial('characterDetails', 'physical')?.eyeColors?.random(),
                specialFeature: this.getRandomMaterial('characterDetails', 'physical')?.specialFeatures?.random()
            },
            personality: {
                mbti: this.getRandomMaterial('characterDetails', 'personality')?.mbti?.random(),
                temperament: this.getRandomMaterial('characterDetails', 'personality')?.temperament?.random(),
                virtues: this.getRandomMaterial('characterDetails', 'personality')?.virtues?.random(),
                vices: this.getRandomMaterial('characterDetails', 'personality')?.vices?.random()
            },
            background: {
                socialClass: this.getRandomMaterial('characterDetails', 'background')?.socialClass?.random(),
                familyType: this.getRandomMaterial('characterDetails', 'background')?.familyType?.random(),
                education: this.getRandomMaterial('characterDetails', 'background')?.education?.random(),
                occupation: this.getRandomMaterial('characterDetails', 'background')?.occupation?.random()
            }
        };

        // 添加原型特质
        if (character.archetype && this.characterProfiles.archetypes[character.archetype]) {
            const archetypeData = this.characterProfiles.archetypes[character.archetype];
            character.traits = archetypeData.traits;
            character.motivations = archetypeData.motivations;
            character.flaws = archetypeData.flaws;
            character.backstory = archetypeData.backstory;
        }

        return character;
    }

    /**
     * 获取情节建议
     */
    generatePlotSuggestions(genre, complexity = 'medium') {
        const suggestions = [];
        
        // 添加冲突建议
        const conflicts = this.plotElements.conflicts;
        suggestions.push(...conflicts.internal.slice(0, 2));
        suggestions.push(...conflicts.external.slice(0, 2));
        
        // 添加情节装置
        const plotDevices = this.plotElements.plotDevices;
        if (genre === 'fantasy') {
            suggestions.push(...plotDevices.fantasy.slice(0, 2));
        } else if (genre === 'mystery') {
            suggestions.push(...plotDevices.classic.slice(0, 2));
        } else {
            suggestions.push(...plotDevices.modern.slice(0, 2));
        }
        
        // 添加转折建议
        suggestions.push(...this.plotElements.twists.slice(0, 3));
        
        return suggestions;
    }

    /**
     * 获取场景描述生成器
     */
    generateSceneSetting(genre = null, atmosphere = null) {
        const setting = {
            timePeriod: this.getRandomMaterial('timePeriods'),
            location: this.getRandomMaterial('locations'),
            atmosphere: atmosphere || this.getRandomMaterial('atmospheres'),
            description: ''
        };

        // 根据类型调整场景
        if (genre === 'fantasy') {
            setting.location = this.getRandomMaterial('locations', 'fictional')?.fantasy?.random();
        } else if (genre === 'scifi') {
            setting.location = this.getRandomMaterial('locations', 'fictional')?.scifi?.random();
        }

        // 生成描述
        setting.description = this.generateSceneDescription(setting);

        return setting;
    }

    /**
     * 生成场景描述
     */
    generateSceneDescription(setting) {
        const descriptions = {
            '魔法王国': '古老的城堡矗立在云端，魔法光芒在空中闪烁，空气中弥漫着神秘的气息',
            '赛博朋克城市': '霓虹灯光照亮了雨夜的街道，飞行汽车在高楼间穿梭，全息广告牌闪烁着诱人的信息',
            '现代都市': '高楼林立，车水马龙，人们在钢筋水泥的丛林中追逐着自己的梦想',
            '古代宫廷': '红墙黄瓦，雕梁画栋，宫廷深处隐藏着无数秘密和权谋',
            '精灵森林': '参天古树枝叶繁茂，阳光透过树叶洒下斑驳的光影，精灵们在林间轻舞'
        };

        return descriptions[setting.location] || `这是一个${setting.atmosphere}的地方，${setting.location}独特的氛围让人印象深刻`;
    }

    /**
     * 获取随机键
     */
    getRandomKey(obj) {
        const keys = Object.keys(obj);
        return keys[Math.floor(Math.random() * keys.length)];
    }

    /**
     * 搜索模板和素材
     */
    searchTemplates(keyword, category = 'all') {
        const results = [];
        
        if (category === 'all' || category === 'templates') {
            for (const [genre, genreData] of Object.entries(this.templates)) {
                for (const template of genreData.templates) {
                    if (template.title.includes(keyword) || 
                        template.description.includes(keyword) ||
                        genreData.name.includes(keyword)) {
                        results.push({
                            type: 'template',
                            genre,
                            data: template
                        });
                    }
                }
            }
        }
        
        // 可以扩展其他类别的搜索
        
        return results;
    }

    /**
     * 导出模板数据
     */
    exportTemplates(format = 'json') {
        const data = {
            templates: this.templates,
            materials: this.materials,
            inspirations: this.inspirations,
            characterProfiles: this.characterProfiles,
            plotElements: this.plotElements,
            settings: this.settings
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        }
        
        return data;
    }

    /**
     * 添加自定义模板
     */
    addCustomTemplate(genre, template) {
        if (!this.templates[genre]) {
            this.templates[genre] = {
                name: genre,
                templates: []
            };
        }
        
        this.templates[genre].templates.push({
            id: 'custom_' + Date.now(),
            ...template
        });
        
        return true;
    }

    /**
     * 验证模板完整性
     */
    validateTemplate(template) {
        const required = ['id', 'title', 'description', 'structure', 'elements'];
        const missing = required.filter(field => !template[field]);
        
        return {
            valid: missing.length === 0,
            missing
        };
    }
}

// 数组随机选择扩展
if (Array.prototype.random === undefined) {
    Array.prototype.random = function() {
        return this[Math.floor(Math.random() * this.length)];
    };
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryTemplates;
} else {
    window.StoryTemplates = StoryTemplates;
}