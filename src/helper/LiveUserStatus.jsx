import { useEffect, useState } from 'react';
import supabase from '../helper/supabaseClient';
import '../styles/LiveUserStatus.less';

export default function LiveUserStatus({ userId }) {

  const [status, setStatus] = useState({ text: "-", online: false });

  useEffect(() => {
    if (!userId) return;

    const updateStatus = (lastActive) => {
      const date = new Date(lastActive);
      const now = new Date();
      const diffInSeconds = (now - date) / 1000;

      if (diffInSeconds <= 120) {
        setStatus({ text: "Active now", online: true });
      } else if (diffInSeconds < 3600) {
        setStatus({ text: `Active ${Math.floor(diffInSeconds / 60)} min ago`, online: false });
      } else if (diffInSeconds < 86400) {
        setStatus({ text: `Active ${Math.floor(diffInSeconds / 3600)} h ago`, online: false });
      } else {
        setStatus({ text: `Active: ${date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, online: false });
      }
    };

    const fetchInitialStatus = async () => {
      const { data, error } = await supabase
        .from('user_profile')
        .select('last_active')
        .eq('id', userId)
        .single();

      if (!error && data) updateStatus(data.last_active);
    };

    fetchInitialStatus();

    const subscription = supabase
      .channel(`public:user_profile:id=eq.${userId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "user_profile",
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        updateStatus(payload.new.last_active);
      }
    )
    .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);


  return (
    <span className={`status-dot ${status.online ? "online" : "offline"}`}>
      {status.text}
    </span>
  );
}

