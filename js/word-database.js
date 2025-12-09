/**
 * 单词冒险岛 - 完整单词数据库
 * 基于小学英语教材分类的完整词汇库
 */

// ===== 完整单词数据库 =====
const WordDatabase = {
    // 一、人体部位
    body: [
        { word: 'body', phonetic: '/ˈbɒdi/', chinese: '身体', mnemonic: '爸递给你一个完整的身体', association: '身体健康才能快乐成长' },
        { word: 'foot', phonetic: '/fʊt/', chinese: '脚', mnemonic: '富有的脚踩在地上', association: '用脚走路探索世界' },
        { word: 'head', phonetic: '/hed/', chinese: '头', mnemonic: '黑的头在思考', association: '脑袋是智慧的宝库' },
        { word: 'face', phonetic: '/feɪs/', chinese: '脸', mnemonic: '飞快的脸蛋真好看', association: '脸上的表情传递心情' },
        { word: 'hair', phonetic: '/heə(r)/', chinese: '头发', mnemonic: '黑儿长满头发', association: '头发像黑色的瀑布' },
        { word: 'nose', phonetic: '/nəʊz/', chinese: '鼻子', mnemonic: '鼻子能闻到花香', association: '鼻子像小小的山峰' },
        { word: 'mouth', phonetic: '/maʊθ/', chinese: '嘴', mnemonic: '嘴巴张开要说英语', association: '用嘴巴品尝美食' },
        { word: 'eye', phonetic: '/aɪ/', chinese: '眼睛', mnemonic: '爱看世界的眼睛', association: '眼睛是心灵的窗户' },
        { word: 'ear', phonetic: '/ɪə(r)/', chinese: '耳朵', mnemonic: '耳听八方天下事', association: '耳朵像两片叶子' },
        { word: 'arm', phonetic: '/ɑːm/', chinese: '手臂', mnemonic: '手臂能拥抱朋友', association: '用手臂创造未来' },
        { word: 'hand', phonetic: '/hænd/', chinese: '手', mnemonic: '小小的手牵起来', association: '用双手创造奇迹' },
        { word: 'finger', phonetic: '/ˈfɪŋɡə(r)/', chinese: '手指', mnemonic: '手指灵活如飞燕', association: '手指弹奏美妙音乐' },
        { word: 'leg', phonetic: '/leɡ/', chinese: '腿', mnemonic: '腿脚有力跑得快', association: '双腿跑遍大江南' },
        { word: 'tail', phonetic: '/teɪl/', chinese: '尾巴', mnemonic: '尾巴翘起来真神气', association: '小狗摇尾巴表示开心' }
    ],

    // 二、颜色
    colours: [
        { word: 'red', phonetic: '/red/', chinese: '红', mnemonic: '红灯停绿灯行', association: '红苹果又大又甜' },
        { word: 'blue', phonetic: '/bluː/', chinese: '蓝', mnemonic: '蓝天白云真美丽', association: '蓝色的海洋无边无际' },
        { word: 'yellow', phonetic: '/ˈjeləʊ/', chinese: '黄', mnemonic: '黄黄的香蕉弯弯腰', association: '黄色的星星亮晶晶' },
        { word: 'green', phonetic: '/ɡriːn/', chinese: '绿', mnemonic: '绿色的草原真辽阔', association: '绿色代表健康环保' },
        { word: 'white', phonetic: '/waɪt/', chinese: '白', mnemonic: '白白的云朵飘呀飘', association: '白雪公主的皮肤' },
        { word: 'black', phonetic: '/blæk/', chinese: '黑', mnemonic: '黑夜给了星星舞台', association: '黑板上写满知识' },
        { word: 'pink', phonetic: '/pɪŋk/', chinese: '粉红', mnemonic: '粉红的小花真可爱', association: '粉红色的甜蜜梦想' },
        { word: 'purple', phonetic: '/ˈpɜːpl/', chinese: '紫', mnemonic: '紫色的葡萄串串甜', association: '紫罗兰花真高贵' },
        { word: 'orange', phonetic: '/ˈɒrɪndʒ/', chinese: '橙', mnemonic: '橙色的太阳暖洋洋', association: '橙汁酸甜好味道' },
        { word: 'brown', phonetic: '/braʊn/', chinese: '棕', mnemonic: '棕色的土地长庄稼', association: '棕色的巧克力甜甜' }
    ],

    // 三、学习用品
    school: [
        { word: 'pen', phonetic: '/pen/', chinese: '钢笔', mnemonic: '本笔写天下文章', association: '用钢笔写下梦想' },
        { word: 'pencil', phonetic: '/ˈpensl/', chinese: '铅笔', mnemonic: '千笔万笔不如一支好笔', association: '铅笔画出美丽世界' },
        { word: 'pencil-case', phonetic: '/ˈpenslkeɪs/', chinese: '铅笔盒', mnemonic: '铅笔盒是文具的家', association: '打开铅笔盒找知识' },
        { word: 'ruler', phonetic: '/ˈruːlə(r)/', chinese: '尺子', mnemonic: '尺子量长短', association: '用尺子画出直线' },
        { word: 'book', phonetic: '/bʊk/', chinese: '书', mnemonic: '书中自有黄金屋', association: '书本是智慧的阶梯' },
        { word: 'bag', phonetic: '/bæɡ/', chinese: '包', mnemonic: '包装知识背起来', association: '书包里装满梦想' },
        { word: 'comic', phonetic: '/ˈkɒmɪk/', chinese: '漫画书', mnemonic: '漫画里的小世界', association: '看漫画开怀大笑' },
        { word: 'post card', phonetic: '/pəʊst kɑːd/', chinese: '明信片', mnemonic: '明信片传思念', association: '寄给远方的朋友' },
        { word: 'newspaper', phonetic: '/ˈnjuːzpeɪpə(r)/', chinese: '报纸', mnemonic: '报纸知天下', association: '每天看报纸长见识' },
        { word: 'schoolbag', phonetic: '/ˈskuːlbæɡ/', chinese: '书包', mnemonic: '书包上学堂', association: '书包背起希望' },
        { word: 'eraser', phonetic: '/ɪˈreɪzə(r)/', chinese: '橡皮', mnemonic: '橡皮擦掉错误', association: '改错才能进步' },
        { word: 'crayon', phonetic: '/ˈkreɪən/', chinese: '蜡笔', mnemonic: '彩色蜡笔画彩虹', association: '用蜡笔画出童年' },
        { word: 'sharpener', phonetic: '/ˈʃɑːpənə(r)/', chinese: '卷笔刀', mnemonic: '卷笔刀让笔更锋利', association: '磨刀不误砍柴工' },
        { word: 'story-book', phonetic: '/ˈstɔːribʊk/', chinese: '故事书', mnemonic: '故事书里真奇妙', association: '睡前听故事入梦' },
        { word: 'notebook', phonetic: '/ˈnəʊtbʊk/', chinese: '笔记本', mnemonic: '笔记本记知识', association: '好记性不如烂笔头' },
        { word: 'dictionary', phonetic: '/ˈdɪkʃəneri/', chinese: '词典', mnemonic: '词典是老师', association: '查词典解疑惑' }
    ],

    // 四、动物
    animals: [
        { word: 'cat', phonetic: '/kæt/', chinese: '猫', mnemonic: '猫儿喵喵叫', association: '小猫抓老鼠本领高' },
        { word: 'dog', phonetic: '/dɒɡ/', chinese: '狗', mnemonic: '小狗汪汪叫', association: '狗狗是人类好朋友' },
        { word: 'pig', phonetic: '/pɪɡ/', chinese: '猪', mnemonic: '小猪胖乎乎', association: '小猪爱吃睡大觉' },
        { word: 'duck', phonetic: '/dʌk/', chinese: '鸭', mnemonic: '鸭子嘎嘎叫', association: '小鸭排队走' },
        { word: 'rabbit', phonetic: '/ˈræbɪt/', chinese: '兔', mnemonic: '小白兔白又白', association: '兔子爱吃胡萝卜' },
        { word: 'horse', phonetic: '/hɔːs/', chinese: '马', mnemonic: '小马哒哒跑', association: '马儿跑得快' },
        { word: 'elephant', phonetic: '/ˈelɪfənt/', chinese: '大象', mnemonic: '俺发狮子？不，是大象！', association: '大象用长长的鼻子喷水，好像在玩魔法水枪' },
        { word: 'ant', phonetic: '/ænt/', chinese: '蚂蚁', mnemonic: '小小的蚂蚁大力士', association: '蚂蚁搬家真团结' },
        { word: 'fish', phonetic: '/fɪʃ/', chinese: '鱼', mnemonic: '鱼儿水中游', association: '小鱼吐泡泡' },
        { word: 'bird', phonetic: '/bɜːd/', chinese: '鸟', mnemonic: '鸟儿天上飞', association: '小鸟枝头唱' },
        { word: 'panda', phonetic: '/ˈpændə/', chinese: '熊猫', mnemonic: '熊猫是国宝', association: '熊猫吃竹子真可爱' },
        { word: 'bear', phonetic: '/beə(r)/', chinese: '熊', mnemonic: '大熊真强壮', association: '熊喜欢吃蜂蜜' },
        { word: 'lion', phonetic: '/ˈlaɪən/', chinese: '狮子', mnemonic: '狮子是森林之王', association: '狮子吼声震山林' },
        { word: 'tiger', phonetic: '/ˈtaɪɡə(r)/', chinese: '老虎', mnemonic: '老虎屁股摸不得', association: '老虎威风凛凛' },
        { word: 'fox', phonetic: '/fɒks/', chinese: '狐狸', mnemonic: '狐狸很聪明', association: '狐狸用尾巴扫雪' }
    ],

    // 五、人物
    people: [
        { word: 'friend', phonetic: '/frend/', chinese: '朋友', mnemonic: '朋友一生一起走', association: '好朋友手拉手' },
        { word: 'boy', phonetic: '/bɔɪ/', chinese: '男孩', mnemonic: '男孩阳光开朗', association: '男孩子爱运动' },
        { word: 'girl', phonetic: '/ɡɜːl/', chinese: '女孩', mnemonic: '女孩如花美丽', association: '小女孩真可爱' },
        { word: 'mother', phonetic: '/ˈmʌðə(r)/', chinese: '母亲', mnemonic: '母亲的爱最伟大', association: '妈妈的怀抱最温暖' },
        { word: 'father', phonetic: '/ˈfɑːðə(r)/', chinese: '父亲', mnemonic: '父亲的肩膀最宽阔', association: '爸爸是家里的山' },
        { word: 'teacher', phonetic: '/ˈtiːtʃə(r)/', chinese: '教师', mnemonic: '老师是园丁', association: '老师教我们知识' },
        { word: 'student', phonetic: '/ˈstjuːdnt/', chinese: '学生', mnemonic: '学生是花朵', association: '好好学习天天向上' },
        { word: 'baby', phonetic: '/ˈbeɪbi/', chinese: '婴儿', mnemonic: '宝宝笑哈哈', association: '婴儿是天使' }
    ],

    // 六、食物饮料
    food: [
        { word: 'rice', phonetic: '/raɪs/', chinese: '米饭', mnemonic: '米饭香喷喷', association: '一碗米饭营养好' },
        { word: 'bread', phonetic: '/bred/', chinese: '面包', mnemonic: '面包软绵绵', association: '面包是早餐好选择' },
        { word: 'milk', phonetic: '/mɪlk/', chinese: '牛奶', mnemonic: '牛奶白又白', association: '喝牛奶长高高' },
        { word: 'water', phonetic: '/ˈwɔːtə(r)/', chinese: '水', mnemonic: '水是生命之源', association: '清水甘甜爽口' },
        { word: 'egg', phonetic: '/eɡ/', chinese: '蛋', mnemonic: '鸡蛋圆圆', association: '鸡蛋有营养' },
        { word: 'apple', phonetic: '/ˈæpl/', chinese: '苹果', mnemonic: '苹果红彤彤', association: '一天一苹果医生远离我' },
        { word: 'banana', phonetic: '/bəˈnænə/', chinese: '香蕉', mnemonic: '香蕉弯弯像月亮', association: '香蕉甜甜软绵绵' },
        { word: 'orange', phonetic: '/ˈɒrɪndʒ/', chinese: '橙子', mnemonic: '橙子圆圆', association: '橙子维C丰富' }
    ]
};

