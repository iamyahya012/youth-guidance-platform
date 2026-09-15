"use client";
import { useState, useEffect } from "react";
import { UploadCloud, LogOut, CheckCircle2, Loader2, Clock, Megaphone, XCircle, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function TeamDashboard() {
  const [activeTab, setActiveTab] = useState("attendance");
  const [amount, setAmount] = useState<number>(250);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User & History States
  const [user, setUser] = useState<{ id: string, fullName: string, username: string } | null>(null);
  const [contributionHistory, setContributionHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Attendance States
  const [attendanceCode, setAttendanceCode] = useState("");
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('yg_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchMyContributions(parsedUser.username);
      fetchMyAttendance(parsedUser.username);
      fetchNotifications(); 
    } else {
      window.location.href = "/";
    }
  }, []);

  const fetchMyContributions = async (username: string) => {
    const { data } = await supabase.from('volunteer_contributions').select('*').eq('username', username).order('created_at', { ascending: false });
    if (data) setContributionHistory(data);
  };

  const fetchMyAttendance = async (username: string) => {
    const { data } = await supabase.from('volunteer_attendance').select('*').eq('username', username).order('created_at', { ascending: false });
    if (data) setAttendanceHistory(data);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase.from('team_notifications').select('*').order('created_at', { ascending: false }).limit(3);
    if (data) setNotifications(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('yg_user');
    window.location.href = "/";
  };

  // --- ATTENDANCE SUBMISSION ---
  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !attendanceCode.trim()) return;

    setIsSubmittingAttendance(true);
    try {
      const { error } = await supabase.from('volunteer_attendance').insert([{
        volunteer_name: user.fullName,
        username: user.username,
        code_used: attendanceCode.trim().toUpperCase() // Auto uppercase for neatness
      }]);

      if (error) throw error;

      alert("Attendance marked! Awaiting admin approval.");
      setAttendanceCode(""); 
      fetchMyAttendance(user.username); // Refresh history
    } catch (error: any) {
      alert("Error submitting attendance: " + error.message);
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  // --- CONTRIBUTION SUBMISSION ---
  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile || !user) return;
    setIsSubmitting(true);
    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.username}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, receiptFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
      
      const { error: dbError } = await supabase.from('volunteer_contributions').insert([{
        volunteer_name: user.fullName, username: user.username, contribution_month: currentMonth, amount: amount, receipt_url: publicUrlData.publicUrl
      }]);
      if (dbError) throw dbError;

      alert("Contribution submitted! Waiting for Admin verification.");
      setReceiptFile(null); setAmount(250); 
      fetchMyContributions(user.username);
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const verifiedContributions = contributionHistory.filter(item => item.status === 'verified');
  const totalContributed = verifiedContributions.reduce((sum, item) => sum + Number(item.amount), 0);
  const monthsContributed = verifiedContributions.length;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans selection:bg-blue-500/30">
      
      <nav className="bg-[#0f172a] border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="font-black text-xl tracking-tight text-blue-500">YOUTH GUIDANCE</div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-300">Assalamualaikum, <span className="text-white font-bold">{user.fullName}</span></span>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* NOTIFICATIONS BANNER */}
        {notifications.length > 0 && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6">
            <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5"/> Latest Announcements</h3>
            <div className="space-y-4">
              {notifications.map((note) => (
                <div key={note.id} className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-white text-lg">{note.title}</h4>
                  <p className="text-slate-400 mt-1 text-sm">{note.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toggle Tabs */}
        <div className="flex bg-[#0f172a] p-1 rounded-2xl w-full max-w-md mx-auto border border-slate-800">
          <button onClick={() => setActiveTab("attendance")} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "attendance" ? "bg-slate-800 shadow-md text-blue-400" : "text-slate-500 hover:text-slate-300"}`}>Attendance</button>
          <button onClick={() => setActiveTab("contribution")} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "contribution" ? "bg-slate-800 shadow-md text-blue-400" : "text-slate-500 hover:text-slate-300"}`}>Contribution</button>
        </div>

        {/* TAB 1: ATTENDANCE */}
        {activeTab === "attendance" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
            {/* Mark Attendance Form */}
            <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-2xl">
              <div className="mb-6 border-b border-slate-800 pb-6 text-center">
                <ClipboardCheck className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white">Mark Your Attendance</h3>
                <p className="text-sm text-slate-400 mt-2">Enter the secret code provided by the Admin to log your presence.</p>
              </div>

              <form className="space-y-6 max-w-sm mx-auto" onSubmit={handleAttendanceSubmit}>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    required 
                    value={attendanceCode} 
                    onChange={(e) => setAttendanceCode(e.target.value)} 
                    className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-blue-500 font-mono text-center text-xl uppercase tracking-widest transition-colors" 
                    placeholder="SECRET CODE" 
                  />
                </div>
                <button type="submit" disabled={isSubmittingAttendance} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 shadow-lg disabled:opacity-50">
                  {isSubmittingAttendance ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : "Submit Code"}
                </button>
              </form>
            </div>

            {/* Attendance History */}
            <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6">Attendance Log</h3>
              {attendanceHistory.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-2xl">
                  <p className="text-slate-500 text-sm">You haven't logged any attendance yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attendanceHistory.map((record) => (
                    <div key={record.id} className="flex justify-between items-center bg-[#0B1120] p-4 rounded-xl border border-slate-800">
                      <div>
                        <p className="font-mono text-blue-400 font-bold">{record.code_used}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(record.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        {record.status === 'approved' ? (
                          <span className="bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Present</span>
                        ) : record.status === 'pending' ? (
                          <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
                        ) : (
                          <span className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Rejected</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: CONTRIBUTION (Kept exactly as it was) */}
        {activeTab === "contribution" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-lg">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Contributed</p>
                <h2 className="text-4xl font-black text-blue-500">Rs. {totalContributed}</h2>
              </div>
              <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-lg">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Months Contributed</p>
                <h2 className="text-4xl font-black text-white">{monthsContributed}</h2>
              </div>
            </div>

            <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-2xl">
              <div className="mb-6 border-b border-slate-800 pb-6">
                <h3 className="text-xl font-bold text-white">Monthly Contribution — {currentMonth}</h3>
                <p className="text-sm text-slate-400 mt-1">Minimum contribution is Rs. 250.</p>
              </div>

              <form className="space-y-6" onSubmit={handleContributionSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Amount you paid (Rs)</label>
                  <input type="number" min="250" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-blue-500 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Payment screenshot</label>
                  <label className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${receiptFile ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:bg-slate-800'}`}>
                    <UploadCloud className={`w-8 h-8 mb-2 ${receiptFile ? 'text-blue-500' : 'text-slate-400'}`} />
                    <p className={`font-semibold text-sm ${receiptFile ? 'text-blue-400' : 'text-slate-300'}`}>{receiptFile ? receiptFile.name : "Tap to upload a screenshot"}</p>
                    <input type="file" accept=".png, .jpg, .jpeg" className="hidden" onChange={(e) => { if (e.target.files && e.target.files[0]) setReceiptFile(e.target.files[0]); }}/>
                  </label>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 shadow-lg disabled:opacity-50">
                  {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : <><CheckCircle2 className="w-5 h-5" /> Submit Contribution</>}
                </button>
              </form>
            </div>

            <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6">Your History</h3>
              {contributionHistory.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-2xl">
                  <p className="text-slate-500 text-sm">You haven't submitted any contributions yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contributionHistory.map((record) => (
                    <div key={record.id} className="flex justify-between items-center bg-[#0B1120] p-4 rounded-xl border border-slate-800">
                      <div>
                        <p className="font-bold text-white text-lg">{record.contribution_month}</p>
                        <p className="text-sm text-slate-400 mt-0.5">Amount: <span className="text-blue-400 font-bold">Rs. {record.amount}</span></p>
                      </div>
                      <div>
                        {record.status === 'verified' ? (
                          <span className="bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Verified</span>
                        ) : record.status === 'pending' ? (
                          <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
                        ) : (
                          <span className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Rejected</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}