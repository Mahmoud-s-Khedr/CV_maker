import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createJobSchema, updateJobSchema } from '../validation/job.schemas';
import * as jobController from '../controllers/job.controller';

const router = Router();

router.use(authenticate);

router.post('/', validate(createJobSchema), jobController.create);
router.get('/', jobController.list);
router.get('/stats', jobController.stats);
router.get('/:id', jobController.get);
router.patch('/:id', validate(updateJobSchema), jobController.update);
router.delete('/:id', jobController.remove);

export default router;
