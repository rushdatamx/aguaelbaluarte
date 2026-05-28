"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UserProfile } from "@/lib/types";

const AuthContext = createContext<UserProfile | null>(null);

export function AuthProvider({
  profile,
  children,
}: {
  profile: UserProfile;
  children: ReactNode;
}) {
  return <AuthContext.Provider value={profile}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
