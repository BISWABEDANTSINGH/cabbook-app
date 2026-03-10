// src/app/support/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';

// Ticket Type Definition
interface Ticket {
  id: string;
  category: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_response: string | null;
  created_at: string;
}

export default function SupportPage() {
  const { userId, isLoaded } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the user's past tickets
  useEffect(() => {
    if (userId) fetchTickets();
  }, [userId]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return alert("You must be logged in to submit a ticket.");
    if (!category || !description) return alert("Please fill out all fields.");

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: userId,
        category,
        description
      });

      if (error) throw error;

      alert("Ticket submitted successfully! Our support team will review it shortly.");
      setCategory('');
      setDescription('');
      fetchTickets(); // Refresh the list so the new ticket appears instantly!
    } catch (error) {
      console.error("Error submitting ticket:", error);
      alert("Failed to submit ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Under Review</span>;
      case 'in_progress': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">In Progress</span>;
      case 'resolved': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Resolved</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-gray-500 mt-2">How can we help you today?</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* LEFT: Submit a New Ticket Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 h-fit">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Submit a Request</h2>
            
            <form onSubmit={handleSubmitTicket} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Issue Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-700"
                >
                  <option value="" disabled>Select an issue...</option>
                  <option value="Payment Issue">💳 Payment or Billing Issue</option>
                  <option value="Lost Item">📱 I left something in the car</option>
                  <option value="Driver Complaint">👨🏽‍✈️ Unprofessional Driver Behavior</option>
                  <option value="App Bug">🐛 App isn't working properly</option>
                  <option value="Other">❓ Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide as many details as possible (Ride date, driver name, what happened, etc.)"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-700 h-40 resize-none"
                ></textarea>
              </div>

              <Button type="submit" className="w-full py-4 text-lg shadow-lg" isLoading={isSubmitting}>
                Submit Ticket
              </Button>
            </form>
          </div>

          {/* RIGHT: Past Tickets History */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Previous Tickets</h2>
            
            {isLoading ? (
              <div className="text-center py-10 text-gray-500">Loading your history...</div>
            ) : tickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-10 text-center">
                <div className="text-4xl mb-4">🎫</div>
                <h3 className="font-bold text-gray-900 mb-1">No Support Tickets</h3>
                <p className="text-gray-500 text-sm">You haven't submitted any requests yet. If you run into an issue, let us know!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                        <h3 className="font-bold text-gray-900 text-lg">{ticket.category}</h3>
                      </div>
                      {getStatusBadge(ticket.status)}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{ticket.description}</p>
                    
                    {/* If Admin replied, show the response! */}
                    {ticket.admin_response && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-4">
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Support Team Reply:</p>
                        <p className="text-sm text-blue-900">{ticket.admin_response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}