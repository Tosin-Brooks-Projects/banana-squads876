'use client';

import Link from 'next/link';
import Image from 'next/image';
import AnimatedButton from '@/components/ui/AnimatedButton';
import { CrowdCanvas } from '@/components/ui/skiper-ui/skiper39';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { Marquee } from '@/components/ui/3d-testimonials';
import { Navbar1 } from '@/components/ui/navbar-1';
import { HeroSection03 } from '@/components/ui/hero-03';
import { CallToAction, FooterLinks } from '@/components/ui/cta-3';
import BlurText from '@/components/ui/BlurText';
import DotField from '@/components/ui/DotField';
import { Gamepad2, BarChart3, Rocket, TrendingDown, Clock, Frown, ArrowRight, Pencil, Share2, Zap, Check } from 'lucide-react';
import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useReducedMotion } from 'framer-motion';

const FEATURES = [
  {
    id: 'gamified',
    tab: 'Gamified',
    icon: <Gamepad2 className="size-5" />,
    color: 'text-duo-green',
    bg: 'bg-[#d7ffb8]',
    border: 'border-[#58cc02]',
    activeBorder: 'border-duo-green',
    headline: 'Turn every question into a moment.',
    body: 'Characters react, progress bars fill, rewards unlock. Respondents stop thinking "is this done yet?" and start thinking "what happens next?"',
    bullets: ['Animated character reactions', 'Progress milestones & rewards', 'Branching story logic'],
    preview: 'gamified',
  },
  {
    id: 'analytics',
    tab: 'Analytics',
    icon: <BarChart3 className="size-5" />,
    color: 'text-sky-blue',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    activeBorder: 'border-sky-blue',
    headline: 'See exactly where people drop off.',
    body: 'Real-time dashboards show completion funnels, answer heatmaps, and engagement scores — so you can fix the weak spots fast.',
    bullets: ['Live completion funnels', 'Per-question drop-off rates', 'Exportable to CSV / Sheets'],
    preview: 'analytics',
  },
  {
    id: 'conversion',
    tab: 'Conversion',
    icon: <Rocket className="size-5" />,
    color: 'text-bubblegum-pink',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    activeBorder: 'border-bubblegum-pink',
    headline: '3× more completions. Guaranteed.',
    body: 'Switch any existing form to an Unboring adventure and watch completions triple. No design skills, no code — just better results.',
    bullets: ['Avg. 3.2× completion lift', 'One-click theme swap', 'A/B test old vs. unboring'],
    preview: 'conversion',
  },
];

