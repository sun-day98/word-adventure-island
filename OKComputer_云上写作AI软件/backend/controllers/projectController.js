/**
 * 项目控制器
 * 处理写作项目相关的操作
 */

const WritingProject = require('../models/WritingProject');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

class ProjectController {
  /**
   * 创建新项目
   */
  async createProject(req, res) {
    try {
      const userId = req.user.id;
      const { title, description, genre, category, tags, metadata } = req.body;

      if (!title || title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '项目标题不能为空'
        });
      }

      const projectData = {
        userId,
        title: title.trim(),
        description,
        genre,
        category,
        tags: tags || [],
        metadata: metadata || {}
      };

      const newProject = await WritingProject.create(projectData);

      logger.info(`用户 ${req.user.username} 创建了新项目: ${newProject.title}`);

      res.status(201).json({
        success: true,
        message: '项目创建成功',
        data: newProject
      });

    } catch (error) {
      logger.error('创建项目失败:', error);
      res.status(500).json({
        success: false,
        message: '创建项目失败，请稍后重试'
      });
    }
  }

  /**
   * 获取项目列表
   */
  async getProjects(req, res) {
    try {
      const userId = req.user.id;
      const { 
        page = 1, 
        limit = 20, 
        status, 
        genre, 
        category, 
        sortBy = 'updated_at',
        sortOrder = 'DESC'
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        genre,
        category,
        sortBy,
        sortOrder
      };

      const projects = await WritingProject.getUserProjects(userId, options);

      res.json({
        success: true,
        data: {
          projects,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: projects.length
          }
        }
      });

    } catch (error) {
      logger.error('获取项目列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取项目列表失败'
      });
    }
  }

  /**
   * 获取项目详情
   */
  async getProject(req, res) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      const project = await WritingProject.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      if (project.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权访问该项目'
        });
      }

      // 获取项目文档
      const documents = await WritingProject.getProjectDocuments(projectId);

      // 获取项目统计信息
      const stats = await WritingProject.getProjectStats(projectId);

      res.json({
        success: true,
        data: {
          project,
          documents,
          stats
        }
      });

    } catch (error) {
      logger.error('获取项目详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取项目详情失败'
      });
    }
  }

  /**
   * 更新项目
   */
  async updateProject(req, res) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const updateData = req.body;

      const project = await WritingProject.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      if (project.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权修改该项目'
        });
      }

      const updatedProject = await WritingProject.update(projectId, updateData);

      logger.info(`用户 ${req.user.username} 更新了项目: ${updatedProject.title}`);

      res.json({
        success: true,
        message: '项目更新成功',
        data: updatedProject
      });

    } catch (error) {
      logger.error('更新项目失败:', error);
      res.status(500).json({
        success: false,
        message: '更新项目失败，请稍后重试'
      });
    }
  }

  /**
   * 删除项目
   */
  async deleteProject(req, res) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      const project = await WritingProject.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      if (project.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权删除该项目'
        });
      }

      const success = await WritingProject.delete(projectId, userId);

      if (success) {
        logger.info(`用户 ${req.user.username} 删除了项目: ${project.title}`);
        res.json({
          success: true,
          message: '项目删除成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '删除项目失败'
        });
      }

    } catch (error) {
      logger.error('删除项目失败:', error);
      res.status(500).json({
        success: false,
        message: '删除项目失败，请稍后重试'
      });
    }
  }

  /**
   * 复制项目
   */
  async duplicateProject(req, res) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const { newTitle } = req.body;

      if (!newTitle || newTitle.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '新项目标题不能为空'
        });
      }

      const originalProject = await WritingProject.findById(projectId);

      if (!originalProject) {
        return res.status(404).json({
          success: false,
          message: '原项目不存在'
        });
      }

      if (originalProject.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权复制该项目'
        });
      }

      const newProject = await WritingProject.duplicate(projectId, userId, newTitle.trim());

      logger.info(`用户 ${req.user.username} 复制了项目: ${originalProject.title} -> ${newProject.title}`);

      res.status(201).json({
        success: true,
        message: '项目复制成功',
        data: newProject
      });

    } catch (error) {
      logger.error('复制项目失败:', error);
      res.status(500).json({
        success: false,
        message: '复制项目失败，请稍后重试'
      });
    }
  }

  /**
   * 获取项目文档
   */
  async getProjectDocuments(req, res) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const { contentType } = req.query;

      const project = await WritingProject.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      if (project.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权访问该项目'
        });
      }

      const documents = await WritingProject.getProjectDocuments(projectId, { contentType });

      res.json({
        success: true,
        data: documents
      });

    } catch (error) {
      logger.error('获取项目文档失败:', error);
      res.status(500).json({
        success: false,
        message: '获取项目文档失败'
      });
    }
  }

  /**
   * 创建项目文档
   */
  async createDocument(req, res) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;
      const { title, content, contentType, orderIndex, parentId } = req.body;

      const project = await WritingProject.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      if (project.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权在该项目中创建文档'
        });
      }

      if (!title || title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '文档标题不能为空'
        });
      }

      const documentData = {
        title: title.trim(),
        content,
        content_type: contentType,
        order_index: orderIndex,
        parent_id: parentId
      };

      const newDocument = await WritingProject.createDocument(projectId, documentData);

      logger.info(`用户 ${req.user.username} 在项目 ${project.title} 中创建了文档: ${newDocument.title}`);

      res.status(201).json({
        success: true,
        message: '文档创建成功',
        data: newDocument
      });

    } catch (error) {
      logger.error('创建文档失败:', error);
      res.status(500).json({
        success: false,
        message: '创建文档失败，请稍后重试'
      });
    }
  }

  /**
   * 获取文档详情
   */
  async getDocument(req, res) {
    try {
      const userId = req.user.id;
      const { documentId } = req.params;

      const document = await WritingProject.getDocumentById(documentId);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: '文档不存在'
        });
      }

      // 验证用户权限
      const project = await WritingProject.findById(document.project_id);
      if (!project || project.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权访问该文档'
        });
      }

      res.json({
        success: true,
        data: document
      });

    } catch (error) {
      logger.error('获取文档详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取文档详情失败'
      });
    }
  }

  /**
   * 更新文档
   */
  async updateDocument(req, res) {
    try {
      const userId = req.user.id;
      const { documentId } = req.params;
      const updateData = req.body;

      const document = await WritingProject.getDocumentById(documentId);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: '文档不存在'
        });
      }

      // 验证用户权限
      const project = await WritingProject.findById(document.project_id);
      if (!project || project.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权修改该文档'
        });
      }

      const updatedDocument = await WritingProject.updateDocument(documentId, updateData);

      logger.info(`用户 ${req.user.username} 更新了文档: ${updatedDocument.title}`);

      res.json({
        success: true,
        message: '文档更新成功',
        data: updatedDocument
      });

    } catch (error) {
      logger.error('更新文档失败:', error);
      res.status(500).json({
        success: false,
        message: '更新文档失败，请稍后重试'
      });
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(req, res) {
    try {
      const userId = req.user.id;
      const { documentId } = req.params;

      const document = await WritingProject.getDocumentById(documentId);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: '文档不存在'
        });
      }

      // 验证用户权限
      const project = await WritingProject.findById(document.project_id);
      if (!project || project.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权删除该文档'
        });
      }

      const success = await WritingProject.deleteDocument(documentId);

      if (success) {
        logger.info(`用户 ${req.user.username} 删除了文档: ${document.title}`);
        res.json({
          success: true,
          message: '文档删除成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '删除文档失败'
        });
      }

    } catch (error) {
      logger.error('删除文档失败:', error);
      res.status(500).json({
        success: false,
        message: '删除文档失败，请稍后重试'
      });
    }
  }

  /**
   * 获取项目统计信息
   */
  async getProjectStats(req, res) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      const project = await WritingProject.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      if (project.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权访问该项目'
        });
      }

      const stats = await WritingProject.getProjectStats(projectId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('获取项目统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取项目统计失败'
      });
    }
  }
}

module.exports = new ProjectController();