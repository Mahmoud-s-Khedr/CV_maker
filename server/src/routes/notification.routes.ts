import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { notificationPrefsSchema } from '../validation/notification.schemas';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);
router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', validate(notificationPrefsSchema), notificationController.updatePreferences);

export default router;
