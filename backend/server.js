const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static public folder (for uploaded property images)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Create public/uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Download real sample images for database seeds if they don't exist (or if they are the 1px transparent placeholder)
const createSampleImage = (filename, sourceUrl) => {
  const filePath = path.join(uploadsDir, filename);
  const exists = fs.existsSync(filePath);
  const isPlaceholder = exists && fs.statSync(filePath).size < 200;

  if (!exists || isPlaceholder) {
    const file = fs.createWriteStream(filePath);
    https.get(sourceUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Imagen semilla descargada exitosamente: ${filename}`);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      console.error(`Error al descargar imagen semilla ${filename}:`, err.message);
    });
  }
};

createSampleImage('sample-casa.jpg', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80');
createSampleImage('sample-terreno.jpg', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80');
createSampleImage('sample-depto.jpg', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80');

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'InmoQR API',
    status: 'online',
    version: '1.0.0',
    frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000'
  });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/reports', reportRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.message);
  res.status(500).json({ message: err.message || 'Ocurrió un error en el servidor' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Servidor InmoQR corriendo en http://localhost:${PORT}`);
});
