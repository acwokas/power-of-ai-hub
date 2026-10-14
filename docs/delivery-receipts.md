# Delivery receipt release contract

Current implementation and existing-owner integration are prepared offline and disabled. Deploying source alone does not enable receipts or establish live delivery.

Receipts contain random identifiers, hashed single-use tokens, a fixed tool name, an exact reviewed release identity, minute timestamps and a terminal disposition. Browser acknowledgements carry only the identifier and token. They never contain prompts, model output, IP addresses or account identity. A successful acknowledgement means the client accepted a complete response into the existing result flow. It does not establish human readership or factual correctness.

Before enabling:

1. Independently review the complete code and migration. Run the ordinary tests and build.
2. Apply `migrations/0003_terminal_delivery_receipts.sql` once to the production D1 binding and verify its exact schema, trigger and index.
3. Release the prepared `node scripts/cleanup-delivery-receipts.mjs` step in the existing private `hub-figures` owner, after dependency installation and before build. It must also run on future ordinary executions if a later build fails. Do not add another scheduler.
4. Enable the private owner variable `DARE_HUB_DELIVERY_RECEIPTS=enabled` only after migration and cleanup ownership are verified. The owner runs `prepare-delivery-config.mjs` with its exact Hub checkout SHA, setting production `EDGE_RECEIPT_RELEASE` and `EDGE_DELIVERY_RECEIPTS=enabled`. The script validates the production database identity and explicitly disables preview/default collection. A commit identity is not itself independent review evidence. The existing ordinary owner deploys the code; no manual producer run is implied.
5. Independently verify deployed identity and configuration, then accept genuine terminal and client-acknowledged observations at their exact scopes.

Tokens become unusable after 15 minutes. Acknowledgement atomically consumes the token and increments the daily aggregate. Request-triggered cleanup removes expired receipts. The existing daily owner provides cleanup without traffic, subject to provider availability. Physical deletion is verified through that owner; a missed owner run is an explicit retention incident, never proof that cleanup happened. Daily aggregates are retained for 30 days. No stronger unconditional physical-deletion guarantee is claimed.

Database or acknowledgement failure preserves the existing user result and leaves delivery unknown. There are no acknowledgement retries. Truncation, malformed streams, provider errors and cancellation do not become complete. JSON routes already validate provider stop and their output schemas before returning success.

Remaining live acceptance and actual producer recovery require genuine evidence or a separately authorized controlled qualification. Offline fixtures and successful HTTP responses alone do not close them.
