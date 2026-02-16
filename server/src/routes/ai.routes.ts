import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { authenticate, requirePremium } from '../middleware/auth.middleware';
import { aiLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { analyzeResumeSchema, analyzeJobFitSchema } from '../validation/ai.schemas';

const router = Router();

router.post('/analyze', authenticate, requirePremium, aiLimiter, validate(analyzeResumeSchema), aiController.analyzeResume);
router.post('/job-fit', authenticate, requirePremium, aiLimiter, validate(analyzeJobFitSchema), aiController.analyzeJobFit);

export default router;
