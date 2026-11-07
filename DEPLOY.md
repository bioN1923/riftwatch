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

## 3. Add your Riot key and a site password

Riot's policy: a **development key must not power a site the public can reach** — it's only for a
prototype Riot reviews. So until your production key is approved, lock the site with a password:

```powershell
fly secrets set RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx SITE_PASSWORD=choose-a-password
```

Visitors then get a login prompt (user `riot`, your password). Put both in the App Notes of your
Riot application so the reviewers can open it. The development key expires every 24 hours: set
the new one each day with `fly secrets set RIOT_API_KEY=...`.

## 4. Deploy

```powershell
fly deploy
```

The site is then at `https://<your-app-name>.fly.dev`. Check it with `fly status` and `fly logs`.

## 5. Error alerts (recommended)

Get a message when something breaks: a Riot key that expired, Riot rate limits, or a page
crashing on someone's phone.

1. In Discord: Server Settings → Integrations → Webhooks → New Webhook, pick a channel, Copy
   Webhook URL. (A Slack incoming webhook works too.)
2. Set it, plus a long random token for the error list page:

```powershell
fly secrets set ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/... ADMIN_TOKEN=pick-a-long-random-string
```

Each new problem is posted once (repeats are counted, and re-posted at most hourly). The full
list is at `https://<your-app-name>.fly.dev/admin/errors?token=<your token>`.

## 6. Privacy contact

The privacy page (`/privacy`) lets players hide their profile themselves. Give an address for
other privacy or data requests, so Riot's reviewers (and players) can reach you:

```powershell
fly secrets set CONTACT_EMAIL=you@example.com
```

## 7. Apply for a Riot production key

On https://developer.riotgames.com, register a product, describe the site and give the `fly.dev`
link plus the login as the working prototype. When it's approved:

```powershell
fly secrets set RIOT_API_KEY=<production key>
fly secrets unset SITE_PASSWORD
```

The site is then public, and the production key doesn't expire. Once it's public, search engines
can find it: the site serves `/robots.txt` and `/sitemap.xml` (every champion and popular matchup,
in all seven languages). Set your address so those links are right:

```powershell
fly secrets set SITE_URL=https://<your-app-name>.fly.dev
```

Then add the site in Google Search Console and submit `https://<your address>/sitemap.xml`.
While `SITE_PASSWORD` is set, robots.txt tells search engines to stay away.

If Riot asks you to verify the URL with a `riot.txt` file, set the code they give you
(it's served at `/riot.txt`, even while the password is on):

```powershell
fly secrets set RIOT_VERIFICATION=<code from Riot>
```

## Later

- **Own domain:** `fly certs add riftwatch.example.com`, then add the DNS records it prints.
- **Updates:** run `fly deploy` again after changes. The data disk is kept.
- **Backups:** Fly snapshots volumes daily (kept 5 days). For your own copy:
  `fly ssh sftp get /app/server/data/champions.json`.
- **Bigger collector region:** change `CRAWL_REGION` in `fly.toml` and redeploy.
