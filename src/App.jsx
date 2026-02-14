import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Asset imports ─────────────────────────────────────── */
import avatarImg from "@/assets/images/ascii-art.png";
import emailIcon from "@/assets/icons/email.svg";
import copyIcon from "@/assets/icons/Copy 1.svg";
import checkmarkIcon from "@/assets/icons/Seen checkmark.svg";
import twitterIcon from "@/assets/icons/Twitter.svg";
import linkedinIcon from "@/assets/icons/Linkedin Square.svg";
import dribbbleIcon from "@/assets/icons/Dribbble.svg";

/* ── Constants ──────────────────────────────────────────── */
const EMAIL = "hey@femola.xyz";

const LABELS = {
  idle: "Let\u2019s talk",
  hover: "Copy mail",
  copied: "Copied",
};

const SOCIAL_LINKS = [
  { href: "https://x.com/femolaaa", label: "Twitter", icon: twitterIcon },
  { href: "https://www.linkedin.com/in/isaac1804/", label: "LinkedIn", icon: linkedinIcon },
  { href: "https://dribbble.com/femolaaa", label: "Dribbble", icon: dribbbleIcon },
];

const ICON_MAP = {
  idle: emailIcon,
  hover: copyIcon,
  copied: checkmarkIcon,
};

/* ── Spring presets ─────────────────────────────────────── */
const springSnappy = { type: "spring", stiffness: 500, damping: 35, mass: 0.8 };
const springGentle = { type: "spring", stiffness: 300, damping: 28, mass: 1 };

