# ShopLite API — Cloud-Native E-Commerce Microservice

A production-grade Node.js (Express) and PostgreSQL REST API for product catalog management, engineered with automated DevSecOps CI/CD, container hardening, and Prometheus observability.

## Architecture & CI Pipeline

Every push to `main` triggers a 9-stage **Jenkins** declarative pipeline:
1. **Checkout & Install** — Clean dependency installation (`npm ci`)
2. **Static Linting** — ESLint code style and error enforcement
3. **Unit Testing & Coverage** — Jest + Supertest with `lcov.info` coverage generation
4. **SAST & Quality Gate** — SonarQube analysis with blocking Quality Gate
5. **Filesystem Vulnerability Scan** — Trivy scan for HIGH/CRITICAL dependency CVEs
6. **Container Build & Scan** — Multi-stage non-root Docker build + Trivy image scan
7. **Registry Push** — Immutable Git-SHA image tagging pushed to Azure Container Registry (ACR)
8. **GitOps Handoff** — Automated manifest tag update in `shoplite-gitops-infra` to trigger ArgoCD

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime & Framework** | Node.js 20 (Alpine), Express.js |
| **Database** | PostgreSQL 16 (`pg` connection pool) |
| **Testing & Linting** | Jest, Supertest, ESLint |
| **Observability** | `prom-client` (`/metrics`), `/health` probes |
| **CI & Security** | Jenkins, SonarQube, Trivy, Docker |

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Liveness/Readiness probe (verifies PostgreSQL connectivity) |
| `GET` | `/metrics` | Prometheus metrics scrape endpoint (`shoplite_http_requests_total`) |
| `GET` | `/api/products` | List all products ordered by newest |
| `POST` | `/api/products` | Create a new product (`name`, `price`, `stock`) |
| `PUT` | `/api/products/:id` | Update an existing product by ID |
| `DELETE` | `/api/products/:id` | Delete a product by ID |

## Local Development Setup

### Prerequisites
* Node.js 20+
* PostgreSQL 16 (local or Docker)

### Steps
1. **Clone the repository**
   ```bash
   git clone [https://github.com/](https://github.com/)<your-username>/shoplite-app.git
   cd shoplite-app