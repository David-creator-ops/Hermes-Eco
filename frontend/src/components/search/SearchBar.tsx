import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SearchBar({ large = false }: { large?: boolean }) {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      navigate(`/browse?search=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={`relative group ${large ? 'max-w-md mx-auto' : ''}`}>
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555] group-focus-within:text-[#7c3aed] transition-colors" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={large ? 'Search agents, tools, skills...' : 'Search...'}
          className="w-full h-8 pl-9 pr-3 rounded-md bg-[#111] text-[13px] text-white placeholder:text-[#555] ring-1 ring-[#1e1e1e] focus:outline-none focus:ring-[#7c3aed]/40 focus:bg-[#151515] transition-all duration-200"
        />
      </div>
    </form>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative group">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555] group-focus-within:text-[#7c3aed] transition-colors" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-3 rounded-md bg-[#111] text-[13px] text-white placeholder:text-[#555] ring-1 ring-[#1e1e1e] focus:outline-none focus:ring-[#7c3aed]/40 focus:bg-[#151515] transition-all duration-200"
      />
    </div>
  );
}
