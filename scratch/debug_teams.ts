import { createClient } from "@insforge/sdk";

const insforge = createClient({
  baseUrl: "https://6ing66q5.us-east.insforge.app",
  anonKey: "ik_1c97d1288ae9a292864c6ca01bd896a3",
});

async function debugTeams() {
  const { data: teams, error } = await insforge.database.from('teams').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('TEAMS_START');
    console.log(JSON.stringify(teams, null, 2));
    console.log('TEAMS_END');
  }
  process.exit(0);
}

debugTeams();
