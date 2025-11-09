"use client";
import Link from "next/link";
import CandidLogo from "../shared/candid-logo";
import { motion } from "framer-motion";

export const Logo = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <CandidLogo />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        Candid
      </motion.span>
    </Link>
  );
};
