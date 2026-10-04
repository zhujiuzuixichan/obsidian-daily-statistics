export default {

  "all": "All",
  "no": "No",

  // 日历
  "modifyWordCount": "Modify word count",
  "modifyWordCountNotice": "The word count cannot be modified after the current date.",

  // 进度条

  "dailyGoals": "Daily goals: ",
  "weeklyGoals": "Weekly goals: ",
  "monthlyGoals": "Monthly goals: ",

  "dailyGoalsExplained": "Daily Goal = Weekly Goal / 7",

  "weekGoalsExplained": "If no goals are set for the current week, the previous week's goals will be used by default.",
  "monthGoalsExplained": "Monthly Goal = Daily goals for the month are accumulated.",
  "SetGoal": "Set a goal",
  "Confirm": "Confirm",
  "Cancel": "Cancel",

  //  设置界面
  "statisticalDataStorageAddress": "Statistics data saving address",
  "statisticalDataStorageAddressExplained": "Set the daily statistical data saving address. If it is empty, it will be saved in the default plug-in directory. If the data file exists in a parent folder, please create it in advance. It is recommended to use the .json data format. After modifying this configuration, you need to reload the plugin."
  ,
  "statisticsFolder": "Statistics Directory"
  ,
  "statisticsFolderExplained": "Set the directories for which statistics should be calculated. Multiple directories are supported and should be separated by English commas (e.g., `folder1/folder2,folder3`). If left empty, statistics will be calculated for the entire vault."
  ,"excludeFolder":"Exclude Directory"
  ,"excludeFolderExplained":"Set the directories to be excluded, supporting multiple directories separated by English commas (e.g., `folder1/folder2,folder3`). If left empty, no directories will be excluded."
  ,"statisticsWord":"Count words"
  ,"statisticsWordExplained":"Count words instead of characters. Please note that after switching this option, the current day's statistics will be reset."
  ,"enablePlan":"Enable plan"
  ,"enablePlanExplained":"Enable plan, then the plan progress will be displayed below the calendar. When the plan is completed, the current day's statistics will turn green."
  ,"weekStart":"Week start"
  ,"weekStartExplained":"Set the start of the week."
  ,"weekStartOptions0":"Sunday"
  ,"weekStartOptions1":"Monday"
  ,"weekStartOptions2":"Tuesday"
  ,"weekStartOptions3":"Wednesday"
  ,"weekStartOptions4":"Thursday"
  ,"weekStartOptions5":"Friday"
  ,"weekStartOptions6":"Saturday"
// 状态栏
  , "todaySWordCount": "Today's word count: "

  //
  , "openTheCalendarPanel": "Open calendar panel"

  // Exclude folder picker
  , "excludeFolderHint": "Tick the folders to exclude (nothing ticked = count the whole vault)"
  , "excludeFolderAll": "Select all"
  , "excludeFolderNone": "Clear"
  , "excludeFolderFilter": "Filter folders…"
  , "excludeFolderEmpty": "There are no subfolders in the vault."

  // Stats panel
  , "statsToday": "Today"
  , "statsWeek": "This week"
  , "statsMonth": "This month"
  , "statsYear": "This year"
  , "statsUnit": "words"
  , "statsUnitPerDay": "words/day"
  , "statsWeekAvg": "This week daily avg"
  , "statsMonthAvg": "This month daily avg"
  , "statsYearAvg": "This year daily avg"
  , "statsDayPeak": "Daily peak"
  , "statsWeekPeak": "Weekly peak"
  , "statsMonthPeak": "Monthly peak"
  , "statsYearPeak": "Yearly peak"

  // Custom range
  , "customRange": "Custom range"
  , "rangeCalc": "Count"
  , "rangeClear": "Clear"
  , "rangeTotal": "Range total"
  , "rangeDaysSuffix": " day(s)"
  , "rangeEmpty": "Please pick both a start date and an end date."
  , "rangeInvalid": "The end date cannot be earlier than the start date."

  // File breakdown
  , "fileBreakdown": "File detail"
  , "fileBreakdownHint": "Click a file name to open it"
  , "fileBreakdownEmpty": "No words recorded for this day."
  , "fileBreakdownNone": "No detail yet (recording starts with this version)."
  , "fileBreakdownManual": "Manual adjustment"
  , "fileBreakdownFileCount": "file(s)"
  , "fileBreakdownMissing": "File no longer in the vault: "

  // Anti paste
  , "pasteProtection": "Anti paste"
  , "pasteProtectionDesc": "When enabled, a single increase over the threshold is treated as paste and not counted"
  , "pasteThreshold": "Paste threshold (chars)"
  , "pasteThresholdDesc": "A single increase over this size is treated as paste; 0 disables the limit."

  // Anti cut
  , "cutProtection": "Anti cut"
  , "cutProtectionDesc": "When enabled, a single decrease over the threshold is treated as a cut (e.g. moved to a new file); the original file is re-based on its post-cut size and not counted as a decrease"
  , "cutThreshold": "Cut threshold (chars)"
  , "cutThresholdDesc": "A single decrease over this size is treated as a cut; 0 disables the limit."

};