/* ── Tooltip variants ───────────────────────────────────── */
const tooltipVariants = {
  hidden: {
    opacity: 0,
    filter: "blur(6px)",
    scale: 0.88,
    y: -6,
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    y: 0,
    transition: {
      opacity: { duration: 0.22, ease: "easeOut" },
      filter: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
      scale: { type: "spring", stiffness: 350, damping: 25, mass: 0.7 },
      y: { type: "spring", stiffness: 350, damping: 25, mass: 0.7 },
    },
  },
  exit: {
    opacity: 0,
    filter: "blur(6px)",
    scale: 0.88,
    y: -6,
    transition: {
      opacity: { duration: 0.12, ease: "easeIn" },
      filter: { duration: 0.15, ease: "easeIn" },
      scale: { duration: 0.15, ease: "easeIn" },
      y: { duration: 0.15, ease: "easeIn" },
    },
  },
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   App
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function App() {
  /* ── State ────────────────────────────────────────────── */
  const [buttonState, setButtonState] = useState("idle"); // idle | hover | copied
  const [hoveredSocial, setHoveredSocial] = useState(null); // index or null
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const isOverButton = useRef(false);
  const copiedTimer = useRef(null);
  const barRef = useRef(null);
  const btnRef = useRef(null);
  const socialRefs = useRef([]);

  /* ── Indicator position ───────────────────────────────── */
  const [indicator, setIndicator] = useState({ left: 0, width: 0, height: 0, top: 0, radius: 100 });

  const measureTarget = useCallback((target, asCircle = false) => {
    if (!barRef.current || !target) return;
    const barRect = barRef.current.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();

    if (asCircle) {
      // Perfect circle: diameter = bar height, centered on the social icon
      const size = barRect.height;
      const iconCenterX = tRect.left + tRect.width / 2 - barRect.left;
      setIndicator({
        left: iconCenterX - size / 2,
        width: size,
        height: size,
        top: 0,
        radius: 9999,
      });
    } else {
      setIndicator({
        left: tRect.left - barRect.left,
        width: tRect.width,
        height: barRect.height,
        top: 0,
        radius: 100,
      });
    }
  }, []);

  /* Initial measurement */
  useEffect(() => {
    const t = setTimeout(() => {
      if (btnRef.current) measureTarget(btnRef.current);
    }, 50);
    return () => clearTimeout(t);
  }, [measureTarget]);

  /* Re-measure indicator when button label changes (text width changes) */
  useEffect(() => {
    if (hoveredSocial !== null) return; // indicator is on a social icon
    const raf = requestAnimationFrame(() => {
      if (btnRef.current) measureTarget(btnRef.current);
    });
    return () => cancelAnimationFrame(raf);
  }, [buttonState, hoveredSocial, measureTarget]);

  /* Resize handler */
  useEffect(() => {
    const onResize = () => {
      if (hoveredSocial !== null && socialRefs.current[hoveredSocial]) {
        measureTarget(socialRefs.current[hoveredSocial], true);
      } else if (btnRef.current) {
        measureTarget(btnRef.current);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [hoveredSocial, measureTarget]);

  /* ── Handlers ─────────────────────────────────────────── */
  const handleBtnEnter = () => {
    isOverButton.current = true;
    setHoveredSocial(null);
    measureTarget(btnRef.current);

    if (buttonState === "idle") {
      setButtonState("hover");
      setShowTooltip(true);
    }
  };

  const handleBtnLeave = () => {
    isOverButton.current = false;
    if (buttonState === "hover") {
      setButtonState("idle");
      setShowTooltip(false);
    }
  };

  const handleCopy = () => {
    if (buttonState === "copied") return;

    // Update UI immediately
    setIsPulsing(true);
    setButtonState("copied");
    setShowTooltip(false);

    // Copy to clipboard (fire-and-forget, never blocks UI)
    try {
      navigator.clipboard.writeText(EMAIL).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = EMAIL;
        ta.style.cssText = "position:fixed;opacity:0;left:-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      });
    } catch {
      const ta = document.createElement("textarea");
      ta.value = EMAIL;
      ta.style.cssText = "position:fixed;opacity:0;left:-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    // Auto-revert after 2s
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => {
      if (isOverButton.current) {
        setButtonState("hover");
        setShowTooltip(true);
      } else {
        setButtonState("idle");
      }
    }, 2000);
  };

  const handleSocialEnter = (i) => {
    setHoveredSocial(i);
    measureTarget(socialRefs.current[i], true);
  };

  const handleBarLeave = () => {
    setHoveredSocial(null);
    measureTarget(btnRef.current);
    if (buttonState === "hover") {
      setButtonState("idle");
      setShowTooltip(false);
    }
  };

  /* ── Derived ──────────────────────────────────────────── */
  const isIconHovered = hoveredSocial !== null;
  const barActive = buttonState !== "idle";

  return (
    <div className="flex min-h-screen items-center justify-center bg-white antialiased"
         style={{ fontFamily: '"Inter Tight", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <main className="relative flex w-full min-h-screen flex-col items-center justify-center px-5 py-10">
        <div className="flex w-full max-w-[329px] flex-col items-center">

          {/* ── Avatar ─────────────────────────────────── */}
          <motion.div
            className="h-[86px] w-[86px] shrink-0 overflow-hidden rounded-full"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springGentle}
          >
            <img src={avatarImg} alt="Profile avatar" className="block h-full w-full object-cover" />
          </motion.div>

          {/* ── Text Block ─────────────────────────────── */}
          <motion.div
            className="mt-7 flex w-full flex-col items-center gap-1.5 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springGentle, delay: 0.08 }}
          >
            <h1
              className="text-2xl font-medium leading-normal text-black"
              style={{ fontFamily: '"P22 Mackinac", Georgia, "Times New Roman", serif' }}
            >
              Testing different things out.
            </h1>
            <p className="text-shimmer text-base font-medium leading-normal tracking-[-0.24px]">
              Still a work in progress, I&rsquo;ll be back soon.
            </p>
          </motion.div>

          {/* ── Action Bar ─────────────────────────────── */}
          <motion.div
            ref={barRef}
            className="relative mt-10 flex items-center gap-2.5 rounded-full"
            style={{
              backgroundColor: barActive ? "#e9e9ea" : "#f1f1f1",
              transition: "background-color 350ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseLeave={handleBarLeave}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springGentle, delay: 0.16 }}
          >
            {/* Sliding indicator */}
            <motion.div
              className="pointer-events-none absolute z-0 bg-black"
              animate={{
                left: indicator.left,
                width: indicator.width,
                height: indicator.height,
                top: indicator.top,
                borderRadius: indicator.radius,
              }}
              transition={springSnappy}
              style={{ borderRadius: indicator.radius }}
            />

            {/* CTA Button */}
            <motion.button
              ref={btnRef}
              type="button"
              className="relative z-[1] inline-flex h-11 w-[129px] cursor-pointer appearance-none items-center justify-center gap-2 rounded-full border-none bg-transparent py-2.5 pr-4 pl-3 text-base font-medium leading-none tracking-[-0.32px] whitespace-nowrap outline-none"
              style={{
                color: isIconHovered ? "#000" : "#fff",
                transition: "color 280ms ease",
              }}
              onMouseEnter={handleBtnEnter}
              onMouseLeave={handleBtnLeave}
              onClick={handleCopy}
              animate={isPulsing ? { scale: [1, 0.93, 1] } : { scale: 1 }}
              transition={isPulsing ? { duration: 0.32, ease: [0.4, 0, 0.2, 1] } : undefined}
              onAnimationComplete={() => setIsPulsing(false)}
            >
              {/* Icon – popLayout crossfade */}
              <span
                className="pointer-events-none relative flex h-6 w-6 shrink-0 items-center justify-center"
                style={{
                  filter: isIconHovered ? "invert(1)" : "invert(0)",
                  transition: "filter 280ms ease",
                }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.img
                    key={buttonState}
                    src={ICON_MAP[buttonState]}
                    alt=""
                    className="block h-6 w-6 pointer-events-none"
                    initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                    transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                  />
                </AnimatePresence>
              </span>

              {/* Label – popLayout crossfade */}
              <span className="pointer-events-none relative pr-0.5">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={buttonState}
                    className="inline-block whitespace-nowrap"
                    initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                    transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                  >
                    {LABELS[buttonState]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.button>

            {/* Email Tooltip */}
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  className="pointer-events-none absolute z-10"
                  style={{ left: 14, top: "calc(100% + 10px)" }}
                  variants={tooltipVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {/* Arrow */}
                  <svg
                    className="absolute"
                    style={{ left: 16, top: -5 }}
                    width="12"
                    height="6"
                    viewBox="0 0 12 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M6 0L12 6H0L6 0Z" fill="#E8E8E9" />
                  </svg>
                  {/* Pill body */}
                  <div
                    className="flex items-center justify-center rounded-full px-4 py-2"
                    style={{ backgroundColor: "#E8E8E9" }}
                  >
                    <span className="whitespace-nowrap text-[13px] font-medium tracking-[-0.26px] text-[#808080]">
                      {EMAIL}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Social Icons */}
            <div className="flex items-center gap-3.5 p-1">
              {SOCIAL_LINKS.map((link, i) => (
                <a
                  key={link.label}
                  ref={(el) => (socialRefs.current[i] = el)}
                  href={link.href}
                  aria-label={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-[1] flex h-8 w-8 items-center justify-center rounded-full no-underline"
                  onMouseEnter={() => handleSocialEnter(i)}
                >
                  <motion.img
                    src={link.icon}
                    alt=""
                    className="block h-6 w-6 pointer-events-none"
                    animate={{
                      filter: hoveredSocial === i ? "invert(1)" : "invert(0)",
                    }}
                    transition={{ duration: 0.25 }}
                  />
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Spotify Widget ─────────────────────────────── */}
        <motion.div
          className="absolute bottom-10 left-1/2 w-[364px] max-w-[calc(100%-40px)] -translate-x-1/2 overflow-hidden rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springGentle, delay: 0.28 }}
        >
          <iframe
            src="https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT?utm_source=generator&theme=0"
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="block w-full rounded-xl"
            title="Spotify Now Playing"
          />
        </motion.div>
      </main>
    </div>
  );
}
