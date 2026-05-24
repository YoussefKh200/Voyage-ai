// components/landing/Footer.tsx — Premium footer with gradient divider
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="relative border-t border-white/6 pt-16 pb-10 px-6">
      {/* Gradient top edge */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-px bg-gradient-to-r from-transparent via-[#d4a853]/40 to-transparent" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4a853] to-[#e2714b] flex items-center justify-center text-white text-sm font-bold shadow-md">
                V
              </div>
              <span className="font-display text-xl font-semibold text-white">{APP_NAME}</span>
            </div>
            <p className="text-white/35 text-sm leading-relaxed max-w-xs">
              AI-powered travel planning that helps you discover the best of every destination — intelligently, beautifully.
            </p>
            {/* Social links placeholder */}
            <div className="flex items-center gap-3 mt-5">
              {["Twitter", "Instagram"].map((s) => (
                <a key={s} href="#" className="w-8 h-8 glass rounded-lg border border-white/8 flex items-center justify-center text-white/30 hover:text-white hover:border-white/20 transition-all duration-200 text-xs">
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white/70 text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm text-white/35">
              {[["Trip Planner", "/planner"], ["Features", "/#features"], ["How it works", "/#how-it-works"]].map(([l, h]) => (
                <li key={l}><Link href={h} className="hover:text-white/70 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white/70 text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-white/35">
              {["About", "Blog", "Privacy", "Terms"].map((l) => (
                <li key={l}><a href="#" className="hover:text-white/70 transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/6 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/20">
          <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            Built with <span className="text-[#d4a853]">♥</span> and AI
          </span>
        </div>
      </div>
    </footer>
  );
}
