> Published on 11 September 2026 after explicit approval. See docs/PRODUCTION-RELEASE-2026-09-11.md for current status; freeze statements below are historical.

# Before You Send upgrade

11 September 2026. Branch: codex/edge-before-you-send. Not published.

## Implemented

- Approved comparison layout, editable suggested version, optional word highlighting, responsive stacking and collapsible guidance.
- One to four audiences. Complete draft state, including audience edits, is saved only when the user opts in. Seven-day expiry checked on opening, without extending expiry on a simple reload. Clear draft removes current and legacy tool storage.
- More selective analysis prompts and explicit fact-preservation instructions for rewrites. Actual generated output still requires evaluation.
- Recoverable request errors, cancellation, incomplete-stream detection, suggestion retry and bounded request validation.
- Copy and text download use the edited suggestion. Print view includes full text rather than clipping the textarea.
- Accurate processing notice without unverified server-retention guarantees. Account gating remains a future decision.
- Fixed a missing jsPDF import in an existing shared PDF export function encountered during type checking.

## Verification

Production build: passed, 15 pages and one H1 each.
TypeScript check: passed.
Seven regression tests: passed, including both API handlers with a mocked provider, malformed input, size limits, one audience, draft restoration/expiry, rewrite parsing, diff integrity and interrupted streams.
Browser: editable audience and message restored after reload with explicit draft-saving selection.

## Still required before release

No local provider credentials exist in the source checkout. The development server on port 4342 is for interface inspection; Astro dev does not run the Pages API functions. Use a Cloudflare preview with its configured provider secret for live output quality, response recovery and export checks. Do not treat mocked tests as evidence of actual model behaviour.
Provider retention and infrastructure logging still need verification before a stronger privacy claim. Existing localStorage keys are not imported automatically; Clear draft removes the legacy Before You Send key.
No account/email gating or cross-estate framework changes shipped. No tools retired or renamed. The approved homepage remains the separate local design prototype.

## Preview deployment follow-up

Deployed to separate branch edge-before-you-send-review on project power-of-ai-hub-astro.
Preview: https://51941e58.power-of-ai-hub-astro.pages.dev/tools/before-you-send
Production branch confirmed as astro-migration and unchanged.
Preview HTML returns HTTP 200. Fictional API request returns HTTP 503 from the missing OPENAI_API_KEY guard. Downloaded project configuration lists production OPENAI_MODEL but no preview variables. Cloudflare secret values cannot be retrieved from an existing deployment.
Required: configure OPENAI_API_KEY as an encrypted secret in the project's Preview environment and redeploy this preview. Do not paste the key into chat or source control. Real generated-output evaluation remains pending.
Comet rendered a blank surface during this run despite valid HTML; browser rendering requires recheck before presenting the preview as fully verified.

## Live quality checks, 11 September 2026

Preview secret configured by Adrian and API credit added. Both endpoints now return streamed provider results. Latest preview: https://1bf68904.power-of-ai-hub-astro.pages.dev/tools/before-you-send (alias unchanged). Production remains unchanged.

Review now chooses either Clear as written or Worth clarifying, with an explicit materiality threshold. Rewrite returns only the overall message and rationale, preserves clear messages verbatim, and asks the author to resolve conflicting commitments instead of deciding on their behalf. The review outcome is passed explicitly to the rewrite request.

Final live checks: two clear fictional messages were preserved verbatim; an uncertain launch paired with a guarantee was flagged and preserved with an explanation that the author must resolve the contradiction. Earlier prompt variants failed these checks and were superseded. Seven regression tests pass. These samples do not establish reliability across all messages. Browser rendering, mobile and export checks remain outstanding before release.

## Decision Simulation first upgrade

