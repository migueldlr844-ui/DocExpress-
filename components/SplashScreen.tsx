'use client';

import { motion } from 'framer-motion';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, delay: 1.8 }}
      onAnimationComplete={onFinish}
    >
      {/* Logo animé */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.1, 1], opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-24 h-24 mb-6 bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30 border border-amber-300/30"
      >
        <motion.span 
          animate={{ scale: [1, 1.2, 1] }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-4xl"
        >
          📄
        </motion.span>
      </motion.div>

      {/* Titre principal */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-3xl font-black tracking-widest text-amber-400 uppercase"
      >
        Doc<span className="text-white">Express</span>
      </motion.h1>

      {/* Sous-titre */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="text-xs tracking-wider mt-2 text-slate-400 font-medium uppercase"
      >
        Vos documents officiels en 2 minutes
      </motion.p>

      {/* Barre de chargement */}
      <motion.div className="w-32 h-1 bg-slate-800 rounded-full mt-8 overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 1.4, delay: 0.4, ease: "easeInOut" }}
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-300"
        />
      </motion.div>
    </motion.div>
  );
}
