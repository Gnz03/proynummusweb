const express = require('express');
const app = express();
const mssql = require('mssql');
const path = require('path');


// Configurar Express para servir archivos estáticos desde la carpeta 'views'
app.use(express.static('views'));

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
/// Ruta para actualizar el nivel de usuario
app.post('/actualizar-nivel', async (req, res) => {
    const { userId, nuevoNivel } = req.body;


    try {
        // Conectar con la base de datos
        const pool = await mssql.connect(config);

        // Ejecutar la consulta SQL para actualizar el nivel de usuario
        const request = pool.request();
        request.input('userId', mssql.Int, userId);
        request.input('nuevoNivel', mssql.VarChar(20), nuevoNivel);
        const query = `UPDATE TB_USUARIO SET Nivel = @nuevoNivel WHERE IdUsuario = @userId`;
        const result = await request.query(query);

        // Imprimir el resultado de la consulta para depuración
        console.log('Resultado de la consulta:', result);

        if (result.rowsAffected[0] > 0) {
            res.send('Nivel de usuario actualizado correctamente');
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    } catch (error) {
        console.error('Error al actualizar el nivel de usuario en la base de datos:', error);
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

//

// Establecer el endpoint API para obtener las preguntas
app.get('/api/preguntas', async (req, res) => {
    try {
        // Conectar con la base de datos
        await pool.connect();

        // Ejecutar la consulta para obtener las preguntas
        const request = pool.request();
        const result = await request.query('SELECT * FROM tb_preguntas');

        // Enviar las preguntas como respuesta en formato JSON
        res.json(result.recordset);
    } catch (error) {
        console.error('Error al consultar las preguntas:', error);
        res.status(500).json({ error: 'Error al consultar las preguntas' });
    }
});


// Endpoint para actualizar una pregunta por su ID
app.put('/api/preguntas/:id', async (req, res) => {
    const idPregunta = req.params.id;
    const preguntaActualizada = req.body;

    try {
        // Conectar con la base de datos
        const pool = await mssql.connect(config);

        // Llamar al procedimiento almacenado EditarPregunta
        const request = pool.request();
        request.input('IdPregunta', mssql.Int, idPregunta);
        request.input('Pregunta', mssql.NVarChar(255), preguntaActualizada.Pregunta);
        request.input('RespuestaA', mssql.NVarChar(255), preguntaActualizada.RespuestaA);
        request.input('RespuestaB', mssql.NVarChar(255), preguntaActualizada.RespuestaB);
        request.input('RespuestaC', mssql.NVarChar(255), preguntaActualizada.RespuestaC);
        request.input('RespuestaD', mssql.NVarChar(255), preguntaActualizada.RespuestaD);
        request.input('RespuestaCorrecta', mssql.NVarChar(1), preguntaActualizada.RespuestaCorrecta);

        const result = await request.execute('EditarPregunta');

        // Cerrar la conexión con la base de datos
        pool.close();

        res.status(200).json({ message: 'Pregunta actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar la pregunta:', error);
        res.status(500).json({ error: 'Error interno del servidor al actualizar la pregunta' });
    }
});

app.post('/questions', async (req, res) => {
    const { text, answers, correct } = req.body;
    try {
        const pool = await mssql.connect(config);
        const result = await pool.request()
            .input('text', mssql.VarChar, text)
            .input('a', mssql.VarChar, answers.a)
            .input('b', mssql.VarChar, answers.b)
            .input('c', mssql.VarChar, answers.c)
            .input('d', mssql.VarChar, answers.d)
            .input('correct', mssql.VarChar, correct)
            .query(`INSERT INTO TB_PREGUNTAS (Pregunta, RespuestaA, RespuestaB, RespuestaC, RespuestaD, RespuestaCorrecta) 
                    VALUES (@text, @a, @b, @c, @d, @correct);
                    SELECT SCOPE_IDENTITY() AS IdPregunta`);
        const newQuestion = {
            id: result.recordset[0].IdPregunta,
            text,
            answers,
            correct
        };
        res.json(newQuestion);
    } catch (error) {
        console.error('Error al agregar pregunta:', error);
        res.status(500).send('Error interno del servidor');
    }
});

app.put('/questions/:id', async (req, res) => {
    const { id } = req.params;
    const { text, answers, correct } = req.body;
    try {
        const pool = await mssql.connect(config);
        await pool.request()
            .input('id', mssql.Int, id)
            .input('text', mssql.VarChar, text)
            .input('a', mssql.VarChar, answers.a)
            .input('b', mssql.VarChar, answers.b)
            .input('c', mssql.VarChar, answers.c)
            .input('d', mssql.VarChar, answers.d)
            .input('correct', mssql.VarChar, correct)
            .query(`UPDATE TB_PREGUNTAS 
                    SET Pregunta = @text, RespuestaA = @a, RespuestaB = @b, RespuestaC = @c, RespuestaD = @d, RespuestaCorrecta = @correct 
                    WHERE IdPregunta = @id`);
        const updatedQuestion = { id, text, answers, correct };
        res.json(updatedQuestion);
    } catch (error) {
        console.error('Error al actualizar pregunta:', error);
        res.status(500).send('Error interno del servidor');
    }
});
