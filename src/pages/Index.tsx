import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import NamibiaMap from '@/components/public/NamibiaMap';
import { cornersApi, citiesApi } from '@/lib/api';
import type { Corner, Company, City } from '@/types';
import { MapPin, Building2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Index: React.FC = () => {
  const [corners, setCorners] = useState<Corner[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    cornersApi.getAll().then(r => { if (r.data?.data) setCorners(r.data.data); }).catch(() => {});
    citiesApi.getAll().then(r => { if (r.data?.data) setCities(r.data.data); }).catch(() => {});
  }, []);

  const availableCorners = corners.filter(c => c.status === 'AVAILABLE');

  return (
    <div>
      {/* Hero */}
      <section className="gradient-navy relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--gold)) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="font-display text-5xl md:text-7xl uppercase leading-tight text-primary-foreground">
                Reserve a Corner.
                <span className="block text-gold">Change a Life.</span>
              </h1>
              <p className="mt-6 text-lg text-primary-foreground/70 max-w-md">
                Secure a space where your business can raise funds and directly support communities in need.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/available-corners"
                  className="inline-flex items-center gap-2 gradient-gold px-8 py-3 rounded-md font-display uppercase text-sm tracking-wider text-primary transition hover:opacity-90"
                >
                  View Corners <ArrowRight size={16} />
                </Link>
                <Link
                  to="/companies/register"
                  className="inline-flex items-center gap-2 border border-gold/40 px-8 py-3 rounded-md font-display uppercase text-sm tracking-wider text-gold transition hover:bg-gold/10"
                >
                  Register Company
                </Link>
              </div>
              <div className="mt-10 flex gap-8">
                <div>
                  <p className="font-display text-3xl text-gold">{cities.length}</p>
                  <p className="text-xs text-primary-foreground/50 uppercase tracking-wider">Cities</p>
                </div>
                <div>
                  <p className="font-display text-3xl text-gold">{corners.length}</p>
                  <p className="text-xs text-primary-foreground/50 uppercase tracking-wider">Total Corners</p>
                </div>
                <div>
                  <p className="font-display text-3xl text-gold">{availableCorners.length}</p>
                  <p className="text-xs text-primary-foreground/50 uppercase tracking-wider">Available</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <NamibiaMap />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Available Corners Preview */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl uppercase text-navy">
              Available <span className="text-gold">Corners</span>
            </h2>
            <p className="mt-3 text-muted-foreground">Secure your spot before it's gone</p>
          </motion.div>

          {availableCorners.length === 0 ? (
            <p className="text-center text-muted-foreground">No available corners at the moment. Check back soon!</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCorners.slice(0, 6).map((corner, i) => (
                <motion.div
                  key={corner.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-lg border p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-xl text-navy">{corner.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin size={14} /> {corner.cityName || corner.city?.name || 'N/A'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">
                      Available
                    </Badge>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-display text-2xl text-gold">
                      NAD {Number(corner.price).toLocaleString('en', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {availableCorners.length > 6 && (
            <div className="text-center mt-8">
              <Link to="/available-corners" className="text-gold font-display uppercase text-sm tracking-wider hover:underline">
                View All Corners →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-navy py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-4xl uppercase text-primary-foreground">
            Ready to <span className="text-gold">Make an Impact</span>?
          </h2>
          <p className="mt-4 text-primary-foreground/60 max-w-lg mx-auto">
            Register your company today and secure a fundraising corner to support communities in need across Namibia.
          </p>
          <Link
            to="/companies/register"
            className="mt-8 inline-flex items-center gap-2 gradient-gold px-10 py-4 rounded-md font-display uppercase tracking-wider text-primary transition hover:opacity-90"
          >
            Get Started <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
