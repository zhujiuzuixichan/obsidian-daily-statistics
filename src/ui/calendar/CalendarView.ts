import { Notice, type IconName, ItemView, WorkspaceLeaf } from "obsidian";
import { createApp, type App as VueApp } from "vue";
import store from "@/data/Store";
import DailyStatisticsPlugin from "@/Index";
import {
  DailyStatisticsData,
  DailyStatisticsDataManagerInstance,
  type DailyStatisticsDataSaveListener,
  type DailyStatisticsDataSyncListener
} from "@/data/StatisticsDataManager";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import en from "element-plus/es/locale/lang/en";
import ElementPlus from "element-plus";
import i18n from "@/lang/index"; // 多语言引入
import VueIndex from "@/ui/calendar/VueIndex.vue";

export const Calendar_View = "CalendarView";

/* =========================================================================
 * 以下为魔改补充：月度/年度统计面板、自定义时间范围、文件明细。
 * 原版只把 Vue 日历挂载到 containerEl；这里改为挂载到 .ds-vue-host，
 * 并在月历下方追加一个 .ds-stats-panel（统计面板 + 文件明细）。
 * 相关样式见 styles.css 中 .ds-* 规则。
 * ========================================================================= */

function dsFormatNumber(e: number | string): string {
  const t = String(Math.round(Number(e) || 0));
  return t.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/* 日均值格式化：保留 1 位小数，整数则不带小数，整数部分加千分位 */
function dsFormatAvg(n: number): string {
  const v = Math.round(n * 10) / 10;
  const fixed = v.toFixed(1).replace(/\.0$/, "");
  const dot = fixed.indexOf(".");
  if (dot < 0) {
    return dsFormatNumber(fixed);
  }
  return dsFormatNumber(fixed.slice(0, dot)) + fixed.slice(dot);
}

function dsFileDelta(e: { current?: number; initial?: number } | undefined): number {
  const cur = Number(e && e.current) || 0;
  const ini = Number(e && e.initial) || 0;
  return Math.max(0, cur - ini);
}

function dsBaseNameOf(e: string | null | undefined): string {
  const s = String(e === null || e === undefined ? "" : e);
  const i = s.lastIndexOf("/");
  return i >= 0 ? s.slice(i + 1) : s;
}

function dsTodayKey(): string {
  const today = DailyStatisticsDataManagerInstance.today;
  if (today && typeof today === "string") {
    return today;
  }
  try {
    return dayjs().format("YYYY-MM-DD");
  } catch (e) {
    return "";
  }
}

interface DayFileMap {
  files: Record<string, number>;
  manual: number;
  live: boolean;
  known: boolean;
}

/* 取某一天的分文件数据：当天读实时数据，历史读 dayFiles 落盘数据 */
function dsDayFileMap(day: string): DayFileMap {
  const data = DailyStatisticsDataManagerInstance.data;
  const files: Record<string, number> = {};
  const out: DayFileMap = { files, manual: 0, live: false, known: false };

  if (day === dsTodayKey()) {
    const tw = data.todayWordCount || {};
    for (const p in tw) {
      if (!Object.prototype.hasOwnProperty.call(tw, p)) continue;
      const n = dsFileDelta(tw[p]);
      if (n > 0) files[p] = n;
    }
    out.live = true;
    out.known = true;
    out.manual = Number(data.currentManuallyModifyWordCount) || 0;
    return out;
  }

  const hist = data.dayFiles || {};
  if (Object.prototype.hasOwnProperty.call(hist, day)) {
    const src = hist[day] || {};
    for (const q in src) {
      if (!Object.prototype.hasOwnProperty.call(src, q)) continue;
      const m = Number(src[q]) || 0;
      if (m > 0) files[q] = m;
    }
    out.known = true;
  }
  return out;
}

function dsOpenFilePath(view: CalendarView, path: string): boolean {
  const app = view.app;
  if (!app || !app.vault) return false;
  const file = typeof app.vault.getFileByPath === "function" ? app.vault.getFileByPath(path) : null;
  if (!file) return false;
  if (app.workspace && typeof app.workspace.getLeaf === "function") {
    app.workspace.getLeaf(true).openFile(file);
    return true;
  }
  return false;
}

/* 只清掉本插件自己创建的节点，保留 Obsidian 的 view-header / view-content，
 * 避免每次打开时容器内节点数量/顺序变化导致月历位置跳动。 */
function dsClearViewNodes(container: HTMLElement) {
  if (!container || !container.children || !container.removeChild) return;
  const kids = Array.prototype.slice.call(container.children);
  for (let i = 0; i < kids.length; i++) {
    const el = kids[i];
    if (!el || !el.classList) continue;
    if (
      el.classList.contains("ds-vue-host") ||
      el.classList.contains("ds-stats-panel")
    ) {
      container.removeChild(el);
    }
  }
}

interface DsStatRow {
  label: HTMLElement;
  value: HTMLElement;
  alt: HTMLElement;
  unit: HTMLElement;
  row: HTMLElement;
}

interface DsStatsEls {
  today: DsStatRow;
  week: DsStatRow;
  month: DsStatRow;
  year: DsStatRow;
  weekAvg: DsStatRow;
  monthAvg: DsStatRow;
  yearAvg: DsStatRow;
  dayPeak: DsStatRow;
  weekPeak: DsStatRow;
  monthPeak: DsStatRow;
  yearPeak: DsStatRow;
  range: DsStatRow;
  startEl: HTMLInputElement;
  endEl: HTMLInputElement;
  detailRoot: HTMLElement;
  detailBody: HTMLElement;
  detailCount: HTMLElement;
  detailBtn: HTMLButtonElement;
  detailDate: HTMLInputElement;
}

export class CalendarView extends ItemView {

  _vueApp: VueApp | undefined;
  intervalId: number | null = null;

  private _dsEls: DsStatsEls | null = null;
  private _dsRange: { from: string; to: string } = { from: "", to: "" };
  private _dsDetailOpen = true;
  private _dsDetailDate = "";
  private _dsStatsUnsub: (() => void) | null = null;

  plugin: DailyStatisticsPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: DailyStatisticsPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return Calendar_View;
  }

  getDisplayText() {
    return "Daily statistics";
  }

  getIcon(): IconName {
    return "calendar-with-checkmark";
  }


  dailyStatisticsDataSaveListenerImpl = new class DailyStatisticsDataSaveListenerImpl
    implements DailyStatisticsDataSaveListener {
    onSave(data: DailyStatisticsData): void {
      store.commit("updateStatisticsData", data.dayCounts);
    }

    getListenerId(): string {
      return "DailyStatisticsDataSaveListenerImpl-CalendarView";
    }
  };

  dailyStatisticsDataSyncListenerImpl = new class DailyStatisticsDataSyncListenerImpl
    implements DailyStatisticsDataSyncListener {
    onSync(data: DailyStatisticsData): void {
      store.commit("updateStatisticsData", data.dayCounts);
      store.commit("updateWeeklyPlan", data.weeklyPlan);
    }

    getListenerId(): string {
      return "DailyStatisticsDataSyncListenerImpl-CalendarView";
    }
  };

  async onOpen() {

    const enablePlan = this.plugin.settings.enablePlan;
    store.commit("updateEnablePlan", enablePlan);
    store.commit("updateWeekStart", this.plugin.settings.weekStart);

    const locale = i18n.global.locale.value;
    if (locale == "zh_cn") {
      dayjs.locale("zh-cn", {
        weekStart: this.plugin.settings.weekStart
      });
    } else {
      dayjs.locale("en", {
        weekStart: this.plugin.settings.weekStart
      });
    }


    // 初始化数据
    const yearMon = dayjs().format("YYYY-MM");
    store.commit("updateMonth", yearMon);
    store.commit("updateStatisticsData", DailyStatisticsDataManagerInstance.data.dayCounts);
    store.commit("updateWeeklyPlan", DailyStatisticsDataManagerInstance.data.weeklyPlan);

  

    // 创建并挂载组件（挂到 .ds-vue-host，统计面板追加在其后）
    const _app = createApp(VueIndex);
    _app.config.globalProperties.$t = i18n.global.t;
    _app.use(store);
    _app.use(i18n);
    _app.use(ElementPlus, {
      locale: locale == "zh_cn" ? zhCn : en
    });
    this.dsMountVueApp(_app);
    this._vueApp = _app;


    // 当有数据更新时，更新日历视图
    DailyStatisticsDataManagerInstance.addDataSaveListener(this.dailyStatisticsDataSaveListenerImpl);
    DailyStatisticsDataManagerInstance.addDataSyncListener(this.dailyStatisticsDataSyncListenerImpl);

    const today = dayjs().format("YYYY-MM-DD");
    this.intervalId = setInterval(() => {
      // 检查日期是否为当天，如果不是，则重新创建视图
      if (dayjs().format("YYYY-MM-DD") !== today) {
        this.onClose();
        this.onOpen();
      }
    }, 1000 * 60 * 60);

  }

  async onClose() {
    this.dsDisposeStats();
    if (this._vueApp) {
      this._vueApp.unmount();
    }
    dsClearViewNodes(this.containerEl);

    DailyStatisticsDataManagerInstance.removeDataSaveListener(this.dailyStatisticsDataSaveListenerImpl);
    DailyStatisticsDataManagerInstance.removeDataSyncListener(this.dailyStatisticsDataSyncListenerImpl);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null; // 重置定时器 ID
    }

  }

  /* ---------------------------------------------------------------------
   * 以下为魔改补充的方法
   * ------------------------------------------------------------------- */

  dsResolveMonth(): string {
    try {
      const m = store.getters.month;
      if (m && typeof m === "string") return m;
    } catch (e) {
      /* ignore */
    }
    return dayjs().format("YYYY-MM");
  }

  dsSumDayCounts(from: string, to: string): { sum: number; days: number } {
    const table = DailyStatisticsDataManagerInstance.data.dayCounts || {};
    const a = dayjs(from);
    const b = dayjs(to);
    if (!a.isValid() || !b.isValid() || b.isBefore(a, "day")) {
      return { sum: 0, days: 0 };
    }
    const days = b.diff(a, "day") + 1;
    let sum = 0;
    let cur = a.startOf("day");
    let guard = 0;
    while ((cur.isBefore(b, "day") || cur.isSame(b, "day")) && guard < 4000) {
      const k = cur.format("YYYY-MM-DD");
      if (Object.prototype.hasOwnProperty.call(table, k)) sum += table[k] || 0;
      cur = cur.add(1, "day");
      guard++;
    }
    return { sum, days };
  }

  dsBuildStatsPanel(container: HTMLElement): HTMLElement {
    const self = this;
    const t = i18n.global.t;

    const mkRow = (parent: HTMLElement, extraCls?: string, unitText?: string): DsStatRow => {
      const row = parent.createDiv({
        cls: extraCls ? "ds-stats-row " + extraCls : "ds-stats-row",
      });
      const label = row.createSpan({ cls: "ds-stats-label" });
      const value = row.createSpan({ cls: "ds-stats-value" });
      const unit = row.createSpan({ cls: "ds-stats-unit", text: unitText ?? t("statsUnit") });
      const alt = row.createSpan({ cls: "ds-stats-alt" });
      return { label, value, alt, unit, row };
    };

    const panel = container.createDiv({ cls: "ds-stats-panel" });

    const fixed = panel.createDiv({ cls: "ds-stats-group" });
    const rToday = mkRow(fixed);
    const rWeek = mkRow(fixed);
    const rMonth = mkRow(fixed);
    const rYear = mkRow(fixed);

    const avgGroup = panel.createDiv({ cls: "ds-stats-group ds-stats-subgroup" });
    const rWeekAvg = mkRow(avgGroup, undefined, t("statsUnitPerDay"));
    const rMonthAvg = mkRow(avgGroup, undefined, t("statsUnitPerDay"));
    const rYearAvg = mkRow(avgGroup, undefined, t("statsUnitPerDay"));

    const peakGroup = panel.createDiv({ cls: "ds-stats-group ds-stats-subgroup" });
    const rDayPeak = mkRow(peakGroup);
    const rWeekPeak = mkRow(peakGroup);
    const rMonthPeak = mkRow(peakGroup);
    const rYearPeak = mkRow(peakGroup);

    /* 文件明细（可折叠，默认展开） */
    const detail = panel.createDiv({ cls: "ds-stats-group ds-detail is-open" });
    const detailHead = detail.createDiv({ cls: "ds-detail-head" });
    detailHead.setAttribute("title", t("fileBreakdownHint"));
    const detailBtn = detailHead.createEl("button", {
      cls: "ds-mini-btn ds-mini-btn-plain ds-detail-toggle",
      attr: { type: "button" },
    });
    detailHead.createSpan({ cls: "ds-detail-title", text: t("fileBreakdown") });
    const detailCount = detailHead.createSpan({ cls: "ds-detail-count" });
    const detailDate = detailHead.createEl("input", {
      cls: "ds-detail-date",
      attr: { type: "date" },
    });
    const detailBody = detail.createDiv({ cls: "ds-detail-body" });

    /* 自定义时间范围 */
    const range = panel.createDiv({ cls: "ds-stats-group ds-stats-range" });
    range.createDiv({ cls: "ds-stats-range-title", text: t("customRange") });
    const inputs = range.createDiv({ cls: "ds-stats-range-inputs" });
    const startEl = inputs.createEl("input", {
      cls: "ds-range-input",
      attr: { type: "date" },
    }) as HTMLInputElement;
    inputs.createSpan({ cls: "ds-range-sep", text: "→" });
    const endEl = inputs.createEl("input", {
      cls: "ds-range-input",
      attr: { type: "date" },
    }) as HTMLInputElement;
    const calcEl = inputs.createEl("button", {
      cls: "ds-mini-btn",
      text: t("rangeCalc"),
      attr: { type: "button" },
    });
    const clearBtn = inputs.createEl("button", {
      cls: "ds-mini-btn ds-mini-btn-plain",
      text: t("rangeClear"),
      attr: { type: "button" },
    });
    const rRange = mkRow(range, "ds-stats-range-result");

    this._dsEls = {
      today: rToday,
      week: rWeek,
      month: rMonth,
      year: rYear,
      weekAvg: rWeekAvg,
      monthAvg: rMonthAvg,
      yearAvg: rYearAvg,
      dayPeak: rDayPeak,
      weekPeak: rWeekPeak,
      monthPeak: rMonthPeak,
      yearPeak: rYearPeak,
      range: rRange,
      startEl,
      endEl,
      detailRoot: detail,
      detailBody,
      detailCount,
      detailBtn,
      detailDate,
    };
    this._dsRange = { from: "", to: "" };
    this._dsDetailOpen = true;
    this._dsDetailDate = "";

    detailBtn.addEventListener("click", () => {
      this._dsDetailOpen = this._dsDetailOpen === false;
      this.dsRenderFileBreakdown();
    });
    detailDate.addEventListener("change", () => {
      this._dsDetailDate = String(detailDate.value || "").trim();
      this.dsRenderFileBreakdown();
    });

    const onCalc = () => {
      const a = String(startEl.value || "").trim();
      const b = String(endEl.value || "").trim();
      if (!a || !b) {
        new Notice(t("rangeEmpty"));
        return;
      }
      if (dayjs(b).isBefore(dayjs(a), "day")) {
        new Notice(t("rangeInvalid"));
        return;
      }
      this._dsRange = { from: a, to: b };
      this.dsUpdateStatsPanel();
    };
    const onClear = () => {
      startEl.value = "";
      endEl.value = "";
      this._dsRange = { from: "", to: "" };
      this.dsUpdateStatsPanel();
    };

    calcEl.addEventListener("click", onCalc);
    clearBtn.addEventListener("click", onClear);

    return panel;
  }

  dsUpdateStatsPanel() {
    const e = this._dsEls;
    if (!e) return;
    const t = i18n.global.t;
    const table = DailyStatisticsDataManagerInstance.data.dayCounts || {};

    const now = dayjs();
    const todayKey = now.format("YYYY-MM-DD");
    const monthKey = now.format("YYYY-MM");
    const yearKey = now.format("YYYY");

    // 各周期已进行的天数（含今天）
    const weekElapsed = now.diff(now.startOf("week"), "day") + 1;
    const monthElapsed = now.date();
    const yearElapsed = now.diff(now.startOf("year"), "day") + 1;

    // 周期合计
    let sToday = 0;
    let sWeek = 0;
    let sMonth = 0;
    let sYear = 0;

    // 峰值聚合
    let dayPeak = 0;
    let dayPeakKey = "";
    const weekSum: Record<string, number> = {};
    const monthSum: Record<string, number> = {};
    const yearSum: Record<string, number> = {};

    for (const k in table) {
      if (!Object.prototype.hasOwnProperty.call(table, k)) continue;
      const v = Number(table[k]) || 0;
      const d = dayjs(k);
      if (!d.isValid()) continue;

      if (k === todayKey) sToday += v;
      if (d.isSame(now, "week")) sWeek += v;
      if (k.slice(0, 7) === monthKey) sMonth += v;
      if (k.slice(0, 4) === yearKey) sYear += v;

      if (v > dayPeak) {
        dayPeak = v;
        dayPeakKey = k;
      }

      const wk = d.startOf("week").format("YYYY-MM-DD");
      weekSum[wk] = (weekSum[wk] || 0) + v;
      const mk = k.slice(0, 7);
      monthSum[mk] = (monthSum[mk] || 0) + v;
      const yk = k.slice(0, 4);
      yearSum[yk] = (yearSum[yk] || 0) + v;
    }

    let weekPeak = 0;
    let weekPeakKey = "";
    for (const k in weekSum) {
      if (weekSum[k] > weekPeak) {
        weekPeak = weekSum[k];
        weekPeakKey = k;
      }
    }
    let monthPeak = 0;
    let monthPeakKey = "";
    for (const k in monthSum) {
      if (monthSum[k] > monthPeak) {
        monthPeak = monthSum[k];
        monthPeakKey = k;
      }
    }
    let yearPeak = 0;
    let yearPeakKey = "";
    for (const k in yearSum) {
      if (yearSum[k] > yearPeak) {
        yearPeak = yearSum[k];
        yearPeakKey = k;
      }
    }

    const weekAvg = weekElapsed > 0 ? sWeek / weekElapsed : 0;
    const monthAvg = monthElapsed > 0 ? sMonth / monthElapsed : 0;
    const yearAvg = yearElapsed > 0 ? sYear / yearElapsed : 0;

    const alt = (row: DsStatRow | null, text?: string) => {
      if (!row || !row.alt) return;
      if (text) {
        row.alt.setText(text);
        if (row.alt.style) row.alt.style.display = "";
      } else {
        row.alt.setText("");
        if (row.alt.style) row.alt.style.display = "none";
      }
    };

    // 周期合计
    e.today.label.setText(t("statsToday"));
    e.today.value.setText(dsFormatNumber(sToday));
    alt(e.today);
    e.week.label.setText(t("statsWeek"));
    e.week.value.setText(dsFormatNumber(sWeek));
    alt(e.week);
    e.month.label.setText(t("statsMonth") + "（" + monthKey + "）");
    e.month.value.setText(dsFormatNumber(sMonth));
    alt(e.month);
    e.year.label.setText(t("statsYear") + "（" + yearKey + "）");
    e.year.value.setText(dsFormatNumber(sYear));
    alt(e.year);

    // 日均输入
    e.weekAvg.label.setText(t("statsWeekAvg"));
    e.weekAvg.value.setText(dsFormatAvg(weekAvg));
    alt(e.weekAvg);
    e.monthAvg.label.setText(t("statsMonthAvg"));
    e.monthAvg.value.setText(dsFormatAvg(monthAvg));
    alt(e.monthAvg);
    e.yearAvg.label.setText(t("statsYearAvg"));
    e.yearAvg.value.setText(dsFormatAvg(yearAvg));
    alt(e.yearAvg);

    // 输入峰值
    e.dayPeak.label.setText(t("statsDayPeak"));
    e.dayPeak.value.setText(dsFormatNumber(dayPeak));
    alt(e.dayPeak, dayPeakKey || undefined);
    e.weekPeak.label.setText(t("statsWeekPeak"));
    e.weekPeak.value.setText(dsFormatNumber(weekPeak));
    alt(e.weekPeak, weekPeakKey || undefined);
    e.monthPeak.label.setText(t("statsMonthPeak"));
    e.monthPeak.value.setText(dsFormatNumber(monthPeak));
    alt(e.monthPeak, monthPeakKey || undefined);
    e.yearPeak.label.setText(t("statsYearPeak"));
    e.yearPeak.value.setText(dsFormatNumber(yearPeak));
    alt(e.yearPeak, yearPeakKey || undefined);

    const rg = this._dsRange || { from: "", to: "" };
    if (rg.from && rg.to) {
      const r = this.dsSumDayCounts(rg.from, rg.to);
      e.range.label.setText(
        t("rangeTotal") + "（" + rg.from + " ~ " + rg.to + "，" + r.days + t("rangeDaysSuffix") + "）"
      );
      e.range.value.setText(dsFormatNumber(r.sum));
      alt(e.range);
    } else {
      e.range.label.setText(t("rangeTotal"));
      e.range.value.setText("-");
      alt(e.range);
    }

    this.dsRenderFileBreakdown();
  }

  /* 渲染文件明细：列出指定日期各文件贡献的字数，按字数从多到少 */
  dsRenderFileBreakdown() {
    const e = this._dsEls;
    if (!e || !e.detailBody) return;
    const t = i18n.global.t;

    const open = this._dsDetailOpen !== false;
    if (e.detailRoot && e.detailRoot.classList) {
      if (open) e.detailRoot.classList.add("is-open");
      else e.detailRoot.classList.remove("is-open");
    }
    if (e.detailBtn) e.detailBtn.setText(open ? "▾" : "▸");

    const todayKey = dsTodayKey();
    const day = String(this._dsDetailDate || "").trim() || todayKey;
    if (e.detailDate && e.detailDate.value !== day) e.detailDate.value = day;

    const body = e.detailBody;
    if (typeof body.empty === "function") body.empty();
    while (body.firstChild) body.removeChild(body.firstChild);

    if (!open) return;

    const info = dsDayFileMap(day);
    const list: { path: string; n: number }[] = [];
    for (const p in info.files) {
      if (!Object.prototype.hasOwnProperty.call(info.files, p)) continue;
      list.push({ path: p, n: info.files[p] });
    }
    list.sort((a, b) => b.n - a.n || String(a.path).localeCompare(String(b.path)));

    let total = info.manual;
    for (const item of list) {
      const row = body.createDiv({ cls: "ds-detail-row" });
      row.setAttribute("title", item.path);
      row.createSpan({ cls: "ds-detail-name", text: dsBaseNameOf(item.path) });
      const slash = String(item.path).lastIndexOf("/");
      row.createSpan({
        cls: "ds-detail-dir",
        text: slash > 0 ? String(item.path).slice(0, slash + 1) : "",
      });
      row.createSpan({ cls: "ds-detail-value", text: dsFormatNumber(item.n) });
      row.addEventListener("click", () => {
        if (!dsOpenFilePath(this, item.path)) {
          new Notice(t("fileBreakdownMissing") + item.path);
        }
      });
      total += item.n;
    }

    if (info.manual) {
      const mrow = body.createDiv({ cls: "ds-detail-row ds-detail-manual" });
      mrow.createSpan({ cls: "ds-detail-name", text: t("fileBreakdownManual") });
      mrow.createSpan({ cls: "ds-detail-value", text: dsFormatNumber(info.manual) });
    }

    if (list.length === 0 && !info.manual) {
      body.createDiv({
        cls: "ds-detail-empty",
        text: info.known ? t("fileBreakdownEmpty") : t("fileBreakdownNone"),
      });
    }

    if (e.detailCount) {
      e.detailCount.setText(
        dsFormatNumber(total) + t("statsUnit") + " / " + list.length + " " + t("fileBreakdownFileCount")
      );
    }
  }

  dsMountVueApp(app: VueApp) {
    const c = this.containerEl;
    c.addClass("ds-view");
    dsClearViewNodes(c);
    const host = c.createDiv({ cls: "ds-vue-host" });
    app.mount(host);
    this.dsBuildStatsPanel(c);
    this.dsUpdateStatsPanel();
    if (store && typeof store.subscribe === "function") {
      this._dsStatsUnsub = store.subscribe(() => {
        this.dsUpdateStatsPanel();
      });
    }
  }

  dsDisposeStats() {
    if (this._dsStatsUnsub) {
      try {
        this._dsStatsUnsub();
      } catch (e) {
        /* ignore */
      }
      this._dsStatsUnsub = null;
    }
    this._dsEls = null;
  }

}
