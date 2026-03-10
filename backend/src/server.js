// backend/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { clerkMiddleware } = require('@clerk/express');

dotenv.config();

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 
app.use(clerkMiddleware());

app.get('/', (req, res) => {
  res.send('CabBook API is running...');
});

// ==============================
// Mount API Routes
// ==============================
// We ONLY need the payments route. Supabase handles users and rides directly!
app.use('/api/payments', require('./routes/paymentRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running securely on port ${PORT}`);
});