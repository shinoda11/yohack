#!/usr/bin/env node
/**
 * YOHACK Backlog Runner (Node.js版)
 * BACKLOG.md を読んで Telegram 経由でタスクを Claude Code に実行させる
 *
 * 起動:
 *   node scripts/backlog-runner.mjs
 *
 * 環境変数 (PowerShell):
 *   $env:TELEGRAM_BOT_TOKEN="your_token"
 *   $env:TELEGRAM_CHAT_ID="your_chat_id"
 */

import { createRequire } from "module";
const _require = createRequire(import.meta.url);
import { readFileSync as _rfs } from "fs";
try { _rfs(new URL("../.env", import.meta.url), "utf-8").split("\n").forEach(l => { const [k,...v]=l.split("="); if(k?.trim()) process.env[k.trim()]=v.join("=").trim(); }); } catch {}

import { execSync, spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_DIR    = join(__dirname, "..");
const BACKLOG_FILE = join(REPO_DIR, "docs", "BACKLOG.md");
const TOKEN       = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID     = process.env.TELEGRAM_CHAT_ID;
const COMMIT_BATCH = 3;

// claude コマンドのパスを解決（Windows対応）
function findClaude() {
  try {
    return execSync("where claude", { encoding: "utf-8" }).split("\n")[0].trim();
  } catch {
    return "claude";
  }
}

const CLAUDE_CMD = findClaude();

// ── 起動チェック ────────────────────────────────────────────────────────────

if (!TOKEN || !CHAT_ID) {
  console.error("❌ 環境変数を設定してください:");
  console.error('   $env:TELEGRAM_BOT_TOKEN="your_token"');
  console.error('   $env:TELEGRAM_CHAT_ID="your_chat_id"');
  process.exit(1);
}

if (!existsSync(BACKLOG_FILE)) {
  console.error(`❌ BACKLOG.md が見つかりません: ${BACKLOG_FILE}`);
  process.exit(1);
}

// ── 状態管理 ────────────────────────────────────────────────────────────────

const state = {
  running: false,
  currentTask: null,
  completedCount: 0,
  offset: 0,
};

// ── BACKLOG.md パーサー ─────────────────────────────────────────────────────

function parseBacklog() {
  const content = readFileSync(BACKLOG_FILE, "utf-8");
  const pattern =
    /## (P\d+-\d+: .+?)\r?\nstatus: (\w+)\r?\npriority: (\d+)\r?\nestimate: (\w+)[\s\S]*?### instructions\r?\n```\r?\n([\s\S]*?)```/g;

  const tasks = [];
  let m;
  while ((m = pattern.exec(content)) !== null) {
    const [, fullTitle, status, priority, estimate, instructions] = m;
    const id    = fullTitle.split(":")[0].trim();
    const title = fullTitle.split(":").slice(1).join(":").trim();
    const trimmed = instructions.trim();
    console.log(`[parseBacklog] ${id}: status=${status}, instructions length=${trimmed.length}`);
    tasks.push({ id, title, status, priority: parseInt(priority), estimate, instructions: trimmed });
  }
  tasks.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  console.log(`[parseBacklog] Total tasks found: ${tasks.length}`);
  return tasks;
}

function getNextTodo() {
  return parseBacklog().find(t => t.status === "todo") || null;
}

function updateStatus(taskId, newStatus) {
  let content = readFileSync(BACKLOG_FILE, "utf-8");
  const escaped = taskId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  content = content.replace(
    new RegExp(`(## ${escaped}:.+?\\nstatus: )(\\w+)`, "s"),
    `$1${newStatus}`
  );
  writeFileSync(BACKLOG_FILE, content, "utf-8");
  console.log(`[Backlog] ${taskId} → ${newStatus}`);
}

// ── Git ヘルパー ────────────────────────────────────────────────────────────

function countUnpushed() {
  try {
    return parseInt(execSync("git rev-list --count origin/main..HEAD", { cwd: REPO_DIR }).toString().trim());
  } catch { return 0; }
}

function gitPush() {
  try {
    return execSync("git push origin main", { cwd: REPO_DIR }).toString();
  } catch (e) { return e.message; }
}

// ── Telegram API ────────────────────────────────────────────────────────────

function tgRequest(method, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: "api.telegram.org",
      path: `/bot${TOKEN}/${method}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
    }, res => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => resolve(JSON.parse(raw)));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function sendMessage(text, keyboard = null) {
  const body = { chat_id: CHAT_ID, text, parse_mode: "Markdown" };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  return tgRequest("sendMessage", body);
}

async function answerCallback(callbackQueryId) {
  return tgRequest("answerCallbackQuery", { callback_query_id: callbackQueryId });
}

function taskKeyboard(taskId) {
  return [
    [
      { text: "✅ 開始する",       callback_data: `start_${taskId}` },
      { text: "⏭️ スキップ",      callback_data: `skip_${taskId}` },
    ],
    [
      { text: "📋 バックログを見る", callback_data: "list_all" },
      { text: "📊 進捗確認",        callback_data: "show_progress" },
    ],
  ];
}

async function sendNextTaskPrompt(task) {
  const icon = { S: "⚡", M: "🔧", L: "🏗️" }[task.estimate] || "🔧";
  await sendMessage(
    `*次のタスク*\n\n\`${task.id}\` ${task.title}\n\n${icon} 規模: ${task.estimate}  |  優先度: P${task.priority}\n\n開始しますか？`,
    taskKeyboard(task.id)
  );
}

