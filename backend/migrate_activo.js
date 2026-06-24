const db = require('./config/db');

async function run() {
  try {
    console.log('Iniciando migración de base de datos...');
    
    // Check if column already exists
    const [columns] = await db.query('SHOW COLUMNS FROM vendedores LIKE "activo"');
    if (columns.length === 0) {
      await db.query('ALTER TABLE vendedores ADD COLUMN activo TINYINT DEFAULT 1');
      console.log('¡Columna "activo" agregada con éxito a la tabla "vendedores"!');
    } else {
      console.log('La columna "activo" ya existe.');
    }
  } catch (err) {
    console.error('Error al ejecutar la migración:', err);
  } finally {
    process.exit();
  }
}

run();
