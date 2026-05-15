
import { createClient } from "@insforge/sdk";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
envContent.split("\n").forEach(line => {
  const [key, value] = line.split("=");
  if (key && value) env[key.trim()] = value.trim();
});

const insforge = createClient({ baseUrl: env.VITE_INSFORGE_URL, anonKey: env.VITE_INSFORGE_ANON_KEY });

async function updateTimer() {
  const targetDate = "2026-05-16T07:30:00+06:00"; 
  console.log(`Updating event configuration for ${targetDate}...`);

  try {
    const { data: existing, error: fetchError } = await insforge.database.from("event_config").select("id").limit(1).maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      const { error } = await insforge.database
        .from("event_config")
        .update({ 
          event_start_time: targetDate,
          hunt_started_at: targetDate,
          hunt_started: false 
        })
        .eq("id", existing.id);
      if (error) throw error;
      console.log("Successfully updated existing record.");
    } else {
      const { error } = await insforge.database
        .from("event_config")
        .insert([{ 
          event_start_time: targetDate,
          hunt_started_at: targetDate,
          hunt_started: false
        }]);
      if (error) throw error;
      console.log("Successfully inserted new record.");
    }
  } catch (err) {
    console.error("Error updating database:", err);
    process.exit(1);
  }
}

updateTimer();
