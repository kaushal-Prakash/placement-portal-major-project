"use client";

import { Target, Sparkles, FileText, Calendar, MessageSquare, GraduationCap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f7f2eb] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-[#8b9a6e]/10 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] left-[-5%] w-[35vw] h-[35vw] bg-[#eae2d6]/40 rounded-full blur-[100px] pointer-events-none"
      />

      <div className="max-w-4xl w-full relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.h1 variants={fadeInUp} className="text-4xl font-poppins font-extrabold text-gray-900 sm:text-5xl">
            About Smart<span className="text-[#8b9a6e]">Career</span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="mt-4 text-xl text-gray-600">
            Revolutionizing the way students and companies connect through AI-driven insights.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-xl border border-white/50 p-8 sm:p-12"
        >
          <div className="space-y-12">

            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-10 h-10 rounded-xl bg-[#8b9a6e]/10 text-[#8b9a6e] flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </span>
                Our Mission
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg pl-12">
                At SmartCareer, we believe that finding the right job should be based on merit, skills, and true potential—not just keywords on a resume. Our mission is to bridge the gap between talented students and top-tier companies by leveraging advanced artificial intelligence to ensure the perfect match.
              </p>
            </motion.section>

            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeInUp} className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </span>
                What We Do
              </motion.h2>
              <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2">
                <motion.div whileHover={{ y: -5 }} className="bg-white/50 p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">AI Resume Matching</h3>
                  <p className="text-gray-600">We analyze your resume against job descriptions to provide a tailored match score and actionable feedback on how to improve your chances.</p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bg-white/50 p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">Smart Auto-Scheduling</h3>
                  <p className="text-gray-600">No more email back-and-forths. Our platform automatically slots interviews for shortlisted candidates seamlessly.</p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bg-white/50 p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">AI Mock Interviews</h3>
                  <p className="text-gray-600">Practice makes perfect. Chat with our AI copilot tailored to the specific job you're applying for, ensuring you're ready for the real thing.</p>
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bg-white/50 p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">Alumni Insights</h3>
                  <p className="text-gray-600">Learn from those who came before you. Access real interview experiences and feedback shared by alumni who successfully secured offers.</p>
                </motion.div>
              </motion.div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center bg-[#333333] rounded-3xl p-10 shadow-lg mt-8 relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#8b9a6e] rounded-full blur-2xl opacity-20"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-[#eae2d6] rounded-full blur-2xl opacity-10"></div>

              <h2 className="text-2xl font-semibold text-white mb-4 relative z-10">Ready to accelerate your career?</h2>
              <p className="text-gray-300 mb-8 relative z-10">Join thousands of students who have already found their dream jobs.</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#8b9a6e] text-white font-medium hover:bg-[#7b8a5e] transition-all shadow-lg hover:shadow-[#8b9a6e]/30 relative z-10"
              >
                Get Started Today
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
