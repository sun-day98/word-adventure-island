-- AI写作软件数据库初始化脚本
-- 创建数据库和所有必要的表结构

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `display_name` VARCHAR(100) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `role` ENUM('user', 'premium', 'admin') DEFAULT 'user',
  `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  `settings` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` TIMESTAMP NULL,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 写作项目表
CREATE TABLE IF NOT EXISTS `writing_projects` (
  `id` VARCHAR(50) PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `genre` VARCHAR(50) DEFAULT NULL,
  `category` ENUM('novel', 'article', 'blog', 'script', 'poem', 'other') DEFAULT 'novel',
  `status` ENUM('draft', 'in_progress', 'completed', 'published', 'archived') DEFAULT 'draft',
  `cover_image` VARCHAR(500) DEFAULT NULL,
  `tags` JSON DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `word_count` INT DEFAULT 0,
  `char_count` INT DEFAULT 0,
  `reading_time` INT DEFAULT 0,
  `is_public` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_genre (genre),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 文档内容表
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `content` LONGTEXT DEFAULT NULL,
  `content_type` ENUM('chapter', 'section', 'note', 'outline', 'draft') DEFAULT 'chapter',
  `order_index` INT DEFAULT 0,
  `word_count` INT DEFAULT 0,
  `char_count` INT DEFAULT 0,
  `parent_id` INT DEFAULT NULL,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES writing_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES documents(id) ON DELETE SET NULL,
  INDEX idx_project_id (project_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_order_index (order_index),
  INDEX idx_content_type (content_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI写作助手表
CREATE TABLE IF NOT EXISTS `ai_assistants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `project_id` VARCHAR(50) DEFAULT NULL,
  `assistant_type` ENUM('planning', 'writing', 'editing', 'critique', 'research') NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `configuration` JSON DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `usage_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES writing_projects(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_project_id (project_id),
  INDEX idx_assistant_type (assistant_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI生成内容记录表
CREATE TABLE IF NOT EXISTS `ai_generated_content` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `project_id` VARCHAR(50) DEFAULT NULL,
  `assistant_id` INT DEFAULT NULL,
  `content_type` ENUM('suggestion', 'outline', 'full_text', 'editing', 'critique') NOT NULL,
  `prompt` TEXT DEFAULT NULL,
  `generated_content` LONGTEXT DEFAULT NULL,
  `model_used` VARCHAR(100) DEFAULT NULL,
  `tokens_used` INT DEFAULT 0,
  `response_time` INT DEFAULT 0,
  `quality_score` DECIMAL(3,2) DEFAULT NULL,
  `user_feedback` ENUM('like', 'dislike', 'neutral') DEFAULT NULL,
  `is_used` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES writing_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assistant_id) REFERENCES ai_assistants(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_project_id (project_id),
  INDEX idx_content_type (content_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 文档模板表
CREATE TABLE IF NOT EXISTS `document_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `category` ENUM('novel', 'article', 'blog', 'script', 'poem', 'outline', 'custom') NOT NULL,
  `genre` VARCHAR(50) DEFAULT NULL,
  `content_structure` LONGTEXT DEFAULT NULL,
  `variables` JSON DEFAULT NULL,
  `is_public` BOOLEAN DEFAULT FALSE,
  `usage_count` INT DEFAULT 0,
  `rating` DECIMAL(3,2) DEFAULT 0.00,
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_genre (genre),
  INDEX idx_is_public (is_public),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户模板收藏表
CREATE TABLE IF NOT EXISTS `user_template_favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `template_id` INT NOT NULL,
  `folder_name` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES document_templates(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_template (user_id, template_id),
  INDEX idx_user_id (user_id),
  INDEX idx_template_id (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 写作统计表
CREATE TABLE IF NOT EXISTS `writing_statistics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `words_written` INT DEFAULT 0,
  `time_spent` INT DEFAULT 0, -- 分钟
  `sessions_count` INT DEFAULT 0,
  `projects_worked_on` INT DEFAULT 0,
  `ai_suggestions_used` INT DEFAULT 0,
  `avg_writing_speed` DECIMAL(8,2) DEFAULT 0.00, -- 字/分钟
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (user_id, date),
  INDEX idx_user_id (user_id),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 项目协作表
CREATE TABLE IF NOT EXISTS `project_collaborations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` VARCHAR(50) NOT NULL,
  `owner_id` INT NOT NULL,
  `collaborator_id` INT NOT NULL,
  `role` ENUM('viewer', 'editor', 'commenter') DEFAULT 'viewer',
  `permissions` JSON DEFAULT NULL,
  `status` ENUM('pending', 'accepted', 'declined', 'removed') DEFAULT 'pending',
  `invited_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` TIMESTAMP NULL,
  FOREIGN KEY (project_id) REFERENCES writing_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (collaborator_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_collaborator (project_id, collaborator_id),
  INDEX idx_project_id (project_id),
  INDEX idx_owner_id (owner_id),
  INDEX idx_collaborator_id (collaborator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评论和反馈表
CREATE TABLE IF NOT EXISTS `comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `project_id` VARCHAR(50) DEFAULT NULL,
  `document_id` INT DEFAULT NULL,
  `parent_id` INT DEFAULT NULL,
  `content` TEXT NOT NULL,
  `comment_type` ENUM('general', 'suggestion', 'critique', 'inline') DEFAULT 'general',
  `position_data` JSON DEFAULT NULL, -- 用于定位评论位置
  `is_resolved` BOOLEAN DEFAULT FALSE,
  `resolved_by` INT DEFAULT NULL,
  `resolved_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES writing_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_project_id (project_id),
  INDEX idx_document_id (document_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_comment_type (comment_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统设置表
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` LONGTEXT DEFAULT NULL,
  `setting_type` ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  `description` TEXT DEFAULT NULL,
  `is_public` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key),
  INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认的系统设置
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `description`, `is_public`) VALUES
('site_name', 'AI写作助手', 'string', '网站名称', true),
('site_description', '智能AI写作助手，帮您创作精彩内容', 'string', '网站描述', true),
('max_projects_per_user', '50', 'number', '每个用户最大项目数', false),
('max_document_size', '10000000', 'number', '单个文档最大字符数', false),
('ai_daily_limit', '100', 'number', '每日AI使用次数限制', false),
('enable_registration', 'true', 'boolean', '是否开放用户注册', true),
('maintenance_mode', 'false', 'boolean', '维护模式', true);

-- 插入默认的文档模板
INSERT INTO `document_templates` (`name`, `description`, `category`, `genre`, `content_structure`, `variables`, `is_public`, `created_by`) VALUES
('玄幻小说基础模板', '适合玄幻修仙小说的基础结构模板', 'novel', '玄幻', '{
  "outline": [
    {
      "title": "第一章：凡人觉醒",
      "content": "主角原本是普通凡人，却意外获得神秘传承或灵根，踏上了修仙之路..."
    },
    {
      "title": "第二章：初入仙途", 
      "content": "拜入仙门，开始修炼功法，结识师兄弟，初次体验修仙世界..."
    },
    {
      "title": "第三章：历练成长",
      "content": "下山历练，斩妖除魔，寻找天材地宝，实力不断突破..."
    },
    {
      "title": "第四章：巅峰对决",
      "content": "面对强大的敌人，主角突破境界，施展绝学展开惊天大战..."
    },
    {
      "title": "第五章：飞升成仙",
      "content": "渡劫成功，飞升仙界，或成为一方霸主，或继续追求更高境界..."
    }
  ]
}', '["主角", "功法", "门派", "法宝", "敌人"]', true, NULL),

('言情小说基础模板', '适合现代言情小说的基础结构模板', 'novel', '言情', '{
  "outline": [
    {
      "title": "第一章：初遇",
      "content": "男女主角在意外的情况下初次相遇，留下了深刻的第一印象..."
    },
    {
      "title": "第二章：深入了解",
      "content": "通过工作和生活的接触，两人开始相互了解，发现对方的优点..."
    },
    {
      "title": "第三章：感情升温",
      "content": "在共同经历了一些事件后，两人的感情逐渐升温，产生了心动的感觉..."
    },
    {
      "title": "第四章：波折考验",
      "content": "感情遇到挑战和考验，可能是误会、家庭反对或事业竞争..."
    },
    {
      "title": "第五章：圆满结局",
      "content": "克服了所有困难，两人最终走到一起，获得了幸福的结局..."
    }
  ]
}', '["男主角", "女主角", "相遇场景", "职业背景", "感情障碍"]', true, NULL),

('悬疑推理基础模板', '适合悬疑推理小说的基础结构模板', 'novel', '悬疑推理', '{
  "outline": [
    {
      "title": "第一章：案件发生",
      "content": "一个神秘案件发生了，引起了警方或侦探的注意..."
    },
    {
      "title": "第二章：调查开始",
      "content": "主角开始调查案件，收集线索，询问相关人士..."
    },
    {
      "title": "第三章：发现线索",
      "content": "在调查过程中发现了一些关键线索，但也遇到了阻碍和危险..."
    },
    {
      "title": "第四章：真相接近",
      "content": "通过推理和分析，真相逐渐浮出水面，但最后的谜团还未解开..."
    },
    {
      "title": "第五章：真相大白",
      "content": "所有谜团解开，真凶现身，案件最终水落石出..."
    }
  ]
}', '["案件类型", "侦探角色", "受害者", "嫌疑人", "作案手法"]', true, NULL);

-- 创建视图：用户项目统计
CREATE OR REPLACE VIEW `user_project_stats` AS
SELECT 
  u.id as user_id,
  u.username,
  COUNT(wp.id) as total_projects,
  SUM(wp.word_count) as total_words,
  SUM(CASE WHEN wp.status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
  SUM(CASE WHEN wp.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_projects,
  AVG(wp.word_count) as avg_project_words,
  MAX(wp.updated_at) as last_project_update
FROM users u
LEFT JOIN writing_projects wp ON u.id = wp.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.username;

-- 创建视图：AI使用统计
CREATE OR REPLACE VIEW `ai_usage_stats` AS
SELECT 
  u.id as user_id,
  u.username,
  COUNT(agc.id) as total_ai_requests,
  SUM(agc.tokens_used) as total_tokens_used,
  AVG(agc.response_time) as avg_response_time,
  COUNT(CASE WHEN agc.user_feedback = 'like' THEN 1 END) as liked_count,
  COUNT(CASE WHEN agc.user_feedback = 'dislike' THEN 1 END) as disliked_count,
  DATE(agc.created_at) as request_date
FROM users u
LEFT JOIN ai_generated_content agc ON u.id = agc.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.username, DATE(agc.created_at);