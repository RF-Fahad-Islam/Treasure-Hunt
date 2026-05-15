
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

async function check() {
  const { data, error } = await insforge.database.from("event_config").select("*").limit(1).single();
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
check();
