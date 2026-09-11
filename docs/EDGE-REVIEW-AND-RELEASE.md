> Published on 11 September 2026 after explicit approval. See docs/PRODUCTION-RELEASE-2026-09-11.md for current status; freeze statements below are historical.

# EDGE review and release report

11 September 2026. Review environment only.

## Decision

Engineering fixes are ready for Adrian's consolidated product review. Live analytics activation and production smoke checks remain for the approved release. The preview is deliberately excluded from indexing, and the production branch has not been deployed by this work.

The main improvement is a connected working brief, not a larger collection of AI generators. Users can work without AI, carry selected context between stages, rehearse a conversation and review actual learning. Readiness records evidence and next actions instead of assigning a confidence-inspiring score.

## Completed in this pass

| Area | Result |
|---|---|
| Readiness to Action Plan | Users select areas explicitly, review the transferred notes, and choose whether to use them as a reference. Existing decision fields are not replaced. Full readiness notes are retained separately for a two-hour return. No generation occurs during transfer. |
| Brand workspace to profile | Selected context appears for review before it populates a new brand form. Existing context can be retained instead. The full workspace can be restored on return. The recipient explains its automatic browser saving. |
| Earlier handoffs | Brand to Content Planner and working brief to Practice remain available. Private practice preparation remains excluded from counterpart requests and the dialogue export. |
| Decision and challenge overlap | Old Decision Simulation and Red Team entry routes temporarily redirect to the working brief, preserving challenge mode where relevant. |
| Rehearsal overlap | Conversation, Negotiation and Governance Review entry routes temporarily redirect to Practice with the corresponding mode. This is rehearsal, not a governance assessment. |
| Prompt overlap | Removed generic model-specific wrappers and unsupported platform superiority claims. The local Prompt Brief Builder now helps specify task, evidence, output and boundaries without network processing. PromptAndGo remains the separate library and optimiser destination. No notes transfer there. |
| Reports | CSV quoting now covers every field and neutralises spreadsheet formula prefixes. Edited content remains the canonical export source. Ethics exports explicitly label simulated outcomes and policy material as discussion drafts. Readiness screen/text/print share the same report content. |
| Accessibility | Shared skip link, keyboard focus, stronger field boundaries, larger controls, scrollable dialogs, reduced-motion support and narrower-screen stage layout. Added a label to the profile company-size control. |
| Release hygiene | Preview-only deploy shortcut, noindex response headers across the preview, production-only analytics loading, canonical/icon metadata on new standalone pages, consolidated sitemap and a real missing-page document. |

## Verification

- Earlier pass: 32 automated checks passed, including request validation, source preservation, suggestion acceptance and undo, private practice payload/export exclusion, content replacement, handoff parsing, readiness status, CSV handling and numerical-review prompts.
- Earlier pass: TypeScript and the 18-page production build passed. These are build checks, not permission to release.
- Static inspection of all 15 tool pages found one H1 and one canonical each, no missing image alt attributes, no unresolved internal link destinations, no internal links opening new tabs, and no external links opening in the same tab.
- Readiness browser test selected only Purpose, confirmed the unselected research note and scope did not appear in incoming context, accepted the reference, then returned and verified all original notes were restored.
- Brand browser test selected only Audience, verified the recipient showed only that note, accepted it and verified the audience input on step two.
- Keyboard Tab/Enter activated the skip link and focused the main area. ArrowRight selected and focused the next EDGE stage.
- At a 390px viewport, the connected brief's document width and scroll width both measured 390px. All its current form controls had labels. Visible focus and a two-column stage selector were inspected. This does not substitute for testing every tool on physical devices.
- Contrast checks against the light background: body text 13.12:1; secondary text 4.97:1; large secondary headline 4.47:1; field borders 3.27:1; focus colour 4.96:1. Orange is retained as a decorative motif, not required small text.
- Preview route checks confirmed temporary redirects and noindex headers. The initial check found a soft 404; a 404 document was added and the final HTTP result is recorded separately.
- Production content matched before and after when Cloudflare's changing request identifiers were excluded. The production deployment remained ed7e4b51 on astro-migration. No production deployment command or production Git push was performed.

## Release gate resolution

