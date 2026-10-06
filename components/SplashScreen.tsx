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
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap';
export default function SplashScreen({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<
    'logo' | 'words' | 'tagline'
  >('logo');
  // Chargement des polices premium
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    link.dataset.docExpressFont = 'true';
    if (
      !document.querySelector(
        'link[data-doc-express-font="true"]'
      )
    ) {
      document.head.appendChild(link);
    }
    return () => {
      const existing = document.querySelector(
        'link[data-doc-express-font="true"]'
      );
      if (existing) {
        existing.remove();
      }
    };
  }, []);
  // Séquence d'ouverture
  useEffect(() => {
    const wordsTimer = setTimeout(() => {
      setPhase('words');
    }, 900);
    const taglineTimer = setTimeout(() => {
      setPhase('tagline');
    }, 2100);
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3600);
    return () => {
      clearTimeout(wordsTimer);
      clearTimeout(taglineTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);
  // Défilement des documents
  useEffect(() => {
    if (phase !== 'words') return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % WORDS.length);
    }, 420);
    return () => clearInterval(interval);
  }, [phase]);
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        minHeight: '100dvh',
        background:
          'radial-gradient(circle at 50% 42%, #101D3A 0%, #07101F 42%, #030811 100%)',
        color: '#FFFFFF',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        isolation: 'isolate',
        fontFamily:
          "'DM Sans', sans-serif",
      }}
    >
      {/* Halo lumineux principal */}
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.5,
        }}
        animate={{
          opacity: 0.2,
          scale: 1,
        }}
        transition={{
          duration: 1.8,
          ease: 'easeOut',
        }}
        style={{
          position: 'absolute',
          width: '340px',
          height: '340px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, #4361EE 0%, transparent 68%)',
          filter: 'blur(45px)',
          pointerEvents: 'none',
        }}
      />
      {/* Halo secondaire */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{
          duration: 2,
          delay: 0.4,
        }}
        style={{
          position: 'absolute',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, #4CC9F0 0%, transparent 70%)',
          filter: 'blur(40px)',
          transform:
            'translate(100px, -110px)',
          pointerEvents: 'none',
        }}
      />
      {/* Ligne décorative haute */}
      <motion.div
        initial={{
          scaleX: 0,
          opacity: 0,
        }}
        animate={{
          scaleX: 1,
          opacity: 0.5,
        }}
        transition={{
          duration: 1.1,
          delay: 0.25,
        }}
        style={{
          position: 'absolute',
          top: '18%',
          left: '50%',
          transform:
            'translateX(-50%)',
          width: '90px',
          height: '1px',
          background:
            'linear-gradient(90deg, transparent, #4CC9F0, transparent)',
        }}
      />
      {/* Contenu principal */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: 'calc(100% - 48px)',
          maxWidth: '430px',
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
            scale: 0.55,
            rotate: -12,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 0,
          }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            width: '62px',
            height: '62px',
            borderRadius: '19px',
            background:
              'linear-gradient(135deg, #4361EE 0%, #4CC9F0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow:
              '0 15px 50px rgba(67, 97, 238, 0.32)',
            marginBottom: '22px',
            position: 'relative',
          }}
        >
          {/* Reflet */}
          <div
            style={{
              position: 'absolute',
              top: '1px',
              left: '8px',
              right: '8px',
              height: '18px',
              borderRadius: '20px',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.24), transparent)',
            }}
          />
          <span
            style={{
              position: 'relative',
              fontFamily:
                "'Plus Jakarta Sans', sans-serif",
              fontSize: '27px',
              fontWeight: 800,
              letterSpacing: '-0.06em',
              color: '#FFFFFF',
            }}
          >
            D
          </span>
        </motion.div>
        {/* DOCEXPRESS */}
        <motion.h1
          initial={{
            opacity: 0,
            y: 18,
            letterSpacing: '0.38em',
          }}
          animate={{
            opacity: 1,
            y: 0,
            letterSpacing: '0.20em',
          }}
          transition={{
            duration: 0.9,
            delay: 0.12,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            margin: 0,
            paddingLeft: '0.20em',
            fontFamily:
              "'Plus Jakarta Sans', sans-serif",
            fontSize: '30px',
            lineHeight: 1,
            fontWeight: 800,
            color: '#FFFFFF',
          }}
        >
          DOCEXPRESS
        </motion.h1>
        {/* Sous-ligne */}
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
            duration: 0.9,
            delay: 0.55,
            ease: 'easeOut',
          }}
          style={{
            height: '1px',
            marginTop: '27px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(67,97,238,0.15) 15%, #4361EE 50%, rgba(76,201,240,0.15) 85%, transparent 100%)',
          }}
        />
        {/* Zone documents */}
        <div
          style={{
            height: '92px',
            width: '100%',
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
                  y: 22,
                  filter: 'blur(7px)',
                  scale: 0.94,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -22,
                  filter: 'blur(7px)',
                  scale: 1.04,
                }}
                transition={{
                  duration: 0.28,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  position: 'absolute',
                  fontFamily:
                    "'Plus Jakarta Sans', sans-serif",
                  fontSize:
                    'clamp(22px, 7vw, 32px)',
                  lineHeight: 1,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  paddingLeft: '0.16em',
                  color: '#F8FAFF',
                  textShadow:
                    '0 0 30px rgba(76,201,240,0.18)',
                }}
              >
                {WORDS[index]}
              </motion.div>
            )}
            {phase === 'tagline' && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 18,
                  filter: 'blur(5px)',
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                }}
                transition={{
                  duration: 0.75,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily:
                      "'DM Sans', sans-serif",
                    fontSize: '15px',
                    lineHeight: 1.65,
                    fontWeight: 400,
                    letterSpacing:
                      '0.015em',
                    color: '#CBD5E1',
                  }}
                >
                  Vos documents.
                  Votre activité.
                </p>
                <p
                  style={{
                    margin: '3px 0 0',
                    fontFamily:
                      "'Plus Jakarta Sans', sans-serif",
                    fontSize: '15px',
                    lineHeight: 1.5,
                    fontWeight: 600,
                    letterSpacing:
                      '0.01em',
                    color: '#FFFFFF',
                  }}
                >
                  En quelques minutes.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Indicateur de progression */}
        <motion.div
          initial={{
            opacity: 0,
            width: 0,
          }}
          animate={{
            opacity: 1,
            width: '90px',
          }}
          transition={{
            duration: 0.8,
            delay: 1,
          }}
          style={{
            height: '2px',
            background:
              'linear-gradient(90deg, #4361EE, #4CC9F0)',
            borderRadius: '999px',
            marginTop: '10px',
            boxShadow:
              '0 0 14px rgba(76,201,240,0.25)',
          }}
        />
        {/* Petit label */}
        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 0.55,
          }}
          transition={{
            duration: 0.8,
            delay: 1.2,
          }}
          style={{
            margin: '20px 0 0',
            fontFamily:
              "'DM Sans', sans-serif",
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#94A3B8',
          }}
        >
          DOCUMENTS • SIMPLE • RAPIDE
        </motion.p>
      </div>
      {/* Décoration bas gauche */}
      <motion.div
        initial={{
          opacity: 0,
          x: -30,
        }}
        animate={{
          opacity: 0.25,
          x: 0,
        }}
        transition={{
          duration: 1,
          delay: 0.5,
        }}
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '7%',
          width: '55px',
          height: '55px',
          borderLeft:
            '1px solid rgba(76,201,240,0.5)',
          borderBottom:
            '1px solid rgba(76,201,240,0.5)',
        }}
      />
      {/* Décoration haut droite */}
      <motion.div
        initial={{
          opacity: 0,
          x: 30,
        }}
        animate={{
          opacity: 0.2,
          x: 0,
        }}
        transition={{
          duration: 1,
          delay: 0.7,
        }}
        style={{
          position: 'absolute',
          top: '8%',
          right: '7%',
          width: '55px',
          height: '55px',
          borderTop:
            '1px solid rgba(67,97,238,0.6)',
          borderRight:
            '1px solid rgba(67,97,238,0.6)',
        }}
      />
    </motion.div>
  );
}
