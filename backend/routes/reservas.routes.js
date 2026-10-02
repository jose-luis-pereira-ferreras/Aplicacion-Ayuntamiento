import express from 'express';
import { getReservas, getReservaById, createReserva, updateReserva, deleteReserva } from '../controllers/reservas.controller.js';

const router = express.Router();

router.get('/', getReservas);
router.get('/:id', getReservaById);
router.post('/', createReserva);
router.put('/:id', updateReserva);
router.delete('/:id', deleteReserva);

export default router;

