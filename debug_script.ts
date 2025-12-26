import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

async function run() {
  const { getUserRegistrations, getAllRegistrations } = await import('./backend/services/registrationService');
  const { getEventById, getEvents } = await import('./backend/services/eventService');
  const { getUserByEmail, getAllUsers } = await import('./backend/services/userService');

  console.log('--- USERS ---');
  const users = await getAllUsers();
  console.log(`Found ${users.length} users`);
  users.forEach(u => console.log(`- ${u.email} (${u.id})`));

  console.log('\n--- EVENTS ---');
  const events = await getEvents();
  console.log(`Found ${events.length} events`);
  events.forEach(e => console.log(`- ${e.title} (${e.id})`));

  console.log('\n--- REGISTRATIONS ---');
  const allRegs = await getAllRegistrations();
  console.log(`Total registrations in DB: ${allRegs.length}`);
  
  if (allRegs.length > 0) {
      // ... existing logic ...
      console.log('Sample registration:', allRegs[0]);
      
      // Check the first user found in registrations
      const userId = allRegs[0].userId;
      console.log(`Checking registrations for user ID: ${userId}`);
      
      const userRegs = await getUserRegistrations(userId);
      console.log(`User has ${userRegs.length} registrations`);
      
      for (const reg of userRegs) {
          console.log(`Checking event ${reg.eventId}...`);
          const event = await getEventById(reg.eventId);
          console.log(`Event found: ${!!event}`);
          if (!event) {
              console.log(`FAILED to find event ${reg.eventId}`);
          } else {
              console.log(`Event title: ${event.title}`);
          }
      }
  } else {
      console.log('No registrations found in DB.');
  }
}

run().catch(console.error);
