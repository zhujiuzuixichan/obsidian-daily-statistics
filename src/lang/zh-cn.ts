export default {
  // common
  "all": "全部",
  "no": "无",

  // 日历
  "modifyWordCount": "修改字数",
  "modifyWordCountNotice": "超过当前日期，不能修改字数。",



  // 进度条
  "dailyGoals": "每日目标：",
  "weeklyGoals": "每周目标：",
  "monthlyGoals": "每月目标：",
  "dailyGoalsExplained": "每日目标 = 每周目标 / 7",
  "weekGoalsExplained": "如果当前周未设置目标，则默认使用上一周的目标。",
  "monthGoalsExplained": "每月目标 = 当月每日目标累加。",
  "SetGoal": "设置目标",
  "Confirm": "确定",
  "Cancel": "取消",

//  设置界面
  "statisticalDataStorageAddress": "统计数据保存地址",
  "statisticalDataStorageAddressExplained": "设置每日统计数据保存地址，如果为空，则保存在默认的插件目录下。如果数据文件存在父级文件夹，请提前创建。建议使用 .json 的数据格式。修改该配置后，需要重新加载插件。"
  , "statisticsFolder": "统计目录"
  , "statisticsFolderExplained": "设置需要统计数据的目录，支持多个目录，用英文逗号分隔（如 folder1/folder2,folder3）。如果为空，则统计全库的数据。"
  ,"excludeFolder":"排除目录"
  ,"excludeFolderExplained":"设置需要排除的目录，支持多个目录，用英文逗号分隔（如 folder1/folder2,folder3）。如果为空，则不排除。"
  ,"statisticsWord":"统计单词"
  ,"statisticsWordExplained":"统计单词而不是字符。请注意，切换该选项之后，当日的统计数据将被重置。"
  ,"enablePlan":"开启计划"
  ,"enablePlanExplained":"开启计划后会在日历下方显示计划进度，当计划完成之后，当日的统计信息会变成绿色。"
  ,"weekStart":"一周开始时间"
  ,"weekStartExplained":"设置一周的开始时间。"
  ,"weekStartOptions0":"周日"
  ,"weekStartOptions1":"周一"
  ,"weekStartOptions2":"周二"
  ,"weekStartOptions3":"周三"
  ,"weekStartOptions4":"周四"
  ,"weekStartOptions5":"周五"
  ,"weekStartOptions6":"周六"
// 状态栏
  , "todaySWordCount": "今日字数："

  //
  , "openTheCalendarPanel": "打开日历面板"

  // 排除目录勾选器
  , "excludeFolderHint": "勾选需要排除的目录（不勾选则统计全库）"
  , "excludeFolderAll": "全选"
  , "excludeFolderNone": "清空"
  , "excludeFolderFilter": "筛选目录…"
  , "excludeFolderEmpty": "库中没有可选择的子文件夹。"

  // 统计面板
  , "statsToday": "今日"
  , "statsWeek": "本周"
  , "statsMonth": "本月"
  , "statsYear": "本年"
  , "statsUnit": "字"
  , "statsUnitPerDay": "字/天"
  , "statsWeekAvg": "本周日均输入"
  , "statsMonthAvg": "本月日均输入"
  , "statsYearAvg": "本年日均输入"
  , "statsDayPeak": "单日输入峰值"
  , "statsWeekPeak": "单周输入峰值"
  , "statsMonthPeak": "单月输入峰值"
  , "statsYearPeak": "单年输入峰值"

  // 自定义时间范围
  , "customRange": "自定义时间范围"
  , "rangeCalc": "统计"
  , "rangeClear": "清除"
  , "rangeTotal": "区间合计"
  , "rangeDaysSuffix": " 天"
  , "rangeEmpty": "请先选择起始日期和结束日期。"
  , "rangeInvalid": "结束日期不能早于起始日期。"

  // 文件明细
  , "fileBreakdown": "文件明细"
  , "fileBreakdownHint": "点文件名可直接打开该文件"
  , "fileBreakdownEmpty": "这一天没有字数记录。"
  , "fileBreakdownNone": "暂无明细数据（明细从本版本启用后开始记录）。"
  , "fileBreakdownManual": "手动调整"
  , "fileBreakdownFileCount": "个文件"
  , "fileBreakdownMissing": "库中已找不到该文件："

  // 防复制粘贴
  , "pasteProtection": "防复制粘贴"
  , "pasteProtectionDesc": "开启后，单次新增超过阈值字数视为复制/粘贴，不计入当日统计"
  , "pasteThreshold": "粘贴阈值（字）"
  , "pasteThresholdDesc": "单次新增超过该字数即视为复制/粘贴；设为 0 表示不限制。"

};
