'use client';

import { useState } from 'react';
import PizzaBuilderV2 from '@/components/adventures/PizzaBuilderV2';

export default function PizzaDesignDemo() {
    const [theme, setTheme] = useState<'neon' | 'artisan' | 'parallax'>('neon');

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-pink-500/30">
            {/* Control Panel */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/80 backdrop-blur-md border border-white/10 p-2 rounded-full flex gap-2 shadow-2xl">
                <button
                    onClick={() => setTheme('neon')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${theme === 'neon'
                        ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]'
                        : 'text-neutral-400 hover:text-white'
                        }`}
                >
                    Neon Arcade
                </button>
                <button
                    onClick={() => setTheme('artisan')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${theme === 'artisan'
                        ? 'bg-amber-600 text-white shadow-[0_0_20px_rgba(217,119,6,0.5)]'
                        : 'text-neutral-400 hover:text-white'
                        }`}
                >
                    Artisan Reality
                </button>
                <button
                    onClick={() => setTheme('parallax')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${theme === 'parallax'
                        ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]'
                        : 'text-neutral-400 hover:text-white'
                        }`}
                >
                    3D Parallax
                </button>
            </div>

            {/* Builder Component */}
            <PizzaBuilderV2 theme={theme} />
        </div>
    );
}
