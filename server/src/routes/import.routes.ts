import { Router } from 'express';
import multer from 'multer';
import * as importController from '../controllers/import.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/linkedin', upload.single('file'), importController.importLinkedInPDF);
router.post('/github', importController.importGitHubRepos);

export default router;