Latest combined preview: https://06c02733.power-of-ai-hub-astro.pages.dev/tools/decision-simulation
Replaced unsupported most-likely forecasts and identity assertions with benefits, trade-offs, assumptions, evidence and reversibility. Added a reversible-test section, aligned PDF section extraction, reused interrupted-stream detection, bounded request bodies and validated field types/lengths. Removed upstream provider error leakage. Updated the shared privacy notice to avoid unsupported retention claims.
Build, TypeScript and nine regression checks pass. One live fictional rollout case returned all six sections, grounded comparisons and explicitly conditional outcomes. Its proposed survey threshold was labelled as a suggestion but remains arbitrary; further evaluation should improve the evidence-gathering step and include multi-option cases. Browser visual/export review and shared draft persistence remain to be upgraded. No production publication.
Next source review: Red Team currently forces 6-10 objections and a decisive verdict, which can manufacture concerns. Conversation/Negotiation reflections force negative findings and emotional interpretations; their roleplay prompts should distinguish rehearsal from predicted real-world behaviour. Assess shared rehearsal design before merging routes.

## Connected journey, first AI preview

Approved interaction design now implemented at /tools/edge-journey. Latest immutable preview: https://8de2d429.power-of-ai-hub-astro.pages.dev/tools/edge-journey. Local review server http://127.0.0.1:4343 serves the built page and forwards only its journey API to the same Cloudflare preview. Server file: /tmp/edge-journey-server.py. No credentials in the local server.

Optional AI suggestions are separate from user text, individually accepted as unverified drafts and undoable. Four-stage handoff retains selected snapshots and provenance. API validates lengths/types, checks observation presence, preserves supplied facts/observations and confirmed carried direction. Progress Review cannot request AI without observations. No automatic browser persistence, account or production release.

Build and TypeScript pass. Thirteen automated checks pass. Four live fictional stage requests completed. Browser verified local page, real suggestions, acceptance provenance and Undo restoring original wording. Native Comet still showed blank for the external preview despite working API. Cloud-hosted rendering is unresolved. Local UI is available for review.

Output-quality limitations: suggestions still sometimes merely paraphrase or ask generic questions; Define can be too conservative to draft missing outcome/scope; Progress Review sometimes conflates delivery effort with response latency. Treat as early AI preview, not release-ready. Broader accessibility, mobile, stale-snapshot, export and interruption interaction checks remain.
Red Team backend groundwork is present in this preview and now has a request-mode/context test; its old frontend and live output remain pending the agreed consolidation plan.

## Connected handoff and quality iteration

Selected context now accumulates across stages with per-item opt-out and preserved snapshot labels. Browser verified that Evaluate context and Define fields both appear in the next handoff. Blank and unconfirmed labels no longer match the confirmed-direction preservation rule. Fourteen tests now exist (new confirmation regression passed; prior thirteen already passed). Build and TypeScript pass.
Latest live samples improved specificity but still introduced an unsupported one-week check and four-session success target. Those are review-blocking quality issues, not accepted product behaviour. Further work should evaluate model capability and structured constraint checking, rather than rely on prompt changes alone. All suggestions remain optional, unverified drafts. Production unchanged.

## Targets and timing confirmation gate

Latest preview: https://a564f68d.power-of-ai-hub-astro.pages.dev/tools/edge-journey. A conservative server-side check flags quantified or scheduled suggestion text unless already supplied verbatim. Client requires an explicit checkbox before Use this draft becomes available. This is a narrow heuristic and can flag legitimate paraphrases; it does not establish factuality or catch every implied commitment.
Fifteen tests pass, including the previously observed four-session and one-week cases, known supplied wording and numbered action-list handling. Build passed. Live retest returned requiresConfirmation=true for an invented four-session target, and false for the unchanged user-confirmed direction. Local review server serves the updated build. UI interaction on the new checkbox remains to be checked; earlier accept/undo paths were verified.
Automatic deployment review initially rejected the destination as unverified. Authenticated deployment listing confirmed the existing preview project/branch; retried with that evidence and approval succeeded. No production changes.

