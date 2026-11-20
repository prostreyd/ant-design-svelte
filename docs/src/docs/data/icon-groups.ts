// The groups of the gallery on the Icon page, and the order of the icons in each of them.
//
// They follow the list on the public icon page of Ant Design (React), which was looked at in a browser on 2026-11-20 (the order of the
// names on the page; no code was read): six groups, the same order in every theme, and a name is followed by its themes that exist.
// A name stands here without its theme (`StepBackward`); the gallery shows the theme that is chosen. Two drawings of the package are
// not on that page (`CopyrightCircle` and `DollarCircle`); they stand next to their kin (`Copyright`, `Dollar`). A test keeps the
// groups and the package in step: every drawing of the package is in exactly one group, and no name here is missing from the package.
import type { L10n } from './button.ts';

export interface IconGroup {
  id: string;
  title: L10n;
  /** The names of the drawings without the theme, in the order of the page. */
  names: string[];
}

export const iconGroups: IconGroup[] = [
  {
    id: "direction",
    title: { en: "Directional Icons", ru: "Иконки направлений", zh: "方向性图标" },
    names: [
      "StepBackward", "StepForward", "FastBackward", "FastForward", "Shrink", "ArrowsAlt", "Down", "Up", "Left", "Right", "CaretUp", "CaretDown",
      "CaretLeft", "CaretRight", "UpCircle", "DownCircle", "LeftCircle", "RightCircle", "DoubleRight", "DoubleLeft", "VerticalLeft", "VerticalRight",
      "VerticalAlignTop", "VerticalAlignMiddle", "VerticalAlignBottom", "Forward", "Backward", "Rollback", "Enter", "Retweet", "Swap", "SwapLeft",
      "SwapRight", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PlayCircle", "UpSquare", "DownSquare", "LeftSquare", "RightSquare", "Login",
      "Logout", "MenuFold", "MenuUnfold", "BorderBottom", "BorderHorizontal", "BorderInner", "BorderOuter", "BorderLeft", "BorderRight", "BorderTop",
      "BorderVerticle", "PicCenter", "PicLeft", "PicRight", "RadiusBottomleft", "RadiusBottomright", "RadiusUpleft", "RadiusUpright", "Fullscreen",
      "FullscreenExit"
    ]
  },
  {
    id: "suggestion",
    title: { en: "Suggested Icons", ru: "Иконки подсказок", zh: "提示建议性图标" },
    names: [
      "Question", "QuestionCircle", "Plus", "PlusCircle", "Pause", "PauseCircle", "Minus", "MinusCircle", "PlusSquare", "MinusSquare", "Info",
      "InfoCircle", "Exclamation", "ExclamationCircle", "Close", "CloseCircle", "CloseSquare", "Check", "CheckCircle", "CheckSquare", "ClockCircle",
      "Warning", "IssuesClose", "Stop"
    ]
  },
  {
    id: "editor",
    title: { en: "Editor Icons", ru: "Иконки редактора", zh: "编辑类图标" },
    names: [
      "Edit", "Form", "Copy", "Scissor", "Delete", "Snippets", "Diff", "Highlight", "AlignCenter", "AlignLeft", "AlignRight", "BgColors", "Bold",
      "Italic", "Underline", "Strikethrough", "Redo", "Undo", "ZoomIn", "ZoomOut", "FontColors", "FontSize", "LineHeight", "Dash", "SmallDash",
      "SortAscending", "SortDescending", "Drag", "OrderedList", "UnorderedList", "RadiusSetting", "ColumnWidth", "ColumnHeight"
    ]
  },
  {
    id: "data",
    title: { en: "Data Icons", ru: "Иконки данных", zh: "数据类图标" },
    names: [
      "AreaChart", "PieChart", "BarChart", "DotChart", "LineChart", "RadarChart", "HeatMap", "Fall", "Rise", "Stock", "BoxPlot", "Fund", "Sliders"
    ]
  },
  {
    id: "brand",
    title: { en: "Brand and Logos", ru: "Бренды и логотипы", zh: "品牌和标识" },
    names: [
      "Android", "Apple", "Windows", "Ie", "IeCircle", "IeSquare", "Chrome", "Github", "Aliwangwang", "Dingding", "WeiboSquare", "WeiboCircle",
      "TaobaoCircle", "Html5", "Weibo", "Twitter", "TwitterCircle", "TwitterSquare", "Wechat", "WhatsApp", "Youtube", "AlipayCircle", "Taobao",
      "TaobaoSquare", "Dingtalk", "DingtalkCircle", "DingtalkSquare", "Skype", "Qq", "QqCircle", "QqSquare", "MediumWorkmark", "Gitlab", "Medium",
      "MediumCircle", "MediumSquare", "Linkedin", "GooglePlus", "GooglePlusCircle", "GooglePlusSquare", "Dropbox", "DropboxCircle", "DropboxSquare",
      "Facebook", "Codepen", "CodepenSquare", "CodeSandbox", "CodeSandboxSquare", "CodeSandboxCircle", "Amazon", "AmazonCircle", "AmazonSquare",
      "Google", "GoogleCircle", "GoogleSquare", "CodepenCircle", "Alipay", "AlipaySquare", "AntDesign", "AntCloud", "Aliyun", "Zhihu", "ZhihuCircle",
      "ZhihuSquare", "Slack", "SlackCircle", "SlackSquare", "Behance", "BehanceCircle", "BehanceSquare", "Dribbble", "DribbbleCircle",
      "DribbbleSquare", "Instagram", "Yuque", "Alibaba", "Yahoo", "Reddit", "RedditCircle", "RedditSquare", "Sketch", "SketchCircle", "SketchSquare",
      "WechatWork", "OpenAI", "Anthropic", "Claude", "Gemini", "Mistral", "DeepSeek", "Qwen", "Perplexity", "HuggingFace", "Ollama", "Replicate",
      "ElevenLabs", "Telegram", "Mastodon", "Threads", "Snapchat", "Discord", "X", "Bilibili", "Pinterest", "TikTok", "Spotify", "Twitch", "Linux",
      "Java", "JavaScript", "Python", "Ruby", "DotNet", "Kubernetes", "Docker", "Baidu", "HarmonyOS"
    ]
  },
  {
    id: "application",
    title: { en: "Application Icons", ru: "Иконки приложений", zh: "网站通用图标" },
    names: [
      "AccountBook", "Aim", "Alert", "Apartment", "Api", "AppstoreAdd", "Appstore", "Audio", "AudioMuted", "Audit", "Bank", "Barcode", "Bars",
      "Bell", "Block", "Book", "Border", "BorderlessTable", "Branches", "Bug", "Build", "Bulb", "Calculator", "Calendar", "Camera", "Car",
      "CarryOut", "CiCircle", "Ci", "Clear", "CloudDownload", "Cloud", "CloudServer", "CloudSync", "CloudUpload", "Cluster", "Code", "Coffee",
      "Comment", "Compass", "Compress", "ConsoleSql", "Contacts", "Container", "Control", "Copyright", "CopyrightCircle", "CreditCard", "Crown",
      "CustomerService", "Dashboard", "Database", "DeleteColumn", "DeleteRow", "DeliveredProcedure", "DeploymentUnit", "Desktop", "Disconnect",
      "Dislike", "Dollar", "DollarCircle", "Download", "Ellipsis", "Environment", "EuroCircle", "Euro", "Exception", "ExpandAlt", "Expand",
      "Experiment", "Export", "Eye", "EyeInvisible", "FieldBinary", "FieldNumber", "FieldString", "FieldTime", "FileAdd", "FileDone", "FileExcel",
      "FileExclamation", "File", "FileGif", "FileImage", "FileJpg", "FileMarkdown", "FilePdf", "FilePpt", "FileProtect", "FileSearch", "FileSync",
      "FileText", "FileUnknown", "FileWord", "FileZip", "Filter", "Fire", "Flag", "FolderAdd", "Folder", "FolderOpen", "FolderView", "Fork",
      "FormatPainter", "Frown", "Function", "FundProjectionScreen", "FundView", "FunnelPlot", "Gateway", "Gif", "Gift", "Global", "Gold", "Golden",
      "Group", "Hdd", "Heart", "History", "Holder", "Home", "Hourglass", "Idcard", "Import", "Inbox", "InsertRowAbove", "InsertRowBelow",
      "InsertRowLeft", "InsertRowRight", "Insurance", "Interaction", "Key", "Laptop", "Layout", "Like", "Line", "Link", "Loading3Quarters",
      "Loading", "Lock", "MacCommand", "Mail", "Man", "MedicineBox", "Meh", "Menu", "MergeCells", "Merge", "Message", "Meta", "Mobile",
      "MoneyCollect", "Monitor", "Moon", "More", "Muted", "Netflix", "NodeCollapse", "NodeExpand", "NodeIndex", "Notification", "Number", "OneToOne",
      "PaperClip", "Partition", "PayCircle", "Percentage", "Phone", "Picture", "PlaySquare", "PoundCircle", "Pound", "Poweroff", "Printer",
      "Product", "Profile", "Project", "PropertySafety", "PullRequest", "Pushpin", "Qrcode", "Read", "Reconciliation", "RedEnvelope", "Reload",
      "Rest", "Robot", "Rocket", "RotateLeft", "RotateRight", "SafetyCertificate", "Safety", "Save", "Scan", "Schedule", "Search", "SecurityScan",
      "Select", "Send", "Setting", "Shake", "ShareAlt", "Shop", "ShoppingCart", "Shopping", "Signal", "Signature", "Sisternode", "Skin", "Smile",
      "Solution", "Sound", "SplitCells", "Star", "Subnode", "Sun", "Switcher", "Sync", "Table", "Tablet", "Tag", "Tags", "Team", "Thunderbolt",
      "ToTop", "Tool", "TrademarkCircle", "Trademark", "Transaction", "Translation", "Trophy", "Truck", "Ungroup", "Unlock", "Upload", "Usb",
      "UserAdd", "UserDelete", "User", "UserSwitch", "UsergroupAdd", "UsergroupDelete", "Verified", "VideoCameraAdd", "VideoCamera", "Wallet",
      "Wifi", "Woman"
    ]
  }
];
