// frontend/src/app/api/client.ts — typed fetch wrappers for the 4 real
// backend routes (backend/main.py). Base URL empty by default (same-origin,
// works behind the nginx proxy in production); override with
// VITE_API_BASE_URL for pointing at a different backend during dev.
import type {
  AnalysisStatusResponse, AnalysisSummary, AuthUser, BusinessInput, CreateAnalysisResponse, Report,
} from "./types";

export const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new ApiError(res.status, detail?.detail ?? `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createAnalysis(input: BusinessInput): Promise<CreateAnalysisResponse> {
    return request("/api/analyses", { method: "POST", body: JSON.stringify(input) });
  },

  confirmAnalysis(analysisId: string): Promise<AnalysisStatusResponse> {
    return request(`/api/analyses/${analysisId}/confirm`, { method: "POST" });
  },

  getStatus(analysisId: string): Promise<AnalysisStatusResponse> {
    return request(`/api/analyses/${analysisId}`);
  },

  getReport(analysisId: string): Promise<Report> {
    return request(`/api/analyses/${analysisId}/report`);
  },

  listAnalyses(): Promise<AnalysisSummary[]> {
    return request("/api/analyses");
  },

  me(): Promise<{ user: AuthUser }> {
    return request("/auth/me");
  },

  logout(): Promise<{ ok: boolean }> {
    return request("/auth/logout", { method: "POST" });
  },

  health(): Promise<{ status: string; redis: string }> {
    return request("/health");
  },
};
