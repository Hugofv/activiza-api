/**
 * Admin Modules Routes
 */

import { Router } from 'express';
import { makeInvoker } from 'awilix-express';
import { AdminModulesController } from '../../controllers/admin/modules';
import { validate } from '../../middlewares/validation.middleware';
import {
  createModuleSchema,
  updateModuleSchema,
} from '../../dtos/modules.dto';

const router = Router();
const modulesApi = makeInvoker(AdminModulesController);

router.get('/', modulesApi('index'));
router.get('/:id', modulesApi('show'));
router.post('/', validate(createModuleSchema), modulesApi('create'));
router.put('/:id', validate(updateModuleSchema), modulesApi('update'));
router.delete('/:id', modulesApi('delete'));

export default router;