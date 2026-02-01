import { useState } from 'react';
import { Sparkles, Battery, Clock, MapPin, Target, Smile, Sun, Sunset, Moon } from 'lucide-react';

function AIPlannerModal({ onClose, onPlan }) {
  const [userContext, setUserContext] = useState({
    energyLevel: 'medium',
    availableHours: 6,
    mobility: 'stationary',
    focusPreference: 'variety',
    mood: 'neutral',
    startTime: 'morning',
  });

  const [isPlanning, setIsPlanning] = useState(false);

  const handlePlan = async () => {
    setIsPlanning(true);
    try {
      await onPlan(userContext);
      onClose();
    } catch (error) {
      console.error('Planning error:', error);
    } finally {
      setIsPlanning(false);
    }
  };

  const OptionButton = ({ selected, onClick, children, icon: Icon, color }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
        selected
          ? `${color} border-current`
          : 'bg-dark-card border-dark-border hover:border-dark-hover'
      }`}
    >
      {Icon && <Icon className="h-6 w-6" />}
      <span className="text-sm font-medium">{children}</span>
    </button>
  );

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto px-1">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-accent-blue" />
          <h2 className="text-xl font-serif text-text-primary">AI Day Planner</h2>
        </div>
        <p className="text-sm text-text-muted">
          Answer a few quick questions to get a personalized schedule
        </p>
      </div>

      {/* Energy Level */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-text-primary">
          <Battery className="h-5 w-5 text-accent-blue" />
          <h3 className="font-semibold">How's your energy today?</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <OptionButton
            selected={userContext.energyLevel === 'low'}
            onClick={() => setUserContext({ ...userContext, energyLevel: 'low' })}
            color="bg-orange-500/20 text-orange-400"
          >
            Low
          </OptionButton>
          <OptionButton
            selected={userContext.energyLevel === 'medium'}
            onClick={() => setUserContext({ ...userContext, energyLevel: 'medium' })}
            color="bg-yellow-500/20 text-yellow-400"
          >
            Medium
          </OptionButton>
          <OptionButton
            selected={userContext.energyLevel === 'high'}
            onClick={() => setUserContext({ ...userContext, energyLevel: 'high' })}
            color="bg-green-500/20 text-green-400"
          >
            High
          </OptionButton>
        </div>
      </div>

      {/* Available Hours */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-text-primary">
          <Clock className="h-5 w-5 text-accent-blue" />
          <h3 className="font-semibold">How many hours do you have?</h3>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="2"
            max="10"
            step="1"
            value={userContext.availableHours}
            onChange={(e) =>
              setUserContext({ ...userContext, availableHours: parseInt(e.target.value) })
            }
            className="flex-1 h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-accent-blue"
          />
          <div className="text-2xl font-bold text-accent-blue w-16 text-center">
            {userContext.availableHours}h
          </div>
        </div>
      </div>

      {/* Mobility */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-text-primary">
          <MapPin className="h-5 w-5 text-accent-blue" />
          <h3 className="font-semibold">Are you staying in one place?</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <OptionButton
            selected={userContext.mobility === 'stationary'}
            onClick={() => setUserContext({ ...userContext, mobility: 'stationary' })}
            color="bg-blue-500/20 text-blue-400"
          >
            Staying Put
          </OptionButton>
          <OptionButton
            selected={userContext.mobility === 'mobile'}
            onClick={() => setUserContext({ ...userContext, mobility: 'mobile' })}
            color="bg-purple-500/20 text-purple-400"
          >
            On the Go
          </OptionButton>
        </div>
      </div>

      {/* Focus Preference */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-text-primary">
          <Target className="h-5 w-5 text-accent-blue" />
          <h3 className="font-semibold">What's your focus style today?</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <OptionButton
            selected={userContext.focusPreference === 'deep-work'}
            onClick={() => setUserContext({ ...userContext, focusPreference: 'deep-work' })}
            color="bg-indigo-500/20 text-indigo-400"
          >
            Deep Work
          </OptionButton>
          <OptionButton
            selected={userContext.focusPreference === 'variety'}
            onClick={() => setUserContext({ ...userContext, focusPreference: 'variety' })}
            color="bg-cyan-500/20 text-cyan-400"
          >
            Mix It Up
          </OptionButton>
          <OptionButton
            selected={userContext.focusPreference === 'quick-wins'}
            onClick={() => setUserContext({ ...userContext, focusPreference: 'quick-wins' })}
            color="bg-teal-500/20 text-teal-400"
          >
            Quick Wins
          </OptionButton>
        </div>
      </div>

      {/* Mood */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-text-primary">
          <Smile className="h-5 w-5 text-accent-blue" />
          <h3 className="font-semibold">How are you feeling?</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <OptionButton
            selected={userContext.mood === 'stressed'}
            onClick={() => setUserContext({ ...userContext, mood: 'stressed' })}
            color="bg-red-500/20 text-red-400"
          >
            Stressed
          </OptionButton>
          <OptionButton
            selected={userContext.mood === 'neutral'}
            onClick={() => setUserContext({ ...userContext, mood: 'neutral' })}
            color="bg-gray-500/20 text-gray-400"
          >
            Neutral
          </OptionButton>
          <OptionButton
            selected={userContext.mood === 'motivated'}
            onClick={() => setUserContext({ ...userContext, mood: 'motivated' })}
            color="bg-emerald-500/20 text-emerald-400"
          >
            Motivated
          </OptionButton>
        </div>
      </div>

      {/* Start Time */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-text-primary">
          <Sun className="h-5 w-5 text-accent-blue" />
          <h3 className="font-semibold">When are you starting?</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <OptionButton
            selected={userContext.startTime === 'morning'}
            onClick={() => setUserContext({ ...userContext, startTime: 'morning' })}
            icon={Sun}
            color="bg-yellow-500/20 text-yellow-400"
          >
            Morning
          </OptionButton>
          <OptionButton
            selected={userContext.startTime === 'afternoon'}
            onClick={() => setUserContext({ ...userContext, startTime: 'afternoon' })}
            icon={Sunset}
            color="bg-orange-500/20 text-orange-400"
          >
            Afternoon
          </OptionButton>
          <OptionButton
            selected={userContext.startTime === 'evening'}
            onClick={() => setUserContext({ ...userContext, startTime: 'evening' })}
            icon={Moon}
            color="bg-purple-500/20 text-purple-400"
          >
            Evening
          </OptionButton>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-dark-border sticky bottom-0 bg-dark-bg">
        <button
          onClick={onClose}
          disabled={isPlanning}
          className="flex-1 px-4 py-3 bg-dark-card border border-dark-border rounded-xl text-text-primary hover:bg-dark-hover transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handlePlan}
          disabled={isPlanning}
          className="flex-1 px-4 py-3 bg-accent-blue text-white rounded-xl hover:bg-accent-blue/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPlanning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Planning...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Create My Plan
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default AIPlannerModal;
