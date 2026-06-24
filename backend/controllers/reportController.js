const db = require('../config/db');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
require('dotenv').config();

// Helper to format currency
const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(val);
};

// Generate Single Property Flyer PDF with QR Code
exports.getPropertyFlyerPDF = async (req, res) => {
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

    // Get the first image if any
    const [images] = await db.execute('SELECT url FROM imagenes WHERE propiedad_id = ? LIMIT 1', [id]);
    const mainImageUrl = images.length > 0 ? images[0].url : null;

    // Generate QR Code. Redirects to frontend detail page
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const detailUrl = `${frontendBaseUrl}/properties/${id}`;
    const qrDataUrl = await QRCode.toDataURL(detailUrl, { margin: 1, width: 200 });

    // Create PDF Document
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

    // Stream PDF directly to client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Propiedad_${id}.pdf"`);
    doc.pipe(res);

    // Header styling
    doc.rect(0, 0, 612, 100).fill('#1e293b'); // Navy dark banner
    doc.fillColor('#ffffff').fontSize(24).text('INMOQR', 50, 30, { characterSpacing: 2 });
    doc.fontSize(10).text('Tu propiedad inmobiliaria a un escaneo de distancia', 50, 60);

    // Status Badge
    const statusText = property.estado === 'venta' ? 'EN VENTA' : 'EN RENTA';
    const badgeColor = property.estado === 'venta' ? '#ef4444' : '#10b981';
    doc.rect(450, 35, 110, 30).fill(badgeColor);
    doc.fillColor('#ffffff').fontSize(11).text(statusText, 450, 45, { width: 110, align: 'center' });

    // Title & Price
    doc.fillColor('#0f172a').fontSize(20).text(property.titulo, 50, 130);
    doc.fillColor('#475569').fontSize(12).text(property.ubicacion, 50, 155);

    doc.fillColor('#0f172a').fontSize(18).text(formatCurrency(property.precio), 50, 185);
    doc.fontSize(10).fillColor('#64748b').text(property.tipo === 'casa' ? 'Tipo: Casa / Departamento' : 'Tipo: Terreno', 50, 205);

    // Horizontal line
    doc.moveTo(50, 225).lineTo(562, 225).strokeColor('#cbd5e1').stroke();

    // Left Column: Description & Seller info
    doc.fillColor('#1e293b').fontSize(14).text('Descripción', 50, 245);
    doc.fillColor('#334155').fontSize(10).text(property.descripcion, 50, 265, { width: 320, align: 'justify', lineGap: 4 });

    doc.fillColor('#1e293b').fontSize(14).text('Contacto del Vendedor', 50, 420);
    doc.fillColor('#334155').fontSize(11).text(`Nombre: ${property.vendedor_nombre}`, 50, 445);
    doc.text(`Teléfono: ${property.vendedor_telefono}`, 50, 465);
    doc.text(`Email: ${property.vendedor_email}`, 50, 485);

    // Right Column: QR Code
    doc.fillColor('#1e293b').fontSize(14).text('Escanea el QR', 400, 245, { align: 'center' });
    doc.fontSize(9).fillColor('#64748b').text('Escanea con tu celular para ver fotos completas y mapa interactivo en nuestra web.', 400, 265, { width: 160, align: 'center', lineGap: 2 });
    
    // Embed QR Code
    const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
    doc.image(qrBuffer, 390, 310, { width: 180 });

    // Footer
    doc.moveTo(50, 720).lineTo(562, 720).strokeColor('#e2e8f0').stroke();
    doc.fillColor('#94a3b8').fontSize(9).text('Documento informativo de InmoQR. Precios y disponibilidad sujetos a cambios.', 50, 735, { align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error al generar PDF de propiedad:', error);
    return res.status(500).json({ message: 'Error interno al generar el PDF' });
  }
};

// Export All Properties List PDF Report
exports.exportAllPropertiesPDF = async (req, res) => {
  try {
    const [properties] = await db.execute(`
      SELECT p.*, v.nombre as vendedor_nombre
      FROM propiedades p
      JOIN vendedores v ON p.vendedor_id = v.id
      ORDER BY p.id ASC
    `);

    const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Listado_Propiedades.pdf"');
    doc.pipe(res);

    // Title
    doc.fillColor('#1e293b').fontSize(18).text('InmoQR - Reporte General de Propiedades', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text(`Generado el: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' });
    doc.moveDown(2);

    // Table Header
    const tableTop = 120;
    doc.rect(40, tableTop, 532, 20).fill('#334155');
    doc.fillColor('#ffffff').fontSize(9);
    doc.text('ID', 45, tableTop + 5, { width: 30 });
    doc.text('Título', 80, tableTop + 5, { width: 140 });
    doc.text('Tipo', 230, tableTop + 5, { width: 60 });
    doc.text('Estado', 300, tableTop + 5, { width: 60 });
    doc.text('Precio', 370, tableTop + 5, { width: 90 });
    doc.text('Vendedor', 470, tableTop + 5, { width: 90 });

    let currentY = tableTop + 20;

    doc.fillColor('#0f172a');
    properties.forEach((p, idx) => {
      // Draw white/gray alternating backgrounds
      if (idx % 2 === 1) {
        doc.rect(40, currentY, 532, 20).fill('#f8fafc');
        doc.fillColor('#0f172a');
      }

      doc.text(p.id.toString(), 45, currentY + 5, { width: 30 });
      doc.text(p.titulo, 80, currentY + 5, { width: 140, height: 12, ellipsis: true });
      doc.text(p.tipo === 'casa' ? 'Casa' : 'Terreno', 230, currentY + 5, { width: 60 });
      doc.text(p.estado === 'venta' ? 'Venta' : 'Renta', 300, currentY + 5, { width: 60 });
      doc.text(formatCurrency(p.precio), 370, currentY + 5, { width: 90 });
      doc.text(p.vendedor_nombre, 470, currentY + 5, { width: 95, height: 12, ellipsis: true });

      currentY += 20;

      // Handle pagination if table goes off page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
        doc.rect(40, currentY, 532, 20).fill('#334155');
        doc.fillColor('#ffffff');
        doc.text('ID', 45, currentY + 5, { width: 30 });
        doc.text('Título', 80, currentY + 5, { width: 140 });
        doc.text('Tipo', 230, currentY + 5, { width: 60 });
        doc.text('Estado', 300, currentY + 5, { width: 60 });
        doc.text('Precio', 370, currentY + 5, { width: 90 });
        doc.text('Vendedor', 470, currentY + 5, { width: 90 });
        doc.fillColor('#0f172a');
        currentY += 20;
      }
    });

    doc.end();
  } catch (error) {
    console.error('Error al exportar propiedades en PDF:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Export All Properties Excel Report
exports.exportAllPropertiesExcel = async (req, res) => {
  try {
    const [properties] = await db.execute(`
      SELECT p.*, v.nombre as vendedor_nombre, v.telefono as vendedor_telefono, v.email as vendedor_email
      FROM propiedades p
      JOIN vendedores v ON p.vendedor_id = v.id
      ORDER BY p.id ASC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Propiedades');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Título', key: 'titulo', width: 25 },
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'Precio (MXN)', key: 'precio', width: 15 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Ubicación', key: 'ubicacion', width: 25 },
      { header: 'Latitud', key: 'latitud', width: 12 },
      { header: 'Longitud', key: 'longitud', width: 12 },
      { header: 'Vendedor', key: 'vendedor_nombre', width: 20 },
      { header: 'Teléfono Vendedor', key: 'vendedor_telefono', width: 15 },
      { header: 'Email Vendedor', key: 'vendedor_email', width: 25 }
    ];

    // Format headers
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E293B' }
    };

    properties.forEach(p => {
      worksheet.addRow({
        id: p.id,
        titulo: p.titulo,
        descripcion: p.descripcion,
        precio: parseFloat(p.precio),
        tipo: p.tipo === 'casa' ? 'Casa' : 'Terreno',
        estado: p.estado === 'venta' ? 'Venta' : 'Renta',
        ubicacion: p.ubicacion,
        latitud: parseFloat(p.latitud),
        longitud: parseFloat(p.longitud),
        vendedor_nombre: p.vendedor_nombre,
        vendedor_telefono: p.vendedor_telefono,
        vendedor_email: p.vendedor_email
      });
    });

    // Format price column as currency
    worksheet.getColumn('precio').numFmt = '$#,##0.00';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Listado_Propiedades.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al exportar propiedades en Excel:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
