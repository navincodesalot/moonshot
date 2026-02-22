# Moonshot

**Spatial Intelligence in the Physical World** — A video analysis platform for construction and industrial worksite safety, productivity, and quality insights.

Built for the **UMD Startup Shell × Ironsite Hackathon** · February 20–22, 2026

**[→ Live Demo](https://ironsite-moonshot.vercel.app/)**

---

## Overview

Moonshot enables supervisors to upload POV or observational videos from construction sites. The platform aggregates state-of-the-art models—**Cosmos-Reason2-8B** for visual understanding and dense captioning, **Llama 3.1 8B** for summarization and reasoning, and NVIDIA’s **EmbedQA** and **RerankQA** for retrieval—to power AI-driven analysis through the **NVIDIA Video Search and Summarization (VSS)** architecture. **Google Gemini** then structures the output into actionable reports with safety, productivity, and quality metrics.

**Flow:** Upload → Model pipeline (VLM + LLM + retrieval) → Gemini → Structured JSON → MongoDB → Dashboard

---

## Tech Stack

### Frontend

| Technology                  | Purpose                                 |
| --------------------------- | --------------------------------------- |
| **Next.js 16** (App Router) | Full-stack React framework              |
| **React 19**                | UI components                           |
| **Tailwind CSS 4**          | Styling                                 |
| **shadcn/ui**               | UI component library                    |
| **Zod**                     | Schema validation (forms, API payloads) |
| **React Hook Form**         | Form state management                   |
| **UploadThing**             | Video upload handling                   |
| **MongoDB**                 | Report storage                          |
| **Recharts**                | Charts and visualizations               |
| **Vercel AI SDK + Gemini**  | Structured output from raw VSS text     |

### Backend (NVIDIA VSS)

| Component     | Model                                | VSS Architecture Use Case                                                                     |
| ------------- | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| **LLM**       | `meta/llama-3.1-8b-instruct`         | Chat, summarization aggregation, notification generation, and graph ingestion/retrieval       |
| **Embedding** | `nvidia/llama-3.2-nv-embedqa-1b-v2`  | Vector embeddings for graph DB (Neo4j) and vector DB (Milvus) — semantic search and retrieval |
| **Reranker**  | `nvidia/llama-3.2-nv-rerankqa-1b-v2` | Reranking retrieved passages for improved Q&A accuracy                                        |
| **VLM**       | `nvidia/Cosmos-Reason2-8B`           | Dense captioning and visual understanding of video frames — core video analysis               |

### Supporting Services (Docker)

- **Neo4j** — Graph database for structured knowledge
- **ArangoDB** — Multi-model database
- **Milvus** — Vector database
- **MinIO** — Object storage
- **Elasticsearch** — Search
- **NeMo Guardrails** — Content filtering (optional)

### Hardware

| Component      | Spec                            |
| -------------- | ------------------------------- |
| **GPU**        | 1× RTX PRO 6000 WS (96 GB VRAM) |
| **CPU**        | AMD EPYC 7K62 48-Core Processor |
| **Deployment** | [vast.ai](https://vast.ai)      |

---

## Project Structure

```
moonshot/
├── frontend/           # Next.js app — upload, analyze, view reports
├── backend/            # NVIDIA VSS + Docker Compose stack
├── utilities/          # Video preprocessing scripts
└── README.md
```

---

## Frontend (`frontend/`)

The web application for uploading videos, triggering analysis, and viewing structured reports.

```
frontend/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts        # POST — triggers VSS summarize + Gemini formatting
│   │   ├── reports/
│   │   │   ├── route.ts            # GET — list reports (paginated)
│   │   │   └── [id]/route.ts       # GET, PATCH, DELETE — single report CRUD
│   │   └── uploadthing/
│   │       ├── core.ts             # UploadThing config: upload → VSS → MongoDB
│   │       └── route.ts            # UploadThing API route
│   ├── reports/
│   │   ├── page.tsx                # Reports list
│   │   └── [id]/page.tsx           # Single report view
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # Main upload + analysis flow
├── components/
│   ├── video-upload-form.tsx       # Upload form with Zod validation
│   ├── analysis-progress.tsx       # Progress during analysis
│   ├── report-view.tsx             # Report display (charts, scores, timeline)
│   ├── report-card.tsx             # Card for report list
│   ├── status-badge.tsx
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── ui/                         # shadcn components
│       ├── alert-dialog, badge, button, card, chart, combobox,
│       ├── dropdown-menu, field, input, input-group, label,
│       ├── progress, select, separator, textarea, tooltip
├── lib/
│   ├── gemini.ts                   # Gemini Flash — raw VSS → structured JSON
│   ├── mongodb.ts                  # MongoDB connection
│   ├── vss-client.ts               # VSS API client (upload, summarize, get file)
│   ├── uploadthing.ts              # UploadThing client
│   ├── utils.ts
│   ├── models/report.ts            # Report type definitions
│   └── schemas/report-schema.ts    # Zod schema for structured report
├── public/                         # Static assets
├── docs/
│   └── API_FLOW.md                 # End-to-end API flow documentation
├── prd.md                          # Product requirements
├── components.json                 # shadcn config
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

### Key Frontend Responsibilities

- **Video upload** — Validated with Zod, sent to VSS via UploadThing
- **Analysis pipeline** — Orchestrates VSS summarize → Gemini formatting → MongoDB update
- **Report rendering** — Pie charts, scores, and timeline for Safety, Productivity, Quality
- **CRUD** — Reports and supervisor notes

---

## Backend (`backend/`)

NVIDIA VSS engine and supporting infrastructure, deployed via Docker Compose. Provides video upload, summarization, and retrieval.

```
backend/
├── compose.yaml                    # Docker Compose — VSS engine + Neo4j, ArangoDB,
│                                   # Milvus, MinIO, Elasticsearch, etc.
├── config.yaml                     # VSS config: LLM, Embedding, Reranker, summarization
├── .env.example                    # Environment template (API keys, ports, VLM)
├── prometheus.yml                  # Prometheus scrape config
├── otel-collector-config.yaml      # OpenTelemetry collector
└── guardrails/
    ├── config.py                   # NeMo Guardrails embedding setup
    ├── config.yml                  # LLM + embedding models, rails
    ├── prompts.yml                 # Content-filtering prompts
    └── rails/
        └── general.co              # Colang flows (greeting, politics, etc.)
```

### Backend Services (`compose.yaml`)

| Service               | Purpose                                                                       |
| --------------------- | ----------------------------------------------------------------------------- |
| **via-server**        | NVIDIA VSS engine — video analysis (VLM, summarization, ingestion, retrieval) |
| **graph-db**          | Neo4j — graph storage for entities and relations                              |
| **arango-db**         | ArangoDB — multi-model database                                               |
| **minio**             | Object storage for assets                                                     |
| **milvus-standalone** | Vector database for embeddings                                                |
| **elasticsearch**     | Search indexing                                                               |
| **otel-collector**    | OpenTelemetry (optional profiling)                                            |
| **prometheus**        | Metrics (optional profiling)                                                  |
| **jaeger**            | Distributed tracing (optional profiling)                                      |

### Summarization Prompts (`config.yaml`)

The backend uses custom construction/worksite prompts for:

- **Caption** — Dense captions of events (safety, productivity, quality)
- **Caption summarization** — Timestamped summaries under Safety, Productivity, Quality
- **Summary aggregation** — Event categorization (Work Completed, Unsafe Behavior, Rework, etc.)

---

## Utilities (`utilities/`)

Helper scripts for video preprocessing and example test data.

```
utilities/
├── process_videos.py               # Split long videos into fixed-length clips
└── ExampleVideos/                  # Sample videos used for testing
    ├── Explanation.txt             # Describes each example video
    └── Videos/
        └── Video 1/clips/          # Pre-split clips (construction house build)
```

### `process_videos.py`

- **Input:** Videos in `videos/` (mp4, mov, avi)
- **Output:** Clips in `output/<video_name>/clips/clip_000.mp4`, `clip_001.mp4`, …
- **Config:** 120-second clips (configurable via `CLIP_DURATION_SECONDS`)
- **Tech:** OpenCV (`cv2`)

Useful for batch processing long recordings before feeding them into the analysis pipeline.

### `ExampleVideos/`

Preprocessed sample videos for testing the analysis pipeline. `Explanation.txt` describes each video (e.g. Video 1: construction footage of someone building a house).

---

## Quick Start

### Prerequisites

- Node.js 20+, pnpm
- Docker and Docker Compose
- MongoDB
- NGC API key, Hugging Face token (for VSS models)
- Google AI API key (for Gemini)

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Set environment variables (e.g. `MONGODB_URI`, `UPLOADTHING_*`, `GOOGLE_GENERATIVE_AI_API_KEY`, `VSS_BACKEND_URL`).

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with NGC_API_KEY, HF_TOKEN, etc.
docker compose up
```

The VSS backend expects NIMs (LLM, Embedding, Reranker) to be running. See the [NVIDIA VSS Docker Compose deployment guide](https://docs.nvidia.com/vss/latest/content/vss_dep_docker_compose_x86.html#fully-local-deployment-single-gpu) for full setup.

---

## Data Flow

```
[Upload Page] → POST /api/upload (file, supervisorNotes)
                      ↓
               VSS POST /files → Create MongoDB report (status: uploaded)
                      ↓
[Upload Page] → POST /api/analyze (reportId)
                      ↓
               VSS POST /summarize → Raw text
                      ↓
               Gemini generateObject() → Structured JSON
                      ↓
               MongoDB update (rawVSSOutput, structuredReport, status: complete)
                      ↓
[Report Page] ← GET /api/reports/[id] → Charts, scores, timeline
```

---

<p align="center">Made with ❤️ by Yash, Ryan, Sakthi, Akshat, and Navin</p>
