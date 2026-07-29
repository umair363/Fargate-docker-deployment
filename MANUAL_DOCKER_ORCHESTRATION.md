# The Manual Docker Orchestration Guide 🛠️

In this project, we deleted our `docker-compose.yml` file and learned how to orchestrate a 3-tier application completely manually using raw Docker commands. This teaches you what `docker-compose` is actually doing under the hood!

Here is the exact, step-by-step breakdown of how we did it.

---

## Step 1: Creating the Network (The Bridge)

If you just run three containers, they are completely isolated. The frontend cannot talk to the backend, and the backend cannot talk to the database. We needed a way to connect them.

**The Command:**
```bash
docker network create manual-devops-net
```

**Why we did it:**
By creating a "custom bridge network", we unlocked Docker's internal DNS magic. When containers are placed on a custom bridge network, Docker automatically allows them to look up each other's IP addresses using their container names! (If you use the default bridge network, this DNS feature is disabled).

---

## Step 2: Running the Database (The Storage)

We had to start the database first because the backend will crash if the database doesn't exist when it boots up.

**The Command:**
```bash
docker run -d \
  --name db \
  --network manual-devops-net \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=appdb \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5433:5432 \
  postgres:16-alpine
```

**What every flag means:**
* `-d`: (Detached mode). Run the container in the background so it doesn't freeze our terminal.
* `--name db`: Names the container `db`. Because of Step 1, this also becomes its DNS name!
* `--network manual-devops-net`: Plugs the container into our custom network.
* `-e`: Sets Environment Variables. This tells the PostgreSQL image what username, password, and database to create on startup.
* `-v postgres_data:/var/lib/postgresql/data`: Creates a "Named Volume" called `postgres_data` on your host machine and mounts it into the container. This ensures our data survives even if the container is deleted.
* `-p 5433:5432`: Port mapping. We mapped our laptop's port 5433 to the container's port 5432 so we could connect tools like DBeaver.
* `postgres:16-alpine`: The image to download and run.

---

## Step 3: Running the Backend (The API)

Next, we had to start the FastAPI backend and connect it to the database.

**The Command:**
```bash
docker run -d \
  --name backend \
  --network-alias backend.local \
  --network manual-devops-net \
  -e DATABASE_URL=postgresql://user:password@db:5432/appdb \
  -p 8000:8000 \
  docker-lab-backend
```

**What every flag means:**
* `--name backend`: Names the container `backend`.
* `--network-alias backend.local`: This is critical. Because we updated our React app to look for `backend.local` (for AWS Cloud Map compatibility), we must explicitly tell the local Docker network to alias this container to `backend.local` so the frontend proxy can find it.
* `--network manual-devops-net`: Plugs it into the same network as the database.
* `-e DATABASE_URL=...`: Notice the URL says `@db:5432`. Because we named the database container `db`, the Docker network automatically resolves the word `db` to the database's internal IP address!
* `-p 8000:8000`: Mapped your laptop's port 8000 to the container's port 8000 so you can view the API documentation at `localhost:8000/docs`.
* `docker-lab-backend`: This is the custom image we built earlier using `docker build -t docker-lab-backend ./backend`.

---

## Step 4: Running the Frontend (The UI)

Finally, we start the React application.

**The Command:**
```bash
docker run -d \
  --name frontend \
  --network manual-devops-net \
  -v ${PWD}/frontend:/app \
  -p 5173:5173 \
  docker-lab-frontend
```

**What every flag means:**
* `--name frontend`: Names the container.
* `--network manual-devops-net`: Plugs it into the network.
* `-v ${PWD}/frontend:/app`: This is a **Bind Mount**. Instead of a named volume, we are mapping your laptop's actual `frontend` folder directly into the container's `/app` folder. If you edit a CSS file in VS Code, Vite (running inside the container) sees the change instantly and Hot Module Reloads the browser!
* `-p 5173:5173`: Maps the Vite dev server to your laptop so you can view the website at `localhost:5173`.
* `docker-lab-frontend`: The custom image we built.

*(Note: The frontend is able to talk to the backend because `vite.config.js` says to proxy requests to `http://backend:8000`. Because we named the backend container `backend`, the Docker DNS network seamlessly connects them!)*
