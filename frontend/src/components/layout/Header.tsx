import { Link } from 'react-router-dom';
import { Menu, X, Github, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { SearchBar } from '../search/SearchBar';

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#080808]/80 backdrop-blur-xl">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent" />
      
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-[#151515] ring-1 ring-[#222] group-hover:ring-[#7c3aed]/30 group-hover:bg-[#1a1a1a] transition-all duration-500">
              <span className="text-xs font-bold text-[#7c3aed]">H</span>
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#7c3aed] group-hover:bg-[#a78bfa] transition-colors duration-500" />
            </div>
            <span className="hidden sm:block text-sm font-semibold tracking-tight text-[#f0f0f0]">
              Hermes <span className="font-normal ml-1 text-[#7c3aed]">Eco</span>
            </span>
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/browse" className="h-8 px-3 flex items-center rounded-md text-[13px] text-[#999] hover:text-white hover:bg-white/[0.06] transition-all duration-200">
              Explore
            </Link>
            <Link to="/browse?sort=verified" className="h-8 px-3 flex items-center rounded-md text-[13px] text-[#999] hover:text-[#a78bfa] transition-colors duration-200">
              Verified
            </Link>
            <a
              href="https://github.com/NousResearch/hermes-agent"
              target="_blank"
              rel="noopener"
              className="h-8 px-3 flex items-center rounded-md text-[13px] text-[#999] hover:text-white hover:bg-white/[0.06] transition-all gap-1.5"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <SearchBar />
            </div>
            <Link to="/submit" className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#7c3aed]/15 ring-1 ring-[#7c3aed]/20 text-[#c4b5fd] text-[13px] font-medium hover:bg-[#7c3aed]/25 transition-all duration-200">
              Submit <ArrowRight className="w-3 h-3" />
            </Link>

            <button onClick={() => setOpen(!open)} className="md:hidden flex items-center justify-center w-8 h-8 rounded-md text-[#888] hover:text-white hover:bg-white/[0.06]">
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile */}
      {open && (
        <div className="md:hidden border-t border-[#1a1a1a] bg-[#080808] px-4 py-3 space-y-1">
          <SearchBar />
          {[
            { label: 'Explore', to: '/browse' },
            { label: 'Verified', to: '/browse?sort=verified' },
          ].map(item => (
            <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="block h-9 px-3 flex items-center rounded-md text-[13px] text-[#999] hover:text-white hover:bg-white/[0.06] transition-colors">
              {item.label}
            </Link>
          ))}
          <Link to="/submit" onClick={() => setOpen(false)} className="block h-9 px-3 flex items-center rounded-md bg-[#7c3aed]/15 ring-1 ring-[#7c3aed]/20 text-[#c4b5fd] text-[13px] font-medium">
            Submit Resource
          </Link>
        </div>
      )}
    </header>
  );
}
