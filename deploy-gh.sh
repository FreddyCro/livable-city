#!/usr/bin/env bash
#
# 產生靜態站台用的部署 branch。
#
# 支援三個部署目標：
#   staging    → branch staging，用 .env.ghpage.example（GitHub Pages）
#   nmdap      → branch nmdap，用 .env.nmdap.example（nmdap.udn.com.tw 測試機）
#   production → branch prod，用 .env.production.example（vip.udn.com 正式站）
#
# 流程：檢查資料 → 砍掉本地目標 branch → 從目前 HEAD 重開 → 套用對應環境變數
#       → generate → 把靜態輸出放到 docs/ → commit → force push
#       → 切回原分支並還原 .env。
#
# 用法：./deploy-gh.sh [staging|nmdap|production]
#       不帶參數會跳互動選單。
#
# .env 會在開始前備份、結束時還原（失敗中斷也會還原），不必手動複製回開發設定。

set -euo pipefail

DOCS_DIR="docs"

cd "$(dirname "$0")"

# 0. 選擇部署目標
TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  echo "==> 選擇部署目標："
  echo "    1) staging    (GitHub Pages)"
  echo "    2) nmdap      (nmdap.udn.com.tw)"
  echo "    3) production (vip.udn.com)"
  read -r -p "請輸入 1、2 或 3（或直接輸入名稱）： " choice
  case "$choice" in
    1|staging)         TARGET="staging" ;;
    2|nmdap)           TARGET="nmdap" ;;
    3|production|prod) TARGET="production" ;;
    *) echo "!!! 無效的選擇：${choice}"; exit 1 ;;
  esac
fi

case "$TARGET" in
  staging)
    BRANCH="staging"
    ENV_EXAMPLE=".env.ghpage.example"
    ;;
  nmdap)
    BRANCH="nmdap"
    ENV_EXAMPLE=".env.nmdap.example"
    ;;
  production|prod)
    TARGET="production"
    BRANCH="prod"
    ENV_EXAMPLE=".env.production.example"
    ;;
  *)
    echo "!!! 未知的部署目標：${TARGET}（可用：staging、nmdap、production）"
    exit 1
    ;;
esac

echo "==> 部署目標：${TARGET}（branch=${BRANCH}, env=${ENV_EXAMPLE}）"

if [ ! -f "$ENV_EXAMPLE" ]; then
  echo "!!! 找不到 ${ENV_EXAMPLE}，中止。"
  exit 1
fi

ORIGINAL_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "==> 目前分支：${ORIGINAL_BRANCH}"

if [ "$ORIGINAL_BRANCH" = "$BRANCH" ]; then
  echo "!!! 目前就在 ${BRANCH} 上，無法刪除自己所在的分支。請先切到其他分支再執行。"
  exit 1
fi

# 未 commit 的變更會一起被 build 進去，但 DATA_VERSION 取的是 HEAD 的 short SHA，
# 所以「改了 public/data 卻沒 commit」會用舊版號 → 回訪者吃到快取的舊資料。
if [ -n "$(git status --porcelain)" ]; then
  echo "!!! 工作目錄有未 commit 的變更，會一起被部署出去："
  git status --short
  echo "    注意：資料快取版號取自 HEAD 的 SHA，未 commit 的資料變更不會換版號。"
  read -r -p "仍要繼續？[y/N] " yn
  case "$yn" in
    y|Y|yes) ;;
    *) echo "==> 已取消"; exit 1 ;;
  esac
fi

# 1. 資料檢查（只警告不擋）
echo "==> 檢查來源資料（validate-sources）"
if ! node scripts/validate-sources.mjs; then
  echo "!!! 資料檢查有錯誤（見上方），仍繼續部署。"
fi

# 收尾：不論成功或中途失敗，都切回原分支並還原 .env。
ENV_BACKUP=""
if [ -f .env ]; then
  ENV_BACKUP="$(mktemp)"
  cp .env "$ENV_BACKUP"
fi

cleanup() {
  local status=$?
  if [ "$(git rev-parse --abbrev-ref HEAD)" != "$ORIGINAL_BRANCH" ]; then
    echo "==> 切回 ${ORIGINAL_BRANCH}"
    git checkout -q "$ORIGINAL_BRANCH" || echo "!!! 切回 ${ORIGINAL_BRANCH} 失敗，請手動處理。"
  fi
  # docs/ 只在部署 branch 上有追蹤，中途失敗時會留在工作目錄，順手清掉。
  if [ -d "$DOCS_DIR" ] && [ -z "$(git ls-files "$DOCS_DIR")" ]; then
    rm -rf "$DOCS_DIR"
  fi
  if [ -n "$ENV_BACKUP" ]; then
    mv "$ENV_BACKUP" .env
    echo "==> 已還原 .env"
  else
    rm -f .env
  fi
  if [ $status -ne 0 ]; then
    echo "!!! 部署失敗（exit ${status}）"
  fi
}
trap cleanup EXIT

# 2. 刪除 local 的目標 branch（不存在就跳過）
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  echo "==> 刪除本地分支 ${BRANCH}"
  git branch -D "$BRANCH"
else
  echo "==> 本地沒有 ${BRANCH}，略過刪除"
fi

# 3. 從目前 HEAD 建立並切換到目標 branch
echo "==> 建立並切換到 ${BRANCH}"
git checkout -b "$BRANCH"

# 4. 套用環境變數
# example 內含 NUXT_URL，nuxt.config.ts 會取它的 pathname 當 app.baseURL；
# 沒套的話 baseURL 是 /，子路徑部署下 _nuxt 資源會 404。
echo "==> 複製 ${ENV_EXAMPLE} → .env"
cp "$ENV_EXAMPLE" .env

# 5. 產生靜態檔
echo "==> pnpm generate"
pnpm generate

# 6. 把輸出複製到 docs/
# Nuxt 4 的靜態輸出在 .output/public，dist/ 只是指向它的 symlink，
# 直接複製 symlink 會把連結本身複製過去，所以優先用實體目錄。
if [ -d ".output/public" ]; then
  BUILD_DIR=".output/public"
elif [ -d "dist" ]; then
  BUILD_DIR="dist"
else
  echo "!!! 找不到建置輸出（.output/public 或 dist），中止。"
  exit 1
fi
echo "==> 從 ${BUILD_DIR} 複製到 ${DOCS_DIR}/"

rm -rf "$DOCS_DIR"
mkdir -p "$DOCS_DIR"
cp -R "${BUILD_DIR}/." "$DOCS_DIR/"

# GitHub Pages 預設走 Jekyll，會忽略底線開頭的目錄（Nuxt 的 _nuxt/ 首當其衝），
# 放 .nojekyll 才會原樣提供靜態檔。
touch "${DOCS_DIR}/.nojekyll"

# 7. commit（只 commit docs/，其他未 commit 的變更原樣帶回原分支）
echo "==> commit"
git add -f "$DOCS_DIR"
if git diff --cached --quiet; then
  echo "==> 沒有變更，略過 commit"
else
  git commit -m "deploy: ${TARGET}"
fi

# 8. force push
echo "==> force push ${BRANCH}"
git push -f origin "$BRANCH"

echo "==> 完成。已推送 ${BRANCH}，將切回 ${ORIGINAL_BRANCH}"
