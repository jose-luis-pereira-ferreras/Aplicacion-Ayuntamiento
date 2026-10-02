import db from '../database.js';

// OBTENER TODOS LOS USUARIOS (GET) - ¡SIN CONTRASEÑAS!
export const getUsuarios = (req, res) => {
    try {
        // Excluimos el campo password de la consulta por seguridad
        const usuarios = db.prepare('SELECT id, nombre, email, rol FROM usuarios').all();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
};

// OBTENER UN USUARIO POR ID (GET)
export const getUsuarioById = (req, res) => {
    try {
        const { id } = req.params;
        // Excluimos el campo password de la consulta por seguridad
        const usuario = db.prepare('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?').get(id);
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
     res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

// CREAR UN USUARIO (POST)
export const createUsuario = (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;
        
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, password)' });
        }

        const stmt = db.prepare(
            'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)'
        );
        
        // Si no se especifica rol, por defecto será 'ciudadano'
        const result = stmt.run(nombre, email, password, rol || 'ciudadano');
        
        const nuevoUsuario = db.prepare('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(nuevoUsuario);
        
    } catch (error) {
        // Gestionamos el error de SQLite si el email ya existe (UNIQUE constraint)
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'El email ya está registrado en el sistema' });
        }
        res.status(500).json({ error: 'Error al crear el usuario' });
    }
};

// ACTUALIZAR UN USUARIO (PUT)
export const updateUsuario = (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, password, rol } = req.body;
        

         // Ojo: aquí sí necesitamos leer la password de la BD para poder actualizarla si nos la mandan
        const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const stmt = db.prepare(
            `UPDATE usuarios 
             SET nombre = ?, email = ?, password = ?, rol = ? 
             WHERE id = ?`
        );
        
        stmt.run(
            nombre || usuario.nombre, 
            email || usuario.email, 
            password || usuario.password, // Si no mandan pass, se queda la que tenía
            rol || usuario.rol, 
            id
        );

        // Devolvemos el usuario actualizado SIN la contraseña
        const usuarioActualizado = db.prepare('SELECT id, nombre, email, rol FROM usuarios WHERE id = ?').get(id);
        res.json(usuarioActualizado);
        
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'El email ya pertenece a otro usuario' });
        }
        res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
};

// BORRAR UN USUARIO (DELETE)
export const deleteUsuario = (req, res) => {
    try {
        const { id } = req.params;
        
        const stmt = db.prepare('DELETE FROM usuarios WHERE id = ?');
        const result = stmt.run(id);


         if (result.changes === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error al borrar el usuario' });
    }
};
