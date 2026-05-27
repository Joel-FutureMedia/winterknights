import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Snowflake, Users } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const About: React.FC = () => (
  <div>
    {/* Hero */}
    <section className="gradient-navy py-24 md:py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--gold)) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="container mx-auto px-4 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-5xl md:text-6xl uppercase text-primary-foreground text-center"
        >
          About Winter Knights
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4 font-display text-xl md:text-2xl text-gold text-center tracking-wide"
        >
          Cold corners. Warm hearts. Real impact.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-primary-foreground/75 text-center max-w-3xl mx-auto text-lg leading-relaxed"
        >
          Winter Knights is Round Table Namibia&apos;s annual winter relief drive. Every year, on the
          first Friday of June, companies reserve street corners, teams brave the early morning cold,
          and motorists donate what they can.
        </motion.p>
      </div>
    </section>

    {/* Why Winter Knights exists */}
    <section className="py-20 md:py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div {...fadeUp}>
          <h2 className="font-display text-3xl md:text-4xl uppercase text-navy text-center">
            Why Winter Knights <span className="text-gold">Exists</span>
          </h2>
          <div className="mt-10 space-y-6 text-muted-foreground text-lg leading-relaxed">
            <p>
              For many of us, winter is uncomfortable. For others, it is dangerous.
            </p>
            <p>
              Across Namibia, children, elderly people, homeless individuals and vulnerable families
              face cold nights without enough warmth, food or shelter. Winter Knights exists to meet
              that need in a practical, direct and dignified way.
            </p>
          </div>
          <blockquote className="mt-10 border-l-4 border-gold pl-6 py-2">
            <p className="font-display text-xl md:text-2xl text-navy leading-snug">
              The idea is simple: we stand in the cold for a few hours so that others do not have to
              face winter alone.
            </p>
          </blockquote>
        </motion.div>
      </div>
    </section>

    {/* How it works */}
    <section className="bg-muted py-20 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div {...fadeUp} className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl uppercase text-navy">
            How It <span className="text-gold">Works</span>
          </h2>
          <p className="mt-8 text-muted-foreground text-lg leading-relaxed text-left md:text-center">
            Companies reserve corners in participating towns and cities. On Winter Knights morning,
            their teams collect cash, blankets, warm clothing, non-perishable food and other essential
            items from passing motorists.
          </p>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed text-left md:text-center">
            Everything collected is distributed to verified beneficiaries, including children&apos;s
            homes, old-age homes, soup kitchens, community centres, homeless people and rural
            communities.
          </p>
        </motion.div>

        <div className="mt-14 grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { icon: Snowflake, label: 'Brave the cold', desc: 'Teams stand on corners across Namibia' },
            { icon: Users, label: 'Collect donations', desc: 'Motorists give cash, food, blankets and more' },
            { icon: Heart, label: 'Deliver impact', desc: 'Items reach verified beneficiaries in need' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="text-center bg-card rounded-xl border border-gold/20 p-6 shadow-sm"
            >
              <div className="w-14 h-14 mx-auto rounded-full gradient-gold flex items-center justify-center mb-4">
                <item.icon size={26} className="text-primary" />
              </div>
              <h3 className="font-display text-lg text-navy uppercase tracking-wide">{item.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Become a Winter Knight CTA */}
    <section className="gradient-navy py-20 md:py-24">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl uppercase text-primary-foreground">
            Become a <span className="text-gold">Winter Knight</span>
          </h2>
          <p className="mt-6 text-primary-foreground/70 text-lg leading-relaxed">
            Winter Knights is more than a fundraiser. It is a morning where ordinary Namibians choose
            to do something practical for those less fortunate.
          </p>
          <p className="mt-6 text-primary-foreground/90 text-lg font-medium leading-relaxed">
            Reserve a corner. Brave the cold. Help carry warmth to someone who needs it most.
          </p>
          <Link
            to="/available-corners"
            className="mt-10 inline-flex items-center gap-2 gradient-gold px-10 py-4 rounded-md font-display uppercase tracking-wider text-white transition hover:opacity-90"
          >
            Become a Winter Knight <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  </div>
);

export default About;
