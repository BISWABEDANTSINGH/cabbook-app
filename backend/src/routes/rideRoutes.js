// src/routes/rideRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { requestRide, getRideHistory, updateRideStatus } = require('../controllers/rideController');

router.use(requireAuth); // Protect all ride routes

router.post('/request', requestRide);
router.get('/history', getRideHistory);
router.put('/:id/status', updateRideStatus);

module.exports = router;