// FitLife - 数据可视化组件
// 简单的图表绘制功能，不依赖外部库

const charts = {
    // 创建进度环
    createProgressRing: function(container, percentage, color = '#007AFF', size = 120) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = (size / 2) - 10;
        
        // 背景圆环
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#E5E5E7';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        // 进度圆环
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (2 * Math.PI * percentage / 100);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // 百分比文字
        ctx.fillStyle = '#333333';
        ctx.font = `${size / 4}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${percentage}%`, centerX, centerY);
        
        if (container) {
            container.appendChild(canvas);
        }
        
        return canvas;
    },

    // 创建柱状图
    createBarChart: function(container, data, options = {}) {
        const canvas = document.createElement('canvas');
        const width = options.width || 300;
        const height = options.height || 200;
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        const padding = 40;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);
        
        // 找出最大值
        const maxValue = Math.max(...data.map(d => d.value));
        const barWidth = chartWidth / data.length * 0.7;
        const barSpacing = chartWidth / data.length * 0.3;
        
        // 绘制坐标轴
        ctx.strokeStyle = '#E5E5E7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // 绘制柱子
        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = padding + (index * (barWidth + barSpacing)) + barSpacing / 2;
            const y = height - padding - barHeight;
            
            // 柱子
            ctx.fillStyle = item.color || '#007AFF';
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // 标签
            ctx.fillStyle = '#666666';
            ctx.font = '12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth / 2, height - padding + 20);
            
            // 数值
            ctx.fillText(item.value, x + barWidth / 2, y - 5);
        });
        
        if (container) {
            container.appendChild(canvas);
        }
        
        return canvas;
    },

    // 创建趋势图
    createLineChart: function(container, data, options = {}) {
        const canvas = document.createElement('canvas');
        const width = options.width || 300;
        const height = options.height || 200;
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        const padding = 40;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);
        
        // 找出最大值和最小值
        const values = data.map(d => d.value);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const range = maxValue - minValue || 1;
        
        // 绘制坐标轴
        ctx.strokeStyle = '#E5E5E7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // 绘制网格线
        ctx.strokeStyle = '#F0F0F0';
        ctx.setLineDash([2, 2]);
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        
        // 绘制折线
        ctx.strokeStyle = options.color || '#007AFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((item, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = height - padding - ((item.value - minValue) / range) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // 绘制数据点
        data.forEach((item, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = height - padding - ((item.value - minValue) / range) * chartHeight;
            
            ctx.fillStyle = options.color || '#007AFF';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            // 标签
            ctx.fillStyle = '#666666';
            ctx.font = '10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x, height - padding + 20);
        });
        
        if (container) {
            container.appendChild(canvas);
        }
        
        return canvas;
    },

    // 创建营养素环形图
    createNutritionChart: function(container, protein, carbs, fat, size = 120) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = (size / 2) - 10;
        const innerRadius = radius * 0.6;
        
        const total = protein + carbs + fat;
        const data = [
            { value: protein, color: '#FF6B6B', label: '蛋白质' },
            { value: carbs, color: '#4ECDC4', label: '碳水' },
            { value: fat, color: '#FFD93D', label: '脂肪' }
        ];
        
        let currentAngle = -Math.PI / 2;
        
        data.forEach(segment => {
            const angle = (segment.value / total) * 2 * Math.PI;
            
            // 绘制扇形
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + angle, currentAngle, true);
            ctx.closePath();
            ctx.fillStyle = segment.color;
            ctx.fill();
            
            currentAngle += angle;
        });
        
        // 中心文字
        ctx.fillStyle = '#333333';
        ctx.font = `${size / 6}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${total}`, centerX, centerY - 5);
        ctx.font = `${size / 10}px system-ui`;
        ctx.fillText('卡路里', centerX, centerY + 10);
        
        if (container) {
            container.appendChild(canvas);
        }
        
        return canvas;
    },

    // 创建简单的动画效果
    animateChart: function(chart, duration = 1000) {
        const start = Date.now();
        const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // 这里可以添加动画逻辑
            chart.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
};

// 初始化图表函数
const initCharts = function() {
    // 首页进度环
    const calorieProgress = document.getElementById('calorie-progress');
    if (calorieProgress) {
        const todayCalories = window.dataUtils?.getTodayCalories() || 1200;
        const targetCalories = 2000;
        const percentage = Math.min(Math.round((todayCalories / targetCalories) * 100), 100);
        charts.createProgressRing(calorieProgress, percentage, '#FF6B6B');
    }

    // 营养素图表
    const nutritionChart = document.getElementById('nutrition-chart');
    if (nutritionChart) {
        const nutrition = window.dataUtils?.getTodayNutrition() || {
            protein: 45,
            carbs: 120,
            fat: 35
        };
        charts.createNutritionChart(nutritionChart, nutrition.protein, nutrition.carbs, nutrition.fat);
    }

    // 体重趋势图
    const weightTrend = document.getElementById('weight-trend');
    if (weightTrend && window.mockData?.bodyData) {
        const weightData = window.mockData.bodyData.map(data => ({
            label: data.date.substring(5),
            value: data.weight
        }));
        charts.createLineChart(weightTrend, weightData, { color: '#007AFF' });
    }
};

// 页面加载完成后初始化图表
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initCharts);
}