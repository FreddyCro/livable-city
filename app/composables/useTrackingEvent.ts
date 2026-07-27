// GA（GA4 / gtag）事件發送。
// 100% 對齊參考專案（the-love-report / leo-vis）的 sendGA 機制：
//   gtag('event', action, { event_category: category, [category]: label })
// 呼叫慣例：category 固定 'term'、label = 連結文字（＝事件表的 term）。
// 依規格不另外送 area（與 reference 一致；事件表的 area 為分區文件用途）。

// ref: https://support.google.com/analytics/answer/11150547?hl=zh-Hant
// ref: https://developers.google.com/analytics/devguides/migration/measurement/events?hl=zh-tw#analytics.js-ua
declare global {
  interface Window {
    ga: any;
    gtag: any;
  }
}

type GAEvent = {
  category: string;
  action: string;
  label: string;
};

function sendGA({ category, action, label }: GAEvent) {
  if (typeof window === 'undefined') {
    return console.error('GA not ready');
  }
  if (!category || !action || !label) {
    return console.error('GA event missing params');
  }

  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      [category]: label,
    });
  }

  if (window.ga) {
    window.ga('send', {
      hitType: 'event',
      eventCategory: category,
      eventAction: action,
      eventLabel: label,
    });
  }
}

// 縣市選單點擊（stage1）；label = 縣市名
function gaClickCity(label: string) {
  sendGA({ action: 'click_city', category: 'term', label });
}

// 鄉鎮市區選單點擊（stage1）；label = 鄉鎮市區名
function gaClickDistrict(label: string) {
  sendGA({ action: 'click_district', category: 'term', label });
}

// 居住條件選項點擊（stage2 / result）；label = 條件文字
function gaClickOption(label: string) {
  sendGA({ action: 'click_option', category: 'term', label });
}

// 展開類互動（現居地區資訊 / 結果列表 / 資訊卡片 / 條件選單）；label = 區塊名稱
function gaClickOpen(label: string) {
  sendGA({ action: 'click_open', category: 'term', label });
}

// 一般按鈕（下一步 / 查看結果 / 資料說明 / 重選地區 / 城市戰力 / 最新報導…）；label = 按鈕文字
function gaClickBtn(label: string) {
  sendGA({ action: 'click_btn', category: 'term', label });
}

export default () => {
  return {
    sendGA,
    gaClickCity,
    gaClickDistrict,
    gaClickOption,
    gaClickOpen,
    gaClickBtn,
  };
};
