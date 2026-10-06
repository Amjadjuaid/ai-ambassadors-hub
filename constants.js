// ============================================================================
// AI Ambassadors Hub — سفراء الذكاء الاصطناعي
// constants.js — كل القوائم الثابتة والإعدادات المشتركة في مكان واحد.
// عدّل القيم هنا فقط عند الحاجة لتغيير الخيارات المعروضة في كل الصفحات.
// ============================================================================

// كود وصول مساحة السفراء — ليس نظام حماية حقيقي، فقط لمنع الدخول العرضي
// للموظفين العاديين. غيّره وشاركه مع السفراء خارج هذا الملف قبل الاستخدام الفعلي.
const AMBASSADOR_ACCESS_CODE = "AMB-2026";

// ----------------------------------------------------------------------------
// حالات التحديات
// ----------------------------------------------------------------------------
const CHALLENGE_STATUSES = [
  { id: "received", label: "تم استلام التحدي" },
  { id: "studying", label: "قيد دراسة التحدي" },
  { id: "need_info", label: "بحاجة لمعلومات إضافية" },
  { id: "verified", label: "تم التحقق من التحدي" },
  { id: "evaluating", label: "قيد تقييم الفرصة" },
  { id: "approved", label: "معتمد للعمل عليه" },
  { id: "forming_team", label: "جارٍ تشكيل فريق الحل" },
  { id: "designing", label: "قيد تصميم الحل" },
  { id: "prototyping", label: "قيد بناء نموذج أولي" },
  { id: "testing", label: "قيد التجربة والاختبار" },
  { id: "implementing", label: "قيد التنفيذ" },
  { id: "launched", label: "تم إطلاق الحل" },
  { id: "measuring", label: "قيد قياس الأثر" },
  { id: "completed", label: "مكتمل" },
  { id: "not_suitable", label: "غير مناسب حاليًا" },
  { id: "duplicate", label: "مكرر" },
  { id: "closed_no_action", label: "مغلق بدون تنفيذ" },
];
const CHALLENGE_DEFAULT_STATUS = "received";
// الحالات التي تتطلب إلزاميًا كتابة سبب الإغلاق قبل الحفظ
const CHALLENGE_CLOSURE_STATUSES = new Set(["not_suitable", "duplicate", "closed_no_action"]);
function challengeStatusLabel(id) {
  const s = CHALLENGE_STATUSES.find((x) => x.id === id);
  return s ? s.label : (id || "—");
}
function isChallengeClosureStatus(id) { return CHALLENGE_CLOSURE_STATUSES.has(id); }
function isChallengeOpenStatus(id) { return id !== "completed" && !CHALLENGE_CLOSURE_STATUSES.has(id); }

// ----------------------------------------------------------------------------
// حالات طلبات المشاركة (Workflow منفصل وبسيط)
// ----------------------------------------------------------------------------
const PARTICIPATION_STATUSES = [
  { id: "new", label: "طلب جديد" },
  { id: "reviewed", label: "تمت المراجعة" },
  { id: "contacted", label: "تم التواصل" },
  { id: "joined", label: "تم ضمه لفريق / مبادرة" },
  { id: "closed", label: "مغلق" },
];
const PARTICIPATION_DEFAULT_STATUS = "new";
function participationStatusLabel(id) {
  const s = PARTICIPATION_STATUSES.find((x) => x.id === id);
  return s ? s.label : (id || "—");
}

// ----------------------------------------------------------------------------
// أسباب إعادة الإسناد (اختيار سريع + حقل آخر عند الحاجة)
// ----------------------------------------------------------------------------
const REASSIGNMENT_REASONS = [
  "التخصص الأنسب",
  "توزيع الأحمال",
  "حسب المسار / الإدارة",
  "بناءً على التنسيق بين السفراء",
  "أخرى",
];

// ----------------------------------------------------------------------------
// الإدارات والمسارات
// ----------------------------------------------------------------------------
const DEPARTMENTS = [
  "تقنية المعلومات",
  "الموارد البشرية",
  "المالية",
  "العمليات",
  "خدمة العملاء",
  "التسويق",
  "الجودة والتميز المؤسسي",
  "المشتريات والعقود",
  "الشؤون القانونية",
  "التخطيط والاستراتيجية",
  "أخرى",
];

const AI_TRACKS = [
  "الأتمتة وتحسين الإجراءات",
  "تحليل البيانات والتقارير",
  "الذكاء الاصطناعي التوليدي",
  "إدارة المعرفة والبحث",
  "تطوير الحلول التقنية",
];

// أدوات الذكاء الاصطناعي والأتمتة الشائعة (لطلبات المشاركة) — مقسّمة إلى فئات لعرضها
// بصريًا ضمن نفس السؤال (Multiple Select واحد)، مع خيار "أخرى" في النهاية.
const AI_AUTOMATION_TOOL_GROUPS = [
  {
    label: "أدوات الذكاء الاصطناعي والتطوير",
    tools: [
      "ChatGPT",
      "Claude",
      "Gemini",
      "Microsoft Copilot",
      "OpenAI Codex",
      "GitHub Copilot",
      "Cursor",
      "Replit",
      "Lovable",
      "Bolt",
    ],
  },
  {
    label: "أدوات الأتمتة وبناء الـ Workflows",
    tools: [
      "n8n",
      "Microsoft Power Automate",
      "Make",
      "Zapier",
      "Copilot Studio",
      "UiPath",
    ],
  },
  {
    label: "أدوات البيانات والتحليل",
    tools: [
      "Power BI",
      "Excel / Power Query",
    ],
  },
];
const AI_AUTOMATION_TOOLS_OTHER = "أخرى";

// ----------------------------------------------------------------------------
// تنسيق التاريخ — تقويم ميلادي صراحة لتفادي أي التباس، بأسماء عربية.
// ----------------------------------------------------------------------------
const AR_LOCALE = "ar-SA-u-ca-gregory";
function formatDate(value) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(AR_LOCALE, { year: "numeric", month: "long", day: "numeric" });
}
function formatDateTime(value) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(AR_LOCALE, { year: "numeric", month: "short", day: "numeric" }) +
    " · " + d.toLocaleTimeString(AR_LOCALE, { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
