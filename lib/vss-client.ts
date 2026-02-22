const getBaseUrl = () => {
  const url = process.env.BACKEND_BASE_URL;
  if (!url) throw new Error("BACKEND_BASE_URL environment variable is not defined");
  return url.startsWith("http") ? url : `http://${url}`;
};

export interface VSSFileResponse {
  id: string;
  filename: string;
  purpose: string;
  bytes: number;
  created_at: number;
  [key: string]: unknown;
}

export interface VSSSummarizeResponse {
  id: string;
  request_id?: string;
  choices?: Array<{
    message?: { content: string };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export async function uploadFile(
  file: Buffer,
  filename: string,
): Promise<VSSFileResponse> {
  const base = getBaseUrl();
  const formData = new FormData();
  formData.append("purpose", "vision");
  formData.append("media_type", "video");
  formData.append("file", new Blob([new Uint8Array(file)]), filename);

  const res = await fetch(`${base}/files`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`VSS upload failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function summarizeVideo(
  fileId: string,
  prompt: string,
): Promise<VSSSummarizeResponse> {
  const base = getBaseUrl();

  const res = await fetch(`${base}/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: fileId,
      prompt,
      system_prompt: "Write a concise and clear dense caption for the provided construction or industrial worksite video. Focus on observable events that could affect safety, productivity, or quality of work. These include unsafe behaviors, missing or improper protective equipment, hazardous conditions, delays, waiting, searching for tools or materials, rework, corrections, inefficient movement, equipment misuse or malfunction, material handling problems, coordination issues between workers, interruptions, and any deviations from normal workflow. Also if any Occupational Safety and Health Administration (OSHA) violations are not met by the workers / environment. Each sentence must describe one specific observable event and must begin and end with a timestamp. Be objective, visual, and descriptive without inferring intent or making assumptions.",
      caption_summarization_prompt: "You should summarize the following events from a POV construction site video in the format start_time:end_time:caption. For start_time and end_time use . to separate seconds, minutes, hours. If during a time segment only routine productive work happens without safety or efficiency concerns, briefly describe the work performed. If irregular, unsafe, inefficient, or non-productive activity occurs, describe it in detail. Focus on: - Type of work completed - Work progress - Safety violations (missing PPE, fall risks, unsafe equipment handling) - Rework or mistakes - Idle time or worker distraction - Equipment misuse or malfunction - Coordination or communication between workers. Output structured bullet points organized under three headings: Safety Issues, Productivity Issues, and Quality Issues. Each bullet point should include the time range and a brief explanation of what happened and why it matters operationally.",
      summary_aggregation_prompt: "You are an automated construction performance evaluation system. You will receive time-stamped event captions in the format start_time:end_time:caption describing observable worksite events. First, aggregate similar captions into single event descriptions. If the same event occurs multiple times, combine all time ranges as start_time1:end_time1,...,start_timek:end_time:event_description. If adjacent time ranges are separated by only a few tenths of a second, merge them into one continuous range. Then group all events into these fixed categories: Work Completed, Work in Progress, Unsafe Behavior, Operational Inefficiencies, Rework or Quality Issues, Equipment Misuse or Risk, Coordination & Communication, and Idle Time or Productivity Loss. List events as bullet points under each category.",
      model: "Cosmos-Reason2-8B",
      chunk_duration: 10,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`VSS summarize failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function getFileInfo(fileId: string): Promise<VSSFileResponse> {
  const base = getBaseUrl();

  const res = await fetch(`${base}/files/${fileId}`, { method: "GET" });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`VSS get file info failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function getFileContent(fileId: string): Promise<Response> {
  const base = getBaseUrl();

  const res = await fetch(`${base}/files/${fileId}/content`, { method: "GET" });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`VSS get file content failed (${res.status}): ${text}`);
  }

  return res;
}
