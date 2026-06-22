import { useState, useEffect } from "react";
import { subscribeAccount, changeUsername, restoreAccount } from "../utils/accountSync";
import type { AccountInfo } from "../utils/accountSync";

export function AccountSettings() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showHash, setShowHash] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nameError, setNameError] = useState("");
  
  // 復元用ステート
  const [restoreHash, setRestoreHash] = useState("");
  const [restoreMessage, setRestoreMessage] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);

  useEffect(() => {
    // アカウントの変更を監視
    const unsubscribe = subscribeAccount((info) => {
      setAccount(info);
      setNewName(info.username);
    });
    return unsubscribe;
  }, []);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName === account?.username) {
      setIsEditingName(false);
      setNameError("");
      return;
    }

    setNameError("");
    try {
      await changeUsername(newName.trim());
      setIsEditingName(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setNameError(errMsg || "ユーザー名の変更に失敗しました。");
    }
  };

  const handleCopyHash = () => {
    if (!account?.transferHash) return;
    navigator.clipboard.writeText(account.transferHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    const hash = restoreHash.trim();
    if (!hash) {
      setRestoreMessage({ text: "ハッシュを入力してください。", type: "error" });
      return;
    }

    if (hash === account?.transferHash) {
      setRestoreMessage({ text: "現在と同じアカウントのハッシュです。", type: "error" });
      return;
    }

    setRestoreMessage({ text: "", type: "" });

    // 確認フェーズ
    if (!showConfirmRestore) {
      setShowConfirmRestore(true);
      return;
    }

    // 復元の実行
    try {
      await restoreAccount(hash);
      setRestoreMessage({ text: "アカウントの復元に成功しました。ページを再読み込みして進捗を反映します...", type: "success" });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setRestoreMessage({ text: errMsg || "アカウントの復元に失敗しました。ハッシュが正しいか確認してください。", type: "error" });
      setShowConfirmRestore(false);
    }
  };

  if (!account) {
    return (
      <div className="glass-panel" style={{ padding: "24px", textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>アカウント情報を読み込み中...</p>
      </div>
    );
  }

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return "未同期";
    return new Date(timestamp).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px", margin: "0 auto", width: "100%", padding: "10px" }}>
      
      {/* アカウント基本情報 */}
      <section className="glass-panel glow-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "12px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            👤 アカウント設定
          </h2>
          {account.isSyncing && (
            <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "4px" }}>
              <span className="sync-spinner" style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                border: "2px solid var(--accent-cyan)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
              同期中...
            </span>
          )}
        </div>

        {/* ユーザー名編集 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>ユーザー名</label>
          {isEditingName ? (
            <form onSubmit={handleUpdateName} style={{ display: "flex", gap: "8px", width: "100%" }}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={20}
                required
                style={{
                  flex: 1,
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid var(--border-glass-active)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "var(--text-primary)",
                  fontSize: "0.95rem",
                  outline: "none",
                }}
                autoFocus
              />
              <button
                type="submit"
                style={{
                  background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  color: "white",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 0 8px var(--accent-cyan-glow)",
                }}
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingName(false);
                  setNewName(account.username);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                キャンセル
              </button>
            </form>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0, 0, 0, 0.15)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>{account.username}</span>
              <button
                onClick={() => setIsEditingName(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-cyan)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(6, 182, 212, 0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                ✏️ 変更
              </button>
            </div>
          )}
          {nameError && (
            <span style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "4px", display: "block" }}>
              ⚠️ {nameError}
            </span>
          )}
        </div>

        {/* 同期ステータス */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "rgba(255, 255, 255, 0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>自動保存同期</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--success)", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--success)" }} />
              有効 (Deno KV)
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>最終同期時間</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>
              {formatTime(account.lastSyncedAt)}
            </span>
          </div>
        </div>

        {account.syncError && (
          <div style={{ padding: "10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--error)", borderRadius: "8px", color: "#fca5a5", fontSize: "0.8rem" }}>
            ⚠️ 同期エラー: {account.syncError}
          </div>
        )}
      </section>

      {/* アカウント引き継ぎ */}
      <section className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px" }}>
          🔄 別マシンへの引き継ぎ
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
          このマシンの学習進捗を別マシン（他のブラウザ）へ引き継ぐためのハッシュコードです。このコードは厳重に保管してください。
        </p>

        {/* ハッシュコード表示エリア */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>引き継ぎ用ハッシュコード</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{
              flex: 1,
              background: "rgba(0, 0, 0, 0.25)",
              border: "1px solid var(--border-glass)",
              borderRadius: "8px",
              padding: "10px 14px",
              fontFamily: "monospace",
              fontSize: "0.85rem",
              wordBreak: "break-all",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <span>{showHash ? account.transferHash : "••••••••-••••-••••-••••-••••••••••••"}</span>
              <button
                onClick={() => setShowHash(!showHash)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 0 }}
                title={showHash ? "非表示" : "表示"}
              >
                {showHash ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <button
              onClick={handleCopyHash}
              style={{
                background: copied ? "var(--success)" : "rgba(255,255,255,0.06)",
                border: "1px solid var(--border-glass)",
                borderRadius: "8px",
                width: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                color: copied ? "white" : "var(--text-primary)"
              }}
              title="コピー"
            >
              {copied ? "✓" : "📋"}
            </button>
          </div>
          {copied && <span style={{ fontSize: "0.75rem", color: "var(--success)", alignSelf: "flex-end" }}>クリップボードにコピーしました！</span>}
        </div>
      </section>

      {/* アカウント復元 */}
      <section className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px" }}>
          📥 アカウントの復元
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
          他マシンで発行した「引き継ぎ用ハッシュコード」を入力することで、そのマシンの進捗状況をこのブラウザに復元（統合）します。
        </p>

        <form onSubmit={handleRestore} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>復元ハッシュコードの入力</label>
            <input
              type="text"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={restoreHash}
              onChange={(e) => {
                setRestoreHash(e.target.value);
                setRestoreMessage({ text: "", type: "" });
                setShowConfirmRestore(false);
              }}
              disabled={showConfirmRestore && restoreMessage.type === "success"}
              style={{
                background: "rgba(0, 0, 0, 0.25)",
                border: "1px solid var(--border-glass)",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                fontFamily: "monospace",
                outline: "none",
              }}
            />
          </div>

          {restoreMessage.text && (
            <div style={{
              padding: "10px",
              background: restoreMessage.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${restoreMessage.type === "success" ? "var(--success)" : "var(--error)"}`,
              borderRadius: "8px",
              color: restoreMessage.type === "success" ? "#a7f3d0" : "#fca5a5",
              fontSize: "0.85rem",
            }}>
              {restoreMessage.text}
            </div>
          )}

          {showConfirmRestore && restoreMessage.type !== "success" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid var(--warning)", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--warning)", fontWeight: 600 }}>
                ⚠️ 警告: 復元を実行すると、このマシンの現在の学習データ（クイズ重み、解放タイプなど）はすべて上書きされ、失われます。よろしいですか？
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: "var(--error)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px",
                    color: "white",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 0 8px var(--error-glow)",
                  }}
                >
                  はい、上書き復元します
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmRestore(false)}
                  style={{
                    flex: 1,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "6px",
                    padding: "8px",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            restoreMessage.type !== "success" && (
              <button
                type="submit"
                disabled={!restoreHash.trim()}
                style={{
                  background: restoreHash.trim() ? "linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))" : "rgba(255,255,255,0.02)",
                  border: restoreHash.trim() ? "none" : "1px solid var(--border-glass)",
                  borderRadius: "8px",
                  padding: "10px",
                  color: restoreHash.trim() ? "white" : "var(--text-muted)",
                  fontWeight: 600,
                  cursor: restoreHash.trim() ? "pointer" : "not-allowed",
                  boxShadow: restoreHash.trim() ? "0 0 8px var(--accent-cyan-glow)" : "none",
                  transition: "all 0.2s"
                }}
              >
                アカウントデータを復元する
              </button>
            )
          )}
        </form>
      </section>

      {/* スピナーとキーフレームのCSSスタイル */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
