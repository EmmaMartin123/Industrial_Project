"use client";

import { useProtect } from "@/lib/auth/auth";
import { useAuthStore } from "@/lib/store/authStore";
import router from "next/router";
import { useEffect } from "react";

export default function page() {
	const { userProfile, isLoading } = useProtect();

  return (
    <div></div>
  )
}


