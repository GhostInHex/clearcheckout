# Implementation decisions

The connected journey uses React and Vite, Express, and SQLite. A browser-only profile could not supply real accounts. A distributed backend would add operational work without improving the local submission journey.

One implementation owner controls all directories and the schema. Accounts and preferences were connected before extension packaging and browser verification. The initial checkpoint is the production build plus account and confirmation tests. The final checkpoint adds the live browser journey and MV3 integration test.

Model the Domain shaped the server-enforced order transition function. Review records the order revision. Every change clears the reviewed revision. Exact confirmation checks the current revision and amount before completing a simulated payment.

Prove It Works shaped the retained tests. They exercise the HTTP server, reopen a real SQLite file, and operate the built app through Chromium. No child agents were started. The parent owns independent review.
