# Deploy Client Command Center to Render (step-by-step)

Get a live URL (e.g. `https://clientapp.onrender.com`) so you can open the app from anywhere. Your code stays on GitHub; Render runs it when you push.

---

## Before you start

- Your app is on **GitHub** (e.g. `https://github.com/Futile63/ClientApp`).
- You have a **GitHub account** and a **Render account** (free at [render.com](https://render.com)).

---

## Step 1: Sign up / log in to Render

1. Go to **https://render.com**.
2. Click **Get Started for Free** (or **Sign In** if you have an account).
3. Choose **Sign up with GitHub** and authorize Render to access your GitHub account.

---

## Step 2: Create a new Web Service

1. From the **Dashboard**, click **New +** → **Web Service**.
2. If Render asks you to connect a repository:
   - Click **Connect account** or **Connect GitHub** and select your account.
   - Find and click **ClientApp** (or your repo name) in the list.
   - Click **Connect** next to it.
3. You should now see your **ClientApp** repo selected. Click **Connect** to confirm.

---

## Step 3: Configure the Web Service

Fill in the form:

| Field | What to enter |
|-------|----------------|
| **Name** | `client-command-center` (or any name; this becomes part of the URL). |
| **Region** | Choose the closest to you (e.g. Oregon). |
| **Branch** | `main` (or the branch you use on GitHub). |
| **Root Directory** | Leave **blank** (the app is at the repo root). |
| **Runtime** | **Node**. |
| **Build Command** | `npm install` (Render often fills this; if empty, use `npm install`). |
| **Start Command** | `npm start`. |

Scroll down to **Instance Type** and leave **Free** selected (or pick a paid plan if you prefer).

---

## Step 4: Add environment variables (login)

So your app asks for a username and password on the live site:

1. In the same page, find the **Environment** or **Environment Variables** section.
2. Click **Add Environment Variable** and add these **three** variables (use your own values):

   | Key | Value (example – use your own) |
   |-----|-------------------------------|
   | `APP_USER` | Your chosen username (e.g. `drew`). |
   | `APP_PASSWORD` | A strong password. |
   | `SESSION_SECRET` | A long random string (e.g. 32+ characters). |

   Keep **APP_PASSWORD** and **SESSION_SECRET** secret; don’t put them in GitHub.

3. Add any other variables your app needs (e.g. `PORT` is set by Render; you don’t need to add it).

---

## Step 5: Deploy

1. Click **Create Web Service** (or **Deploy**).
2. Render will clone your repo, run `npm install`, then `npm start`. The first deploy can take a few minutes.
3. When the deploy finishes, the **Log** will show something like “Your service is live at …”.

---

## Step 6: Open your app

1. At the top of the service page, find the **URL** (e.g. `https://client-command-center-xxxx.onrender.com`).
2. Click it or copy it into your browser.
3. You should see the **login page**. Sign in with the **APP_USER** and **APP_PASSWORD** you set in Step 4.
4. Your data is stored on Render’s disk for this service. It persists between deploys but can be reset if you delete or recreate the service.

---

## Updating the app (after you change code)

1. Push your changes to GitHub (e.g. `git add -A`, `git commit -m "..."`, `git push`).
2. In Render, open your **Web Service** → **Manual Deploy** → **Deploy latest commit** (or wait for **auto-deploy** if you left it on).
3. After the deploy finishes, refresh your app URL; you’ll see the new version.

---

## Data and free tier

- **Free tier:** The app may **spin down** after 15 minutes of no traffic. The first visit after that can take 30–60 seconds to wake up.
- **Data:** Client list is stored in `data/clients.json` on Render’s server. Back it up if it’s important (e.g. copy the file from the service or add a backup step later).

---

## Using this for work? (recommended)

If you’re tracking real client interactions and notes for your job:

1. **Back up regularly**  
   Use **Client List → Download JSON** or **Download CSV** often. Keep a copy in Drive, OneDrive, or email yourself. That way you never lose history even if the server resets.

2. **Persistent Disk (paid plans)**  
   On Render’s **Starter** (or higher), add a **Persistent Disk** and set **DATA_DIR** so the client list survives redeploys. In the Render dashboard: your Web Service → **Disks** → Add Disk → choose a mount path (e.g. `/data`). Then in **Environment**, add `DATA_DIR` = `/data` (or whatever mount path you chose). The app will store `clients.json` there instead of the default `data/` folder.

3. **Free tier caveat**  
   On the free tier, the filesystem is ephemeral. After a redeploy or long idle, your client list may reset. Use exports so you always have a copy.

---

## Troubleshooting

- **Build fails:** Check the **Logs** tab for errors. Often it’s a missing dependency or wrong **Build** / **Start** command (use `npm install` and `npm start`).
- **App shows “Application failed to respond”:** Check **Logs** for crashes. Ensure **Start Command** is `npm start` and that the app listens on `process.env.PORT` (your `server.js` already does).
- **Login doesn’t work:** Confirm **APP_USER**, **APP_PASSWORD**, and **SESSION_SECRET** are set in **Environment** and redeploy if you changed them.
