import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  /** Current Authentication Assurance Level: aal1 = password only, aal2 = MFA verified */
  currentAal: "aal1" | "aal2" | null;
  /** AAL level required by the user's enrolled factors (aal2 if any verified TOTP factor exists) */
  nextAal: "aal1" | "aal2" | null;
  /** Whether MFA is required for this user (admins must enroll MFA) */
  mfaRequired: boolean;
  /** Whether the user has at least one verified MFA factor */
  mfaEnrolled: boolean;
  refreshMfa: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  session: null,
  user: null,
  isAdmin: false,
  loading: true,
  currentAal: null,
  nextAal: null,
  mfaRequired: false,
  mfaEnrolled: false,
  refreshMfa: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentAal, setCurrentAal] = useState<"aal1" | "aal2" | null>(null);
  const [nextAal, setNextAal] = useState<"aal1" | "aal2" | null>(null);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
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
          checkAdmin(sess.user.id);
          refreshMfa();
        }, 0);
      } else {
        setIsAdmin(false);
        setCurrentAal(null);
        setNextAal(null);
        setMfaEnrolled(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        checkAdmin(data.session.user.id);
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
        loading,
        currentAal,
        nextAal,
        mfaRequired: isAdmin,
        mfaEnrolled,
        refreshMfa,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
