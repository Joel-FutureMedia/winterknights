import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { citiesApi } from '@/lib/api';
import type { City } from '@/types';

import naGeoJson from '../../../na.json';

// Approximate city positions on Namibia map (relative %)
const CITY_POSITIONS: Record<string, { x: number; y: number }> = {
  // Windhoek projected precisely from na.json bounds (so the dot aligns with the real outline)
  'windhoek': { x: 40.26, y: 46.87 },
  'swakopmund': { x: 28, y: 52 },
  'walvis bay': { x: 26, y: 55 },
  'oshakati': { x: 50, y: 18 },
  'rundu': { x: 62, y: 16 },
  'katima mulilo': { x: 85, y: 14 },
  'ondangwa': { x: 48, y: 20 },
  'otjiwarongo': { x: 48, y: 40 },
  'tsumeb': { x: 52, y: 30 },
  'keetmanshoop': { x: 52, y: 78 },
  'luderitz': { x: 32, y: 78 },
  'gobabis': { x: 65, y: 58 },
  'mariental': { x: 52, y: 70 },
  'rehoboth': { x: 52, y: 64 },
  'outjo': { x: 40, y: 38 },
  'okahandja': { x: 50, y: 52 },
  'henties bay': { x: 25, y: 48 },
  'ongwediva': { x: 48, y: 17 },
  'opuwo': { x: 30, y: 20 },
  'eenhana': { x: 48, y: 14 },
};

const getPosition = (cityName: string) => {
  const key = cityName.toLowerCase().trim();
  return CITY_POSITIONS[key] || { x: 50 + Math.random() * 20 - 10, y: 50 + Math.random() * 20 - 10 };
};

const NamibiaMap: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);

  // Convert GeoJSON polygon coordinates -> SVG path in a fixed 400x500 viewBox.
  // This keeps your existing city-dot percentage overlay aligned to the SVG.
  const namibiaPathD = React.useMemo(() => {
    const viewW = 400;
    const viewH = 500;
    const padding = 12;

    type LonLat = [number, number];

    const updateBounds = (pt: LonLat, bounds: any) => {
      const [lon, lat] = pt;
      bounds.minLon = Math.min(bounds.minLon, lon);
      bounds.maxLon = Math.max(bounds.maxLon, lon);
      bounds.minLat = Math.min(bounds.minLat, lat);
      bounds.maxLat = Math.max(bounds.maxLat, lat);
    };

    // 1) Bounds
    const bounds = {
      minLon: Number.POSITIVE_INFINITY,
      maxLon: Number.NEGATIVE_INFINITY,
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
    };

    const features = (naGeoJson as any)?.features ?? [];
    for (const f of features) {
      const geometry = f?.geometry;
      if (!geometry) continue;

      if (geometry.type === 'Polygon') {
        // coordinates: [ring][point][lon,lat]
        for (const ring of geometry.coordinates ?? []) {
          for (const pt of ring ?? []) updateBounds(pt as LonLat, bounds);
        }
      } else if (geometry.type === 'MultiPolygon') {
        // coordinates: [polygon][ring][point][lon,lat]
        for (const poly of geometry.coordinates ?? []) {
          for (const ring of poly ?? []) {
            for (const pt of ring ?? []) updateBounds(pt as LonLat, bounds);
          }
        }
      }
    }

    // Avoid division by zero if the data is unexpectedly empty.
    if (!isFinite(bounds.minLon) || !isFinite(bounds.maxLon) || bounds.maxLon === bounds.minLon || bounds.maxLat === bounds.minLat) {
      return '';
    }

    const project = ([lon, lat]: LonLat) => {
      const xNorm = (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon);
      const yNorm = (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);
      const x = padding + xNorm * (viewW - padding * 2);
      const y = padding + (1 - yNorm) * (viewH - padding * 2); // SVG y goes down
      return { x, y };
    };

    // 2) Build SVG d (multiple subpaths)
    let d = '';
    for (const f of features) {
      const geometry = f?.geometry;
      if (!geometry) continue;

      if (geometry.type === 'Polygon') {
        for (const ring of geometry.coordinates ?? []) {
          const pts = ring ?? [];
          if (pts.length < 3) continue;

          const p0 = project(pts[0] as LonLat);
          d += `M${p0.x} ${p0.y} `;
          for (let i = 1; i < pts.length; i++) {
            const p = project(pts[i] as LonLat);
            d += `L${p.x} ${p.y} `;
          }
          d += 'Z ';
        }
      } else if (geometry.type === 'MultiPolygon') {
        for (const poly of geometry.coordinates ?? []) {
          for (const ring of poly ?? []) {
            const pts = ring ?? [];
            if (pts.length < 3) continue;

            const p0 = project(pts[0] as LonLat);
            d += `M${p0.x} ${p0.y} `;
            for (let i = 1; i < pts.length; i++) {
              const p = project(pts[i] as LonLat);
              d += `L${p.x} ${p.y} `;
            }
            d += 'Z ';
          }
        }
      }
    }

    return d.trim();
  }, []);

  useEffect(() => {
    citiesApi.getAll().then(res => {
      if (res.data?.data) setCities(res.data.data);
    }).catch(() => {});
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto aspect-[3/4]">
      {/* Namibia outline SVG */}
      <svg viewBox="0 0 400 500" className="w-full h-full" fill="none">
        {/* Namibia outline from na.json */}
        {namibiaPathD && (
          <motion.path
            d={namibiaPathD}
            fill="hsl(var(--navy))"
            fillOpacity={0.15}
            fillRule="evenodd"
            stroke="hsl(var(--gold))"
            strokeWidth={2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
        )}
        {/* Grid lines */}
        {[100, 200, 300, 400].map(y => (
          <motion.line
            key={`h-${y}`} x1={40} y1={y} x2={370} y2={y}
            stroke="hsl(var(--gold))" strokeOpacity={0.1} strokeWidth={0.5}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          />
        ))}
        {[100, 200, 300].map(x => (
          <motion.line
            key={`v-${x}`} x1={x} y1={10} x2={x} y2={470}
            stroke="hsl(var(--gold))" strokeOpacity={0.1} strokeWidth={0.5}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          />
        ))}
      </svg>

      {/* City dots overlay */}
      {cities.map((city, i) => {
        const pos = getPosition(city.name);
        const cornerCount = city.corners?.length || 0;
        const availCount = city.corners?.filter(c => c.status === 'AVAILABLE').length || 0;
        return (
          <motion.div
            key={city.id}
            className="absolute group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2 + i * 0.15, type: 'spring' }}
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 w-4 h-4 -ml-2 -mt-2 rounded-full bg-gold/30 animate-pulse-dot" />
            {/* Dot */}
            <span className="relative block w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-gold shadow-lg shadow-gold/40" />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="gradient-navy rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl border border-gold/20">
                <p className="font-display text-gold uppercase tracking-wider">{city.name}</p>
                <p className="text-primary-foreground/70">{cornerCount} corners · {availCount} available</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default NamibiaMap;
