const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Helper to remove files if DB transaction fails
const deleteFiles = (files) => {
  if (files && files.length > 0) {
    files.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Error al eliminar archivo temporal:', err);
      }
    });
  }
};

// GET all properties with filters
exports.getAllProperties = async (req, res) => {
  try {
    const { tipo, estado, buscar, precioMin, precioMax, vendedor_id, fechaInicio, fechaFin, disponible } = req.query;
    
    // Check if the user is authenticated (seller or admin) to decide if we can see inactive/sold/rented properties
    const authHeader = req.headers['authorization'];
    let isLogged = false;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          jwt.verify(token, process.env.JWT_SECRET || 'supersecure_inmoqr_token_secret_key_2026');
          isLogged = true;
        } catch (e) {
          // Token invalid, treat as public
        }
      }
    }

    let query = `
      SELECT p.*, v.nombre as vendedor_nombre, v.telefono as vendedor_telefono, v.email as vendedor_email
      FROM propiedades p
      JOIN vendedores v ON p.vendedor_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (tipo) {
      query += ' AND p.tipo = ?';
      params.push(tipo);
    }
    if (estado) {
      query += ' AND p.estado = ?';
      params.push(estado);
    }
    if (vendedor_id) {
      query += ' AND p.vendedor_id = ?';
      params.push(vendedor_id);
    }
    if (precioMin) {
      query += ' AND p.precio >= ?';
      params.push(parseFloat(precioMin));
    }
    if (precioMax) {
      query += ' AND p.precio <= ?';
      params.push(parseFloat(precioMax));
    }
    if (fechaInicio) {
      query += ' AND p.created_at >= ?';
      params.push(`${fechaInicio} 00:00:00`);
    }
    if (fechaFin) {
      query += ' AND p.created_at <= ?';
      params.push(`${fechaFin} 23:59:59`);
    }
    if (!isLogged) {
      query += ' AND p.disponible = 1';
    } else {
      if (disponible !== undefined && disponible !== '') {
        query += ' AND p.disponible = ?';
        params.push(parseInt(disponible));
      }
    }
    if (buscar) {
      query += ' AND (p.titulo LIKE ? OR p.descripcion LIKE ? OR p.ubicacion LIKE ?)';
      const searchWildcard = `%${buscar}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard);
    }

    query += ' ORDER BY p.created_at DESC';

    const [properties] = await db.execute(query, params);

    // Fetch images for each property
    for (let i = 0; i < properties.length; i++) {
      const [images] = await db.execute('SELECT id, url FROM imagenes WHERE propiedad_id = ?', [properties[i].id]);
      properties[i].imagenes = images;
    }

    return res.json(properties);
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    return res.status(500).json({ message: 'Error al obtener propiedades' });
  }
};

