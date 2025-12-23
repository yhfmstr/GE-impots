import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, db, isSupabaseConfigured } from './supabase';
import { checkProfileFreshness } from './profileFreshness';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await db.getProfile(userId);
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profileData = await fetchProfile(user.id);
    if (profileData) {
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        setError(null);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication is not configured');
    }
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      throw error;
    }
    return data;
  };

  const signUp = async (email, password) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication is not configured');
    }
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      throw error;
    }
    return data;
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication is not configured');
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
      throw error;
    }
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication is not configured');
    }
    setError(null);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      setError(error.message);
      throw error;
    }
    return data;
  };

  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Authentication is not configured');
    }
    setError(null);
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      setError(error.message);
      throw error;
    }
    return data;
  };

  // Computed values
  const isAuthenticated = !!user;
  const needsOnboarding = isAuthenticated && profile && !profile.onboarding_completed_at;
  const freshnessCheck = profile ? checkProfileFreshness(profile) : { needsUpdate: false };
  const needsProfileUpdate = isAuthenticated && !needsOnboarding && freshnessCheck.needsUpdate;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuperAdmin = profile?.role === 'super_admin';

  const value = {
    // State
    user,
    profile,
    loading,
    error,

    // Computed
    isAuthenticated,
    isConfigured: isSupabaseConfigured(),
    needsOnboarding,
    needsProfileUpdate,
    freshnessCheck,
    isAdmin,
    isSuperAdmin,

    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for checking if user can access admin features
export function useAdminAccess() {
  const { isAdmin, isSuperAdmin, profile, loading } = useAuth();
  return {
    canAccessAdmin: isAdmin || isSuperAdmin,
    canManageUsers: isSuperAdmin,
    canReviewDeclarations: isAdmin || isSuperAdmin,
    role: profile?.role,
    loading,
  };
}

export default AuthContext;
