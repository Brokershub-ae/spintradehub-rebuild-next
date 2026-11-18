# Promotion request email notifications

This Firebase function watches new `promotionRequests` documents and emails their
details to **info@spintradehub.com**, with the applicant's email as Reply-To.
It runs independently of the browser and does not publish or delete requests.

On the homepage and contact page, the promotion request form is collapsed by
default. Click the promotion heading (or use Enter/Space when focused) to open or
close it. Closing preserves entered details; account checks, validation and
submission work as before.

## Configure and deploy

1. Enable the Firebase **Blaze** billing plan. Confirm the intended Firebase project
   ID in Firebase Console; use it explicitly in every command below.
2. For the Google Workspace mailbox that will send notifications, enable 2-Step
   Verification and generate a Google **app password**. A normal account password
   does not work. Workspace administrators may disable app passwords; if unavailable,
   configure an approved SMTP relay or OAuth-based sending instead of weakening
   account security. The current function uses `smtp.gmail.com`, port 465, TLS.
3. Install the Firebase CLI if necessary and authenticate:

   ```powershell
   npm install -g firebase-tools
   firebase login
   npm --prefix functions ci
   ```

4. Set secrets interactively. Do not put passwords in source, chat, command arguments,
   or `NEXT_PUBLIC_*` variables:

   ```powershell
   firebase functions:secrets:set PROMOTION_SMTP_USER --project YOUR_PROJECT_ID
   firebase functions:secrets:set PROMOTION_SMTP_PASSWORD --project YOUR_PROJECT_ID
   ```

   Enter the sending mailbox address for `PROMOTION_SMTP_USER` and its app password
   for `PROMOTION_SMTP_PASSWORD`. The recipient is always `info@spintradehub.com`.

5. Deploy only this function; this does not deploy or replace Firestore rules:

   ```powershell
   firebase deploy --only functions:promotion-notifications --project YOUR_PROJECT_ID
   ```

6. Submit a new promotion request through the website, confirm its reference in
   Firestore, verify `emailNotification.status` becomes `SENT`, and check the inbox
   and spam folder for the notification. `SENT` means the SMTP server accepted it,
   not proof of inbox delivery. Confirm delivery before considering setup complete.

## Permissions and operations

- Existing Firestore rules must allow authenticated users to create their own
  pending requests. They must **not** allow applicants to set or change
  `emailNotification` or edit another user's requests. The function uses Admin SDK
  privileges to update notification metadata. Review deployed rules separately.
- There is no admin dashboard or automatic listing approval in this setup. Review
  saved requests in Firebase Console under `promotionRequests`.
- SMTP errors are logged and rethrown so Firebase retries the event. The original
  request remains saved. Monitor function errors and billing. Invalid form data is
  marked `INVALID` and logged rather than retried indefinitely.
- Successful notifications record recipient, SMTP message ID, and send time.
  Already-marked `SENT` requests are skipped on retries. Event processing is
  at-least-once: concurrent events or a crash after SMTP acceptance but before
  recording success can cause duplicate emails. SMTP cannot provide an atomic
  transaction with Firestore. Use the request reference to identify duplicates.
- Only documents created **after** the function is deployed trigger notifications.
  Previously submitted requests stay in Firestore and are not emailed retroactively.
- Vercel deployment alone does **not** deploy this Firebase function.

Run the notification tests with `npm --prefix functions test`.

## Public user rating summaries

The homepage reads only `publicUserRatings`. Two independent Firestore triggers
update that collection when `users/{userId}` or `reviews/{reviewId}` changes.
They publish only name, username, region, buyer/supplier role, average rating and
review count; the document ID is the canonical user ID. Emails, phone numbers,
review text and reviewer identities are not copied. Deleted users and users with
other roles are removed. Review reassignment updates both affected users.

