"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Briefcase, GraduationCap, ArrowRight, BrainCircuit, Activity, BarChart4 } from "lucide-react";

export default function Home() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f2eb] relative overflow-hidden flex flex-col font-sans">
      
      {/* Animated Background Blobs */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#8b9a6e]/20 rounded-full blur-[100px] mix-blend-multiply opacity-70 z-0"
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] bg-[#eae2d6]/60 rounded-full blur-[100px] mix-blend-multiply opacity-70 z-0"
      />
      <motion.div 
        animate={{ scale: [1, 1.15, 1], x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] bg-[#eeeeee]/80 rounded-full blur-[100px] mix-blend-multiply opacity-70 z-0"
      />

      {/* Hero Section */}
      <main className="relative pt-24 pb-16 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center flex-1 z-10 w-full">
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center w-full max-w-4xl mb-16"
        >
          <motion.div variants={fadeInUp} className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8b9a6e]/10 text-[#8b9a6e] font-medium text-sm border border-[#8b9a6e]/20">
              <Sparkles size={16} /> Welcome to the future of hiring
            </span>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <h1 className="font-poppins text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight tracking-tight text-[#333333] mb-6">
              Get Hired with <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8b9a6e] to-[#6b7a4e]">
                AI Resume Ranking
              </span>
            </h1>
          </motion.div>

          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto font-sans">
            Instantly discover matched jobs, optimize your career profile, and practice with hyper-personalized AI mock interviews.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <button className="px-8 py-3.5 rounded-2xl font-semibold text-white bg-[#8b9a6e] hover:bg-[#7b895e] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm hover:shadow-md">
                <Briefcase size={18} />
                Browse Jobs
                <ArrowRight size={18} />
              </button>
            </Link>
            <Link href="/alumni-experience">
              <button className="px-8 py-3.5 rounded-2xl font-semibold text-[#333333] bg-white/60 hover:bg-white border border-gray-200 transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm hover:shadow-md">
                <GraduationCap size={18} />
                Learn from Alumni
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-4"
        >
          {/* Card 1 */}
          <motion.div variants={fadeInUp} whileHover={{ y: -8 }} className="bg-white/40 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group">
            <div className="w-14 h-14 rounded-2xl bg-[#8b9a6e]/15 text-[#8b9a6e] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-[#8b9a6e]/20">
              <BrainCircuit size={28} />
            </div>
            <h3 className="font-poppins text-2xl font-bold mb-3 text-[#333333]">AI Skill Match</h3>
            <p className="text-gray-600 font-sans leading-relaxed">
              Instantly see how well your resume matches the job description using advanced NLP cosine similarity algorithms.
            </p>
          </motion.div>
          
          {/* Card 2 */}
          <motion.div variants={fadeInUp} whileHover={{ y: -8 }} className="bg-white/40 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group">
            <div className="w-14 h-14 rounded-2xl bg-[#eae2d6] text-[#8b9a6e] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white">
              <Activity size={28} />
            </div>
            <h3 className="font-poppins text-2xl font-bold mb-3 text-[#333333]">Mock Interviews</h3>
            <p className="text-gray-600 font-sans leading-relaxed">
              Practice with tailored questions based on your specific skill gaps and the company's past interview history.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={fadeInUp} whileHover={{ y: -8 }} className="bg-white/40 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group md:col-span-3 lg:col-span-1">
            <div className="w-14 h-14 rounded-2xl bg-[#eeeeee] text-[#333333] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white">
              <BarChart4 size={28} />
            </div>
            <h3 className="font-poppins text-2xl font-bold mb-3 text-[#333333]">Placement Analytics</h3>
            <p className="text-gray-600 font-sans leading-relaxed">
              View detailed historical data and predictive placement probability for every visiting company on our campus.
            </p>
          </motion.div>
        </motion.div>

      </main>
    </div>
  );
}
