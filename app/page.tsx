"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, Zap, Globe, Github, Linkedin } from "lucide-react"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Syne, Archivo_Black } from "next/font/google"
// 1. Update the import at the top
import { Cinzel } from "next/font/google"
// 1. Update the import to include Playfair_Display
import { Playfair_Display } from "next/font/google"

// 2. Define the font configuration
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: "500", // Medium weight as requested
  variable: "--font-playfair",
})

// 2. Add the font configuration (place this with the other font constants)
const cinzel = Cinzel({ 
  subsets: ["latin"],
  weight: ["400", "700"], 
  variable: "--font-cinzel",
})

// --- FONTS ---
const syne = Syne({ 
  subsets: ["latin"],
  weight: ["700", "800"], 
  variable: "--font-syne",
})

const druk = Archivo_Black({ 
  weight: "400", 
  subsets: ["latin"],
  variable: "--font-druk",
})

// --- THEME ---
const THEME = {
  highlight: '#cbc74dff', 
  mid: '#a94f25ff',       
  core: '#721d12ff',      
  bg: '#000000ff',        
};

// --- COMPONENT: LIQUID BACKGROUND ---
// Removed the 'onComplete' prop because we don't want it to auto-trigger anymore
const LiquidBackground = () => {
  const { scrollYProgress } = useScroll();
  
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 40, damping: 20, restDelta: 0.001
  });

  // Parallax transforms
  const blob1Y = useTransform(smoothScroll, [0, 1], ["40%", "100%"]);
  const blob1Scale = useTransform(smoothScroll, [0, 0.5], [1, 0.8]);
  const blob2X = useTransform(smoothScroll, [0, 0.4, 1], ["50%", "25%", "40%"]);
  const blob2Y = useTransform(smoothScroll, [0, 0.4, 1], ["40%", "60%", "90%"]);
  const blob3X = useTransform(smoothScroll, [0, 0.4, 1], ["50%", "75%", "60%"]);
  const blob3Y = useTransform(smoothScroll, [0, 0.4, 1], ["40%", "70%", "100%"]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" style={{ backgroundColor: THEME.bg }}>
      
      {/* WRAPPER FOR INTRO ANIMATION */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.5, ease: "circOut" }}
        className="relative w-full h-full"
      >

        {/* A. Ambient Glow */}
        <div className="absolute inset-0 opacity-30 mix-blend-screen">
          <motion.div 
            style={{ top: blob1Y, left: '50%', x: '-50%', y: '-50%' }}
            className="absolute w-[900px] h-[900px] rounded-full blur-[120px] bg-gradient-to-tr from-[#B32C1A] to-[#FE7F42]"
          />
        </div>

        {/* B. The Liquid Engine */}
        <div className="absolute inset-0 w-full h-full filter-[url('#liquid-filter')] opacity-100">
          <motion.div
            style={{ left: '50%', top: blob1Y, scale: blob1Scale, x: '-50%', y: '-50%' }}
            className="absolute w-[500px] h-[500px] rounded-full mix-blend-normal"
          >
             <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FFFB97] via-[#FE7F42] to-[#B32C1A]" />
          </motion.div>

          <motion.div
            style={{ left: blob2X, top: blob2Y, x: '-50%', y: '-50%' }}
            className="absolute w-[320px] h-[320px] bg-gradient-to-tr from-[#B32C1A] to-[#FE7F42] rounded-full"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            style={{ left: blob3X, top: blob3Y, x: '-50%', y: '-50%' }}
            className="absolute w-[280px] h-[280px] bg-gradient-to-bl from-[#FE7F42] to-[#FFFB97] rounded-full"
            animate={{ scale: [0.9, 1.2, 0.9] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </div>
      </motion.div>

      {/* C. SVG Filter */}
      <svg className="hidden">
        <defs>
          <filter id="liquid-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="50" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -20" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
      </svg>
      
      {/* D. Film Grain */}
      <div className="absolute inset-0 opacity-[0.05] z-10 pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
    </div>
  );
};

export default function LandingPage() {
  // 1. STATE TO TRACK INITIALIZATION
  // False = Text Hidden, Click to Start
  // True = Text Visible, Page Interactive
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <div className="flex flex-col min-h-screen relative text-white selection:bg-[#FE7F42] selection:text-[#2A1617]">
      
      {/* 2. BACKGROUND (Always visible) */}
      <LiquidBackground />

      {/* 3. CLICK TO INITIALIZE OVERLAY */}
      <AnimatePresence>
        {!introFinished && (
          <motion.div 
            // 1. Centering: This container takes full screen and centers content (aligns with blob)
            className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
            onClick={() => setIntroFinished(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)", scale: 1.5 }}
            transition={{ duration: 0.8 }}
          >
             {/* 2. The Button Wrapper */}
             <motion.div 
               className="group relative px-10 py-6 sm:px-14 sm:py-8" // Increased padding for larger clickable area
               whileHover={{ scale: 1.05 }}
             >
                {/* Background: Added a slight shadow/glow so it pops off the blob */}
                <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-full border border-white/30 group-hover:border-[#FE7F42] transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_50px_rgba(254,127,66,0.4)]" />
                
                {/* Text: Increased font size significantly */}
                <p className="relative z-10 font-mono text-xl sm:text-3xl font-bold tracking-[0.2em] text-white group-hover:text-[#FE7F42] transition-colors uppercase text-center whitespace-nowrap">
                  [ CREDX ]
                </p>
                
                {/* Pulsing effect: Made slightly stronger */}
                <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-30 duration-[2000ms]" />
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. HEADER (Navbar) */}
      {/* Hidden initially, Fades in when initialized */}
      <motion.header 
        initial="hidden"
        animate={introFinished ? "visible" : "hidden"}
        variants={{
            hidden: { y: -50, opacity: 0 },
            visible: { y: 0, opacity: 1, transition: { duration: 0.8, delay: 0.5 } }
        }}
        className="px-4 lg:px-6 h-20 flex items-center border-b border-white/5 backdrop-blur-sm sticky top-0 z-40"
      >
        <Link className="flex items-center justify-center" href="/">
          <span className="text-4xl font-pirate tracking-tight text-white transition-colors duration-200 hover:text-primary cursor-pointer font-bold">CredX</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 sm:gap-4 rounded-full px-2 py-1 sm:px-4 sm:py-2 bg-white/5 backdrop-blur-xl border border-white/5 shadow-2xl">
          <Link href="#features" className="text-xs sm:text-sm font-medium text-white/70 px-4 py-2 rounded-full hover:text-white hover:bg-white/10 transition-all">Features</Link>
          <Link href="#how-it-works" className="text-xs sm:text-sm font-medium text-white/70 px-4 py-2 rounded-full hover:text-white hover:bg-white/10 transition-all">Process</Link>
          <Link href="/auth/signin"><Button variant="ghost" size="sm" className="hidden sm:inline-flex text-white hover:text-[#FE7F42] hover:bg-white/5 rounded-full">Sign In</Button></Link>
          <Link href="/auth/signup"><Button size="sm" className="rounded-full px-6 bg-[#FE7F42] text-[#2A1617] font-bold hover:bg-[#FFFB97] hover:scale-105 transition-all">Create Account</Button></Link>
        </nav>
      </motion.header>

      <main className="flex-1 relative z-10">
        
        {/* 5. HERO SECTION */}
        <section className="relative w-full min-h-screen flex items-center justify-center px-4 overflow-hidden">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-8 text-center">

              {/* Main Heading */}
              <motion.div
                initial="hidden"
                animate={introFinished ? "visible" : "hidden"}
                variants={{
                  hidden: { opacity: 0, scale: 0.9, filter: "blur(10px)" },
                  visible: { 
                    opacity: 1, 
                    scale: 1, 
                    filter: "blur(0px)",
                    transition: { duration: 1.2, ease: "easeOut", delay: 0.2 } // Added delay so it waits for click
                  }
                }}
                className="space-y-2"
              >
                <div className={`flex flex-col items-center w-full max-w-[100vw] overflow-hidden ${syne.className}`}>
                  <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold tracking-normal uppercase text-white mix-blend-overlay text-center px-4">
                    Decentralized
                  </h1>
                  <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold tracking-normal uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/0 -mt-1 sm:-mt-2 md:-mt-4 text-center px-4">
                    Liquidity
                  </h1>
                </div>
              </motion.div>
              <br />
              <br />

              {/* Description Paragraph */}
              <motion.div 
                initial="hidden"
                animate={introFinished ? "visible" : "hidden"}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: 0.6, duration: 0.8 } 
                  }
                }}
                className="max-w-[800px] flex flex-col items-center gap-6"
              >
                {/* 1. The stylized Headline (Cinzel) */}
                <h2 className={`${cinzel.className} text-2xl sm:text-3xl md:text-4xl text-white font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] text-center`}>
                  Where invoices become Original Assets.
                </h2>
              </motion.div>

              {/* Buttons */}
              <motion.div 
                initial="hidden"
                animate={introFinished ? "visible" : "hidden"}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: 0.8, duration: 0.8 }
                  }
                }}
                className="flex flex-col sm:flex-row justify-center gap-4 pt-8"
              >
                <Link href="/auth/signup">
                  <Button size="lg" className="h-14 px-10 text-base rounded-full bg-white text-[#2A1617] font-bold hover:bg-[#FFFB97] transition-all hover:scale-105 shadow-xl">
                    Get Started <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline" className="h-14 px-10 text-base rounded-full border-white/20 bg-black/20 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/40">
                    Marketplace Demo
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 6. FEATURES SECTION - Hidden until Intro Finished */}
        {/* We simply control visibility with opacity style to prevent scrolling to it before start */}
        <div style={{ opacity: introFinished ? 1 : 0, pointerEvents: introFinished ? 'auto' : 'none', transition: 'opacity 1s ease-in-out' }}>
            <section id="features" className="relative w-full py-24 md:py-36">
              <div className="container px-4 md:px-6 mx-auto">
                
                <div className="mb-16 md:mb-24">
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
                    Liquid <span className="text-[#FE7F42]">Assets.</span><br/>
                    Solid <span className="text-[#FFFB97]">Trust.</span>
                  </h2>
                  <div className="h-1 w-24 bg-gradient-to-r from-[#FE7F42] to-[#B32C1A]"></div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                  {[
                    { 
                      title: "Instant Settlement", 
                      desc: "Get funded in hours via automated verification.", 
                      icon: <Zap className="size-8" />,
                      color: "text-[#FFFB97]"
                    },
                    { 
                      title: "On-Chain Trust", 
                      desc: "Invoices tokenized as NFTs ensuring ownership.", 
                      icon: <ShieldCheck className="size-8" />,
                      color: "text-[#FE7F42]"
                    },
                    { 
                      title: "Global Liquidity", 
                      desc: "Borderless capital markets for real-world yield.", 
                      icon: <Globe className="size-8" />,
                      color: "text-[#B32C1A]"
                    }
                  ].map((feature, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 100, scale: 0.8 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      whileHover={{ y: -10, scale: 1.02 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ 
                        type: "spring", 
                        bounce: 0.4, 
                        duration: 1,
                        delay: i * 0.15 
                      }}
                      className="group relative p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden hover:bg-white/10 transition-colors hover:shadow-2xl hover:shadow-[#FE7F42]/10"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#B32C1A] via-[#FE7F42] to-[#FFFB97] opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className={`mb-6 ${feature.color} transform group-hover:scale-110 transition-transform duration-300`}>
                        {feature.icon}
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                      <p className="text-white/60 leading-relaxed">
                        {feature.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
        </div>
        
      </main>

      {/* 7. FOOTER - Also hidden until intro finished */}
      <div style={{ opacity: introFinished ? 1 : 0, transition: 'opacity 1s ease-in-out' }}>
          <footer className="relative z-10 border-t border-white/10 bg-[#1A0E0F]/80 backdrop-blur-xl">
            <div className="container px-4 md:px-6 mx-auto py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <div className="col-span-1 md:col-span-1">
                  <span className="text-2xl font-mono tracking-widest text-white font-bold uppercase">CredX</span>
                  <p className="mt-4 text-xs text-white/40 uppercase tracking-widest">
                    RWA Financing<br/>Protocol V1.0
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#FE7F42]">Platform</h4>
                  <div className="flex flex-col gap-2 text-sm text-white/60">
                    <Link href="#" className="hover:text-white">Marketplace</Link>
                    <Link href="#" className="hover:text-white">For MSMEs</Link>
                    <Link href="#" className="hover:text-white">Risk Engine</Link>
                  </div>
                </div>

                {/* Column 3: Contact (ADDED HERE) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#FE7F42]">Contact</h4>
                  <div className="flex flex-col gap-2 text-sm text-white/60">
                    <Link href="#" className="hover:text-white transition-colors">Support</Link>
                    <Link href="#" className="hover:text-white transition-colors">Sales</Link>
                    <Link href="#" className="hover:text-white transition-colors">Media</Link>
                  </div>
                </div>

                {/* Column 4: Company (ADDED HERE) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#FE7F42]">Company</h4>
                  <div className="flex flex-col gap-2 text-sm text-white/60">
                    <Link href="/about" className="hover:text-white transition-colors">About</Link>
                    <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#FE7F42]">Connect</h4>
                  <div className="flex gap-4">
                      <Linkedin className="size-5 text-white/60 hover:text-white cursor-pointer" />
                      <Github className="size-5 text-white/60 hover:text-white cursor-pointer" />
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                <p className="text-xs text-white/30 font-mono">© 2026 CredX Protocol.</p>
                <div className="text-xs text-white/30 font-mono">Polygon Amoy Testnet</div>
              </div>
            </div>
          </footer>
      </div>
    </div>
  )
}