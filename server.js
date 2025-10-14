/* Minimal backend for entries and push notifications (dev use) */
const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for demo
const entries = [];
const subscriptions = new Set();

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails('mailto:example@example.com', VAPID_PUBLIC, VAPID_PRIVATE);
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/entries', (req, res) => {
  const entry = req.body;
  entries.push({ ...entry, backendSavedAt: Date.now() });
  res.status(201).json({ ok: true });
});

app.get('/api/entries', (_req, res) => res.json(entries));

app.get('/api/push/public-key', (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

app.post('/api/push/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.add(JSON.stringify(subscription));
  res.status(201).json({ ok: true });
});

app.post('/api/push/test', async (req, res) => {
  const payload = req.body || { title: 'Hola', body: 'Notificación de prueba' };
  const results = [];
  for (const subStr of subscriptions) {
    const sub = JSON.parse(subStr);
    try {
      const r = await webpush.sendNotification(sub, JSON.stringify(payload));
      results.push({ ok: true, id: r.headers?.get('Location') || null });
    } catch (e) {
      results.push({ ok: false, error: String(e) });
    }
  }
  res.json({ sent: results.length, results });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
