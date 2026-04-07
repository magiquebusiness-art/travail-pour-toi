"use client";

import { useEffect, useState } from "react";

// Floating Orbs Component
export function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Purple Orb */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]"
        style={{
          background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          animation: "float-orb-1 20s ease-in-out infinite",
          top: "10%",
          left: "-10%",
        }}
      />
      {/* Blue Orb */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[80px]"
        style={{
          background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
          animation: "float-orb-2 25s ease-in-out infinite",
          top: "50%",
          right: "-5%",
        }}
      />
      {/* Green Orb */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full opacity-10 blur-[60px]"
        style={{
          background: "radial-gradient(circle, #22c55e 0%, transparent 70%)",
          animation: "float-orb-3 30s ease-in-out infinite",
          bottom: "10%",
          left: "30%",
        }}
      />
      {/* Gold Orb */}
      <div
        className="absolute w-[350px] h-[350px] rounded-full opacity-15 blur-[70px]"
        style={{
          background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
          animation: "float-orb-4 22s ease-in-out infinite",
          top: "30%",
          right: "20%",
        }}
      />
    </div>
  );
}

// Animated Gradient Text
export function AnimatedGradientText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block animated-gradient-text ${className}`}
    >
      {children}
    </span>
  );
}

// Glow Pulse Effect
export function GlowPulse({ children, color = "purple" }: { children: React.ReactNode; color?: "purple" | "blue" | "green" | "gold" }) {
  const colors = {
    purple: "rgba(168, 85, 247, 0.4)",
    blue: "rgba(59, 130, 246, 0.4)",
    green: "rgba(34, 197, 94, 0.4)",
    gold: "rgba(245, 158, 11, 0.4)",
  };

  return (
    <div
      className={`relative inline-block glow-pulse-effect glow-pulse-${color}`}
      style={{
        '--glow-color': colors[color],
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// Floating Particles
export function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    delay: Math.random() * 10,
    duration: Math.random() * 20 + 15,
    opacity: Math.random() * 0.5 + 0.1,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-purple-400"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: "-10px",
            opacity: p.opacity,
            animation: `float-particle ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      {/* float-particle animation defined in globals.css */}
    </div>
  );
}

// Shimmer Effect for Cards
export function ShimmerCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none shimmer-card-overlay"
      />
      {children}
    </div>
  );
}

// Typewriter Effect
export function TypeWriter({ text, className = "" }: { text: string; className?: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

// Animated Border
export function AnimatedBorder({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none animated-border-overlay"
      />
      {children}
    </div>
  );
}

// Reveal on Scroll
export function RevealOnScroll({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`reveal-${delay}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      id={`reveal-${delay}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}

// Ripple Button Effect
export function RippleButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples([...ripples, { x, y, id }]);
    setTimeout(() => {
      setRipples((r) => r.filter((ripple) => ripple.id !== id));
    }, 1000);

    props.onClick?.(e);
  };

  return (
    <button {...props} onClick={handleClick} className={`relative overflow-hidden ${className}`}>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
      {children}
    </button>
  );
}

// Sparkle Effect
export function SparkleEffect({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-block">
      {/* Sparkles */}
      <div className="absolute -top-2 -right-2 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDuration: "1.5s" }} />
      <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
      <div className="absolute top-1/2 -right-3 w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.3s" }} />
      {children}
    </div>
  );
}

// Morphing Background Blob
export function MorphingBlob() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute w-[600px] h-[600px] opacity-30 morphing-blob-element"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          filter: "blur(80px)",
          top: "20%",
          left: "50%",
        }}
      />
    </div>
  );
}