## Unified Conversation Practice preview

New /tools/edge-practice route with Conversation, Negotiation and Board review modes. Isolated deployment 810a4e05. Local review http://127.0.0.1:4344, server /tmp/edge-practice-server.py (API forwarded to the existing preview alias).
Private goal omitted from counterpart request at both client and server; sent only on explicit coaching request. Coaching filters quotations against actual user messages. Scenario locks once dialogue starts; reset keeps preparation; mode change clears with confirmation. Cancel/retry, 12-exchange limit and text export excluding private notes implemented.
Build, TypeScript and 18 tests pass. Live negotiation and board replies/coaching checked using fictional scenario. Local browser conversation completed two exchanges and coaching, with accurate quotes. Replies can invent plausible fictional personal reactions; this remains prominently labelled rehearsal and must not be treated as evidence about real individuals. Counteroffers and longer-dialogue memory still need stress testing. Coaching can be generic and occasionally calls a conversation a negotiation. Exports/mobile and the preceding numeric checkbox UI test remain outstanding. No old routes removed and no production deployment.

## Brief to practice handoff

Explicit item selection (unchecked by default) transfers only selected context to the shared practice scenario. Full brief is retained locally in sessionStorage for return, with a two-hour restore window; selected handoff consumed on arrival. No private preparation is transferred. Existing brief restored and consumed on return. Switching practice modes now keeps the shared context and preparation while resetting the dialogue with confirmation if necessary.
Browser verified selection of only one example field, counterpart scenario containing only that field, and return restoring the complete brief. Build passed. A four-exchange live fictional negotiation kept £900 as a proposal, not approval, and coaching quoted the user's explicit distinction. Live export test remains outstanding because the previous practice tab was closed; numeric confirmation checkbox UI and mobile review also remain outstanding.
Review both tools at http://127.0.0.1:4344/tools/edge-journey and /tools/edge-practice using the same local origin. No production publication.

## Challenge mode and phone-width check

Evaluate now offers Compare options and Challenge my plan with the same editable brief and handoffs. Current preview 273655e5. Live bounded internal-trial test acknowledged existing controls and asked about usefulness/effort measurement without forcing objections. Build and TypeScript passed. Twenty regression tests now include the practice send/coaching/export handler flow: private-note sentinel excluded from counterpart payload and downloaded text, present only in explicitly requested coaching.
390px iframe viewport inspection of journey and practice confirmed readable headings, wrapped mode controls and the working journey navigation. This is responsive viewport inspection, not a full physical-device/accessibility audit. Numeric-confirmation checkbox browser interaction remains outstanding.
Work paused at this checkpoint to handle a separate incoming Friday Frame editorial-review request. No production release.

## Acceptance and accessibility follow-up

Preview updated to 9b82e68c, 11 September 2026. Local build serves the same updated files. Fixed empty-field acceptance incorrectly triggering overwrite confirmation, and prevented checkbox toggling from reapplying a suggestion and losing the original undo state. Added distinct field-specific accessible names to wording and timing confirmations, labelled both handoff dialogs, and announced apply/undo status.

Twenty-one automated checks, TypeScript, build and diff checks passed. New handler regression exercises the gate, initial empty-field acceptance, attempted repeated application, and restoration of the original empty field. Live browser review against the preceding build verified an actual generated three-session/month schedule stayed disabled until its checkbox was checked, then applied as unverified text, with Undo restoring the exact original. The small follow-up fixes are covered by the handler regression; this is not a complete accessibility audit.

Next: reassess and group specialist Brand/Content and AI learning applications, preserving useful standalone entry points. Prompt Engineer still needs an actual capability comparison with PromptAndGo. Wider release checks, homepage integration and production migration remain pending. No production publication.

## Specialist content workflow, outcome-first revision