// ===== 按年级分类的单词 =====
const WordsByGrade = {
    // 1-2年级：基础词汇
    beginner: [
        ...WordDatabase.body.slice(0, 8),      // 人体基础部位
        ...WordDatabase.colours.slice(0, 6),     // 基本颜色
        ...WordDatabase.school.slice(0, 8),       // 基本文具
        ...WordDatabase.animals.slice(0, 8),      // 常见动物
        ...WordDatabase.people.slice(0, 6),        // 家庭成员
        ...WordDatabase.food.slice(0, 6)           // 基础食物
    ],
    
    // 3-4年级：扩展词汇
    intermediate: [
        ...WordDatabase.body.slice(8, 12),     // 更多身体部位
        ...WordDatabase.colours,                // 全部颜色
        ...WordDatabase.school,                 // 全部学习用品
        ...WordDatabase.animals.slice(8, 16),    // 更多动物
        ...WordDatabase.people,                  // 更多人物
        ...WordDatabase.food                     // 全部食物
    ],
    
    // 5-6年级：进阶词汇
    advanced: [
        // 添加更复杂的词汇
        { word: 'beautiful', phonetic: '/ˈbjuːtɪfl/', chinese: '美丽的', mnemonic: '美女如花', association: '美丽的风景让人心醉' },
        { word: 'wonderful', phonetic: '/ˈwʌndəfl/', chinese: '精彩的', mnemonic: '精彩的表演', association: '精彩的人生靠自己创造' },
        { word: 'interesting', phonetic: '/ˈɪntrəstɪŋ/', chinese: '有趣的', mnemonic: '有趣的故事', association: '有趣的事情让人开心' },
        { word: 'important', phonetic: '/ɪmˈpɔːtnt/', chinese: '重要的', mnemonic: '重要的时间', association: '重要的知识要牢记' },
        { word: 'delicious', phonetic: '/dɪˈlɪʃəs/', chinese: '美味的', mnemonic: '美味的食物', association: '美味的佳肴让人回味' }
    ]
};

