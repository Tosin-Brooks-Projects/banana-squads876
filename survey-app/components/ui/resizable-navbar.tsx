"use client";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useRef, useState, useEffect } from "react";

/* ─── Types ────────────────────────────────────────────── */

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: { name: string; link: string }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

/* ─── Motion tokens (from motion.md) ──────────────────── */

const springSmooth = { type: "spring" as const, stiffness: 300, damping: 30 };
const springSnappy = { type: "spring" as const, stiffness: 500, damping: 28 };

/* ─── Shadow tokens (layered: ambient + direct) ───────── */

const shadowCompact =
  "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.12)";

/* ─── Navbar (scroll watcher + visibility provider) ───── */

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollContainer =
      document.querySelector(".lg\\:overflow-y-auto") || window;

    const handleScroll = () => {
      const scrollTop =
        scrollContainer === window
          ? window.scrollY
          : (scrollContainer as HTMLElement).scrollTop;

      setVisible(scrollTop > 80);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      ref={ref}
      role="navigation"
      aria-label="Main navigation"
      className={cn("fixed inset-x-0 top-0 z-50 w-full", className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible },
            )
          : child,
      )}
    </motion.nav>
  );
};

/* ─── NavBody (desktop — morphs between full & compact) ─ */

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(16px) saturate(180%)" : "none",
        boxShadow: visible ? shadowCompact : "none",
        width: visible ? "min(720px, 90%)" : "100%",
        y: visible ? 16 : 0,
        borderRadius: visible ? 20 : 0,
      }}
      transition={springSmooth}
      className={cn(
        "relative z-[60] mx-auto hidden w-full flex-row items-center justify-between self-start px-6 py-3 lg:flex",
        visible
          ? "bg-white/95 border border-[#e5e5e5]/60 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
          : "bg-white border-b border-[#e5e5e5]",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

/* ─── NavItems (desktop links with animated hover pill) ─ */

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center gap-1 lg:flex",
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          key={`nav-${idx}`}
          href={item.link}
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative px-4 py-2 text-[15px] font-semibold text-[#3c3c3c] transition-colors duration-150 font-outfit cursor-pointer select-none hover:text-[#3c3c3c]"
        >
          {/* Animated hover pill — brand-tinted, not gray */}
          {hovered === idx && (
            <motion.div
              layoutId="nav-hover-pill"
              className="absolute inset-0 rounded-xl bg-orange-500/8 ring-1 ring-orange-500/10"
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          )}
          <span className="relative z-10">{item.name}</span>
        </a>
      ))}
    </div>
  );
};

/* ─── MobileNav (outer shell) ─────────────────────────── */

export const MobileNav = ({
  children,
  className,
  visible,
}: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(16px) saturate(180%)" : "none",
        boxShadow: visible ? shadowCompact : "none",
        width: visible ? "92%" : "100%",
        y: visible ? 16 : 0,
        borderRadius: visible ? 24 : 28,
      }}
      transition={springSmooth}
      className={cn(
        "relative z-50 mx-auto flex w-full flex-col items-center justify-between px-4 py-3 lg:hidden",
        visible
          ? "bg-white/95 border border-[#e5e5e5]/60"
          : "bg-white border-b border-[#e5e5e5]",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

/* ─── MobileNavHeader ─────────────────────────────────── */

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

/* ─── MobileNavMenu (dropdown with staggered items) ───── */

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose: _onClose,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{
            ...springSnappy,
            opacity: { duration: 0.15 },
          }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 bg-white border-t border-[#e5e5e5] px-5 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── MobileNavToggle (animated icon swap) ────────────── */

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      className="relative z-20 flex h-10 w-10 items-center justify-center rounded-xl text-[#3c3c3c] transition-colors duration-150 hover:bg-orange-500/8 cursor-pointer"
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.15 }}
          >
            <X className="size-5" />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ opacity: 0, rotate: 90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: -90 }}
            transition={{ duration: 0.15 }}
          >
            <Menu className="size-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

/* ─── Unused legacy exports (backward compat) ─────────── */

export const NavbarLogo = () => null;
export const NavbarButton = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}) => (
  <button className={cn("px-4 py-2 rounded-xl text-sm font-bold", className)} {...props}>
    {children}
  </button>
);
