// src/app/admin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { supabase } from '../../lib/supabase';
import Button from '../../components/Button';

export default function AdminDashboard() {
  const { isLoaded, userId } = useAuth();
  const [activeTab, setActiveTab] = useState<'tickets' | 'riders' | 'drivers'>('tickets');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Tracks which user is being deleted

  // Data States
  const [tickets, setTickets] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  
  // State to hold the admin's typed replies for each ticket
  const [replies, setReplies] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'tickets') {
        const { data } = await supabase
          .from('support_tickets')
          .select('*, user:user_id(first_name, last_name, email)')
          .order('created_at', { ascending: false });
        setTickets(data || []);
      } else if (activeTab === 'riders') {
        const { data } = await supabase.from('users').select('*').eq('role', 'rider').order('created_at', { ascending: false });
        setRiders(data || []);
      } else if (activeTab === 'drivers') {
        const { data } = await supabase.from('users').select('*').eq('role', 'driver').order('created_at', { ascending: false });
        setDrivers(data || []);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RESOLVE SUPPORT TICKETS ---
  const handleResolveTicket = async (ticketId: string) => {
    const adminResponse = replies[ticketId];
    if (!adminResponse) return alert("Please type a response before resolving the ticket.");

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: 'resolved', 
          admin_response: adminResponse 
        })
        .eq('id', ticketId);

      if (error) throw error;

      alert("Ticket resolved and user notified!");
      setReplies({ ...replies, [ticketId]: '' });
      fetchData();
    } catch (error) {
      console.error("Error resolving ticket", error);
      alert("Failed to update ticket.");
    }
  };

  const handleReplyChange = (ticketId: string, text: string) => {
    setReplies({ ...replies, [ticketId]: text });
  };

  // --- DELETE A USER ---
  const handleDeleteUser = async (userIdToDelete: string) => {
    // Add a safety check so you don't accidentally click it!
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this user? All their rides and data will be erased.");
    if (!confirmDelete) return;

    setIsDeleting(userIdToDelete);
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userIdToDelete);

      if (error) throw error;

      alert("User deleted successfully!");
      fetchData(); // Refresh the table so the user disappears instantly
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Check database rules.");
    } finally {
      setIsDeleting(null);
    }
  };

  if (!isLoaded) return <div className="p-10 text-center">Loading Admin Panel...</div>;

  const displayList = activeTab === 'riders' ? riders : drivers;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      
      {/* Admin Sidebar */}
      <div className="w-full md:w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-wider uppercase text-blue-400">Admin Control</h1>
          <p className="text-slate-400 text-xs mt-1">CabBook Platform</p>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`w-full text-left px-4 py-3 rounded-xl transition font-medium flex items-center gap-3 ${activeTab === 'tickets' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            🎫 Support Tickets
            {tickets.filter(t => t.status === 'open').length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto">
                {tickets.filter(t => t.status === 'open').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('riders')}
            className={`w-full text-left px-4 py-3 rounded-xl transition font-medium ${activeTab === 'riders' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            🚕 Manage Riders
          </button>
          <button 
            onClick={() => setActiveTab('drivers')}
            className={`w-full text-left px-4 py-3 rounded-xl transition font-medium ${activeTab === 'drivers' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
          >
            👨🏽‍✈️ Manage Drivers
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow p-6 md:p-10 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 capitalize">{activeTab.replace('_', ' ')} Dashboard</h2>
            <p className="text-gray-500 mt-2">View and manage platform data in real-time.</p>
          </div>

          {isLoading ? (
            <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>
          ) : (
            <>
              {/* TICKETS VIEW */}
              {activeTab === 'tickets' && (
                <div className="space-y-6">
                  {tickets.length === 0 ? (
                    <p className="text-gray-500">No support tickets found.</p>
                  ) : (
                    tickets.map((ticket) => (
                      <div key={ticket.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className={`p-4 border-b ${ticket.status === 'resolved' ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'} flex justify-between items-center`}>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${ticket.status === 'resolved' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                              {ticket.status}
                            </span>
                            <span className="text-sm font-bold text-gray-700">{ticket.category}</span>
                          </div>
                          <span className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleString()}</span>
                        </div>
                        
                        <div className="p-6">
                          <p className="text-sm font-bold text-gray-500 uppercase mb-1">Reported By: {ticket.user?.first_name} {ticket.user?.last_name} ({ticket.user?.email})</p>
                          <p className="text-gray-900 mb-6">{ticket.description}</p>
                          
                          {ticket.status !== 'resolved' ? (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reply to User</label>
                              <textarea 
                                value={replies[ticket.id] || ''}
                                onChange={(e) => handleReplyChange(ticket.id, e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 mb-3 text-sm resize-none h-20"
                                placeholder="Type your official resolution or response here..."
                              />
                              <div className="text-right">
                                <Button size="sm" onClick={() => handleResolveTicket(ticket.id)}>Mark as Resolved & Send</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                              <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Your Response:</p>
                              <p className="text-sm text-blue-900">{ticket.admin_response}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* USERS / DRIVERS VIEW */}
              {(activeTab === 'riders' || activeTab === 'drivers') && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                          <th className="p-4 font-bold">User</th>
                          <th className="p-4 font-bold">Email</th>
                          <th className="p-4 font-bold">Joined Date</th>
                          <th className="p-4 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {displayList.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-gray-500">No {activeTab} found.</td></tr>
                        ) : (
                          displayList.map((user: any) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition">
                              
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900">{user.first_name} {user.last_name}</p>
                                    {activeTab === 'drivers' && <p className="text-xs text-yellow-500 font-bold">★ {user.rating || '5.0'}</p>}
                                  </div>
                                </div>
                              </td>
                              
                              <td className="p-4 text-sm text-gray-600">{user.email}</td>
                              <td className="p-4 text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                              <td className="p-4 text-right">
                                {/* UPGRADED: Delete Button */}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                  isLoading={isDeleting === user.id}
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  Delete User
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}