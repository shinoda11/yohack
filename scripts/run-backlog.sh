#!/bin/bash
# scripts/run-backlog.sh
# バックログを1件ずつ消化する。
# 成功時: 自動マーク＋次のタスクへ自動進行
# 失敗時: Telegram通知＋スキップして次のタスクへ自動進行
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKLOG="$PROJECT_ROOT/docs/product-backlog.md"
LOG="$PROJECT_ROOT/docs/snapshot/run-log.txt"
ENV_FILE="$PROJECT_ROOT/.env"

log() { echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG"; }

# ── Telegram送信 ───────────────────────────────────────────────
telegram_send() {
  local msg="$1"
  local token="${TELEGRAM_BOT_TOKEN:-}"
  local chat_id="${TELEGRAM_CHAT_ID:-}"

  # .env からロード（未設定時のフォールバック）
  if [ -z "$token" ] || [ -z "$chat_id" ]; then
    if [ -f "$ENV_FILE" ]; then
      # shellcheck disable=SC1091
      source "$ENV_FILE"
      token="${TELEGRAM_BOT_TOKEN:-$token}"
      chat_id="${TELEGRAM_CHAT_ID:-$chat_id}"
    fi
  fi

  if [ -z "$token" ] || [ -z "$chat_id" ]; then
    log "⚠️ Telegram未設定。メッセージ: $msg"
    return 0
  fi

  curl -s -X POST "https://api.telegram.org/bot${token}/sendMessage" \
    -d chat_id="$chat_id" \
    -d text="$msg" \
    -d parse_mode="Markdown" > /dev/null
}

# ── タスク抽出 ─────────────────────────────────────────────────
get_next_task() {
  # status: [ ] を含む最初のタスクブロックを抽出
  # 1. **status:** [ ] がある行番号を取得
  local status_line
  status_line=$(grep -n '^\*\*status:\*\* \[ \]' "$BACKLOG" | head -1 | cut -d: -f1)
  [ -z "$status_line" ] && return

  # 2. その行より上にある直近の ### [ID] 行を探す（タスクヘッダー）
  local header_line
  header_line=$(sed -n "1,${status_line}p" "$BACKLOG" | grep -n '^### \[' | tail -1 | cut -d: -f1)
  [ -z "$header_line" ] && return

  # 3. タスクIDを抽出
  local task_id
  task_id=$(sed -n "${header_line}p" "$BACKLOG" | sed 's/^### \[\([A-Za-z0-9_-]*\)\].*/\1/')

  # 4. タスクブロックの終端を探す（次の ### または --- または EOF）
  local total_lines
  total_lines=$(wc -l < "$BACKLOG")
  local end_line
  end_line=$(sed -n "$((header_line+1)),${total_lines}p" "$BACKLOG" | grep -n '^\(### \|---\)' | head -1 | cut -d: -f1)
  if [ -n "$end_line" ]; then
    end_line=$((header_line + end_line - 1))
  else
    end_line=$total_lines
  fi

  # 5. 末尾の空行を除去してブロックを出力
  local body
  body=$(sed -n "${header_line},${end_line}p" "$BACKLOG" | sed -e :a -e '/^[[:space:]]*$/{ $d; N; ba; }')

  echo "TASK_ID=${task_id}"
  echo "TASK_BODY<<HEREDOC"
  echo "$body"
  echo "HEREDOC"
}

# ── タスクを完了マーク ──────────────────────────────────────────
mark_done() {
  local task_id="$1"
  # ### [task_id] の行番号を探す
  local header_line
  header_line=$(grep -n "^### \[${task_id}\]" "$BACKLOG" | head -1 | cut -d: -f1)
  [ -z "$header_line" ] && return

  # そのタスクブロック内の **status:** [ ] を [x] に置換
  local total_lines
  total_lines=$(wc -l < "$BACKLOG")
  local status_line
  status_line=$(sed -n "${header_line},${total_lines}p" "$BACKLOG" | grep -n '^\*\*status:\*\* \[ \]' | head -1 | cut -d: -f1)
  [ -z "$status_line" ] && return

  local target_line=$((header_line + status_line - 1))
  sed -i "${target_line}s/\\*\\*status:\\*\\* \\[ \\]/**status:** [x]/" "$BACKLOG"
  log "✅ ${task_id} を完了マーク"
}

# ── メインループ ────────────────────────────────────────────────
main() {
  log "🚀 バックログランナー起動"
  telegram_send "🚀 *YOHACK バックログランナー起動*"

  while true; do
    # 次のタスクを取得
    task_info=$(get_next_task)
    if [ -z "$task_info" ]; then
      msg="🎉 *バックログ全タスク完了！*"
      log "$msg"
      telegram_send "$msg"
      break
    fi

    eval "$task_info"
    log "📋 次のタスク: $TASK_ID"

    # タスクをClaudeに渡して実行
    log "▶️  $TASK_ID 実行開始"
    telegram_send "⏳ *[$TASK_ID] 実行中...*"

    # Claude Code にタスクを投げる（ヘッドレスモード）
    claude --dangerously-skip-permissions -p "
## 実行指示

以下のタスクを実行してください。

**重要なルール:**
1. まず対象ファイルを全て読む
2. 指示書の「意図」と「完了条件」を把握する
3. Before/Afterコードは参考であり、実際のコードを読んで現状に合わせて実装すること
4. ファイルが見つからない場合は grep で探すこと
5. pnpm build と pnpm test を実行して成功を確認
6. git add . && git commit -m 'feat: $TASK_ID' && git push を実行
7. 最後に1行で「完了: $TASK_ID / 変更ファイル: xxx / テスト: NNN passed」と出力

---

$TASK_BODY
" 2>&1 | tee -a "$LOG"

    exit_code=${PIPESTATUS[0]}

    if [ $exit_code -eq 0 ]; then
      # 成功: 自動マーク＋次のタスクへ自動進行
      mark_done "$TASK_ID"
      git add docs/product-backlog.md
      git commit -m "chore: mark $TASK_ID done in backlog" >> "$LOG" 2>&1 || true
      git push >> "$LOG" 2>&1 || true
      telegram_send "✅ *[$TASK_ID] 完了* → 次のタスクへ自動進行"
      log "✅ $TASK_ID 完了 → 次へ"
    else
      # 失敗: Telegram通知＋スキップして次へ
      telegram_send "⚠️ *[$TASK_ID] エラー発生* → スキップして次のタスクへ

ログ: docs/snapshot/run-log.txt"
      log "⚠️ $TASK_ID 失敗 → スキップして次へ"
    fi
  done
}

main
