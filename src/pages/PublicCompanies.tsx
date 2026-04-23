import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cornersApi } from '@/lib/api';
import type { Corner } from '@/types';
import { Building2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PublicCompanies: React.FC = () => {
  const [corners, setCorners] = useState<Corner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cornersApi.getAll().then(r => {
      if (r.data?.data) setCorners(r.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Group corners that are RESERVED or BOOKED (assigned to companies)
  const assignedCorners = corners.filter(c => c.status !== 'AVAILABLE' && c.company);

  return (
    <div>
      <section className="gradient-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl uppercase text-primary-foreground"
          >
            Registered <span className="text-gold">Companies</span>
          </motion.h1>
          <p className="mt-3 text-primary-foreground/60">Companies currently participating in our exhibition program</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading companies...</p>
          ) : assignedCorners.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No companies currently assigned to corners.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedCorners.map((corner, i) => (
                <motion.div
                  key={corner.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card rounded-lg border p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                      <Building2 size={18} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-navy">{corner.company?.name || 'Company'}</h3>
                      <p className="text-xs text-muted-foreground">{corner.company?.companyId}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin size={14} /> {corner.cityName || corner.city?.name}
                    </p>
                    <p className="text-muted-foreground">Corner: <span className="font-medium text-foreground">{corner.name}</span></p>
                    <Badge variant="secondary" className={`border-0 ${corner.status === 'BOOKED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {corner.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PublicCompanies;
