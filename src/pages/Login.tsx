import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Login() {
  const { login, user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center"
      >
        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold mb-6">
          IM
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">InventoryMaster</h1>
        <p className="text-slate-500 mb-8">Professional Inventory & Sales Management</p>
        
        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 py-3 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="mt-8 text-xs text-slate-400">
          Secure, real-time inventory management for modern businesses.
        </p>
      </motion.div>
    </div>
  );
}
