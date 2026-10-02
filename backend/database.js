import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';


// Conectar/Crear la base de datos local
const db = new Database('ayto_deportes.db');

// Configuraciones recomendadas para SQLite
db.pragma('journal_mode = WAL'); // Mejora el rendimiento
db.pragma('foreign_keys = ON');  // Activa la eliminación y actualización en cascada

console.log('Base de datos conectada correctamente.');

// ==========================================
// CREACIÓN DE TABLAS
// ==========================================

db.exec(`
 CREATE TABLE IF NOT EXISTS usuarios (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   nombre TEXT NOT NULL,
   email TEXT NOT NULL UNIQUE,
   password TEXT NOT NULL,
   rol TEXT DEFAULT 'ciudadano'
 )
`);

db.exec(`
 CREATE TABLE IF NOT EXISTS espacios (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   nombre TEXT NOT NULL,
   tipo TEXT NOT NULL,
   ubicacion TEXT NOT NULL,
   capacidad_maxima INTEGER NOT NULL,
   disponible INTEGER DEFAULT 1
 )
`);

db.exec(`
 CREATE TABLE IF NOT EXISTS reservas (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   usuario_id INTEGER NOT NULL,
   espacio_id INTEGER NOT NULL,
   fecha TEXT NOT NULL,
   hora_inicio TEXT NOT NULL,
   hora_fin TEXT NOT NULL,
   estado TEXT DEFAULT 'confirmada',
   FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
   FOREIGN KEY (espacio_id) REFERENCES espacios(id) ON DELETE CASCADE
 )
`);

// Evita dos reservas confirmadas del mismo espacio en la misma fecha y hora de inicio.
// El índice es PARCIAL: solo cubre las filas con estado 'confirmada', de modo que una
// reserva cancelada libera el hueco y se puede volver a reservar.
//
// Antes esto era un UNIQUE (espacio_id, fecha, hora_inicio) en la propia tabla. Ese
// UNIQUE no miraba el estado, así que una reserva cancelada bloqueaba el horario para
// siempre. Para cambiarlo hay que recrear la tabla, porque el UNIQUE anterior quedó
// como sqlite_autoindex y no se puede eliminar con DROP INDEX.
const necesitaMigrarReservas = db.prepare(`
  SELECT COUNT(*) AS n FROM pragma_index_list('reservas')
  WHERE origin = 'u'
`).get().n > 0;

if (necesitaMigrarReservas) {
  console.log('Migrando tabla reservas: sustituyendo el UNIQUE por un índice parcial...');

  const fkActivas = db.pragma('foreign_keys');
  db.pragma('foreign_keys = OFF');

  db.exec(`
    CREATE TABLE reservas_migrada (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      espacio_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      hora_inicio TEXT NOT NULL,
      hora_fin TEXT NOT NULL,
      estado TEXT DEFAULT 'confirmada',
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (espacio_id) REFERENCES espacios(id) ON DELETE CASCADE
    );

    INSERT INTO reservas_migrada (id, usuario_id, espacio_id, fecha, hora_inicio, hora_fin, estado)
      SELECT id, usuario_id, espacio_id, fecha, hora_inicio, hora_fin, estado FROM reservas;

    DROP TABLE reservas;

    ALTER TABLE reservas_migrada RENAME TO reservas;
  `);

  db.pragma(`foreign_keys = ${fkActivas ? 'ON' : 'OFF'}`);
}

db.exec(`
 CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_no_duplicadas
  ON reservas (espacio_id, fecha, hora_inicio)
  WHERE estado != 'cancelada'
`);

// ==========================================
// DATOS DE EJEMPLO (Seed)
// ==========================================
// Comprobamos si la tabla usuarios está vacía para insertar datos iniciales
const checkUsers = db.prepare('SELECT COUNT(*) AS count FROM usuarios').get();

if (checkUsers.count === 0) {
 console.log('Insertando datos de ejemplo...');

 // Insertamos usuarios
 const insertUser = db.prepare('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)');
 insertUser.run('Ana García', 'ana@email.com', await bcrypt.hash('1234', 10), 'ciudadano');
 insertUser.run('Carlos López', 'carlos@email.com', await bcrypt.hash('1234', 10), 'ciudadano');
 insertUser.run('Admin Ayto', 'admin@ayto.com', await bcrypt.hash('admin123', 10), 'admin');

 // Insertamos espacios
 const insertEspacio = db.prepare('INSERT INTO espacios (nombre, tipo, ubicacion, capacidad_maxima, disponible) VALUES (?, ?, ?, ?, ?)');
 const piscinaId = insertEspacio.run('Piscina Municipal', 'Piscina', 'C/ Agua 1', 50, 1).lastInsertRowid;
 const padelId = insertEspacio.run('Pista Pádel Central', 'Pádel', 'Polideportivo Norte', 4, 1).lastInsertRowid;
 insertEspacio.run('Gimnasio Cubierto', 'Gimnasio', 'Av. Deporte 5', 30, 0); // No disponible

 // Insertamos una reserva de ejemplo (Ana reserva la piscina)
 const insertReserva = db.prepare('INSERT INTO reservas (usuario_id, espacio_id, fecha, hora_inicio, hora_fin, estado) VALUES (?, ?, ?, ?, ?, ?)');
 insertReserva.run(1, piscinaId, '2024-10-15', '10:00', '11:00', 'confirmada');
 insertReserva.run(2, padelId, '2024-10-15', '18:00', '19:30', 'confirmada');
}

// Exportamos la conexión para usarla en otros archivos

export default db;