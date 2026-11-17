# Japan 2027 route planner

Static site comparing two 21-day rail routes across southern Japan (October 2027):

- **Route A, Shuzenji**: Fukuoka → Hiroshima → Okayama → Nagoya → Shuzenji → Tokyo
- **Route B, Yufuin**: Fukuoka → Yufuin → Hiroshima → Okayama → Nagoya → Tokyo

Live: https://thecosmickitchen.github.io/japlanning/

Features: interactive loop map (flights + rail stops), side-by-side calendars with a movable start date
(`?start=2027-10-01`) that flags Tuesday/Monday closures and holidays, day-by-day comparison, food & history
per city, onsen comparison, and an in-browser tally for voting on a call.

The source decks are versioned in [`decks/`](decks/). Trip content lives in `data.js`.
Run locally with any static server, e.g. `npx serve .`.
