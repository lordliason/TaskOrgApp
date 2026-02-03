import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { useGamificationStore } from '../../store/gamificationStore';
import { BADGE_CATEGORIES } from '../../lib/constants';

function NewBadgeNotification() {
  const { newBadgeNotification, clearBadgeNotification } = useGamificationStore();
  const [isVisible, setIsVisible] = useState(false);
  const [stars, setStars] = useState([]);

  useEffect(() => {
    if (newBadgeNotification) {
      // Generate celebration stars
      const newStars = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 100,
        y: 50 + (Math.random() - 0.5) * 80,
        delay: Math.random() * 0.3,
        duration: 1 + Math.random() * 0.5,
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 360,
      }));
      setStars(newStars);
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(clearBadgeNotification, 400);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [newBadgeNotification]);

  if (!newBadgeNotification) return null;

  const categoryStyle = BADGE_CATEGORIES[newBadgeNotification.category] || {};

  return (
    <div
      className={`fixed inset-0 z-[260] pointer-events-none flex items-center justify-center transition-opacity duration-400 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Radial glow backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at center, ${categoryStyle.bgColor || 'rgba(139, 92, 246, 0.15)'} 0%, transparent 50%)`,
        }}
      />

      {/* Celebration stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animation: `badge-star ${star.duration}s ease-out ${star.delay}s forwards`,
            opacity: 0,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill={categoryStyle.color || '#8B5CF6'}
            style={{ transform: `rotate(${star.rotation}deg)` }}
          >
            <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
          </svg>
        </div>
      ))}

      {/* Main content */}
      <div
        className={`relative transition-all duration-500 ease-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        {/* Glow rings */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, ${categoryStyle.color || '#8B5CF6'}40, transparent 70%)`,
            transform: 'scale(3)',
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${categoryStyle.color || '#8B5CF6'}20, transparent 60%)`,
            transform: 'scale(4)',
            animation: 'badge-pulse 1.5s ease-in-out infinite',
          }}
        />

        {/* Badge icon */}
        <div
          className="relative w-24 h-24 rounded-2xl flex items-center justify-center text-5xl"
          style={{
            background: `linear-gradient(135deg, ${categoryStyle.color || '#8B5CF6'}, ${categoryStyle.color || '#8B5CF6'}cc)`,
            boxShadow: `0 8px 40px ${categoryStyle.color || '#8B5CF6'}60, inset 0 2px 4px rgba(255, 255, 255, 0.3)`,
          }}
        >
          {newBadgeNotification.icon}
        </div>

        {/* Text content */}
        <div
          className={`absolute -bottom-24 left-1/2 -translate-x-1/2 text-center whitespace-nowrap transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '0.3s' }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="h-5 w-5" style={{ color: categoryStyle.color || '#8B5CF6' }} />
            <span className="text-sm uppercase tracking-wider text-text-muted font-semibold">
              Badge Unlocked!
            </span>
          </div>
          <h3
            className="text-2xl font-bold mb-1"
            style={{ color: categoryStyle.color || '#8B5CF6' }}
          >
            {newBadgeNotification.name}
          </h3>
          <p className="text-text-secondary text-sm">{newBadgeNotification.description}</p>
          {newBadgeNotification.points_bonus > 0 && (
            <p className="text-accent-blue text-sm mt-2 font-semibold">
              +{newBadgeNotification.points_bonus} bonus points earned!
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes badge-star {
          0% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          30% {
            opacity: 1;
            transform: scale(1.2) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: scale(0.3) rotate(360deg) translateY(-50px);
          }
        }
        @keyframes badge-pulse {
          0%, 100% {
            transform: scale(4);
            opacity: 0.3;
          }
          50% {
            transform: scale(4.5);
            opacity: 0.1;
          }
        }
      `}</style>
    </div>
  );
}

export default NewBadgeNotification;