| Gate | Status and evidence |
|---|---|
| Files and reports | Implemented a direct readiness PDF download with embedded font, page numbers and bounded pagination. The actual application formatter produced a two-page short report and five-page long report. Every paragraph and tested accented character survived extraction; all pages were visually inspected. CSV checks pass. The browser download hand-off could not be observed through the automation provider, so this is file-generation verification, not a claim that every browser's download UI was tested. |
| Accessibility | Fixed the two homepage contrast failures, the selected-stage label contrast, and labelled groups without explicit roles. axe-core 4.13.0 checked 12 routes at desktop and mobile sizes. No automatic violations remain in the checked states. At 390px, all 12 documents had 390px scroll width. A separate doubled-font stress test at 1280px also passed without horizontal overflow. Existing keyboard and context-handoff checks remain valid. This is a bounded accessibility gate, not WCAG certification, full VoiceOver coverage or a physical-device test matrix. |
| Public AI controls | Active review D1 counters enforce an atomic 100-request UTC-day ceiling, 20 requests per rolling hour and four per minute per rotating client identifier. Fixed model and maximum output tokens bound provider usage. Tested concurrent SQL reservations and live 429 rejection. Oversized bodies return 413, cross-origin requests 403, unsupported methods 405 and retired endpoints 410. Missing counters fail closed. Counts contain no brief text or raw IP addresses. |
| Generated content quality | Retested prospective content and requested item counts. Fixed the progress-review case that invented a missing expectation, preserving observations and explicitly recording the absent baseline. Added a useful fallback for an empty learning suggestion. Tightened ethics guidance to keep small trials proportionate. Retested both corrected cases. These samples support release review, not a guarantee that arbitrary AI output is correct; suggestions remain unverified and editable. |
| Estate integration | The approved homepage now opens at the review root, with the approved brand assets, vertical explorer, DARE explanation and toolkit navigation. Corrected the main landmark and internal-link behaviour. |
| Metadata and measurement | Removed preview wording from page metadata, added social metadata and production canonicals, and kept noindex enforced on review hosts. Added request, response, completion, failure, cancellation, export, copy, edit and suggestion interaction events without entered text. Unit checks verify payload separation. **Live analytics activation remains open:** the published GTM container currently has only its Google tag. The merge import is now saved in the separate unpublished EDGE launch review - September 2026 workspace. GTM confirms four additions, zero deletions and zero modifications. Tag destination and parameters were checked in the editor. No production container version was published. |
| Legacy and storage | Old entry URLs retain temporary compatibility redirects to the consolidated tools. Old AI endpoints now return 410. Their source files stay available for rollback. Specialist drafts use tab storage by default; optional remembered drafts expire after seven days. Old unversioned drafts are ignored. Updated the visible storage and provider-processing explanations. |

## Evidence from the final gate pass

- 35 automated tests passed. TypeScript, the 19-route build and the generated-page H1 check passed.
- See accessibility-checks.json, usage-limit-checks.json, pdf-checks.json and release-http-checks.json for the scoped checks.
- Fictional AI samples and the corrected reflection are recorded in tests/release-live-samples-2026-09-11.json and tests/release-ethics-retest.json.
- The usage ceiling covers this site's AI endpoints only. It is not an OpenAI account-wide currency budget or a hosting-cost cap.
- Analytics response completion means transport completion. Export/copy events describe requested actions, not proof that a file was saved or content was adopted.
- Production usage database edge-production-usage has been created and migrated, with zero reservations. Explicit preview and production bindings in wrangler.jsonc use distinct IDs. Production secret names were checked without reading values, including OPENAI_API_KEY; existing non-secret production variables are preserved. Configuration generation passed. No live deployment was performed.
- Production deployment was checked again and remains ed7e4b51 on astro-migration. The production analytics container was inspected read-only.

## Remaining launch actions

1. Review the finished product and authorise production publication.
2. Deploy the prepared production binding with the approved release. The separate empty database and table already exist.
3. Publish the staged GTM workspace with the approved release, then confirm event delivery. The import and tag configuration are verified; local Tag Assistant transport verification remains limited by the connection issue recorded in ANALYTICS-ACTIVATION.md.
4. Perform a short production smoke test after release, including an actual PDF download, AI rejection behaviour and analytics receipt.

The previous seven engineering gaps have been addressed in the preview. The analytics activation and production-only smoke checks are deliberately not marked complete while production remains unchanged.

## Overlap decisions

Retain Before You Send for exact message review, Practice for rehearsal, Readiness for AI-specific evidence review, and Ethics for fictional reflection. These do different jobs. Keep palette exploration as focused visual support; do not force every specialist to import an entire business brief. Tool-to-tool transfer should always have a clear purpose and remain selective.

The PromptAndGo public homepage was checked on 11 September: https://www.promptandgo.ai/. It presents a library, regional/language pathways and an optimiser. The optimiser page itself could not be retrieved by the web tool, so this is not a claim that its logged-in workflow or generation quality was tested. The local old Prompt Engineer source was inspected and consisted of fixed text wrappers, including outdated image-model parameters. A private, model-neutral brief builder is a materially different and more honest role.

## Rollback and next release

Use the existing review branch edge-before-you-send-review only. The pre-gate preview was 2b9cde5c. The current preview URL and final HTTP evidence are recorded in release-http-checks.json. The deploy shortcut now uses the review branch. Do not merge or deploy to astro-migration until publication is approved and the launch actions above are ready.
