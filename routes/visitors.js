// Visitor Analytics Route
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { authenticate } = require('./middleware');

// POST /api/visitors/track — record a page visit
router.post('/track', (req, res) => {
  try {
    const d = getDb();
    const { sessionId, pageUrl, pageTitle, referrer, userAgent, ipAddress, country } = req.body;
    if (!sessionId || !pageUrl) return res.status(400).json({ error: 'sessionId and pageUrl required' });

    // Check if this session already visited this page (update instead of insert)
    const existing = d.prepare(
      "SELECT id FROM visitor_logs WHERE session_id = ? AND page_url = ? AND exit_time IS NULL"
    ).get(sessionId, pageUrl);

    if (existing) {
      // Update the existing record's entry time (page refreshed)
      d.prepare("UPDATE visitor_logs SET entry_time=datetime('now') WHERE id=?").run(existing.id);
      return res.json({ id: existing.id, updated: true });
    }

    d.prepare(`
      INSERT INTO visitor_logs (session_id, page_url, page_title, referrer, user_agent, ip_address, country)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, pageUrl, pageTitle || '', referrer || '', userAgent || '', ipAddress || '', country || '');

    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/visitors/heartbeat — update scroll depth and keep session alive
router.post('/heartbeat', (req, res) => {
  try {
    const d = getDb();
    const { sessionId, pageUrl, scrollDepth } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    // Update the latest record for this session/page
    const record = d.prepare(
      "SELECT id FROM visitor_logs WHERE session_id = ? AND page_url = ? AND exit_time IS NULL ORDER BY id DESC LIMIT 1"
    ).get(sessionId, pageUrl || '');

    if (record) {
      const depth = scrollDepth || 0;
      d.prepare("UPDATE visitor_logs SET scroll_depth = MAX(scroll_depth, ?) WHERE id=?").run(depth, record.id);
    }
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/visitors/exit — record page exit (time on page, bounce)
router.post('/exit', (req, res) => {
  try {
    const d = getDb();
    const { sessionId, pageUrl, duration } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const record = d.prepare(
      "SELECT id FROM visitor_logs WHERE session_id = ? AND page_url = ? AND exit_time IS NULL ORDER BY id DESC LIMIT 1"
    ).get(sessionId, pageUrl || '');

    if (record) {
      const dur = duration || 0;
      d.prepare("UPDATE visitor_logs SET exit_time=datetime('now'), duration=?, is_bounce=CASE WHEN ? < 10 THEN 1 ELSE 0 END WHERE id=?").run(dur, dur, record.id);
    }
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/visitors/click — record WhatsApp/Email click
router.post('/click', (req, res) => {
  try {
    const d = getDb();
    const { sessionId, pageUrl, type } = req.body;
    if (!sessionId || !type) return res.status(400).json({ error: 'sessionId and type required' });

    const field = type === 'whatsapp' ? 'click_whatsapp' : 'click_email';
    const record = d.prepare(
      "SELECT id FROM visitor_logs WHERE session_id = ? AND page_url = ? AND exit_time IS NULL ORDER BY id DESC LIMIT 1"
    ).get(sessionId, pageUrl || '');

    if (record) {
      d.prepare(`UPDATE visitor_logs SET ${field}=${field}+1 WHERE id=?`).run(record.id);
    }
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/visitors/stats — dashboard stats (auth required)
router.get('/stats', authenticate, (req, res) => {
  try {
    const d = getDb();

    const today = d.prepare("SELECT COUNT(DISTINCT session_id) as c FROM visitor_logs WHERE date(entry_time)=date('now')").get().c;
    const week = d.prepare("SELECT COUNT(DISTINCT session_id) as c FROM visitor_logs WHERE entry_time >= datetime('now', '-7 days')").get().c;
    const total = d.prepare("SELECT COUNT(DISTINCT session_id) as c FROM visitor_logs").get().c;
    const active = d.prepare("SELECT COUNT(DISTINCT session_id) as c FROM visitor_logs WHERE exit_time IS NULL AND entry_time >= datetime('now', '-30 minutes')").get().c;
    const bounceRate = d.prepare("SELECT ROUND(AVG(is_bounce)*100, 1) as rate FROM (SELECT session_id, MAX(is_bounce) as is_bounce FROM visitor_logs GROUP BY session_id)").get().rate || 0;
    const avgDuration = d.prepare("SELECT ROUND(AVG(duration), 0) as avg FROM visitor_logs WHERE duration > 0").get().avg || 0;
    const sessions = d.prepare("SELECT COUNT(*) as c FROM (SELECT session_id FROM visitor_logs GROUP BY session_id HAVING COUNT(*) > 1)").get().c;
    const totalVisits = d.prepare("SELECT COUNT(*) as c FROM visitor_logs").get().c;
    const whatsappClicks = d.prepare("SELECT COALESCE(SUM(click_whatsapp), 0) as c FROM visitor_logs").get().c;
    const emailClicks = d.prepare("SELECT COALESCE(SUM(click_email), 0) as c FROM visitor_logs").get().c;

    // Top pages
    const topPages = d.prepare("SELECT page_url, page_title, COUNT(*) as visits FROM visitor_logs GROUP BY page_url ORDER BY visits DESC LIMIT 10").all();

    // Top referrers
    const topReferrers = d.prepare("SELECT referrer, COUNT(DISTINCT session_id) as visitors FROM visitor_logs WHERE referrer != '' GROUP BY referrer ORDER BY visitors DESC LIMIT 10").all();

    res.json({
      today, week, total, active,
      bounceRate: bounceRate || 0,
      avgDuration: avgDuration || 0,
      returningSessions: sessions,
      totalVisits,
      whatsappClicks,
      emailClicks,
      topPages,
      topReferrers
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/visitors/recent — recent visitors list (auth required)
router.get('/recent', authenticate, (req, res) => {
  try {
    const d = getDb();
    const rows = d.prepare("SELECT * FROM visitor_logs ORDER BY entry_time DESC LIMIT 50").all();
    const result = rows.map(function(r) {
      return {
        id: r.id,
        sessionId: r.session_id,
        pageUrl: r.page_url,
        pageTitle: r.page_title,
        referrer: r.referrer,
        userAgent: r.user_agent,
        ipAddress: r.ip_address,
        country: r.country,
        entryTime: r.entry_time,
        exitTime: r.exit_time,
        duration: r.duration,
        scrollDepth: r.scroll_depth,
        isBounce: r.is_bounce,
        clickWhatsapp: r.click_whatsapp,
        clickEmail: r.click_email,
      };
    });
    res.json(result);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
