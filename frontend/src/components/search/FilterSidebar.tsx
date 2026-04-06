import { X } from 'lucide-react';
import { TOOL_LABELS } from '../../lib/constants';

interface FiltersProps {
  type?: string;
  verification_status?: string;
  sort?: string;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  activeCount: number;
}

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'agent', label: 'Agent' },
  { value: 'tool', label: 'Tool' },
  { value: 'skill', label: 'Skill' },
];

const VERIFICATIONS = [
  { value: '', label: 'All' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Community' },
];

const SORTS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'verified', label: 'Best Verified' },
  { value: 'stars', label: 'Most Stars' },
];

const TOOLS = [
  { value: 'terminal', label: 'Terminal' },
  { value: 'file', label: 'File' },
  { value: 'web_search', label: 'Web Search' },
  { value: 'browser', label: 'Browser' },
  { value: 'image_gen', label: 'Image Gen' },
  { value: 'code_execution', label: 'Code Exec' },
  { value: 'vision', label: 'Vision' },
  { value: 'cronjob', label: 'Cron' },
];

export function FilterSidebar({ type, verification_status, sort, onFilterChange, onClear, activeCount }: FiltersProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white text-sm">Filters</h3>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Type */}
      <FieldSection label="Type">
        {TYPES.map((t) => (
          <RadioOption
            key={t.value}
            value={t.value}
            label={t.label}
            checked={type === t.value}
            onChange={() => onFilterChange('type', t.value)}
          />
        ))}
      </FieldSection>

      {/* Verification */}
      <FieldSection label="Verification">
        {VERIFICATIONS.map((v) => (
          <RadioOption
            key={v.value}
            value={v.value}
            label={v.label}
            checked={verification_status === v.value}
            onChange={() => onFilterChange('verification_status', v.value)}
          />
        ))}
      </FieldSection>

      {/* Tools */}
      <FieldSection label="Tools">
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scroll">
          {TOOLS.map((t) => (
            <CheckboxOption
              key={t.value}
              value={t.value}
              label={t.label}
              checked={type === t.value}
              onChange={() => onFilterChange('tools_used', t.value)}
            />
          ))}
        </div>
      </FieldSection>

      {/* Sort */}
      <FieldSection label="Sort">
        <select
          value={sort || 'recent'}
          onChange={(e) => onFilterChange('sort', e.target.value)}
          className="w-full px-3 py-2 bg-surface-light border border-border/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value} className="bg-surface">{s.label}</option>
          ))}
        </select>
      </FieldSection>
    </div>
  );
}

function FieldSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">{label}</label>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function RadioOption({ value, label, checked, onChange }: { value: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer py-1 group">
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
        checked ? 'border-primary' : 'border-border/50 group-hover:border-muted-foreground'
      }`}>
        {checked && <div className="w-2 h-2 rounded-full bg-primary" />}
      </div>
      <input type="radio" name={label} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span className={`text-sm transition-colors ${checked ? 'text-white' : 'text-muted-foreground group-hover:text-white/80'}`}>
        {label}
      </span>
    </label>
  );
}

function CheckboxOption({ value, label, checked, onChange }: { value: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer py-1 group">
      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
        checked ? 'bg-primary border-primary' : 'border-border/50 group-hover:border-muted-foreground'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <input type="checkbox" value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span className={`text-sm transition-colors ${checked ? 'text-white' : 'text-muted-foreground group-hover:text-white/80'}`}>
        {label}
      </span>
    </label>
  );
}
