# Run Client Command Center with Docker Desktop (no terminal)

You can build and run the app using only Docker Desktop’s GUI.

---

## Option A: Build image, then create container (full GUI)

### 1. Build the image

1. Open **Docker Desktop**.
2. Go to **Images** in the left sidebar.
3. Click **Build** (or **“Build image from Dockerfile”** / **“+”** depending on your version).
4. **Build context:** Click **Browse** and select your **ClientApp** folder (the one with `Dockerfile`, `docker-compose.yml`, `server.js`, etc.).
5. **Image name (optional):** e.g. `client-command-center` or `ccc`.
6. Click **Build** and wait until the image appears in the list.

### 2. Create and run the container

1. Go to **Containers** in the left sidebar.
2. Click **New Container** (or **“Create”**).
3. **Image:** Choose the image you just built (e.g. `client-command-center`).
4. **Name (optional):** e.g. `client-command-center` or `ccc`.
5. **Ports:**
   - Add a port mapping: **Host:** `3000` → **Container:** `3000`.
6. **Volumes (so your data is saved):**
   - Add a volume:
     - **Container path:** `/app/data`
     - **Volume:** create a new volume, e.g. `ccc-data`, or choose a folder on your PC if you prefer.
7. Click **Run** (or **Start**).

### 3. Open the app

In your browser go to: **http://localhost:3000**

---

## Option B: Use Compose from the GUI (if your Docker Desktop supports it)

1. Open **Docker Desktop**.
2. In the left sidebar, look for **Projects** or **Compose** (or **Containers** with an option to add a compose project).
3. Use **“Open”** / **“Add”** / **“Import”** and select your **ClientApp** folder (the one that contains `docker-compose.yml`).
4. Docker Desktop should detect `docker-compose.yml` and show the project (e.g. “ClientApp” or “ccc”).
5. Click **Run** or **Start** for that project.
6. Open **http://localhost:3000** in your browser.

If you don’t see a Compose/Projects option, use **Option A** (build image, then new container).

---

## After it’s running

- **Open in browser:** In **Containers**, click the container, then use the **Open in browser** icon (or go to http://localhost:3000).
- **Logs:** Click the container → **Logs**.
- **Stop:** Toggle the container off or use **Stop**.
- **Start again:** Toggle it on or use **Start**.

---

## If port 3000 is already in use

When creating the container (Option A), set the **host** port to something else (e.g. `3001`) and keep the **container** port as `3000`. Then open **http://localhost:3001**.
