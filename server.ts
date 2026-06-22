// server.ts
// Deno API Server for poke-learn accounts using Deno KV

const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365; // 1年（ミリ秒）
const PORT = 8000;

interface UserAccount {
  username: string;
  transferHash: string;
  progress: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

// データベースIDを動的に取得して接続
async function getKvInstance(): Promise<Deno.Kv> {
  if (Deno.env.get("DENO_DEPLOYMENT_ID")) {
    console.log("Running on Deno Deploy. Connecting to default KV.");
    return await Deno.openKv();
  }

  // 環境変数からデータベースIDを取得、無ければデフォルトの local
  let dbId = Deno.env.get("DENO_KV_DATABASE_ID");
  if (!dbId) {
    const branchEnv = Deno.env.get("DB_BRANCH");
    if (branchEnv) {
      dbId = `6721ce--${branchEnv}`;
    } else {
      // Gitの現在のブランチを取得してみる
      try {
        const useBranchDb = Deno.env.get("USE_BRANCH_DB") === "true";
        if (useBranchDb) {
          const command = new Deno.Command("git", {
            args: ["branch", "--show-current"],
            stdout: "piped",
            stderr: "piped",
          });
          const { code, stdout } = await command.output();
          if (code === 0) {
            const branch = new TextDecoder().decode(stdout).trim();
            if (branch) {
              dbId = `6721ce--${branch}`;
            }
          }
        }
      } catch {
        // Gitコマンドエラー時は無視してlocalへフォールバック
      }
    }
  }

  // 決定されたdbIdが無ければ固定でlocalにする
  if (!dbId) {
    dbId = "6721ce--local";
  }

  const dbUrl = `https://api.deno.com/v2/databases/${dbId}/connect`;
  console.log(`Attempting to connect to Deno KV: ${dbUrl}`);

  try {
    return await Deno.openKv(dbUrl);
  } catch (err) {
    console.error("Failed to connect to remote Deno KV. Falling back to local SQLite KV.", err);
    return await Deno.openKv();
  }
}

const kv = await getKvInstance();

// ランダムなユーザー名を生成
function generateRandomUsername(): string {
  const digits = Math.floor(1000 + Math.random() * 9000); // 4桁の数字
  return `Trainer-${digits}`;
}

// JSONレスポンスのヘルパー
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// OPTIONSリクエスト（CORSプリフライト）のハンドリング
function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// URLパターンの定義
const CREATE_PATTERN = new URLPattern({ pathname: "/api/account/create" });
const GET_PATTERN = new URLPattern({ pathname: "/api/account/get" });
const SYNC_PATTERN = new URLPattern({ pathname: "/api/account/sync" });
const UPDATE_NAME_PATTERN = new URLPattern({ pathname: "/api/account/update-username" });
const RESTORE_PATTERN = new URLPattern({ pathname: "/api/account/restore" });

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  const url = req.url;

  try {
    // 1. アカウント作成
    if (CREATE_PATTERN.test(url) && req.method === "POST") {
      const transferHash = crypto.randomUUID();
      const username = generateRandomUsername();
      const now = Date.now();

      const account: UserAccount = {
        username,
        transferHash,
        progress: {},
        createdAt: now,
        updatedAt: now,
      };

      // KVに保存（1年期限）
      await kv.set(["users", transferHash], account, { expireIn: ONE_YEAR_MS });
      console.log(`Created account for ${username} with hash ${transferHash}`);

      return jsonResponse({ username, transferHash, progress: account.progress });
    }

    // 2. アカウント取得 (GET)
    if (GET_PATTERN.test(url) && req.method === "GET") {
      const parsedUrl = new URL(url);
      const hash = parsedUrl.searchParams.get("hash");

      if (!hash) {
        return jsonResponse({ error: "Missing hash parameter" }, 400);
      }

      const result = await kv.get<UserAccount>(["users", hash]);
      if (!result.value) {
        return jsonResponse({ error: "Account not found" }, 404);
      }

      const account = result.value;
      account.updatedAt = Date.now();

      // TTLを延長して再保存
      await kv.set(["users", hash], account, { expireIn: ONE_YEAR_MS });
      console.log(`Retrieved account for ${account.username} and extended TTL`);

      return jsonResponse({
        username: account.username,
        transferHash: account.transferHash,
        progress: account.progress,
      });
    }

    // 3. 進捗同期
    if (SYNC_PATTERN.test(url) && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { transferHash, progress } = body;

      if (!transferHash || !progress) {
        return jsonResponse({ error: "Missing transferHash or progress" }, 400);
      }

      const result = await kv.get<UserAccount>(["users", transferHash]);
      if (!result.value) {
        return jsonResponse({ error: "Account not found" }, 404);
      }

      const account = result.value;
      account.progress = progress;
      account.updatedAt = Date.now();

      // 同期データを保存し、TTLを延長
      await kv.set(["users", transferHash], account, { expireIn: ONE_YEAR_MS });
      console.log(`Synced progress for ${account.username}`);

      return jsonResponse({ success: true, updatedAt: account.updatedAt });
    }

    // 4. ユーザー名変更
    if (UPDATE_NAME_PATTERN.test(url) && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { transferHash, username } = body;

      if (!transferHash || !username) {
        return jsonResponse({ error: "Missing transferHash or username" }, 400);
      }

      const trimmedName = String(username).trim();
      if (trimmedName.length === 0 || trimmedName.length > 20) {
        return jsonResponse({ error: "Invalid username length (1-20 chars)" }, 400);
      }

      const result = await kv.get<UserAccount>(["users", transferHash]);
      if (!result.value) {
        return jsonResponse({ error: "Account not found" }, 404);
      }

      const account = result.value;
      const oldName = account.username;
      account.username = trimmedName;
      account.updatedAt = Date.now();

      await kv.set(["users", transferHash], account, { expireIn: ONE_YEAR_MS });
      console.log(`Updated username from ${oldName} to ${trimmedName}`);

      return jsonResponse({ success: true, username: trimmedName });
    }

    // 5. アカウント復元
    if (RESTORE_PATTERN.test(url) && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { transferHash } = body;

      if (!transferHash) {
        return jsonResponse({ error: "Missing transferHash" }, 400);
      }

      const result = await kv.get<UserAccount>(["users", transferHash]);
      if (!result.value) {
        return jsonResponse({ error: "Account not found with provided hash" }, 404);
      }

      const account = result.value;
      account.updatedAt = Date.now();

      await kv.set(["users", transferHash], account, { expireIn: ONE_YEAR_MS });
      console.log(`Restored account for ${account.username} from hash ${transferHash}`);

      return jsonResponse({
        success: true,
        username: account.username,
        progress: account.progress,
      });
    }

    // パス不一致
    return jsonResponse({ error: "Not Found" }, 404);
  } catch (err) {
    console.error("Request handler error:", err);
    return jsonResponse({ error: "Internal Server Error" }, 500);
  }
}

console.log(`Deno API Server running at http://localhost:${PORT}/`);
Deno.serve({ port: PORT }, handler);
