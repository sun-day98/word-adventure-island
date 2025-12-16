/**
 * APIJSON自定义函数
 * 扩展APIJSON的功能，为AI写作软件提供专门的业务逻辑
 */

const { setupLogger } = require('../utils/logger');
const moment = require('moment');
const _ = require('lodash');

const logger = setupLogger();

/**
 * 注册自定义函数
 * @param {mysql.Connection} dbConnection 数据库连接
 */
async function registerCustomFunctions(dbConnection) {
  logger.info('✅ 自定义函数注册完成（简化模式）');
}

/**
 * 模拟AI内容生成
 * @param {string} genre 题材
 * @param {string} mode 模式
 * @param {string} prompt 提示
 * @param {number} maxLength 最大长度
 * @returns {string} 生成的内容
 */
async function simulateAIGeneration(genre, mode, prompt, maxLength) {
  // 模拟生成延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const templates = {
    fantasy: {
      continuation: [
        `在神秘的玄幻世界中，${prompt}突然感受到体内涌动起前所未有的力量。古老的符文开始在他周围缓缓旋转，散发着神秘而强大的气息...`,
        `${prompt}深吸一口气，体内的真气开始按照新的路线运转。这一刻，他终于突破了多年的瓶颈，修为暴涨到了一个新的境界...`,
        `就在${prompt}面临绝境之时，一道金光从天而降。那是一位神秘的高手留下的传承，蕴含着上古时期的大道法则...`
      ],
      inspiration: [
        `在遥远的玄幻大陆上，${prompt}发现了一枚神秘的玉佩。这枚玉佩竟然是上古神物的碎片，里面封印着一位大能者的残魂...`,
        `${prompt}在深山古洞中意外获得了一本古老的功法秘籍。这本功法记载着早已失传的修炼法门，足以撼动整个修仙界...`
      ]
    },
    romance: {
      continuation: [
        `${prompt}凝视着对方的眼睛，那双眸子里仿佛有星辰在闪烁。时间仿佛在这一刻静止，整个世界只剩下他们两个人...`,
        `雨滴轻轻敲打着窗棂，${prompt}终于鼓起勇气说出了那句藏在心里很久的话。空气中弥漫着甜蜜而紧张的氛围...`,
        `那天的夕阳格外美丽，${prompt}轻轻地牵起了对方的手。这一刻，所有的等待都变得值得...`
      ],
      inspiration: [
        `${prompt}在咖啡馆的一次偶然邂逅，让两个原本毫不相干的灵魂产生了奇妙的化学反应。从此，他们的故事开始了...`,
        `多年的青梅竹马，${prompt}在经历了分离和成长后重逢。时间改变了他们的容颜，却改变不了那份深藏心底的情感...`
      ]
    }
  };
  
  const modeTemplates = templates[genre]?.[mode] || templates.fantasy.continuation;
  let content = modeTemplates[Math.floor(Math.random() * modeTemplates.length)];
  
  // 截取到最大长度
  if (content.length > maxLength) {
    content = content.substring(0, maxLength) + '...';
  }
  
  return content;
}

/**
 * 评估内容质量
 * @param {string} content 内容
 * @returns {string} 质量评分
 */
function assessContentQuality(content) {
  const wordCount = content.length;
  const punctuationCount = (content.match(/[，。！？；：]/g) || []).length;
  
  let quality = '中等';
  
  if (wordCount > 300 && punctuationCount > 10) {
    quality = '优秀';
  } else if (wordCount > 150 && punctuationCount > 5) {
    quality = '良好';
  } else if (wordCount < 50 || punctuationCount < 2) {
    quality = '较差';
  }
  
  return quality;
}

/**
 * 获取题材中文名
 * @param {string} genre 题材代码
 * @returns {string} 中文名
 */
function getGenreName(genre) {
  const genreNames = {
    fantasy: '玄幻',
    romance: '言情',
    urban: '都市',
    scifi: '科幻',
    historical: '历史'
  };
  return genreNames[genre] || '其他';
}

module.exports = {
  registerCustomFunctions
};