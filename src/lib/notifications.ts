import { supabase } from "@/context/AuthContext";

/**
 * Kirim notifikasi ke user
 */
export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  tipe: "info" | "success" | "warning" | "error" = "info",
  link?: string
) {
  if (!supabase) {
    console.error("Supabase tidak tersedia");
    return;
  }

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    tipe,
    link,
    dibaca: false,
  });

  if (error) {
    console.error("Error sending notification:", error);
  }
}

/**
 * Kirim notifikasi ke semua mitra (untuk admin)
 */
export async function sendNotificationToAllMitras(
  title: string,
  message: string,
  tipe: "info" | "success" | "warning" | "error" = "info",
  link?: string
) {
  if (!supabase) return;

  // Get all mitra IDs
  const { data: mitras } = await supabase
    .from("users")
    .select("id")
    .eq("role", "mitra");

  if (mitras) {
    for (const mitra of mitras) {
      await sendNotification(mitra.id, title, message, tipe, link);
    }
  }
}
