'use client';

interface StateOption {
  id: string;
  label: string;
}

interface StateSwitcherProps {
  title: string;
  options: StateOption[];
  activeId: string;
  onChange: (id: string) => void;
}

export function StateSwitcher({
  title,
  options,
  activeId,
  onChange,
}: StateSwitcherProps) {
  return (
    <div className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 backdrop-blur">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.id === activeId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                active
                  ? 'border-amber-300/60 bg-amber-500/20 text-amber-200'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