function FeatureShowcase() {
  const [active, setActive] = useState(0);
  const f = FEATURES[active];

  return (
    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
      {/* Left */}
      <motion.div
        className="flex-1 space-y-6"
        initial={{ opacity: 0, x: -120, skewX: -3 }}
        whileInView={{ opacity: 1, x: 0, skewX: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ type: "spring", damping: 15, stiffness: 55 }}
      >
        <BlurText text="Why Choose Unboring Surveys?" direction="bottom" delay={80} stepDuration={0.4} className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#3c3c3c] font-fredoka leading-tight text-balance" />
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {FEATURES.map((feat, i) => (
            <button
              key={feat.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold font-fredoka transition-all ${
                i === active
                  ? `${feat.bg} ${feat.activeBorder} ${feat.color}`
                  : 'bg-white border-[#e5e5e5] text-[#afafaf] hover:border-[#c8c8c8]'
              }`}
            >
              <span className={i === active ? feat.color : 'text-[#c8c8c8]'}>{feat.icon}</span>
              {feat.tab}
            </button>
          ))}
        </div>
        {/* Active feature detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            <h3 className={`text-xl font-bold font-fredoka ${f.color}`}>{f.headline}</h3>
            <p className="text-[#777777] font-outfit leading-relaxed">{f.body}</p>
            <ul className="space-y-2">
              {f.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-[#4b4b4b] font-outfit">
                  <span className={`size-5 rounded-full ${f.bg} border ${f.border} flex items-center justify-center flex-shrink-0`}>
                    <Check className={`size-3 ${f.color}`} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
        <Link href="/login" className="inline-block pt-1">
          <AnimatedButton variant="outline" size="lg" className="border-2 border-orange-500 hover:bg-orange-50 text-orange-500 font-bold rounded-xl btn-3d shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none">
            Explore Features
          </AnimatedButton>
        </Link>
      </motion.div>

      {/* Right: feature preview */}
      <motion.div
        className="flex-1 flex justify-center"
        initial={{ opacity: 0, y: 120, scale: 0.8, rotate: 5 }}
        whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ type: "spring", damping: 13, stiffness: 50, delay: 0.1 }}
      >
        <AnimatePresence mode="wait">
          {f.preview === 'gamified' && (
            <motion.div key="gamified"
              initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: -2 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 14, stiffness: 70 }}
              className="w-full max-w-sm"
            >
              <div className="bg-white border-4 border-[#e5e5e5] rounded-3xl p-5 shadow-[0_10px_0_#e5e5e5] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400 font-outfit">Question 2 of 5</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => <div key={s} className={`w-6 h-2 rounded-full ${s <= 2 ? 'bg-duo-green' : 'bg-[#e5e5e5]'}`} />)}
                  </div>
                </div>
                <div className="flex justify-center py-2">
                  <Image src="/mascot.png" alt="mascot" width={80} height={80} className="animate-bounce" />
                </div>
                <p className="text-center font-bold text-neutral-800 font-fredoka text-lg">How do you prefer to work?</p>
                <div className="space-y-2">
                  {['🏠 From home', '🏢 In the office', '✈️ Anywhere I want'].map((o, i) => (
                    <motion.div key={o}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-outfit ${i === 0 ? 'border-duo-green bg-[#d7ffb8] font-semibold' : 'border-[#e5e5e5] hover:border-neutral-300'}`}
                    >
                      {o}
                    </motion.div>
                  ))}
                </div>
              </div>
              <motion.div className="mt-3 mx-4 bg-[#d7ffb8] border-2 border-[#58cc02] rounded-xl px-4 py-2 flex items-center gap-2 shadow-[0_3px_0_#3f8f01]"
                animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-lg">🌱</span>
                <div>
                  <p className="text-xs font-bold text-[#3f8f01] font-fredoka">Garden growing!</p>
                  <p className="text-[10px] text-[#3f8f01]/70 font-outfit">2 blooms planted so far</p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {f.preview === 'analytics' && (
            <motion.div key="analytics"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, rotate: -1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 14, stiffness: 70 }}
              className="w-full max-w-sm bg-white border-4 border-[#e5e5e5] rounded-3xl p-5 shadow-[0_10px_0_#e5e5e5] space-y-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold font-fredoka text-neutral-800">Survey Results</span>
                <span className="text-xs bg-duo-green/10 text-duo-green font-bold px-2 py-0.5 rounded-full font-outfit">Live</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[{ v: '347', l: 'Responses', c: 'text-duo-green' }, { v: '91%', l: 'Completion', c: 'text-sky-blue' }, { v: '4.8★', l: 'Rating', c: 'text-sunshine-yellow' }].map(({ v, l, c }) => (
                  <div key={l} className="bg-neutral-50 rounded-xl p-2 text-center">
                    <p className={`text-lg font-bold font-fredoka ${c}`}>{v}</p>
                    <p className="text-[9px] text-neutral-400 font-outfit">{l}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-neutral-400 font-outfit uppercase tracking-widest">Completion funnel</p>
                {[{ l: 'Opened', p: 100 }, { l: 'Q1 answered', p: 94 }, { l: 'Halfway', p: 88 }, { l: 'Finished', p: 91 }].map(({ l, p }, i) => (
                  <div key={l} className="flex items-center gap-3">
                    <span className="text-[10px] text-neutral-400 w-20 font-outfit">{l}</span>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-sky-blue rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${p}%` }}
                        viewport={{ once: false }}
                        transition={{ duration: 0.7, delay: 0.1 * i }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-500 w-8 font-outfit">{p}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {f.preview === 'conversion' && (
            <motion.div key="conversion"
              initial={{ opacity: 0, scale: 0.9, rotate: 4 }}
              animate={{ opacity: 1, scale: 1, rotate: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 14, stiffness: 70 }}
              className="w-full max-w-sm space-y-3"
            >
              {/* Before */}
              <div className="bg-white border-2 border-[#e5e5e5] rounded-2xl p-4 opacity-60 grayscale">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-neutral-400 font-outfit uppercase">Before — Old form</span>
                  <span className="text-xs font-bold text-duo-pink font-fredoka">23% done</span>
                </div>
                <div className="h-2 bg-[#e5e5e5] rounded-full overflow-hidden">
                  <div className="h-full bg-duo-pink rounded-full" style={{ width: '23%' }} />
                </div>
                <div className="mt-3 space-y-1.5 opacity-70">
                  {[1,2,3].map(i => <div key={i} className="flex gap-2"><div className="w-3 h-3 rounded border border-neutral-200 flex-shrink-0 mt-0.5" /><div className="h-2 bg-neutral-100 rounded flex-1" /></div>)}
                </div>
              </div>
              {/* Arrow */}
              <div className="flex items-center justify-center gap-2">
                <div className="flex-1 h-px bg-[#e5e5e5]" />
                <span className="text-xs font-bold text-duo-green font-outfit bg-[#d7ffb8] border border-[#58cc02] px-3 py-1 rounded-full">Switch to Unboring ✨</span>
                <div className="flex-1 h-px bg-[#e5e5e5]" />
              </div>
              {/* After */}
              <div className="bg-[#d7ffb8] border-2 border-[#58cc02] rounded-2xl p-4 shadow-[0_6px_0_#3f8f01]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-[#3f8f01] font-outfit uppercase">After — Unboring quest</span>
                  <span className="text-xs font-bold text-duo-green font-fredoka">91% done 🎉</span>
                </div>
                <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-duo-green rounded-full"
                    initial={{ width: '23%' }}
                    whileInView={{ width: '91%' }}
                    viewport={{ once: false }}
                    transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Image src="/excited_character.png" alt="excited" width={36} height={36} />
                  <div>
                    <p className="text-xs font-bold text-[#3f8f01] font-fredoka">3.2× more completions</p>
                    <p className="text-[10px] text-[#3f8f01]/70 font-outfit">Same questions, better experience</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const testimonials = [
  {
    name: 'Ava Green',
    username: '@ava',
    body: 'Unboring Surveys made my workflow 10x faster!',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    country: '🇦🇺',
  },
  {
    name: 'Ana Miller',
    username: '@ana',
    body: 'The 3x completion rate is real. Highly recommend!',
    img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    country: '🇩🇪',
  },
  {
    name: 'Mateo Rossi',
    username: '@mat',
    body: 'Animations are buttery smooth and engaging!',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    country: '🇮🇹',
  },
  {
    name: 'Maya Patel',
    username: '@maya',
    body: 'Setup was a breeze! Best feedback tool ever.',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    country: '🇮🇳',
  },
  {
    name: 'Noah Smith',
    username: '@noah',
    body: 'Finally, surveys people actually want to take!',
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    country: '🇺🇸',
  },
  {
    name: 'Lucas Stone',
    username: '@luc',
    body: 'Interactive adventures are a game changer.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    country: '🇫🇷',
  },
];

function TestimonialCard({ img, name, username, body, country }: (typeof testimonials)[number]) {
  return (
    <Card className="w-64 border-2 border-[#e5e5e5] bg-white shadow-[0_4px_0_#e5e5e5] hover:border-orange-200 transition-colors duration-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 border border-neutral-100">
            <AvatarImage src={img} alt={name} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <figcaption className="text-sm font-semibold text-[#3c3c3c] flex items-center gap-1">
              {name} <span className="text-xs grayscale">{country}</span>
            </figcaption>
            <p className="text-xs font-medium text-[#afafaf]">{username}</p>
          </div>
        </div>
        <blockquote className="mt-3 text-sm text-[#777777] leading-relaxed">&quot;{body}&quot;</blockquote>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const prefersReduced = useReducedMotion();
  const pageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: pageRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  // Per-section parallax refs
  const s2Ref = useRef<HTMLElement>(null);
  const s3Ref = useRef<HTMLElement>(null);
  const s4Ref = useRef<HTMLElement>(null);
  const s5Ref = useRef<HTMLElement>(null);
  const s6Ref = useRef<HTMLElement>(null);

  const { scrollYProgress: s2p } = useScroll({ target: s2Ref, offset: ["start end", "end start"] });
  const { scrollYProgress: s3p } = useScroll({ target: s3Ref, offset: ["start end", "end start"] });
  const { scrollYProgress: s4p } = useScroll({ target: s4Ref, offset: ["start end", "end start"] });
  const { scrollYProgress: s5p } = useScroll({ target: s5Ref, offset: ["start end", "end start"] });
  const { scrollYProgress: s6p } = useScroll({ target: s6Ref, offset: ["start end", "end start"] });

  // Parallax transforms — disabled when prefers-reduced-motion is on
  const s2BgY   = useTransform(s2p, [0, 1], prefersReduced ? ["0%", "0%"] : ["-8%", "8%"]);
  const s2FormY = useTransform(s2p, [0, 1], prefersReduced ? ["0%", "0%"] : ["12%", "-12%"]);
  const s3CardsY = useTransform(s3p, [0, 1], prefersReduced ? ["0%", "0%"] : ["10%", "-10%"]);
  const s4BgY   = useTransform(s4p, [0, 1], prefersReduced ? ["0%", "0%"] : ["-6%", "6%"]);
  const s5LeftX = useTransform(s5p, [0, 1], prefersReduced ? ["0%", "0%"] : ["-5%", "5%"]);
  const s5RightX = useTransform(s5p, [0, 1], prefersReduced ? ["0%", "0%"] : ["5%", "-5%"]);
  const s6BgY   = useTransform(s6p, [0, 1], prefersReduced ? ["0%", "0%"] : ["-8%", "8%"]);

  return (
    <div ref={pageRef} className="min-h-screen lg:h-screen lg:overflow-y-auto lg:snap-y lg:snap-mandatory lg:scroll-smooth bg-neutral-50 relative">

      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-orange-500 origin-left z-[100]"
        style={{ scaleX }}
      />

      <Navbar1 />

      {/* SECTION 1: HERO */}
      <section className="lg:snap-start min-h-screen lg:h-screen flex flex-col justify-between bg-white relative overflow-hidden border-b border-[#e5e5e5] pt-16">
        <div className="flex-1 flex items-center">
          <HeroSection03 />
        </div>
        <div className="hidden lg:flex pb-6 justify-center text-xs text-[#afafaf] font-outfit gap-1 select-none">
          <motion.span
            animate={{ y: [0, 4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            Scroll to explore ↓
          </motion.span>
        </div>
      </section>

      {/* SECTION 2: THE PROBLEM */}
      <section ref={s2Ref} className="lg:snap-start min-h-screen lg:h-screen flex items-center bg-neutral-50 overflow-hidden py-16 lg:py-0 relative border-b border-[#e5e5e5]">
        <div className="absolute inset-0 pointer-events-none">
          <DotField dotRadius={1.5} dotSpacing={18} bulgeStrength={60} glowRadius={140} gradientFrom="rgba(236,72,153,0.18)" gradientTo="rgba(251,191,36,0.12)" glowColor="#fff0f5" />
        </div>
        {/* Parallax background blob */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ y: s2BgY }}
        >
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-pink-100/60 blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-yellow-100/40 blur-3xl" />
        </motion.div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            <motion.div
              className="flex-1 space-y-8"
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ type: "spring", damping: 16, stiffness: 60 }}
            >
              <div className="space-y-3">
                <motion.span
                  className="inline-block text-xs font-bold uppercase tracking-widest text-duo-pink bg-pink-50 border border-pink-100 rounded-full px-3 py-1 font-outfit"
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.05 }}
                >The Hard Truth</motion.span>
                <BlurText text="Most surveys are abandoned by question 3." direction="bottom" delay={80} stepDuration={0.4} className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#3c3c3c] font-fredoka leading-tight text-balance" />
                <BlurText text="People don't hate giving feedback — they hate the experience. Long, lifeless forms signal that their time doesn't matter." direction="bottom" delay={40} stepDuration={0.3} className="text-[#777777] text-lg font-outfit leading-relaxed max-w-md" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: <TrendingDown className="w-5 h-5 text-duo-pink" />, stat: '68%', label: 'Average drop-off rate on traditional surveys', bg: 'bg-pink-50', border: 'border-pink-100' },
                  { icon: <Clock className="w-5 h-5 text-sunshine-yellow" />, stat: '12s', label: 'Time before most respondents give up', bg: 'bg-yellow-50', border: 'border-yellow-100' },
                  { icon: <Frown className="w-5 h-5 text-[#afafaf]" />, stat: '1 in 4', label: 'People who ever finish a typical long form', bg: 'bg-[#f5f5f5]', border: 'border-[#e5e5e5]' },
                ].map(({ icon, stat, label, bg, border }, i) => (
                  <motion.div
                    key={stat}
                    className={`${bg} border-2 ${border} rounded-2xl p-5 space-y-2`}
                    initial={{ opacity: 0, y: 60, rotate: i % 2 === 0 ? -4 : 4 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                    viewport={{ once: false }}
                    whileHover={{ scale: 1.04, rotate: -1, transition: { type: "spring", stiffness: 400 } }}
                    transition={{ type: "spring", damping: 12, stiffness: 80, delay: i * 0.12 }}
                  >
                    {icon}
                    <div className="text-2xl font-bold tabular-nums text-[#3c3c3c] font-fredoka">{stat}</div>
                    <p className="text-xs text-[#777777] font-outfit leading-snug">{label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Boring form mockup — drifts on scroll */}
            <motion.div
              className="flex-1 flex justify-center"
              style={{ y: s2FormY }}
              initial={{ opacity: 0, y: 100, rotate: 6, scale: 0.85 }}
              whileInView={{ opacity: 1, y: 0, rotate: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ type: "spring", damping: 14, stiffness: 50, delay: 0.15 }}
            >
              <div className="relative w-full max-w-sm">
                <div className="bg-white border-2 border-[#e5e5e5] rounded-2xl p-6 shadow-[0_8px_0_#e5e5e5] space-y-4 opacity-70 grayscale select-none">
                  <div className="h-3 bg-neutral-200 rounded-full w-3/4" />
                  <div className="space-y-2">
                    <div className="h-2 bg-neutral-100 rounded w-full" />
                    <div className="h-2 bg-neutral-100 rounded w-5/6" />
                  </div>
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded border-2 border-neutral-200 shrink-0" />
                      <div className="h-2 bg-neutral-100 rounded flex-1" />
                    </div>
                  ))}
                  <div className="h-8 bg-neutral-200 rounded-lg w-full" />
                  <p className="text-center text-[10px] text-neutral-400 font-outfit">Question 3 of 24</p>
                </div>
                <motion.div
                  className="absolute -top-4 -right-4 bg-duo-pink text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-[0_3px_0_#a0266b] font-fredoka rotate-6"
                  animate={{ rotate: [6, 12, 6], scale: [1, 1.05, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >❌ Tab closed</motion.div>
                <motion.div
                  className="absolute -bottom-4 -left-4 bg-white border-2 border-[#e5e5e5] text-neutral-500 text-xs font-bold px-3 py-1.5 rounded-xl shadow-[0_3px_0_#e5e5e5] font-outfit -rotate-3"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >😴 So boring...</motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURES */}
      <section ref={s3Ref} className="lg:snap-start min-h-screen lg:h-screen flex items-center bg-white overflow-hidden py-16 lg:py-0 relative border-b border-[#e5e5e5]">
        <div className="absolute inset-0 pointer-events-none">
          <DotField dotRadius={1.5} dotSpacing={18} bulgeStrength={70} glowRadius={150} gradientFrom="rgba(88,204,2,0.15)" gradientTo="rgba(28,176,246,0.1)" glowColor="#f0fff4" />
        </div>
        <motion.div className="absolute inset-0 pointer-events-none" style={{ y: s3CardsY }}>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-green-50/80 blur-3xl -translate-y-1/2 translate-x-1/4" />
        </motion.div>

        <div className="container mx-auto px-6 max-w-6xl w-full relative z-10">
          <FeatureShowcase />
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section ref={s4Ref} className="lg:snap-start min-h-screen lg:h-screen flex items-center bg-neutral-50 overflow-hidden py-16 lg:py-0 relative border-b border-[#e5e5e5]">
        <div className="absolute inset-0 pointer-events-none">
          <DotField dotRadius={1.5} dotSpacing={18} bulgeStrength={60} glowRadius={140} gradientFrom="rgba(28,176,246,0.15)" gradientTo="rgba(88,204,2,0.1)" glowColor="#f0f9ff" />
        </div>
        <motion.div className="absolute inset-0 pointer-events-none" style={{ y: s4BgY }}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-sky-50/60 blur-3xl" />
        </motion.div>

        <div className="container mx-auto px-6 max-w-6xl w-full relative z-10">
          <motion.div
            className="text-center space-y-3 mb-12"
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ type: "spring", damping: 15, stiffness: 70 }}
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-3 py-1 font-outfit">How It Works</span>
            <BlurText text="From blank page to live quest in minutes." direction="bottom" delay={80} stepDuration={0.4} className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#3c3c3c] font-fredoka leading-tight text-balance" />
            <BlurText text="No design skills needed. No code. Just pick a theme, write your questions, and watch the responses roll in." direction="bottom" delay={35} stepDuration={0.3} className="text-[#777777] text-lg font-outfit max-w-xl mx-auto" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
            <div className="hidden md:block absolute top-[88px] left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-0.5 border-t-2 border-dashed border-[#e5e5e5] z-0" />

            {/* Step 01 — Write */}
            <motion.div
              className="relative bg-white border-2 border-[#e5e5e5] rounded-2xl overflow-hidden shadow-[0_6px_0_#e5e5e5] z-10 flex flex-col"
              initial={{ opacity: 0, y: 80, rotate: -5, scale: 0.88 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              viewport={{ once: false }}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 350 } }}
              transition={{ type: "spring", damping: 13, stiffness: 70 }}
            >
              {/* Mini survey builder mockup */}
              <div className="bg-[#f8fffe] border-b border-[#e5e5e5] p-4 space-y-2.5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-300" />
                  <div className="w-2 h-2 rounded-full bg-yellow-300" />
                  <div className="w-2 h-2 rounded-full bg-green-300" />
                  <div className="flex-1 h-4 bg-neutral-100 rounded-md ml-2" />
                </div>
                <div className="h-3 bg-duo-green/20 rounded-full w-4/5" />
                <div className="h-2 bg-neutral-100 rounded w-full" />
                <div className="h-2 bg-neutral-100 rounded w-3/4" />
                <div className="space-y-1.5 pt-1">
                  {['Option A', 'Option B', 'Option C'].map((o, i) => (
                    <div key={o} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-xs font-outfit ${i === 1 ? 'border-duo-green bg-[#d7ffb8] font-semibold text-[#3f8f01]' : 'border-[#e5e5e5] text-neutral-400'}`}>
                      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${i === 1 ? 'border-duo-green bg-duo-green' : 'border-neutral-300'}`} />
                      {o}
                    </div>
                  ))}
                </div>
                <motion.div
                  className="h-7 bg-duo-green rounded-lg w-full mt-1 flex items-center justify-center"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-[10px] font-bold text-white font-outfit">Next →</span>
                </motion.div>
              </div>
              <div className="p-5 space-y-3 flex-1">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 bg-[#d7ffb8] border-2 border-[#58cc02] rounded-xl flex items-center justify-center">
                    <Pencil className="w-5 h-5 text-duo-green" />
                  </div>
                  <span className="text-4xl font-bold text-neutral-100 font-fredoka select-none">01</span>
                </div>
                <h3 className="text-lg font-bold text-[#3c3c3c] font-fredoka">Write Your Questions</h3>
                <p className="text-xs text-[#777777] font-outfit leading-relaxed">Start with a blank canvas or a template. Type naturally — we handle the design.</p>
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full border text-[#3f8f01] bg-[#d7ffb8] border-[#58cc02] font-outfit">~2 minutes</span>
              </div>
            </motion.div>

            {/* Step 02 — Pick Theme */}
            <motion.div
              className="relative bg-white border-2 border-[#e5e5e5] rounded-2xl overflow-hidden shadow-[0_6px_0_#e5e5e5] z-10 flex flex-col"
              initial={{ opacity: 0, y: 80, scale: 0.88 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false }}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 350 } }}
              transition={{ type: "spring", damping: 13, stiffness: 70, delay: 0.14 }}
            >
              {/* Theme picker mockup with real images */}
              <div className="bg-yellow-50 border-b border-[#e5e5e5] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-600 font-outfit mb-3">Choose your theme</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { src: '/theme-garden.png', label: 'Garden', active: true },
                    { src: '/theme-sundae.png', label: 'Sundae', active: false },
                    { src: '/theme-coffee.png', label: 'Coffee', active: false },
                  ].map(({ src, label, active }) => (
                    <div key={label} className={`rounded-xl overflow-hidden border-2 transition-all ${active ? 'border-sunshine-yellow shadow-[0_3px_0_#e6aa00]' : 'border-transparent opacity-60'}`}>
                      <Image src={src} alt={label} width={80} height={60} className="w-full object-cover h-14" />
                      <p className={`text-center text-[9px] font-bold py-1 font-outfit ${active ? 'text-yellow-700 bg-yellow-100' : 'text-neutral-400'}`}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 space-y-3 flex-1">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 bg-yellow-50 border-2 border-sunshine-yellow rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-sunshine-yellow" />
                  </div>
                  <span className="text-4xl font-bold text-neutral-100 font-fredoka select-none">02</span>
                </div>
                <h3 className="text-lg font-bold text-[#3c3c3c] font-fredoka">Pick Your Adventure</h3>
                <p className="text-xs text-[#777777] font-outfit leading-relaxed">Choose a game theme. Each answer grows a garden, builds a sundae, or brews a coffee.</p>
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full border text-yellow-700 bg-yellow-50 border-yellow-200 font-outfit">The fun part</span>
              </div>
            </motion.div>

            {/* Step 03 — Results */}
            <motion.div
              className="relative bg-white border-2 border-[#e5e5e5] rounded-2xl overflow-hidden shadow-[0_6px_0_#e5e5e5] z-10 flex flex-col"
              initial={{ opacity: 0, y: 80, rotate: 5, scale: 0.88 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              viewport={{ once: false }}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 350 } }}
              transition={{ type: "spring", damping: 13, stiffness: 70, delay: 0.28 }}
            >
              {/* Analytics mockup */}
              <div className="bg-sky-50 border-b border-[#e5e5e5] p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 font-outfit">Responses today</span>
                  <span className="text-xs font-bold text-duo-green font-fredoka">+34%</span>
                </div>
                {/* Bar chart */}
                <div className="flex items-end gap-1.5 h-16">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t-md bg-sky-blue/20"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: false }}
                      transition={{ type: "spring", damping: 15, stiffness: 80, delay: 0.3 + i * 0.05 }}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                {/* Completion funnel */}
                <div className="space-y-1">
                  {[{ label: 'Started', pct: 100, color: 'bg-sky-blue' }, { label: 'Halfway', pct: 78, color: 'bg-duo-green' }, { label: 'Finished', pct: 91, color: 'bg-sunshine-yellow' }].map(({ label, pct, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[9px] text-neutral-400 font-outfit w-12">{label}</span>
                      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${color} rounded-full`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: false }}
                          transition={{ duration: 0.8, delay: 0.4 }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-neutral-500 font-outfit">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 space-y-3 flex-1">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 bg-sky-50 border-2 border-sky-blue rounded-xl flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-sky-blue" />
                  </div>
                  <span className="text-4xl font-bold text-neutral-100 font-fredoka select-none">03</span>
                </div>
                <h3 className="text-lg font-bold text-[#3c3c3c] font-fredoka">Share & Watch Results</h3>
                <p className="text-xs text-[#777777] font-outfit leading-relaxed">One link. Share anywhere. Real-time analytics show engagement and drop-off in seconds.</p>
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full border text-sky-700 bg-sky-50 border-sky-200 font-outfit">See it live</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 5: CHOOSE YOUR ADVENTURE */}
      <section ref={s5Ref} className="lg:snap-start min-h-screen lg:h-screen flex items-center bg-white overflow-hidden py-12 lg:py-0 relative border-b border-[#e5e5e5]">
        <div className="absolute inset-0 pointer-events-none">
          <DotField dotRadius={1.5} dotSpacing={18} bulgeStrength={65} glowRadius={150} gradientFrom="rgba(165,112,255,0.18)" gradientTo="rgba(204,52,141,0.1)" glowColor="#fdf4ff" />
        </div>
        <div className="container mx-auto px-6 max-w-6xl w-full">
          <div className="flex flex-col lg:flex-row items-stretch gap-10 lg:gap-16">

            {/* Left */}
            <motion.div
              className="lg:w-64 shrink-0 flex flex-col justify-center space-y-5"
              style={{ x: s5LeftX }}
              initial={{ opacity: 0, x: -80, scale: 0.9 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ type: "spring", damping: 15, stiffness: 60 }}
            >
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-3 py-1 font-outfit w-fit">The Adventures</span>
              <BlurText text="Every survey tells a story." direction="bottom" delay={80} stepDuration={0.4} className="text-3xl sm:text-4xl font-bold text-[#3c3c3c] font-fredoka leading-tight text-balance" />
              <BlurText text="Choose from a growing library of immersive themes. Each question plants a seed, scoops ice cream, or pulls an espresso shot — respondents can't help but finish." direction="bottom" delay={35} stepDuration={0.3} className="text-[#777777] font-outfit leading-relaxed text-sm" />
              <Link href="/login">
                <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 border-b-4 border-b-orange-700 shadow-[0_4px_0_#c2410c] active:translate-y-[2px] active:shadow-none text-white font-bold rounded-xl btn-3d text-sm flex items-center gap-2 font-fredoka transition-all w-fit">
                  Start Your Adventure <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>

            {/* Cards grid — fills remaining height */}
            <motion.div className="flex-1 grid grid-cols-2 gap-4 lg:grid-rows-2" style={{ x: s5RightX }}>
              {[
                { img: '/theme-garden.png', name: 'Flower Garden', desc: 'Each answer grows a new bloom. By the end, respondents have a full garden — and you have full data.', bg: 'bg-[#d7ffb8]', border: 'border-[#58cc02]', shadow: 'shadow-[0_6px_0_#3f8f01]', tag: 'Most Popular', tagColor: 'text-[#3f8f01] bg-white border-[#58cc02]', rotate: -2 },
                { img: '/theme-sundae.png', name: 'Giant Sundae', desc: 'Build a towering ice cream masterpiece one scoop at a time. Delicious engagement guaranteed.', bg: 'bg-pink-50', border: 'border-pink-200', shadow: 'shadow-[0_6px_0_#fbcfe8]', tag: 'Fan Favourite', tagColor: 'text-pink-600 bg-white border-pink-200', rotate: 2 },
                { img: '/theme-coffee.png', name: 'Espresso Quest', desc: 'Grind beans, pull shots, steam milk. A barista journey that keeps coffee lovers hooked.', bg: 'bg-amber-50', border: 'border-amber-200', shadow: 'shadow-[0_6px_0_#fde68a]', tag: 'B2B Ready', tagColor: 'text-amber-700 bg-white border-amber-200', rotate: 2 },
                { img: '/theme-home.png', name: 'Home Builder', desc: 'Design your dream space, room by room. A cozy journey that keeps respondents curious till the end.', bg: 'bg-sky-50', border: 'border-sky-200', shadow: 'shadow-[0_6px_0_#bae6fd]', tag: 'New', tagColor: 'text-sky-600 bg-white border-sky-200', rotate: -2 },
              ].map(({ img, name, desc, bg, border, shadow, tag, tagColor, rotate }, i) => (
                <motion.div
                  key={name}
                  className={`${bg} border-2 ${border} rounded-2xl overflow-hidden ${shadow} cursor-default select-none group flex flex-col`}
                  initial={{ opacity: 0, y: 80, rotate: rotate * 2, scale: 0.85 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                  viewport={{ once: false }}
                  whileHover={{ y: -8, rotate: rotate * 0.4, scale: 1.02, transition: { type: "spring", stiffness: 300 } }}
                  transition={{ type: "spring", damping: 13, stiffness: 70, delay: i * 0.1 }}
                >
                  <div className="relative flex-1 min-h-[160px] overflow-hidden">
                    <Image src={img} alt={name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
                    <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagColor} font-outfit backdrop-blur-sm`}>{tag}</span>
                  </div>
                  <div className="p-4 space-y-1">
                    <h3 className="font-bold text-[#3c3c3c] font-fredoka text-base">{name}</h3>
                    <p className="text-xs text-[#777777] font-outfit leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>
      </section>

      {/* SECTION 6: TESTIMONIALS */}
      <section ref={s6Ref} className="lg:snap-start min-h-screen lg:h-screen flex flex-col justify-center bg-neutral-50 overflow-hidden py-12 relative border-b border-[#e5e5e5]">
        <div className="absolute inset-0 pointer-events-none">
          <DotField dotRadius={1.5} dotSpacing={18} bulgeStrength={60} glowRadius={140} gradientFrom="rgba(28,176,246,0.15)" gradientTo="rgba(165,112,255,0.1)" glowColor="#f0f9ff" />
        </div>
        <motion.div className="absolute inset-0 pointer-events-none" style={{ y: s6BgY }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-sky-100/40 blur-3xl" />
        </motion.div>

        <div className="container mx-auto px-6 max-w-6xl w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-12">
            <motion.div
              className="flex-1 space-y-4 text-center lg:text-left"
              initial={{ opacity: 0, x: -100, skewX: -4 }}
              whileInView={{ opacity: 1, x: 0, skewX: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ type: "spring", damping: 15, stiffness: 55 }}
            >
              <BlurText text="Loved by teams worldwide." direction="bottom" delay={80} stepDuration={0.4} className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#3c3c3c] font-fredoka leading-tight text-balance" />
              <BlurText text="Join thousands of users who have transformed their feedback loops into engaging experiences that people actually finish." direction="bottom" delay={35} stepDuration={0.3} className="text-[#777777] text-lg font-outfit max-w-xl leading-relaxed" />
            </motion.div>

            <div className="flex gap-4 w-full lg:w-auto min-w-[320px]">
              {[
                { value: '98%', label: 'Satisfaction', color: 'text-orange-500' },
                { value: '3.5M+', label: 'Quests Done', color: 'text-[#3c3c3c]' },
              ].map(({ value, label, color }, i) => (
                <motion.div
                  key={label}
                  className="bg-white p-6 rounded-2xl border-2 border-[#e5e5e5] shadow-[0_4px_0_#e5e5e5] flex-1 text-center"
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: false }}
                  whileHover={{ scale: 1.06, y: -4, transition: { type: "spring", stiffness: 400 } }}
                  transition={{ type: "spring", damping: 12, stiffness: 100, delay: 0.1 + i * 0.1 }}
                >
                  <div className={`text-3xl font-bold tabular-nums ${color} mb-1 font-fredoka`}>{value}</div>
                  <div className="text-xs text-[#afafaf] uppercase tracking-wider font-black font-outfit">{label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          className="w-full relative overflow-hidden py-4 flex flex-col gap-4"
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ type: "spring", damping: 18, stiffness: 60, delay: 0.1 }}
        >
          <Marquee pauseOnHover repeat={2} className="[--duration:35s] w-full">
            {testimonials.map((review) => (
              <TestimonialCard key={review.username} {...review} />
            ))}
          </Marquee>
          <Marquee pauseOnHover reverse repeat={2} className="[--duration:30s] w-full">
            {[...testimonials].reverse().map((review) => (
              <TestimonialCard key={review.username} {...review} />
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-neutral-50 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-neutral-50 to-transparent z-10" />
        </motion.div>
      </section>

      {/* SECTION 7: CTA & FOOTER */}
      <section className="lg:snap-start min-h-screen lg:h-screen flex flex-col bg-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <DotField dotRadius={1.5} dotSpacing={18} bulgeStrength={70} glowRadius={160} gradientFrom="rgba(249,115,22,0.10)" gradientTo="rgba(251,191,36,0.06)" glowColor="#fff7ed" />
        </div>
        <div className="flex items-center justify-center pt-16 px-6">
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 100, scale: 0.88 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ type: "spring", damping: 14, stiffness: 55 }}
          >
            <CallToAction />
          </motion.div>
        </div>

        <div className="relative flex-1 min-h-[480px]">
          <FooterLinks />
          <div className="absolute bottom-0 left-0 right-0 h-[340px]">
            <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
          </div>
        </div>
      </section>

    </div>
  );
}
