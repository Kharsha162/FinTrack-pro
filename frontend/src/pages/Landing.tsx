import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

export function Landing() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.2 } },
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans overflow-hidden">
      {/* Hero Section */}
      <section ref={targetRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0" />
        
        {/* Abstract Luxury Elements */}
        <motion.div 
          className="absolute top-1/4 -left-20 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div 
          style={{ opacity, scale, y }} 
          className="relative z-10 text-center max-w-4xl px-4"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.h2 variants={fadeInUp} className="text-yellow-500 font-medium tracking-[0.3em] uppercase text-sm mb-4">
              The Future of Wealth
            </motion.h2>
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-8xl font-serif font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 mb-6">
              FinTrack Pro
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Experience financial clarity with a platform designed for the discerning investor. 
              Precision, elegance, and intelligence in one secure dashboard.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register" className="group relative px-8 py-3 bg-white text-black font-semibold rounded-full overflow-hidden transition-transform hover:scale-105">
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-yellow-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
              </Link>
              <Link to="/login" className="px-8 py-3 border border-slate-700 rounded-full text-slate-300 hover:text-white hover:border-white transition-all duration-300">
                Sign In
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Storytelling Section */}
      <section className="py-32 px-6 bg-black relative">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h3 className="text-3xl md:text-4xl font-serif mb-6">The Art of Finance</h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              Just as a masterpiece requires attention to detail, so does your wealth. 
              We've stripped away the noise to provide you with a pristine canvas for your financial life.
            </p>
            <div className="h-px w-20 bg-yellow-600/50" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
             <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-transparent blur-2xl -z-10" />
             <div className="p-8 border border-slate-800 bg-slate-900/50 backdrop-blur-sm rounded-2xl">
                <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                  <span className="text-slate-400 text-sm">Portfolio Growth</span>
                  <span className="text-emerald-400 font-mono">+24.5%</span>
                </div>
                <div className="space-y-4">
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "75%" }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400" 
                    />
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "45%" }}
                      transition={{ duration: 1.5, delay: 0.7 }}
                      className="h-full bg-slate-600" 
                    />
                  </div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center text-3xl md:text-5xl font-serif mb-20"
          >
            Why FinTrack Pro?
          </motion.h3>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "AI Insights", desc: "Predictive analytics for your spending patterns.", icon: "✨" },
              { title: "Bank Grade Security", desc: "Encryption that rivals the world's best vaults.", icon: "🔒" },
              { title: "Global Markets", desc: "Real-time tracking of assets worldwide.", icon: "🌍" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, duration: 0.8 }}
                className="group p-8 border border-slate-800 hover:border-yellow-600/30 bg-slate-900/30 hover:bg-slate-900/50 transition-all duration-500 rounded-xl"
              >
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h4 className="text-xl font-semibold mb-3 text-slate-200 group-hover:text-yellow-500 transition-colors">{feature.title}</h4>
                <p className="text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-yellow-600/5 z-0" />
        <div className="relative z-10 text-center px-4">
          <h2 className="text-4xl md:text-6xl font-serif mb-8">Begin Your Journey</h2>
          <Link to="/register" className="inline-block px-12 py-4 bg-slate-100 text-slate-900 font-bold rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
            Create Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 text-center text-slate-600 text-sm">
        <p>&copy; {new Date().getFullYear()} FinTrack Pro. All rights reserved.</p>
      </footer>
    </div>
  );
}
