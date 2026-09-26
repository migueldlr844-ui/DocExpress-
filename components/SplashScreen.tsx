'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const WORDS = ['CONTRAT', 'FACTURE', 'CV', 'QUITTANCE', 'REÇU'];

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'logo' | 'words' | 'tagline'>('logo');

  useEffect(() => {
    // Gestion du timing des phases
    const timer1 = setTimeout(() => setPhase('words'), 800);
    const timer2 = setTimeout(() => setPhase('tagline'), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    if (phase === 'words') {
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % WORDS.length);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const handleStart = () => {
    // Sauvegarde en cache pour ne plus l'afficher lors des prochaines visites
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenSplash', 'true');
    }
    onFinish();
  };

  return (
    <motion.div 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-[#050B14] text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans"
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Titre DOCEXPRESS */}
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl tracking-[0.25em] font-extrabold text-white font-mono"
        >
          DOCEXPRESS
        </motion.h1>

        {/* Ligne imprimante */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="h-[2px] bg-blue-500 my-5"
        />

        {/* Mots défilants */}
        {phase === 'words' && (
          <motion.div 
            key={WORDS[index]}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs tracking-[0.3em] font-mono text-blue-400 font-semibold uppercase h-6"
          >
            {WORDS[index]}
          </motion.div>
        )}

        {/* Tagline & Bouton d'entrée */}
        {phase === 'tagline' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center space-y-6 mt-2"
          >
            <p className="text-xs font-light text-slate-300 leading-relaxed max-w-[260px] tracking-wide">
              Vos documents. Votre activité.<br />
              <span className="text-white font-medium">En quelques minutes.</span>
            </p>
            
            <button 
              onClick={handleStart}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs tracking-widest uppercase transition-all flex items-center space-x-2 border border-blue-400/30"
            >
              <span>COMMENCER</span>
              <span>→</span>
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
