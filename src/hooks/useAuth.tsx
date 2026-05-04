import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "creator" | "approver" | "readonly" | "user";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  roles: AppRole[];
  loading: boolean;
  currentAal: "aal1" | "aal2" | null;
  nextAal: "aal1" | "aal2" | null;
  mfaRequired: boolean;
  mfaEnrolled: boolean;
  refreshMfa: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  session: null,
  user: null,
  isAdmin: false,
  roles: [],
  loading: true,
  currentAal: null,
  nextAal: null,
  mfaRequired: false,
  mfaEnrolled: false,
  refreshMfa: async () => {},
  refreshRoles: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAal, setCurrentAal] = useState<"aal1" | "aal2" | null>(null);
  const [nextAal, setNextAal] = useState<"aal1" | "aal2" | null>(null);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);

  const isAdmin = roles.includes("admin");

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  };

  const refreshRoles = async () => {
    const uid = session?.user?.id;
    if (uid) await fetchRoles(uid);
  };

  const refreshMfa = async () => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) {
      setCurrentAal(null);
      setNextAal(null);
      return;
    }
    setCurrentAal((data.currentLevel as any) ?? null);
    setNextAal((data.nextLevel as any) ?? null);

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = (factors?.totp ?? []).some((f) => f.status === "verified");
    setMfaEnrolled(verified);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        setTimeout(() => {
          fetchRoles(sess.user.id);
          refreshMfa();
        }, 0);
      } else {
        setRoles([]);
        setCurrentAal(null);
        setNextAal(null);
        setMfaEnrolled(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchRoles(data.session.user.id);
        refreshMfa();
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAdmin,
        roles,
        loading,
        currentAal,
        nextAal,
        mfaRequired: true,
        mfaEnrolled,
        refreshMfa,
        refreshRoles,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
