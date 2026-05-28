"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play, Star, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PointerHighlight } from "@/components/ui/pointer-highlight";

export function HeroSection03() {
    const [demoStep, setDemoStep] = useState(0); // 0: Question, 1: Success
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const handleSelectOption = (option: string) => {
        setSelectedOption(option);
        setTimeout(() => {
            setDemoStep(1);
        }, 600);
    };

    const resetDemo = () => {
        setSelectedOption(null);
        setDemoStep(0);
    };

    return (
        <div className="w-full relative overflow-hidden flex flex-col justify-between h-full">
            {/* Playful background pattern */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10 max-w-6xl flex-1 flex items-center py-12">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20 w-full">
                    
                    {/* Left Side: Mascot & Interactive Live Card (Parallax Scroll Reveal) */}
                    <div className="flex-1 flex justify-center order-2 lg:order-1 relative">
                        <motion.div 
                            className="relative group select-none"
                            initial={{ opacity: 0, x: -80, rotate: -6 }}
                            whileInView={{ opacity: 1, x: 0, rotate: -2 }}
                            viewport={{ once: false, amount: 0.3 }}
                            transition={{ type: "spring", damping: 15, stiffness: 80, delay: 0.1 }}
                        >
                            {/* Decorative background blobs */}
                            <motion.div 
                                className="absolute -inset-4 bg-orange-100 rounded-full filter blur-xl opacity-35"
                                animate={{ scale: [1, 1.06, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            />
                            
                            {/* Mascot Frame */}
                            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-[350px] md:h-[350px] bg-white border-4 border-[#e5e5e5] rounded-[32px] p-6 flex items-center justify-center shadow-[0_8px_0_#e5e5e5]">
                                <img
                                    src="/mascot.png"
                                    alt="Unboring Mascot"
                                    className="w-full h-full object-contain animate-float"
                                />
                            </div>
                        </motion.div>

                        {/* Interactive Live Demo Card */}
                        <motion.div 
                            className="absolute -bottom-6 -right-2 sm:-bottom-8 sm:right-4 w-60 sm:w-64 bg-white border-4 border-[#e5e5e5] rounded-2xl p-4 shadow-[0_6px_0_#e5e5e5] z-20 font-outfit"
                            initial={{ opacity: 0, y: 35, scale: 0.9 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: false, amount: 0.3 }}
                            transition={{ type: "spring", damping: 15, stiffness: 90, delay: 0.3 }}
                        >
                            <AnimatePresence mode="wait">
                                {demoStep === 0 ? (
                                    <motion.div
                                        key="q"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider font-fredoka">LIVE QUEST DEMO</span>
                                        </div>
                                        <p className="text-xs font-bold text-neutral-800 leading-tight">
                                            Which survey theme would you grow first?
                                        </p>
                                        <div className="space-y-1.5">
                                            {[
                                                { id: 'garden', label: '🌱 Flower Garden' },
                                                { id: 'icecream', label: '🍦 Giant Sundae' },
                                                { id: 'coffee', label: '☕ Espresso Roast' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleSelectOption(opt.label)}
                                                    className={`w-full text-left px-3 py-1.5 text-xs rounded-xl border-2 font-bold transition-all btn-3d ${
                                                        selectedOption === opt.label
                                                            ? 'bg-orange-50 border-orange-400 text-orange-700 translate-y-[2px] shadow-none'
                                                            : 'bg-white border-[#e5e5e5] text-gray-700 hover:bg-neutral-50 shadow-[0_2px_0_#e5e5e5] active:translate-y-[2px] active:shadow-none'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="a"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center py-4 space-y-3"
                                    >
                                        <div className="w-10 h-10 bg-orange-50 border-2 border-orange-400 rounded-full flex items-center justify-center mx-auto">
                                            <Check className="w-5 h-5 text-orange-600 stroke-[3]" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-neutral-800 font-fredoka">Quest Completed!</h4>
                                            <p className="text-[11px] text-gray-500 mt-1">You just unlocked +10 XP 🚀</p>
                                        </div>
                                        <button
                                            onClick={resetDemo}
                                            className="text-[10px] text-orange-500 hover:underline font-bold"
                                        >
                                            Try Another Option
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    {/* Right Side: Copy & Buttons (Staggered Parallax Entrance) */}
                    <motion.div 
                        className="flex-1 text-center lg:text-left order-1 lg:order-2 space-y-6"
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                        transition={{ type: "spring", damping: 18, stiffness: 90 }}
                    >
                        {/* Social Proof Badge */}
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                            <div className="flex -space-x-2 select-none">
                                {[
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=60',
                                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=60',
                                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=60',
                                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=60'
                                ].map((url, index) => (
                                    <img 
                                        key={index}
                                        src={url} 
                                        alt="User avatar" 
                                        className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm"
                                    />
                                ))}
                            </div>
                            <div className="flex flex-col items-start text-xs font-outfit">
                                <div className="flex items-center gap-0.5 text-yellow-500">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-3 h-3 fill-current" />
                                    ))}
                                </div>
                                <p className="text-neutral-500 font-bold tracking-tight">4.9/5 stars from 1,200+ creators</p>
                            </div>
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-neutral-900 leading-tight font-fredoka">
                            Surveys people <br />
                            actually want to{" "}
                            <PointerHighlight
                                containerClassName="inline-block align-middle"
                                rectangleClassName="border-orange-500 border-2 rounded-xl"
                                pointerClassName="text-orange-500 fill-orange-500"
                            >
                                <span className="text-orange-500 px-2">take.</span>
                            </PointerHighlight>
                        </h1>

                        <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-outfit max-w-xl mx-auto lg:mx-0">
                            Say goodbye to boring, empty forms. Turn customer, team, and product surveys into interactive progression quests that boost completion rates by up to 300%.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                            <Link href="/login" className="w-full sm:w-auto">
                                <button className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 border-b-4 border-b-orange-700 shadow-[0_4px_0_#c2410c] active:translate-y-[2px] active:border-b-2 active:shadow-[0_2px_0_#c2410c] text-white font-bold rounded-xl btn-3d text-base tracking-wide flex items-center justify-center gap-2 transition-all font-fredoka">
                                    GET STARTED <ArrowRight className="w-5 h-5" />
                                </button>
                            </Link>

                            <Link href="/demo" className="w-full sm:w-auto">
                                <motion.button
                                    whileHover="hover"
                                    className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-[#e5e5e5] text-sky-blue hover:bg-sky-50 font-bold rounded-xl text-base flex items-center justify-center gap-2 transition-colors font-fredoka group"
                                >
                                    <motion.span
                                        variants={{
                                            hover: {
                                                scale: [1, 1.25, 0.9, 1.15, 1],
                                                x: [0, 4, -2, 2, 0],
                                                rotate: [0, 10, -10, 5, 0]
                                            }
                                        }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        className="flex items-center justify-center"
                                    >
                                        <Play className="w-4 h-4 fill-sky-blue text-sky-blue" />
                                    </motion.span>
                                    TRY DEMO
                                </motion.button>
                            </Link>
                        </div>

                        <div className="pt-2 flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-500 font-outfit">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-orange-500" /> Free theme included
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-sky-blue" /> No credit card required
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Trusted By logo band */}
            <div className="w-full bg-neutral-50/50 border-t border-[#e5e5e5] py-6 overflow-hidden select-none z-10 relative">
                <div className="container mx-auto px-6 max-w-6xl">
                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 font-outfit">
                        TRUSTED BY INNOVATIVE CREATORS AT
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-45 grayscale select-none">
                        {['Duolingo', 'Headspace', 'Notion', 'Kahoot!', 'Discord', 'Mailchimp'].map((logo) => (
                            <span key={logo} className="text-sm sm:text-base font-extrabold font-fredoka tracking-wider text-gray-500 cursor-default">
                                {logo}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sidebar quest tab */}
            <div className="fixed right-0 top-1/2 h-36 items-center flex transform -translate-y-1/2 z-50 select-none">
                <div className="bg-orange-500 text-white py-6 px-3 text-sm font-bold rounded-l-xl shadow-lg border-y border-l border-orange-600 shadow-orange-700/20">
                    <span className="rotate-180 [writing-mode:vertical-rl] font-fredoka tracking-wider">
                        PLAY QUESTS
                    </span>
                </div>
            </div>
        </div>
    );
}
