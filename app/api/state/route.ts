import { env } from "cloudflare:workers";

const ensureStateTable = () => env.DB.prepare(`CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`).run();

export async function GET() {
  await ensureStateTable();
  const row = await env.DB.prepare("SELECT payload FROM app_state WHERE id = 1").first<{ payload: string }>();
  return Response.json(row ? JSON.parse(row.payload) : null);
}

export async function PUT(request: Request) {
  await ensureStateTable();
  const payload = await request.json();
  if (!payload || !Array.isArray(payload.players) || !Array.isArray(payload.games)) {
    return Response.json({ error: "Invalid state" }, { status: 400 });
  }
  await env.DB.prepare(`INSERT INTO app_state (id, payload, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = CURRENT_TIMESTAMP`)
    .bind(JSON.stringify(payload)).run();
  return Response.json({ saved: true });
}
