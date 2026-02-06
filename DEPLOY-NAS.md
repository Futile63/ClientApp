# Run Client Command Center on your NAS (Docker)

## What you need on the NAS

- Docker (and Docker Compose v2, i.e. `docker compose`).
- The project folder copied to the NAS (e.g. via SMB, SFTP, or Git).

---

## 1. Copy the project to the NAS

Copy the whole `ClientApp` folder to a directory on the NAS, for example:

- `/volume1/docker/ClientApp` (Synology-style), or  
- Whatever path you use for your other Docker projects (e.g. next to Plex/AdGuard).

You need at least:

- `Dockerfile`
- `docker-compose.yml`
- `package.json` and `package-lock.json`
- `server.js`, `app.js`
- `index.html`, `tier.html`, `client-list.html`, `style.css`

You do **not** need to copy `node_modules` or the `data` folder; the container will create its own data in a volume.

---

## 2. Open a shell on the NAS

- **Synology:** Package Center → Terminal (or SSH if you enabled it).
- **QNAP / others:** Use SSH or the built-in terminal.
- Go to the project folder, e.g.:
  ```bash
  cd /volume1/docker/ClientApp
  ```

---

## 3. Build and start the container

```bash
docker compose up -d --build
```

- `--build` builds the image from the Dockerfile.
- `-d` runs the container in the background (like Plex and AdGuard).

---

## 4. Check that it’s running

```bash
docker compose ps
```

You should see `client-command-center` (or the service name) with status “Up”.

Optional: view logs:

```bash
docker compose logs -f ccc
```

(Press Ctrl+C to stop following.)

---

## 5. Use the app

- **On your LAN:** Open a browser and go to:  
  `http://<NAS-IP>:3000`  
  (e.g. `http://192.168.0.70:3000` if that’s your NAS IP.)
- **From the internet:** Set up Cloudflare Tunnel (or port forwarding + HTTPS) to that NAS IP and port 3000, then use your public URL (e.g. `https://ccc.yourdomain.com`).

---

## Useful commands

| Task              | Command                    |
|-------------------|----------------------------|
| Stop the app      | `docker compose down`      |
| Start again       | `docker compose up -d`     |
| Rebuild after edit| `docker compose up -d --build` |
| View logs         | `docker compose logs -f ccc`   |

---

## Data and updates

- **Data:** Client list is stored in the Docker volume `ccc-data` (see `docker-compose.yml`). It persists across container restarts and rebuilds.
- **After changing code:** Copy the updated files to the same folder on the NAS, then run:
  ```bash
  docker compose up -d --build
  ```
