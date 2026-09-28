<script setup lang="ts">
import store from "@/data/Store";
import { computed, ref, watch } from "vue";


import { ElConfigProvider } from "element-plus";
import Progress from "@/ui/calendar/Progress.vue";
import Calendar from "@/ui/calendar/Calendar.vue";
import { useDark, useToggle } from "@vueuse/core";
import { onBeforeUnmount } from "vue";


// 深色模式适配
// 获取当前主题模式
const isDark = useDark();
isDark.value = document.body.classList.contains("theme-dark");
useToggle(isDark);

// 创建一个MutationObserver实例
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "attributes" && mutation.attributeName === "class") {
      isDark.value = document.body.classList.contains("theme-dark");
      // console.log("Is dark theme active?", isDark);
    }
  });
});
// 配置观察选项
const config = { attributes: true, attributeFilter: ["class"] };
// 观察body元素
observer.observe(document.body, config);
onBeforeUnmount(() => {
  // // console.log('组件即将销毁');
  observer.disconnect();
  // 执行一些清理工作，比如取消网络请求、移除事件监听器等
});


// 是否开启计划
const enablePlan = computed(() => {
  return store.getters.enablePlan;
});



// 添加一个用于强制重新渲染的 key
const componentKey = ref(0);

// 添加一个刷新方法
const refreshView = () => {
  componentKey.value += 1;
};

// 监听一周开始时间的变化，更新日历视图
watch(() => store.getters.weekStart, () => {
  // 重新加载组件
  refreshView();

});




</script>

<template>

  <el-config-provider :key="componentKey">

    <Calendar />
    <Progress v-if="enablePlan" />

  </el-config-provider>
</template>


<style>
/* ==========================================================================
   daily-statistics 魔改补充样式（统计面板 / 文件明细 / 排除目录勾选器 / 顶对齐）
   由 CalendarView.ts 动态创建的 DOM 使用，故必须为非 scoped 全局样式。
   ========================================================================== */
.ds-vue-host{display:block}
.ds-stats-panel{margin-top:10px;padding:8px 10px;border-top:1px solid var(--background-modifier-border);font-size:12px;color:var(--text-normal)}
.ds-stats-group{display:flex;flex-direction:column;gap:4px}
.ds-stats-subgroup{margin-top:8px;padding-top:8px;border-top:1px solid var(--background-modifier-border)}
.ds-stats-row{display:flex;align-items:center;gap:6px;line-height:1.6}
.ds-stats-label{color:var(--text-muted);white-space:nowrap}
.ds-stats-value{margin-left:auto;font-weight:600;font-variant-numeric:tabular-nums}
.ds-stats-unit{color:var(--text-faint);font-size:11px}
.ds-stats-alt{margin-left:6px;color:var(--text-faint);font-size:11px;font-variant-numeric:tabular-nums}
.ds-stats-range{margin-top:8px;padding-top:8px;border-top:1px dashed var(--background-modifier-border)}
.ds-stats-range-title{margin-bottom:4px;font-size:11px;color:var(--text-muted)}
.ds-stats-range-inputs{display:flex;flex-wrap:wrap;align-items:center;gap:4px}
.ds-range-input{flex:1 1 84px;min-width:0;height:24px;padding:2px 4px;font-size:11px;color:var(--text-normal);background:var(--background-modifier-form-field);border:1px solid var(--background-modifier-border);border-radius:var(--radius-s)}
.ds-range-sep{color:var(--text-faint)}
.ds-stats-range-result{margin-top:4px}
.ds-mini-btn{cursor:pointer;font-size:11px;line-height:1;padding:4px 7px;color:var(--text-normal);background:var(--interactive-normal);border:1px solid var(--background-modifier-border);border-radius:var(--radius-s)}
.ds-mini-btn:hover{background:var(--interactive-hover)}
.ds-mini-btn-plain{background:transparent}
.ds-folder-picker{margin:2px 0 14px;padding:8px 10px;background:var(--background-secondary);border:1px solid var(--background-modifier-border);border-radius:var(--radius-m)}
.ds-folder-picker-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.ds-folder-picker-hint{flex:1 1 auto;font-size:12px;color:var(--text-muted)}
.ds-folder-filter{width:100%;height:26px;margin:6px 0;padding:3px 6px;font-size:12px;color:var(--text-normal);background:var(--background-modifier-form-field);border:1px solid var(--background-modifier-border);border-radius:var(--radius-s)}
.ds-folder-list{display:flex;flex-direction:column;gap:1px;max-height:260px;overflow:auto;padding-top:4px;border-top:1px solid var(--background-modifier-border)}
.ds-folder-item{display:flex;align-items:center;gap:6px;padding:2px 4px;font-size:12px;border-radius:var(--radius-s)}
.ds-folder-item:hover{background:var(--background-modifier-hover)}
.ds-folder-check{margin:0}
.ds-folder-name{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--text-normal)}
.ds-folder-empty{padding:4px 2px;font-size:12px;color:var(--text-faint)}
.ds-detail{margin-top:6px}
.ds-detail-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.ds-detail-toggle{padding:2px 5px;font-size:11px;line-height:1}
.ds-detail-title{font-size:11px;color:var(--text-muted)}
.ds-detail-count{margin-left:auto;font-size:11px;color:var(--text-faint);font-variant-numeric:tabular-nums}
.ds-detail-date{width:118px;height:22px;padding:1px 4px;font-size:11px;color:var(--text-normal);background:var(--background-modifier-form-field);border:1px solid var(--background-modifier-border);border-radius:var(--radius-s)}
.ds-detail-body{display:none;max-height:190px;overflow:auto;margin-top:4px}
.ds-detail.is-open > .ds-detail-body{display:block}
.ds-detail-empty{padding:2px 4px;font-size:11px;color:var(--text-faint)}
.ds-detail-row{display:flex;align-items:baseline;gap:6px;padding:2px 4px;font-size:12px;cursor:pointer;border-radius:var(--radius-s)}
.ds-detail-row:hover{background:var(--background-modifier-hover)}
.ds-detail-name{flex:0 1 auto;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;color:var(--text-normal)}
.ds-detail-dir{flex:1 1 auto;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:11px;color:var(--text-faint)}
.ds-detail-value{margin-left:auto;font-weight:600;color:var(--text-normal);font-variant-numeric:tabular-nums}
.ds-detail-manual{cursor:default;color:var(--text-muted)}
.workspace-leaf-content.ds-view,
.workspace-leaf-content[data-type="CalendarView"]{justify-content:flex-start;align-items:stretch;padding:0;overflow-y:auto;overflow-x:hidden}
.workspace-leaf-content.ds-view > .view-header,
.workspace-leaf-content.ds-view > .view-content,
.workspace-leaf-content[data-type="CalendarView"] > .view-header,
.workspace-leaf-content[data-type="CalendarView"] > .view-content{display:none!important}
.workspace-leaf-content.ds-view > .ds-vue-host,
.workspace-leaf-content.ds-view > .ds-stats-panel,
.workspace-leaf-content[data-type="CalendarView"] > .ds-vue-host,
.workspace-leaf-content[data-type="CalendarView"] > .ds-stats-panel{flex:0 0 auto}
</style>
