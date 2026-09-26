'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ROTATING_ITEMS = ['CV', 'FACTURE', 'CONTRAT', 'QUITTANCE', 'REÇU'];

export default function HeroText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_ITEMS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center py-10 px-4 space-y-3">
      {/* Phrase d'accroche */}
      <p className="text-[11px] tracking-[0.2em] font-mono text-slate-400 uppercase">
        Vous avez les informations. Nous avons le document.
      </p>

      {/* Mot qui change dynamiquement */}
      <div className="h-10 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={ROTATING_ITEMS[index]}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl md:text-3xl font-extrabold tracking-widest text-blue-500 font-mono"
          >
            {ROTATING_ITEMS[index]}.
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Phrase de conclusion */}
      <p className="text-xs text-slate-300 font-light tracking-wide">
        Tout ça, dans un seul endroit.
      </p>
    </div>
  );
}
