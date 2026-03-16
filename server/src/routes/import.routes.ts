import { Router } from 'express';
import multer from 'multer';
import * as importController from '../controllers/import.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { githubImportSchema, linkedInExtensionImportSchema } from '../validation/import.schemas';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

router.post('/linkedin', authenticate, upload.single('file'), importController.importLinkedInPDF);
router.post('/github', authenticate, validate(githubImportSchema), importController.importGitHubRepos);
router.post('/linkedin-extension', authenticate, validate(linkedInExtensionImportSchema), importController.importFromExtension);

export default router;
