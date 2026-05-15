import { createClient } from '@insforge/sdk';

const baseUrl = 'https://6ing66q5.us-east.insforge.app';
const anonKey = 'ik_1c97d1288ae9a292864c6ca01bd896a3';

const insforge = createClient({ baseUrl, anonKey });

async function checkData() {
  console.log('--- Checking Teams ---');
  const { data: teams, error: tErr } = await insforge.database.from('teams').select('*');
  if (tErr) {
    console.error('Teams Error:', tErr);
  } else {
    console.log('Teams count:', teams?.length);
    console.log('Teams data:', JSON.stringify(teams, null, 2));
  }

  console.log('\n--- Checking Participants ---');
  const { data: participants, error: pErr } = await insforge.database.from('participants').select('*');
  if (pErr) console.error(pErr); else console.table(participants);

  console.log('\n--- Checking Spots ---');
  const { data: spots, error: sErr } = await insforge.database.from('spots').select('*');
  if (sErr) console.error(sErr); else console.table(spots);
}

checkData();
