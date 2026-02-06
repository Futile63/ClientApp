# Login (optional) – environment variables

When you set **APP_USER** and **APP_PASSWORD**, the app requires login before anyone can see the dashboard or use the API. Use this when you host the app on the internet (e.g. Railway, Render, or NAS with public URL).

## Variables

| Variable         | Required for login | Description |
|------------------|--------------------|-------------|
| `APP_USER`       | Yes                | Username to sign in. |
| `APP_PASSWORD`   | Yes                | Password to sign in. |
| `SESSION_SECRET` | Recommended        | Secret used to sign session cookies. Set a long random string in production. If unset, a default is used (less secure). |
| `DATA_DIR`       | Optional (Render)   | When set (e.g. `/data`), the app stores `clients.json` in this directory. Use with a Persistent Disk on Render so data survives redeploys. |

- If **both** `APP_USER` and `APP_PASSWORD` are set → **login is required** (redirect to `/login`, API returns 401 when not logged in).
- If either is missing → **login is disabled** (everyone can access the app). Use this for local/LAN-only use.

## How to set them

**Local (PowerShell, one-off run):**
```powershell
$env:APP_USER="your-username"; $env:APP_PASSWORD="your-secure-password"; $env:SESSION_SECRET="long-random-string"; npm start
```

**Render (or Railway):**  
In the dashboard, open your service → **Variables** (or **Environment**) → add `APP_USER`, `APP_PASSWORD`, and `SESSION_SECRET`.

**NAS or Linux:**  
Create a `.env` file in the project folder (do **not** commit it; it’s in `.gitignore`):
```
APP_USER=your-username
APP_PASSWORD=your-secure-password
SESSION_SECRET=long-random-string
```
Then run the app with a tool that loads `.env` (e.g. `node -r dotenv/config server.js` if you add the `dotenv` package), or export the variables in your shell before starting the app.

## Security notes

- Use a strong password for `APP_PASSWORD`.
- Set `SESSION_SECRET` to a long random string in production (e.g. 32+ characters).
- Never commit `.env` or put real credentials in Git.
