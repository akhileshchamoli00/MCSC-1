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

const isSuperAdminRole = (roleName?: string, roleId?: number, email?: string) => {
  if (email === "admin@mcs-consulting.com" || roleId === 1) return true;
  if (!roleName) return false;
  const name = roleName.trim().toUpperCase();
  return name === "ADMIN" || name === "SUPER ADMIN" || name === "SUPERADMIN" || name === "SYSTEM ADMIN";
};

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

      if (authRes.status === 401 || profileRes.status === 401) {
        localStorage.removeItem("hrms_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("user_email");
        localStorage.removeItem("hrms_permissions");
        localStorage.removeItem("hrms_profile");
        setProfile(null);
        setIsAdmin(false);
        setPermissions([]);
        setLoading(false);
        return;
      }

      if (authRes.ok) {
        const data = await authRes.json();
        const isAdminFlag = isSuperAdminRole(data.role?.name, data.role_id, data.email);
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
      
      const isAdminFlag = isSuperAdminRole(cachedRole, undefined, localStorage.getItem("user_email") || undefined);
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

  // 3. Auto-logout after 30 minutes of user inactivity
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      const token = localStorage.getItem("hrms_token");
      if (!token) return;

      inactivityTimer = setTimeout(() => {
        localStorage.removeItem("hrms_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_id");
        localStorage.removeItem("hrms_permissions");
        localStorage.removeItem("hrms_profile");
        window.location.href = "/login?reason=inactivity";
      }, INACTIVITY_LIMIT_MS);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
    };
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
