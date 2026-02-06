# Exact steps: Set up GitHub for Client Command Center

Do these in order. You need a GitHub account (free at github.com).

---

## Part 1: Create the repo on GitHub (in your browser)

1. Go to **https://github.com** and sign in.
2. Click the **+** (top right) → **New repository**.
3. Fill in:
   - **Repository name:** `client-command-center` (or `ClientApp` — your choice).
   - **Description (optional):** e.g. `Client tracker / CRM lite`.
   - **Public** (or Private if you prefer).
   - **Do NOT** check "Add a README", ".gitignore", or "License" — the project already has these.
4. Click **Create repository**.
5. On the next page, copy the **repo URL**:
   - If you use HTTPS: `https://github.com/YOUR-USERNAME/client-command-center.git`
   - If you use SSH: `git@github.com:YOUR-USERNAME/client-command-center.git`  
   You’ll need this in Part 2.

---

## Part 2: Connect your project and push (in Cursor or terminal)

Open a **new** terminal in Cursor (or PowerShell) so Git is in your PATH. Then run these from your project folder.

**1. Go to the project folder**
```powershell
cd "H:\!Tek\ClientApp"
```

**2. Initialize Git (if not already a repo)**
```powershell
git init
```

**3. Add the GitHub repo as “origin”**  
Replace `YOUR-USERNAME` and `client-command-center` with your actual GitHub username and repo name.
```powershell
git remote add origin https://github.com/YOUR-USERNAME/client-command-center.git
```

**4. Stage all files**
```powershell
git add -A
```

**5. First commit**
```powershell
git commit -m "Initial commit: Client Command Center app"
```

**6. Rename branch to main (if needed)**  
Some setups use `master`; GitHub expects `main`.
```powershell
git branch -M main
```

**7. Push to GitHub**
```powershell
git push -u origin main
```

- If GitHub asks you to sign in, use the browser or credential popup.
- If it asks for a **password**, use a **Personal Access Token** (GitHub no longer accepts account passwords for Git). To create one: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic), enable `repo`, then paste the token when Git asks for a password.

---

## Part 3: Confirm

- Refresh your repo page on GitHub. You should see all project files (app.js, server.js, Dockerfile, etc.).
- `node_modules` and `data/` will **not** be there (they’re in `.gitignore`) — that’s correct.

---

## Later: push updates

After you change code and want to update GitHub:

```powershell
cd "H:\!Tek\ClientApp"
git add -A
git commit -m "Short description of what you changed"
git push
```

You can also use Cursor’s **Source Control** (Ctrl+Shift+G): stage changes, write the commit message, then click **Sync** or **Push**.
