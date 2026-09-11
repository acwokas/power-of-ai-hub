-- Run in the private Cloudflare D1 console for edge-production-usage.
-- These counts contain no entered text or user identifiers.
SELECT date(day, 'unixepoch') AS utc_day, tool,
 SUM(CASE WHEN status BETWEEN 200 AND 299 THEN requests ELSE 0 END) AS accepted,
 SUM(CASE WHEN status=429 THEN requests ELSE 0 END) AS usage_limit_hits,
 SUM(CASE WHEN status>=500 THEN requests ELSE 0 END) AS service_failures,
 SUM(CASE WHEN status BETWEEN 400 AND 499 AND status<>429 THEN requests ELSE 0 END) AS rejected
FROM daily_outcomes GROUP BY day,tool ORDER BY day DESC,tool;
