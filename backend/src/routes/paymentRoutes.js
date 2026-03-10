// backend/src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();

// 1. Destructure exactly what we need from the controller
const { createPaymentIntent } = require('../controllers/paymentController');

// 2. Temporarily removed requireAuth so your frontend fetch works seamlessly.
// 3. This handles the POST request to http://localhost:5000/api/payments
router.post('/', createPaymentIntent);

module.exports = router;