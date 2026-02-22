
---

## Frontend (Next.js)

Use **Next.js (App Router), React, TailwindCSS, shadcn/ui, and Zod for form validation**.

### Requirements

- Use **Zod** for validating:
  - Video upload forms
  - Supervisor notes
  - Any API request payloads
- Integrate Zod with React Hook Form where appropriate.

---

## Flow

1. Supervisor uploads a video (POV or observational).
2. After upload, UI transitions to a split layout:

- **Left (smaller panel):** Video preview  
- **Right (larger panel):** AI analysis report  

---

## Responsibilities (Frontend)

- Handle video upload (validated with Zod)
- Send video to backend (NVIDIA VSS API VM)
- Receive processed analysis
- Render structured report
- Store & retrieve data from MongoDB
- Support CRUD for reports and supervisor notes

---

## Backend (NVIDIA VSS)

- Accept video input
- Run NVIDIA VSS model inference
- Return raw structured output
- Model + inference only (no UI logic)

---

## Processing Flow

1. Upload video (frontend)
2. Send to NVIDIA VSS (backend)
3. Receive raw VSS output
4. Pass output through Gemini Flash 3.0
5. Convert to clean structured JSON:
   - Workers
   - Actions
   - Timestamps
   - Durations
   - Derived metrics
6. Save everything in MongoDB (tied to upload ID)
7. Render structured report in UI

---

## Data Flow

Upload → VSS (backend) → Gemini → Structured JSON → MongoDB → Dashboard

Focus on a clean MVP. Keep the architecture simple, validated, and modular.