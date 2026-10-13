import express from 'express';
import cors from 'cors';
import espaciosRouter from './routes/espacios.routes.js'; 
import usuariosRouter from './routes/usuarios.routes.js';
import reservasRouter from './routes/reservas.routes.js';

// 1. Inicializamos la aplicación de Express
const app = express();

// 2. Definimos el puerto donde correrá nuestro servidor.
// Render inyecta PORT de forma automática, por eso usamos process.env.PORT.
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({
  origin: true,
  credentials: true,
}));

// 3. Middleware: Le decimos a Express que sepa entender los datos en formato JSON
app.use(express.json());

// 4. Creamos una ruta de prueba (GET) en la raíz para comprobar que funciona
app.get('/', (req, res) => {
    res.json({ 
        mensaje: '¡API de Espacios Deportivos del Ayuntamiento funcionando! 🏟️' 
    });
});

app.use('/api/reservas', reservasRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/espacios', espaciosRouter);

// 5. Arrancamos el servidor para que escuche peticiones en el puerto indicado.
// '0.0.0.0' es obligatorio para que Render pueda acceder al servicio.
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
});
