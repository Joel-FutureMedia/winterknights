import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { publicApi } from '@/lib/api';
import type { PublicRegisteredCompany } from '@/types';
import { Building2, MapPin } from 'lucide-react';

const PublicCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<PublicRegisteredCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi
      .getRegisteredCompanies()
      .then((r) => {
        if (r.data?.data) setCompanies(r.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="gradient-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl uppercase text-primary-foreground"
          >
            Registered <span className="text-gold">Companies</span>
          </motion.h1>
          <p className="mt-3 text-primary-foreground/60">
            All organisations registered on Winter Knights Namibia
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading companies...</p>
          ) : companies.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No registered companies yet.</p>
          ) : (
            <ul className="rounded-lg border bg-card divide-y">
              {companies.map((c, i) => (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className="flex items-start gap-4 p-4 sm:p-5"
                >
                  <div className="shrink-0 w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
                    <Building2 size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg text-navy truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ID: {c.companyId}</p>
                    {c.cityName ? (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin size={14} className="shrink-0" />
                        {c.cityName}
                      </p>
                    ) : null}
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default PublicCompanies;
