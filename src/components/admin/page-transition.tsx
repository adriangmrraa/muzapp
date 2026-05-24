"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const FULL_BLEED_ROUTES = ["/admin/conversations", "/admin/conversations/"];

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = FULL_BLEED_ROUTES.includes(pathname);

  if (isFullBleed) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
        {children}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="flex-1 overflow-y-auto"
        style={{
          background:
            "radial-gradient(ellipse at 60% 0%, rgba(212,160,23,0.04) 0%, #0a0a0a 60%)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="p-6">{children}</div>
      </motion.div>
    </AnimatePresence>
  );
}
