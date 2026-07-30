---
name: visual-video-oversized-todo
description: 待辦：step1 主視覺 mp4 三支各約 12.4MB／10 秒（≈10Mbps）明顯過大，需重壓
metadata:
  type: project
---

`public/img/livable_city_map_bg_{mob,pad,pc}.mp4` 三支各 **約 12.4MB / 10 秒 ≈ 10 Mbps**，
但同內容的 webm 只有 0.6–0.9MB（差約 20 倍）。mp4 是 Adobe（encoder 寫 Mainconcept）直出、
幾乎沒壓；規格本身沒問題（H.264 avc1 Main@4.1、moov 在前可漸進播放、無音軌、720×1280 /
1024×1364 / 1500×900）。

**Why**：2026-07-30 追「iOS/macOS Safari 主視覺不自動播放」時量到的。這不是當時的主因
（主因見 [[../architecture/gotchas.md]] 的 video 章節：webm 選中後無 fallback + autoplay 被擋不重試，
已修），但弱網下第一幀要等很久、畫面上就只有 poster，體驗仍然差；而且 `onVisualEnded` 每輪
loop 都會 seek 回 4s，等於每輪都要新的 range 請求。

**How to apply**：這種背景動畫 1–2 Mbps 綽綽有餘，重壓後檔案可小一個量級。重壓完可以順便
考慮把 `<source>` 簡化成 mp4 優先（目前為了不讓桌機 Chrome 從 0.9MB 變 12MB，才維持
webm 在前 + JS error fallback 的較複雜寫法）。三支斷點檔都要一起處理。
