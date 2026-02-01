import { Router } from 'express';
import * as recruiterController from '../controllers/recruiter.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public Route: View a shared resume
// Anyone with the link (shareKey) can view it.
router.get('/public/:shareKey', recruiterController.getPublicResume);

// Protected Route: Search Resumes
// Only Users with 'RECRUITER' or 'ADMIN' role can search the database.
router.get('/search', authenticate, authorize(['RECRUITER', 'ADMIN']), recruiterController.searchResumes);

export default router;
