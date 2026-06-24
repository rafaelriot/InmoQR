const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ message: 'Se requiere un token de autenticación' });
  }

  const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"
  
  if (!token) {
    return res.status(403).json({ message: 'Formato de token inválido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecure_inmoqr_token_secret_key_2026');
    req.seller = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = verifyToken;