Content Sprint now asks for intended audience outcome, supporting evidence and one, three, five or seven distinct ideas across the planning window. API validates new input bounds and asks for selected publication days rather than a daily quota. Draft prompts prohibit invented case studies/metrics and universal posting-time claims. Brand Profile prompts replace fabricated named personas with evidence-based audience groups and labelled hypotheses. These are prompt changes, not proof of reliable generation.

Results include a short Evaluate/Define/Govern/Elevate checklist connecting selective publication to observed audience response and the working brief. No automatic handoff is claimed. Corrected both content privacy notices to describe provider processing and existing automatic browser storage. Storage redesign remains pending.

TypeScript, 23 automated checks and the 17-page build pass. Browser verified standalone entry, outcome/evidence inputs, idea selector and planning window. Local page: http://127.0.0.1:4344/tools/content-sprint-generator.html. This is still the old visual shell; specialist workspace redesign and actual generated-output evaluation remain pending. Latest changes are local only, not redeployed. Latest cloud preview remains 9b82e68c.

## Brand and Content workspace prototype

New /tools/brand-content preview introduces a user-authored brief across Audience/Evaluate, Message/Define, Publication/Govern and Learning/Elevate. Twelve optional prompts, in-page jump navigation, progress count explicitly not a score, copy/download, and an unsaved-edits navigation warning. Specialist tool links remain optional direct entry points. No AI calls or automatic context transfer in this first workspace version; warnings explain that notes must be copied/downloaded before leaving. Automatic selected-context handoff and persistence remain to be implemented before calling the workspace fully connected.

18-page build passed. Browser inspected all labels/controls and desktop spacing. Local review: http://127.0.0.1:4344/tools/brand-content. Local server restarted in session 98300 and now resolves all built extensionless page routes. API proxy still supports only journey and practice, so specialist AI calls must be evaluated on an updated Cloudflare preview. Latest workspace changes local only. No production publication.

## Selected content context and specialist review

Brand workspace now offers an unchecked-by-default selection dialog for planner context. Recipient validates fields, age (two hours), total size and combined evidence size, then asks whether to use selected context or keep existing planning context. No AI request from transfer. Complete workspace snapshot retained separately in same-tab session storage for return and consumed on restore. Browser verified one selected audience note populated the planner, unselected evidence stayed out, and both restored on return. Progress count now updates on restoration.

25 automated checks and TypeScript passed; final build passed with 18 pages. Duplicate inline content privacy claim finally removed using its actual multiline source. Ethics simulation prompt and introductory copy now distinguish fictional outcomes and discussion drafts from evidence or approved policies. Old reflection headings retained for parser compatibility. Full frontend/export alignment and live output checks still outstanding. Maturity questionnaire requires a coordinated screen/PDF redesign around evidence and next actions, not self-rated percentage conclusions.

Latest changes local only. Automatic approval review rejected upload to the established Cloudflare preview twice. Second attempt followed authenticated deployment verification of exact project power-of-ai-hub-astro, branch edge-before-you-send-review, latest deployment 9b82e68c, and filename inspection of dist (no env/key/secret files). Reviewer still requires explicit user approval for updated artifact payload and external destination. Do not work around the rejection. Cloud preview remains 9b82e68c. Live content/ethics output evaluation paused until approval; local development can continue.

## Approved preview upload and live specialist iteration

Adrian explicitly approved upload. Deployed 5a219e4c, then fixes to 4269d2cf on the same edge-before-you-send-review branch. Production unchanged. Approval block resolved. urllib received 403, while curl reached the same API and returned expected validation and generation responses.

Initial fictional tests exposed seven ideas returned for a one-idea request and an unsupported contradiction in ethics reflection. Content now specifies exact day headings and buffers the provider stream to validate completion and unique idea count before returning it. Incorrect counts return a retryable error rather than displaying a successful calendar. This changes perceived streaming: content appears after validation. Ethics now requires actual conflicting statements before claiming contradiction, preserves the parser's Experimentation policy heading and uses proposed situations/open questions/accountable people instead of declaring allowed and prohibited activity.

