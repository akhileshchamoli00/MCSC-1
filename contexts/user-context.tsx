"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

if (typeof window !== "undefined") {
  const win = window as any;
  if (!win.fetchIntercepted) {
    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const urlStr = input.toString();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      if (urlStr.includes("/api/") || (apiUrl && urlStr.startsWith(apiUrl))) {
        if (!init) init = {};
        init.credentials = "include";
      }
      return originalFetch(input, init);
    };
    win.fetchIntercepted = true;
  }
}

interface UserContextType {
  profile: any;
  isAdmin: boolean;
  loading: boolean;
  permissions: string[];
  hasPermission: (moduleCode: string, actionCode: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (isBackground = false) => {
    const token = localStorage.getItem("hrms_token");
    if (!token) {
      setProfile(null);
      setIsAdmin(false);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      if (!isBackground) {
        setLoading(true);
      }
      const [authRes, profileRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me?t=${Date.now()}`, {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Cache-Control": "no-cache"
          }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/?t=${Date.now()}`, {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Cache-Control": "no-cache"
          }
        })
      ]);

      if (authRes.ok) {
        const data = await authRes.json();
        const isAdminFlag = (data.role?.name && data.role.name.toUpperCase().includes("ADMIN")) || 
          data.email === "admin@mcs-consulting.com" || 
          data.role_id === 1;
        setIsAdmin(isAdminFlag);
        const freshPermissions = data.permissions || [];
        setPermissions(freshPermissions);
        localStorage.setItem("user_role", data.role?.name || "");
        localStorage.setItem("user_email", data.email || "");
        localStorage.setItem("hrms_permissions", JSON.stringify(freshPermissions));
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        localStorage.setItem("hrms_profile", JSON.stringify(profileData));
      } else {
        setProfile(null);
        localStorage.removeItem("hrms_profile");
      }
    } catch (err) {
      console.error("Error fetching user session:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Try to load cached session from localStorage to render instantly
    const token = localStorage.getItem("hrms_token");
    if (!token) {
      setLoading(false);
      return;
    }

    let hasCache = false;
    try {
      const cachedProfile = localStorage.getItem("hrms_profile");
      const cachedPermissions = localStorage.getItem("hrms_permissions");
      const cachedRole = localStorage.getItem("user_role") || "";

      if (cachedProfile) {
        setProfile(JSON.parse(cachedProfile));
      }
      if (cachedPermissions) {
        setPermissions(JSON.parse(cachedPermissions));
      }
      
      const isAdminFlag = cachedRole.toUpperCase().includes("ADMIN") || 
        localStorage.getItem("user_email") === "admin@mcs-consulting.com";
      setIsAdmin(isAdminFlag);

      if (cachedProfile && cachedPermissions) {
        setLoading(false);
        hasCache = true;
      }
    } catch (e) {
      console.error("Error loading cached session:", e);
    }

    // 2. Fetch fresh details in the background (SWR)
    fetchProfile(hasCache);
  }, []);

  const hasPermission = (moduleCode: string, actionCode: string) => {
    if (isAdmin) return true;
    return permissions.includes(`${moduleCode}:${actionCode}`) || permissions.includes("*:*");
  };

  return (
    <UserContext.Provider value={{ profile, isAdmin, loading, permissions, hasPermission, refreshProfile: fetchProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
