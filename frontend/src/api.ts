import type { Analysis, Dataset, Review, ReviewStatus, UploadResult, ValidationReport } from "./types";

export class ApiError extends Error {
  validation?: ValidationReport;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError("Cannot reach the backend. Is it running on port 8000?");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    const error = new ApiError(
      typeof detail === "string" ? detail : detail?.message ?? `Request failed (${response.status})`,
    );
    if (detail && typeof detail === "object") error.validation = detail.validation;
    throw error;
  }
  return response.json() as Promise<T>;
}

export const api = {
  health: () =>
    request<{ status: string; storage: { backend: "sqlite" | "mongodb"; note: string | null } }>("/api/health"),
  listDatasets: () => request<Dataset[]>("/api/datasets"),
  loadSample: () => request<UploadResult>("/api/datasets/sample", { method: "POST" }),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<UploadResult>("/api/datasets", { method: "POST", body: form });
  },
  analysis: (id: number) => request<Analysis>(`/api/datasets/${id}/analysis`),
  setReview: (datasetId: number, clusterKey: string, status: ReviewStatus, note: string) =>
    request<Review>(`/api/datasets/${datasetId}/clusters/${clusterKey}/review`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    }),
  reportUrl: (datasetId: number, clusterKey: string) =>
    `/api/datasets/${datasetId}/clusters/${clusterKey}/report`,
};