// ===== 岛屿单词配置 =====
const IslandWords = {
    // 奇妙生物岛 (1-2年级)
    creature_island: {
        name: '奇妙生物岛',
        description: '学习基础动物、颜色、身体部位等单词',
        words: WordsByGrade.beginner,
        difficulty: 'beginner',
        grade: [1, 2],
        color: '#4CAF50'
    },
    
    // 能量火山岛 (3-4年级)
    volcano_island: {
        name: '能量火山岛',
        description: '掌握学习用品、人物、食物等进阶单词',
        words: WordsByGrade.intermediate,
        difficulty: 'intermediate', 
        grade: [3, 4],
        color: '#FF9800'
    },
    
    // 智慧金字塔 (5-6年级)
    pyramid_island: {
        name: '智慧金字塔',
        description: '学习形容词、抽象概念等高级词汇',
        words: WordsByGrade.advanced,
        difficulty: 'advanced',
        grade: [5, 6],
        color: '#FF3B30'
    }
};

// ===== 单词挑战类型 =====
const ChallengeTypes = {
    pronunciation: {
        name: '发音挑战',
        description: '跟读单词，练习发音',
        icon: '🎤',
        difficulty: 2
    },
    spelling: {
        name: '拼写大战',
        description: '正确拼写单词，击败敌人',
        icon: '✏️',
        difficulty: 3
    },
    matching: {
        name: '单词配对',
        description: '连接单词与释义，训练记忆',
        icon: '🎯',
        difficulty: 2
    },
    sentence: {
        name: '句子构建',
        description: '用单词造句，提升应用能力',
        icon: '📝',
        difficulty: 4
    },
    speed: {
        name: '极速挑战',
        description: '限时答题，考验反应速度',
        icon: '⚡',
        difficulty: 5
    },
    master: {
        name: '综合大师',
        description: '全方位挑战，测试综合能力',
        icon: '👑',
        difficulty: 5
    }
};

// ===== 导出数据库 =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WordDatabase, WordsByGrade, IslandWords, ChallengeTypes };
} else if (typeof window !== 'undefined') {
    window.WordDatabase = WordDatabase;
    window.WordsByGrade = WordsByGrade;
    window.IslandWords = IslandWords;
    window.ChallengeTypes = ChallengeTypes;
}