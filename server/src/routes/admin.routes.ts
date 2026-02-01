import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// Global middleware: Authenticated + Admin Role
router.use(authenticate, authorize(['ADMIN']));

router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/logs', adminController.getAuditLogs);
router.post('/templates', adminController.createTemplate);
router.delete('/templates/:id', adminController.deleteTemplate);

export default router;
