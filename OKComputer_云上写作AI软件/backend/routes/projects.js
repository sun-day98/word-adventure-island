/**
 * 项目路由
 */

const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticateToken);

// 项目相关路由
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:projectId', projectController.getProject);
router.put('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);
router.post('/:projectId/duplicate', projectController.duplicateProject);
router.get('/:projectId/stats', projectController.getProjectStats);

// 文档相关路由
router.get('/:projectId/documents', projectController.getProjectDocuments);
router.post('/:projectId/documents', projectController.createDocument);
router.get('/documents/:documentId', projectController.getDocument);
router.put('/documents/:documentId', projectController.updateDocument);
router.delete('/documents/:documentId', projectController.deleteDocument);

module.exports = router;