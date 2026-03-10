// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const { 
  syncUser, 
  getUserProfile, 
  updateUserProfile 
} = require('../controllers/userController');

// All routes below this line require authentication
router.use(requireAuth);

router.post('/sync', syncUser);
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

module.exports = router;