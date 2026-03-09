import { Separator } from "@/components/ui/separator";
import { BadgeQuestionMark } from "@aliimam/icons";
import { Instagram, Threads, X } from "@aliimam/logos";
import React from "react";

export function HeroSection03() {
    return (
        <div className="relative overflow-hidden bg-neutral-50">
            <div className="w-full absolute h-full z-0 bg-[radial-gradient(circle,_black_1px,_transparent_1px)] dark:bg-[radial-gradient(circle,_white_1px,_transparent_1px)] opacity-15 [background-size:20px_20px]" />

            <main className="relative pt-20 pb-20">
                <div className="flex relative gap-2 px-6 md:items-center w-full flex-col justify-center">
                    <div className="md:flex gap-6 items-center">
                        <p className="text-xs text-muted-foreground md:text-sm text-start md:text-right leading-5 max-w-[220px] md:max-w-[180px]">
                            Gamified surveys that boost completion rates by 3x.
                        </p>
                        <h1 className="text-6xl md:text-7xl xl:text-[10rem] font-light leading-none tracking-wider">
                            UNBORING
                        </h1>
                    </div>

                    <div className="md:flex gap-6 items-center">
                        <h1 className="text-6xl md:text-7xl xl:text-[10rem] flex font-light leading-none tracking-wider">
                            <span>SUR</span>
                            <BadgeQuestionMark
                                type="solid"
                                className="lg:size-40 size-14 md:size-18 text-orange-600"
                            />
                            <span>VEYS</span>
                        </h1>
                        <p className="text-xs text-muted-foreground md:text-sm pt-8 leading-5 max-w-[250px] md:max-w-[180px]">
                            Interactive adventures make data collection actually fun.
                        </p>
                    </div>

                    <div className="md:flex gap-6 items-center">
                        <h1 className="text-6xl md:text-7xl xl:text-[10rem] md:flex font-light leading-none tracking-wider">
                            <span>QUEST</span>
                            <div className="hidden lg:block">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="160"
                                    height="160"
                                    viewBox="0 0 24 24"
                                    fill="#f97316"
                                >
                                    <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                                </svg>
                            </div>
                            <div className="block lg:hidden">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="70"
                                    height="70"
                                    viewBox="0 0 24 24"
                                    fill="#f97316"
                                >
                                    <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                                </svg>
                            </div>
                            <span>ION</span>
                        </h1>
                    </div>
                </div>
                <div className="mx-auto max-w-7xl w-full px-6 gap-3">
                    <div className="md:flex md:mx-8 grid md:justify-end items-center gap-3">
                        <Separator className="w-full my-6 mx-auto max-w-3xl" />
                        <div className="text-xs uppercase whitespace-nowrap md:text-sm">
                            KEA MARKETING 2025
                        </div>
                        <div className="flex w-full items-end gap-3 translate-x-2">
                            <span className="text-2xl md:text-4xl font-thin uppercase">POWERED BY</span>
                            <span className="text-3xl md:text-5xl font-bold italic text-orange-600">
                                brook
                            </span>
                        </div>
                    </div>
                </div>

                <div className="md:px-20 px-6 gap-6 items-end md:flex pt-12">
                    <div className="w-84 h-48 shadow-xl border rounded-2xl overflow-hidden mb-8 md:mb-0 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                        <img
                            src="https://images.unsplash.com/photo-1551288049-bbda3865cbb0?auto=format&fit=crop&q=80&w=800"
                            alt="Productivity"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground md:text-sm pt-8 leading-5 max-w-sm">
                        Open to all forms of feedback collection adventures, regardless of location and language.
                        Start for free today.
                    </p>
                </div>

                <div className="absolute bottom-8 right-8 md:right-12 flex gap-6">
                    <Instagram className="text-neutral-400 hover:text-orange-500 transition-colors cursor-pointer" />
                    <X className="text-neutral-400 hover:text-orange-500 transition-colors cursor-pointer" />
                    <Threads className="text-neutral-400 hover:text-orange-500 transition-colors cursor-pointer" />
                </div>

                <div className="fixed right-0 top-1/2 h-36 items-center flex transform -translate-y-1/2  ">
                    <div className="bg-orange-600 text-white py-6 px-3 text-sm font-bold shadow-lg">
                        <span className="rotate-180 [writing-mode:vertical-rl]">
                            Best Experience
                        </span>
                    </div>
                </div>
            </main>

        </div>
    );
}
