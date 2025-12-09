// FitLife 运动健身APP - 模拟数据
const mockData = {
    // 用户数据
    user: {
        id: 1,
        name: "张小明",
        email: "zhangxiaoming@example.com",
        phone: "13800138000",
        avatar: "/assets/images/ui/avatar-placeholder.png",
        level: "中级",
        experience: 1250,
        joinDate: "2024-01-15",
        isVip: false,
        vipExpiry: null
    },

    // 身体数据记录
    bodyData: [
        {
            date: "2024-12-01",
            weight: 68.5,
            bodyFat: 18.2,
            bmi: 22.1,
            muscle: 45.3
        },
        {
            date: "2024-11-24",
            weight: 69.2,
            bodyFat: 18.8,
            bmi: 22.4,
            muscle: 44.9
        },
        {
            date: "2024-11-17",
            weight: 70.1,
            bodyFat: 19.5,
            bmi: 22.7,
            muscle: 44.2
        }
    ],

    // 健身课程数据
    courses: [
        {
            id: 1,
            title: "瑜伽基础入门",
            subtitle: "适合初学者的瑜伽课程",
            duration: 30,
            difficulty: "初级",
            calories: 120,
            image: "/assets/images/courses/yoga-basic.jpg",
            instructor: "李教练",
            rating: 4.8,
            participants: 2341,
            category: "瑜伽",
            description: "这是一节专为初学者设计的瑜伽课程，通过简单的体式练习，帮助您提高身体柔韧性和平衡能力。"
        },
        {
            id: 2,
            title: "HIIT高强度间歇训练",
            subtitle: "快速燃脂，提升心肺功能",
            duration: 45,
            difficulty: "高级",
            calories: 380,
            image: "/assets/images/courses/hiit-intense.jpg",
            instructor: "王教练",
            rating: 4.9,
            participants: 1856,
            category: "有氧",
            description: "高强度间歇训练，通过短暂的爆发性运动和休息交替，快速提升心率，达到高效燃脂效果。"
        },
        {
            id: 3,
            title: "腹肌撕裂者",
            subtitle: "强化核心，塑造完美腹肌",
            duration: 20,
            difficulty: "中级",
            calories: 180,
            image: "/assets/images/courses/hiit-intense.jpg",
            instructor: "张教练",
            rating: 4.7,
            participants: 3021,
            category: "力量",
            description: "专注核心肌群训练，通过多种腹肌动作，帮助您塑造完美的腹肌线条。"
        }
    ],

    // 食物数据库
    foodDatabase: [
        {
            id: 1,
            name: "鸡胸肉",
            category: "肉类",
            calories: 165, // 每100g
            protein: 31,
            fat: 3.6,
            carbs: 0,
            image: "/assets/images/food/chicken-breast.jpg",
            unit: "100g"
        },
        {
            id: 2,
            name: "蔬菜沙拉",
            category: "蔬菜",
            calories: 45,
            protein: 2.5,
            fat: 0.2,
            carbs: 8.5,
            image: "/assets/images/food/salad.jpg",
            unit: "100g"
        },
        {
            id: 3,
            name: "糙米饭",
            category: "主食",
            calories: 111,
            protein: 2.6,
            fat: 0.9,
            carbs: 22.8,
            image: "/assets/images/food/salad.jpg",
            unit: "100g"
        },
        {
            id: 4,
            name: "鸡蛋",
            category: "蛋类",
            calories: 155,
            protein: 13,
            fat: 11,
            carbs: 1.1,
            image: "/assets/images/food/salad.jpg",
            unit: "1个(50g)"
        }
    ],

    // 今日饮食记录
    todayDiet: {
        breakfast: [
            {
                foodId: 4,
                name: "鸡蛋",
                quantity: 2,
                calories: 310,
                protein: 26,
                fat: 22,
                carbs: 2.2
            }
        ],
        lunch: [
            {
                foodId: 1,
                name: "鸡胸肉",
                quantity: 150,
                calories: 247.5,
                protein: 46.5,
                fat: 5.4,
                carbs: 0
            },
            {
                foodId: 3,
                name: "糙米饭",
                quantity: 100,
                calories: 111,
                protein: 2.6,
                fat: 0.9,
                carbs: 22.8
            }
        ],
        dinner: [],
        snack: []
    },

    // 成就徽章
    badges: [
        {
            id: 1,
            name: "首次训练",
            description: "完成第一次健身课程",
            image: "/assets/images/badges/first-workout.svg",
            unlocked: true,
            unlockedDate: "2024-01-15"
        },
        {
            id: 2,
            name: "七日坚持",
            description: "连续7天完成训练计划",
            image: "/assets/images/badges/7-day-streak.svg",
            unlocked: true,
            unlockedDate: "2024-01-22"
        },
        {
            id: 3,
            name: "燃脂达人",
            description: "累计消耗5000卡路里",
            image: "/assets/images/badges/calorie-burner.svg",
            unlocked: false
        }
    ],

    // 运动记录
    workoutRecords: [
        {
            date: "2024-12-01",
            courseId: 1,
            courseName: "瑜伽基础入门",
            duration: 30,
            calories: 120,
            completed: true
        },
        {
            date: "2024-11-30",
            courseId: 2,
            courseName: "HIIT高强度间歇训练",
            duration: 45,
            calories: 380,
            completed: true
        }
    ],

    // 推荐饮食计划
    recommendedDiets: [
        {
            id: 1,
            name: "减脂饮食计划",
            goal: "减脂",
            duration: "4周",
            dailyCalories: 1800,
            protein: 135,
            carbs: 180,
            fat: 60,
            meals: [
                {
                    type: "早餐",
                    foods: ["燕麦粥", "鸡蛋", "牛奶"]
                },
                {
                    type: "午餐",
                    foods: ["鸡胸肉", "糙米饭", "西兰花"]
                },
                {
                    type: "晚餐",
                    foods: ["三文鱼", "红薯", "菠菜"]
                }
            ]
        },
        {
            id: 2,
            name: "增肌饮食计划",
            goal: "增肌",
            duration: "8周",
            dailyCalories: 2500,
            protein: 150,
            carbs: 250,
            fat: 83,
            meals: [
                {
                    type: "早餐",
                    foods: ["蛋白粉", "香蕉", "燕麦"]
                },
                {
                    type: "午餐",
                    foods: ["牛肉", "米饭", "蔬菜"]
                },
                {
                    type: "晚餐",
                    foods: ["鸡胸肉", "红薯", "沙拉"]
                }
            ]
        }
    ]
};