26 automated checks and TypeScript pass. Final live samples: one and three ideas returned as requested, complete streams, posting time framed as a test. Ethics states no contradiction established, and policy section correctly identified as discussion draft. Evidence: tests/specialist-live-initial-2026-09-11.json and tests/specialist-live-samples-2026-09-11.json.

Remaining quality limitations: content-one still assumes preparation to launch when the brief only says exploring workshops. Content-three assumes a week of discussions before they occurred. Tone remains generic and some Notes suggest execution tips instead of observable outcomes. Do not call factual grounding solved or these outputs ready to publish. Further review/edit gates or more structured generation needed. Ethics output is improved on this small sample, not proven generally. Full specialist interface/export alignment and readiness assessment redesign remain pending.

## Editable content and focused claim-review prompts

Preview 860d8310 now includes per-post editing in Day view, saves the corrected canonical sprint text and uses it across copy/export/views. Editor prevents insertion of parser control headings and bounds text. Review prompts flag selected launch and retrospective phrases and some numeric claims; they are narrow heuristics, not fact verification. Outcome/evidence context visible beside results, with explicit unavailable wording after reload when that context was not persisted.

Browser completed a real one-idea generation through local proxy to the approved preview, edited the post to preserve exploratory status, and verified corrected wording in Platform view. Two regression tests cover targeted replacement without modifying other days/channels or interpreting literal replacement symbols, plus the unsupported launch and retrospective patterns observed in live samples. 28 tests, TypeScript and build passed. Actual downloaded artifact inspection not repeated; exports read the same canonical state. Local proxy session 95075 now supports content planner in addition to journey and practice.

Remaining: output review cannot catch all unsupported claims; current content backend validation and stored-draft behaviour need hardening. Numeric phrase matching is narrow and requires broader cases. Specialist layout and ethics export wording remain partially legacy. Next major change is evidence-led readiness review replacing self-reported maturity scores, with matching report. No production publication.

## Evidence-led AI Readiness Review

Existing /tools/maturity-assessment route now renders ReadinessReview instead of the old scoring component. Six areas cover purpose/affected people, usefulness/limits, ownership, information/permissions, human review/pause, and results/learning. Users define scope and record status, supporting evidence or exclusion reason, and next action/owner/review. No score, readiness verdict or approval. Evidence selection without notes becomes Evidence still to record; not-applicable without reason becomes Scope reason still to record.

Screen summary, text download and print/save-as-PDF use the same generated report text. Notes remain page-local, no provider requests or automatic storage. Old component remains unused in source for reference; its scoring PDF is no longer reachable through this route. Tools catalogue and introductory copy aligned; route retained to avoid broken links. No automatic handoff to Action Plan yet.

30 regression tests, TypeScript and 18-page build passed. Browser verified missing-evidence status, exact scope and action preservation, visible unanswered areas. PDF print layout still needs visual inspection, and download file operation not yet browser-verified. Responsive/visual design remains the legacy shell, to align with the redesigned estate in the consolidation pass.

Deployed to authorized review branch, latest c1f95aa6. Production unchanged. Local route available on port 4344. Next: shared design/navigation consolidation, specialist reflection/export alignment, print inspection and outstanding quality checks.

## Toolkit entrance and shared navigation

/tools rebuilt around six user tasks, connected pillar links and focused specialist entry points. Uses existing BaseLayout to preserve metadata, favicon and analytics integration. Shared ToolNavigation now appears on newer raw preview pages and older tool routes. Legacy tool routes use a scoped lighter palette and typography; no production root redesign included. Fragment links enter the appropriate journey stage; browser verified Govern opens Action Plan with heading focus.

