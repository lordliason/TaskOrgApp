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
                ? 'border-gray-900 scale-110'
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
          value={value || '#3B82F6'}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
        />
        <span className="text-sm text-gray-500">Custom color</span>
      </div>
    </div>
  );
}

export default ColorPicker;
