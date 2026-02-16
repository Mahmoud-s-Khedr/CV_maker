import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { verifySetupSchema, disableSchema, validateSchema } from '../validation/twofa.schemas';
import * as twofaController from '../controllers/twofa.controller';

const router = Router();

// Authenticated routes (user must be logged in)
router.post('/setup', authenticate, twofaController.setup);
router.post('/verify-setup', authenticate, validate(verifySetupSchema), twofaController.verifySetup);
router.post('/disable', authenticate, validate(disableSchema), twofaController.disable);

// Public route (rate-limited, used during login)
router.post('/validate', authLimiter, validate(validateSchema), twofaController.validate);

export default router;
