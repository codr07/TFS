import { motion } from 'framer-motion';

const Preloader = () => {
  return (
    <motion.div
      className="preloader-wrapper"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(180deg, #050505 0%, #000000 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* TFS Text Outline Animation */}
        <motion.svg width="400" height="150" viewBox="0 0 400 150" style={{ overflow: 'visible' }}>
          <motion.text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="100"
            fontFamily="var(--font-heading)"
            fontWeight="700"
            letterSpacing="0.1em"
            fill="transparent"
            stroke="var(--gold)"
            strokeWidth="1.5"
            initial={{ strokeDasharray: 500, strokeDashoffset: 500 }}
            animate={{ strokeDashoffset: 0, fill: "rgba(212, 175, 55, 1)" }}
            transition={{
              strokeDashoffset: { duration: 2, ease: "easeInOut" },
              fill: { duration: 0.8, delay: 1.8, ease: "easeIn" }
            }}
          >
            TFS
          </motion.text>

          {/* Subtitle fading in */}
          <motion.text
            x="50%"
            y="80%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="16"
            fontFamily="var(--font-body)"
            letterSpacing="0.3em"
            fill="var(--text-secondary)"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
          >
            THE FRETBOARD SOCIETY
          </motion.text>
        </motion.svg>

        {/* Minimalist Guitar / Loading Animation */}
        <div style={{ marginTop: '2rem', position: 'relative', width: '60px', height: '60px' }}>
          <motion.svg width="100%" height="100%" viewBox="0 0 100 100">
            {/* Guitar Body (Abstract) */}
            <motion.path
              d="M 50 15 C 40 15, 35 30, 25 45 C 5 70, 20 95, 50 95 C 80 95, 95 70, 75 45 C 65 30, 60 15, 50 15 Z"
              fill="none"
              stroke="var(--text-secondary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
            />
            {/* Soundhole Ripple */}
            <motion.circle
              cx="50" cy="65" r="12"
              fill="none"
              stroke="var(--gold)"
              strokeWidth="1.5"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, ease: "easeOut", repeat: Infinity, delay: 0.5 }}
            />
            {/* String Lines */}
            <motion.line x1="46" y1="15" x2="46" y2="50" stroke="var(--gold)" strokeWidth="1" opacity="0.5" />
            <motion.line x1="50" y1="15" x2="50" y2="50" stroke="var(--gold)" strokeWidth="1" opacity="0.5" />
            <motion.line x1="54" y1="15" x2="54" y2="50" stroke="var(--gold)" strokeWidth="1" opacity="0.5" />
          </motion.svg>
        </div>
        
      </div>
    </motion.div>
  );
};

export default Preloader;
