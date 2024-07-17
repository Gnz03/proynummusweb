const express = require('express');
const app = express();
const mssql = require('mssql');
const path = require('path');

// Configurar motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Configurar Express para servir archivos estáticos desde la carpeta 'views'
app.use(express.static('views'));

// Servir archivos estáticos desde la carpeta 'img' para imágenes
app.use('/img', express.static(path.join(__dirname, 'img')));

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
const poolPromise = mssql.connect(config);


// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(express.json()); // Usar express.json() para analizar los datos JSON


// Ruta para servir admin.html protegida por el middleware isAdmin
app.get('/admin', isAdmin, (req, res) => {
    // Aquí servirías tu página admin.html
    res.sendFile(path.join(__dirname, 'ruta/a/tu/admin.html'));
});


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
       
        const pool = await poolPromise;

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
    const { userId, option } = req.body;

    if (!userId || !option) {
        return res.status(400).send('Datos incompletos o incorrectos');
    }

    try {
        if (option === 'basico') {
            const nuevoNivel = 'basico';
           
            const result = await actualizarNivelUsuario(userId, nuevoNivel);
            if (result) {
                res.json({ success: true });
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
        const pool = await poolPromise;

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

// Ruta para registrar un nuevo usuario
app.post('/registrar', async (req, res) => {
    const { name, email, password } = req.body;

    console.log('Datos recibidos en /registrar:', { name, email, password });

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    try {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('vNombreUsuario', mssql.VarChar(100), name);
        request.input('vEmailUsuario', mssql.VarChar(100), email);
        request.input('vPasswordUsuario', mssql.VarChar(100), password);

        const result = await request.execute('usp_RegistrarUsuario');

        if (result.returnValue === 0) {
            res.json('Usuario registrado con éxito'); // Envía solo el mensaje de éxito
        } else if (result.returnValue === -1) {
            res.status(400).json({ success: false, message: 'El usuario ya existe' });
        } else {
            res.status(500).json({ success: false, message: 'Error al registrar el usuario' });
        }
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// Ruta para obtener el número total de usuarios
app.get('/admin/total-usuarios', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_NumeroTotalUsuarios');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener el número total de usuarios:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta para obtener el número de usuarios por nivel
app.get('/admin/usuarios-por-nivel', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('sp_UsuariosPorNivel');
        console.log('Resultado del procedimiento sp_numerototalusuarios:', result); // Línea de depuración
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener usuarios por nivel:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta para obtener el número de usuarios registrados por fecha
app.get('/admin/usuarios-por-fecha', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('UsuariosRegistradosPorFecha');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener usuarios registrados por fecha:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta para obtener usuarios registrados por rango de fecha
app.get('/admin/usuarios-por-rango-fecha', async (req, res) => {
    const { fechaInicio, fechaFin } = req.query;

    try {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('FechaInicio', mssql.Date, fechaInicio);
        request.input('FechaFin', mssql.Date, fechaFin);
        const result = await request.execute('UsuariosRegistradosPorRangoFecha');

        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener usuarios registrados por rango de fecha:', error);
        res.status(500).send('Error interno del servidor');
    }
    
});

// Middleware para verificar el rol de administrador
function isAdmin(req, res, next) {
    // Aquí deberías tener lógica para verificar si el usuario tiene el rol de administrador
    const user = req.user; // Suponiendo que el usuario está en el objeto de solicitud, dependiendo de cómo manejes la autenticación

    if (user && user.role === 'ADMIN') {
        next(); // Permitir el acceso al siguiente middleware o ruta
    } else {
        res.status(403).send('Acceso denegado'); // Si no tiene el rol adecuado, devolver un error 403 Forbidden
    }
}

const port = 3000;
// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

//Pruebas


