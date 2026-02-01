import { Router } from 'express';
import * as templateController from '../controllers/template.controller';

const router = Router();

// Public routes (users need to see templates)
router.get('/', templateController.getTemplates);
router.get('/:id', templateController.getTemplate);

export default router;
