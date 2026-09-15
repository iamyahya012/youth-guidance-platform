"use client";
import { useState } from "react";
import { Lock, User, Mail, Phone, ArrowRight, ShieldCheck, UserPlus, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function SecurePortal() {
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (isLogin) {
      // --- REAL LOGIN LOGIC ---
      try {
        const { data, error } = await supabase
          .from('pending_applications')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .single(); // Looks for one exact match

        if (error || !data) {
          alert("Invalid username or password.");
        } else if (data.status === 'pending') {
          alert("Access Denied: Your account is still pending Admin approval.");
        } else if (data.status === 'approved') {
          // Success! Save basic info to local storage so the dashboard knows who logged in
          localStorage.setItem('yg_user', JSON.stringify({ 
            id: data.id, 
            fullName: data.full_name, 
            username: data.username 
          }));
          window.location.href = "/dashboard";
        }
      } catch (error: any) {
        alert("Login failed: " + error.message);
      } finally {
        setIsSubmitting(false);
      }

    } else {
      // --- SIGN UP LOGIC (Already working) ---
      try {
        const { error } = await supabase
          .from('pending_applications')
          .insert([{
            full_name: fullName,
            username: username,
            email: email,
            phone: phone,
            password: password
          }]);

        if (error) throw error;
        
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setIsLogin(true);
          setFullName(""); setUsername(""); setEmail(""); setPhone(""); setPassword("");
        }, 4000);

      } catch (error: any) {
        alert("Error submitting application: " + error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 selection:bg-blue-200">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT SIDE - BRANDING */}
        <div className="md:w-5/12 bg-blue-600 p-10 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="font-black text-2xl tracking-tighter mb-10">YOUTH GUIDANCE</div>
            <h2 className="text-4xl font-extrabold leading-tight mb-4">Empower the Next Generation.</h2>
            <p className="text-blue-200 font-medium leading-relaxed">
              Welcome to the private team portal. This system is strictly for authorized volunteers. 
              New applications must be verified and approved by the system administrator.
            </p>
          </div>
          <div className="relative z-10 mt-12 flex items-center gap-2 text-sm font-bold text-blue-200 bg-blue-700/30 w-max px-4 py-2 rounded-full border border-blue-500/30">
            <ShieldCheck className="w-4 h-4" /> Secure Internal System
          </div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        </div>

        {/* RIGHT SIDE - FORMS */}
        <div className="md:w-7/12 p-8 md:p-12 bg-slate-50 dark:bg-slate-950 relative overflow-y-auto max-h-[90vh]">
          
          {showSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center py-10">
              <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold dark:text-white mb-2">Application Received!</h3>
              <p className="text-slate-500">Your request has been securely sent to the Admin. Please wait for approval before logging in.</p>
            </motion.div>
          ) : (
            <>
              {/* Toggle Buttons */}
              <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl w-full max-w-xs mb-8 mx-auto md:mx-0">
                <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${isLogin ? "bg-white dark:bg-slate-900 shadow-md text-blue-600" : "text-slate-500 hover:text-slate-700"}`}>Log In</button>
                <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${!isLogin ? "bg-white dark:bg-slate-900 shadow-md text-blue-600" : "text-slate-500 hover:text-slate-700"}`}>Apply for Team</button>
              </div>

              <AnimatePresence mode="wait">
                {isLogin ? (
                  /* LOGIN FORM */
                  <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h3 className="text-2xl font-bold mb-1 dark:text-white">Welcome Back</h3>
                      <p className="text-slate-500 text-sm mb-6">Enter your credentials to access your dashboard.</p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
                        <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="e.g. iamyahya012" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" placeholder="••••••••" />
                      </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg mt-6 disabled:opacity-50">
                      {isSubmitting ? "Authenticating..." : <>Access Dashboard <ArrowRight className="w-5 h-5" /></>}
                    </button>
                  </motion.form>
                ) : (
                  /* SIGN UP FORM (Kept exactly the same) */
                  <motion.form key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-1 dark:text-white">Volunteer Application</h3>
                      <p className="text-slate-500 text-sm mb-6">Submit your details. The admin will review your account.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-slate-400" /></div>
                          <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="Yahya Khalil" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserPlus className="h-4 w-4 text-slate-400" /></div>
                          <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="iamyahya012" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-slate-400" /></div>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="yahyaafridi72@gmail.com" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-slate-400" /></div>
                        <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="+92 311 5391696" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Create Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-slate-400" /></div>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="••••••••" />
                      </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white font-bold py-4 rounded-xl transition-transform active:scale-95 mt-4 disabled:opacity-50">
                      {isSubmitting ? "Sending..." : "Submit Application"}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}