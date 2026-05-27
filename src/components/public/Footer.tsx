import React from 'react';
import logo from '@/assets/logo.png';

const simplyFoundSite = 'https://www.simplyfound.com.na/';
const simplyFoundLogoUrl = 'https://www.simplyfound.com.na/assets/logo-CtF7uxpB.png';

const Footer: React.FC = () => (
  <footer className="gradient-navy text-primary-foreground">
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-3 gap-8">
        <div>
          <img src={logo} alt="Winter Knights" className="h-20 w-auto object-contain mb-4 drop-shadow-[0_0_8px_hsl(var(--gold)/0.5)]" />
          <p className="text-sm opacity-70">
            Book a corner, brave the cold, and help Round Table Namibia carry warmth to those who need it most.
          </p>
        </div>
        <div>
          <h4 className="font-display text-sm uppercase tracking-widest text-gold mb-4">Contact</h4>
          <a href="mailto:info@winterknights.com.na" className="block text-sm opacity-70 hover:text-gold transition-colors">
            info@winterknights.com.na
          </a>
          <a href="tel:+264812536711" className="block text-sm opacity-70 hover:text-gold transition-colors">
            +264 81 253 6711
          </a>
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

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs opacity-80">
        <span>Powered by</span>
        <a
          href={simplyFoundSite}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md px-1 py-0.5 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          title="SimplyFound — Professional Web Development in Namibia"
        >
          <img
            src={simplyFoundLogoUrl}
            alt="SimplyFound"
            className="h-14 w-auto drop-shadow-[0_0_8px_hsl(var(--gold)/0.35)]"
          />
          <span className="underline underline-offset-2 decoration-primary-foreground/40 hover:decoration-gold">
            www.simplyfound.com.na
          </span>
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
