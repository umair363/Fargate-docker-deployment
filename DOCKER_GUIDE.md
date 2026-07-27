# 🐳 The Complete Docker Guide — From Zero to Containers

> **Author:** DevOps Lab Notes  
> **Context:** This guide was written alongside a real project — a 3-tier SettleMint Visitor Dashboard (React + FastAPI + PostgreSQL) that we containerized with Docker.  
> **Goal:** Teach you **everything** about Docker — the what, why, how, and every component — using our actual project as the running example.

---

## Table of Contents

1. [The Problem Docker Solves](#1-the-problem-docker-solves)
2. [Virtualization vs Containerization](#2-virtualization-vs-containerization)
3. [What is Docker?](#3-what-is-docker)
4. [Docker Architecture & Components](#4-docker-architecture--components)
5. [Docker Images — The Blueprints](#5-docker-images--the-blueprints)
6. [Docker Containers — The Running Instances](#6-docker-containers--the-running-instances)
7. [The Dockerfile — Writing Your Own Blueprint](#7-the-dockerfile--writing-your-own-blueprint)
8. [Our Project's Dockerfiles Explained Line-by-Line](#8-our-projects-dockerfiles-explained-line-by-line)
9. [Docker Networking](#9-docker-networking)
10. [Docker Volumes & Data Persistence](#10-docker-volumes--data-persistence)
11. [Docker Compose — Orchestrating Multiple Containers](#11-docker-compose--orchestrating-multiple-containers)
12. [Our docker-compose.yml Explained Line-by-Line](#12-our-docker-composeyml-explained-line-by-line)
13. [Docker CLI — Every Command You Need](#13-docker-cli--every-command-you-need)
14. [Troubleshooting & Lessons Learned](#14-troubleshooting--lessons-learned)
15. [Docker Image Tags & Variants](#15-docker-image-tags--variants)
16. [Summary & Cheat Sheet](#16-summary--cheat-sheet)

---

## 1. The Problem Docker Solves

### The Classic "It Works on My Machine" Problem

Imagine this scenario:

- You build a Python app on your Windows laptop. It works perfectly.
- Your teammate clones your repo on their Mac. **It crashes.**
- You deploy it to a Linux server on AWS. **It crashes differently.**

Why? Because each machine has:
- A different **Operating System** (Windows vs Mac vs Linux)
- Different **system libraries** installed
- Different **versions** of Python, Node, PostgreSQL
- Different **environment variables** and configurations
- Different **file paths** (`C:\Users\...` vs `/home/...`)

**Docker's promise:** Package your application **AND its entire environment** into a single, portable unit that runs **identically everywhere** — your laptop, your friend's laptop, a cloud server, anywhere.

### A Real Example From Our Project

Our SettleMint app needs:
- **Node.js 22** (not 18, not 20 — specifically 22, because Vite 8 uses `rolldown` which needs `node:util.styleText`)
- **Python 3.10** with `fastapi`, `sqlalchemy`, `psycopg2`
- **PostgreSQL 16** database server

Without Docker, you'd need to install and configure all three of these manually on every machine. With Docker, you run **one command** (`docker-compose up`) and everything spins up perfectly.

---

## 2. Virtualization vs Containerization

This is the most fundamental concept. Understanding the difference is **essential**.

### What is Virtualization?

Virtualization creates **full virtual machines (VMs)** — each with its own complete operating system.

```
┌─────────────────────────────────────────────────┐
│              YOUR PHYSICAL MACHINE              │
│                                                 │
│  ┌─────────────┐  ┌─────────────┐              │
│  │   VM #1     │  │   VM #2     │              │
│  │ ┌─────────┐ │  │ ┌─────────┐ │              │
│  │ │ Your App│ │  │ │ Your App│ │              │
│  │ ├─────────┤ │  │ ├─────────┤ │              │
│  │ │Libraries│ │  │ │Libraries│ │              │
│  │ ├─────────┤ │  │ ├─────────┤ │              │
│  │ │ Full OS │ │  │ │ Full OS │ │  ← Each VM   │
│  │ │(Ubuntu) │ │  │ │(CentOS) │ │    has its   │
│  │ └─────────┘ │  │ └─────────┘ │    own OS!   │
│  └─────────────┘  └─────────────┘              │
│  ┌─────────────────────────────────┐            │
│  │        HYPERVISOR               │ ← VMware,  │
│  │    (Virtual Machine Manager)    │   VBox,     │
│  └─────────────────────────────────┘   Hyper-V  │
│  ┌─────────────────────────────────┐            │
│  │      HOST OPERATING SYSTEM      │            │
│  └─────────────────────────────────┘            │
│  ┌─────────────────────────────────┐            │
│  │         HARDWARE (CPU, RAM)     │            │
│  └─────────────────────────────────┘            │
└─────────────────────────────────────────────────┘
```

**Key characteristics of VMs:**
| Aspect | Virtual Machine |
|--------|----------------|
| **Boot time** | Minutes (full OS has to boot) |
| **Size** | Gigabytes (entire OS image) |
| **Isolation** | Complete (separate kernel) |
| **Resource usage** | Heavy (each VM reserves RAM, CPU) |
| **Examples** | VMware, VirtualBox, Hyper-V, EC2 |

### What is Containerization?

Containerization creates **lightweight, isolated processes** that share the host's OS kernel.

```
┌─────────────────────────────────────────────────┐
│              YOUR PHYSICAL MACHINE              │
│                                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│  │Container 1│ │Container 2│ │Container 3│     │
│  │┌─────────┐│ │┌─────────┐│ │┌─────────┐│     │
│  ││ Your App││ ││ Your App││ ││ Your App││     │
│  │├─────────┤│ │├─────────┤│ │├─────────┤│     │
│  ││Libraries││ ││Libraries││ ││Libraries││     │
│  │└─────────┘│ │└─────────┘│ │└─────────┘│     │
│  └───────────┘ └───────────┘ └───────────┘     │
│           ↑ NO separate OS in each! ↑           │
│  ┌─────────────────────────────────────┐        │
│  │       CONTAINER ENGINE (Docker)     │        │
│  └─────────────────────────────────────┘        │
│  ┌─────────────────────────────────────┐        │
│  │      HOST OPERATING SYSTEM          │        │
│  │         (single kernel)             │        │
│  └─────────────────────────────────────┘        │
│  ┌─────────────────────────────────────┐        │
│  │         HARDWARE (CPU, RAM)         │        │
│  └─────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

**Key characteristics of Containers:**
| Aspect | Container |
|--------|-----------|
| **Boot time** | Seconds (just starts a process) |
| **Size** | Megabytes (only app + its libraries) |
| **Isolation** | Process-level (shares host kernel) |
| **Resource usage** | Minimal (no separate OS overhead) |
| **Examples** | Docker, Podman, containerd |

### The Critical Difference — Side by Side

| Feature | Virtual Machine | Container |
|---------|----------------|-----------|
| **Starts in** | 1-3 minutes | 1-5 seconds |
| **Disk space** | 5-50 GB per VM | 50-500 MB per container |
| **RAM usage** | Each reserves 1+ GB | Shares host RAM dynamically |
| **OS** | Each has its own full OS | Shares host OS kernel |
| **Isolation** | Hardware-level (very strong) | Process-level (strong enough) |
| **Portability** | Hard to move between hosts | Extremely portable |
| **Use case** | Running different OS types | Running different apps |

### An Analogy

- **VMs** are like **separate houses** — each has its own foundation, walls, plumbing, and electricity. Expensive, slow to build, fully independent.
- **Containers** are like **apartments in a building** — they share the building's foundation and plumbing, but each unit is isolated, private, and much cheaper/faster to set up.

### How Docker Works on Windows (Important!)

Docker containers are **Linux-native** technology. They use Linux kernel features called **namespaces** and **cgroups**. So how does Docker work on your Windows machine?

Docker Desktop for Windows runs a **tiny Linux VM** (using WSL2 or Hyper-V) behind the scenes. Your containers actually run inside this hidden Linux VM. You never see it — Docker Desktop handles everything transparently.

```
Your Windows PC
  └── Docker Desktop
        └── Tiny Linux VM (WSL2)
              └── Docker Engine
                    ├── Container 1 (PostgreSQL)
                    ├── Container 2 (FastAPI)
                    └── Container 3 (React/Vite)
```

---

## 3. What is Docker?

Docker is a **platform** for building, shipping, and running applications inside containers.

### Docker is NOT:
- ❌ A virtual machine
- ❌ A programming language
- ❌ An operating system
- ❌ Only for Linux

### Docker IS:
- ✅ A tool that **packages** your app + environment into a container
- ✅ A **runtime** that runs those containers
- ✅ A **registry system** (Docker Hub) for sharing container images
- ✅ Available on **Windows, Mac, and Linux**

### Brief History
| Year | Event |
|------|-------|
| 2008 | Linux Containers (LXC) introduced |
| 2013 | **Docker launched** by Solomon Hykes at dotCloud |
| 2014 | Docker Hub launched (public image registry) |
| 2015 | Docker Compose released (multi-container orchestration) |
| 2017 | Kubernetes became the standard container orchestrator |
| 2020 | Docker Desktop introduced WSL2 backend for Windows |
| Today | Docker is the **industry standard** for containerization |

---

## 4. Docker Architecture & Components

Docker has a **client-server architecture**. Here's every piece:

```
┌──────────────────────────────────────────────────────────────┐
│                      DOCKER ARCHITECTURE                      │
│                                                                │
│   ┌──────────┐         ┌──────────────────────────────┐       │
│   │ DOCKER   │  REST   │       DOCKER DAEMON          │       │
│   │ CLI      │ ──API──→│       (dockerd)               │       │
│   │          │         │                              │       │
│   │ docker   │         │  ┌──────────┐ ┌──────────┐  │       │
│   │ build    │         │  │ Images   │ │Containers│  │       │
│   │ run      │         │  └──────────┘ └──────────┘  │       │
│   │ pull     │         │  ┌──────────┐ ┌──────────┐  │       │
│   │ push     │         │  │ Volumes  │ │ Networks │  │       │
│   │ ...      │         │  └──────────┘ └──────────┘  │       │
│   └──────────┘         └──────────────────────────────┘       │
│                                    │                           │
│                                    ↓                           │
│                        ┌──────────────────┐                   │
│                        │  DOCKER REGISTRY  │                   │
│                        │  (Docker Hub)     │                   │
│                        │                  │                   │
│                        │  python:3.10     │                   │
│                        │  node:22         │                   │
│                        │  postgres:16     │                   │
│                        │  nginx:latest    │                   │
│                        └──────────────────┘                   │
└──────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 4.1 Docker CLI (Client)
The command-line tool you type commands into. When you type `docker build`, `docker run`, etc., the CLI sends these commands to the Docker Daemon via a REST API.

```bash
docker build .          # "Hey daemon, build an image from this directory"
docker run postgres     # "Hey daemon, start a container from the postgres image"
docker ps               # "Hey daemon, show me running containers"
```

#### 4.2 Docker Daemon (`dockerd`)
The **background service** that does all the heavy lifting. It:
- Builds images
- Runs containers
- Manages networks and volumes
- Pulls images from registries

You never interact with it directly — you always go through the CLI or Docker Desktop.

#### 4.3 Docker Desktop
A GUI application for Windows/Mac that bundles:
- Docker Daemon
- Docker CLI
- Docker Compose
- The hidden Linux VM (WSL2)
- A nice dashboard to see your containers

#### 4.4 Docker Registry (Docker Hub)
A **cloud storage** for Docker images. Think of it like GitHub, but for container images instead of code.

- **Docker Hub** (`hub.docker.com`) — the default public registry
- You can also use private registries (AWS ECR, Google GCR, etc.)
- When you write `FROM python:3.10-slim`, Docker pulls that image from Docker Hub

#### 4.5 Docker Objects

Docker manages four main types of objects:

| Object | What it is | Analogy |
|--------|-----------|---------|
| **Image** | A read-only blueprint/template | A class definition |
| **Container** | A running instance of an image | An object (instance of a class) |
| **Volume** | Persistent storage that survives container restarts | An external hard drive |
| **Network** | Virtual network connecting containers | A private LAN/WiFi |

---

## 5. Docker Images — The Blueprints

An image is a **read-only template** that contains everything needed to run your application:
- A base operating system (e.g., Debian, Alpine Linux)
- Your application code
- All dependencies and libraries
- Environment variables and configuration
- The command to start your app

### How Images Are Built — Layers

This is a **crucial concept**. Docker images are built in **layers**, like a stack of pancakes.

```
┌─────────────────────────────────┐
│  Layer 5: CMD ["uvicorn", ...]  │  ← Start command
├─────────────────────────────────┤
│  Layer 4: COPY . .              │  ← Your application code
├─────────────────────────────────┤
│  Layer 3: RUN pip install ...   │  ← Installed dependencies
├─────────────────────────────────┤
│  Layer 2: COPY requirements.txt │  ← Requirements file
├─────────────────────────────────┤
│  Layer 1: FROM python:3.10-slim │  ← Base OS + Python
└─────────────────────────────────┘
```

**Why layers matter:**
1. **Caching** — If you change your app code (Layer 4), Docker only rebuilds layers 4 and 5. Layers 1-3 are cached from the previous build. This makes rebuilds **much faster**.
2. **Sharing** — If two images both use `python:3.10-slim`, they share that base layer on disk. No duplication.
3. **Efficiency** — Each layer is a diff (only the changes), keeping images small.

### Image Naming Convention

```
registry/repository:tag

Examples:
docker.io/library/python:3.10-slim
         ↑         ↑       ↑
      registry  image name  version/variant tag

Short form (Docker Hub is the default registry):
python:3.10-slim
node:22-slim
postgres:16-alpine
```

### Pulling Images

When you write `FROM python:3.10-slim` in a Dockerfile or run `docker pull python:3.10-slim`, Docker:
1. Checks if the image exists locally
2. If not, connects to Docker Hub
3. Downloads each layer
4. Stores them on your machine

---

## 6. Docker Containers — The Running Instances

A container is a **running instance** of an image. The relationship is like:
- **Image** = A recipe (instructions to make a cake)
- **Container** = The actual cake (made from the recipe)

You can make **multiple cakes (containers)** from the **same recipe (image)**.

### Container Lifecycle

```
        docker create         docker start
Image ──────────────→ Created ────────────→ Running
                                               │
                                    docker stop │ docker kill
                                               ↓
                                           Stopped
                                               │
                                  docker rm     │ docker start
                                               ↓        ↑
                                           Removed   (restart)
```

### What Makes a Container "Isolated"?

Docker uses **Linux kernel features** to isolate containers:

| Feature | What it does |
|---------|-------------|
| **Namespaces** | Each container gets its own view of: process IDs, network, filesystem, hostname, user IDs |
| **cgroups** | Limits how much CPU, RAM, and I/O a container can use |
| **Union filesystem** | Layers the container's writable layer on top of the read-only image layers |

So each container **thinks** it's the only thing running on the system. It has its own:
- Process tree (PID 1 is your app, not the host's init)
- Network interface (its own IP address)
- Filesystem (can't see the host's files unless you mount them)
- Hostname

But underneath, they're all sharing the same Linux kernel.

### Container vs Image — Key Differences

| Aspect | Image | Container |
|--------|-------|-----------|
| **State** | Read-only (immutable) | Read-write (mutable) |
| **Persistence** | Stored on disk permanently | Temporary (data lost when removed) |
| **Analogy** | A class definition | An object/instance |
| **Created by** | `docker build` or `docker pull` | `docker run` or `docker create` |
| **Can have multiples?** | One image, shared by all | Many containers from same image |

---

## 7. The Dockerfile — Writing Your Own Blueprint

A Dockerfile is a **plain text file** with instructions that tell Docker **how to build an image**. Each instruction creates a new layer.

### Every Dockerfile Instruction Explained

| Instruction | Purpose | Example |
|------------|---------|---------|
| `FROM` | **Base image** to start from. Every Dockerfile MUST start with this. | `FROM python:3.10-slim` |
| `WORKDIR` | Set the **working directory** inside the container. All subsequent commands run from here. | `WORKDIR /app` |
| `COPY` | **Copy files** from your machine into the container image. | `COPY . .` |
| `ADD` | Like COPY but can also extract .tar files and download URLs. Use COPY unless you need these features. | `ADD archive.tar.gz /app` |
| `RUN` | **Execute a command** during the build process. Used to install packages, compile code, etc. | `RUN pip install -r requirements.txt` |
| `CMD` | The **default command** that runs when a container starts. Only one CMD per Dockerfile. | `CMD ["python", "app.py"]` |
| `ENTRYPOINT` | Like CMD but **cannot be overridden** easily. Used when the container should always run the same executable. | `ENTRYPOINT ["python"]` |
| `EXPOSE` | **Documents** which port the app listens on. Does NOT actually open the port — that's done with `-p` at runtime. | `EXPOSE 8000` |
| `ENV` | Set **environment variables** in the image. | `ENV NODE_ENV=production` |
| `ARG` | Build-time variables (not available at runtime, unlike ENV). | `ARG VERSION=1.0` |
| `VOLUME` | Create a **mount point** for persistent data. | `VOLUME /data` |
| `USER` | Set which **user** to run commands as (for security — avoid running as root). | `USER appuser` |
| `LABEL` | Add **metadata** to the image (author, version, description). | `LABEL maintainer="you@mail.com"` |

### CMD vs ENTRYPOINT — The Confusing Duo

```dockerfile
# CMD — provides defaults, can be overridden
CMD ["python", "app.py"]
# If you run: docker run myapp bash
# It runs: bash (CMD is replaced)

# ENTRYPOINT — always runs, CMD becomes arguments
ENTRYPOINT ["python"]
CMD ["app.py"]
# If you run: docker run myapp script.py
# It runs: python script.py (ENTRYPOINT stays, CMD is replaced)
```

### The Two Syntax Forms

```dockerfile
# Shell form — runs inside /bin/sh -c
RUN pip install flask
CMD python app.py

# Exec form (preferred) — runs directly, no shell
RUN ["pip", "install", "flask"]
CMD ["python", "app.py"]
```

**Always use exec form for CMD and ENTRYPOINT.** Shell form can cause issues with signal handling (your app won't receive SIGTERM properly for graceful shutdown).

---

## 8. Our Project's Dockerfiles Explained Line-by-Line

### Backend Dockerfile (`backend/Dockerfile`)

```dockerfile
FROM python:3.10-slim
```
> **Line 1:** Start from the official Python 3.10 image with the "slim" variant.
> - `python` = the image name on Docker Hub
> - `3.10` = Python version
> - `slim` = a smaller variant based on Debian (without build tools, docs, etc.)
> - Full size would be ~900MB, slim is ~150MB

```dockerfile
WORKDIR /app
```
> **Line 2:** Create the `/app` directory inside the container and `cd` into it.
> All subsequent `COPY`, `RUN`, and `CMD` commands will execute from this directory.
> If the directory doesn't exist, Docker creates it automatically.

```dockerfile
COPY requirements.txt .
```
> **Line 3:** Copy `requirements.txt` from your machine (build context) into `/app/` inside the container.
> 
> **Why copy this FIRST, before the rest of the code?** Because of **layer caching**.
> If your Python code changes but `requirements.txt` doesn't, Docker reuses the cached layer from the `pip install` step. This saves minutes on rebuilds.

```dockerfile
RUN pip install --no-cache-dir -r requirements.txt
```
> **Line 4:** Install all Python dependencies listed in `requirements.txt`.
> - `--no-cache-dir` tells pip not to cache downloaded packages. This keeps the image smaller since we don't need the cache inside a container.
> - This layer gets cached. Next time you build, if `requirements.txt` hasn't changed, this step is **instant**.

```dockerfile
COPY . .
```
> **Line 5:** Copy **everything else** from the `backend/` directory into `/app/` in the container.
> This includes `main.py` and any other files.
> This is done AFTER `pip install` so that code changes don't invalidate the dependency cache.

```dockerfile
EXPOSE 8000
```
> **Line 6:** Document that this container listens on port 8000.
> **This is purely informational.** It doesn't actually open or publish the port.
> The actual port mapping happens in `docker-compose.yml` with `ports: "8000:8000"`.

```dockerfile
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```
> **Line 7:** The default command to run when the container starts.
> - `uvicorn` = the ASGI web server for FastAPI
> - `main:app` = import the `app` object from `main.py`
> - `--host 0.0.0.0` = listen on ALL network interfaces (critical inside Docker! Without this, the app only listens on `127.0.0.1` and is unreachable from outside the container)
> - `--port 8000` = listen on port 8000

### Frontend Dockerfile (`frontend/Dockerfile`)

```dockerfile
FROM node:22-slim
```
> **Line 1:** Start from Node.js version 22 with the "slim" variant.
> 
> **Why node:22 and not node:18?** We learned this the hard way! Vite 8 uses a new bundler called `rolldown` which requires `node:util.styleText` — a function only available in Node 20+.
> 
> **Why "slim" and not "alpine"?** Alpine Linux uses `musl` libc instead of `glibc`. Many npm packages with native bindings (like rolldown) ship pre-compiled binaries only for `glibc`. On Alpine, npm skips these optional dependencies, causing the "Cannot find native binding" error we hit.

```dockerfile
WORKDIR /app
```
> **Line 2:** Set `/app` as the working directory.

```dockerfile
COPY package*.json ./
```
> **Line 3:** Copy `package.json` (and `package-lock.json` if it exists) into the container.
> The `*` is a glob pattern that matches both files.
> Again, we copy dependency files first for **layer caching**.

```dockerfile
RUN npm install
```
> **Line 4:** Install all Node.js dependencies inside the container.
> This creates `node_modules/` with Linux-compatible native binaries.

```dockerfile
COPY . .
```
> **Line 5:** Copy the rest of the frontend source code.

```dockerfile
EXPOSE 5173
```
> **Line 6:** Document that Vite dev server listens on port 5173.

```dockerfile
CMD ["npm", "run", "dev", "--", "--host"]
```
> **Line 7:** Start the Vite development server.
> - `npm run dev` runs the `dev` script from `package.json` (which runs `vite`)
> - `--` tells npm to pass everything after it to the underlying command
> - `--host` tells Vite to listen on `0.0.0.0` (same reason as FastAPI — must be accessible from outside the container)

### The Layer Caching Strategy Visualized

```
GOOD (what we do):                    BAD (what beginners do):

COPY requirements.txt .               COPY . .
RUN pip install -r requirements.txt   RUN pip install -r requirements.txt
COPY . .                              

When code changes:                    When code changes:
  Layer 1: cached ✓                     Layer 1: INVALIDATED ✗
  Layer 2: cached ✓ (reqs unchanged)    Layer 2: INVALIDATED ✗ (must reinstall!)
  Layer 3: rebuilt (only code copy)     
  
Build time: ~2 seconds                Build time: ~60 seconds
```

---

## 9. Docker Networking

### The Problem

You have 3 containers: Frontend, Backend, and Database. They need to talk to each other. But each container is isolated — it has its own network namespace. How do they communicate?

### Docker Network Types

| Driver | What it does | When to use it |
|--------|-------------|----------------|
| **bridge** | Creates a private internal network. Containers on the same bridge can talk to each other by name. | Default. Used for most applications. |
| **host** | Container shares the host's network directly. No isolation. | Performance-critical apps, debugging. |
| **none** | No networking at all. Container is completely isolated. | Security-sensitive containers. |
| **overlay** | Spans multiple Docker hosts (machines). | Docker Swarm / multi-server setups. |

### How Our Project's Network Works

When you run `docker-compose up`, Docker Compose automatically creates a **bridge network** named `docker-lab_default`. All three services join this network.

```
┌──────────────────────────────────────────────────┐
│         Docker Network: docker-lab_default        │
│         (bridge network, subnet 172.19.0.0/16)   │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│  │   frontend   │  │   backend    │  │    db    ││
│  │  172.19.0.4  │  │  172.19.0.3  │  │172.19.0.2││
│  │              │  │              │  │          ││
│  │  Port: 5173  │  │  Port: 8000  │  │Port: 5432││
│  └──────┬───────┘  └──────┬───────┘  └─────┬────┘│
│         │                 │                │      │
│         │    HTTP req     │   TCP/SQL      │      │
│         │───────────────→ │──────────────→ │      │
│         │  /insert        │ SELECT * FROM  │      │
│         │  /records       │   records      │      │
└─────────┼─────────────────┼────────────────┼──────┘
          │                 │                │
     Port mapping      Port mapping     Port mapping
     5173:5173          8000:8000        5433:5432
          │                 │                │
          ↓                 ↓                ↓
    ┌──────────────────────────────────────────┐
    │           HOST MACHINE (Your PC)          │
    │    localhost:5173  localhost:8000  :5433   │
    └──────────────────────────────────────────┘
```

### DNS Resolution — The Magic of Service Names

Inside a Docker Compose network, each service can reach other services **by their service name** (the key in your `docker-compose.yml`). Docker has a built-in DNS server that resolves these names.

```yaml
# In docker-compose.yml, the service is named "db"
services:
  db:
    image: postgres:16-alpine
```

```python
# In backend/main.py, we connect using the service name "db"
DATABASE_URL = "postgresql://user:password@db:5432/appdb"
#                                         ^^
#                            This "db" resolves to 172.19.0.2
#                            because of Docker's internal DNS!
```

**Without Docker Compose**, you'd need to use IP addresses or manually create networks and link containers. Docker Compose handles all of this automatically.

### Port Mapping — Connecting the Outside World

Containers are isolated. By default, nothing outside the Docker network can reach them. Port mapping creates a tunnel:

```
ports:
  - "5433:5432"
     ↑      ↑
     │      └── Container port (PostgreSQL listens here INSIDE the container)
     └── Host port (YOUR machine's port that maps to it)
```

- **Container-to-container:** Uses internal ports directly (backend → db on port 5432)
- **Host-to-container:** Uses the mapped host port (your browser → frontend on localhost:5173)

Why did we map `5433:5432` for Postgres? Because port 5432 was already taken on your machine by a locally installed PostgreSQL!

---

## 10. Docker Volumes & Data Persistence

### The Problem

Containers are **ephemeral** (temporary). When you run `docker-compose down`, the container is destroyed. All data inside it is **gone**. 

For a database like PostgreSQL, this is catastrophic — you'd lose all your data every time you restart!

### Types of Data Storage

```
┌─────────────────────────────────────────────────┐
│                  THREE APPROACHES                │
│                                                   │
│  1. VOLUMES           2. BIND MOUNTS   3. tmpfs  │
│  (Docker-managed)     (Host directory) (RAM-only)│
│                                                   │
│  ┌─────────┐         ┌──────────┐    ┌────────┐ │
│  │Container│         │Container │    │Container│ │
│  │  /data  │         │  /app    │    │  /tmp   │ │
│  └────┬────┘         └────┬─────┘    └────┬────┘ │
│       │                   │               │      │
│       ↓                   ↓               ↓      │
│  ┌─────────┐      ┌────────────┐    ┌────────┐  │
│  │ Docker  │      │ Your local │    │  RAM   │  │
│  │ Volume  │      │ filesystem │    │ (temp) │  │
│  │ Area    │      │ ./frontend │    │        │  │
│  └─────────┘      └────────────┘    └────────┘  │
│  Survives          Bidirectional    Lost on      │
│  restarts          sync             reboot       │
└─────────────────────────────────────────────────┘
```

### 1. Named Volumes (Docker-managed)

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

- Docker creates a storage area on your host machine (somewhere in Docker's internal directories)
- Data survives container restarts, removals, and rebuilds
- Docker manages the location — you don't need to know where it is
- **Best for: Databases, persistent application data**

This is what we use for PostgreSQL. Even if you run `docker-compose down` and `docker-compose up` again, your database records are still there!

> **Note:** `docker-compose down -v` (with `-v` flag) WILL delete volumes. Without `-v`, volumes are preserved.

### 2. Bind Mounts (Host directory)

```yaml
volumes:
  - ./frontend:/app
```

- Maps a **specific directory on your machine** directly into the container
- Changes on either side are reflected on the other side instantly
- **Best for: Development — edit code on your machine, see changes in the container**

This is what we use for the frontend. You edit `App.css` in VS Code on Windows, and the container sees the changes immediately (with Vite's file watcher + polling enabled).

```
Your Windows machine              Docker Container
                                  
b:\Devops\docker-lab\frontend\    /app/
├── src/                          ├── src/
│   ├── App.css   ←──────────────→│   ├── App.css
│   ├── App.jsx   ←──────────────→│   ├── App.jsx
│   └── main.jsx  ←──────────────→│   └── main.jsx
├── package.json  ←──────────────→├── package.json
└── vite.config.js←──────────────→└── vite.config.js

Bidirectional sync! Edit on either side.
```

### 3. tmpfs Mounts (RAM-only)

```yaml
volumes:
  - type: tmpfs
    target: /tmp
```

- Stored in the host's RAM only
- Extremely fast
- Data disappears when the container stops
- **Best for: Sensitive data that should never be written to disk (secrets, session tokens)**

### Volume Commands

```bash
docker volume ls                  # List all volumes
docker volume inspect my_volume   # See details (where it's stored, etc.)
docker volume rm my_volume        # Delete a volume
docker volume prune               # Delete ALL unused volumes (careful!)
```

---

## 11. Docker Compose — Orchestrating Multiple Containers

### What is Docker Compose?

Docker Compose is a tool for defining and running **multi-container applications**. Instead of running separate `docker run` commands for each service, you define everything in a single YAML file and run one command.

### Without Docker Compose (The Hard Way)

To run our 3-service app without Docker Compose, you'd need:

```bash
# Step 1: Create a network
docker network create myapp-network

# Step 2: Start the database
docker run -d \
  --name postgres_db \
  --network myapp-network \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=appdb \
  -p 5433:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine

# Step 3: Build and start the backend
docker build -t myapp-backend ./backend
docker run -d \
  --name fastapi_backend \
  --network myapp-network \
  -e DATABASE_URL=postgresql://user:password@postgres_db:5432/appdb \
  -p 8000:8000 \
  myapp-backend

# Step 4: Build and start the frontend
docker build -t myapp-frontend ./frontend
docker run -d \
  --name react_frontend \
  --network myapp-network \
  -p 5173:5173 \
  -v ./frontend:/app \
  myapp-frontend \
  sh -c "npm install && npm run dev -- --host"
```

That's **12 commands** with lots of flags to remember.

### With Docker Compose (The Easy Way)

```bash
docker-compose up
```

**One command.** That's it. Docker Compose reads `docker-compose.yml` and does everything above automatically.

### The docker-compose.yml Structure

```yaml
version: '3.8'          # Compose file format version (optional now)

services:                # Define your containers here
  service_name:          # Each service = one container
    image: ...           # Use a pre-built image, OR
    build: ...           # Build from a Dockerfile
    ports: ...           # Port mapping
    volumes: ...         # Data persistence
    environment: ...     # Environment variables
    depends_on: ...      # Startup order
    restart: ...         # Restart policy
    command: ...         # Override the CMD from Dockerfile
    container_name: ...  # Custom container name

volumes:                 # Declare named volumes
  volume_name:

networks:                # Declare custom networks (optional)
  network_name:
```

### Every docker-compose.yml Option Explained

#### `image`
```yaml
image: postgres:16-alpine
```
Use a pre-built image from Docker Hub. No Dockerfile needed.

#### `build`
```yaml
build: ./backend
```
Build an image from the Dockerfile in the specified directory.

#### `ports`
```yaml
ports:
  - "HOST:CONTAINER"
  - "8000:8000"        # Map host 8000 → container 8000
  - "5433:5432"        # Map host 5433 → container 5432
```

#### `volumes`
```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data   # Named volume
  - ./frontend:/app                          # Bind mount
```

#### `environment`
```yaml
environment:
  POSTGRES_USER: user
  POSTGRES_PASSWORD: password
  DATABASE_URL: postgresql://user:password@db:5432/appdb
```
Set environment variables inside the container. Same as `-e` flag in `docker run`.

#### `depends_on`
```yaml
depends_on:
  - db
```
Start this service **after** the listed services. Note: this only waits for the container to **start**, not for the app inside to be **ready**. PostgreSQL might still be initializing when the backend tries to connect.

#### `restart`
```yaml
restart: unless-stopped
```
| Policy | Behavior |
|--------|----------|
| `no` | Never restart (default) |
| `always` | Always restart, even after manual stop |
| `on-failure` | Restart only if the container exits with an error |
| `unless-stopped` | Always restart, except if you manually stopped it |

#### `command`
```yaml
command: sh -c "npm install && npm run dev -- --host"
```
Override the `CMD` from the Dockerfile. We use this for the frontend to ensure `npm install` runs fresh inside the Linux container (fixing the native binding issue).

#### `container_name`
```yaml
container_name: fastapi_backend
```
Give the container a human-readable name instead of the auto-generated one.

---

## 12. Our docker-compose.yml Explained Line-by-Line

Here's our complete file with every single line explained:

```yaml
version: '3.8'
```
> Specifies the Compose file format version. This is **optional** in modern Docker and actually shows a warning now. Kept for compatibility.

```yaml
services:
```
> The top-level key that contains all your container definitions.

### Service 1: Database (PostgreSQL)

```yaml
  db:
```
> The service name. This becomes the **DNS hostname** inside the Docker network. Other containers reach PostgreSQL by connecting to `db:5432`.

```yaml
    image: postgres:16-alpine
```
> Use the official PostgreSQL 16 image with the Alpine Linux variant (smallest possible, ~80MB).
> No Dockerfile needed — PostgreSQL publishes ready-to-use images on Docker Hub.

```yaml
    container_name: postgres_db
```
> Name the container `postgres_db` instead of the auto-generated `docker-lab-db-1`.

```yaml
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: appdb
```
> The official PostgreSQL image reads these environment variables on first startup to:
> - Create a database user named `user`
> - Set their password to `password`
> - Create a database named `appdb`
> 
> This happens automatically — no SQL commands needed!

```yaml
    ports:
      - "5433:5432"
```
> Map port 5433 on your machine to port 5432 inside the container.
> We use 5433 because your local PostgreSQL installation is already using 5432.
> **Inside the Docker network**, other containers still connect on port 5432.

```yaml
    volumes:
      - postgres_data:/var/lib/postgresql/data
```
> Mount a named volume called `postgres_data` to `/var/lib/postgresql/data` (where PostgreSQL stores its data files).
> This means your database data **survives** container restarts and rebuilds.

```yaml
    restart: unless-stopped
```
> Automatically restart this container if it crashes, unless you manually stopped it with `docker-compose stop`.

### Service 2: Backend (FastAPI)

```yaml
  backend:
    build: ./backend
```
> Build the image from `./backend/Dockerfile`. Docker reads the Dockerfile, builds the image, and names it `docker-lab-backend`.

```yaml
    container_name: fastapi_backend
    environment:
      DATABASE_URL: postgresql://user:password@db:5432/appdb
```
> This connection string tells FastAPI how to reach the database:
> - `postgresql://` — protocol
> - `user:password` — credentials (matching what we set in the db service)
> - `@db` — the hostname (service name from Docker Compose!)
> - `:5432` — PostgreSQL's port INSIDE the Docker network
> - `/appdb` — the database name

```yaml
    ports:
      - "8000:8000"
```
> Expose the FastAPI server on localhost:8000.

```yaml
    depends_on:
      - db
```
> Start the backend only AFTER the `db` container has started.

```yaml
    restart: unless-stopped
```

### Service 3: Frontend (React/Vite)

```yaml
  frontend:
    build: ./frontend
    container_name: react_frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```
> Standard setup — build from Dockerfile, map port 5173, start after backend.

```yaml
    volumes:
      - ./frontend:/app
```
> **Bind mount** — maps your local `frontend/` directory into the container's `/app/`.
> This means you can edit code in VS Code and the container sees the changes immediately.
> This is the **key to live development** with Docker.

```yaml
    command: sh -c "npm install && npm run dev -- --host"
```
> **Override the Dockerfile's CMD.** Why?
> 
> The bind mount (`./frontend:/app`) replaces the container's `/app/node_modules/` with your Windows `node_modules/` (which has Windows native binaries). These don't work on Linux.
> 
> So we run `npm install` fresh every time the container starts to get Linux-compatible binaries, then start Vite.

```yaml
    restart: unless-stopped
```

### Volume Declaration

```yaml
volumes:
  postgres_data:
```
> Declare the named volume `postgres_data` at the top level. Docker creates and manages this volume automatically.

---

## 13. Docker CLI — Every Command You Need

### Image Commands

```bash
# Pull an image from Docker Hub
docker pull python:3.10-slim

# List all images on your machine
docker images
# or
docker image ls

# Build an image from a Dockerfile in the current directory
docker build -t myapp:1.0 .
#             ↑             ↑
#        tag/name       build context (current directory)

# Remove an image
docker rmi python:3.10-slim
# or
docker image rm python:3.10-slim

# Remove ALL unused images (careful!)
docker image prune -a

# Inspect image details (layers, size, config)
docker image inspect python:3.10-slim

# See the history of how an image was built (each layer)
docker history python:3.10-slim
```

### Container Commands

```bash
# Run a new container from an image
docker run python:3.10-slim
#   Common flags:
#   -d            Run in background (detached mode)
#   -p 8000:8000  Port mapping
#   -e KEY=VALUE  Set environment variable
#   -v /host:/container  Mount a volume
#   --name myapp  Give it a name
#   --rm          Automatically remove when stopped
#   -it           Interactive terminal (for debugging)

# Full example:
docker run -d --name my_backend -p 8000:8000 -e DB=postgres myapp:1.0

# List running containers
docker ps

# List ALL containers (including stopped)
docker ps -a

# Stop a running container (graceful — sends SIGTERM)
docker stop my_backend

# Kill a container (force — sends SIGKILL)
docker kill my_backend

# Start a stopped container
docker start my_backend

# Restart a container
docker restart my_backend

# Remove a stopped container
docker rm my_backend

# Remove a running container (force)
docker rm -f my_backend

# Remove ALL stopped containers
docker container prune

# View container logs
docker logs my_backend
docker logs -f my_backend        # Follow (live tail)
docker logs --tail 50 my_backend # Last 50 lines

# Execute a command INSIDE a running container
docker exec my_backend ls /app
docker exec -it my_backend bash   # Open a shell inside the container
docker exec -it my_backend sh     # Use sh if bash isn't available (Alpine)

# Copy files between host and container
docker cp my_backend:/app/data.txt ./data.txt   # Container → Host
docker cp ./config.json my_backend:/app/         # Host → Container

# See real-time resource usage
docker stats

# Inspect container details (IP, mounts, env vars, etc.)
docker inspect my_backend
```

### Docker Compose Commands

```bash
# Start all services (foreground — see all logs)
docker-compose up

# Start all services (background)
docker-compose up -d

# Start and rebuild images
docker-compose up --build

# Start only specific service(s)
docker-compose up frontend

# Stop all services
docker-compose down

# Stop and remove volumes too (DELETES DATA!)
docker-compose down -v

# View logs
docker-compose logs
docker-compose logs -f              # Follow (live)
docker-compose logs frontend        # Specific service
docker-compose logs --tail 30       # Last 30 lines

# List running containers
docker-compose ps

# Restart a specific service
docker-compose restart frontend

# Rebuild without starting
docker-compose build

# Execute command in a running service
docker-compose exec backend bash
docker-compose exec db psql -U user appdb   # Open PostgreSQL shell!

# Scale a service (run multiple instances)
docker-compose up --scale backend=3
```

### Cleanup Commands

```bash
# Nuclear option — remove EVERYTHING unused
docker system prune -a --volumes

# See disk usage
docker system df

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune
```

---

## 14. Troubleshooting & Lessons Learned

These are the actual issues we hit during this project and how we fixed them:

### Issue 1: Port Already in Use
```
Error: Bind for 0.0.0.0:5432 failed: port is already allocated
```
**Cause:** Your local PostgreSQL installation was already using port 5432.
**Fix:** Changed the host port mapping from `5432:5432` to `5433:5432`. The container still uses 5432 internally, but your machine accesses it on 5433.

### Issue 2: Node 18 Missing `styleText`
```
SyntaxError: The requested module 'node:util' does not provide an export named 'styleText'
```
**Cause:** Vite 8 uses Rolldown as its bundler, which requires Node 20+ features.
**Fix:** Changed `FROM node:18-alpine` to `FROM node:22-slim`.

### Issue 3: Native Binding Not Found (Alpine)
```
Error: Cannot find module '@rolldown/binding-linux-x64-musl'
```
**Cause:** Alpine Linux uses `musl` libc. npm's optional dependency resolution has a bug where it skips platform-specific native binaries on Alpine.
**Fix:** Changed from `node:22-alpine` to `node:22-slim` (Debian-based, uses `glibc`).

### Issue 4: Native Binding Not Found (Slim — still!)
```
Error: Cannot find module '@rolldown/binding-linux-x64-gnu'
```
**Cause:** The `package-lock.json` was generated on Windows. When `npm install` runs inside the Linux container, the lockfile forces it to look for Windows binaries.
**Fix:** Two things:
1. Deleted `package-lock.json` so npm resolves fresh for Linux
2. Added `command: sh -c "npm install && npm run dev -- --host"` to ensure npm installs fresh Linux binaries at runtime

### Issue 5: Vite Not Detecting File Changes
**Cause:** Vite uses `inotify` for file watching, which doesn't work across Docker volume mounts on Windows. The Windows filesystem events don't propagate to the Linux container.
**Fix:** Added polling-based file watching in `vite.config.js`:
```javascript
server: {
  watch: {
    usePolling: true,
    interval: 1000
  }
}
```

### General Troubleshooting Tips

```bash
# 1. Always check logs first
docker-compose logs -f service_name

# 2. Get a shell inside the container to investigate
docker exec -it container_name sh

# 3. Check if the file you expect is actually there
docker exec container_name cat /app/some_file.txt

# 4. Check if a port is actually listening
docker exec container_name netstat -tlnp

# 5. Check network connectivity between containers
docker exec container_name ping other_service_name

# 6. Full reset — start completely fresh
docker-compose down -v --rmi all
docker-compose up --build
```

---

## 15. Docker Image Tags & Variants

When you see `python:3.10-slim` or `node:22-alpine`, the part after `:` is the **tag**. Understanding tags is important.

### Common Tag Patterns

| Tag | What it means | Size | Example |
|-----|--------------|------|---------|
| `latest` | Most recent version. **Avoid in production** — it changes! | Varies | `python:latest` |
| `3.10` | Specific version, full image (Debian + tools) | Large (~900MB) | `python:3.10` |
| `3.10-slim` | Specific version, stripped-down Debian (no build tools) | Medium (~150MB) | `python:3.10-slim` |
| `3.10-alpine` | Specific version, Alpine Linux (smallest possible) | Small (~50MB) | `python:3.10-alpine` |
| `3.10-bookworm` | Specific version, specific Debian release | Large | `python:3.10-bookworm` |
| `22-slim` | Node.js 22, slim variant | Medium | `node:22-slim` |
| `16-alpine` | PostgreSQL 16, Alpine variant | Small (~80MB) | `postgres:16-alpine` |

### Alpine vs Slim vs Full — When to Use What

```
Full Image (e.g., python:3.10)
├── Pros: Everything included, rarely hits compatibility issues
├── Cons: 800MB+ size, larger attack surface
└── Use when: You need build tools (gcc, make) or are debugging

Slim Image (e.g., python:3.10-slim)
├── Pros: Small enough (~150MB), uses glibc (good compatibility)
├── Cons: Missing some tools (you can install them with RUN apt-get)
└── Use when: Production deployments (our choice for backend)

Alpine Image (e.g., python:3.10-alpine)
├── Pros: Tiny (~50MB), minimal attack surface
├── Cons: Uses musl libc — breaks some native packages!
└── Use when: Simple apps with no native dependencies
```

**Our lesson:** We started with `node:18-alpine` and it broke because of `musl` libc incompatibility with Rolldown's native binaries. Switched to `node:22-slim` and it worked perfectly.

---

## 16. Summary & Cheat Sheet

### The Big Picture

```
You write code → Define a Dockerfile → Build an Image → Run a Container
                                                              ↓
                                              Your app is running in
                                              an isolated, portable
                                              environment!

Multiple services? → Define docker-compose.yml → docker-compose up
                                                        ↓
                                              All containers start,
                                              network created,
                                              volumes mounted,
                                              everything connected!
```

### Our Project Structure

```
docker-lab/
├── docker-compose.yml          ← Orchestrates all 3 services
├── backend/
│   ├── Dockerfile              ← Blueprint for Python container
│   ├── main.py                 ← FastAPI application
│   └── requirements.txt        ← Python dependencies
├── frontend/
│   ├── Dockerfile              ← Blueprint for Node container
│   ├── package.json            ← Node dependencies
│   ├── vite.config.js          ← Vite config (proxy + polling)
│   └── src/
│       ├── App.jsx             ← React application
│       ├── App.css             ← Styles
│       ├── index.css           ← Global reset
│       └── main.jsx            ← Entry point
└── DOCKER_GUIDE.md             ← This guide!
```

### Quick Reference Cheat Sheet

| What you want to do | Command |
|---------------------|---------|
| Start everything | `docker-compose up` |
| Start in background | `docker-compose up -d` |
| Start and rebuild | `docker-compose up --build` |
| Stop everything | `docker-compose down` |
| Stop + delete data | `docker-compose down -v` |
| View logs | `docker-compose logs -f` |
| View specific service logs | `docker-compose logs -f frontend` |
| Check status | `docker-compose ps` |
| Restart a service | `docker-compose restart frontend` |
| Shell into a container | `docker exec -it container_name sh` |
| Open database shell | `docker exec -it postgres_db psql -U user appdb` |
| List images | `docker images` |
| List all containers | `docker ps -a` |
| Clean everything | `docker system prune -a --volumes` |

### Key Concepts Recap

| Concept | One-line explanation |
|---------|---------------------|
| **Docker** | A platform to run apps in isolated, portable containers |
| **Image** | A read-only blueprint containing your app + its environment |
| **Container** | A running instance of an image |
| **Dockerfile** | Instructions to build an image |
| **Docker Compose** | Tool to define and run multi-container apps from a YAML file |
| **Volume** | Persistent storage that survives container restarts |
| **Bind Mount** | Maps a host directory into a container for live editing |
| **Network** | Virtual network that lets containers talk to each other by name |
| **Registry** | Cloud storage for images (Docker Hub) |
| **Layer** | Each Dockerfile instruction creates a cacheable layer |
| **Tag** | Version/variant label on an image (e.g., `3.10-slim`) |

---

> **🎓 You now know more about Docker than most junior developers.**
> This guide covered the fundamentals, every component, the architecture, and real-world troubleshooting from an actual project.
> Go build something! 🐳
