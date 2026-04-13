import { supabase } from "@/utils/supabase";

export interface TherapistSession {
  id: string;
  user_id: string;
  therapist_id: number;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  therapists?: {
    id: number;
    name: string;
    specialty: string;
    image_url: string;
  };
}

export const bookSession = async (userId: string, therapistId: number, scheduledAt: string) => {
  const { data, error } = await supabase
    .from("therapist_sessions")
    .insert([
      {
        user_id: userId,
        therapist_id: therapistId,
        scheduled_at: scheduledAt,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error booking session:", error);
    throw new Error(error.message);
  }

  return data;
};

export const getUserSessions = async (userId: string): Promise<TherapistSession[]> => {
  const { data, error } = await supabase
    .from("therapist_sessions")
    .select(`
      *,
      therapists (
        id,
        name,
        specialty,
        image_url
      )
    `)
    .eq("user_id", userId)
    .eq("status", "scheduled")
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("Error fetching sessions:", error);
    throw new Error(error.message);
  }

  return data as TherapistSession[];
};

export const updateSessionStatus = async (sessionId: string, status: 'completed' | 'cancelled') => {
  const { data, error } = await supabase
    .from("therapist_sessions")
    .update({ status })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating session status:", error);
    throw new Error(error.message);
  }

  return data;
};
