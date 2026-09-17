// ============================================================================
// AI Ambassadors Hub — بوابة سفراء الذكاء الاصطناعي
// constants.js — كل القوائم الثابتة والإعدادات المشتركة في مكان واحد.
// عدّل القيم هنا فقط عند الحاجة لتغيير الخيارات المعروضة في كل الصفحات.
// ============================================================================

// كود وصول مساحة السفراء — ليس نظام حماية حقيقي، فقط لمنع الدخول العرضي
// للموظفين العاديين. غيّره وشاركه مع السفراء العشرة خارج هذا الملف.
const AMBASSADOR_ACCESS_CODE = "AMB-2026";

// حالات الطلب — الترتيب هنا هو نفس ترتيب الظهور في المخطط الزمني
const STATUSES = [
  { id: "new", label: "جديد", color: "status-new" },
  { id: "under_review", label: "قيد المراجعة", color: "status-review" },
  { id: "need_info", label: "بحاجة لمعلومات إضافية", color: "status-warn" },
  { id: "consultation", label: "يتطلب استشارة", color: "status-warn" },
  { id: "potential_use_case", label: "فرصة ذكاء اصطناعي محتملة", color: "status-potential" },
  { id: "in_progress", label: "قيد التنفيذ", color: "status-progress" },
  { id: "completed", label: "مكتمل", color: "status-done" },
  { id: "closed", label: "مغلق", color: "status-closed" },
];

function statusLabel(id) {
  const s = STATUSES.find((x) => x.id === id);
  return s ? s.label : id;
}
function statusColor(id) {
  const s = STATUSES.find((x) => x.id === id);
  return s ? s.color : "status-new";
}
// حالات "نشطة" لأغراض الفلترة والإحصاءات
const ACTIVE_STATUSES = ["under_review", "need_info", "consultation", "potential_use_case", "in_progress"];

// فئات التصنيف (يدوية بالكامل — بدون أي تصنيف آلي في هذا الإصدار)
const CATEGORIES = [
  { id: "automation", label: "أتمتة" },
  { id: "data_analytics", label: "البيانات والتحليلات" },
  { id: "genai", label: "الذكاء الاصطناعي التوليدي" },
  { id: "productivity", label: "الإنتاجية" },
  { id: "knowledge_mgmt", label: "إدارة المعرفة" },
  { id: "software_dev", label: "تطوير البرمجيات" },
  { id: "quality", label: "الجودة" },
  { id: "operations", label: "العمليات" },
  { id: "hr", label: "الموارد البشرية" },
  { id: "finance", label: "المالية" },
  { id: "other", label: "أخرى" },
];
function categoryLabel(id) {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? c.label : "—";
}

// أنواع المساعدة المطلوبة
const HELP_TYPES = [
  "لدي مشكلة ولا أعرف الحل",
  "أريد أتمتة مهمة",
  "أحتاج مساعدة في استخدام أداة AI",
  "أحتاج Prompt",
  "أحتاج تحليل بيانات",
  "لدي فكرة لاستخدام AI",
  "أخرى",
];

// تكرار المهمة
const FREQUENCIES = ["يوميًا", "أسبوعيًا", "شهريًا", "عند الحاجة"];

// نطاق التأثر
const SCOPES = ["أنا فقط", "فريقي", "إدارتي", "أكثر من إدارة"];

// الإدارات (تُستخدم في نموذج التسجيل وربط السفراء)
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

// مسارات الذكاء الاصطناعي للسفراء
const AI_TRACKS = [
  "الأتمتة وتحسين الإجراءات",
  "تحليل البيانات والتقارير",
  "الذكاء الاصطناعي التوليدي",
  "إدارة المعرفة والبحث",
  "تطوير الحلول التقنية",
];

// عدد أحرف عشوائي لتوليد رقم الطلب
function generateRequestId() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `REQ-${yy}${mm}${dd}-${suffix}`;
}

// نستخدم التقويم الميلادي صراحة (ar-SA-u-ca-gregory) لتفادي أي التباس بين
// التاريخ الهجري والميلادي، مع إبقاء أسماء الأشهر بالعربية.
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
