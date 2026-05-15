import { insforge } from "@/lib/insforge";
import type { Notification } from "@/types";

export async function fetchNotifications(teamId: string): Promise<Notification[]> {
  const { data, error } = await insforge.database
    .from("notifications")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  await insforge.database
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
}

export async function markAllRead(teamId: string): Promise<void> {
  await insforge.database
    .from("notifications")
    .update({ read: true })
    .eq("team_id", teamId)
    .eq("read", false);
}

export async function insertNotification(notification: {
  team_id: string;
  type: string;
  title: string;
  message: string;
  points?: number;
}): Promise<void> {
  await insforge.database.from("notifications").insert([{
    team_id: notification.team_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    points: notification.points ?? 0,
  }]);
}
