# Responsive review, 11 September 2026

## Fixed

The homepage DARE row had a tablet rule assigning every direct anchor to grid column 2. After the logo became a link, that rule moved the logo as well as the final call to action. At widths from 581 to 800 CSS pixels the copy auto-placed into the narrow first column.

Use explicit named grid areas for brand, copy and link. Desktop keeps all three in one row; tablet places the logo beside copy with the link underneath the copy; mobile stacks brand, copy and link. The copy track can shrink and links can wrap.

## Browser review

Comet responsive viewport checks, not a physical Samsung device test:

- Homepage: 360, 580, 740, 820, 1024 and 1440 CSS pixels, plus visual review at 320 and 740.
- All 18 other hub page routes and tool entry points: 360, 740 and 1024, with 1440 also checked on the main tool and supporting pages. Legacy entry routes included.
- Homepage vertical switching at 740: all four DARE descriptions retain correct placement.
- Populated fictional student-event brief, Govern stage: mobile layout visually reviewed at 360.
- Personal site: home, about, work, speaking, Singapore, EDGE, now, contact, privacy, writing and Friday Frame archive. Browser site zoom produced actual CSS widths 400, 822, 1138 and 1600. Additional checks at actual 320 covered home, now, contact and the latest Friday Frame article.
- 117 route/viewport measurements recorded during the pass, plus visual and interaction checks.

No other horizontal page overflow found. Personal-site contact and subscription honeypot fields deliberately sit off-screen and were excluded from visible-layout findings. This checks public page templates and selected interactive states, not every historical article, generated AI response or physical device/browser combination. No personal-site code changes were needed.
