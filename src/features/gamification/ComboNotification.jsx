import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { useGamificationStore } from '../../store/gamificationStore';

function ComboNotification() {
  const { comboNotification, clearComboNotification } = useGamificationStore();
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (comboNotification) {
      // Generate electric particles
      const newParticles = Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 80,
        y: 50 + (Math.random() - 0.5) * 60,
        delay: Math.random() * 0.2,
        duration: 0.8 + Math.random() * 0.4,
        size: 3 + Math.random() * 4,
      }));
      setParticles(newParticles);
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(clearComboNotification, 300);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [comboNotification]);

  if (!comboNotification) return null;

  return (
    <div
      className={`fixed inset-0 z-[250] pointer-events-none flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Electric glow backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(circle at center, rgba(250, 204, 21, 0.12) 0%, transparent 50%)',
        }}
      />

      {/* Electric particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: 'rgba(250, 204, 21, 0.9)',
            boxShadow: `0 0 ${particle.size * 3}px rgba(250, 204, 21, 0.8)`,
            animation: `combo-spark ${particle.duration}s ease-out ${particle.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}

      {/* Center content */}
      <div
        className={`relative transition-all duration-400 ease-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(250, 204, 21, 0.4), transparent 70%)',
            transform: 'scale(3)',
          }}
        />

        {/* Main badge */}
        <div
          className="relative w-28 h-28 rounded-full flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.95), rgba(245, 158, 11, 0.95))',
            boxShadow:
              '0 8px 40px rgba(250, 204, 21, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
          }}
        >
          <Zap className="w-10 h-10 text-white mb-1" strokeWidth={2.5} fill="currentColor" />
          <div className="text-white font-black text-xl">{comboNotification.label}</div>
        </div>

        {/* Text below */}
        <div
          className={`absolute -bottom-16 left-1/2 -translate-x-1/2 text-center whitespace-nowrap transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ transitionDelay: '0.2s' }}
        >
          <p className="text-yellow-400 text-lg font-bold">{comboNotification.description}</p>
          <p className="text-text-secondary text-sm mt-1">
            +{comboNotification.bonusPoints} bonus points
          </p>
        </div>
      </div>

      <style>{`
        @keyframes combo-spark {
          0% {
            opacity: 0;
            transform: scale(0) translateY(0);
          }
          30% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0;
            transform: scale(0.5) translateY(-40px);
          }
        }
      `}</style>
    </div>
  );
}

export default ComboNotification;
