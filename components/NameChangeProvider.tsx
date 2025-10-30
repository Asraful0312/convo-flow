"use client";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex-helpers/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import React, {  useEffect } from "react";

const NameChangeProvider = () => {
  const router = useRouter();
  const updateUserName = useMutation(api.auth.updateUserName);
  const user = useQuery(api.auth.loggedInUser);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get("name");
    const isNewUser = urlParams.get("newUser");

    if (name && isNewUser && user) {
      // Update the name after the component mounts (auth should be ready)
      updateUserName({ name }).catch(console.error);

      // Clean up the URL
      router.replace("/");
    }
  }, [updateUserName, router, user]);
  return <></>;
};

export default NameChangeProvider;
