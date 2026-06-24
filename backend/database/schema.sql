CREATE DATABASE IF NOT EXISTS `inmoqr` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `inmoqr`;

-- Table for sellers
CREATE TABLE IF NOT EXISTS `vendedores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `rol` ENUM('vendedor', 'admin') DEFAULT 'vendedor',
  `activo` TINYINT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for properties
CREATE TABLE IF NOT EXISTS `propiedades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(255) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `precio` DECIMAL(15, 2) NOT NULL,
  `tipo` ENUM('casa', 'terreno', 'local') NOT NULL,
  `estado` ENUM('venta', 'renta') NOT NULL,
  `ubicacion` VARCHAR(255) NOT NULL,
  `latitud` DECIMAL(10, 8) NOT NULL,
  `longitud` DECIMAL(11, 8) NOT NULL,
  `vendedor_id` INT NOT NULL,
  `disponible` TINYINT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`vendedor_id`) REFERENCES `vendedores`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table for images
CREATE TABLE IF NOT EXISTS `imagenes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `propiedad_id` INT NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`propiedad_id`) REFERENCES `propiedades`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert a default seller (Password: "admin123", bcrypt hash is $2a$10$S9dK9v9Jad7t.J3qf4P2.eg2yqL5fRjN4P4m8cZtWdF9l44R4H03S)
INSERT INTO `vendedores` (`id`, `nombre`, `telefono`, `email`, `password`, `rol`) VALUES
(1, 'Agente Inmobiliario InmoQR', '555-0199', 'admin@inmoqr.com', '$2a$10$vvS8Zij4nxw9aiJzLUMk5OV0XI2ZtnYv2QmNO2LO2769M/E9FwMxS', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Insert some dummy properties
INSERT INTO `propiedades` (`id`, `titulo`, `descripcion`, `precio`, `tipo`, `estado`, `ubicacion`, `latitud`, `longitud`, `vendedor_id`) VALUES
(1, 'Hermosa Casa con Jardín', 'Espaciosa casa con 3 habitaciones, 2 baños completos, jardín amplio y estacionamiento para 2 autos. Excelente ubicación cerca de escuelas y centros comerciales.', 2500000.00, 'casa', 'venta', 'Colonia Centro, Jalapa', 19.54280000, -96.92720000, 1),
(2, 'Terreno Plano en Zona Comercial', 'Excelente terreno de 500m2 ideal para locales comerciales o bodegas. Cuenta con todos los servicios a pie de calle. Trato directo.', 1200000.00, 'terreno', 'venta', 'Avenida Lázaro Cárdenas, Jalapa', 19.53120000, -96.90340000, 1),
(3, 'Moderno Departamento en Renta', 'Departamento amueblado de 2 recámaras, terraza con vista panorámica, vigilancia las 24 horas y cochera techada.', 12000.00, 'casa', 'renta', 'Fraccionamiento Las Ánimas, Jalapa', 19.51860000, -96.88290000, 1)
ON DUPLICATE KEY UPDATE id=id;

-- Insert dummy images (these will be local paths or sample placeholder URLs that resolve/gracefully fallback)
INSERT INTO `imagenes` (`id`, `propiedad_id`, `url`) VALUES
(1, 1, '/uploads/sample-casa.jpg'),
(2, 2, '/uploads/sample-terreno.jpg'),
(3, 3, '/uploads/sample-depto.jpg')
ON DUPLICATE KEY UPDATE id=id;
