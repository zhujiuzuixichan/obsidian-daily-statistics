import { App, PluginSettingTab, Setting } from "obsidian";
import DailyStatisticsPlugin from "@/Index";
import { DailyStatisticsDataManagerInstance } from "@/data/StatisticsDataManager";
import dayjs from "dayjs";
import i18n from "@/lang";

import store from "@/data/Store";

/**
 * 设置页面
 */
export class SampleSettingTab extends PluginSettingTab {
  plugin: DailyStatisticsPlugin;

  constructor(app: App, plugin: DailyStatisticsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const t = i18n.global.t;
    containerEl.empty();

    new Setting(containerEl)
      .setName(t("statisticalDataStorageAddress"))
      .setDesc(t("statisticalDataStorageAddressExplained"))
      .addText((text) =>
        text.setValue(this.plugin.settings.dataFile).onChange(async (value) => {
          this.plugin.settings.dataFile = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(t("statisticsFolder"))
      .setDesc(t("statisticsFolderExplained"))
      .addText((text) =>
        text
          .setPlaceholder(t("all"))
          .setValue(this.plugin.settings.statisticsFolder)
          .onChange(async (value) => {
            this.plugin.settings.statisticsFolder = value;
            await this.plugin.saveSettings();
          })
      );

    // 排除目录改为勾选库中子文件夹
    this.buildExcludeFolderPicker(containerEl, t);

    // 防复制粘贴开关 + 阈值
    this.buildPasteProtectionSetting(containerEl, t);

      new Setting(containerEl)
      .setName(t("statisticsWord"))
      .setDesc(t("statisticsWordExplained"))
      .addToggle((component) =>
        component
          .setValue(this.plugin.settings.statisticsWord)
          .onChange(async (value) => {
            this.plugin.settings.statisticsWord = value;
            await this.plugin.saveSettings();
            // 将当日的统计数据重置
            DailyStatisticsDataManagerInstance.resetCurrentDayStatistics()
          })
      );


    new Setting(containerEl)
      .setName(t("enablePlan"))
      .setDesc(t("enablePlanExplained"))
      .addToggle((component) =>
        component
          .setValue(this.plugin.settings.enablePlan)
          .onChange(async (value) => {
            this.plugin.settings.enablePlan = value;
            await this.plugin.saveSettings();
            store.commit("updateEnablePlan", value);
          })
      );



    new Setting(containerEl)
      .setName(t("weekStart"))
      .setDesc(t("weekStartExplained"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("0", t("weekStartOptions0"))
          .addOption("1", t("weekStartOptions1")) 
          .addOption("2", t("weekStartOptions2"))
          .addOption("3", t("weekStartOptions3"))
          .addOption("4", t("weekStartOptions4"))
          .addOption("5", t("weekStartOptions5"))
          .addOption("6", t("weekStartOptions6"))
          .setValue(this.plugin.settings.weekStart.toString())
          .onChange(async (value) => {
            this.plugin.settings.weekStart = parseInt(value);
            await this.plugin.saveSettings();
            store.commit("updateWeekStart", parseInt(value));

            // 更新 dayjs.js 配置
            const locale = dayjs.locale();
            if (locale == "zh_cn") {
              dayjs.locale("zh-cn", {
                weekStart: this.plugin.settings.weekStart
              });
            } else {
              dayjs.locale("en", {
                weekStart: this.plugin.settings.weekStart
              });
            }


          })
      );
  }

  /**
   * 排除目录：勾选库中子文件夹（替代原来的逗号分隔文本输入）
   */
  private buildExcludeFolderPicker(containerEl: HTMLElement, t: (key: string) => string) {
    const plugin = this.plugin;
    const selected: Record<string, boolean> = {};
    const norm = (e: string | null | undefined): string[] =>
      String(e == null ? "" : e)
        .split(",")
        .map((x) => x.trim().replace(/\/+$/, ""))
        .filter((x) => x !== "" && x !== "/");
    norm(plugin.settings.excludeFolder).forEach((p) => {
      selected[p] = true;
    });

    let all: any[] = [];
    try {
      all = this.app.vault.getAllLoadedFiles() || [];
    } catch (e) {
      all = [];
    }
    const folders = all
      .filter(
        (f) => f && f.children && typeof f.path === "string" && f.path !== "" && f.path !== "/"
      )
      .map((f) => f.path as string)
      .sort((a: string, b: string) => a.localeCompare(b));

    const wrap = containerEl.createDiv({ cls: "ds-folder-picker" });
    const head = wrap.createDiv({ cls: "ds-folder-picker-head" });
    head.createSpan({ cls: "ds-folder-picker-hint", text: t("excludeFolderHint") });
    const allBtn = head.createEl("button", {
      cls: "ds-mini-btn",
      text: t("excludeFolderAll"),
      attr: { type: "button" },
    });
    const noneBtn = head.createEl("button", {
      cls: "ds-mini-btn ds-mini-btn-plain",
      text: t("excludeFolderNone"),
      attr: { type: "button" },
    });
    const filterEl = wrap.createEl("input", {
      cls: "ds-folder-filter",
      attr: { type: "text", placeholder: t("excludeFolderFilter") },
    }) as HTMLInputElement;
    const list = wrap.createDiv({ cls: "ds-folder-list" });
    const rows: { path: string; row: HTMLElement; cb: HTMLInputElement }[] = [];

    const save = () => {
      const out = folders.filter((p) => !!selected[p]);
      plugin.settings.excludeFolder = out.join(",");
      plugin.saveSettings();
    };

    if (folders.length === 0) {
      list.createDiv({ cls: "ds-folder-empty", text: t("excludeFolderEmpty") });
    }

    folders.forEach((p) => {
      const depth = p.split("/").length - 1;
      const row = list.createDiv({ cls: "ds-folder-item" });
      row.style.paddingLeft = 8 + depth * 14 + "px";
      const cb = row.createEl("input", {
        cls: "ds-folder-check",
        attr: { type: "checkbox" },
      }) as HTMLInputElement;
      cb.checked = !!selected[p];
      row.createSpan({ cls: "ds-folder-name", text: p });
      cb.addEventListener("change", () => {
        if (cb.checked) selected[p] = true;
        else delete selected[p];
        save();
      });
      rows.push({ path: p, row, cb });
    });

    allBtn.addEventListener("click", () => {
      folders.forEach((p) => {
        selected[p] = true;
      });
      rows.forEach((r) => {
        r.cb.checked = true;
      });
      save();
    });
    noneBtn.addEventListener("click", () => {
      Object.keys(selected).forEach((k) => delete selected[k]);
      rows.forEach((r) => {
        r.cb.checked = false;
      });
      save();
    });
    filterEl.addEventListener("input", () => {
      const q = String(filterEl.value || "").trim().toLowerCase();
      rows.forEach((r) => {
        r.row.style.display =
          q === "" || r.path.toLowerCase().indexOf(q) >= 0 ? "" : "none";
      });
    });

    return wrap;
  }

  /**
   * 防复制粘贴：开关 + 阈值
   */
  private buildPasteProtectionSetting(containerEl: HTMLElement, t: (key: string) => string) {
    const plugin = this.plugin;
    new Setting(containerEl)
      .setName(t("pasteProtection"))
      .setDesc(t("pasteProtectionDesc"))
      .addToggle((component) =>
        component
          .setValue(plugin.settings.pasteProtection !== false)
          .onChange(async (value) => {
            plugin.settings.pasteProtection = value;
            await plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("pasteThreshold"))
      .setDesc(t("pasteThresholdDesc"))
      .addText((text) => {
        let init = Number(plugin.settings.pasteThreshold);
        if (!(init > 0)) init = 1000;
        text.setValue(String(init)).onChange(async (value) => {
          let v = parseInt(value, 10);
          if (isNaN(v) || v < 0) v = 0;
          plugin.settings.pasteThreshold = v;
          await plugin.saveSettings();
        });
      });
  }
  
}
