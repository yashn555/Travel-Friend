import React from "react";
import {
  FaPlane,
  FaMountain,
  FaMapMarkedAlt,
  FaCompass,
} from "react-icons/fa";

/* 🎨 EASY COLOR CONTROL (EDIT ONLY THIS) */
const THEME = {
  bgFrom: "#f2f0ed",   // yellow-300
  bgVia: "#eeedea",    // amber-400
  bgTo: "#ebe7e5",     // orange-400

  glowWhite: "rgba(235, 232, 232, 0.28)",
  glowYellow: "rgba(240, 239, 233, 0.35)",

  overlay: "rgba(230, 220, 220, 0.08)",
};

/* Floating Icon */
const FloatingIcon = ({ Icon, className, delay }) => (
  <div
    className={`absolute text-white/40 animate-floatSoft pointer-events-none ${className}`}
    style={{ animationDelay: delay }}
  >
    <Icon size={38} />
  </div>
);

const AdventureBackground = ({ header, children, footer }) => {
  return (
    <>
      {/* 🌞 FIXED BACKGROUND */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg,
            ${THEME.bgFrom},
            ${THEME.bgVia},
            ${THEME.bgTo}
          )`,
        }}
      >
        {/* ✨ GLOW LAYER */}
        <div
          className="absolute inset-0 animate-gradientFlow pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, ${THEME.glowWhite}, transparent 45%),
              radial-gradient(circle at 70% 70%, ${THEME.glowYellow}, transparent 45%)
            `,
          }}
        />

        
        {/* 🌫️ OVERLAY */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: THEME.overlay }}
        />
      </div>

      {/* 🧱 APP CONTENT */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="relative z-20">{header}</header>

        <main className="flex-grow relative z-10">
          {children}
        </main>

        <footer className="relative z-20">{footer}</footer>
      </div>

      {/* 🎬 ANIMATIONS */}
      <style jsx="true">{`
        @keyframes floatSoft {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(14px, -18px) rotate(4deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        .animate-floatSoft {
          animation: floatSoft 14s ease-in-out infinite;
        }

        @keyframes gradientFlow {
          0% { background-position: 0% 0%; }
          50% { background-position: 140% 140%; }
          100% { background-position: 0% 0%; }
        }

        .animate-gradientFlow {
          animation: gradientFlow 26s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default AdventureBackground;
