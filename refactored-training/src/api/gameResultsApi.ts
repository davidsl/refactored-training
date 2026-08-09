export type GameResult = {
  gameResultId: number;
  playerName: string;
  difficulty: string;
  result: string;
  durationSeconds: number;
  boardWidth: number;
  boardHeight: number;
  minesCount: number;
  movesCount: number;
  score: number;
  playedAtUtc: string;
};

export type CreateGameResultInput = {
  playerName: string;
  difficulty: string;
  result: string;
  durationSeconds: number;
  boardWidth: number;
  boardHeight: number;
  minesCount: number;
  movesCount: number;
  score: number;
  playedAtUtc?: string;
};

export type GameResultsApiErrorDetail = {
  method: string;
  url: string;
  status: number | null;
  message: string;
};

export const GAME_RESULTS_API_ERROR_EVENT = 'game-results-api-error';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const GAME_RESULTS_PATH = '/GameResults';

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function emitApiError(detail: GameResultsApiErrorDetail): void {
  window.dispatchEvent(new CustomEvent<GameResultsApiErrorDetail>(GAME_RESULTS_API_ERROR_EVENT, { detail }));
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const url = typeof input === 'string' ? input : input.toString();
  let response: Response;

  try {
    response = await fetch(input, {
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    });
  } catch {
    const message = 'Could not reach the Minesweeper API. Check that the backend is running and trusted for HTTPS.';
    emitApiError({ method, url, status: null, message });
    throw new Error(message);
  }

  if (!response.ok) {
    const message = `${method} request failed (${response.status}).`;
    emitApiError({ method, url, status: response.status, message });
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getGameResults(): Promise<GameResult[]> {
  return requestJson<GameResult[]>(buildUrl(GAME_RESULTS_PATH), { method: 'GET' });
}

export async function getGameResultById(id: number): Promise<GameResult> {
  return requestJson<GameResult>(buildUrl(`${GAME_RESULTS_PATH}/${id}`), { method: 'GET' });
}

export async function createGameResult(payload: CreateGameResultInput): Promise<GameResult> {
  return requestJson<GameResult>(buildUrl(GAME_RESULTS_PATH), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateGameResult(id: number, payload: GameResult): Promise<void> {
  await requestJson<void>(buildUrl(`${GAME_RESULTS_PATH}/${id}`), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteGameResult(id: number): Promise<void> {
  await requestJson<void>(buildUrl(`${GAME_RESULTS_PATH}/${id}`), { method: 'DELETE' });
}

export async function deleteAllGameResults(ids: number[]): Promise<void> {
  await Promise.all(ids.map(id => deleteGameResult(id)));
}
