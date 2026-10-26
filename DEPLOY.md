# Deploying Riftwatch to Fly.io

One always-on machine (about $6/month) with a 1 GB disk for the saved data.

## 1. Install the Fly command line (Windows, PowerShell)

```powershell
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

Close and reopen the terminal, then sign in:

```powershell
fly auth login
```

## 2. Create the app and its disk

Run these in the `lol-stats-v3` folder. App names are global on Fly, so `riftwatch` may be taken —
pick your own (e.g. `riftwatch-george`) and put the same name on the `app = ...` line in `fly.toml`.

```powershell
fly apps create riftwatch-george
fly volumes create riftwatch_data --region fra --size 1
```

Answer `y` if it warns about a single volume (one machine is what this app wants).

## 3. Add your Riot key as a secret

```powershell
fly secrets set RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

A **development key expires every 24 hours** — until Riot approves a production key, run the
command again with the new key each day (the app restarts with it). To show the site without a
key, use demo mode instead: `fly secrets set DEMO_MODE=true` (remove later with `fly secrets unset DEMO_MODE`).

## 4. Deploy

```powershell
fly deploy
```

The site is then at `https://<your-app-name>.fly.dev`. Check it with `fly status` and `fly logs`.

## 5. Apply for a Riot production key

On https://developer.riotgames.com, register a product (Personal → Production), describe the site,
and give the `fly.dev` link (or your own domain) as the working prototype. When it's approved, set
the new key with step 3 — it no longer expires.

## Later

- **Own domain:** `fly certs add riftwatch.example.com`, then add the DNS records it prints.
- **Updates:** run `fly deploy` again after changes. The data disk is kept.
- **Backups:** Fly snapshots volumes daily (kept 5 days). For your own copy:
  `fly ssh sftp get /app/server/data/champions.json`.
- **Bigger collector region:** change `CRAWL_REGION` in `fly.toml` and redeploy.
