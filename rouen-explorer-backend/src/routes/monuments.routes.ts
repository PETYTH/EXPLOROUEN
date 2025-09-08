import { Router } from 'express';
import { MonumentsController } from '../controllers/monuments.controller';

const router = Router();

router.get('/', MonumentsController.getAllMonuments);
router.get('/:id', MonumentsController.getMonumentById);
router.post('/', MonumentsController.createMonument);
router.put('/:id', MonumentsController.updateMonument);
router.delete('/:id', MonumentsController.deleteMonument);

export default router;
