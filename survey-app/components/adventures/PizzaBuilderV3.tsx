'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowLeft, RotateCcw, Check, PartyPopper, Ruler, Layers, Flame, Droplets, Star, Leaf, Sparkles, Bike, type LucideIcon } from 'lucide-react';
import type { Answer, ProgressUpdate, Question } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Topping = 'Pepperoni' | 'Mushrooms' | 'Peppers' | 'Olives' | 'Basil' | 'Jalapeños';

interface Selections {
  size: string;
  crust: string;
  cookStyle: string;
  sauce: string;
  cheese: string;
  toppings: Topping[];
  drizzle: string;
  occasion: string;
}

const INITIAL: Selections = {
  size: '', crust: '', cookStyle: '', sauce: '', cheese: '',
  toppings: [], drizzle: '', occasion: '',
};

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = ['size', 'crust', 'cookStyle', 'sauce', 'cheese', 'toppings', 'drizzle', 'occasion'] as const;
type Step = typeof STEPS[number];

interface StepConfig {
  label: string;
  subtitle: string;
  emoji: string;
  options: string[];
  multi?: boolean;
}

const STEP_CONFIG: Record<Step, StepConfig> = {
  size: {
    label: 'How hungry are you?',
    subtitle: 'Pick your pizza size',
    emoji: '📐',
    options: ['Personal', 'Large', 'Party'],
  },
  crust: {
    label: 'Choose your crust',
    subtitle: 'The foundation matters',
    emoji: '🍞',
    options: ['Thin', 'Regular', 'Deep Dish'],
  },
  cookStyle: {
    label: 'How should we cook it?',
    subtitle: 'Changes the char and texture',
    emoji: '🔥',
    options: ['Classic Oven', 'Stone Baked', 'Wood Fired'],
  },
  sauce: {
    label: 'Pick your base',
    subtitle: 'What goes under the cheese',
    emoji: '🍅',
    options: ['Tomato', 'Creamy Garlic', 'Pesto'],
  },
  cheese: {
    label: 'Add cheese',
    subtitle: 'Pick your melt',
    emoji: '🧀',
    options: ['Mozzarella', 'Cheddar', 'Vegan'],
  },
  toppings: {
    label: 'Top it off',
    subtitle: 'Select as many as you like',
    emoji: '🫒',
    options: ['Pepperoni', 'Mushrooms', 'Peppers', 'Olives', 'Basil', 'Jalapeños'],
    multi: true,
  },
  drizzle: {
    label: 'Finishing drizzle?',
    subtitle: 'A little extra goes a long way',
    emoji: '🫗',
    options: ['None', 'Olive Oil', 'Chili Honey', 'Balsamic'],
  },
  occasion: {
    label: 'How are you getting it?',
    subtitle: 'Last step — almost there',
    emoji: '🛵',
    options: ['Delivery', 'Dine In', 'Takeaway'],
  },
};

// ─── Step icons (Lucide) ──────────────────────────────────────────────────────

const STEP_ICON: Record<Step, LucideIcon> = {
  size:      Ruler,
  crust:     Layers,
  cookStyle: Flame,
  sauce:     Droplets,
  cheese:    Star,
  toppings:  Leaf,
  drizzle:   Sparkles,
  occasion:  Bike,
};

// ─── Visual config ────────────────────────────────────────────────────────────

// Cook style: controls crust char intensity & bubble count
const COOK_STYLE_CFG: Record<string, { charOpacity: number; bubbleCount: number; darkPatch: boolean }> = {
  'Classic Oven': { charOpacity: 0.18, bubbleCount: 12, darkPatch: false },
  'Stone Baked':  { charOpacity: 0.32, bubbleCount: 20, darkPatch: false },
  'Wood Fired':   { charOpacity: 0.55, bubbleCount: 26, darkPatch: true },
};

// Drizzle: SVG stroke color and pattern
const DRIZZLE_CFG: Record<string, { stroke: string; opacity: number } | null> = {
  'None':        null,
  'Olive Oil':   { stroke: '#d4a017', opacity: 0.65 },
  'Chili Honey': { stroke: '#e8640a', opacity: 0.70 },
  'Balsamic':    { stroke: '#3a1a0a', opacity: 0.55 },
};


const _CRUST_STYLE: Record<string, { border: string; bg: string }> = {
  Thin:       { border: 'border-[10px]', bg: 'border-[#c8894e]' },
  Regular:    { border: 'border-[18px]', bg: 'border-[#b87840]' },
  'Deep Dish':{ border: 'border-[28px]', bg: 'border-[#8b5e3c]' },
};

