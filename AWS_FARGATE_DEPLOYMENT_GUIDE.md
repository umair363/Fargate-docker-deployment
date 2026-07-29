# AWS Fargate Deployment: Comprehensive Step-by-Step Guide ☁️🚀

This document provides an exhaustive, click-by-click walkthrough of exactly how we provisioned the cloud infrastructure for this 3-tier application using the AWS Management Console. 

It covers the creation of the Container Registry (ECR), the Managed Database (RDS), Security Groups, and the Elastic Container Service (ECS) Fargate orchestration, including internal DNS via Cloud Map.

---

## Phase 1: Container Registry (Amazon ECR)

AWS Fargate needs a place to download our Docker images from. We used Amazon ECR (Elastic Container Registry) to store them privately.

### Step 1.1: Create the Repositories
1. Open the AWS Console and search for **ECR (Elastic Container Registry)**.
2. Click **Create repository**.
3. **Visibility settings:** Keep it **Private**.
4. **Repository name:** Type `docker-lab-backend`.
5. Scroll down and click **Create repository**.
6. Repeat steps 2-5 to create a second repository named `docker-lab-frontend`.

### Step 1.2: Push Local Images to ECR
1. Click on your newly created `docker-lab-backend` repository.
2. In the top right, click **View push commands**.
3. AWS provides 4 exact commands. We ran them in our VS Code terminal:
   * **Command 1:** Logs Docker into AWS (Requires AWS CLI to be installed and `aws configure` to be set up with your IAM Access Keys).
   * **Command 2:** Builds the image (We skipped this because we already built it locally).
   * **Command 3:** Tags your local image with the massive AWS URI (e.g., `docker tag docker-lab-backend:latest 585097636504.dkr.ecr.eu-north-1.amazonaws.com/docker-lab-backend:latest`).
   * **Command 4:** Pushes the image to the cloud (`docker push ...`).
4. Repeat this process for the `docker-lab-frontend` repository.

---

## Phase 2: Managed Database (Amazon RDS)

Instead of deploying a fragile Docker container for our database, we provisioned a highly available, managed PostgreSQL instance.

### Step 2.1: Provision the Database
1. Search for **RDS** in the AWS Console.
2. Click **Create database**.
3. **Creation method:** Standard create.
4. **Engine options:** PostgreSQL.
5. **Templates:** Select **Free tier**.
6. **DB instance identifier:** `docker-lab-db`.
7. **Master username:** `postgres`.
8. **Master password:** Check the box that says **Manage master credentials in AWS Secrets Manager** (AWS auto-generates a secure password).
9. **Connectivity / Public Access:** Select **No** (The database should never be accessible from the public internet).
10. Click **Create database** (This takes ~5 minutes to provision).

### Step 2.2: Retrieve Connection Details
1. Once the DB status is "Available", click on `docker-lab-db`.
2. Under the **Connectivity & security** tab, copy the **Endpoint** (e.g., `docker-lab-db.cjkuqw868feu.eu-north-1.rds.amazonaws.com`).
3. Under the **Configuration** tab, click **Manage in Secrets Manager** to retrieve your auto-generated password.
4. We combined these to create our `DATABASE_URL`: 
   `postgresql://postgres:YOUR_SECRET_PASSWORD@YOUR_ENDPOINT:5432/postgres`

---

## Phase 3: Network Security (Security Groups)

By default, AWS VPCs block all traffic. We had to create three specific firewalls ("Security Groups") to allow our tiers to communicate.

1. Search for **EC2** in the AWS Console, then click **Security Groups** on the left menu.

### Step 3.1: Database Security Group
1. Click **Create security group**.
2. **Name:** `backend-to-db-sg`.
3. **Inbound rules:** Add rule -> Type: **PostgreSQL (5432)** -> Source: **Anywhere-IPv4** (0.0.0.0/0). *(Note: In a true production environment, the source would be restricted to only the Backend Security Group, rather than Anywhere).*
4. Click **Create**.
5. **Important:** We went back to our RDS Database, clicked Modify, and attached this `backend-to-db-sg` to the database so it would accept traffic.

