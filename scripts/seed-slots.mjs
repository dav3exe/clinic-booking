// Fills the API with demo slots for the next 7 days through POST /reset (this wipes existing bookings).
// Usage: BASE_URL=https://your-app.vercel.app API_KEY=your-key npm run seed
const baseUrl = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("Set API_KEY first.");
  process.exit(1);
}

const providers = ["Dr Ade", "Dr Bisi", "Dr Chidi"];
const hours = [9, 10, 11, 14, 15];
const slots = [];

for (let day = 1; day <= 7; day++) {
  for (const [p, provider] of providers.entries()) {
    for (const hour of hours) {
      const start = new Date();
      start.setUTCDate(start.getUTCDate() + day);
      start.setUTCHours(hour, 0, 0, 0);
      const end = new Date(start.getTime() + 30 * 60_000);
      slots.push({
        id: `s-${day}-${p + 1}-${hour}`,
        provider,
        start: start.toISOString(),
        end: end.toISOString(),
      });
    }
  }
}

const res = await fetch(`${baseUrl}/reset`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
  body: JSON.stringify({ slots }),
});
console.log(res.status, await res.text());
