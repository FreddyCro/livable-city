import meta from '@/locales/meta.json';

export function detectMob() {
  // 在 server-side 或沒有 navigator 時避免存取 undefined
  if (typeof navigator === 'undefined' || typeof navigator.userAgent !== 'string') {
    return false;
  }
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
}

// 以下三行，請根據每個專案的 meta 自行調整
const metaTitle = meta.metaTitle;
const metaDescription = meta.metaDesc;
const metaURL = meta.metaURL;

const encodeTitle = encodeURI(metaTitle);
const encodeDescription = encodeURI(metaDescription);
const encodeUrl = encodeURI(metaURL);
const shareText = `${encodeTitle}%0D%0A%0D%0A${encodeDescription}`;

export const shareURL_line = detectMob()
  ? `https://line.naver.jp/R/msg/text/?${encodeUrl}`
  : `https://social-plugins.line.me/lineit/share?url=${encodeUrl}`;

export const shareURL_fb = `https://www.facebook.com/dialog/share?app_id=1010324812347164&display=popup&href=${encodeUrl}&redirect_uri=${encodeUrl}`;

export const shareURL_twitter = `https://twitter.com/intent/tweet/?text=${shareText}%0D%0A%0D%0A${encodeUrl}`;

export default {
  detectMob,
  shareURL_fb,
  shareURL_line,
  shareURL_twitter,
};
