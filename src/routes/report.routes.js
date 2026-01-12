const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorizePermission.middleware');
const upload = require('../middlewares/reportImg.middleware');

// Routes Admin
router.get('/dashboard-stats', auth, authorize('dashboard-stats'), reportController.getDashboardStats);
router.get('/preview', auth, authorize('manage_orders'), reportController.getReportPreview);
router.get('/', auth, authorize('manage_orders'), reportController.getAllReports);
router.post('/', auth, authorize('manage_orders'), upload.single('proof_image'), reportController.createReport);

router.get('/:report_id', auth, authorize('manage_orders'), reportController.getReportById);
router.put('/:report_id', auth, authorize('manage_orders'), upload.single('proof_image'), reportController.updateReport);
router.delete('/:report_id', auth, authorize('manage_orders'), reportController.deleteReport);

// Owner Only: Validasi
router.put('/:report_id/validate', auth, authorize('approve_report'), reportController.validateReport);

module.exports = router;