// ── Claude Code 実行 ────────────────────────────────────────────────────────

async function runClaude(task) {
  console.log(`[Claude] instructions length: ${task.instructions.length}`);
  console.log(`[Claude] instructions preview: ${task.instructions.substring(0, 100)}...`);
  const prompt = `あなたはYOHACKプロジェクトの開発者です。以下のタスクを実行してください。

# プロジェクト情報
- 技術スタック: Next.js 16, React 19, TypeScript, Zustand, Tailwind CSS, shadcn/ui
- カラーパレット: #C8B89A（ゴールド）, #5A5550（テキスト）, #FAF9F7（背景）

# タスク: ${task.id} - ${task.title}

${task.instructions}

# 注意事項
- git commit は指示通りに実行する
- pnpm build が通ることを必ず確認する
- 完了後は「✅ 完了:」で始まる1行サマリーを出力する`;

  return new Promise((resolve) => {
    console.log(`[Claude] Starting: ${task.id}`);
    console.log(`[Claude] Command: ${CLAUDE_CMD}`);
    const proc = spawn(
      CLAUDE_CMD,
      ["--dangerously-skip-permissions", "-p", prompt],
      {
        cwd: REPO_DIR,
        shell: true,
        windowsHide: false,
        env: { ...process.env },
      }
    );

    let output = "";
    proc.stdout.on("data", d => { output += d.toString(); process.stdout.write(d); });
    proc.stderr.on("data", d => { output += d.toString(); process.stderr.write(d); });

    const timeout = setTimeout(() => {
      proc.kill();
      resolve({ output: "⏰ タイムアウト（15分）", success: false });
    }, 15 * 60 * 1000);

    proc.on("close", code => {
      clearTimeout(timeout);
      resolve({ output: output.slice(-3000), success: code === 0 });
    });
  });
}

// ── タスク実行 ──────────────────────────────────────────────────────────────

async function executeTask(task) {
  const start = Date.now();
  try {
    const { output, success } = await runClaude(task);
    const elapsed = Math.round((Date.now() - start) / 1000);

    if (success) {
      updateStatus(task.id, "done");
      state.completedCount++;
    } else {
      updateStatus(task.id, "todo");
    }
    state.running = false;
    state.currentTask = null;

    const icon = success ? "✅" : "❌";
    await sendMessage(
      `${icon} *${task.id} ${success ? "完了" : "失敗"}*\n_${task.title}_\n⏱️ ${elapsed}秒\n\n\`\`\`\n${output.slice(-1500)}\n\`\`\``
    );

    if (!success) {
      await sendMessage("⚠️ タスクが失敗しました。/start で再試行するかスキップしてください。");
      return;
    }

    // N タスクごとに push
    const unpushed = countUnpushed();
    if (unpushed >= COMMIT_BATCH) {
      const pushOut = gitPush();
      await sendMessage(`📤 ${unpushed} コミットをプッシュしました\n\`\`\`\n${pushOut.slice(-300)}\n\`\`\``);
    }

    // 次のタスクを提示
    await new Promise(r => setTimeout(r, 2000));
    const next = getNextTodo();
    if (next) {
      await sendNextTaskPrompt(next);
    } else {
      await sendMessage(`🎉 *全バックログ完了！*\n\nこのセッションで ${state.completedCount} タスクを消化しました。\nお疲れ様でした！`);
    }
  } catch (err) {
    state.running = false;
    state.currentTask = null;
    updateStatus(task.id, "todo");
    await sendMessage(`❌ エラー\n\`\`\`\n${err.message.slice(-500)}\n\`\`\``);
  }
}

// ── メッセージ/コールバック処理 ─────────────────────────────────────────────

