"use client";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex-helpers/react";
import { useMutation } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef } from "react";

const NameChangeProvider = () => {
  const router = useRouter();
  const pathname = usePathname();
  const updateUserName = useMutation(api.auth.updateUserName);
  const user = useQuery(api.auth.loggedInUser);
  const hasUpdatedName = useRef(false);

  useEffect(() => {
    // Prevent running multiple times
    if (hasUpdatedName.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get("name");
    const isNewUser = urlParams.get("newUser");

    if (name && isNewUser && user) {
      hasUpdatedName.current = true;
      
      // Update the name after the component mounts (auth should be ready)
      updateUserName({ name })
        .then(() => {
          // Clean up the URL by removing name/newUser params but staying on current page
          urlParams.delete("name");
          urlParams.delete("newUser");
          const newQuery = urlParams.toString();
          const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
          router.replace(newUrl);
        })
        .catch(console.error);
    }
  }, [updateUserName, router, user, pathname]);

  return <></>;
};

export default NameChangeProvider;
