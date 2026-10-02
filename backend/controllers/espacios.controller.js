import db from '../database.js';

// OBTENER TODOS LOS ESPACIOS (GET)
export const getEspacios = (req, res) => {
    try {
        const espacios = db.prepare('SELECT * FROM espacios').all();
        res.json(espacios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los espacios' });
    }
};

// OBTENER UN ESPACIO POR ID (GET)
export const getEspacioById = (req, res) => {
    try {
        const { id } = req.params;
        const espacio = db.prepare('SELECT * FROM espacios WHERE id = ?').get(id);
        
        if (!espacio) {
            return res.status(404).json({ error: 'Espacio no encontrado' });
        }
        
        res.json(espacio);
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// CREAR UN ESPACIO (POST)
export const createEspacio = (req, res) => {
    try {
        const { nombre, tipo, ubicacion, capacidad_maxima, disponible } = req.body;
        
        if (!nombre || !tipo || !ubicacion || capacidad_maxima === undefined || capacidad_maxima === null || capacidad_maxima === '') {
            return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, tipo, ubicacion, capacidad_maxima)' });
        }

        // SQLite es de tipado dinámico: no valida los tipos por nosotros.
        // Comprobamos que capacidad_maxima sea un entero positivo.
        const capacidad = Number(capacidad_maxima);
        if (!Number.isInteger(capacidad) || capacidad <= 0) {
            return res.status(400).json({ error: 'capacidad_maxima debe ser un número entero mayor que 0' });
        }

        if (disponible !== undefined && disponible !== 0 && disponible !== 1) {
            return res.status(400).json({ error: 'disponible debe ser 0 o 1' });
        }

        const stmt = db.prepare(
            'INSERT INTO espacios (nombre, tipo, ubicacion, capacidad_maxima, disponible) VALUES (?, ?, ?, ?, ?)'
        );
        
        const result = stmt.run(nombre, tipo, ubicacion, capacidad, disponible ?? 1);
        
        // Devolvemos el espacio recién creado (buscándolo por el ID que nos devolvió SQLite)
        const nuevoEspacio = db.prepare('SELECT * FROM espacios WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(nuevoEspacio);
        
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el espacio' });
    }
};

// ACTUALIZAR UN ESPACIO (PUT)
export const updateEspacio = (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, tipo, ubicacion, capacidad_maxima, disponible } = req.body;
        
        // Comprobamos si existe antes de actualizar
        const espacio = db.prepare('SELECT * FROM espacios WHERE id = ?').get(id);
        if (!espacio) {
            return res.status(404).json({ error: 'Espacio no encontrado' });
        }

        // Si viene capacidad_maxima, la validamos como en el POST
        let capacidad = espacio.capacidad_maxima;
        if (capacidad_maxima !== undefined) {
            const nuevaCapacidad = Number(capacidad_maxima);
            if (!Number.isInteger(nuevaCapacidad) || nuevaCapacidad <= 0) {
                return res.status(400).json({ error: 'capacidad_maxima debe ser un número entero mayor que 0' });
            }
            capacidad = nuevaCapacidad;
        }

        if (disponible !== undefined && disponible !== 0 && disponible !== 1) {
            return res.status(400).json({ error: 'disponible debe ser 0 o 1' });
        }

        // Actualizamos usando los nuevos datos, o manteniendo los antiguos si no se enviaron
        const stmt = db.prepare(
            `UPDATE espacios 
             SET nombre = ?, tipo = ?, ubicacion = ?, capacidad_maxima = ?, disponible = ? 
             WHERE id = ?`
        );
        
        stmt.run(
            nombre || espacio.nombre, 
            tipo || espacio.tipo, 
            ubicacion || espacio.ubicacion, 
            capacidad,
            disponible !== undefined ? disponible : espacio.disponible, 
            id
        );

        const espacioActualizado = db.prepare('SELECT * FROM espacios WHERE id = ?').get(id);
        res.json(espacioActualizado);
        
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el espacio' });
    }
};

// BORRAR UN ESPACIO (DELETE)
export const deleteEspacio = (req, res) => {
    try {
        const { id } = req.params;
        
        const stmt = db.prepare('DELETE FROM espacios WHERE id = ?');
        const result = stmt.run(id);
        
        // changes indica cuántas filas fueron afectadas por la consulta
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Espacio no encontrado' });
        }
        
        // 204 No Content: Éxito, pero no devolvemos ningún cuerpo de respuesta
        res.status(204).send(); 
    } catch (error) {
        res.status(500).json({ error: 'Error al borrar el espacio' });
    }
};