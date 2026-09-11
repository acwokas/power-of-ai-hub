# Website operations

Verified 11 September 2026. These links open private dashboards requiring your own login. This file is a handover, not a live monitoring screen.

## What visitors do

[Open democratising.ai realtime analytics](https://analytics.google.com/analytics/web/#/a131493043p542391821/realtime/overview)

Live GA4 receipt confirmed for `edge_ai_requested`, `edge_ai_response_received`, `edge_ai_response_complete` and `edge_brief_export`. The fictional student-event example generated a successful response. Event-scoped custom dimensions **EDGE tool** (`edge_tool`) and **EDGE response status** (`edge_status`) are configured. Standard reports need processing time before new dimensions appear.

Compare requests, completed responses, exports, copies and handoffs to understand usefulness. Completion means the response stream finished, not that a person accepted the advice. Browser blockers and consent choices mean analytics will not count every visitor. Comet's blocker was confirmed to replace the Google Tag Manager script during initial testing; a temporary domain exception enabled the successful check.

## Signups and messages

- [Private newsletter signup list](https://supabase.com/dashboard/project/ukacqljogssreycumocn/editor/56028): inspect email, creation time and source. The operational test row was verified and then deleted.
- [Email delivery log](https://resend.com/emails): filter by recipient or subject and check delivered, bounced or failed status. Today's contact notification, automatic reply and newsletter alert all show **delivered**, and were found in the personal inbox.
- [hello@democratising.ai forwarding activity](https://dash.cloudflare.com/563873389ed614cc1be6d64dd1d5e30e/email-service/routing/e83ebf7d964de3acbf073a646bd92d17/activity-log): Cloudflare records the test as **Forwarded** at 16:35 SGT. The active rule forwards hello@democratising.ai to me@adrianwatkins.com. SPF, DKIM, DMARC and ARC passed. Gmail did not create a separate inbox copy of the self-sent routing test; Cloudflare provides the forwarding evidence.

## AI service health

[Open Cloudflare D1](https://dash.cloudflare.com/563873389ed614cc1be6d64dd1d5e30e/workers/d1), select **edge-production-usage**, then use its console with the read-only query in `OPERATIONS.sql`.

The private daily totals show accepted requests, usage-limit hits, service failures and rejected requests by tool. They retain 30 days of aggregate counts without user inputs, outputs, IP addresses or visitor identifiers. Retention cleanup runs when requests arrive. Two successful live working-brief requests and one deliberate unsupported-method check were verified in these totals.

A 200 response confirms request acceptance. A stream can still fail after that response starts, so use GA4's completion/failure events alongside the server totals. A 429 is a usage limit, not automatically a service incident. Investigate repeated 5xx results using the Pages deployment logs. This is on-demand visibility; it does not add an automatic incident-alert service.

## Search visibility

| Site | Google | Bing |
| --- | --- | --- |
| adrianwatkins.com | Sitemap index successful, 39 discovered pages | Sitemap index successful, no errors or warnings |
| democratising.ai | Domain ownership verified; sitemap index successfully read on 11 September | Site verified; sitemap submitted on 11 September and processing, no errors or warnings |

- [Google: adrianwatkins.com](https://search.google.com/search-console/sitemaps?resource_id=sc-domain%3Aadrianwatkins.com)
- [Google: democratising.ai](https://search.google.com/search-console/sitemaps?resource_id=sc-domain%3Ademocratising.ai)
- [Bing: adrianwatkins.com](https://www.bing.com/webmasters/sitemaps?siteUrl=https://www.adrianwatkins.com/)
- [Bing: democratising.ai](https://www.bing.com/webmasters/sitemaps?siteUrl=https://democratising.ai/)

Submission and discovery do not guarantee indexing or rankings. Bing is still processing the new democratising.ai submission.

## Release evidence

Operational code release: `cb1f924`, deployed at `298f011c.power-of-ai-hub-astro.pages.dev` and published on democratising.ai. Source pushed to the existing `acwokas/power-of-ai-hub` repository on `astro-migration`. All 36 targeted automated tests passed; production and preview diagnostics migrations were applied. This documentation update does not require another site deployment.

Human review can now focus on clarity, usefulness, tool outputs and the experience across devices. Adrian confirmed removal of the temporary Comet exception and restoration of his original browser protection settings after the analytics test.
