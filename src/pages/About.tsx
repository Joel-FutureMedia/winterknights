import React from 'react';
import { motion } from 'framer-motion';
import { Shield, MapPin, CreditCard, Users } from 'lucide-react';

const steps = [
  { icon: Users, title: 'Register', desc: 'Sign up your company and select your preferred city.' },
  { icon: MapPin, title: 'Choose a Corner', desc: 'Browse available exhibition corners and reserve one.' },
  { icon: CreditCard, title: 'Make Payment', desc: 'Upload your proof of payment after bank transfer.' },
  { icon: Shield, title: 'Get Booked', desc: 'Admin approves and your corner is officially booked.' },
];

const About: React.FC = () => (
  <div>
    <section className="gradient-navy py-24">
      <div className="container mx-auto px-4">
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
          transition={{ delay: 0.2 }}
          className="mt-6 text-primary-foreground/70 text-center max-w-2xl mx-auto text-lg"
        >
          Winter Knights Namibia is a platform that enables businesses to book designated public spaces where they can engage with communities and raise funds to support people in need. We provide structured, accessible, and well-managed locations across Namibia, making it easier for companies to combine business presence with meaningful social impact.
        </motion.p>
      </div>
    </section>

    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-4xl uppercase text-center text-navy mb-16">
          How It <span className="text-gold">Works</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto rounded-full gradient-gold flex items-center justify-center mb-4">
                <s.icon size={28} className="text-primary" />
              </div>
              <div className="font-display text-sm text-gold uppercase tracking-widest mb-2">Step {i + 1}</div>
              <h3 className="font-display text-xl text-navy mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-muted py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="font-display text-3xl uppercase text-navy mb-6 text-center">Our Mission</h2>
        <p className="text-muted-foreground text-center leading-relaxed">
          Our mission is to connect businesses with opportunities to support vulnerable communities by providing organized, transparent fundraising spaces across Namibia.
          We strive to create a trusted environment where companies can engage directly with the public, collect contributions responsibly, and ensure that every donation reaches those who need it most.
          Through accountability, innovation, and community collaboration, we aim to make giving simple, impactful, and accessible for all.
        </p>
      </div>
    </section>
  </div>
);

export default About;
