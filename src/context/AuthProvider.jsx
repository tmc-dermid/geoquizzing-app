import { useEffect, useState } from 'react';
import supabase from '../helper/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast, Slide } from 'react-toastify';
import { AuthContext } from './AuthContext';


export function AuthProvider({ children }) {

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

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

    toast.success('Successfully signed out!', {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      transition: Slide,
      style: {
        background: '#e6ffed',
        color: '#1b5e20',
      },
    });

    await supabase.auth.signOut();
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

        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    });

    return () => listener?.subscription?.unsubscribe();

  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}