// 工具函数
const dataUtils = {
    // 获取今日总卡路里
    getTodayCalories: function() {
        let total = 0;
        Object.values(mockData.todayDiet).forEach(meal => {
            meal.forEach(item => {
                total += item.calories;
            });
        });
        return total;
    },

    // 获取今日营养素总计
    getTodayNutrition: function() {
        const totals = { calories: 0, protein: 0, fat: 0, carbs: 0 };
        Object.values(mockData.todayDiet).forEach(meal => {
            meal.forEach(item => {
                totals.calories += item.calories;
                totals.protein += item.protein;
                totals.fat += item.fat;
                totals.carbs += item.carbs;
            });
        });
        return totals;
    },

    // 搜索食物
    searchFood: function(keyword) {
        return mockData.foodDatabase.filter(food => 
            food.name.toLowerCase().includes(keyword.toLowerCase())
        );
    },

    // 获取课程推荐
    getRecommendedCourses: function(difficulty = null) {
        if (difficulty) {
            return mockData.courses.filter(course => course.difficulty === difficulty);
        }
        return mockData.courses;
    },

    // 添加饮食记录
    addDietRecord: function(mealType, foodId, quantity) {
        const food = mockData.foodDatabase.find(f => f.id === foodId);
        if (food) {
            const record = {
                foodId: food.id,
                name: food.name,
                quantity: quantity,
                calories: (food.calories * quantity / 100),
                protein: (food.protein * quantity / 100),
                fat: (food.fat * quantity / 100),
                carbs: (food.carbs * quantity / 100)
            };
            mockData.todayDiet[mealType].push(record);
            return record;
        }
        return null;
    },

    // 保存数据到本地存储
    saveToLocalStorage: function() {
        localStorage.setItem('fitlife_mockdata', JSON.stringify(mockData));
    },

    // 从本地存储加载数据
    loadFromLocalStorage: function() {
        const saved = localStorage.getItem('fitlife_mockdata');
        if (saved) {
            Object.assign(mockData, JSON.parse(saved));
        }
    }
};

// 初始化时加载数据
if (typeof window !== 'undefined') {
    dataUtils.loadFromLocalStorage();
}