const _SAUCE_BG: Record<string, string> = {
  Tomato:          'bg-[#c8382a]',
  'Creamy Garlic': 'bg-[#f0e8c0]',
  Pesto:           'bg-[#4a7c3f]',
};

const _CHEESE_BG: Record<string, string> = {
  Mozzarella: 'bg-[#fff5b0]',
  Cheddar:    'bg-[#f5c234]',
  Vegan:      'bg-[#e8e8d0]',
};

// ─── SVG topping shapes (no background, fully transparent) ───────────────────

function ToppingSVG({ type, size = 34 }: { type: Topping; size?: number }) {
  const s = size;
  switch (type) {
    case 'Pepperoni':
      return (
        <svg width={s} height={s} viewBox="0 0 34 34" fill="none">
          <circle cx="17" cy="17" r="15" fill="#c03030" stroke="#8b2020" strokeWidth="1.5"/>
          <circle cx="17" cy="17" r="15" fill="url(#pep-grain)" opacity="0.3"/>
          <circle cx="12" cy="13" r="2.2" fill="#8b1a1a" opacity="0.7"/>
          <circle cx="21" cy="16" r="1.7" fill="#8b1a1a" opacity="0.7"/>
          <circle cx="14" cy="22" r="1.5" fill="#8b1a1a" opacity="0.7"/>
          <circle cx="20" cy="23" r="1" fill="#8b1a1a" opacity="0.5"/>
          <defs>
            <radialGradient id="pep-grain" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#e85050"/>
              <stop offset="100%" stopColor="#901818"/>
            </radialGradient>
          </defs>
        </svg>
      );
    case 'Mushrooms':
      return (
        <svg width={s} height={s} viewBox="0 0 34 34" fill="none">
          <ellipse cx="17" cy="22" rx="9" ry="5.5" fill="#c4b49a" stroke="#9a8870" strokeWidth="1"/>
          <path d="M8 22 Q8 10 17 9 Q26 10 26 22" fill="#d4c4aa" stroke="#9a8870" strokeWidth="1"/>
          <line x1="17" y1="11" x2="17" y2="27" stroke="#a09070" strokeWidth="0.8" opacity="0.5"/>
          <ellipse cx="12" cy="16" rx="2.5" ry="1.5" fill="#b8a88a" opacity="0.5" transform="rotate(-15 12 16)"/>
        </svg>
      );
    case 'Peppers':
      return (
        <svg width={s} height={s} viewBox="0 0 34 34" fill="none">
          <ellipse cx="17" cy="17" rx="14" ry="8" fill="#e8f5e8" stroke="#4a9a4a" strokeWidth="1.5"/>
          <ellipse cx="17" cy="17" rx="10" ry="4.5" fill="none" stroke="#4a9a4a" strokeWidth="1.2"/>
          <ellipse cx="17" cy="17" rx="6" ry="2" fill="none" stroke="#4a9a4a" strokeWidth="1"/>
          <line x1="3" y1="17" x2="31" y2="17" stroke="#4a9a4a" strokeWidth="1" opacity="0.4"/>
          <rect x="14" y="4" width="6" height="5" rx="2" fill="#3d8b3d"/>
          <rect x="14" y="25" width="6" height="5" rx="2" fill="#3d8b3d"/>
        </svg>
      );
    case 'Olives':
      return (
        <svg width={s} height={s} viewBox="0 0 34 34" fill="none">
          <ellipse cx="17" cy="17" rx="13" ry="10" fill="#2e2e2e" stroke="#111" strokeWidth="1"/>
          <ellipse cx="17" cy="17" rx="5" ry="3.5" fill="#d04000"/>
          <ellipse cx="17" cy="14" rx="13" ry="4" fill="#3a3a3a" opacity="0.5"/>
        </svg>
      );
    case 'Basil':
      return (
        <svg width={s} height={s} viewBox="0 0 34 34" fill="none">
          <path d="M17 4 Q28 10 26 22 Q20 30 17 30 Q14 30 8 22 Q6 10 17 4Z" fill="#3a8a30" stroke="#1e5a18" strokeWidth="1"/>
          <path d="M17 6 Q23 13 21 22 Q19 27 17 28" stroke="#2d6a24" strokeWidth="1" fill="none" opacity="0.7"/>
          <path d="M17 6 Q11 13 13 22 Q15 27 17 28" stroke="#2d6a24" strokeWidth="1" fill="none" opacity="0.5"/>
        </svg>
      );
    case 'Jalapeños':
      return (
        <svg width={s} height={s} viewBox="0 0 34 34" fill="none">
          <path d="M10 28 Q8 18 14 10 Q18 5 22 6 Q26 9 24 16 Q20 26 14 29 Q12 30 10 28Z" fill="#5cb85c" stroke="#3a8a3a" strokeWidth="1"/>
          <path d="M12 26 Q11 17 16 11 Q19 7 21 8" stroke="#2d6a2d" strokeWidth="0.9" fill="none" opacity="0.7"/>
          <ellipse cx="21" cy="7" rx="3" ry="2" fill="#8bc45a" transform="rotate(-30 21 7)"/>
        </svg>
      );
  }
}

