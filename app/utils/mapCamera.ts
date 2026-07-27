// 地圖相機（camera）行為設定：集中所有 zoom / translate / 動畫 / 延遲的可調數值。
//
// 這裡只放「數字」與其語意，不含任何 deck.gl 邏輯；地圖引擎（useTaiwanMap）與
// 轉場編排（app.vue）都從這份 config 讀值。要調整鏡頭手感時只改這個檔案即可，
// 不必碰引擎程式碼。各段對照關係見下方註解。

export interface MapCameraConfig {
  /** 初始 / 全台總覽視角與 controller 縮放邊界 */
  view: {
    longitude: number
    latitude: number
    zoom: number
    minZoom: number
    maxZoom: number
  }
  /** 水平微調：右側留白把焦點像素往左推，修正聚焦/初始畫面偏右的感覺 */
  nudge: {
    /** 桌機/平板套用的右側 padding（px）；手機歸零 */
    x: number
    /** ≤ 此寬度（px）視為手機（無 sidebar、地圖全幅），微調歸零 */
    narrowMaxWidth: number
    /**
     * 手機專用：底部 padding（px），把聚焦點往上推（內容約往上移 mobileBottom/2 px），
     * 避免 zoom in 的鄉鎮被下方資訊圖卡擋住（PM_FEEDBACK3 A3）。桌機/平板為 0。
     */
    mobileBottom: number
  }
  /** 飛行動畫：flyToCounty / flyToTaiwan / focusTown 共用 */
  fly: {
    /** 動畫時長（ms） */
    duration: number
    /** FlyToInterpolator 飛行速度 */
    speed: number
  }
  /** 飛入某縣市（step 1→2） */
  county: {
    zoomMin: number
    zoomMax: number
    /** zoom = floor(log2(extentBase / bbox 範圍))；越大越近 */
    extentBase: number
  }
  /** 飛入單一鄉鎮（focusTown：選結果卡片 / step 2→3 有結果） */
  town: {
    zoomMin: number
    zoomMax: number
    /** zoom = floor(log2(extentBase / bbox 範圍))；越大越近 */
    extentBase: number
  }
  /** step 3 縮放鈕（＋ / −，zoomBy） */
  zoomButton: {
    /** 每次縮放幅度倍率：實際 delta = 傳入 delta × factor（放慢按鈕縮放） */
    factor: number
    zoomMin: number
    zoomMax: number
  }
  /** step 轉場後延遲飛鏡頭：等 PUSH 轉場起始後再飛，避免 deck setProps 卡住轉場頭幾幀 */
  transitionDelay: {
    ms: number
  }
}

export const MAP_CAMERA: MapCameraConfig = {
  view: {
    longitude: 120.9,
    latitude: 23.6,
    zoom: 6,
    minZoom: 5,
    maxZoom: 14,
  },
  nudge: {
    x: 360,
    narrowMaxWidth: 767.98,
    mobileBottom: 160,
  },
  fly: {
    duration: 800,
    speed: 1.5,
  },
  county: {
    zoomMin: 7,
    zoomMax: 12,
    extentBase: 100,
  },
  town: {
    zoomMin: 9,
    zoomMax: 13,
    extentBase: 100,
  },
  zoomButton: {
    factor: 0.5,
    zoomMin: 5,
    zoomMax: 14,
  },
  transitionDelay: {
    ms: 320,
  },
}
