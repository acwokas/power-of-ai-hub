# EDGE analytics activation

Imported and staged for release, not published.

The public GTM-KV37H5CZ container inspected on 11 September contains Google tag G-G1SF1BVH86 but no EDGE event tag. The site queues metadata-only custom events. Preview hosts never load the production container.

Imported gtm-edge-events-import.json using Merge into the separate workspace EDGE launch review - September 2026: https://tagmanager.google.com/#/container/accounts/6361848611/containers/256008917/workspaces/5. GTM confirmed zero modifications, four additions and zero deletions. The tag editor confirms destination G-G1SF1BVH86, event name {{Event}}, parameters edge_tool and edge_status, and the EDGE custom-event trigger. The existing Google tag is retained and supplies its configuration. Preview launched without a configuration error. Nothing has been submitted or published.

Check request, response received, response complete, failure, cancellation and export events in GA4 DebugView. Response complete means the transport finished, not that generated content is factually correct or accepted. No brief text, output, transcript, URLs containing notes or email addresses are event parameters. Set up the edge_tool and edge_status event-scoped custom dimensions if needed for reporting.

Acceptance: one request event per AI request, one complete event after a consumed successful response, failure for a rejected request, and no input text in the payload. Do not count every export click as a confirmed downloaded file. These are interaction events.


## Local debugger limitation

Tag Assistant opened the draft preview but timed out connecting to the local QA page in Comet and reported no debuggable tags. No successful event delivery is claimed from that attempt. The local-only fixture was removed from build output. Repeat the end-to-end check in the approved launch session, confirm the tag fires and verify receipt in GA4. The workspace remains unpublished.
