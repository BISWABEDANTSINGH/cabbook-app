// backend/src/controllers/paymentController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

exports.createPaymentIntent = async (req, res) => {
  try {
    const { rideId } = req.body;

    // 1. Fetch the ride directly from Supabase
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    // 2. Create the Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(ride.estimated_fare * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        ride_id: ride.id,
        rider_id: ride.rider_id
      }
    });

    // 3. Log the pending payment in Supabase
    await supabase.from('payments').insert({
      ride_id: ride.id,
      user_id: ride.rider_id,
      amount: ride.estimated_fare,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending'
    });

    // 4. Send the client secret to the frontend
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ success: false, message: 'Payment processing failed' });
  }
};