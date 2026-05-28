"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export function Navbar1() {
  const navItems = [
    { name: "Features", link: "/#features" },
    { name: "Pricing", link: "/pricing" },
    { name: "Demo", link: "/demo" },
    { name: "About", link: "/about" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full z-50">
      <Navbar>
        {/* ─── Desktop Navigation ─── */}
        <NavBody>
          <NavbarBrand />
          <NavItems items={navItems} />

          <div className="flex items-center gap-3 relative z-20">
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97, y: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="px-5 py-2.5 text-sm text-white bg-orange-500 font-bold rounded-xl btn-3d border-b-[3px] border-b-orange-700 shadow-[0_2px_0_#c2410c] active:translate-y-[2px] active:shadow-none font-fredoka cursor-pointer transition-colors duration-150 hover:bg-orange-600"
              >
                Get started
              </motion.button>
            </Link>
          </div>
        </NavBody>

        {/* ─── Mobile Navigation ─── */}
        <MobileNav className="bg-white border border-[#e5e5e5] max-w-[calc(100vw-2rem)] rounded-2xl py-3 px-4">
          <MobileNavHeader>
            <NavbarBrand />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            className="border border-[#e5e5e5] rounded-2xl mt-2"
          >
            {navItems.map((item, idx) => (
              <motion.a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  delay: idx * 0.04,
                }}
                className="relative w-full px-3 py-2.5 text-[15px] text-[#3c3c3c] font-semibold rounded-xl transition-colors duration-150 hover:bg-orange-500/8 font-outfit cursor-pointer"
              >
                {item.name}
              </motion.a>
            ))}

            <div className="flex w-full flex-col gap-3 pt-4 mt-1 border-t border-[#e5e5e5]">
              <Link href="/login" className="w-full">
                <motion.button
                  onClick={() => setIsMobileMenuOpen(false)}
                  whileTap={{ scale: 0.97 }}
                  className="w-full px-5 py-3 text-sm text-white bg-orange-500 font-bold rounded-xl btn-3d border-b-[3px] border-b-orange-700 shadow-[0_2px_0_#c2410c] active:translate-y-[2px] active:shadow-none text-center font-fredoka cursor-pointer transition-colors duration-150 hover:bg-orange-600"
                >
                  Get started
                </motion.button>
              </Link>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}

/* ─── NavbarBrand — logo lockup with micro-interaction ── */

const NavbarBrand = () => {
  return (
    <Link href="/" className="relative z-20 flex items-center group">
      <span className="font-black tracking-tight font-fredoka text-xl select-none">
        <span className="text-[#3c3c3c]">Unboring </span>
        <span className="text-orange-500">Surveys</span>
      </span>
    </Link>
  );
};
