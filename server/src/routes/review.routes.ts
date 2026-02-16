import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { generalLimiter } from '../middleware/rateLimiter';
import { addCommentSchema } from '../validation/review.schemas';
import * as reviewController from '../controllers/review.controller';

const router = Router();

// Owner-only routes (authenticated)
router.post('/resumes/:id/review-sessions', authenticate, reviewController.createSession);
router.get('/resumes/:id/review-sessions', authenticate, reviewController.getSessions);
router.delete('/review-sessions/:sessionId', authenticate, reviewController.deleteSession);
router.patch('/resumes/:id/review-sessions/:sessionId/comments/:commentId', authenticate, reviewController.resolveComment);

// Public reviewer routes (no auth, rate-limited)
router.get('/review/:token', reviewController.getReviewSession);
router.post('/review/:token/comments', generalLimiter, validate(addCommentSchema), reviewController.addComment);

export default router;
