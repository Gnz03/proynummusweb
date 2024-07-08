const express = require('express');
const app = express();
const mssql = require('mssql');
const path = require('path');

// Configurar motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Configurar Express para servir archivos estáticos desde la carpeta 'views'
app.use(express.static('views'));

// Configurar Express para servir archivos estáticos desde la carpeta 'styles' para CSS
app.use('/styles', express.static(path.join(__dirname, 'styles')));
// Middleware para analizar datos de formulario en el cuerpo de las solicitudes
app.use(express.urlencoded({ extended: true }));
// Configuración de la conexión a la base de datos
const config = {
    server: 'DESKTOP-OHQ3QLN\\SQLEXPRESS',
    database: 'BDNummus',
    options: {
        trustServerCertificate: true
    },
    user: 'admin',
    password: '1234'
};
const pool = new mssql.ConnectionPool(config);

// Crear la conexión a la base de datos
const connection = new mssql.ConnectionPool(config);
// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(express.json()); // Usar express.json() para analizar los datos JSON


// Ruta para actualizar el nivel de usuario
app.post('/actualizar-nivel', async (req, res) => {
    const { userId, nuevoNivel } = req.body;
    try {
        const result = await actualizarNivelUsuario(userId, nuevoNivel);
        res.json({ success: result });
    } catch (error) {
        console.error('Error al actualizar el nivel de usuario:', error);
        res.status(500).send('Error interno del servidor');
    }
});
// Ruta para seleccionar el nivel del usuario
app.get('/seleccionar-nivel', (req, res) => {
    const userId = obtenerUserId(); 
    res.sendFile(path.join(__dirname, 'views', 'seleccionar-nivel.html'));
});
// Ruta para budget.html
app.get('/budget', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'budget.html'));
});

// Ruta para modulo-presupuesto.html
app.get('/modulo-presupuesto', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'modulo-presupuesto.html'));
});

// Función para actualizar el nivel de usuario en la base de datos
async function actualizarNivelUsuario(userId, nuevoNivel) {
    try {
       
        const pool = await mssql.connect(config);

        const request = pool.request();
        request.input('userId', mssql.Int, userId);
        request.input('nuevoNivel', mssql.VarChar(20), nuevoNivel);
        const query = `UPDATE TB_USUARIO SET Nivel = @nuevoNivel WHERE IdUsuario = @userId`;
        const result = await request.query(query);

        console.log('Resultado de la consulta:', result);
   
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error('Error al actualizar el nivel de usuario en la base de datos:', error);
        throw error;
    }
}

// Ruta para establecer el nivel del usuario
app.post('/establecer-nivel', async (req, res) => {
    console.log(req.body); // Agrega este console.log para depurar
    const { userId, option } = req.body;

    try {
        if (option === 'basico') {
            const nuevoNivel = 'basico';
            const result = await actualizarNivelUsuario(userId, nuevoNivel);
            if (result) {
                res.redirect('/modulo-presupuesto.html');
            } else {
                res.status(500).send('Error al actualizar el nivel de usuario');
            }
        } else if (option === 'prueba') {
            res.redirect('/budget.html');
        } else {
            res.status(400).send('Opción no válida');
        }
    } catch (error) {
        console.error('Error al establecer el nivel de usuario:', error);
        res.status(500).send('Error interno del servidor');
    }
});
// Definir la ruta para el inicio de sesión
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const userId = await loginUsuario(email, password);
        if (userId) {
            res.send(userId); // Enviar ID de usuario al cliente
        } else {
            console.log('Credenciales inválidas.');
            res.status(401).send('Correo electrónico o contraseña incorrectos');
        }
    } catch (error) {
        console.error('Error al procesar inicio de sesión:', error);
        res.status(500).send('Error interno del servidor');
    }
});
// Función para autenticar un usuario
async function loginUsuario(email, password) {
    try {
        // Conectar con la base de datos
        const pool = await mssql.connect(config);

        // Ejecutar el procedimiento almacenado usp_LoginUsuario
        const request = pool.request();
        request.input('vEmailUsuario', mssql.VarChar(30), email);
        request.input('vPasswordUsuario', mssql.VarChar(20), password); // Cambiar a VARCHAR(20) para que coincida con el tipo en tu procedimiento almacenado
        console.log('Valores enviados al procedimiento almacenado:');
        console.log('Email:', email);
        console.log('Password:', password);

        const result = await request.execute('usp_LoginUsuario');

        // Seleccionar resultados de depuración del procedimiento almacenado
        console.log('Resultado del procedimiento almacenado:', result);

        // Comprobar si se encontró un usuario válido
        if (result.recordset.length > 0 && result.recordset[0].IdUsuario !== null) {
            // Devolver información del usuario, como su ID
            return {
                userId: result.recordset[0].IdUsuario,
                userRole: result.recordset[0].RolUsuario,
                userName: result.recordset[0].NombreUsuario, 
                userLevel: result.recordset[0].NivelUsuario ,
            };
        } else {
            // Devolver null si las credenciales son inválidas
            console.log('Credenciales inválidas.');
            return null;
        }
    } catch (error) {
        // Manejar errores de conexión o consulta
        console.error('Error al iniciar sesión:', error);
        throw error;
    }
}
const port = 3000;
// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

//Pruebas


