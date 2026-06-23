"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Cloud, Navigation, Loader2 } from "lucide-react";
import { CoordinateDisplay } from "./CoordinateDisplay";
import { reverseGeocode, getLocalTime } from "../lib/location-utils";

interface LocationConfirmCardProps {
  lat: number;
  lon: number;
  onConfirm: () => void;
  onDismiss: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.25, ease: 'easeIn', delay: 0.1 }
  }
};

const cardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.75,
    y: 40,
    rotateX: 12,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 28,
      mass: 0.8,
      opacity: { duration: 0.2, ease: 'easeOut' },
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -20,
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 1, 1] as const
    }
  }
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const }
  }
};

const cornerVariants = {
  hidden: { width: 0, height: 0, opacity: 0 },
  visible: {
    width: 16,
    height: 16,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
      delay: 0.2
    }
  }
};

export const LocationConfirmCard: React.FC<LocationConfirmCardProps> = ({
  lat,
  lon,
  onConfirm,
  onDismiss
}) => {
  const [cityName, setCityName] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string | null>(null);
  const [localTime, setLocalTime] = useState<string>('');
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [cardPhase, setCardPhase] = useState<'entering' | 'idle' | 'confirming' | 'exiting'>('entering');

  useEffect(() => {
    let mounted = true;
    
    async function loadLocation() {
      setIsLoadingGeo(true);
      const data = await reverseGeocode(lat, lon);
      if (mounted && data) {
        setCityName(data.city);
        setCountryName(data.country);
        setIsLoadingGeo(false);
      }
      
      if (mounted) {
        setLocalTime(getLocalTime(lon));
      }
    }
    
    loadLocation();
    
    // Switch to idle phase after entrance
    const t = setTimeout(() => {
      if (mounted) setCardPhase('idle');
    }, 1000);
    
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [lat, lon]);

  const handleConfirm = () => {
    setCardPhase('confirming');
    setIsConfirming(true);
    
    // Simulate trajectory calculation phase
    setTimeout(() => {
      setCardPhase('exiting');
      onConfirm();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {(cardPhase === 'entering' || cardPhase === 'idle' || cardPhase === 'confirming') && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Backdrop */}
          <motion.div 
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
            onClick={cardPhase === 'confirming' ? undefined : onDismiss}
          />

          {/* Card */}
          <motion.div 
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformPerspective: 1200 }}
            className="relative z-10 w-[420px] max-w-[90vw] bg-gradient-to-b from-[#0d1f3c] to-[#060e1f] border border-cyan-500/20 rounded-2xl p-8 pointer-events-auto overflow-hidden shadow-[0_0_40px_rgba(0,243,255,0.1)]"
          >
            {/* Corner accents */}
            <motion.div variants={cornerVariants} className="absolute top-2 left-2 border-t-[1.5px] border-l-[1.5px] border-cyan-400/50" />
            <motion.div variants={cornerVariants} className="absolute top-2 right-2 border-t-[1.5px] border-r-[1.5px] border-cyan-400/50" />
            <motion.div variants={cornerVariants} className="absolute bottom-2 left-2 border-b-[1.5px] border-l-[1.5px] border-cyan-400/50" />
            <motion.div variants={cornerVariants} className="absolute bottom-2 right-2 border-b-[1.5px] border-r-[1.5px] border-cyan-400/50" />

            {/* Scan line shimmer */}
            <motion.div 
              animate={{ y: ['-100%', '400%'] }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                repeatDelay: 1.2,
                ease: 'linear'
              }}
              className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none z-0" 
            />

            {/* Card content container with staggered reveals */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="relative z-10 flex flex-col gap-6"
            >
              {/* Header: Location icon + city/country name */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2 border-b border-cyan-500/10 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <MapPin className="w-5 h-5" />
                    <span className="font-mono text-xs font-bold tracking-widest uppercase">Target Lock</span>
                  </div>
                  {isLoadingGeo && (
                    <Loader2 className="w-4 h-4 text-cyan-400/50 animate-spin" />
                  )}
                </div>
                <div className="min-h-[60px] flex flex-col justify-end">
                  <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-wide">
                    {isLoadingGeo ? 'Acquiring...' : cityName}
                  </h2>
                  <p className="text-sm font-mono text-slate-400 uppercase tracking-wider mt-1">
                    {isLoadingGeo ? 'Sat-Link Active' : countryName}
                  </p>
                </div>
              </motion.div>

              {/* Coordinate display */}
              <motion.div variants={itemVariants}>
                <CoordinateDisplay lat={lat} lon={lon} />
              </motion.div>

              {/* Local time row */}
              <motion.div variants={itemVariants} className="flex items-center gap-4 bg-[#050b18]/40 border border-white/5 rounded-lg p-3">
                <Clock className="w-4 h-4 text-[#ff007f]" />
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Local Time (Estimated)</span>
                  <span className="font-mono text-sm text-white font-bold">{localTime || '00:00'}</span>
                </div>
              </motion.div>

              {/* Sky preview row */}
              <motion.div variants={itemVariants} className="flex items-center gap-4 bg-[#050b18]/40 border border-white/5 rounded-lg p-3">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Sky Condition Profile</span>
                  <span className="font-mono text-xs text-white font-bold tracking-wider">CLEAR VISIBILITY</span>
                </div>
              </motion.div>

              {/* Action buttons row */}
              <motion.div variants={itemVariants} className="flex items-center justify-end gap-3 mt-2">
                <button 
                  onClick={onDismiss}
                  disabled={isConfirming}
                  className="px-4 py-2 rounded-lg font-mono text-xs font-bold tracking-widest text-slate-400 hover:text-white transition-colors duration-200 disabled:opacity-50"
                >
                  ABORT
                </button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className={`
                    relative px-6 py-2.5 rounded-lg font-mono text-xs font-bold tracking-widest uppercase overflow-hidden
                    ${isConfirming ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-500 shadow-[0_0_15px_rgba(0,243,255,0.3)]' : 'bg-cyan-500 hover:bg-cyan-400 text-[#060e1f]'}
                    transition-all duration-300
                  `}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isConfirming ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        Initialize Array
                      </>
                    )}
                  </span>
                </motion.button>
              </motion.div>

            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
