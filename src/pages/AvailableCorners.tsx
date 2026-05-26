import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cornersApi, citiesApi } from '@/lib/api';
import type { Corner, City } from '@/types';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AvailableCorners: React.FC = () => {
  const [corners, setCorners] = useState<Corner[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([cornersApi.getAll(), citiesApi.getAll()])
      .then(([cRes, ciRes]) => {
        if (cRes.data?.data) setCorners(cRes.data.data);
        if (ciRes.data?.data) setCities(ciRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = corners.filter(c => {
    if (selectedCity !== 'all') {
      const cityId = Number(selectedCity);
      if ((c.city?.id || c.cityId) !== cityId) return false;
    }
    return true;
  });

  const available = filtered.filter(c => c.status === 'AVAILABLE');
  const reserved = filtered.filter(c => c.status === 'RESERVED');
  const booked = filtered.filter(c => c.status === 'BOOKED');

  const statusColor = (s: string) => {
    if (s === 'AVAILABLE') return 'bg-green-100 text-green-700';
    if (s === 'RESERVED') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div>
      <section className="gradient-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl uppercase text-primary-foreground"
          >
            Available <span className="text-gold">Corners</span>
          </motion.h1>
          <p className="mt-3 text-primary-foreground/60">Browse all exhibition corners across Namibia</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
            <div className="flex gap-4 text-sm">
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">{available.length} Available</span>
              <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">{reserved.length} Reserved</span>
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700">{booked.length} Booked</span>
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading corners...</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full">
                <thead className="gradient-navy">
                  <tr>
                    <th className="text-left px-6 py-4 font-display text-sm uppercase tracking-wider text-primary-foreground">Corner</th>
                    <th className="text-left px-6 py-4 font-display text-sm uppercase tracking-wider text-primary-foreground">City</th>
                    <th className="text-left px-6 py-4 font-display text-sm uppercase tracking-wider text-primary-foreground">Price (NAD)</th>
                    <th className="text-left px-6 py-4 font-display text-sm uppercase tracking-wider text-primary-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((corner, i) => (
                    <tr key={corner.id} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/50'}>
                      <td className="px-6 py-4 font-medium">{corner.name}</td>
                      <td className="px-6 py-4 text-muted-foreground flex items-center gap-1">
                        <MapPin size={14} /> {corner.cityName || corner.city?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-display text-gold">
                        NAD {Number(corner.price).toLocaleString('en', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className={`${statusColor(corner.status)} border-0`}>
                          {corner.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No corners found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AvailableCorners;
