// src/utils/accountSync.ts
// Utility for synchronizing local progress with Deno KV backend and managing account settings

const TRANSFER_HASH_KEY = "poke-learn-transfer-hash";
const USERNAME_KEY = "poke-learn-username";

// 同期対象のLocalStorageキー一覧（PokeAPIキャッシュ以外）
const SYNC_KEYS = [
  "poke-learn-unlocked-types",
  "poke-learn-covered-pairs",
  "poke-learn-quiz-weights",
  "poke-learn-consistency-weights",
  "poke-learn-selection-weights",
  "poke-learn-max-power-weights",
  "poke-learn-weakness-matrix",
  "poke-learn-purified-bosses",
];

export interface AccountInfo {
  username: string;
  transferHash: string;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;
}

export type ProgressData = Record<string, string | null>;

// アカウントのグローバル状態
let isApplyingServerUpdate = false;
let syncTimeoutId: number | null = null;
let currentAccountInfo: AccountInfo = {
  username: localStorage.getItem(USERNAME_KEY) || "",
  transferHash: localStorage.getItem(TRANSFER_HASH_KEY) || "",
  isSyncing: false,
  lastSyncedAt: null,
  syncError: null,
};

const listeners = new Set<(info: AccountInfo) => void>();

// 状態購読用の関数 (Reactコンポーネント用)
export function subscribeAccount(listener: (info: AccountInfo) => void) {
  listeners.add(listener);
  listener({ ...currentAccountInfo });
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  const copy = { ...currentAccountInfo };
  for (const listener of listeners) {
    listener(copy);
  }
}

export function getAccountInfo(): AccountInfo {
  return { ...currentAccountInfo };
}

function updateAccountInfo(updates: Partial<AccountInfo>) {
  currentAccountInfo = { ...currentAccountInfo, ...updates };
  if (updates.transferHash !== undefined) {
    if (updates.transferHash) {
      localStorage.setItem(TRANSFER_HASH_KEY, updates.transferHash);
    } else {
      localStorage.removeItem(TRANSFER_HASH_KEY);
    }
  }
  if (updates.username !== undefined) {
    if (updates.username) {
      localStorage.setItem(USERNAME_KEY, updates.username);
    } else {
      localStorage.removeItem(USERNAME_KEY);
    }
  }
  notifyListeners();
}

// ローカルの進捗データをオブジェクトに集約
export function getLocalProgress(): ProgressData {
  const progress: ProgressData = {};
  for (const key of SYNC_KEYS) {
    progress[key] = localStorage.getItem(key);
  }
  return progress;
}

// サーバーから取得した進捗データをローカルに反映
export function saveLocalProgress(progress: ProgressData): void {
  isApplyingServerUpdate = true;
  try {
    for (const key of SYNC_KEYS) {
      const val = progress[key];
      if (val !== undefined && val !== null) {
        localStorage.setItem(key, val);
      } else {
        localStorage.removeItem(key);
      }
    }
  } finally {
    isApplyingServerUpdate = false;
  }
}

// デバウンス同期のトリガー
export function triggerDebouncedSync() {
  if (!currentAccountInfo.transferHash) return;

  if (syncTimeoutId !== null) {
    clearTimeout(syncTimeoutId);
  }

  // 3秒間のデバウンスを挟んで同期
  syncTimeoutId = setTimeout(async () => {
    syncTimeoutId = null;
    await performSync();
  }, 3000) as unknown as number;
}

