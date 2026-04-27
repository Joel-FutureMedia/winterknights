import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/public-companies', label: 'Companies' },
  { to: '/available-corners', label: 'Available Corners' },
];

const PublicNavbar: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="gradient-navy sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Winter Knights" className="h-24 w-auto object-contain drop-shadow-[0_0_8px_hsl(var(--gold)/0.5)]" />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`font-display text-sm uppercase tracking-widest transition-colors ${
                location.pathname === l.to ? 'text-gold' : 'text-primary-foreground hover:text-gold'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/companies/login"
            className="ml-4 rounded-md gradient-gold px-5 py-2 font-display text-sm uppercase tracking-wider text-white transition hover:opacity-90"
          >
            Login / Register
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-primary-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden gradient-navy border-t border-gold/20 px-4 pb-4 space-y-3">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block font-display text-sm uppercase tracking-widest ${
                location.pathname === l.to ? 'text-gold' : 'text-primary-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/companies/login"
            onClick={() => setOpen(false)}
            className="block rounded-md gradient-gold px-5 py-2 font-display text-sm uppercase tracking-wider text-white text-center"
          >
            Login / Register
          </Link>
        </div>
      )}
    </nav>
  );
};

export default PublicNavbar;