// GET property by ID
exports.getPropertyById = async (req, res) => {
  const { id } = req.params;

  try {
    const [properties] = await db.execute(`
      SELECT p.*, v.nombre as vendedor_nombre, v.telefono as vendedor_telefono, v.email as vendedor_email
      FROM propiedades p
      JOIN vendedores v ON p.vendedor_id = v.id
      WHERE p.id = ?
    `, [id]);

    if (properties.length === 0) {
      return res.status(404).json({ message: 'Propiedad no encontrada' });
    }

    const property = properties[0];
    const [images] = await db.execute('SELECT id, url FROM imagenes WHERE propiedad_id = ?', [id]);
    property.imagenes = images;

    return res.json(property);
  } catch (error) {
    console.error('Error al obtener propiedad:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// CREATE property
exports.createProperty = async (req, res) => {
  const { titulo, descripcion, precio, tipo, estado, ubicacion, latitud, longitud } = req.body;
  const vendedor_id = req.seller.id;
  const files = req.files; // Uploaded via multer

  if (!titulo || !descripcion || !precio || !tipo || !estado || !ubicacion || latitud === undefined || longitud === undefined) {
    deleteFiles(files);
    return res.status(400).json({ message: 'Todos los campos de la propiedad son requeridos' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const disponibleVal = req.body.disponible !== undefined ? parseInt(req.body.disponible) : 1;

    const [result] = await connection.execute(
      `INSERT INTO propiedades (titulo, descripcion, precio, tipo, estado, ubicacion, latitud, longitud, vendedor_id, disponible)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descripcion, parseFloat(precio), tipo, estado, ubicacion, parseFloat(latitud), parseFloat(longitud), vendedor_id, disponibleVal]
    );

    const propiedadId = result.insertId;

    // Save image records
    if (files && files.length > 0) {
      for (const file of files) {
        // We'll store the public relative URL: /uploads/filename
        const url = `/uploads/${file.filename}`;
        await connection.execute(
          'INSERT INTO imagenes (propiedad_id, url) VALUES (?, ?)',
          [propiedadId, url]
        );
      }
    }

    await connection.commit();
    return res.status(201).json({
      message: 'Propiedad creada exitosamente',
      propiedadId
    });
  } catch (error) {
    await connection.rollback();
    deleteFiles(files);
    console.error('Error al crear propiedad:', error);
    return res.status(500).json({ message: 'Error al crear la propiedad' });
  } finally {
    connection.release();
  }
};

// UPDATE property
exports.updateProperty = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, precio, tipo, estado, ubicacion, latitud, longitud, imagenesAEliminar } = req.body;
  const vendedor_id = req.seller.id;
  const files = req.files;

  try {
    // Check if property exists and belongs to seller
    const [rows] = await db.execute('SELECT vendedor_id FROM propiedades WHERE id = ?', [id]);
    if (rows.length === 0) {
      deleteFiles(files);
      return res.status(404).json({ message: 'Propiedad no encontrada' });
    }

    if (rows[0].vendedor_id !== vendedor_id && req.seller.rol !== 'admin') {
      deleteFiles(files);
      return res.status(403).json({ message: 'No tienes permiso para editar esta propiedad' });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const disponibleVal = req.body.disponible !== undefined ? parseInt(req.body.disponible) : 1;

      await connection.execute(
        `UPDATE propiedades
         SET titulo = ?, descripcion = ?, precio = ?, tipo = ?, estado = ?, ubicacion = ?, latitud = ?, longitud = ?, disponible = ?
         WHERE id = ?`,
        [titulo, descripcion, parseFloat(precio), tipo, estado, ubicacion, parseFloat(latitud), parseFloat(longitud), disponibleVal, id]
      );

      // Handle image deletion if requested
      if (imagenesAEliminar) {
        let toDeleteIds = [];
        if (typeof imagenesAEliminar === 'string') {
          toDeleteIds = [parseInt(imagenesAEliminar)];
        } else if (Array.isArray(imagenesAEliminar)) {
          toDeleteIds = imagenesAEliminar.map(Number);
        }

        for (const imgId of toDeleteIds) {
          // Get file URL to delete from filesystem
          const [imgRows] = await connection.execute('SELECT url FROM imagenes WHERE id = ? AND propiedad_id = ?', [imgId, id]);
          if (imgRows.length > 0) {
            const urlPath = imgRows[0].url;
            const fullPath = path.join(__dirname, '../public', urlPath);
            try {
              if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
              }
            } catch (err) {
              console.error('Error al borrar imagen física:', err);
            }
            await connection.execute('DELETE FROM imagenes WHERE id = ?', [imgId]);
          }
        }
      }

      // Add new images
      if (files && files.length > 0) {
        for (const file of files) {
          const url = `/uploads/${file.filename}`;
          await connection.execute(
            'INSERT INTO imagenes (propiedad_id, url) VALUES (?, ?)',
            [id, url]
          );
        }
      }

      await connection.commit();
      return res.json({ message: 'Propiedad actualizada exitosamente' });
    } catch (error) {
      await connection.rollback();
      deleteFiles(files);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al actualizar propiedad:', error);
    return res.status(500).json({ message: 'Error al actualizar la propiedad' });
  }
};

// DELETE property
exports.deleteProperty = async (req, res) => {
  const { id } = req.params;
  const vendedor_id = req.seller.id;

  try {
    // Check ownership
    const [rows] = await db.execute('SELECT vendedor_id FROM propiedades WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Propiedad no encontrada' });
    }

    if (rows[0].vendedor_id !== vendedor_id && req.seller.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta propiedad' });
    }

    // Get all image paths to delete files from disk
    const [imgRows] = await db.execute('SELECT url FROM imagenes WHERE propiedad_id = ?', [id]);
    
    // Delete property from DB (will cascade-delete images in DB)
    await db.execute('DELETE FROM propiedades WHERE id = ?', [id]);

    // Delete files from filesystem
    imgRows.forEach(img => {
      const fullPath = path.join(__dirname, '../public', img.url);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.error('Error al borrar imagen física en eliminación de propiedad:', err);
      }
    });

    return res.json({ message: 'Propiedad eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar propiedad:', error);
    return res.status(500).json({ message: 'Error al eliminar la propiedad' });
  }
};

// Toggle property availability
exports.toggleAvailability = async (req, res) => {
  const { id } = req.params;
  const vendedor_id = req.seller.id;

  try {
    const [rows] = await db.execute('SELECT vendedor_id, disponible FROM propiedades WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Propiedad no encontrada' });
    }

    if (rows[0].vendedor_id !== vendedor_id && req.seller.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para modificar esta propiedad' });
    }

    const currentAvailability = rows[0].disponible;
    const newAvailability = currentAvailability === 1 ? 0 : 1;

    await db.execute('UPDATE propiedades SET disponible = ? WHERE id = ?', [newAvailability, id]);

    return res.json({
      message: 'Disponibilidad actualizada exitosamente',
      disponible: newAvailability
    });
  } catch (error) {
    console.error('Error al cambiar disponibilidad:', error);
    return res.status(500).json({ message: 'Error interno del servidor al cambiar disponibilidad' });
  }
};
