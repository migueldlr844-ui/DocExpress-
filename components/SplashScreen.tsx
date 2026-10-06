'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const WORDS = [
  'CONTRAT',
  'FACTURE',
  'CV',
  'QUITTANCE',
  'REÇU',
];
export default function SplashScreen({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<
    'logo' | 'words' | 'tagline'
  >('logo');
  useEffect(() => {
    const wordsTimer = setTimeout(() => {
      setPhase('words');
    }, 900);
    const taglineTimer = setTimeout(() => {
      setPhase('tagline');
    }, 1900);
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3300);
    return () => {
      clearTimeout(wordsTimer);
      clearTimeout(taglineTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);
  useEffect(() => {
    if (phase !== 'words') return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % WORDS.length);
    }, 250);
    return () => clearInterval(interval);
  }, [phase]);
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        minHeight: '100dvh',
        backgroundColor: '#050B14',
        color: '#FFFFFF',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        isolation: 'isolate',
      }}
    >
      {/* Lueur arrière */}
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.7,
        }}
        animate={{
          opacity: 0.16,
          scale: 1,
        }}
        transition={{
          duration: 1.4,
        }}
        style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          backgroundColor: '#4361EE',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />
      {/* Contenu */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: 'calc(100% - 48px)',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Icône */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.7,
            rotate: -8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 0,
          }}
          transition={{
            duration: 0.7,
            ease: 'easeOut',
          }}
          style={{
            width: '58px',
            height: '58px',
            borderRadius: '17px',
            background:
              'linear-gradient(135deg, #4361EE, #4CC9F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow:
              '0 12px 40px rgba(67, 97, 238, 0.25)',
            marginBottom: '18px',
          }}
        >
          <span
            style={{
              fontSize: '26px',
              fontWeight: 900,
              color: '#FFFFFF',
            }}
          >
            D
          </span>
        </motion.div>
        {/* Nom */}
        <motion.h1
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
            delay: 0.15,
          }}
          style={{
            margin: 0,
            fontSize: '30px',
            lineHeight: 1,
            letterSpacing: '0.18em',
            fontWeight: 800,
            color: '#FFFFFF',
          }}
        >
          DOCEXPRESS
        </motion.h1>
        {/* Ligne */}
        <motion.div
          initial={{
            width: 0,
            opacity: 0,
          }}
          animate={{
            width: '100%',
            opacity: 1,
          }}
          transition={{
            duration: 0.7,
            delay: 0.45,
          }}
          style={{
            height: '1px',
            marginTop: '25px',
            marginBottom: '25px',
            background:
              'linear-gradient(90deg, transparent, #4361EE, transparent)',
          }}
        />
        {/* Zone de texte */}
        <div
          style={{
            height: '55px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AnimatePresence mode="wait">
            {phase === 'words' && (
              <motion.div
                key={WORDS[index]}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                }}
                transition={{
                  duration: 0.18,
                }}
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.3em',
                  fontWeight: 700,
                  color: '#4CC9F0',
                }}
              >
                {WORDS[index]}
              </motion.div>
            )}
            {phase === 'tagline' && (
              <motion.p
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.45,
                }}
                style={{
                  margin: 0,
                  fontSize: '13px',
                  lineHeight: 1.7,
                  color: '#CBD5E1',
                  letterSpacing: '0.04em',
                }}
              >
                Vos documents. Votre activité.
                <br />
                <span
                  style={{
                    color: '#FFFFFF',
                    fontWeight: 600,
                  }}
                >
                  En quelques minutes.
                </span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        {/* Points de chargement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            display: 'flex',
            gap: '6px',
            marginTop: '30px',
          }}
        >
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              animate={{
                opacity: [0.25, 1, 0.25],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: dot * 0.15,
              }}
              style={{
                display: 'block',
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: '#4CC9F0',
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
