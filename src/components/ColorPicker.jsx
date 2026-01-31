import { DEFAULT_COLORS } from '../lib/constants';

function ColorPicker({ value, onChange, label }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {DEFAULT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              value === color
                ? 'border-text-primary scale-110 ring-2 ring-offset-2 ring-offset-dark-main ring-accent-blue'
                : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      {/* Custom color input */}
      <div className="mt-2 flex items-center gap-2">
        <input
          type="color"
          value={value || '#4a9eff'}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-dark-card border border-dark-border"
        />
        <span className="text-sm text-text-muted">Custom color</span>
      </div>
    </div>
  );
}

export default ColorPicker;
