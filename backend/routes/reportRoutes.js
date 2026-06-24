const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/properties/:id/pdf', reportController.getPropertyFlyerPDF);
router.get('/properties/export/pdf', reportController.exportAllPropertiesPDF);
router.get('/properties/export/excel', reportController.exportAllPropertiesExcel);

module.exports = router;
