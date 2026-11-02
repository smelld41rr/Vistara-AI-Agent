# Browser tools

M1 has one internal read-only operation: PAGE_READ → READ_PAGE.
Input Zod schema: ReadPageMessageSchema (type and bounded optional character budget).
Output: PageSnapshotSchema (URL/title/visible text/headings/links/form metadata/selection/truncation/warnings).
Timeout: the background waits at most 10 seconds for a reader reply after injection; tab lookup and script injection precede that timer. The synchronous reader has finite traversal/output limits, but no cancellation signal. Permissions: activeTab plus packaged scripting injection, acquired via toolbar interaction. No data sent to a provider during preview.
Tests: tests/unit/reader.test.ts and compiled reader fixture-browser tests. See TEST_REPORT for executed category/count.
Known limits: top-level document/open shadow roots; no protected viewer, iframe (same-origin or cross-origin), closed shadow or canvas support; form values never read.
No model-exposed browser action tools implemented in this stage. Entire action tool registry from the master specification remains PENDING until M1 native gate is reviewed.

The reader entrypoint is an unlisted packaged `reader.js`, injected on demand. It is not registered as an automatic content script and contributes no broad host permissions. The listener accepts only same-extension READ_PAGE messages and installs once per page.

Temporary site access is governed by Chrome activeTab, not a persistent website grant manager. No website-grant/revoke UI is implemented in M1. The only optional host grants are the selected AI provider origins.