const SIZE_SCALE: Record<string, number> = {
  Personal: 0.72,
  Large:    0.88,
  Party:    1,
};

// ─── Pizza name generator ─────────────────────────────────────────────────────

function getPizzaName(sel: Selections): string {
  const sauceWord: Record<string, string> = {
    Tomato: 'Classic', 'Creamy Garlic': "Garlic Lover's", Pesto: 'Garden',
  };
  const toppingWord: Record<Topping, string> = {
    Pepperoni: 'Pepperoni', Mushrooms: 'Funghi', Peppers: 'Pepper',
    Olives: 'Olive', Basil: 'Margherita', Jalapeños: 'Diablo',
  };
  const cookWord: Record<string, string> = {
    'Classic Oven': '', 'Stone Baked': 'Stone-Baked', 'Wood Fired': 'Wood-Fired',
  };
  const prefix = sauceWord[sel.sauce] ?? 'House';
  const star = sel.toppings[0];
  const noun = star ? toppingWord[star] : 'Special';
  const cook = sel.cookStyle ? cookWord[sel.cookStyle] : '';
  return cook ? `The ${cook} ${prefix} ${noun}` : `The ${prefix} ${noun}`;
}

// ─── Pizza SVG config ─────────────────────────────────────────────────────────

const C = 160; // SVG centre
const PLATE_R = 154;

const CRUST_R: Record<string, number> = {
  Thin: 148, Regular: 140, 'Deep Dish': 128,
};
const SAUCE_R: Record<string, number> = {
  Thin: 132, Regular: 120, 'Deep Dish': 104,
};
const CHEESE_R: Record<string, number> = {
  Thin: 122, Regular: 110, 'Deep Dish': 94,
};

const CRUST_COLOR: Record<string, { fill: string; dark: string; light: string }> = {
  Thin:        { fill: '#d4a05a', dark: '#a07030', light: '#e8c080' },
  Regular:     { fill: '#c2894e', dark: '#8a5a28', light: '#dca870' },
  'Deep Dish': { fill: '#8b5e3c', dark: '#5a3010', light: '#b08050' },
};

const SAUCE_COLOR_SVG: Record<string, { fill: string; dark: string }> = {
  Tomato:          { fill: '#c8382a', dark: '#8b1a10' },
  'Creamy Garlic': { fill: '#f0e8c0', dark: '#c8bc80' },
  Pesto:           { fill: '#4a7c3f', dark: '#2a4a20' },
};

const CHEESE_COLOR_SVG: Record<string, { fill: string; blob: string }> = {
  Mozzarella: { fill: '#fff5b0', blob: '#ffe860' },
  Cheddar:    { fill: '#f5c234', blob: '#e8a010' },
  Vegan:      { fill: '#e8e8d0', blob: '#c8c8a0' },
};

// Crust bubble positions — count controlled by cook style
function getCrustBubbles(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + i * 0.4;
    return { angle, r: 2.5 + (i * 7) % 3.5 };
  });
}

// Drizzle path — lazy S-curves across the pizza face
function getDrizzlePath(cx: number, cy: number, r: number): string {
  const paths = [];
  for (let i = 0; i < 3; i++) {
    const startAngle = (i / 3) * Math.PI * 2;
    const sx = cx + (r * 0.7) * Math.cos(startAngle);
    const sy = cy + (r * 0.7) * Math.sin(startAngle);
    const ex = cx + (r * 0.55) * Math.cos(startAngle + Math.PI);
    const ey = cy + (r * 0.55) * Math.sin(startAngle + Math.PI);
    const c1x = cx + r * 0.9 * Math.cos(startAngle + 0.8);
    const c1y = cy + r * 0.9 * Math.sin(startAngle + 0.8);
    const c2x = cx + r * 0.8 * Math.cos(startAngle + 1.8);
    const c2y = cy + r * 0.8 * Math.sin(startAngle + 1.8);
    paths.push(`M${sx},${sy} C${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`);
  }
  return paths.join(' ');
}

// Irregular cheese blob points (slightly wobbly circle)
function cheeseBlobs(cx: number, cy: number, baseR: number, count = 10): string {
  const pts = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const wobble = baseR + ((i * 7 + 3) % 12) - 6;
    return `${cx + wobble * Math.cos(a)},${cy + wobble * Math.sin(a)}`;
  });
  return pts.join(' ');
}