async function handleUpdate(update) {
  // /start コマンド or テキストメッセージ
  if (update.message) {
    const text = update.message.text || "";
    if (text.startsWith("/start") || text === "開始" || text === "次") {
      const task = getNextTodo();
      if (task) {
        await sendNextTaskPrompt(task);
      } else {
        await sendMessage("バックログにタスクがありません。BACKLOG.md を確認してください。");
      }
    } else if (text.startsWith("/status")) {
      if (state.running) {
        await sendMessage(`🔄 実行中: \`${state.currentTask.id}\` ${state.currentTask.title}`);
      } else {
        const unpushed = countUnpushed();
        await sendMessage(
          `✅ アイドル状態\n\n完了済み: ${state.completedCount} タスク\n未プッシュ: ${unpushed} コミット\n\n/start で次のタスクを表示します。`
        );
      }
    }
    return;
  }

  // インラインボタン
  if (update.callback_query) {
    const { id: cbId, data } = update.callback_query;
    await answerCallback(cbId);

    if (data === "list_all") {
      const tasks = parseBacklog();
      const icons = { todo: "⬜", running: "🔄", done: "✅", skip: "⏭️" };
      const lines = ["*YOHACK Backlog*\n",
        ...tasks.map(t => `${icons[t.status] || "❓"} \`${t.id}\` ${t.title}`)
      ];
      await sendMessage(lines.join("\n"));
      return;
    }

    if (data === "show_progress") {
      const tasks = parseBacklog();
      const done    = tasks.filter(t => t.status === "done").length;
      const todo    = tasks.filter(t => t.status === "todo").length;
      const skipped = tasks.filter(t => t.status === "skip").length;
      const pct     = Math.round(done / tasks.length * 100) || 0;
      const bar     = "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));
      await sendMessage(
        `*進捗状況*\n\n\`${bar}\` ${pct}%\n\n✅ 完了: ${done}  ⬜ 残り: ${todo}  ⏭️ スキップ: ${skipped}\n📤 未プッシュ: ${countUnpushed()} コミット`
      );
      return;
    }

    if (data.startsWith("skip_")) {
      const taskId = data.replace("skip_", "");
      updateStatus(taskId, "skip");
      await sendMessage(`⏭️ \`${taskId}\` をスキップしました`);
      const next = getNextTodo();
      if (next) await sendNextTaskPrompt(next);
      else await sendMessage("🎉 全タスク完了（またはスキップ済み）！");
      return;
    }

    if (data.startsWith("start_")) {
      if (state.running) {
        await sendMessage("⚠️ 別のタスクが実行中です。/status で確認してください。");
        return;
      }
      const taskId = data.replace("start_", "");
      const task   = parseBacklog().find(t => t.id === taskId);
      if (!task) { await sendMessage(`❌ タスク \`${taskId}\` が見つかりません`); return; }

      updateStatus(taskId, "running");
      state.running = true;
      state.currentTask = task;

      await sendMessage(`🚀 *${task.id}* 開始します\n${task.title}\n\n完了したら通知します ☕`);
      executeTask(task); // 非同期で実行（awaitしない）
      return;
    }
  }
}

// ── ポーリングループ ────────────────────────────────────────────────────────

async function poll() {
  while (true) {
    try {
      const res = await tgRequest("getUpdates", {
        offset: state.offset,
        timeout: 30,
        allowed_updates: ["message", "callback_query"],
      });

      if (res.ok && res.result.length > 0) {
        for (const update of res.result) {
          state.offset = update.update_id + 1;
          await handleUpdate(update).catch(err =>
            console.error("[Handler Error]", err.message)
          );
        }
      }
    } catch (err) {
      console.error("[Poll Error]", err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

// ── 起動 ───────────────────────────────────────────────────────────────────

console.log("🚀 YOHACK Backlog Runner 起動中...");
console.log(`📁 リポジトリ: ${REPO_DIR}`);
console.log(`📋 BACKLOG.md: ${BACKLOG_FILE}`);
console.log(`🤖 Claude CMD: ${CLAUDE_CMD}`);

const firstTask = getNextTodo();
console.log(`⏭️  次のタスク: ${firstTask ? `${firstTask.id} - ${firstTask.title}` : "なし"}`);

// 起動通知
sendMessage(
  `🤖 *YOHACK Backlog Runner 起動*\n\n次のタスク: \`${firstTask?.id || "なし"}\`\n\n/start で開始できます。`
).then(() => {
  console.log("✅ Telegram接続確認完了");
  console.log("📡 ポーリング開始...");
  poll();
}).catch(err => {
  console.error("❌ Telegram接続失敗:", err.message);
  console.error("トークンとChat IDを確認してください。");
  process.exit(1);
});
