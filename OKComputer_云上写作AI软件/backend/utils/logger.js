/**
 * 日志配置模块
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

/**
 * 创建日志配置
 * @returns {winston.Logger} Winston日志实例
 */
function setupLogger() {
  // 定义日志级别
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  };

  // 定义日志颜色
  const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
  };

  // 添加颜色到winston
  winston.addColors(colors);

  // 定义日志格式
  const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
  );

  // 定义传输方式
  const transports = [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // 所有日志文件
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ];

  // 创建logger实例
  const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    levels,
    format,
    transports,
    exitOnError: false
  });

  return logger;
}

/**
 * 创建API请求日志中间件
 * @param {winston.Logger} logger 日志实例
 * @returns {Function} Express中间件
 */
function createRequestLogger(logger) {
  return (req, res, next) => {
    const start = Date.now();
    
    // 记录请求开始
    logger.http(`${req.method} ${req.originalUrl} - ${req.ip}`);
    
    // 监听响应结束
    res.on('finish', () => {
      const duration = Date.now() - start;
      const message = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip}`;
      
      if (res.statusCode >= 400) {
        logger.warn(message);
      } else {
        logger.http(message);
      }
    });
    
    next();
  };
}

module.exports = {
  setupLogger,
  createRequestLogger
};