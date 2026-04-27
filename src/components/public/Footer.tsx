import React from 'react';
import logo from '@/assets/logo.png';

const simpleFoundLogoUrl = 'https://www.simplyfound.com.na/assets/logo-CtF7uxpB.png';

const Footer: React.FC = () => (
  <footer className="gradient-navy text-primary-foreground">
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-3 gap-8">
        <div>
          <img src={logo} alt="Winter Knights" className="h-20 w-auto object-contain mb-4 drop-shadow-[0_0_8px_hsl(var(--gold)/0.5)]" />
          <p className="text-sm opacity-70">
            Namibia's trusted platform for booking fundraising corners that support communities in need.
          </p>
        </div>
        <div>
          <h4 className="font-display text-sm uppercase tracking-widest text-gold mb-4">Contact</h4>
          <p className="text-sm opacity-70">info@winterknightsnamibia.com</p>
          <p className="text-sm opacity-70">+244612321168</p>
          <p className="text-sm opacity-70">Windhoek, Namibia</p>
        </div>
        <div>
          <h4 className="font-display text-sm uppercase tracking-widest text-gold mb-4">Quick Links</h4>
          <div className="space-y-1 text-sm opacity-70">
            <p>About Us</p>
            <p>Available Corners</p>
            <p>Register Your Company</p>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-primary-foreground/10 text-center text-xs opacity-50">
        © {new Date().getFullYear()} Winter Knights Namibia. All rights reserved.
      </div>

      <div className="mt-4 flex items-center justify-center gap-3 text-xs opacity-70">
        <p>Developed by</p>
        <img
          src={simpleFoundLogoUrl}
          alt="SimplyFound"
          className="h-14 w-auto drop-shadow-[0_0_8px_hsl(var(--gold)/0.35)]"
        />
      </div>
    </div>
  </footer>
);

export default Footer;
