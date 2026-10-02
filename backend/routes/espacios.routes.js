import express from 'express';
import { getEspacios, getEspacioById, createEspacio, updateEspacio, deleteEspacio } from '../controllers/espacios.controller.js';

const router = express.Router();

// Definimos las rutas para /api/espacios
router.get('/', getEspacios);           // Obtener todos
router.get('/:id', getEspacioById);      // Obtener uno por ID
router.post('/', createEspacio);         // Crear= uno
router.put('/:id', updateEspacio);       // Actualizar uno
router.delete('/:id', deleteEspacio);    // Borrar uno

export default router;

