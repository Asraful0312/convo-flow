import Link from "next/link";
import CandidLogo from "../shared/candid-logo";

export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <CandidLogo />
    </Link>
  );
};
