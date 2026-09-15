"use client";
import { useState, useEffect } from "react";
import { Users, BadgeDollarSign, BellRing, ShieldAlert, CheckCircle, XCircle, Trash2, Send, Lock, UserPlus, ShieldCheck, Edit, X, ExternalLink, ClipboardCheck, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [adminRole, setAdminRole] = useState(""); 
  const [activeTab, setActiveTab] = useState("team");

  // Database States
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<any[]>([]);
  const [allContributions, setAllContributions] = useState<any[]>([]);
  const [activeCodes, setActiveCodes] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [allNotifications, setAllNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit / Add States for Users
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formFullName, setFormFullName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState(""); 
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Notification States
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Edit Notification States
  const [editingNotification, setEditingNotification] = useState<any>(null);
  const [editNotifyTitle, setEditNotifyTitle] = useState("");
  const [editNotifyMessage, setEditNotifyMessage] = useState("");

  // Attendance States
  const [newCode, setNewCode] = useState("");
  const [expiryHours, setExpiryHours] = useState("24");

  useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === "team") fetchAllUsers();
      if (activeTab === "contributions") fetchContributions();
      if (activeTab === "attendance") fetchAttendanceData();
      if (activeTab === "notify") fetchNotifications();
    }
  }, [isLoggedIn, activeTab]);

  const fetchAllUsers = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('pending_applications').select('*').order('created_at', { ascending: false });
    if (data) {
      setPendingUsers(data.filter(user => user.status === 'pending'));
      setApprovedUsers(data.filter(user => user.status === 'approved'));
    }
    setIsLoading(false);
  };

  const fetchContributions = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('volunteer_contributions').select('*').order('created_at', { ascending: false });
    if (data) setAllContributions(data);
    setIsLoading(false);
  };

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    const { data: codes } = await supabase.from('attendance_codes').select('*').order('created_at', { ascending: false });
    if (codes) setActiveCodes(codes);
    
    const { data: records } = await supabase.from('volunteer_attendance').select('*').order('created_at', { ascending: false });
    if (records) setAttendanceRecords(records);
    setIsLoading(false);
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('team_notifications').select('*').order('created_at', { ascending: false });
    if (data) setAllNotifications(data);
    setIsLoading(false);
  };

  // --- NOTIFICATION FUNCTIONS ---
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    const { error } = await supabase.from('team_notifications').insert([{ title: notifyTitle, message: notifyMessage }]);
    setIsSending(false);
    if (!error) { 
      alert("Notification Broadcasted!"); 
      setNotifyTitle(""); 
      setNotifyMessage(""); 
      fetchNotifications();
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const confirm = window.confirm("Are you sure you want to delete this announcement?");
    if (!confirm) return;
    const { error } = await supabase.from('team_notifications').delete().eq('id', id);
    if (!error) fetchNotifications();
  };

  const openEditNotification = (note: any) => {
    setEditingNotification(note);
    setEditNotifyTitle(note.title);
    setEditNotifyMessage(note.message);
  };

  const handleUpdateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    const { error } = await supabase.from('team_notifications').update({
      title: editNotifyTitle,
      message: editNotifyMessage
    }).eq('id', editingNotification.id);
    setIsUpdating(false);

    if (!error) {
      alert("Notification updated!");
      setEditingNotification(null);
      fetchNotifications();
    } else {
      alert("Error updating notification: " + error.message);
    }
  };


  // --- ATTENDANCE FUNCTIONS ---
  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + parseInt(expiryHours));
    const { error } = await supabase.from('attendance_codes').insert([{ code: newCode, expires_at: expiryDate.toISOString() }]);
    if (!error) { alert("Code Generated!"); setNewCode(""); fetchAttendanceData(); }
  };
  const handleDeleteCode = async (id: string) => { await supabase.from('attendance_codes').delete().eq('id', id); fetchAttendanceData(); };
  const handleApproveAttendance = async (id: string) => { await supabase.from('volunteer_attendance').update({ status: 'approved' }).eq('id', id); fetchAttendanceData(); };
  const handleRejectAttendance = async (id: string) => { await supabase.from('volunteer_attendance').update({ status: 'rejected' }).eq('id', id); fetchAttendanceData(); };

  // --- TEAM & CONTRIBUTION FUNCTIONS ---
  const handleApprove = async (id: string) => { await supabase.from('pending_applications').update({ status: 'approved' }).eq('id', id); fetchAllUsers(); };
  const handleRejectOrRemove = async (id: string, isRemoval = false) => {
    const confirm = window.confirm(isRemoval ? "Permanently remove this volunteer?" : "Reject application?");
    if (!confirm) return;
    await supabase.from('pending_applications').delete().eq('id', id); fetchAllUsers();
  };
  const openEditModal = (user: any) => { setEditingUser(user); setFormFullName(user.full_name); setFormUsername(user.username); setFormEmail(user.email); setFormPhone(user.phone); };
  const openAddModal = () => { setFormFullName(""); setFormUsername(""); setFormEmail(""); setFormPhone(""); setFormPassword(""); setIsAddModalOpen(true); };
  
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    if (editingUser) {
      const { error } = await supabase.from('pending_applications').update({ full_name: formFullName, username: formUsername, email: formEmail, phone: formPhone }).eq('id', editingUser.id);
      setIsUpdating(false);
      if (!error) { alert("Updated!"); setEditingUser(null); fetchAllUsers(); }
    } else {
      const { error } = await supabase.from('pending_applications').insert([{ full_name: formFullName, username: formUsername, email: formEmail, phone: formPhone, password: formPassword, status: 'approved' }]);
      setIsUpdating(false);
      if (!error) { alert("New Volunteer Added!"); setIsAddModalOpen(false); fetchAllUsers(); } else { alert(error.message); }
    }
  };

  const handleVerifyContribution = async (id: string) => { await supabase.from('volunteer_contributions').update({ status: 'verified' }).eq('id', id); fetchContributions(); };
  const handleRejectContribution = async (id: string) => { await supabase.from('volunteer_contributions').update({ status: 'rejected' }).eq('id', id); fetchContributions(); };
  const handleDeleteContribution = async (id: string) => { await supabase.from('volunteer_contributions').delete().eq('id', id); fetchContributions(); };
  
  // --- AUTH LOGIC ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "Myahya_012" && password === "Myahya_021") { setIsLoggedIn(true); setAdminRole("main_head"); setError(""); } 
    else { setError("Unauthorized access."); }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-slate-900 p-10 rounded-[2rem] shadow-2xl border border-red-500/30">
          <div className="text-center mb-8"><ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" /><h1 className="text-3xl font-black text-white tracking-wider">@DMIN <span className="text-red-500">PORTAL</span></h1></div>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center font-semibold">{error}</div>}
            <div className="space-y-2"><label className="text-sm font-bold text-slate-400">Admin Username</label><input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-red-500 text-white" /></div>
            <div className="space-y-2"><label className="text-sm font-bold text-slate-400">Master Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-red-500 text-white" /></div>
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"><Lock className="w-5 h-5" /> Authenticate</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-red-500/30 relative">
      
      {/* USER EDIT / ADD MODAL */}
      <AnimatePresence>
        {(editingUser || isAddModalOpen) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-lg relative">
              <button onClick={() => { setEditingUser(null); setIsAddModalOpen(false); }} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                {editingUser ? <Edit className="w-5 h-5 text-blue-500" /> : <UserPlus className="w-5 h-5 text-green-500" />} 
                {editingUser ? "Edit Volunteer" : "Add New Volunteer"}
              </h2>
              <form onSubmit={handleSaveUser} className="space-y-4">
                <div><label className="text-xs font-bold text-slate-400 uppercase">Full Name</label><input type="text" required value={formFullName} onChange={(e) => setFormFullName(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-blue-500 text-white" /></div>
                <div><label className="text-xs font-bold text-slate-400 uppercase">Username</label><input type="text" required value={formUsername} onChange={(e) => setFormUsername(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-blue-500 text-white" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-400 uppercase">Email</label><input type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-blue-500 text-white" /></div>
                  <div><label className="text-xs font-bold text-slate-400 uppercase">Phone</label><input type="text" required value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-blue-500 text-white" /></div>
                </div>
                {!editingUser && (
                  <div><label className="text-xs font-bold text-slate-400 uppercase">Set Password</label><input type="password" required value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-blue-500 text-white" /></div>
                )}
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => { setEditingUser(null); setIsAddModalOpen(false); }} className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700">Cancel</button>
                  <button type="submit" disabled={isUpdating} className={`flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 ${editingUser ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                    {isUpdating ? "Saving..." : (editingUser ? "Save Changes" : "Create Volunteer")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION EDIT MODAL */}
      <AnimatePresence>
        {editingNotification && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-lg relative">
              <button onClick={() => setEditingNotification(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Edit className="w-5 h-5 text-blue-500" /> Edit Notification</h2>
              <form onSubmit={handleUpdateNotification} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Announcement Title</label>
                  <input type="text" required value={editNotifyTitle} onChange={(e) => setEditNotifyTitle(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-red-500 text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Message Content</label>
                  <textarea required rows={5} value={editNotifyMessage} onChange={(e) => setEditNotifyMessage(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-red-500 text-white"></textarea>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setEditingNotification(null)} className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700">Cancel</button>
                  <button type="submit" disabled={isUpdating} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3"><ShieldAlert className="w-6 h-6 text-red-500" /><div className="font-black text-xl tracking-wider text-white">@DMIN <span className="text-slate-500 font-medium text-sm ml-2">Headquarters</span></div></div>
        <div className="flex items-center gap-4"><span className="text-sm font-medium text-slate-400">Logged in as: <span className="text-white font-bold">{username}</span></span><button onClick={() => setIsLoggedIn(false)} className="text-xs bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white font-bold">Logout</button></div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR */}
        <div className="w-full md:w-64 space-y-2 flex-shrink-0">
          <button onClick={() => setActiveTab("team")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === "team" ? "bg-red-600 text-white shadow-lg shadow-red-500/20" : "text-slate-400 hover:bg-slate-800"}`}><Users className="w-5 h-5" /> Manage Team</button>
          <button onClick={() => setActiveTab("attendance")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === "attendance" ? "bg-red-600 text-white shadow-lg shadow-red-500/20" : "text-slate-400 hover:bg-slate-800"}`}><ClipboardCheck className="w-5 h-5" /> Attendance</button>
          <button onClick={() => setActiveTab("contributions")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === "contributions" ? "bg-red-600 text-white shadow-lg shadow-red-500/20" : "text-slate-400 hover:bg-slate-800"}`}><BadgeDollarSign className="w-5 h-5" /> All Contributions</button>
          <button onClick={() => setActiveTab("notify")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === "notify" ? "bg-red-600 text-white shadow-lg shadow-red-500/20" : "text-slate-400 hover:bg-slate-800"}`}><BellRing className="w-5 h-5" /> Notifications</button>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 bg-slate-950 rounded-3xl border border-slate-800 p-8 shadow-2xl overflow-y-auto max-h-[80vh]">
          
          {/* TAB 1: MANAGE TEAM (Minified for display, logic is still fully active) */}
          {activeTab === "team" && (
             <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
             <div className="flex justify-between items-center border-b border-slate-800 pb-4">
               <div><h2 className="text-2xl font-bold text-white">Manage Volunteers</h2></div>
               <button onClick={openAddModal} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2"><UserPlus className="w-4 h-4"/> Add Volunteer</button>
             </div>
             <div className="bg-slate-900 border border-yellow-500/30 rounded-2xl p-6 mb-8">
               <h3 className="text-lg font-bold text-yellow-500 mb-4">Pending Approvals <span className="bg-yellow-500 text-black px-2 py-0.5 rounded-full text-xs">{pendingUsers.length} New</span></h3>
               <div className="space-y-3">
                 {pendingUsers.map((user) => (
                   <div key={user.id} className="flex justify-between bg-slate-950 p-4 rounded-xl border border-slate-800 items-center">
                     <div><p className="font-bold text-white">{user.full_name} <span className="text-slate-500 text-sm">(@{user.username})</span></p></div>
                     <div className="flex gap-2"><button onClick={() => handleApprove(user.id)} className="px-4 py-2 bg-green-500/20 text-green-500 rounded-lg text-sm font-bold">Approve</button></div>
                   </div>
                 ))}
               </div>
             </div>
             <div>
               <h3 className="text-lg font-bold text-white mb-4">Active Team ({approvedUsers.length})</h3>
               <div className="space-y-3">
                 {approvedUsers.map((user) => (
                   <div key={user.id} className="flex justify-between bg-slate-900 p-4 rounded-xl border border-slate-800 items-center">
                     <div className="flex items-center gap-4"><div className="w-10 h-10 bg-blue-900 text-blue-400 rounded-full flex items-center justify-center font-bold">{user.full_name.substring(0, 2).toUpperCase()}</div><div><p className="font-bold text-white">{user.full_name}</p><p className="text-xs text-slate-400">@{user.username}</p></div></div>
                     <div className="flex gap-2">
                        <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleRejectOrRemove(user.id, true)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </motion.div>
          )}

          {/* TAB 2: ATTENDANCE (Minified for display, logic active) */}
          {activeTab === "attendance" && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <h2 className="text-2xl font-bold border-b border-slate-800 pb-4 text-white">Attendance Management</h2>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-blue-500" /> Generate Secret Code</h3>
                <form className="flex gap-4 items-end" onSubmit={handleGenerateCode}>
                  <div className="flex-1"><label className="text-xs font-bold text-slate-400 uppercase">Secret Code Word</label><input type="text" required value={newCode} onChange={(e) => setNewCode(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-blue-500 text-white font-mono" placeholder="e.g. MEETING-789" /></div>
                  <div className="w-48"><label className="text-xs font-bold text-slate-400 uppercase">Expires In</label><select value={expiryHours} onChange={(e) => setExpiryHours(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-blue-500 text-white"><option value="1">1 Hour</option><option value="12">12 Hours</option><option value="24">24 Hours</option><option value="48">48 Hours</option></select></div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl h-[52px]">Generate</button>
                </form>
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-bold text-slate-500 uppercase">Active Codes</h4>
                  {activeCodes.map(code => (
                    <div key={code.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div><p className="font-mono text-blue-400 font-bold">{code.code}</p><p className="text-xs text-slate-500">Expires: {new Date(code.expires_at).toLocaleString()}</p></div>
                      <button onClick={() => handleDeleteCode(code.id)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Volunteer Attendance Records</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="border-b border-slate-800 text-slate-400 text-sm"><th className="pb-3 font-semibold">Volunteer</th><th className="pb-3 font-semibold">Code Used</th><th className="pb-3 font-semibold">Time Logged</th><th className="pb-3 font-semibold text-right">Status / Actions</th></tr></thead>
                    <tbody className="text-sm text-slate-300">
                      {attendanceRecords.map((record) => (
                        <tr key={record.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                          <td className="py-4 font-bold text-white">{record.volunteer_name} <br/><span className="text-xs text-slate-500 font-normal">@{record.username}</span></td>
                          <td className="py-4 font-mono text-blue-400">{record.code_used}</td>
                          <td className="py-4">{new Date(record.created_at).toLocaleString()}</td>
                          <td className="py-4 flex justify-end gap-2 items-center">
                            {record.status === 'pending' ? (
                              <><button onClick={() => handleApproveAttendance(record.id)} className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                              <button onClick={() => handleRejectAttendance(record.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white" title="Reject"><XCircle className="w-4 h-4" /></button></>
                            ) : record.status === 'approved' ? (<span className="text-green-500 font-bold text-xs">Approved</span>) : (<span className="text-red-500 font-bold text-xs">Rejected</span>)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: CONTRIBUTIONS */}
          {activeTab === "contributions" && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-slate-800 pb-4 text-white">All Volunteer Contributions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="border-b border-slate-800 text-slate-400 text-sm"><th className="pb-3 font-semibold">Volunteer</th><th className="pb-3 font-semibold">Amount</th><th className="pb-3 font-semibold">Receipt</th><th className="pb-3 font-semibold text-right">Status</th></tr></thead>
                  <tbody className="text-sm text-slate-300">
                    {allContributions.map((contrib) => (
                      <tr key={contrib.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                        <td className="py-4"><p className="font-bold text-white">{contrib.volunteer_name}</p></td>
                        <td className="py-4 text-green-400 font-bold">Rs. {contrib.amount}</td>
                        <td className="py-4"><a href={contrib.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-slate-800 text-blue-400 px-3 py-1.5 rounded-lg">View Image</a></td>
                        <td className="py-4 flex justify-end gap-2 items-center">
                          {contrib.status === 'pending' ? (
                            <><button onClick={() => handleVerifyContribution(contrib.id)} className="p-2 text-green-500"><CheckCircle className="w-4 h-4" /></button><button onClick={() => handleRejectContribution(contrib.id)} className="p-2 text-red-500"><XCircle className="w-4 h-4" /></button></>
                          ) : contrib.status === 'verified' ? <span className="text-green-500 text-xs font-bold">Verified</span> : <span className="text-red-500 text-xs font-bold">Rejected</span>}
                          <button onClick={() => handleDeleteContribution(contrib.id)} className="p-2 text-slate-500 hover:text-red-500 ml-2" title="Delete Record"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 4: NOTIFICATIONS (Now with History, Edit, and Delete!) */}
          {activeTab === "notify" && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
              
              {/* Send Notification Form */}
              <div>
                <h2 className="text-2xl font-bold border-b border-slate-800 pb-4 text-white mb-6">Send New Notification</h2>
                <form className="space-y-4 max-w-xl bg-slate-900 p-6 rounded-2xl border border-slate-800" onSubmit={handleSendNotification}>
                  <div><label className="text-sm font-semibold text-slate-400">Target Audience</label><select className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"><option>All Active Volunteers</option></select></div>
                  <div><label className="text-sm font-semibold text-slate-400">Title</label><input type="text" required value={notifyTitle} onChange={(e)=>setNotifyTitle(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-red-500 text-white" placeholder="e.g. Urgent Meeting" /></div>
                  <div><label className="text-sm font-semibold text-slate-400">Message</label><textarea required rows={4} value={notifyMessage} onChange={(e)=>setNotifyMessage(e.target.value)} className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 outline-none focus:border-red-500 text-white" placeholder="Type your message..."></textarea></div>
                  <button type="submit" disabled={isSending} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 w-full disabled:opacity-50">
                    <Send className="w-4 h-4" /> {isSending ? "Sending..." : "Broadcast Announcement"}
                  </button>
                </form>
              </div>

              {/* Notification History List */}
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Notification History</h3>
                <div className="space-y-4">
                  {allNotifications.length === 0 ? (
                    <p className="text-slate-500 text-sm">No notifications have been sent yet.</p>
                  ) : (
                    allNotifications.map((note) => (
                      <div key={note.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-lg">{note.title}</h4>
                          <p className="text-slate-400 mt-2 text-sm whitespace-pre-wrap leading-relaxed">{note.message}</p>
                          <p className="text-xs text-slate-500 mt-4 flex items-center gap-1"><Clock className="w-3 h-3" /> Sent: {new Date(note.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => openEditNotification(note)} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors" title="Edit Announcement">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteNotification(note.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Delete Announcement">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}