30 tests, TypeScript and 18-page build pass. Parsed toolkit links all resolve to built pages, internal links stay same tab, external links use new tabs. Browser desktop and 390px iframe viewport checks verified readable layout and wrapping (not a physical device/accessibility audit). Mobile check revealed pale legacy EDGE marks on light backgrounds, now given navy backing in source and local build.

Preview cce104a9 contains hub/navigation and palette. The last one-rule logo backing fix is local only pending the next preview deployment. No production publication. Standalone new pages still need final analytics/metadata alignment, full accessibility checks, print inspection, remaining context handoffs and PromptAndGo comparison before consolidated review and release.

## Consolidated handoffs, overlaps and release review

11 September 2026. Added explicit readiness-to-journey reference transfer and brand-workspace-to-profile selection, recipient review and return. Browser verified selected-only context in both recipients, readiness full-note restoration, and audience mapping in profile. Consolidated old decision/challenge and rehearsal routes with temporary intent-preserving redirects. Replaced fixed model-specific prompt wrappers with a local Prompt Brief Builder and a separate PromptAndGo link. Corrected ethics export claims and CSV quoting/formula handling. Added two export regressions, bringing the suite to 32 passing checks.

Added shared skip navigation, form border contrast, mobile two-column stages, larger controls, reduced-motion support, preview noindex headers, standalone canonical/icon/analytics alignment and a preview-only deploy shortcut. Static inspection of 15 tool pages passed H1/canonical/alt/link rules. Keyboard skip and arrow movement passed; actual 390px viewport had no horizontal overflow. Public HTTP checks found and prompted a real 404 fix. Production HTML is unchanged apart from Cloudflare per-request security parameters; production deployment ed7e4b51 remains the earlier astro-migration release.

Full report: docs/EDGE-REVIEW-AND-RELEASE.md. It explicitly holds production release for actual PDF/download verification, complete accessibility coverage, public API abuse/cost configuration verification, wider live content quality cases, approved homepage integration, production metadata/measurement and final legacy/storage retirement decisions. In-app browser download observation timed out and Comet rendered the local page blank. Do not call PDF pagination verified. Production unchanged.


## Release gates pass, 11 September 2026

Current review: https://ede3993b.power-of-ai-hub-astro.pages.dev

Approved estate homepage integrated. Direct readiness PDF formatter verified with short and long fixtures. 35 tests, TypeScript, build, mobile and enlarged-text accessibility checks pass. Fixed contrast and ARIA findings. Added D1 atomic quotas and retired old API routes. Live controls returned the expected 410, 405, 403, 413 and 429 responses. Draft persistence is opt-in and expires after seven days. Live content, reflection and ethics samples informed additional evidence and proportionality safeguards.

Production deployment remains ed7e4b51 on astro-migration. No production Git push or deployment. Production GTM event activation and its end-to-end receipt check remain for release. Prepared merge import is docs/gtm-edge-events-import.json; it has not been imported or published. Production also needs its own usage binding rather than the review counter. See docs/EDGE-REVIEW-AND-RELEASE.md for exact scope and limitations.


## Launch preparation completed, pending Adrian's final testing

Separate production D1 database edge-production-usage created, schema applied and zero reservations verified. Explicit production and preview overrides prepared and checked with Wrangler types. Existing production non-secret variables preserved after reading current configuration; OPENAI_API_KEY presence verified without reading its value. Production deployment remains ed7e4b51.

GTM workspace EDGE launch review - September 2026 (workspace 5) created. Import accepted and saved: four additions, no modifications or deletions. Event tag destination, parameters and inherited Google tag verified in the GTM UI. Draft Preview opened without a configuration error, but the local Tag Assistant connection timed out. End-to-end delivery remains a launch-session check. No GTM publication.

Final testing guide: docs/FINAL-TESTING.md. Subsequent estate alignment queue: docs/ESTATE-ALIGNMENT.md. Public site and downloadable documents remain unchanged. Deployment guard now rejects accidentally included local QA pages and shared production/review counter IDs.
