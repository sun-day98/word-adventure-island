/**
 * 数据库连接配置
 */

const mysql = require('mysql2/promise');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

/**
 * 创建数据库连接
 * @param {Object} config 数据库配置
 * @returns {Promise<mysql.Connection>} 数据库连接
 */
async function createDatabaseConnection(config) {
  try {
    logger.info('🔌 正在连接数据库...');
    
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      charset: config.charset || 'utf8mb4',
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      multipleStatements: true
    });
    
    // 测试连接
    await connection.execute('SELECT 1');
    logger.info(`✅ 数据库连接成功: ${config.host}:${config.port}/${config.database}`);
    
    // 设置连接错误处理
    connection.on('error', (error) => {
      if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        logger.error('❌ 数据库连接丢失，尝试重新连接...');
        // 这里可以实现重连逻辑
      } else {
        logger.error('❌ 数据库错误:', error);
      }
    });
    
    return connection;
    
  } catch (error) {
    logger.error('❌ 数据库连接失败:', error);
    throw new Error(`数据库连接失败: ${error.message}`);
  }
}

/**
 * 创建数据库（如果不存在）
 * @param {Object} config 数据库配置（不包含database字段）
 * @param {string} databaseName 数据库名称
 */
async function createDatabaseIfNotExists(config, databaseName) {
  try {
    const tempConfig = { ...config };
    delete tempConfig.database;
    
    const tempConnection = await mysql.createConnection(tempConfig);
    
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` 
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    await tempConnection.end();
    
    logger.info(`✅ 数据库 '${databaseName}' 创建成功或已存在`);
    
  } catch (error) {
    logger.error(`❌ 创建数据库 '${databaseName}' 失败:`, error);
    throw error;
  }
}

/**
 * 执行SQL查询的包装函数
 * @param {mysql.Connection} connection 数据库连接
 * @param {string} sql SQL语句
 * @param {Array} params 参数
 * @returns {Promise<any>} 查询结果
 */
async function executeQuery(connection, sql, params = []) {
  try {
    const [rows, fields] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('❌ SQL查询执行失败:', error);
    logger.error('SQL:', sql);
    logger.error('参数:', params);
    throw error;
  }
}

/**
 * 执行事务
 * @param {mysql.Connection} connection 数据库连接
 * @param {Function} callback 事务回调函数
 * @returns {Promise<any>} 事务结果
 */
async function executeTransaction(connection, callback) {
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('❌ 事务执行失败，已回滚:', error);
    throw error;
  }
}

module.exports = {
  createDatabaseConnection,
  createDatabaseIfNotExists,
  executeQuery,
  executeTransaction
};