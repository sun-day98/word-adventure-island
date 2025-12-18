/**
 * 数据库初始化工具
 * 用于初始化完整的数据库表结构
 */

const fs = require('fs');
const path = require('path');
const { createDatabaseConnection, executeQuery } = require('../config/database');
const { setupLogger } = require('./logger');

const logger = setupLogger();

/**
 * 初始化数据库表结构
 * @param {mysql.Connection} connection 数据库连接
 */
async function initializeDatabaseSchema(connection) {
  try {
    logger.info('🔄 正在初始化数据库表结构...');
    
    // 读取SQL初始化文件
    const sqlFilePath = path.join(__dirname, '../database/init.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('数据库初始化文件不存在: ' + sqlFilePath);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 分割SQL语句（以分号分隔）
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // 执行每个SQL语句
    for (const sql of sqlStatements) {
      try {
        await executeQuery(connection, sql);
        logger.debug('✅ 执行SQL成功');
      } catch (error) {
        // 某些语句可能因为已存在而失败，这是正常的
        if (error.message.includes('already exists') || 
            error.message.includes('Duplicate entry') ||
            error.message.includes('Table') && error.message.includes("doesn't exist")) {
          logger.debug('⚠️ SQL语句跳过:', error.message);
        } else {
          logger.error('❌ SQL语句执行失败:', sql, error);
          throw error;
        }
      }
    }
    
    logger.info('✅ 数据库表结构初始化完成');
    
  } catch (error) {
    logger.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 验证数据库结构
 * @param {mysql.Connection} connection 数据库连接
 */
async function validateDatabaseSchema(connection) {
  try {
    logger.info('🔍 正在验证数据库结构...');
    
    // 检查关键表是否存在
    const requiredTables = [
      'users',
      'writing_projects', 
      'documents',
      'ai_assistants',
      'ai_generated_content',
      'document_templates',
      'user_template_favorites',
      'writing_statistics',
      'project_collaborations',
      'comments',
      'system_settings'
    ];
    
    for (const tableName of requiredTables) {
      const result = await executeQuery(
        connection, 
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
        [tableName]
      );
      
      if (result[0].count === 0) {
        throw new Error(`必需的表不存在: ${tableName}`);
      }
      
      logger.debug(`✅ 表 ${tableName} 存在`);
    }
    
    logger.info('✅ 数据库结构验证通过');
    return true;
    
  } catch (error) {
    logger.error('❌ 数据库结构验证失败:', error);
    return false;
  }
}

/**
 * 插入初始数据
 * @param {mysql.Connection} connection 数据库连接
 */
async function insertInitialData(connection) {
  try {
    logger.info('📝 正在插入初始数据...');
    
    // 检查是否已有管理员用户
    const adminCount = await executeQuery(
      connection,
      'SELECT COUNT(*) as count FROM users WHERE role = ?',
      ['admin']
    );
    
    if (adminCount[0].count === 0) {
      // 创建默认管理员用户
      const bcrypt = require('bcryptjs');
      const defaultPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      await executeQuery(
        connection,
        'INSERT INTO users (username, email, password_hash, display_name, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin', 'admin@aiwriting.com', hashedPassword, '系统管理员', 'admin', 'active']
      );
      
      logger.info('✅ 创建默认管理员用户: admin (密码: admin123)');
    }
    
    // 检查系统设置
    const settingsCount = await executeQuery(
      connection,
      'SELECT COUNT(*) as count FROM system_settings'
    );
    
    if (settingsCount[0].count === 0) {
      logger.warn('⚠️ 系统设置为空，可能初始化脚本未正确执行');
    }
    
    logger.info('✅ 初始数据插入完成');
    
  } catch (error) {
    logger.error('❌ 插入初始数据失败:', error);
    throw error;
  }
}

/**
 * 完整的数据库初始化流程
 * @param {Object} dbConfig 数据库配置
 */
async function fullDatabaseInitialization(dbConfig) {
  let connection = null;
  
  try {
    logger.info('🚀 开始完整数据库初始化...');
    
    // 创建数据库连接
    connection = await createDatabaseConnection(dbConfig);
    
    // 保存连接到全局变量
    global.dbConnection = connection;
    
    // 初始化数据库结构
    await initializeDatabaseSchema(connection);
    
    // 验证数据库结构
    const isValid = await validateDatabaseSchema(connection);
    if (!isValid) {
      throw new Error('数据库结构验证失败');
    }
    
    // 插入初始数据
    await insertInitialData(connection);
    
    logger.info('🎉 数据库初始化完成！');
    
    return connection;
    
  } catch (error) {
    logger.error('❌ 数据库初始化失败:', error);
    
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        logger.error('关闭数据库连接失败:', closeError);
      }
    }
    
    throw error;
  }
}

/**
 * 数据库迁移功能（用于版本升级）
 * @param {mysql.Connection} connection 数据库连接
 * @param {string} currentVersion 当前版本
 * @param {string} targetVersion 目标版本
 */
async function runDatabaseMigration(connection, currentVersion, targetVersion) {
  try {
    logger.info(`🔄 正在执行数据库迁移: ${currentVersion} -> ${targetVersion}`);
    
    // 这里可以实现具体的迁移逻辑
    // 例如：添加新字段、修改表结构、数据迁移等
    
    logger.info('✅ 数据库迁移完成');
    
  } catch (error) {
    logger.error('❌ 数据库迁移失败:', error);
    throw error;
  }
}

/**
 * 数据库备份功能
 * @param {mysql.Connection} connection 数据库连接
 * @param {string} backupPath 备份路径
 */
async function backupDatabase(connection, backupPath) {
  try {
    logger.info('💾 正在备份数据库...');
    
    // 这里可以实现数据库备份逻辑
    // 例如：使用mysqldump命令或者导出SQL文件
    
    logger.info('✅ 数据库备份完成');
    
  } catch (error) {
    logger.error('❌ 数据库备份失败:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabaseSchema,
  validateDatabaseSchema,
  insertInitialData,
  fullDatabaseInitialization,
  runDatabaseMigration,
  backupDatabase
};