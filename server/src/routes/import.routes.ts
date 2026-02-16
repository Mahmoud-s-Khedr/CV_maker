import { Router } from 'express';
import multer from 'multer';
import * as importController from '../controllers/import.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/linkedin', authenticate, upload.single('file'), importController.importLinkedInPDF);
router.post('/github', authenticate, importController.importGitHubRepos);
router.post('/linkedin-extension', authenticate, importController.importFromExtension);

export default router;
