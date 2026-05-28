'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Gamepad2, Sparkles } from 'lucide-react';
import { Navbar1 } from '@/components/ui/navbar-1';
import { FooterLinks } from '@/components/ui/cta-3';

const DEMOS = [
  {
    id: 'pizza',
    title: 'Pizza Builder',
    description: 'Customise your perfect pie, topping by topping. A tasty way to collect product preferences.',
    image: '/theme-pizza.png',
    tag: 'Food & Beverage',
    tagColor: 'bg-red-50 text-red-600 border-red-100',
    accentColor: 'from-red-50',
    href: '/demo/pizza-design',
    available: true,
  },
  {
    id: 'coffee',
    title: 'Coffee Brewer',
    description: 'Walk respondents through a morning brew ritual to surface nuanced preferences effortlessly.',
    image: '/theme-coffee.png',
    tag: 'Lifestyle',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-100',
    accentColor: 'from-amber-50',
    href: '#',
    available: false,
  },
  {
    id: 'home',
    title: 'Dream Home',
    description: 'Drag-and-drop your ideal living space. Perfect for real estate and interior feedback.',
    image: '/theme-home.png',
    tag: 'Real Estate',
    tagColor: 'bg-sky-50 text-sky-600 border-sky-100',
    accentColor: 'from-sky-50',
    href: '#',
    available: false,
  },
  {
    id: 'garden',
    title: 'Garden Grower',
    description: 'Grow a garden as you answer — a calming metaphor for long-form research surveys.',
    image: '/theme-garden.png',
    tag: 'Wellness',
    tagColor: 'bg-green-50 text-green-700 border-green-100',
    accentColor: 'from-green-50',
    href: '#',
    available: false,
  },
  {
    id: 'sundae',
    title: 'Ice Cream Sundae',
    description: 'Layer scoops and toppings to reveal preferences. Brilliant for consumer taste research.',
    image: '/theme-sundae.png',
    tag: 'Consumer Research',
    tagColor: 'bg-pink-50 text-pink-600 border-pink-100',
    accentColor: 'from-pink-50',
    href: '#',
    available: false,
  },
  {
    id: 'classic',
    title: 'Classic Survey',
    description: 'The familiar form — reimagined with smooth transitions and a progress bar that motivates.',
    image: '/theme-classic.png',
    tag: 'General',
    tagColor: 'bg-orange-50 text-orange-600 border-orange-100',
    accentColor: 'from-orange-50',
    href: '#',
    available: false,
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar1 />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b-2 border-[#e5e5e5] bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 border-2 border-orange-100 rounded-full mb-6"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[11px] font-black uppercase tracking-widest text-orange-600 font-outfit">Interactive demos</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-fredoka font-bold text-5xl md:text-6xl text-[#3c3c3c] leading-tight tracking-tight mb-4 text-balance"
          >
            Surveys that feel like{' '}
            <span className="text-orange-500 relative">
              games.
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-orange-200 rounded-full" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[#777777] font-outfit max-w-xl mx-auto"
          >
            Try every adventure format hands-on. No account needed — just pick one and play.
          </motion.p>
        </div>
      </section>

      {/* Demo grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEMOS.map((demo, index) => (
              <motion.div
                key={demo.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
              >
                <DemoCard demo={demo} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t-2 border-[#e5e5e5] bg-white">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-14 h-14 bg-orange-50 border-2 border-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_4px_0_#fed7aa]">
            <Sparkles className="w-6 h-6 text-orange-500" />
          </div>
          <h2 className="font-fredoka font-bold text-3xl md:text-4xl text-[#3c3c3c] mb-3 text-balance">
            Build your own adventure
          </h2>
          <p className="text-[#777777] font-outfit mb-8 max-w-sm mx-auto">
            Pick any format, drop in your questions, and share in minutes. Free to start.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-10 py-5 bg-orange-500 hover:bg-orange-600 text-white font-fredoka font-bold text-lg uppercase tracking-widest rounded-2xl border-b-4 border-orange-700 shadow-[0_6px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Get started free <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-[11px] text-[#afafaf] font-outfit font-black uppercase tracking-wider">No credit card required</p>
        </div>
      </section>

      <FooterLinks />
    </div>
  );
}

function DemoCard({ demo }: { demo: typeof DEMOS[number] }) {
  const cardContent = (
    <div
      className={`group relative flex flex-col bg-white rounded-[2rem] border-2 overflow-hidden transition-all duration-200
        ${demo.available
          ? 'border-[#e5e5e5] shadow-[0_6px_0_#e5e5e5] hover:border-orange-300 hover:shadow-[0_6px_0_#fed7aa] cursor-pointer focus-within:border-orange-300 focus-within:shadow-[0_6px_0_#fed7aa]'
          : 'border-[#e5e5e5] shadow-[0_6px_0_#e5e5e5] opacity-70 cursor-default'
        }`}
      aria-label={demo.available ? undefined : `${demo.title} — coming soon`}
    >
      {/* Thumbnail */}
      <div className={`relative h-48 bg-gradient-to-b ${demo.accentColor} to-white overflow-hidden`}>
        <Image
          src={demo.image}
          alt=""
          fill
          className="object-contain p-6 transition-transform duration-300 group-hover:scale-105 group-focus-within:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {!demo.available && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <span className="bg-white border-2 border-[#e5e5e5] text-[#afafaf] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl font-outfit shadow-[0_2px_0_#e5e5e5]">
              Coming soon
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-fredoka font-bold text-xl text-[#3c3c3c] leading-tight">{demo.title}</h3>
          <span className={`flex-shrink-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border font-outfit ${demo.tagColor}`}>
            {demo.tag}
          </span>
        </div>
        <p className="text-sm text-[#777777] font-outfit leading-relaxed flex-grow">{demo.description}</p>

        {demo.available && (
          <div className="mt-5 flex items-center gap-1.5 text-orange-500 text-sm font-bold font-fredoka">
            Try it now <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-focus-within:translate-x-1" />
          </div>
        )}
      </div>
    </div>
  );

  if (demo.available) {
    return (
      <Link
        href={demo.href}
        className="block rounded-[2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        aria-label={`Try ${demo.title} demo`}
      >
        {cardContent}
      </Link>
    );
  }
  return <div aria-label={`${demo.title} — coming soon`}>{cardContent}</div>;
}
