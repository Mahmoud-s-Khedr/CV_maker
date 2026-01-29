import { Router } from 'express';
import * as resumeController from '../controllers/resume.controller';

const router = Router();

router.post('/', resumeController.createResume);
router.get('/:id', resumeController.getResume);
router.patch('/:id', resumeController.updateResume);
router.get('/user/:userId', resumeController.getUserResumes);
router.delete('/:id', resumeController.deleteResume);
router.post('/:id/versions', resumeController.createVersion);
router.get('/:id/versions', resumeController.getResumeVersions);

export default router;
