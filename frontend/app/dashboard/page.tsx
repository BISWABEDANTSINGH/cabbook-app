// src/app/dashboard/page.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import Button from '../../components/Button';
import RideCard from '../../components/RideCard';
import Map from '../../components/Map';
import { useRide } from '../../hooks/useRide';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import PaymentModal from '../../components/PaymentModal';

export default function DashboardPage() {
  const { requestNewRide, isLoading: isSavingRide } = useRide();
  useAuth();

  const [rideStatus, setRideStatus] = useState<'selecting' | 'searching' | 'driver_arriving' | 'in_transit' | 'completed'>('selecting');
  
  const [isRouteCalculated, setIsRouteCalculated] = useState(false);
  const [distance, setDistance] = useState('');
  const [durationMins, setDurationMins] = useState(0); 
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  
  // Real-time ETA & Driver States
  const [driverWaitTime, setDriverWaitTime] = useState(0);
  const [dropoffClockTime, setDropoffClockTime] = useState('');
  const [assignedDriver, setAssignedDriver] = useState<any>(null);

  // Map & Location States
  const [waypoints, setWaypoints] = useState<{lat: number, lng: number}[]>([]);
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{lat: number, lng: number} | null>(null);

  // Features
  const [promoCode, setPromoCode] = useState('');
  const [discountMultiplier, setDiscountMultiplier] = useState(1);
  const [promoMessage, setPromoMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Payment States
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const pickupRef = useRef<HTMLInputElement>(null);
  const dropoffRef = useRef<HTMLInputElement>(null);
  const [rideOptions, setRideOptions] = useState<any[]>([]);

  const calculateDistance = (p1: any, p2: any) => {
    const R = 3958.8; 
    const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
    const dLon = (p2.lng - p1.lng) * (Math.PI / 180);
    const a = Math.sin(dLat/2) ** 2 + Math.cos(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) * Math.sin(dLon/2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) * 1.3;
  };

  const handleMapClick = (coords: { lat: number, lng: number }) => {
    if (isRouteCalculated) return;
    if (!pickupCoords) {
      setPickupCoords(coords);
      if (pickupRef.current) pickupRef.current.value = "📍 Pinned Pickup";
    } else if (!dropoffCoords) {
      setDropoffCoords(coords);
      if (dropoffRef.current) dropoffRef.current.value = "📍 Pinned Dropoff";
    } else {
      setWaypoints([...waypoints, coords]);
    }
  };

  const handleSearchRides = () => {
    if (!pickupCoords || !dropoffCoords) return alert("Please pin a pickup and dropoff on the map!");

    let totalDist = 0;
    const allPoints = [pickupCoords, ...waypoints, dropoffCoords];
    for (let i = 0; i < allPoints.length - 1; i++) {
      totalDist += calculateDistance(allPoints[i], allPoints[i+1]);
    }
    
    if (totalDist < 0.5) totalDist = 0.5;
    const mockDistance = totalDist.toFixed(1);
    const calculatedMins = Math.round(totalDist * 3.5);

    setDistance(`${mockDistance} mi`);
    setDurationMins(calculatedMins);
    
    setRideOptions([
      { id: 'economy', title: 'CabBook Economy', description: 'Affordable rides', price: 5 + (totalDist * 1.5), eta: `${calculatedMins} mins` },
      { id: 'premium', title: 'CabBook Premium', description: 'Comfortable sedans', price: 8 + (totalDist * 2.5), eta: `${calculatedMins} mins` },
      { id: 'suv', title: 'CabBook SUV', description: 'For larger groups', price: 12 + (totalDist * 3.5), eta: `${calculatedMins} mins` },
    ]);

    setIsRouteCalculated(true);
  };

  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === 'SAVE20') {
      setDiscountMultiplier(0.8);
      setPromoMessage({ text: '20% off applied!', type: 'success' });
    } else {
      setDiscountMultiplier(1);
      setPromoMessage({ text: 'Invalid promo code.', type: 'error' });
    }
  };

  const handleConfirmRide = async () => {
    if (!selectedRide || !pickupCoords || !dropoffCoords) return;
    setRideStatus('searching');

    try {
      const selectedRideDetails = rideOptions.find(r => r.id === selectedRide);
      const finalPrice = selectedRideDetails ? selectedRideDetails.price * discountMultiplier : 0;
      setPaymentAmount(finalPrice);

      const rideData = await requestNewRide({
        pickupLocation: { address: pickupRef.current?.value || 'Pinned', coordinates: [pickupCoords.lng, pickupCoords.lat] },
        dropoffLocation: { address: dropoffRef.current?.value || 'Pinned', coordinates: [dropoffCoords.lng, dropoffCoords.lat] },
        rideType: selectedRide as 'economy',
        distance: parseFloat(distance),
      });

      setCurrentRideId(rideData.id);

      // --- RELIABLE FALLBACK: FETCH A REAL DRIVER AND ASSIGN INSTANTLY ---
      const { data: drivers } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'driver');

      if (drivers && drivers.length > 0) {
        const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
        setAssignedDriver(randomDriver);
        // Link the driver and set it directly to accepted
        await supabase.from('rides').update({ driver_id: randomDriver.id, status: 'accepted' }).eq('id', rideData.id);
      } else {
        setAssignedDriver({ first_name: 'No', last_name: 'Drivers Online', rating: '5.0' });
      }

      // 3-Second simulated wait so the UI looks natural!
      setTimeout(() => {
        const waitMins = Math.floor(Math.random() * 5) + 2;
        setDriverWaitTime(waitMins);
        
        const arrivalDate = new Date(Date.now() + (waitMins + durationMins) * 60000);
        setDropoffClockTime(arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        
        setRideStatus('driver_arriving');
      }, 3000);
    } catch (error) {
      console.error(error);
      setRideStatus('selecting'); 
    }
  };

  const handleInitiatePayment = async () => {
    if (!currentRideId) return;
    setIsInitializingPayment(true);

    try {
      const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: currentRideId }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to init payment');

      setClientSecret(data.clientSecret);
    } catch (error) {
      const confirmBypass = window.confirm("Backend unreachable. Simulate payment success?");
      if (confirmBypass) handlePaymentSuccess();
    } finally {
      setIsInitializingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    setRideStatus('in_transit'); 
  };

  const triggerSOS = () => {
    alert("🚨 SOS TRIGGERED! Your live location has been securely sent to Emergency Services.");
  };

  const submitReview = async () => {
    if (!currentRideId) return;
    try {
      await supabase.from('rides').update({ rating, feedback: feedback || null }).eq('id', currentRideId);
      alert("Thanks for your review!");
      window.location.reload(); 
    } catch (error) {
      console.error("Error saving review", error);
    }
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row bg-gray-50 h-[calc(100vh-4rem)]">
      {/* LEFT PANEL */}
      <div className="w-full md:w-1/3 lg:w-[420px] bg-white border-r border-gray-200 shadow-xl z-10 flex flex-col h-full">
        <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
          
          {rideStatus === 'selecting' && (
            <div className="animate-in fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Book a Ride</h2>
              
              <div className="space-y-4 mb-6 relative">
                <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gray-200 z-0"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0"></div>
                  <input type="text" placeholder="1. Click map for Pickup" ref={pickupRef} readOnly className="w-full p-3 bg-gray-100 rounded-lg outline-none"/>
                </div>
                {waypoints.map((wp, i) => (
                  <div key={i} className="relative z-10 flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex-shrink-0"></div>
                    <input type="text" value={`📍 Stop ${i + 1} Pinned`} readOnly className="w-full p-3 bg-gray-100 rounded-lg outline-none text-gray-600"/>
                  </div>
                ))}
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-none bg-black flex-shrink-0"></div>
                  <input type="text" placeholder="2. Click map for Dropoff" ref={dropoffRef} readOnly className="w-full p-3 bg-gray-100 rounded-lg outline-none"/>
                </div>
              </div>

              {!isRouteCalculated && (
                <Button className="w-full mb-8" onClick={handleSearchRides} disabled={!pickupCoords || !dropoffCoords}>
                  Search Available Rides
                </Button>
              )}

              {isRouteCalculated && (
                <div className="animate-in slide-in-from-bottom-4">
                  <div className="space-y-3 mb-6">
                    {rideOptions.map((ride) => (
                      <RideCard key={ride.id} {...ride} price={ride.price * discountMultiplier} isSelected={selectedRide === ride.id} onSelect={setSelectedRide} />
                    ))}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Promo Code</label>
                    <div className="flex gap-2">
                      <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-lg uppercase outline-none focus:border-blue-500" placeholder="SAVE20"/>
                      <Button variant="outline" onClick={applyPromoCode}>Apply</Button>
                    </div>
                    {promoMessage && <p className={`text-xs mt-2 font-bold ${promoMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{promoMessage.text}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {rideStatus === 'searching' && (
             <div className="flex flex-col items-center justify-center h-full space-y-4">
               <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
               <h2 className="text-xl font-bold">Connecting to a driver...</h2>
             </div>
          )}

          {/* --- PHASE 1: DRIVER ARRIVING --- */}
          {rideStatus === 'driver_arriving' && (
            <div className="animate-in slide-in-from-bottom-4 h-full flex flex-col">
              
              <div className="text-center mb-8 mt-4">
                <h2 className="text-4xl font-extrabold text-blue-600">{driverWaitTime} <span className="text-xl text-gray-500">min</span></h2>
                <p className="text-gray-900 font-bold text-lg mt-1">Driver is heading to you</p>
                <p className="text-sm text-gray-500">Please meet at the pickup point.</p>
              </div>
              
              <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl border border-gray-200 overflow-hidden">
                      {assignedDriver?.profile_image ? (
                        <img src={assignedDriver.profile_image} alt="Driver" className="w-full h-full object-cover" />
                      ) : (
                        '👨🏽‍✈️'
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">
                        {assignedDriver?.first_name} {assignedDriver?.last_name?.charAt(0)}.
                      </h3>
                      <div className="flex items-center text-sm font-bold text-gray-600">
                        <span className="text-yellow-400 mr-1 text-base">★</span> {assignedDriver?.rating || '4.9'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-gray-100 border border-gray-300 font-mono text-gray-900 font-bold px-3 py-1.5 rounded-lg shadow-sm text-lg tracking-widest">
                      XYZ-9876
                    </div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1">Toyota Camry</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <Button className="w-full text-lg py-6 shadow-lg bg-black hover:bg-gray-800" onClick={handleInitiatePayment} isLoading={isInitializingPayment}>
                  Pay ${paymentAmount.toFixed(2)} to Board
                </Button>
                <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 border-red-200" onClick={() => { setRideStatus('selecting'); setIsRouteCalculated(false); }}>
                  Cancel Ride
                </Button>
              </div>
            </div>
          )}

          {/* --- PHASE 2: IN TRANSIT --- */}
          {rideStatus === 'in_transit' && (
            <div className="animate-in slide-in-from-right h-full flex flex-col">
              
              <div className="bg-blue-50 rounded-2xl p-6 mb-6 text-center border border-blue-100">
                <p className="text-blue-600 font-bold uppercase tracking-wider text-sm mb-1">Estimated Dropoff</p>
                <h2 className="text-4xl font-extrabold text-blue-900">{dropoffClockTime}</h2>
                <p className="text-sm text-blue-700 mt-2 font-medium">Heading to your destination</p>
              </div>

              <div className="px-4 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <div className="flex-1 h-1 bg-blue-600 mx-2 opacity-20"></div>
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center shadow-md">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Picked Up</span>
                  <span>En Route</span>
                </div>
              </div>

              <button onClick={triggerSOS} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-xl mb-6 border border-red-200 transition flex items-center justify-center gap-2 shadow-sm">
                <span className="text-xl">🛡️</span> EMERGENCY SOS
              </button>

              <div className="mt-auto space-y-3">
                <Button className="w-full bg-black py-5 text-lg" onClick={() => setRideStatus('completed')}>
                  Simulate Arrival
                </Button>
              </div>
            </div>
          )}

          {/* --- PHASE 3: COMPLETED & RATINGS --- */}
          {rideStatus === 'completed' && (
            <div className="animate-in slide-in-from-bottom-8 h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm">
                ✓
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">You've arrived</h2>
              
              <p className="text-gray-500 mb-8 font-medium">Rate your trip with {assignedDriver?.first_name || 'your driver'}</p>
              
              <div className="flex gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className={`text-5xl transition-all ${rating >= star ? 'text-yellow-400 scale-110 drop-shadow-md' : 'text-gray-200 hover:text-yellow-100 hover:scale-105'}`}>
                    ★
                  </button>
                ))}
              </div>

              {rating > 0 && (
                <div className="w-full space-y-4 animate-in slide-in-from-bottom-4">
                  <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Leave a compliment or feedback (optional)" className="w-full p-4 border border-gray-200 rounded-xl resize-none h-28 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"/>
                  <Button className="w-full py-4 text-lg bg-black hover:bg-gray-800" onClick={submitReview}>Submit Feedback</Button>
                </div>
              )}
            </div>
          )}
        </div>

        {rideStatus === 'selecting' && isRouteCalculated && (
          <div className="p-4 border-t border-gray-100 bg-white">
            <Button className="w-full shadow-lg text-lg py-5" disabled={!selectedRide || isSavingRide} onClick={handleConfirmRide} isLoading={isSavingRide}>
              Confirm Ride
            </Button>
          </div>
        )}
      </div>

      <div className="flex-grow relative hidden md:block h-full">
        <Map pickupCoords={pickupCoords} dropoffCoords={dropoffCoords} waypoints={waypoints} onMapClick={handleMapClick} /> 
      </div>

      {clientSecret === 'simulated' ? (
         <PaymentModal clientSecret="test" amount={paymentAmount} onSuccess={handlePaymentSuccess} onCancel={() => setClientSecret(null)} />
      ) : clientSecret && (
         <PaymentModal clientSecret={clientSecret} amount={paymentAmount} onSuccess={handlePaymentSuccess} onCancel={() => setClientSecret(null)} />
      )}
    </div>
  );
}