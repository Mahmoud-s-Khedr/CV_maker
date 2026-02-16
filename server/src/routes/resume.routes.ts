import { Router } from 'express';
import * as resumeController from '../controllers/resume.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createResumeSchema, updateResumeSchema } from '../validation/resume.schemas';

const router = Router();

// All resume routes require authentication
router.use(authenticate);

router.post('/', validate(createResumeSchema), resumeController.createResume);
router.get('/user/me', resumeController.getUserResumes);
router.get('/:id', resumeController.getResume);
router.patch('/:id', validate(updateResumeSchema), resumeController.updateResume);
router.delete('/:id', resumeController.deleteResume);
router.post('/:id/versions', resumeController.createVersion);
router.get('/:id/versions', resumeController.getResumeVersions);

export default router;
