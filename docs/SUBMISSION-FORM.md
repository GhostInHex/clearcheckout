# Submission form answers

Updated 2026-11-04 22:15 UTC with the public GitHub repository, the Vercel
production deployment, the rendered video, and the verified live model runs.
Paste each block into the matching field. Survey opinions are marked as
suggestions for the entrant to confirm.

## Team Name

ClearCheckout

## Team Members

Vinay Reddy Patil — Vinayrp_dev

## Track

Indie Developer Track

## Theme / Problem Statement

Build for Your World

## X Post Link

Leave blank unless entering the Most Viral Track.

## Project Description

ClearCheckout helps blind and low-vision shoppers get through a confusing
checkout while staying in control of every action.

The submission combines an accessible web app with real accounts and saved
reading preferences, a guided demo store, and an installable Chromium (MV3)
extension. It repairs unnamed controls only when reliable DOM context exists,
and offers keyboard navigation through cart, delivery, and review.

Meta models add complementary help. Muse Spark 1.3 Contributor explains the
order and the next step. Muse Voice Transcribe turns approved audio into a
transcript the shopper reviews before applying an allowed navigation command.
Muse Image 1.0 supplies a clearly labeled illustrative product scene, and SAM
3.1 locates a selected object for highlighting and magnification.

The shopper reads the authoritative total and types an exact confirmation
phrase. Changing the cart or delivery invalidates that phrase. AI and voice
cannot confirm an order. Every demo payment is explicitly simulated: no card
details are collected, no money moves, and the extension never submits a
merchant payment.

All four model integrations were verified with live API calls on 2026-11-04.
Hands-on testing with blind and low-vision shoppers is the next step.

Demo: https://clearcheckout-one.vercel.app (Vercel frontend; `/api/*` proxies to the sandbox backend). Direct sandbox URL: https://3000-agqyztfyd4yxdgroczmx5ozzdu.instabox.tech

## Public GitHub Repository

https://github.com/GhostInHex/clearcheckout

## Demo Video (under 3 minutes)

https://clearcheckout-one.vercel.app/clearcheckout-submission.mp4

2 minutes 20 seconds, with captions at
https://clearcheckout-one.vercel.app/clearcheckout-captions.srt
and the extension download at
https://clearcheckout-one.vercel.app/clearcheckout-extension.zip

## Describe your use of Meta products to build the submitted project

ClearCheckout calls four Meta models server-side through the official Meta
Model API.

- Muse Spark 1.3 Contributor explains the authenticated demo order and next
  step from authoritative order data and the shopper's saved guidance detail.
- Muse Voice Transcribe converts opt-in audio into a transcript that the
  shopper reviews before applying an allowed navigation command.
- Muse Image 1.0 generates one reusable, explicitly illustrative product
  scene.
- SAM 3.1 locates the selected object in that scene, which drives a bounding
  box highlight and a magnified view.

Every integration produced a live HTTP 200 response on 2026-11-04. Credentials
stay server-side. Order explanations require consent, and no account
credentials, payment details, arbitrary page screenshots, or input values are
sent to a model. A durable usage ledger caps total model spending and request
count, and cached results do not consume another reservation.

## Why are Meta's models important to your solution?

Shoppers need different ways into the same checkout. Meta's models let one
product offer plain-language explanation, speech input, and visual exploration
without giving AI authority over money.

Muse Spark turns structured order data into readable guidance. Muse Voice
Transcribe offers an alternative to keyboard navigation. Muse Image provides a
controlled visual demonstration, and SAM makes a chosen object easier to find
and inspect.

Deterministic application logic still owns totals, state changes, and
confirmation. That separation is what makes the AI assistance safe to ship.

## Feedback on partner technologies

We did not use Fireworks, Modal, or Baseten. Model requests went directly
through the official Meta Model API.

## Likelihood of building with Meta Model API

Suggested: Very likely

## Overall opinion of Meta Model API

Suggested: Somewhat favorable

## Permission to use and promote submitted materials

Select only if you agree to the stated permission.

## Recommend Meta Model API (1–5)

Suggested: 4

## Recommend Muse Code

Leave unanswered; this project did not use Muse Code.

## Biggest obstacle

Suggested: Connecting to our framework or other tools

## Performance compared with other models

Suggested: We've used other models but couldn't make a clear comparison

## What matters most when choosing a model or coding tool?

Suggested: Quality of the answers and code

## Hardest part of switching models or tools

Suggested: Testing a new model takes too long

## What would most likely stop production use of Meta's models?

Suggested: How our data and our users' data would be stored or used

## Notes before submitting

- Links were checked on 2026-11-04: repository, demo, video, captions, and
  extension archive all return HTTP 200. The Vercel source link resolves to the
  GitHub `main` archive, which includes the final documentation.
- The Vercel production deployment passed the full signup-to-confirmation
  browser journey with zero reported axe violations and no page errors. Its
  API proxy, exact-origin allowlist, secure cookies, and a live Contributor
  explanation were verified. The sandbox backend and both demo URLs must stay
  running.
- No WCAG conformance, production security audit, or screen reader user study
  is claimed.
