# Moonshot API Flow

End-to-end pipeline: supervisor uploads video → VSS processes → Gemini formats → MongoDB stores.

---

## 1. POST /api/upload (Next.js)

**Called by:** Frontend when user submits video + optional notes.

| Parameter       | Type   | Required | Description                    |
|-----------------|--------|----------|--------------------------------|
| `file`          | File   | yes      | Video file (mp4, mov, avi, webm) |
| `supervisorNotes` | string | no     | Optional notes from supervisor |

**Response:** `{ reportId, fileId }`

**Internal calls:**
- → VSS `POST /files`

---

## 2. VSS POST /files (NVIDIA VSS)

**Called by:** Next.js upload route.

| Parameter    | Type | Required | Description                          |
|--------------|------|----------|--------------------------------------|
| `purpose`    | string | yes    | `"vision"` (required for VIA use-case) |
| `media_type` | string | yes    | `"video"`                            |
| `file`       | Blob | yes      | Video file binary                    |
| `camera_id`  | string | no     | Optional camera identifier           |

**Response:** `{ id, filename, purpose, bytes, created_at, ... }` — we use `id` as `vssFileId`.

---

## 3. POST /api/analyze (Next.js)

**Called by:** Frontend after upload completes.

| Parameter   | Type   | Required | Description    |
|-------------|--------|----------|----------------|
| `reportId`  | string | yes      | MongoDB report ID |

**Response:** `{ reportId, status, structuredReport, processingTimeMs }`

**Internal calls:**
- → VSS `POST /summarize`
- → Gemini `generateObject` (Vercel AI SDK)
- → MongoDB update

---

## 4. VSS POST /summarize (NVIDIA VSS)

**Called by:** Next.js analyze route.

| Parameter         | Type   | Required | Description                               |
|-------------------|--------|----------|-------------------------------------------|
| `id`              | string | yes      | VSS file ID from upload                   |
| `prompt`          | string | yes      | Summarization prompt                      |
| `model`           | string | yes      | `"Cosmos-Reason2-8B"`                     |
| `response_format` | number | no       | `1` = text, `0` = JSON                    |
| `chunk_duration`  | number | no       | `10` — chunk videos into 10-second segments |

**Response:** `{ choices: [{ message: { content: "..." } }], ... }` — we use `choices[0].message.content` as raw output.

---

## 5. GET /api/reports (Next.js)

**Called by:** Frontend to list reports.

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `page`      | number | 1    | Page number  |
| `limit`     | number | 20   | Items per page |

**Response:** `{ reports, pagination: { page, limit, total, totalPages } }`

---

## 6. GET /api/reports/[id] (Next.js)

**Called by:** Frontend to fetch a single report.

**Response:** Full report document (status, vssFileId, rawVSSOutput, structuredReport, etc.)

---

## 7. PATCH /api/reports/[id] (Next.js)

**Called by:** Frontend to update supervisor notes.

| Parameter        | Type   | Required | Description      |
|------------------|--------|----------|------------------|
| `supervisorNotes` | string | yes      | New notes value  |

---

## 8. DELETE /api/reports/[id] (Next.js)

**Called by:** Frontend to delete a report.

---

## Optional: VSS GET /files/{file_id}/content

**Purpose:** Fetch raw video file content (for preview). Currently not wired into the app; video preview shows a placeholder.

---

## Flow Diagram

```
[Upload Page] → POST /api/upload (file, supervisorNotes)
                      ↓
               VSS POST /files (purpose, media_type, file)
                      ↓
               Create MongoDB report (status: uploaded)
                      ↓
               Return { reportId, fileId }
                      ↓
[Upload Page] → POST /api/analyze (reportId)
                      ↓
               VSS POST /summarize (id, prompt, model, chunk_duration: 10)
                      ↓
               Raw VSS text → Gemini generateObject() → Structured JSON
                      ↓
               MongoDB: rawVSSOutput, structuredReport, status: complete
                      ↓
               Return { report }
                      ↓
[Report Page] ← GET /api/reports/[id]
```
