# residency-log

Static page that visualizes which country I was in on each day, sourced from a single JSON file.

## Data

Edit `public/data/residency.json`. Schema:

```json
{ "date": "YYYY-MM-DD", "country": "US", "note": "optional free text" }
```

- `date` is ISO `YYYY-MM-DD`.
- `country` is an ISO 3166-1 alpha-2 code (`US`, `CA`, `JP`, ...).
- A border-crossing day is two records with the same `date` and different `country`. Per-year totals count distinct `(date, country)` pairs, so a crossing day adds 1 to each country.

## Local dev

```sh
npm install
npm run dev        # http://localhost:5173
npm run validate   # check residency.json shape
npm run build      # production build to ./dist
npm run preview    # serve ./dist locally
```

## Deploy (GitHub Pages, gh-pages branch)

1. One-time, after the first push to GitHub:
   - Repo → Settings → Pages → Source: `Deploy from a branch`, Branch: `gh-pages`, folder `/ (root)`.
   - Repo → Settings → Actions → General → Workflow permissions: `Read and write permissions`.
2. The workflow at `.github/workflows/deploy.yml` runs on every push to `main`, validates the JSON, builds with Vite, and publishes `dist/` to the `gh-pages` branch.
3. Site URL: `https://<your-github-username>.github.io/residency-log/`.

If you rename the repo, update the `base` in `vite.config.ts` to match.