// Slice score lines (8 slices)
const SLICE_ANGLES = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

// Topping scatter positions (golden angle spiral, in SVG coordinate space)
function getToppingPositions(toppings: Topping[], cheeseRadius: number) {
  return toppings.flatMap((topping, ti) => {
    const count = topping === 'Pepperoni' ? 9 : 6;
    return Array.from({ length: count }, (_, i) => {
      const idx = ti * 11 + i;
      const angle = idx * 137.508 * (Math.PI / 180);
      const maxR = cheeseRadius - 20;
      const r = 12 + (idx * 17) % (maxR - 12);
      return {
        topping,
        x: C + r * Math.cos(angle),
        y: C + r * Math.sin(angle),
        rotate: (idx * 53) % 360,
        key: `${topping}-${i}`,
        size: 28 + (idx % 3) * 3,
      };
    });
  });
}

// ─── Pizza visual ─────────────────────────────────────────────────────────────

function PizzaVisual({ sel, prefersReduced }: { sel: Selections; prefersReduced: boolean | null }) {
  const scale = sel.size ? SIZE_SCALE[sel.size] ?? 1 : 0.88;

  const crustR  = sel.crust  ? CRUST_R[sel.crust]   : CRUST_R['Regular'];
  const sauceR  = sel.sauce  ? SAUCE_R[sel.crust ?? 'Regular']  : SAUCE_R['Regular'];
  const cheeseR = sel.cheese ? CHEESE_R[sel.crust ?? 'Regular'] : CHEESE_R['Regular'];

  const crustCol  = sel.crust  ? CRUST_COLOR[sel.crust]       : null;
  const sauceCol  = sel.sauce  ? SAUCE_COLOR_SVG[sel.sauce]   : null;
  const cheeseCol = sel.cheese ? CHEESE_COLOR_SVG[sel.cheese] : null;

  const cookCfg    = sel.cookStyle ? COOK_STYLE_CFG[sel.cookStyle] : COOK_STYLE_CFG['Stone Baked'];
  const drizzleCfg = sel.drizzle && sel.drizzle !== 'None' ? DRIZZLE_CFG[sel.drizzle] : null;

  const crustBubbles = getCrustBubbles(cookCfg.bubbleCount);
  const positions = getToppingPositions(sel.toppings, cheeseR);

  const spring = { type: 'spring' as const, stiffness: 300, damping: 24 };

  return (
    <div className="flex items-center justify-center w-full select-none">
      {/* Drop shadow */}
      <div className="relative" style={{ filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.18))' }}>
        <motion.div
          animate={{ scale }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <svg width="320" height="320" viewBox="0 0 320 320" aria-label="Your pizza" role="img">
            <defs>
              {/* Plate gradient */}
              <radialGradient id="plate-grad" cx="40%" cy="35%">
                <stop offset="0%" stopColor="#faf8f4"/>
                <stop offset="100%" stopColor="#e0dbd0"/>
              </radialGradient>
              {/* Inner shadow on crust */}
              <radialGradient id="crust-inner" cx="50%" cy="50%" r="50%">
                <stop offset="85%" stopColor="rgba(0,0,0,0)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0.18)"/>
              </radialGradient>
              {/* Sauce texture */}
              <radialGradient id="sauce-grad" cx="45%" cy="40%">
                <stop offset="0%" stopColor={sauceCol ? sauceCol.fill : '#c8382a'} stopOpacity="0.6"/>
                <stop offset="100%" stopColor={sauceCol ? sauceCol.dark : '#8b1a10'}/>
              </radialGradient>
              {/* Cheese sheen */}
              <radialGradient id="cheese-sheen" cx="38%" cy="32%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.55)"/>
                <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
              </radialGradient>
              {/* Clip for topping area */}
              <clipPath id="pizza-clip">
                <circle cx={C} cy={C} r={cheeseR + 4}/>
              </clipPath>
            </defs>

            {/* ── Plate ── */}
            <circle cx={C} cy={C} r={PLATE_R} fill="url(#plate-grad)" stroke="#ccc6bc" strokeWidth="2"/>
            {/* Plate rim highlight */}
            <circle cx={C} cy={C} r={PLATE_R - 1} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="3"/>

            {/* ── Crust ── */}
            {crustCol && (
              <motion.g
                key="crust"
                initial={prefersReduced ? {} : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring}
                style={{ transformOrigin: `${C}px ${C}px` }}
              >
                {/* Crust base */}
                <circle cx={C} cy={C} r={crustR} fill={crustCol.fill}/>
                {/* Crust edge highlight */}
                <circle cx={C} cy={C} r={crustR} fill="none" stroke={crustCol.light} strokeWidth="3" opacity="0.5"/>
                {/* Charred edge */}
                <circle cx={C} cy={C} r={crustR - 2} fill="none" stroke={crustCol.dark} strokeWidth="2" opacity="0.4"/>
                {/* Baked bubbles on crust ring — count & opacity driven by cook style */}
                {crustBubbles.map(({ angle, r }, i) => {
                  const mid = (crustR + (SAUCE_R[sel.crust ?? 'Regular'])) / 2;
                  const bx = C + mid * Math.cos(angle);
                  const by = C + mid * Math.sin(angle);
                  return (
                    <ellipse
                      key={i}
                      cx={bx} cy={by}
                      rx={r} ry={r * 0.8}
                      fill={crustCol.dark}
                      opacity={cookCfg.charOpacity * (0.8 + (i % 3) * 0.2)}
                      transform={`rotate(${angle * 57.3} ${bx} ${by})`}
                    />
                  );
                })}
                {/* Wood fired: random dark char patches */}
                {cookCfg.darkPatch && Array.from({ length: 6 }, (_, i) => {
                  const a = (i / 6) * Math.PI * 2 + 0.5;
                  const mid = (crustR + (SAUCE_R[sel.crust ?? 'Regular'])) / 2;
                  return (
                    <ellipse
                      key={`patch-${i}`}
                      cx={C + mid * Math.cos(a)}
                      cy={C + mid * Math.sin(a)}
                      rx={7 + (i * 5) % 8}
                      ry={4 + (i * 3) % 5}
                      fill="#1a0a00"
                      opacity="0.45"
                      transform={`rotate(${a * 57.3} ${C + mid * Math.cos(a)} ${C + mid * Math.sin(a)})`}
                    />
                  );
                })}
                {/* Inner shadow on crust */}
                <circle cx={C} cy={C} r={crustR} fill="url(#crust-inner)"/>
              </motion.g>
            )}

            {/* ── Sauce ── */}
            {sauceCol && (
              <motion.g
                key={`sauce-${sel.sauce}`}
                initial={prefersReduced ? {} : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring}
                style={{ transformOrigin: `${C}px ${C}px` }}
              >
                <circle cx={C} cy={C} r={sauceR} fill="url(#sauce-grad)"/>
                {/* Sauce texture dots */}
                {Array.from({ length: 22 }, (_, i) => {
                  const a = i * 1.3;
                  const dr = 14 + (i * 11) % (sauceR - 28);
                  return (
                    <circle
                      key={i}
                      cx={C + dr * Math.cos(a)}
                      cy={C + dr * Math.sin(a)}
                      r={1.5 + (i % 3)}
                      fill={sauceCol.dark}
                      opacity="0.3"
                    />
                  );
                })}
                {/* Sauce edge shadow */}
                <circle cx={C} cy={C} r={sauceR} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="3"/>
              </motion.g>
            )}

            {/* ── Cheese ── */}
            {cheeseCol && (
              <motion.g
                key={`cheese-${sel.cheese}`}
                initial={prefersReduced ? {} : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring}
                style={{ transformOrigin: `${C}px ${C}px` }}
              >
                {/* Irregular melt edge */}
                <polygon
                  points={cheeseBlobs(C, C, cheeseR, 14)}
                  fill={cheeseCol.fill}
                  opacity="0.95"
                />
                {/* Cheese blob highlights */}
                {Array.from({ length: 8 }, (_, i) => {
                  const a = (i / 8) * Math.PI * 2 + 0.3;
                  const br = cheeseR * 0.45 + (i * 9) % (cheeseR * 0.3);
                  return (
                    <ellipse
                      key={i}
                      cx={C + br * Math.cos(a)}
                      cy={C + br * Math.sin(a)}
                      rx={10 + (i % 3) * 4}
                      ry={8 + (i % 2) * 3}
                      fill={cheeseCol.blob}
                      opacity="0.35"
                      transform={`rotate(${a * 57.3 + 20} ${C + br * Math.cos(a)} ${C + br * Math.sin(a)})`}
                    />
                  );
                })}
                {/* Cheese sheen */}
                <polygon
                  points={cheeseBlobs(C, C, cheeseR, 14)}
                  fill="url(#cheese-sheen)"
                />
              </motion.g>
            )}

            {/* ── Slice score lines (visible once sauce is added) ── */}
            {sel.sauce && (
              <g opacity="0.18">
                {SLICE_ANGLES.map((a, i) => (
                  <line
                    key={i}
                    x1={C} y1={C}
                    x2={C + sauceR * Math.cos(a)}
                    y2={C + sauceR * Math.sin(a)}
                    stroke="#000"
                    strokeWidth="1.2"
                    strokeDasharray="3 5"
                  />
                ))}
              </g>
            )}

            {/* ── Toppings ── */}
            <AnimatePresence>
              {positions.map(({ topping, x, y, rotate, key, size }) => (
                <motion.g
                  key={key}
                  initial={prefersReduced ? {} : { scale: 0, opacity: 0, y: y - 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                >
                  <g transform={`translate(${x - size / 2} ${y - size / 2}) rotate(${rotate} ${size / 2} ${size / 2})`}>
                    <ToppingSVG type={topping as Topping} size={size} />
                  </g>
                </motion.g>
              ))}
            </AnimatePresence>

            {/* ── Drizzle (path-draw animation) ── */}
            {drizzleCfg && sel.cheese && (
              <motion.g key={`drizzle-${sel.drizzle}`} exit={{ opacity: 0 }}>
                <clipPath id="drizzle-clip">
                  <circle cx={C} cy={C} r={cheeseR + 4}/>
                </clipPath>
                <motion.path
                  d={getDrizzlePath(C, C, cheeseR - 4)}
                  stroke={drizzleCfg.stroke}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  clipPath="url(#drizzle-clip)"
                  initial={prefersReduced ? {} : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: drizzleCfg.opacity }}
                  transition={{ duration: 1.0, ease: 'easeInOut' }}
                />
                <motion.path
                  d={getDrizzlePath(C, C, cheeseR - 16)}
                  stroke={drizzleCfg.stroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  clipPath="url(#drizzle-clip)"
                  initial={prefersReduced ? {} : { pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: drizzleCfg.opacity * 0.5 }}
                  transition={{ duration: 1.0, ease: 'easeInOut', delay: 0.2 }}
                />
              </motion.g>
            )}


            {/* ── Empty state ── */}
            {!sel.crust && (
              <text x={C} y={C + 6} textAnchor="middle" fill="#c0b8b0" fontSize="12" fontFamily="sans-serif">
                Your pizza starts here
              </text>
            )}
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div
      className="flex gap-1.5 w-full"
      role="progressbar"
      aria-valuenow={step + 1}
      aria-valuemin={1}
      aria-valuemax={STEPS.length}
      aria-label={`Step ${step + 1} of ${STEPS.length}`}
    >
      {STEPS.map((_, i) => (
        <motion.div
          key={i}
          className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#e5e5e5]"
        >
          <motion.div
            className="h-full bg-orange-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: i <= step ? '100%' : '0%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ─── Option button ────────────────────────────────────────────────────────────

function OptionBtn({
  label, selected, onClick, index = 0, toppingIcon,
}: { label: string; selected: boolean; onClick: () => void; multi?: boolean; index?: number; toppingIcon?: Topping }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28, delay: index * 0.05 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.96, y: 1 }}
      onClick={onClick}
      aria-pressed={selected}
      className={`relative overflow-hidden flex items-center justify-between gap-3 w-full px-5 py-4 rounded-2xl border-2 text-left font-outfit font-semibold text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2
        ${selected
          ? 'bg-orange-500 border-orange-600 text-white shadow-[0_4px_0_#c2410c]'
          : 'bg-white border-[#e5e5e5] text-[#3c3c3c] shadow-[0_3px_0_#e5e5e5] hover:border-orange-200 hover:shadow-[0_3px_0_#fed7aa]'
        }`}
    >
      {/* Selection ripple */}
      <AnimatePresence>
        {selected && (
          <motion.span
            className="absolute inset-0 bg-white/20 rounded-2xl"
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <span className="flex items-center gap-2">
        {toppingIcon && <ToppingSVG type={toppingIcon} size={22} />}
        {label}
      </span>
      <AnimatePresence mode="wait">
        {selected && (
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <Check className="w-4 h-4" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Step panel ───────────────────────────────────────────────────────────────

function StepPanel({
  stepKey, sel, onSelect, onNext, onBack, stepIndex, direction,
}: {
  stepKey: Step;
  sel: Selections;
  onSelect: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  direction: number;
}) {
  const cfg = STEP_CONFIG[stepKey];
  const isMulti = cfg.multi;
  const canNext = isMulti
    ? sel.toppings.length > 0
    : !!sel[stepKey as keyof Selections];

  const isSelected = (opt: string) => {
    if (stepKey === 'toppings') return sel.toppings.includes(opt as Topping);
    return sel[stepKey as keyof Selections] === opt;
  };

  const xIn  = direction >= 0 ? 48 : -48;
  const xOut = direction >= 0 ? -48 : 48;

  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, x: xIn }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: xOut }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="space-y-5"
    >
      {/* Header */}
      <div>
        <motion.p
          key={`label-${stepKey}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="text-[11px] font-black uppercase tracking-widest text-[#afafaf] font-outfit mb-1"
        >
          Step {stepIndex + 1} of {STEPS.length}
        </motion.p>
        <motion.h2
          key={`h-${stepKey}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28, delay: 0.04 }}
          className="flex items-center gap-2 font-fredoka font-bold text-2xl md:text-3xl text-[#3c3c3c] leading-tight"
        >
          {(() => { const Icon = STEP_ICON[stepKey]; return <Icon className="w-6 h-6 text-orange-500 flex-shrink-0" aria-hidden="true" />; })()}
          {cfg.label}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-[#777777] font-outfit mt-0.5"
        >
          {cfg.subtitle}
        </motion.p>
      </div>

      {/* Options */}
      <div className={`${isMulti ? 'grid grid-cols-2 gap-2.5' : 'space-y-2.5'}`}>
        {cfg.options.map((opt, i) => (
          <OptionBtn
            key={opt}
            label={opt}
            toppingIcon={isMulti ? (opt as Topping) : undefined}
            selected={isSelected(opt)}
            onClick={() => onSelect(opt)}
            multi={isMulti}
            index={i}
          />
        ))}
      </div>

      {/* Nav */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-between pt-1"
      >
        <motion.button
          onClick={onBack}
          whileHover={stepIndex > 0 ? { x: -2 } : {}}
          whileTap={stepIndex > 0 ? { scale: 0.95 } : {}}
          aria-hidden={stepIndex === 0}
          tabIndex={stepIndex === 0 ? -1 : 0}
          className={`flex items-center gap-1.5 text-sm font-semibold font-outfit transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-lg px-1
            ${stepIndex === 0 ? 'invisible' : 'text-[#afafaf] hover:text-[#3c3c3c]'}`}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>

        <motion.button
          whileHover={canNext ? { y: -2, scale: 1.02 } : {}}
          whileTap={canNext ? { scale: 0.96, y: 1 } : {}}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          onClick={onNext}
          disabled={!canNext}
          aria-disabled={!canNext}
          className={`relative overflow-hidden flex items-center gap-2 px-6 py-3 rounded-2xl font-fredoka font-bold text-sm uppercase tracking-widest border-b-[3px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2
            ${canNext
              ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-700 shadow-[0_3px_0_#c2410c] active:translate-y-[2px] active:shadow-none cursor-pointer'
              : 'bg-[#f5f5f5] text-[#c0c0c0] border-[#e5e5e5] cursor-not-allowed'
            }`}
        >
          {stepIndex === STEPS.length - 1 ? 'Finish' : 'Next'}
          <motion.span
            animate={canNext ? { x: [0, 3, 0] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowRight className="w-4 h-4" />
          </motion.span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Completion screen ────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#f97316', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#f472b6'];

function CompletionScreen({ sel, onReset }: { sel: Selections; onReset: () => void }) {
  const pizzaName = getPizzaName(sel);

  const rows = [
    { label: 'Size', value: sel.size },
    { label: 'Crust', value: `${sel.crust}${sel.cookStyle ? ` · ${sel.cookStyle}` : ''}` },
    { label: 'Sauce', value: sel.sauce },
    { label: 'Cheese', value: sel.cheese },
    { label: 'Toppings', value: sel.toppings.length ? sel.toppings.join(', ') : 'Plain' },
    { label: 'Drizzle', value: sel.drizzle || 'None' },
    { label: 'Occasion', value: sel.occasion },
  ];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
  };
  const rowVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 28 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="space-y-5"
    >
      {/* Confetti burst */}
      <div className="relative h-0 overflow-visible pointer-events-none">
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const dist = 60 + (i % 3) * 20;
          return (
            <motion.span
              key={i}
              className="absolute w-2 h-2 rounded-sm"
              style={{ background: CONFETTI_COLORS[i % CONFETTI_COLORS.length], left: '50%', top: 0 }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
              animate={{
                x: dist * Math.cos(angle),
                y: dist * Math.sin(angle) - 20,
                opacity: 0,
                scale: 0.4,
                rotate: (i % 2 === 0 ? 1 : -1) * 180,
              }}
              transition={{ duration: 0.7, delay: i * 0.03, ease: 'easeOut' }}
            />
          );
        })}
      </div>

      <div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className="flex items-center gap-2 mb-2"
        >
          <motion.span
            animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PartyPopper className="w-5 h-5 text-orange-500" />
          </motion.span>
          <p className="text-[11px] font-black uppercase tracking-widest text-orange-500 font-outfit">
            Your pizza is ready!
          </p>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26, delay: 0.1 }}
          className="font-fredoka font-bold text-3xl md:text-4xl text-[#3c3c3c] leading-tight"
        >
          {pizzaName}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
          className="text-sm text-[#777777] font-outfit mt-1"
        >
          {sel.size} · {sel.crust} crust · {sel.sauce} sauce
        </motion.p>
      </div>

      {/* Staggered order summary */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#fafafa] border-2 border-[#e5e5e5] rounded-2xl p-5 space-y-2.5 shadow-[0_3px_0_#e5e5e5]"
      >
        {rows.map(({ label, value }) => (
          <motion.div key={label} variants={rowVariants} className="flex justify-between items-baseline gap-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#afafaf] font-outfit flex-shrink-0">{label}</span>
            <span className="text-sm font-semibold text-[#3c3c3c] font-outfit text-right">{value}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA + reset */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3 pt-1"
      >
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 text-white font-fredoka font-bold text-sm uppercase tracking-widest rounded-2xl border-b-[3px] border-orange-700 shadow-[0_4px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          Build a survey this fun <ArrowRight className="w-4 h-4" />
        </Link>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold font-outfit text-[#777777] hover:text-[#3c3c3c] border-2 border-[#e5e5e5] hover:border-[#c8c8c8] rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          <RotateCcw className="w-4 h-4" /> Start over
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PizzaBuilderV3Props {
  questions?: Question[];
  onComplete?: (answers: Answer[]) => void;
  onProgress?: (progress: ProgressUpdate) => void;
  allowAnonymous?: boolean;
  initialState?: Record<string, unknown>;
}

export default function PizzaBuilderV3({ onComplete }: PizzaBuilderV3Props = {}) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [sel, setSel] = useState<Selections>(INITIAL);
  const [done, setDone] = useState(false);
  const prefersReduced = useReducedMotion();

  const stepKey = STEPS[step];

  const handleSelect = (val: string) => {
    if (stepKey === 'toppings') {
      setSel((prev) => {
        const has = prev.toppings.includes(val as Topping);
        return {
          ...prev,
          toppings: has
            ? prev.toppings.filter((t) => t !== val)
            : [...prev.toppings, val as Topping],
        };
      });
    } else {
      setSel((prev) => ({ ...prev, [stepKey]: val }));
      // Auto-advance for single-select after a short delay
      if (!STEP_CONFIG[stepKey].multi && step < STEPS.length - 1) {
        setDirection(1);
        setTimeout(() => setStep((s) => s + 1), 280);
      }
    }
  };

  const handleNext = () => {
    setDirection(1);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setDone(true);
      if (onComplete) {
        const answers: Answer[] = STEPS.map((s) => ({
          questionId: s,
          value: s === 'toppings' ? sel.toppings : (sel[s] || ''),
        }));
        onComplete(answers);
      }
    }
  };

  const handleBack = () => {
    setDirection(-1);
    if (step > 0) setStep((s) => s - 1);
  };

  const handleReset = () => {
    setSel(INITIAL);
    setStep(0);
    setDone(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b-2 border-[#e5e5e5] px-6 py-4 flex items-center justify-between">
        <Link href="/demo" className="flex items-center gap-1.5 text-sm font-semibold text-[#777777] hover:text-[#3c3c3c] font-outfit transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 px-1">
          <ArrowLeft className="w-4 h-4" /> All demos
        </Link>
        <span className="font-fredoka font-bold text-[#3c3c3c] text-lg">
          Pizza Builder <span className="text-orange-500">✦</span>
        </span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#afafaf] hover:text-[#777777] font-outfit transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 px-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* ── Pizza panel ── */}
        <div className="lg:w-1/2 flex flex-col items-center justify-center bg-white border-b-2 lg:border-b-0 lg:border-r-2 border-[#e5e5e5] py-10 px-6">
          <PizzaVisual sel={sel} prefersReduced={prefersReduced} />

          {/* Size label */}
          {sel.size && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-[11px] font-black uppercase tracking-widest text-[#afafaf] font-outfit"
            >
              {sel.size} pizza
            </motion.p>
          )}
        </div>

        {/* ── Controls panel ── */}
        <div className="lg:w-1/2 flex flex-col justify-center px-6 py-10 lg:px-12">
          <div className="w-full max-w-sm mx-auto space-y-6">

            {/* Progress bar */}
            {!done && <ProgressBar step={step} />}

            {/* Step or completion */}
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done">
                  <CompletionScreen sel={sel} onReset={handleReset} />
                </motion.div>
              ) : (
                <StepPanel
                  key={stepKey}
                  stepKey={stepKey}
                  sel={sel}
                  onSelect={handleSelect}
                  onNext={handleNext}
                  onBack={handleBack}
                  stepIndex={step}
                  direction={direction}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
