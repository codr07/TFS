import { motion } from 'framer-motion';

const GuitarBackground = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: -1, /* -1 places it behind all page content but above the mac-window-wrapper background */
      overflow: 'hidden',
    }}>
      <motion.svg
        viewBox="0 0 400 1000"
        preserveAspectRatio="xMinYMid slice"
        style={{
          position: 'absolute',
          left: '0',
          top: '0',
          height: '100vh',
          width: 'clamp(250px, 40vh, 400px)', /* Maintains aspect ratio tied to screen height */
          opacity: 0.5,
          filter: 'drop-shadow(0px 0px 10px rgba(212,175,55,0.4))'
        }}
        initial={{ y: 50, opacity: 0 }}
        animate={{
          y: [0, -10, 0],
          opacity: 0.5,
        }}
        transition={{
          y: {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          },
          opacity: {
            duration: 2,
            ease: "easeOut"
          }
        }}
      >
        {/* Guitar Body Outline (Left Half) */}
        <motion.path
          d="
            M 300 -20
            L 300 250
            C 200 250, 100 320, 100 400
            C 100 450, 160 470, 160 520
            C 160 580, 20 650, 20 780
            C 20 920, 150 980, 300 1020
          "
          fill="none"
          stroke="var(--gold)"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 5, ease: "easeInOut" }}
        />

        {/* Guitar strings (left half of strings) */}
        <motion.line x1="260" y1="-20" x2="260" y2="700" stroke="var(--gold)" strokeWidth="1" strokeOpacity="0.4"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1, duration: 2 }} />
        <motion.line x1="275" y1="-20" x2="275" y2="700" stroke="var(--gold)" strokeWidth="1" strokeOpacity="0.4"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.2, duration: 2 }} />
        <motion.line x1="290" y1="-20" x2="290" y2="700" stroke="var(--gold)" strokeWidth="1" strokeOpacity="0.4"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.4, duration: 2 }} />

        {/* Soundhole (Left Half) */}
        <motion.path
          d="M 300 350 A 75 75 0 0 0 300 500"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.6, duration: 1.5 }}
        />

        {/* Bridge (Left Half) */}
        <motion.rect
          x="250" y="680" width="50" height="20"
          fill="none" stroke="var(--gold)" strokeWidth="2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }}
        />
      </motion.svg>
    </div>
  );
};

export default GuitarBackground;
