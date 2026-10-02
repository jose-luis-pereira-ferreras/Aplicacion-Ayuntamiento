import express from 'express';
import espaciosRouter from './routes/espacios.routes.js'; 
import usuariosRouter from './routes/usuarios.routes.js';
import reservasRouter from './routes/reservas.routes.js';


// 1. Inicializamos la aplicación de Express
const app = express();

// 2. Definimos el puerto donde correrá nuestro servidor
const PORT = 3000;

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



// 5. Arrancamos el servidor para que escuche peticiones en el puerto indicado
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT} todo bien jose luis`);
});