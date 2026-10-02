import db from '../database.js';


// OBTENER TODAS LAS RESERVAS (GET)
export const getReservas = (req, res) => {
    try {
        // Hacemos un JOIN para que nos devuelva los nombres, no solo los IDs
        const reservas = db.prepare(`
            SELECT r.id, u.nombre as usuario_nombre, e.nombre as espacio_nombre, 
                   r.fecha, r.hora_inicio, r.hora_fin, r.estado
            FROM reservas r
            JOIN usuarios u ON r.usuario_id = u.id
            JOIN espacios e ON r.espacio_id = e.id
        `).all();
        res.json(reservas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las reservas' });
    }
};

// OBTENER UNA RESERVA POR ID (GET)
export const getReservaById = (req, res) => {
    try {
        const { id } = req.params;
        const reserva = db.prepare(`
            SELECT r.id, u.nombre as usuario_nombre, e.nombre as espacio_nombre, 
                   r.fecha, r.hora_inicio, r.hora_fin, r.estado
            FROM reservas r
            JOIN usuarios u ON r.usuario_id = u.id
            JOIN espacios e ON r.espacio_id = e.id
            WHERE r.id = ?
        `).get(id);
        
        if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
        res.json(reserva);
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// CREAR UNA RESERVA (POST)
export const createReserva = (req, res) => {
    try {
        const { usuario_id, espacio_id, fecha, hora_inicio, hora_fin } = req.body;
        
        // 1. Validación básica
        if (!usuario_id || !espacio_id || !fecha || !hora_inicio || !hora_fin) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // 2. Validamos el formato de las horas (HH:MM)
        const formatoHora = /^\d{2}:\d{2}$/;
        if (!formatoHora.test(hora_inicio) || !formatoHora.test(hora_fin)) {
            return res.status(400).json({ error: 'Las horas deben tener formato HH:MM' });
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            return res.status(400).json({ error: 'La fecha debe tener formato YYYY-MM-DD' });
        }

        // 3. Lógica de negocio: ¿Existe el usuario?
        const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(usuario_id);
        if (!usuario) return res.status(404).json({ error: 'El usuario no existe' });

        // 4. Lógica de negocio: ¿Existe el espacio y está disponible?
        const espacio = db.prepare('SELECT id, disponible FROM espacios WHERE id = ?').get(espacio_id);
        if (!espacio) return res.status(404).json({ error: 'El espacio no existe' });
        if (!espacio.disponible) return res.status(400).json({ error: 'El espacio está cerrado por mantenimiento' });

        // 5. El UNIQUE de la tabla solo impide horas de inicio idénticas,
        // así que comprobamos también el solapamiento real de intervalos.
        const solapada = db.prepare(`
            SELECT id FROM reservas
            WHERE espacio_id = ?
              AND fecha = ?
              AND estado != 'cancelada'
              AND hora_inicio < ?
              AND hora_fin > ?
        `).get(espacio_id, fecha, hora_fin, hora_inicio);

        if (solapada) {
            return res.status(409).json({ error: 'Este espacio ya está reservado en ese tramo horario' });
        }

        // 6. Crear la reserva
        const stmt = db.prepare(
            `INSERT INTO reservas (usuario_id, espacio_id, fecha, hora_inicio, hora_fin) 
             VALUES (?, ?, ?, ?, ?)`
        );
        const result = stmt.run(usuario_id, espacio_id, fecha, hora_inicio, hora_fin);
        
        const nuevaReserva = db.prepare(`SELECT * FROM reservas WHERE id = ?`).get(result.lastInsertRowid);
        res.status(201).json(nuevaReserva);

    } catch (error) {
        // 5. Gestionar error de SQLite: Doble reserva (UNIQUE constraint)
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Este espacio ya está reservado en esa fecha y hora' });
        }
        res.status(500).json({ error: 'Error al crear la reserva' });
    }
};

// ACTUALIZAR UNA RESERVA (PUT) - Normalmente para cancelar
export const updateReserva = (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body; // Normalmente solo cambiaremos el estado a 'cancelada'
        
        const reserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(id);
        if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

        const stmt = db.prepare('UPDATE reservas SET estado = ? WHERE id = ?');
        stmt.run(estado || reserva.estado, id);

        const reservaActualizada = db.prepare('SELECT * FROM reservas WHERE id = ?').get(id);
        res.json(reservaActualizada);
        
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la reserva' });
    }
};

// BORRAR UNA RESERVA (DELETE)
export const deleteReserva = (req, res) => {
    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM reservas WHERE id = ?').run(id);
        
        if (result.changes === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al borrar la reserva' });
    }
};