Updates are asynchronous and retried on errors. Each transaction locks the
summary and recalculates from current source documents, rather than using event
totals, to handle duplicates, concurrent changes and out-of-order delivery.
Do not manually edit public summaries. Monitor function errors and costs; this
implementation rereads a user's reviews for each change.

### Deploy and initialize

These functions require the Blaze plan but no SMTP secrets. Confirm the project
ID first and use that same ID in every command. Review the root `firestore.rules`
against the deployed rules before publishing.

```powershell
npm --prefix functions ci
npm --prefix functions/ratings ci
npm --prefix functions test
firebase deploy --only functions:public-ratings --project YOUR_PROJECT_ID
```

Backfill existing accounts using an authorized administrator's Application
Default Credentials (Firebase CLI login alone is not sufficient). If using the
Google Cloud CLI, run `gcloud auth application-default login` with an authorized
account. Do not download or commit service-account keys.

```powershell
node functions\backfill-public-ratings.js --project YOUR_PROJECT_ID
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

Run the backfill after deploying the triggers. It is safe to rerun and also removes
summaries for deleted or ineligible accounts. Stop on any backfill failure and
resolve it before proceeding. Then deploy the website through the usual workflow.

The supplied rules preserve the existing authenticated access to other collections,
allow anonymous reads only of the allowlisted public summary collections described below, and block all client writes to
those collections, including signed-in clients. **The existing broad authenticated
writes are not hardened by this change:** signed-in users can still modify source
users/reviews under the original policy. Restricting those writes requires a
separate collection-by-collection permissions migration.

The rating functions use the independent `public-ratings` codebase under
`functions/ratings`, so deployment does not load or require the email function's
SMTP secrets.

Before considering production setup complete, verify in Firebase Rules Playground:

- Signed-out reads of `publicUserRatings/USER_ID` succeed.
- Signed-out reads of `users/USER_ID` and `reviews/REVIEW_ID` fail.
- Both signed-out and signed-in writes to `publicUserRatings/USER_ID` fail.

Open the homepage in a signed-out/incognito browser and confirm it loads ratings.
Confirm an authorized review change updates the summary, and deleting a review
recalculates its total. No deployment or backfill is performed by a Next.js build.

## Public product summaries

The `syncPublicProduct` trigger in the same `public-ratings` codebase watches
`posts/{postId}`. It publishes only product name, brand, model/part number, category, display price,
location, HTTPS image URL and numeric timestamp to `publicProducts/{postId}`.
Author/contact information, descriptions and attachments are not copied.
BUY posts, deleted posts and invalid names/timestamps remove the summary.
Legacy posts without a post type remain eligible as existing product listings.
These display fields are intentionally public; full post details remain behind
the existing authenticated rules.

Transactions read current source data and fully replace summaries, handling
duplicate/out-of-order events and removing stale fields. Failures propagate for
retry. Monitor errors and usage; each source change performs a transaction.

Deploy and initialize **before releasing the new homepage**:

```powershell
npm --prefix functions test
firebase deploy --only functions:public-ratings --project YOUR_PROJECT_ID --force
node functions\backfill-public-products.js --project YOUR_PROJECT_ID
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

Use the same administrator ADC setup described above. The backfill paginates
both collections, processes the union of IDs and stops on error; it can safely be
rerun. `--force` accepts the configured retry policy. If discovery is slow, set
`$env:FUNCTIONS_DISCOVERY_TIMEOUT='120'` before the Firebase command.

Verify signed-out product-summary reads succeed, signed-out full-post reads fail,
and all client writes to public summaries fail. Create/update/delete a SELL post
and change it to BUY to verify synchronization. Then release the frontend.
The homepage reads at most 60 newest summaries, showing six product cards and
six unique brand names from that sample; this is not a complete brand directory.

## Expanded homepage discovery

The same `public-ratings` codebase includes:

