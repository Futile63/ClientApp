# Set up your login account

Follow these steps once. After that, the app will ask for this username and password when you open it (e.g. from outside home).

---

## Step 1: Create a `.env` file in the project folder

1. Open your project folder: **H:\!Tek\ClientApp**
2. Create a new file named exactly: **`.env`**  
   (The dot at the start is required. In Cursor/VS Code: File → New File, then save as `.env` in the ClientApp folder.)
3. If you prefer to copy from the example: duplicate **`.env.example`**, rename the copy to **`.env`**, then edit it.

---

## Step 2: Add your account and secret

Open **`.env`** and add these three lines. Replace the values with your own.

```
APP_USER=your-username
APP_PASSWORD=your-secure-password
SESSION_SECRET=any-long-random-string-at-least-32-characters
```

**What to use:**

- **APP_USER** – The username you’ll type on the login screen (e.g. your name or `admin`). No spaces.
- **APP_PASSWORD** – The password you’ll type when you sign in. Use a strong password if the app is on the internet.
- **SESSION_SECRET** – A long random string (e.g. 32+ characters). It’s used to secure your session cookie. You can use a password generator or type random letters/numbers. Example: `k9x2mPq7vL4nR1wY8zB3cF6hJ0sA5dG`.

**Example (yours will be different):**

```
APP_USER=drew
APP_PASSWORD=MyStr0ngP@ssw0rd
SESSION_SECRET=k9x2mPq7vL4nR1wY8zB3cF6hJ0sA5dG
```

Save the file.

---

## Step 3: Start the app

In a terminal, from the project folder:

```powershell
cd "H:\!Tek\ClientApp"
npm start
```

You should see something like: **Login enabled (APP_USER / APP_PASSWORD set).**

---

## Step 4: Try it

1. Open the app in your browser: **http://localhost:3000** (or your NAS IP and port).
2. You should see the **login page** (Sign in to continue).
3. Enter the **APP_USER** and **APP_PASSWORD** you put in `.env`.
4. Click **Sign in**. You should land on the Dashboard.
5. Use **Logout** in the nav when you want to sign out.

---

## Troubleshooting

- **No login page / goes straight to the app**  
  Check that `.env` is in **H:\!Tek\ClientApp** (same folder as `server.js`), that the lines are exactly `APP_USER=...` and `APP_PASSWORD=...` (no spaces around `=`), and that you restarted the app after creating or editing `.env`.

- **“Invalid username or password”**  
  The username and password are case-sensitive. They must match what’s in `.env` exactly (no extra spaces).

- **Don’t commit `.env`**  
  The `.env` file is in `.gitignore`, so it won’t be pushed to GitHub. That’s on purpose so your password stays private.