// 同期の実行
async function performSync() {
  const hash = currentAccountInfo.transferHash;
  if (!hash) return;

  updateAccountInfo({ isSyncing: true, syncError: null });

  try {
    const progress = getLocalProgress();
    const res = await fetch("/api/account/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transferHash: hash, progress }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Sync failed: ${res.statusText}`);
    }

    updateAccountInfo({
      isSyncing: false,
      lastSyncedAt: Date.now(),
      syncError: null,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Sync error:", err);
    updateAccountInfo({
      isSyncing: false,
      syncError: errMsg || "同期に失敗しました",
    });
  }
}

// アカウント作成 (APIコール)
async function createNewAccountOnServer(currentProgress: ProgressData): Promise<void> {
  updateAccountInfo({ isSyncing: true, syncError: null });
  try {
    const res = await fetch("/api/account/create", {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error(`Failed to create account: ${res.statusText}`);
    }

    const data = await res.json();
    updateAccountInfo({
      username: data.username,
      transferHash: data.transferHash,
    });

    // 既存のローカルデータがあれば、新しいアカウントとして即座に同期
    const hasData = Object.values(currentProgress).some(v => v !== null);
    if (hasData) {
      const syncRes = await fetch("/api/account/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferHash: data.transferHash, progress: currentProgress }),
      });
      if (syncRes.ok) {
        updateAccountInfo({ lastSyncedAt: Date.now() });
      }
    }

    updateAccountInfo({ isSyncing: false, syncError: null });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    updateAccountInfo({
      isSyncing: false,
      syncError: errMsg || "アカウント作成に失敗しました",
    });
  }
}

// アカウントの初期化・ロード処理
export async function initializeAccount(): Promise<void> {
  const hash = localStorage.getItem(TRANSFER_HASH_KEY);
  const localProgress = getLocalProgress();

  if (!hash) {
    // ハッシュが無ければ、新規作成してローカルデータをサーバーに同期
    await createNewAccountOnServer(localProgress);
    return;
  }

  // ハッシュがあれば、サーバーからデータを取得
  updateAccountInfo({ isSyncing: true, syncError: null });
  try {
    const res = await fetch(`/api/account/get?hash=${encodeURIComponent(hash)}`);
    if (res.status === 404) {
      // サーバー上で見つからない（TTLで消えた、または無効なハッシュ）
      console.warn("Account hash not found on server. Re-creating account while keeping local progress.");
      await createNewAccountOnServer(localProgress);
      return;
    }

    if (!res.ok) {
      throw new Error(`Load failed: ${res.statusText}`);
    }

    const data = await res.json();
    updateAccountInfo({
      username: data.username,
      transferHash: data.transferHash,
      lastSyncedAt: Date.now(),
    });

    // サーバーの進捗データをローカルに適用（マージ）
    if (data.progress) {
      saveLocalProgress(data.progress);
    }
    updateAccountInfo({ isSyncing: false, syncError: null });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Account initialization failed:", err);
    updateAccountInfo({
      isSyncing: false,
      syncError: errMsg || "アカウント読み込みに失敗しました",
    });
  }
}

// ユーザー名の変更
export async function changeUsername(newUsername: string): Promise<void> {
  const hash = currentAccountInfo.transferHash;
  if (!hash) throw new Error("アカウントが初期化されていません。");

  updateAccountInfo({ isSyncing: true });
  try {
    const res = await fetch("/api/account/update-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transferHash: hash, username: newUsername }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "ユーザー名変更に失敗しました");
    }

    const data = await res.json();
    updateAccountInfo({
      username: data.username,
      isSyncing: false,
      lastSyncedAt: Date.now(),
    });
  } catch (err: unknown) {
    updateAccountInfo({ isSyncing: false });
    throw err;
  }
}

// アカウントの復元（引き継ぎ）
export async function restoreAccount(hash: string): Promise<void> {
  const trimmedHash = hash.trim();
  if (!trimmedHash) throw new Error("ハッシュが空です。");

  updateAccountInfo({ isSyncing: true });
  try {
    const res = await fetch("/api/account/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transferHash: trimmedHash }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "アカウントが見つかりません。ハッシュを確認してください。");
    }

    const data = await res.json();

    // 成功したら、ローカル情報を更新してロードした進捗をローカルに適用
    updateAccountInfo({
      username: data.username,
      transferHash: trimmedHash,
      lastSyncedAt: Date.now(),
      isSyncing: false,
    });

    if (data.progress) {
      saveLocalProgress(data.progress);
    }
  } catch (err: unknown) {
    updateAccountInfo({ isSyncing: false });
    throw err;
  }
}

// ----------------------------------------------------
// localStorage へのモンキーパッチによる自動同期検知
// ----------------------------------------------------
if (typeof window !== "undefined") {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    originalSetItem.call(localStorage, key, value);
    // サーバー更新中以外、かつ同期対象キーが変更されたら同期をトリガー
    if (!isApplyingServerUpdate && SYNC_KEYS.includes(key)) {
      triggerDebouncedSync();
    }
  };

  const originalRemoveItem = localStorage.removeItem;
  localStorage.removeItem = function (key) {
    originalRemoveItem.call(localStorage, key);
    if (!isApplyingServerUpdate && SYNC_KEYS.includes(key)) {
      triggerDebouncedSync();
    }
  };
}