- `syncBuyerProfile`, `syncBuyerRatings`: rebuild `publicBuyers/{userId}` on
  profile and public rating writes. Public fields are name, username, region,
  Auth registration timestamp, average rating and review count only. Unknown
  dates are zero and excluded from recently joined cards. Deletion or changing
  away from the buyer role removes the summary. Transactions fully replace
  summaries from current sources, including when events are retried.
  `publicBuyers` permits anonymous reads, denies all client writes and is excluded
  from the legacy catch-all. Full buyer profiles remain authenticated.
- `syncSupplierProfile`, `syncSupplierRatings`, `syncSupplierProducts`: rebuild
  `publicSuppliers/{userId}` on profile, public rating and post changes. Public
  fields are name, username, region, Auth registration timestamp (`joinedAt`),
  canonical non-BUY product count, average rating and review count. No email,
  phone, review text or private profile fields are copied. Missing/deleted/non-supplier
  profiles remove the summary. Unknown Auth dates are stored as zero, never
  displayed as a newly joined account.
- `countHomepageSearch`: counts only terms exactly matching a current public
  product name, brand or part number. It writes `publicSearchStats` containing
  only the catalogue term and count. Rules restrict `searchActivity` to a single
  immutable `${uid}_${UTC_day}` document per account per day. A private
  `searchActivityReceipts` marker makes event retries idempotent. Aggregates
  are all-time counts of that limited activity, not all searches or current trends.
  No free-text query is copied into public aggregates unless it matches an
  existing catalogue field. Anonymous activity is not counted.
- `notifySavedSearches`: on new posts only, scans saved searches in 200-document
  pages. Matches exact normalized brand and/or model fields (AND when both supplied).
  Transactions recheck the search and post, exclude BUY/own posts, and compare
  server creation times so searches saved later cannot trigger historical alerts.
  Deterministic notification IDs prevent duplicate alerts on event retries.
  The existing `SYSTEM` notification schema opens the product from Notifications.
  There is no email sending and no historical notification backfill.

`savedSearches` allows only owner reads/deletes and creates with brand, model,
user ID and a current creation timestamp. Updates are denied; remove and save a
new alert to change criteria. Missing-document gets are permitted to authenticated
clients for idempotent creation; existing documents remain owner-only.
`searchActivity` is owner-readable and create-only. Public summaries are readable
without authentication, never client-writable. Receipts deny all client access.
These collections are explicitly excluded from the overlapping legacy catch-all.
The old broad authenticated write policy for other collections remains unchanged.

Operations are asynchronous and failures retry. A post change rereads all of the
affected supplier's matching posts; each new listing scans all saved searches.
This is appropriate for the current catalogue, not an indexed large-scale search
service. Monitor function duration, errors and Firestore reads as usage grows;
move to indexed subscription matching before large-scale rollout. Raw activity
and retry receipts are not automatically purged; manage retention together,
since removing retry receipts can permit delayed events to count twice.

Deploy only on an explicit release request, using the same project throughout:

```powershell
npm --prefix functions test
firebase deploy --only functions:public-ratings --project YOUR_PROJECT_ID --force
node functions\backfill-public-products.js --project YOUR_PROJECT_ID
node functions\backfill-homepage-discovery.js --project YOUR_PROJECT_ID
firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
# Then deploy the frontend using the usual workflow.
```

The supplier/buyer backfill uses administrator ADC, paginates users and existing
supplier/buyer summaries, recomputes their union and stops on errors. Backfill ratings
first using the earlier instructions if their summaries have not been initialized.
The buyer section requires the buyer triggers, this backfill and rules deployment
before the frontend release; a frontend-only deploy will not initialize buyers.
Do not backfill search notifications or invent initial popular counts.

Before release, verify owner/non-owner/anonymous access for saved searches,
immutable daily activity, blocked client writes to public summaries/receipts,
new matching/self/BUY/nonmatching notifications and retry deduplication. Check the
homepage signed out and signed in, wishlist changes, country/catalogue links and
mobile widths. Tests use isolated service fixtures, not production writes.
