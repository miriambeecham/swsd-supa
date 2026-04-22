// Auth check for /api/send-* and /api/cleanup-* cron handlers.
// Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. Manual triggers
// (curl, dashboards) can use `x-vercel-protection-bypass`.
export function requireCronAuth(req, res) {
  const expectedAuth = `Bearer ${process.env.CRON_SECRET || ''}`;
  const expectedBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const bypassToken = req.headers['x-vercel-protection-bypass'] || req.query?.['x-vercel-protection-bypass'];

  const ok = (process.env.CRON_SECRET && req.headers.authorization === expectedAuth) ||
             (expectedBypass && bypassToken === expectedBypass);
  if (!ok) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
