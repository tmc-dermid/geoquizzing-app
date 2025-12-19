import { useEffect, useState } from 'react';
import supabase from '../helper/supabaseClient';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const fetchProfile = async (user) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_profile')
      .select(`
        id,
        username,
        avatar_url,
        created_at,
        last_active,
        updated_at,
        country_of_origin,
        points,
        is_admin
      `)
      .eq('id', user.id)
      .single();

    if (!error && data) setProfile(data);

    await supabase
      .from('user_profile')
      .update({ last_active: new Date().toISOString() })
      .eq('id', user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();

    setShowSignOutModal(true);
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) fetchProfile(user);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => listener?.subscription?.unsubscribe();

  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, signOut, showSignOutModal, setShowSignOutModal }}>
      {children}
    </AuthContext.Provider>
  );
}