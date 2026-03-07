"use client";

import CandidLogo from "@/components/shared/candid-logo";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Button } from "@/components/ui/button";
import { useConvexAuth } from "convex/react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function FormSubmissionPage() {
  const [menuState, setMenuState] = useState(false);
  const { isLoading, isAuthenticated } = useConvexAuth();
  return (
    <>
      <header>
        <nav data-state={menuState && "active"} className=" w-full px-2 group">
          <div
            className={
              "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12"
            }
          >
            <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
              <div className="flex w-full justify-between lg:w-auto">
                <Link
                  href="/"
                  aria-label="home"
                  className="flex items-center space-x-2 font-semibold"
                >
                  <CandidLogo />
                  CANDID
                </Link>

                <button
                  onClick={() => setMenuState(!menuState)}
                  aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                  className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
                >
                  <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                  <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                </button>
              </div>

              <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                {!isAuthenticated ? (
                  <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/auth/signin">
                        <span>Login</span>
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href="/auth/signup">
                        <span>Sign Up</span>
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Button asChild size="sm">
                    <Link href="/dashboard">
                      <span>Get Started</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>
      <div className="min-h-screen bg-linear-to-b from-background to-muted mt-16">
        <AnimatedGroup variants={transitionVariants as any}>
          <div className="flex flex-col items-center justify-center h-full ">
            <h1 className=" max-w-4xl mx-auto text-balance  text-center text-3xl md:text-6xl ">
              Sorry, you can&apos;t access this form until its published.
            </h1>

            <div className="flex flex-col md:flex-row gap-2 items-center justify-center mt-7">
              <div className="flex items-center flex-col gap-4">
                <p className="text-center text-xl">Did you create this form?</p>
                {!isAuthenticated ? (
                  <Button asChild variant="outline" size="lg">
                    <Link href="/auth/signin">
                      <span>Login</span>
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="lg">
                    <Link href="/dashboard">
                      <span>Dashboard</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </AnimatedGroup>
      </div>
    </>
  );
}
