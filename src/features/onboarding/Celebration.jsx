import { useEffect, useState } from 'react';
import { useOnboardingStore } from '../../store/onboardingStore';
import { Check } from 'lucide-react';

function Celebration() {
  const { showFirstTaskCelebration } = useOnboardingStore();
  const [particles, setParticles] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showFirstTaskCelebration) {
      // Generate subtle floating particles
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 60,
        y: 50 + (Math.random() - 0.5) * 40,
        delay: Math.random() * 0.3,
        duration: 1.5 + Math.random() * 0.5,
        size: 4 + Math.random() * 4,
        color: [
          'rgba(167, 139, 250, 0.8)',
          'rgba(74, 158, 255, 0.8)',
          'rgba(139, 92, 246, 0.6)',
          'rgba(236, 72, 153, 0.6)',
        ][Math.floor(Math.random() * 4)],
      }));
      setParticles(newParticles);
      setIsVisible(true);

      // Cleanup
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2200);

      return () => clearTimeout(timer);
    }
  }, [showFirstTaskCelebration]);

  if (!showFirstTaskCelebration) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] pointer-events-none flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Soft radial gradient backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(circle at center, rgba(167, 139, 250, 0.08) 0%, transparent 50%)',
        }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            animation: `float-up ${particle.duration}s ease-out ${particle.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}

      {/* Center badge */}
      <div
        className={`relative transition-all duration-500 ease-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
        style={{
          transitionDelay: '0.1s',
        }}
      >
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background:
              'radial-gradient(circle, rgba(167, 139, 250, 0.3), transparent 70%)',
            transform: 'scale(2.5)',
          }}
        />

        {/* Badge */}
        <div
          className="relative w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.9), rgba(74, 158, 255, 0.9))',
            boxShadow:
              '0 8px 32px rgba(167, 139, 250, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
          }}
        >
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>

        {/* Text below */}
        <p
          className={`absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-text-secondary text-sm font-medium transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ transitionDelay: '0.3s' }}
        >
          First one done
        </p>
      </div>

      <style>{`
        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.5);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(0.2);
          }
        }
      `}</style>
    </div>
  );
}

export default Celebration;
