# AnimeWebApp

A weekly schedule for the anime you're watching. Add shows that are airing and see when each next episode drops, in your own timezone. Wishlist upcoming shows and they join your schedule automatically once they start airing.

**Live:** https://anime.joshrkhoo.com · **API:** [AnimeWebAppApi](https://github.com/joshrkhoo/AnimeWebAppApi)

## Features

- **Accounts.** Sign up with a username and password; each user has their own schedule.
- **My schedule.** An "Up next" banner with a countdown, then the 7 days starting today. Shows whose next episode is more than a week away (or not announced) appear under "Coming later".
- **Wishlist.** Shows that haven't premiered go here and move to the schedule when they start airing (or premiere within a week).
- **Browse.** The season's most popular shows, as *Airing now* and *Upcoming* tabs.
- **Search.** Only matches shows that are airing or upcoming.
- **Instant feedback.** Adding a show updates the UI immediately while it saves in the background, with a toast that shows when it airs and an Undo button.

Show data (titles, posters, air times) comes from [AniList](https://anilist.co) through the API.

## Tech stack

React 18 (Create React App), plain CSS, no other runtime dependencies.

## Project structure

```
src/
  App.jsx         App shell: session handling, sidebar, views, toasts, add/remove logic
  AuthScreen.jsx  Log in / create account
  SearchBar.jsx   Search with results dropdown
  Schedule.jsx    "Up next" banner and the weekly schedule
  Posters.jsx     Poster grid, Browse page and Wishlist page
  api.js          API client and session storage
  time.js         Date formatting, week grouping, wishlist rule
  Icons.jsx       Inline SVG icons
  styles.css      All styles
```

## Running locally

Start the [API](https://github.com/joshrkhoo/AnimeWebAppApi) first (it listens on port 5000 by default), then:

```bash
npm install
npm start
```

The app opens at http://localhost:3000. The API address comes from `REACT_APP_API_URL`, which Create React App reads at build time:

| File               | Used by                         | Value                                                   |
| ------------------ | ------------------------------- | ------------------------------------------------------- |
| `.env.development` | `npm start`                     | `http://127.0.0.1:5000`                                 |
| `.env.production`  | `npm run build` / Vercel builds | `https://anime-web-app-api-production.up.railway.app`   |

The API only accepts requests from origins listed in its `CORS_ORIGINS` setting, which includes `http://localhost:3000`.

## Deploying

The site is hosted on Vercel (project `anime-web-app`, team `joshrkhoo1`) and isn't connected to GitHub, so deploy from this folder:

```bash
vercel deploy --prod --scope joshrkhoo1
```

`vercel.json` sets the build command to `CI=false react-scripts build`. Otherwise Vercel's CI mode would fail the build on lint warnings.

The custom domain `anime.joshrkhoo.com` is a CNAME to `cname.vercel-dns.com`, managed in Squarespace DNS.
