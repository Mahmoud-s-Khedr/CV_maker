import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';

const router = Router();

router.post('/analyze', aiController.analyzeResume);
router.post('/job-fit', aiController.analyzeJobFit);

export default router;