### Step 3.2: Backend Security Group
1. Click **Create security group**.
2. **Name:** `backend-sg`.
3. **Inbound rules:** Add rule -> Type: **Custom TCP** -> Port range: **8000** -> Source: **Anywhere-IPv4**.
4. Click **Create**.

### Step 3.3: Frontend Security Group
1. Click **Create security group**.
2. **Name:** `frontend-sg`.
3. **Inbound rules:** Add rule -> Type: **Custom TCP** -> Port range: **5173** -> Source: **Anywhere-IPv4**.
4. Click **Create**.

---

## Phase 4: Serverless Orchestration (ECS Fargate)

This is where we replaced our local `docker-compose.yml` file with AWS native orchestration.

### Step 4.1: Create the Cluster
1. Search for **ECS (Elastic Container Service)**.
2. Click **Clusters** -> **Create cluster**.
3. **Cluster name:** `docker-lab-cluster`.
4. **Infrastructure:** Leave **AWS Fargate (serverless)** checked.
5. Click **Create**.

### Step 4.2: Create the Backend Task Definition (The Blueprint)
1. On the left menu, click **Task definitions** -> **Create new task definition**.
2. **Task definition family:** `docker-lab-backend-task`.
3. **Launch type:** AWS Fargate.
4. **Operating system:** Linux/X86_64.
5. **Task size:** `.5 vCPU` and `1 GB` memory.
6. **Container details:**
   * **Name:** `backend`
   * **Image URI:** Pasted the exact URI from our ECR Backend repository.
   * **Container port:** `8000`.
7. **Environment variables:** Added a key named `DATABASE_URL` and pasted the massive connection string from Step 2.2.
8. Click **Create**.

### Step 4.3: Create the Frontend Task Definition
1. Create another new task definition.
2. **Task definition family:** `docker-lab-frontend-task`.
3. **Launch type & Size:** Fargate, `.5 vCPU`, `1 GB`.
4. **Container details:**
   * **Name:** `frontend`
   * **Image URI:** Pasted the exact URI from our ECR Frontend repository.
   * **Container port:** `5173`.
5. Click **Create** (No environment variables needed for the frontend).

---

## Phase 5: Deployment & Service Discovery (Cloud Map)

Finally, we instruct AWS to boot up our Tasks using the Blueprints, and we configure the internal DNS so the frontend can find the backend.

### Step 5.1: Run the Backend Service (With Internal DNS)
1. Go back to your `docker-lab-cluster` and click **Create Service**.
2. **Compute options:** Launch type -> Fargate.
3. **Deployment configuration:** Family: `docker-lab-backend-task`, Service name: `backend-service`, Desired tasks: `1`.
4. **Networking:** Under Security groups, select the `backend-sg` we created earlier.
5. **Service Discovery:** This is the most critical step.
   * Check **Use service discovery**.
   * **Namespace:** Create new namespace named `local`.
   * **Service discovery name:** `backend`.
   * *Result:* AWS Cloud Map registers the backend container at `backend.local`.
6. Click **Create**.

### Step 5.2: Update the React Code
Because our internal DNS became `backend.local`, we had to update our `vite.config.js` proxy on our laptop to point to `http://backend.local:8000`. We then rebuilt the frontend Docker image and pushed the updated image to ECR.

### Step 5.3: Run the Frontend Service (Public Facing)
1. In the `docker-lab-cluster`, click **Create Service** again.
2. **Compute options:** Launch type -> Fargate.
3. **Deployment configuration:** Family: `docker-lab-frontend-task`, Service name: `frontend-service`, Desired tasks: `1`.
4. **Networking:** Select the `frontend-sg`. Ensure **Auto-assign public IP** is set to **ENABLED**.
5. **Service Discovery:** Unchecked (the frontend does not need an internal DNS name).
6. Click **Create**.

### Step 5.4: Access the Live Application
1. Click on the running `frontend-service`.
2. Go to the **Tasks** tab and click the Task ID.
3. Under Configuration, copy the **Public IP**.
4. Open a browser and navigate to `http://<PUBLIC_IP>:5173`. 

The architecture is complete. The user accesses the frontend via the Public IP, the frontend proxies API requests internally to `backend.local` using AWS Cloud Map, and the backend processes the logic and queries the managed RDS instance!
