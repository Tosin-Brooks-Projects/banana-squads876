'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, MotionValue } from 'framer-motion';

type Theme = 'neon' | 'artisan' | 'parallax';

interface PizzaBuilderV2Props {
    theme: Theme;
}

// Reuse existing questions for the demo
const DEMO_QUESTIONS = [
    { id: 'crust', question: 'Choose your crust', options: ['Thin', 'Regular', 'Deep Dish'], type: 'multiple-choice', allowMultiple: false },
    { id: 'sauce', question: 'Select your base', options: ['Tomato', 'Creamy Garlic', 'Pesto'], type: 'multiple-choice', allowMultiple: false },
    { id: 'cheese', question: 'Add cheese', options: ['Mozzarella', 'Cheddar', 'Vegan'], type: 'multiple-choice', allowMultiple: false },
    { id: 'toppings', question: 'Top it off', options: ['Pepperoni', 'Mushrooms', 'Peppers', 'Olives', 'Basil'], type: 'multiple-choice', allowMultiple: true },
];

type Selections = Record<string, string | string[]>;

interface PizzaLayersProps {
    selections: Selections;
    theme: Theme;
    mouseX: MotionValue<number>;
    mouseY: MotionValue<number>;
}

interface ToppingProps {
    type: string;
    index: number;
    isNeon: boolean;
    isArtisan: boolean;
}

interface ControlsProps {
    stage: number;
    setStage: (stage: number) => void;
    selections: Selections;
    setSelections: React.Dispatch<React.SetStateAction<Selections>>;
    isNeon: boolean;
}

export default function PizzaBuilderV2({ theme }: PizzaBuilderV2Props) {
    const [stage, setStage] = useState(0);
    const [selections, setSelections] = useState<Selections>({ toppings: [] });

    // Parallax Logic
    const containerRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
    };

    const springConfig = { damping: 25, stiffness: 150 };
    const rotateX = useSpring(useTransform(mouseY, [-300, 300], [15, -15]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-15, 15]), springConfig);

    // Theme Configs
    const isNeon = theme === 'neon';
    // Removed unused isArtisan

    const bgClass = isNeon
        ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black'
        : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-50 via-warm-gray-100 to-stone-200';

    return (
        <div
            className={`min-h-screen w-full flex flex-col items-center justify-center overflow-hidden transition-colors duration-700 ${bgClass}`}
            onMouseMove={handleMouseMove}
        >
            {/* Background Elements */}
            {isNeon && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-500/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-20" />
                </div>
            )}

            <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 p-8">

                {/* Left: Interactive Pizza Stage */}
                <div className="flex-1 flex justify-center perspective-1000" ref={containerRef} style={{ perspective: '1000px' }}>
                    <motion.div
                        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
                        className={`relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] transition-all duration-500`}
                    >
                        {/* Pizza Base Layers */}
                        <PizzaLayers
                            selections={selections}
                            theme={theme}
                            mouseX={mouseX}
                            mouseY={mouseY}
                        />
                    </motion.div>
                </div>

                {/* Right: Controls */}
                <div className="flex-1 w-full max-w-md">
                    <Controls
                        stage={stage}
                        setStage={setStage}
                        selections={selections}
                        setSelections={setSelections}
                        isNeon={isNeon}
                    />
                </div>
            </div>
        </div>
    );
}

