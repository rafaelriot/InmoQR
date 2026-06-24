const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecure_inmoqr_token_secret_key_2026';

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'El email y la contraseña son requeridos' });
  }

  console.log('Intento de login para email:', email);
  try {
    const [rows] = await db.execute('SELECT * FROM vendedores WHERE email = ?', [email]);
    if (rows.length === 0) {
      console.log('No se encontro vendedor con el email:', email);
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const seller = rows[0];
    console.log('Vendedor encontrado en la DB:', seller.email);
    console.log('Hash en DB:', seller.password);

    if (seller.activo === 0) {
      return res.status(403).json({ message: 'Esta cuenta ha sido deshabilitada por el administrador.' });
    }

    const isMatch = await bcrypt.compare(password, seller.password);
    console.log('¿Coincide la contraseña?:', isMatch);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: seller.id, nombre: seller.nombre, email: seller.email, rol: seller.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      vendedor: {
        id: seller.id,
        nombre: seller.nombre,
        email: seller.email,
        telefono: seller.telefono,
        rol: seller.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.register = async (req, res) => {
  const { nombre, telefono, email, password } = req.body;

  if (!nombre || !telefono || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    // Check if seller already exists
    const [existing] = await db.execute('SELECT id FROM vendedores WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO vendedores (nombre, telefono, email, password) VALUES (?, ?, ?, ?)',
      [nombre, telefono, email, hashedPassword]
    );

    const newSellerId = result.insertId;
    const token = jwt.sign(
      { id: newSellerId, nombre, email, rol: 'vendedor' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'Vendedor registrado exitosamente',
      token,
      vendedor: {
        id: newSellerId,
        nombre,
        email,
        telefono,
        rol: 'vendedor'
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, nombre, telefono, email, rol, activo FROM vendedores WHERE id = ?',
      [req.seller.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Admin User Management CRUD
exports.getAllUsers = async (req, res) => {
  if (req.seller.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de administrador' });
  }

  try {
    const [rows] = await db.execute('SELECT id, nombre, telefono, email, rol, activo, created_at FROM vendedores ORDER BY id DESC');
    return res.json(rows);
  } catch (error) {
    console.error('Error al obtener asesores:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.createUser = async (req, res) => {
  if (req.seller.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de administrador' });
  }

  const { nombre, telefono, email, password, rol } = req.body;

  if (!nombre || !telefono || !email || !password || !rol) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    const [existing] = await db.execute('SELECT id FROM vendedores WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO vendedores (nombre, telefono, email, password, rol, activo) VALUES (?, ?, ?, ?, ?, 1)',
      [nombre, telefono, email, hashedPassword, rol]
    );

    return res.status(201).json({
      message: 'Usuario registrado exitosamente por administrador',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear usuario por admin:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.updateUser = async (req, res) => {
  if (req.seller.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de administrador' });
  }

  const { id } = req.params;
  const { nombre, telefono, email, password, rol, activo } = req.body;

  if (!nombre || !telefono || !email || !rol || activo === undefined) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  if (parseInt(id) === req.seller.id && parseInt(activo) === 0) {
    return res.status(400).json({ message: 'No puedes deshabilitar tu propia cuenta de administrador' });
  }

  try {
    const [existing] = await db.execute('SELECT id FROM vendedores WHERE email = ? AND id != ?', [email, id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está en uso por otro asesor' });
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.execute(
        'UPDATE vendedores SET nombre = ?, telefono = ?, email = ?, password = ?, rol = ?, activo = ? WHERE id = ?',
        [nombre, telefono, email, hashedPassword, rol, activo, id]
      );
    } else {
      await db.execute(
        'UPDATE vendedores SET nombre = ?, telefono = ?, email = ?, rol = ?, activo = ? WHERE id = ?',
        [nombre, telefono, email, rol, activo, id]
      );
    }

    return res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
