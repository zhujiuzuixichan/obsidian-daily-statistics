export class DailyStatisticsSettings {
  dataFile = "";
  // 需要统计字数的文件夹，如果为空，则统计全库的数据
  statisticsFolder = "";
  // 排除文件夹
  excludeFolder = "";

  // 统计单词，用于英文场景
  statisticsWord = false;
  // 开启计划
  enablePlan = true;
  // 一周开始时间
  weekStart = 0;

  // 防复制粘贴：单次新增超过阈值字数视为粘贴，不计入当日统计
  pasteProtection = true;
  // 粘贴阈值（字），设为 0 表示不限制
  pasteThreshold = 1000;

  // 防剪切：单次减少超过阈值字数视为剪切（如移动到新文档），原文档以剪切后字数为准，不计入当日减少
  cutProtection = true;
  // 剪切阈值（字），设为 0 表示不限制
  cutThreshold = 1000;
}
