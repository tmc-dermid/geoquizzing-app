import supabase from "../helper/supabaseClient";
import { useActivitySession } from "./activitySessionStore";

export async function startActivity(userId) {
  const { data, error } = await supabase.rpc("start_activity_session", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Start activity error:", error);
    return;
  }

  useActivitySession.getState().setSessionId(data);
}

export async function updateActivity() {
  const sessionId = useActivitySession.getState().sessionId;
  if (!sessionId) return;

  await supabase.rpc("update_activity_session", {
    p_session_id: sessionId,
  });
}

export async function endActivity() {
  const sessionId = useActivitySession.getState().sessionId;
  if (!sessionId) return;

  await supabase.rpc("end_activity_session", {
    p_session_id: sessionId,
  });

  useActivitySession.getState().clearSession();
}