"use client";

import { ArrowRightIcon, Twitter, Github, Linkedin } from "lucide-react";
import BlurText from "@/components/ui/BlurText";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function CallToAction() {
    return (
        <div className="mx-auto w-full max-w-2xl text-center px-4 py-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 font-outfit mb-4">
                ✦ Free to start · No credit card
            </p>
            <BlurText text="Make surveys fun again." direction="bottom" delay={90} stepDuration={0.45} className="font-fredoka font-bold text-4xl md:text-5xl text-[#3c3c3c] leading-tight mb-4 justify-center" />
            <BlurText text="Join 10,000+ creators building experiences people actually finish." direction="bottom" delay={40} stepDuration={0.3} className="text-[#777777] font-outfit text-base mb-8 max-w-sm mx-auto justify-center" />
            <div className="flex items-center justify-center gap-3">
                <Button
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 border-b-4 border-b-orange-700 shadow-[0_4px_0_#c2410c] active:translate-y-[2px] active:shadow-none text-white font-bold rounded-xl px-8 font-fredoka"
                >
                    Get Started <ArrowRightIcon className="size-4 ml-2" />
                </Button>
                <Link
                    href="/pricing"
                    className="text-sm text-[#777777] hover:text-[#3c3c3c] transition-colors font-outfit underline underline-offset-4"
                >
                    See pricing
                </Link>
            </div>
        </div>
    );
}

const FOOTER_LINKS = {
    Product: [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/pricing" },
        { label: "Docs", href: "/docs" },
        { label: "Changelog", href: "/changelog" },
    ],
    Company: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "mailto:hello@unboringsurveys.com" },
    ],
    Legal: [
        { label: "Terms", href: "/terms" },
        { label: "Privacy", href: "/privacy" },
    ],
};

const SOCIALS = [
    { icon: Twitter, href: "https://x.com/brooksconkle", label: "Twitter" },
    { icon: Github, href: "https://github.com", label: "GitHub" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
];

export function FooterLinks() {
    return (
        <div className="relative z-10 w-full border-t-2 border-[#e5e5e5] bg-white px-6 pt-10 pb-6">
            <div className="mx-auto max-w-5xl">
                <div className="flex flex-col md:flex-row gap-10 md:gap-16 mb-8">
                    {/* Brand col */}
                    <div className="flex-shrink-0 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="font-fredoka font-black text-lg select-none">
                                <span className="text-[#3c3c3c]">Unboring </span>
                                <span className="text-orange-500">Surveys</span>
                            </span>
                        </div>
                        <p className="text-xs text-[#afafaf] font-outfit leading-relaxed max-w-[180px] mb-5">
                            Surveys people actually want to finish.
                        </p>
                        <div className="flex items-center gap-2">
                            {SOCIALS.map(({ icon: Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    className="size-8 rounded-xl border-2 border-[#e5e5e5] shadow-[0_2px_0_#e5e5e5] flex items-center justify-center text-[#afafaf] hover:text-orange-500 hover:border-orange-200 transition-colors"
                                >
                                    <Icon className="size-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link cols */}
                    <div className="flex gap-10 md:gap-16 flex-wrap">
                        {Object.entries(FOOTER_LINKS).map(([group, links]) => (
                            <div key={group}>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#afafaf] font-outfit mb-3">
                                    {group}
                                </p>
                                <ul className="space-y-2.5">
                                    {links.map(({ label, href }) => (
                                        <li key={label}>
                                            <Link
                                                href={href}
                                                className="text-xs text-[#777777] hover:text-orange-500 transition-colors font-outfit font-medium"
                                            >
                                                {label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t-2 border-[#e5e5e5] pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-[11px] text-[#afafaf] font-outfit">© 2026 Unboring Surveys. All rights reserved.</p>
                    <p className="text-[11px] text-[#afafaf] font-outfit">
                        Made with <span className="text-orange-400">♥</span> by{" "}
                        <a
                            href="https://x.com/brooksconkle"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-500 hover:underline font-medium"
                        >
                            @brooksconkle
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