function PizzaLayers({ selections, theme, mouseX, mouseY }: PizzaLayersProps) {
    const isNeon = theme === 'neon';
    const isArtisan = theme === 'artisan';

    // Parallax offset for floating ingredients
    const floatX = useTransform(mouseX, [-300, 300], [-20, 20]);
    const floatY = useTransform(mouseY, [-300, 300], [-20, 20]);

    // Base Styles
    const plateClass = isNeon
        ? "bg-neutral-900 border-2 border-pink-500/50 shadow-[0_0_50px_rgba(236,72,153,0.3)]"
        : isArtisan
            ? "bg-[#e8dcc5] shadow-2xl border-4 border-[#d4c4b2] rounded-full" // Simple plate
            : "bg-white/40 shadow-xl backdrop-blur-md border border-white/50 rounded-full";

    const crustClass = isNeon
        ? "bg-neutral-900 border-4 border-orange-500 shadow-[inset_0_0_30px_rgba(249,115,22,0.5)] rounded-full"
        : isArtisan
            ? "" // Image handles style
            : "bg-[#eebb88] border-[8px] border-[#dca570] rounded-full";

    return (
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
            {/* Shadow / Glow */}
            <motion.div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full opacity-60 blur-3xl -z-50 transition-colors duration-500
          ${isNeon ? 'bg-pink-900/40' : 'bg-black/20'}`}
                style={{ translateZ: '-50px' }}
            />

            {/* Plate / Board */}
            <motion.div
                className={`absolute inset-0 transition-all duration-500 ${plateClass}`}
                style={{ translateZ: '0px' }}
            />

            {/* Pizza Crust */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute inset-4 md:inset-8 transition-all duration-500 flex items-center justify-center ${crustClass}`}
                style={{ translateZ: '20px' }}
            >
                {isArtisan && (
                    <Image
                        src="/assets/pizza/crust.png"
                        alt="Pizza Crust"
                        fill
                        className="object-contain drop-shadow-xl"
                        priority
                    />
                )}

                {/* Sauce */}
                <AnimatePresence>
                    {selections.sauce && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className={`absolute inset-2 md:inset-4 transition-all duration-500 ${isNeon ? 'bg-red-600 shadow-[inset_0_0_20px_rgba(220,38,38,0.6)] rounded-full' : isArtisan ? '' : 'bg-[#d84030] rounded-full'}`}
                        >
                            {isArtisan && (
                                <Image
                                    src="/assets/pizza/sauce.png"
                                    alt="Tomato Sauce"
                                    fill
                                    className="object-contain opacity-90 mix-blend-multiply"
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Cheese */}
                <AnimatePresence>
                    {selections.cheese && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className={`absolute inset-3 md:inset-5 transition-all duration-500 ${isNeon ? 'bg-yellow-400/80 mix-blend-overlay rounded-full' : isArtisan ? '' : 'bg-[#fff5d0] rounded-full'}`}
                        >
                            {isArtisan && (
                                <Image
                                    src="/assets/pizza/cheese.png"
                                    alt="Mozzarella Cheese"
                                    fill
                                    className="object-contain opacity-95 mix-blend-multiply"
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Floating Toppings Layer */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ x: floatX, y: floatY, translateZ: '40px' }}
                >
                    <AnimatePresence>
                        {Array.isArray(selections.toppings) && selections.toppings.map((t: string, i: number) => (
                            <Topping key={t + i} type={t} index={i} isNeon={isNeon} isArtisan={isArtisan} />
                        ))}
                    </AnimatePresence>
                </motion.div>

            </motion.div>
        </div>
    );
}

function Topping({ type, index, isNeon, isArtisan }: ToppingProps) {
    // Deterministic random position based on index
    const angle = ((index * 137.5) % 360) * (Math.PI / 180);
    const r = 15 + (index * 7) % 35; // % radius - slightly tighter for realism
    const x = 50 + r * Math.cos(angle);
    const y = 50 + r * Math.sin(angle);

    const neonColor =
        type === 'Pepperoni' ? 'bg-red-500 shadow-[0_0_10px_red]' :
            type === 'Mushrooms' ? 'bg-purple-400 shadow-[0_0_10px_purple]' :
                type === 'Peppers' ? 'bg-green-400 shadow-[0_0_10px_green]' :
                    type === 'Basil' ? 'bg-green-500 shadow-[0_0_10px_green]' :
                        'bg-black border border-white'; // Olives

    const artisanColor =
        type === 'Pepperoni' ? 'bg-[#b93838] border border-[#a12f2f]' :
            type === 'Mushrooms' ? 'bg-[#d4c4b2] rounded-md' :
                type === 'Peppers' ? 'bg-[#3a8b3a] rounded-sm' :
                    type === 'Basil' ? 'bg-[#2d5a27] rounded-tl-xl rounded-br-xl' :
                        'bg-[#222] rounded-full'; // Olives

    const getAssetPath = (t: string) => {
        switch (t) {
            case 'Pepperoni': return '/assets/pizza/pepperoni.png';
            case 'Mushrooms': return '/assets/pizza/mushrooms.png';
            case 'Peppers': return '/assets/pizza/peppers.png';
            case 'Olives': return '/assets/pizza/olives.png';
            case 'Basil': return '/assets/pizza/basil.png';
            default: return '/assets/pizza/pepperoni.png';
        }
    }

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0, y: -50, rotate: index * 45 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', delay: index * 0.05 }}
            className={`absolute w-8 h-8 md:w-12 md:h-12 ${isNeon || !isArtisan ? 'rounded-full' : ''} ${isNeon ? neonColor : isArtisan ? '' : artisanColor}`}
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        >
            {isArtisan && (
                <div className="relative w-full h-full">
                    <Image
                        src={getAssetPath(type)}
                        alt={type}
                        fill
                        className="object-contain drop-shadow-md"
                    />
                </div>
            )}
        </motion.div>
    );
}

function Controls({ stage, setStage, selections, setSelections, isNeon }: ControlsProps) {
    const currentQ = DEMO_QUESTIONS[stage];

    const handleSelect = (val: string) => {
        if (currentQ.allowMultiple) {
            setSelections((prev) => {
                const toppings = Array.isArray(prev.toppings) ? prev.toppings : [];
                const newToppings = toppings.includes(val)
                    ? toppings.filter((t) => t !== val)
                    : [...toppings, val];
                return { ...prev, toppings: newToppings };
            });
        } else {
            setSelections((prev) => ({ ...prev, [currentQ.id]: val }));
            if (stage < DEMO_QUESTIONS.length - 1) setTimeout(() => setStage(stage + 1), 300);
        }
    };

    const isSelected = (val: string) => {
        if (currentQ.id === 'toppings') {
            return Array.isArray(selections.toppings) && selections.toppings.includes(val);
        }
        return selections[currentQ.id] === val;
    }

    return (
        <div className={`p-8 rounded-3xl transition-all duration-500 ${isNeon ? 'bg-neutral-900/50 border border-white/10 backdrop-blur-xl' : 'bg-white/80 border border-white shadow-2xl backdrop-blur-xl'}`}>
            <div className="mb-6">
                <h2 className={`text-3xl font-bold mb-2 transition-colors ${isNeon ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-slate-800'}`}>
                    {currentQ.question}
                </h2>
                <div className="flex gap-1 h-1.5 w-full bg-neutral-200/20 rounded-full overflow-hidden">
                    {DEMO_QUESTIONS.map((_, i) => (
                        <div key={i} className={`flex-1 transition-colors duration-500 ${i <= stage ? (isNeon ? 'bg-pink-500 shadow-[0_0_10px_pink]' : 'bg-orange-500') : 'bg-transparent'}`} />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {currentQ.options.map((opt) => (
                    <button
                        key={opt}
                        onClick={() => handleSelect(opt)}
                        className={`
              group relative overflow-hidden p-4 rounded-xl text-left font-semibold text-lg transition-all duration-300
              ${isNeon
                                ? 'hover:bg-white/10 border border-white/5 hover:border-pink-500/50 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                                : 'hover:bg-orange-50 border border-neutral-200 hover:border-orange-300 hover:shadow-lg hover:-translate-y-0.5'
                            }
              ${isSelected(opt)
                                ? (isNeon ? 'bg-pink-600 border-pink-500 text-white' : 'bg-orange-500 text-white border-orange-600')
                                : (isNeon ? 'text-neutral-300' : 'text-neutral-600')
                            }
            `}
                    >
                        <span className="relative z-10 flex items-center justify-between">
                            {opt}
                            {isSelected(opt) && (
                                <motion.span layoutId="check" className="text-xl">✨</motion.span>
                            )}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex justify-between mt-8">
                {stage > 0 ? (
                    <button
                        onClick={() => setStage(stage - 1)}
                        className={`text-sm font-medium ${isNeon ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-neutral-800'}`}
                    >
                        ← Back
                    </button>
                ) : <div />}

                {stage < DEMO_QUESTIONS.length - 1 && (
                    <button
                        onClick={() => setStage(stage + 1)}
                        className={`text-sm font-bold ${isNeon ? 'text-pink-400 hover:text-pink-300' : 'text-orange-600 hover:text-orange-700'}`}
                    >
                        Skip →
                    </button>
                )}
            </div>
        </div>
    );
}

