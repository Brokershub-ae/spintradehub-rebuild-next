# SpinTradeHub Rebuild (Recovered)

This folder was generated from the live website output and is not the original private source code.

## What is included
- Recovered public HTML pages in `public/recovered`
- Recovered public static assets (`_next/static` JS/CSS/fonts)
- Next.js App Router shell for local development and future rebuilding

## Run locally
1. npm install
2. npm run dev
3. Open http://localhost:3000

## Important limitation
Backend services, database code, API secrets, environment files, and non-public original source files cannot be recovered from a public website crawl.

## User ratings

- Profile and marketplace ratings are calculated from valid 1-5 ratings in the
  Firestore `reviews` collection, joined by `revieweeId` to the user document ID.
  Product ratings are separate; having products does not give a user a 4.8 rating.
- Homepage and network rankings use average rating descending, then review count
  descending, then user ID. Network search preserves the ranking and supports
  names, usernames, emails and user IDs. Unrated accounts display "No reviews";
  read failures display an error rather than a zero rating.
- The homepage reads only server-maintained `publicUserRatings`, exposing names,
  usernames, regions, roles and rating totals, not private user records or reviews.
  Deploy the rating triggers, backfill existing accounts, and deploy the
  `firestore.rules` file before releasing the website update. See
  [deployment instructions](functions/README.md#public-user-rating-summaries).
- Rules preserve the prior authenticated access to other collections and block
  client writes to public summaries. Broad authenticated source writes remain a
  limitation of the existing rules and need a separate permissions migration.
  A website deployment alone does not fix production `permission-denied` errors.

Run the rating regression tests with `node --test tests/home-ratings.test.cjs`.

## Profile layout

Professional profiles stack their header badges, About/Snapshot cards and listing
image/text at widths up to 700px. Stats use two columns on phones; long names,
contact details and listing titles wrap within their cards. Desktop retains the
two-column cards and horizontal listings.

Run profile rendering regressions with `node --test tests/profile-layout.test.cjs`.

The signed-in account page (`/profile`) also has its own responsive layout:
photo and identity share a row on normal phones, actions move beneath them, long
names/contact values wrap, and extra-small phones stack the identity. Account
fields become single-column; tabs scroll within their row instead of widening the
page. Bottom navigation uses equal-width items and safe-area padding.
Run account regressions with `node --test tests/account-layout.test.cjs`.

## Mobile messages

At widths up to 700px, Messages opens on the full-width conversation list. Selecting
a customer opens a full-screen chat; the back arrow returns to the list. Profile
message links open the intended chat directly. The site header and bottom navigation
are hidden while chatting, leaving the composer below the independently scrolling
message history. Desktop retains the split conversation/chat layout.

Run messaging regressions with `node --test tests/messages-layout.test.cjs`.

## Homepage discovery

- Latest products displays up to six real SELL/legacy listings, newest first,
  using limited server-maintained `publicProducts` summaries. BUY requests are
  excluded. Missing photos and prices are labelled, not invented.
- Request a quotation lets signed-in members publish a BUY post to the existing
  feed with product, quantity/unit, category, delivery location and specifications.
  It is not an email or automatic supplier match. Failed saves retain the draft.
- Browse by brand uses up to six case-insensitively unique, alphabetically sorted
  brands from the newest 60 product summaries. These are member-entered names,
  not official partners. Add or edit the optional Brand field on a listing to
  participate; existing listings without a brand are not guessed.
- Brand links apply an exact, case-insensitive feed filter alongside existing
  search/category/location filters. The active brand can be cleared.
- Unreviewed member cards are not presented under a "Top-rated" heading.
- New product summaries require a Firebase trigger deployment, existing-product
  backfill and updated rules before the frontend release. See
  [product setup](functions/README.md#public-product-summaries).

Run discovery regressions with `node --test tests/homepage-products.test.cjs`.

## Listing images

Product detail photos use image elements rather than unquoted CSS backgrounds,
so uploaded filenames containing parentheses or spaces render correctly. The
gallery has thumbnails, a full-screen dialog, previous/next navigation, keyboard
arrows and zoom. Escape closes the native dialog. Listings without photos show
an explicit empty state; image failures show an error.

Run image regressions with `node --test tests/product-image.test.cjs`.

## Product browsing improvements

- New and edited listings accept up to **10 photos, 5 MB each**, in PNG, JPEG,
  WebP or GIF format. The first photo is the cover; removing it promotes the next.
  `imageUris` stores the gallery and `imageUri` retains the cover for existing
  clients, cards and public summaries. Legacy single-photo listings still work.
- Photos can be added/removed in Profile > Products > Edit. Removing a photo
  removes its listing reference, not the underlying storage file.
- Failed photo/PDF uploads prevent publishing; the draft and selected files stay
  available for retry. This intentionally replaces the old publish-without-media
  behavior. Uploading is sequential, and a failed save can leave uploaded files
  in storage; no referenced storage objects are automatically deleted.
- Brand, model/part number, condition and minimum order quantity/unit are optional
  structured fields on create/edit. MOQ and unit must be supplied together and
  quantity must be positive. Unspecified values are not invented.
- Feed text search matches all entered terms across name, description, brand and
  part number. Exact brand and condition filters compose with country/category
  filters. Maximum minimum-order filtering activates only with a positive value
  and a unit; different units are never compared or converted. Missing MOQ values
  are excluded only when that filter is active. Filters run over the existing
  realtime feed, not an external search service.
- Product cards and details say "Request price" when no price is provided.
  Existing catalogue PDFs remain accessible from the detail page.
- Recently viewed products appear on the homepage for signed-in members.
  Only 12 product IDs are stored locally per account/device, with six recent
  eligible listings shown using current authorized Firestore data. BUY posts and
  deleted products are excluded. Clear history removes the local IDs; signing out
  hides history. No cloud browsing-history collection is created.
- The public-products trigger also supports an array-only listing by selecting
  the first HTTPS gallery image. Publish that trigger through the existing
  `public-ratings` codebase when deploying this release; no new rules or indexes
  are needed for these browsing features.

Run shopping regressions with `node --test tests/product-shopping.test.cjs tests/homepage-products.test.cjs`.

## Expanded homepage discovery

- The "What are you looking for?" panel links to product browsing, supplier
  storefront previews and the existing buying-request form.
- Product cards can be saved directly to the existing wishlist. Signing in is
  required; seller details are fetched from the authenticated listing, never
  exposed through the anonymous summaries. Wishlist listeners keep cards current.
- Search suggests actual product names, brands and model/part numbers from the
  latest 60 summaries, with keyboard selection. Ordinary free-text searches still
  work when suggestions are unavailable.
- Popular searches use real, exact catalogue selections/searches by signed-in
  members, counting only the first catalogue search per account per UTC day.
  Totals are all-time, not an assertion of current trends. Arbitrary free-text
  queries and account identities are not published as popular terms.
- Trading-country selection filters product and supplier previews and links to
  the country-filtered feed. The selector always includes all 249 ISO countries
  and territories, even before listings or suppliers exist there; empty matches
  are shown honestly. Country names/aliases are normalized; city-only
  locations are not guessed to be countries.
- Supplier previews use up to 100 latest public supplier summaries. Recently joined
  suppliers use the actual Firebase Auth registration date, omitting unavailable
  dates. Featured storefronts require a catalogue and sort by review count, rating,
  then product count within that sample. No automatic verification badges are used.
- Recently joined buyers appear alongside suppliers, using up to 100 latest
  public buyer summaries and showing six newest accounts with a recorded Auth
  registration date. Cards show name, location, actual review status, join date
  and a buyer profile link, and follow the same trading-country filter. No
  product catalogue or supplier badges are assigned to buyers. Public summaries
  exclude email, phone and other private profile fields.
- Members can save exact brand and/or model searches. Both supplied fields must
  match (case-insensitive, whitespace-normalized). New matching product listings
  create an alert in the existing Notifications page; BUY and own posts are excluded.
  Alerts are not emailed, and existing listings are not backfilled as alerts.
  Removing an alert stops future matches but retains already delivered notifications.
- Supplier catalogue links apply a canonical owner filter in the feed, exclude
  buying requests and compose with other filters; "Show all suppliers" clears it.

This release requires Firebase discovery triggers, public-summary backfills and
rules **before** the frontend. A Next.js build does not publish these changes.
See [discovery setup](functions/README.md#expanded-homepage-discovery).

Run `node --test tests/homepage-discovery.test.cjs tests/homepage-products.test.cjs tests/home-ratings.test.cjs`
and `npm --prefix functions test`.
