// ============================================================================
// seed-data.js — بيانات تجريبية واقعية لتشغيل الطيار (Pilot)
//
// كل العناصر هنا تحمل isDemo:true ليسهل تمييزها وحذفها لاحقًا عند الانتقال
// للاستخدام الفعلي (زر "مسح البيانات التجريبية" متاح داخل مساحة السفراء).
// الزرع يحدث تلقائيًا مرة واحدة فقط عند أول تشغيل لقاعدة بيانات فارغة.
// ============================================================================

function daysAgo(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const DEMO_AMBASSADORS = [
  {
    id: "amb-01", name: "سلمان العتيبي", department: "تقنية المعلومات",
    track: "الأتمتة وتحسين الإجراءات",
    helpAreas: ["أتمتة العمليات المكتبية", "ربط الأنظمة والبيانات", "أدوات الذكاء الاصطناعي للمطورين"],
    officeHours: [{ day: "الأحد", start: "13:00", end: "14:00" }, { day: "الثلاثاء", start: "10:00", end: "11:00" }],
    isDemo: true,
  },
  {
    id: "amb-02", name: "نورة القحطاني", department: "الموارد البشرية",
    track: "الذكاء الاصطناعي التوليدي",
    helpAreas: ["صياغة السياسات والمراسلات", "تلخيص المقابلات والتقارير", "استخدام أدوات المحادثة الذكية"],
    officeHours: [{ day: "الاثنين", start: "11:00", end: "12:00" }],
    isDemo: true,
  },
  {
    id: "amb-03", name: "فهد الدوسري", department: "المالية",
    track: "تحليل البيانات والتقارير",
    helpAreas: ["تحليل البيانات المالية", "أتمتة التقارير الدورية", "لوحات المتابعة"],
    officeHours: [{ day: "الثلاثاء", start: "09:00", end: "10:00" }, { day: "الخميس", start: "12:00", end: "13:00" }],
    isDemo: true,
  },
  {
    id: "amb-04", name: "ريم الحربي", department: "العمليات",
    track: "الأتمتة وتحسين الإجراءات",
    helpAreas: ["تبسيط إجراءات العمل", "أتمتة المهام المتكررة", "تحسين سير الموافقات"],
    officeHours: [{ day: "الأحد", start: "10:00", end: "11:00" }],
    isDemo: true,
  },
  {
    id: "amb-05", name: "عبدالعزيز الشهري", department: "خدمة العملاء",
    track: "الذكاء الاصطناعي التوليدي",
    helpAreas: ["ردود جاهزة للعملاء", "تصنيف الشكاوى والملاحظات", "تحسين تجربة المتعاملين"],
    officeHours: [{ day: "الأربعاء", start: "13:00", end: "14:00" }],
    isDemo: true,
  },
  {
    id: "amb-06", name: "لمى المطيري", department: "التسويق",
    track: "الذكاء الاصطناعي التوليدي",
    helpAreas: ["صياغة المحتوى التسويقي", "تحليل أداء الحملات", "أفكار إبداعية بمساعدة AI"],
    officeHours: [{ day: "الاثنين", start: "09:00", end: "10:00" }],
    isDemo: true,
  },
  {
    id: "amb-07", name: "خالد الغامدي", department: "الجودة والتميز المؤسسي",
    track: "تحليل البيانات والتقارير",
    helpAreas: ["قياس مؤشرات الأداء", "تحليل جذور المشكلات", "تقارير الجودة الآلية"],
    officeHours: [{ day: "الثلاثاء", start: "13:00", end: "14:00" }],
    isDemo: true,
  },
  {
    id: "amb-08", name: "هند العنزي", department: "المشتريات والعقود",
    track: "إدارة المعرفة والبحث",
    helpAreas: ["البحث في المستندات والعقود", "تنظيم الأرشيف", "تلخيص الوثائق الطويلة"],
    officeHours: [{ day: "الأربعاء", start: "10:00", end: "11:00" }],
    isDemo: true,
  },
  {
    id: "amb-09", name: "تركي السبيعي", department: "الشؤون القانونية",
    track: "إدارة المعرفة والبحث",
    helpAreas: ["مراجعة المستندات القانونية", "البحث في الأنظمة واللوائح", "تلخيص العقود"],
    officeHours: [{ day: "الخميس", start: "10:00", end: "11:00" }],
    isDemo: true,
  },
  {
    id: "amb-10", name: "دانة الزهراني", department: "التخطيط والاستراتيجية",
    track: "تطوير الحلول التقنية",
    helpAreas: ["بناء نماذج أولية بسيطة", "ربط الأفكار بحلول تقنية", "تقييم أدوات AI الجديدة"],
    officeHours: [{ day: "الأحد", start: "11:00", end: "12:00" }, { day: "الأربعاء", start: "09:00", end: "10:00" }],
    isDemo: true,
  },
];

// طلبات مستقلة (8)
const DEMO_STANDALONE_REQUESTS = [
  {
    id: "REQ-DEMO-01", employeeId: "90011", employeeName: "أحمد الزهراني", department: "تقنية المعلومات",
    title: "تكرار إدخال بيانات التذاكر يدويًا",
    description: "أقضي وقتًا طويلاً بنسخ بيانات تذاكر الدعم الفني من البريد إلى نظام التتبع يدويًا كل يوم.",
    currentMethod: "نسخ ولصق يدوي من البريد الإلكتروني إلى Excel ثم إلى النظام.",
    frequency: "يوميًا", timeSpent: "ساعة تقريبًا يوميًا", affectedScope: "فريقي",
    helpType: "أريد أتمتة مهمة", status: "in_progress", category: "automation",
    assignedAmbassadorId: "amb-01", assignedAmbassadorName: "سلمان العتيبي",
    notes: [{ author: "سلمان العتيبي", text: "تم الاجتماع مع الفريق، سنبدأ بربط بسيط عبر أتمتة القواعد.", at: daysAgo(3) }],
    updates: [{ text: "جاري بناء نموذج أولي للأتمتة، التحديث القادم الأسبوع المقبل.", author: "سلمان العتيبي", at: daysAgo(3) }],
    isDemo: true, createdAt: daysAgo(9), updatedAt: daysAgo(3),
  },
  {
    id: "REQ-DEMO-02", employeeId: "90022", employeeName: "منى العتيبي", department: "الموارد البشرية",
    title: "صياغة إعلانات الوظائف تستغرق وقتًا طويلاً",
    description: "كتابة وصف الوظيفة والمتطلبات من الصفر لكل طلب توظيف جديد يأخذ وقتًا كبيرًا.",
    currentMethod: "كتابة يدوية بالاعتماد على نماذج قديمة متفرقة.",
    frequency: "أسبوعيًا", timeSpent: "ساعتان أسبوعيًا", affectedScope: "إدارتي",
    helpType: "أحتاج Prompt", status: "completed", category: "genai",
    assignedAmbassadorId: "amb-02", assignedAmbassadorName: "نورة القحطاني",
    notes: [{ author: "نورة القحطاني", text: "تم تجهيز قالب Prompt جاهز وتدريب الفريق عليه.", at: daysAgo(6) }],
    updates: [{ text: "تم تسليم قالب الأوصاف الوظيفية الجاهز، وتم اعتماده من قبل الإدارة.", author: "نورة القحطاني", at: daysAgo(6) }],
    isDemo: true, createdAt: daysAgo(20), updatedAt: daysAgo(6),
  },
  {
    id: "REQ-DEMO-03", employeeId: "90033", employeeName: "بندر الشمري", department: "المالية",
    title: "مطابقة الفواتير مع كشوف الحسابات يدويًا",
    description: "مطابقة عشرات الفواتير مع كشف الحساب البنكي كل شهر بشكل يدوي عرضة للأخطاء.",
    currentMethod: "جداول Excel منفصلة يتم مطابقتها بالعين.",
    frequency: "شهريًا", timeSpent: "يوم كامل تقريبًا", affectedScope: "إدارتي",
    helpType: "أحتاج تحليل بيانات", status: "potential_use_case", category: "data_analytics",
    assignedAmbassadorId: "amb-03", assignedAmbassadorName: "فهد الدوسري",
    notes: [{ author: "فهد الدوسري", text: "فرصة جيدة لحل تحليل بيانات بسيط، سأرفعها في رادار الفرص.", at: daysAgo(4) }],
    updates: [], isDemo: true, createdAt: daysAgo(11), updatedAt: daysAgo(4),
  },
  {
    id: "REQ-DEMO-04", employeeId: "90044", employeeName: "سارة القحطاني", department: "خدمة العملاء",
    title: "الرد على الاستفسارات المتكررة يستهلك الوقت",
    description: "أغلب استفسارات العملاء متشابهة لكن نرد عليها يدويًا في كل مرة من جديد.",
    currentMethod: "الرد المباشر يدويًا عبر البريد والدردشة.",
    frequency: "يوميًا", timeSpent: "3 ساعات يوميًا", affectedScope: "فريقي",
    helpType: "لدي مشكلة ولا أعرف الحل", status: "new", category: "other",
    assignedAmbassadorId: null, assignedAmbassadorName: null,
    notes: [], updates: [], isDemo: true, createdAt: daysAgo(1), updatedAt: daysAgo(1),
  },
  {
    id: "REQ-DEMO-05", employeeId: "90055", employeeName: "عبدالله الحربي", department: "العمليات",
    title: "جدولة المناوبات تأخذ وقتًا طويلاً كل أسبوع",
    description: "إعداد جدول المناوبات الأسبوعي يدويًا مع مراعاة الإجازات والتفضيلات.",
    currentMethod: "جدول Excel يتم تعديله يدويًا كل أسبوع.",
    frequency: "أسبوعيًا", timeSpent: "3 ساعات أسبوعيًا", affectedScope: "فريقي",
    helpType: "أريد أتمتة مهمة", status: "under_review", category: "operations",
    assignedAmbassadorId: "amb-04", assignedAmbassadorName: "ريم الحربي",
    notes: [{ author: "ريم الحربي", text: "بحاجة لفهم قيود الجدولة بشكل أدق قبل اقتراح حل.", at: daysAgo(2) }],
    updates: [{ text: "استلمنا الطلب وسنتواصل معك لتحديد موعد استشارة قصيرة.", author: "ريم الحربي", at: daysAgo(2) }],
    isDemo: true, createdAt: daysAgo(5), updatedAt: daysAgo(2),
  },
  {
    id: "REQ-DEMO-06", employeeId: "90066", employeeName: "هيفاء الغامدي", department: "الجودة والتميز المؤسسي",
    title: "تحتاج لمساعدة في اختيار أداة تحليل مناسبة",
    description: "لدينا بيانات استبيانات رضا كثيرة ولا نعرف أفضل أداة لتحليلها بسرعة.",
    currentMethod: "تحليل يدوي جزئي عبر Excel.",
    frequency: "شهريًا", timeSpent: "يومان شهريًا", affectedScope: "إدارتي",
    helpType: "أحتاج مساعدة في استخدام أداة AI", status: "need_info", category: "quality",
    assignedAmbassadorId: "amb-07", assignedAmbassadorName: "خالد الغامدي",
    notes: [{ author: "خالد الغامدي", text: "نحتاج عينة من البيانات لتحديد الأداة المناسبة.", at: daysAgo(1) }],
    updates: [{ text: "هل يمكن مشاركة نموذج من بيانات الاستبيان (بدون معلومات شخصية) لنقترح الأداة الأنسب؟", author: "خالد الغامدي", at: daysAgo(1) }],
    isDemo: true, createdAt: daysAgo(7), updatedAt: daysAgo(1),
  },
  {
    id: "REQ-DEMO-07", employeeId: "90077", employeeName: "ماجد السبيعي", department: "الشؤون القانونية",
    title: "مراجعة العقود بحثًا عن بنود معينة يدويًا",
    description: "قراءة عقود طويلة صفحة بصفحة للبحث عن بنود محددة قبل التوقيع.",
    currentMethod: "قراءة يدوية كاملة لكل عقد.",
    frequency: "أسبوعيًا", timeSpent: "4 ساعات أسبوعيًا", affectedScope: "فريقي",
    helpType: "لدي فكرة لاستخدام AI", status: "consultation", category: "knowledge_mgmt",
    assignedAmbassadorId: "amb-09", assignedAmbassadorName: "تركي السبيعي",
    notes: [{ author: "تركي السبيعي", text: "الفكرة واعدة، يفضّل جلسة استشارة قصيرة لتوضيح النطاق.", at: daysAgo(2) }],
    updates: [{ text: "تم جدولة استشارة معك خلال ساعات العمل المكتبية القادمة.", author: "تركي السبيعي", at: daysAgo(2) }],
    isDemo: true, createdAt: daysAgo(8), updatedAt: daysAgo(2),
  },
  {
    id: "REQ-DEMO-08", employeeId: "90088", employeeName: "وفاء المطيري", department: "التسويق",
    title: "إعداد أفكار محتوى لحسابات التواصل أسبوعيًا",
    description: "توليد أفكار منشورات جديدة كل أسبوع يستهلك وقتًا وجهدًا إبداعيًا كبيرًا.",
    currentMethod: "عصف ذهني يدوي داخل الفريق.",
    frequency: "أسبوعيًا", timeSpent: "ساعتان أسبوعيًا", affectedScope: "أنا فقط",
    helpType: "أحتاج Prompt", status: "closed", category: "genai",
    assignedAmbassadorId: "amb-06", assignedAmbassadorName: "لمى المطيري",
    notes: [{ author: "لمى المطيري", text: "تم إغلاق الطلب بناءً على طلب الموظفة بعد حل المشكلة داخليًا.", at: daysAgo(10) }],
    updates: [{ text: "تم إغلاق الطلب — تم حل الاحتياج عبر ورشة عمل داخلية.", author: "لمى المطيري", at: daysAgo(10) }],
    isDemo: true, createdAt: daysAgo(25), updatedAt: daysAgo(10),
  },
];

// تجمع 1: تلخيص محاضر الاجتماعات — 4 طلبات / 3 إدارات
const CLUSTER_1_REQUESTS = [
  {
    id: "REQ-DEMO-09", employeeId: "90101", employeeName: "خلود العتيبي", department: "الموارد البشرية",
    title: "تلخيص محاضر اجتماعات اللجنة أسبوعيًا",
    description: "كتابة محضر مفصل لكل اجتماع لجنة أسبوعي يأخذ وقتًا طويلاً بعد كل اجتماع.",
    currentMethod: "تدوين يدوي أثناء الاجتماع ثم إعادة صياغته لاحقًا.",
    frequency: "أسبوعيًا", timeSpent: "ساعتان أسبوعيًا", affectedScope: "فريقي",
    helpType: "أريد أتمتة مهمة", status: "under_review", category: "productivity",
    assignedAmbassadorId: "amb-02", assignedAmbassadorName: "نورة القحطاني",
    notes: [], updates: [], isDemo: true, createdAt: daysAgo(14), updatedAt: daysAgo(14),
  },
  {
    id: "REQ-DEMO-10", employeeId: "90102", employeeName: "فيصل الدوسري", department: "المالية",
    title: "توثيق محاضر اجتماعات الميزانية الشهرية",
    description: "كل اجتماع ميزانية شهري يحتاج محضرًا رسميًا موزعًا على عدة أقسام.",
    currentMethod: "تسجيل صوتي ثم تفريغ يدوي كامل.",
    frequency: "شهريًا", timeSpent: "4 ساعات شهريًا", affectedScope: "إدارتي",
    helpType: "أريد أتمتة مهمة", status: "under_review", category: "productivity",
    assignedAmbassadorId: "amb-03", assignedAmbassadorName: "فهد الدوسري",
    notes: [], updates: [], isDemo: true, createdAt: daysAgo(13), updatedAt: daysAgo(13),
  },
  {
    id: "REQ-DEMO-11", employeeId: "90103", employeeName: "عمر الحربي", department: "العمليات",
    title: "محاضر اجتماعات التنسيق اليومية تأخذ وقتًا",
    description: "اجتماع تنسيق يومي قصير لكن توثيقه ومتابعة القرارات يستهلك وقتًا إضافيًا.",
    currentMethod: "ملاحظات متفرقة على الورق ثم تنظيمها لاحقًا.",
    frequency: "يوميًا", timeSpent: "30 دقيقة يوميًا", affectedScope: "فريقي",
    helpType: "لدي مشكلة ولا أعرف الحل", status: "new", category: "productivity",
    assignedAmbassadorId: null, assignedAmbassadorName: null,
    notes: [], updates: [], isDemo: true, createdAt: daysAgo(4), updatedAt: daysAgo(4),
  },
  {
    id: "REQ-DEMO-12", employeeId: "90104", employeeName: "أمل الغامدي", department: "الموارد البشرية",
    title: "تلخيص اجتماعات مراجعة الأداء الفصلية",
    description: "اجتماعات مراجعة الأداء الفصلية تحتاج تلخيصًا دقيقًا لكل موظف يُشارك في التقرير.",
    currentMethod: "كتابة يدوية بعد كل اجتماع فردي.",
    frequency: "عند الحاجة", timeSpent: "يوم كامل كل ربع سنة", affectedScope: "إدارتي",
    helpType: "أريد أتمتة مهمة", status: "under_review", category: "productivity",
    assignedAmbassadorId: "amb-02", assignedAmbassadorName: "نورة القحطاني",
    notes: [], updates: [], isDemo: true, createdAt: daysAgo(12), updatedAt: daysAgo(12),
  },
];

// تجمع 2: البحث اليدوي في المستندات والأرشيف — 3 طلبات / 3 إدارات
const CLUSTER_2_REQUESTS = [
  {
    id: "REQ-DEMO-13", employeeId: "90201", employeeName: "ريان العنزي", department: "المشتريات والعقود",
    title: "البحث عن عقود سابقة مشابهة يدويًا",
    description: "قبل أي عقد جديد نبحث يدويًا في أرشيف ورقي وملفات متفرقة عن عقود مشابهة.",
    currentMethod: "بحث يدوي في مجلدات ومستندات PDF متفرقة.",
    frequency: "أسبوعيًا", timeSpent: "3 ساعات أسبوعيًا", affectedScope: "فريقي",
    helpType: "لدي مشكلة ولا أعرف الحل", status: "under_review", category: "knowledge_mgmt",
    assignedAmbassadorId: "amb-08", assignedAmbassadorName: "هند العنزي",
    notes: [], updates: [], isDemo: true, createdAt: daysAgo(15), updatedAt: daysAgo(15),
  },
  {
    id: "REQ-DEMO-14", employeeId: "90202", employeeName: "نايف السبيعي", department: "الشؤون القانونية",
    title: "البحث في الأنظمة واللوائح لكل استشارة قانونية",
    description: "كل استشارة قانونية تتطلب بحثًا يدويًا طويلًا في مستندات الأنظمة المرجعية.",
    currentMethod: "بحث يدوي في ملفات PDF ومجلدات مشتركة.",
    frequency: "أسبوعيًا", timeSpent: "4 ساعات أسبوعيًا", affectedScope: "فريقي",
    helpType: "لدي مشكلة ولا أعرف الحل", status: "under_review", category: "knowledge_mgmt",
    assignedAmbassadorId: "amb-09", assignedAmbassadorName: "تركي السبيعي",
    notes: [], updates: [], isDemo: true, createdAt: daysAgo(10), updatedAt: daysAgo(10),
  },
  {
    id: "REQ-DEMO-15", employeeId: "90203", employeeName: "غادة الزهراني", department: "التخطيط والاستراتيجية",
    title: "استخراج بيانات من تقارير سابقة يدويًا",
    description: "لإعداد أي دراسة جديدة نبحث يدويًا في عشرات التقارير السابقة عن أرقام ومراجع.",
    currentMethod: "قراءة وفرز يدوي لملفات Word وPDF قديمة.",
    frequency: "عند الحاجة", timeSpent: "يوم كامل لكل دراسة", affectedScope: "إدارتي",
    helpType: "أحتاج مساعدة في استخدام أداة AI", status: "new", category: "knowledge_mgmt",
    assignedAmbassadorId: null, assignedAmbassadorName: null,
    notes: [], updates: [], isDemo: true, createdAt: daysAgo(3), updatedAt: daysAgo(3),
  },
];

// تجمع 3: إعداد التقارير الأسبوعية يدويًا — 3 طلبات / إدارتين
const CLUSTER_3_REQUESTS = [
  {
    id: "REQ-DEMO-16", employeeId: "90301", employeeName: "شهد الحربي", department: "العمليات",
    title: "تجميع التقرير الأسبوعي من عدة مصادر",
    description: "التقرير الأسبوعي يحتاج تجميع أرقام من 4 أنظمة مختلفة يدويًا كل أسبوع.",
    currentMethod: "نسخ يدوي من كل نظام إلى ملف Excel موحد.",
    frequency: "أسبوعيًا", timeSpent: "ساعتان أسبوعيًا", affectedScope: "فريقي",
    helpType: "أحتاج تحليل بيانات", status: "in_progress", category: "data_analytics",
    assignedAmbassadorId: "amb-04", assignedAmbassadorName: "ريم الحربي",
    notes: [{ author: "ريم الحربي", text: "بدأنا بربط مصدرين من أصل أربعة، تقدم جيد.", at: daysAgo(1) }],
    updates: [{ text: "أنجزنا ربط أول مصدرين، سنكمل الباقي الأسبوع القادم.", author: "ريم الحربي", at: daysAgo(1) }],
    isDemo: true, createdAt: daysAgo(16), updatedAt: daysAgo(1),
  },
  {
    id: "REQ-DEMO-17", employeeId: "90302", employeeName: "عبدالرحمن الشهري", department: "خدمة العملاء",
    title: "تقرير أداء خدمة العملاء الأسبوعي يدوي بالكامل",
    description: "استخراج مؤشرات الرضا ووقت الاستجابة أسبوعيًا وتنسيقها في تقرير يدوي.",
    currentMethod: "تصدير بيانات خام ثم تنسيقها يدويًا في Excel وPowerPoint.",
    frequency: "أسبوعيًا", timeSpent: "3 ساعات أسبوعيًا", affectedScope: "فريقي",
    helpType: "أحتاج تحليل بيانات", status: "in_progress", category: "data_analytics",
    assignedAmbassadorId: "amb-05", assignedAmbassadorName: "عبدالعزيز الشهري",
    notes: [], updates: [{ text: "جاري تجربة لوحة متابعة مبسطة بدل التقرير اليدوي.", author: "عبدالعزيز الشهري", at: daysAgo(2) }],
    isDemo: true, createdAt: daysAgo(14), updatedAt: daysAgo(2),
  },
  {
    id: "REQ-DEMO-18", employeeId: "90303", employeeName: "لينا القحطاني", department: "العمليات",
    title: "تقرير متابعة المخزون الأسبوعي يدوي",
    description: "إعداد تقرير حالة المخزون أسبوعيًا بجمع الأرقام من عدة فروع يدويًا.",
    currentMethod: "طلب الأرقام من كل فرع عبر البريد ثم تجميعها يدويًا.",
    frequency: "أسبوعيًا", timeSpent: "ساعتان أسبوعيًا", affectedScope: "أكثر من إدارة",
    helpType: "أحتاج تحليل بيانات", status: "new", category: "data_analytics",
    assignedAmbassadorId: null, assignedAmbassadorName: null,
    notes: [], updates: [], isDemo: true, createdAt: daysAgo(2), updatedAt: daysAgo(2),
  },
];

const DEMO_REQUESTS = [
  ...DEMO_STANDALONE_REQUESTS,
  ...CLUSTER_1_REQUESTS,
  ...CLUSTER_2_REQUESTS,
  ...CLUSTER_3_REQUESTS,
];

const DEMO_CLUSTERS = [
  {
    id: "cluster-01",
    title: "تلخيص محاضر الاجتماعات",
    requestIds: CLUSTER_1_REQUESTS.map((r) => r.id),
    status: "under_review",
    isDemo: true,
    createdAt: daysAgo(12),
  },
  {
    id: "cluster-02",
    title: "البحث اليدوي في المستندات والأرشيف",
    requestIds: CLUSTER_2_REQUESTS.map((r) => r.id),
    status: "under_review",
    isDemo: true,
    createdAt: daysAgo(9),
  },
  {
    id: "cluster-03",
    title: "إعداد التقارير الأسبوعية يدويًا",
    requestIds: CLUSTER_3_REQUESTS.map((r) => r.id),
    status: "potential_use_case",
    isDemo: true,
    createdAt: daysAgo(8),
  },
];

const DEMO_EMPLOYEES = (() => {
  const map = new Map();
  DEMO_REQUESTS.forEach((r) => {
    if (!map.has(r.employeeId)) {
      map.set(r.employeeId, { employeeId: r.employeeId, name: r.employeeName, department: r.department });
    }
  });
  return Array.from(map.values());
})();

// يشغَّل مرة واحدة فقط إذا كانت قاعدة البيانات فارغة (بدون مستند meta/seed)
async function seedDemoDataIfNeeded() {
  try {
    const status = await DataLayer.meta.getSeedStatus();
    if (status) return false; // تم الزرع مسبقًا

    for (const amb of DEMO_AMBASSADORS) {
      await DataLayer.ambassadors.upsert(amb.id, amb);
    }
    for (const emp of DEMO_EMPLOYEES) {
      await DataLayer.employees.upsert(emp.employeeId, { name: emp.name, department: emp.department });
    }
    for (const req of DEMO_REQUESTS) {
      await DataLayer.requests.create(req);
    }
    for (const c of DEMO_CLUSTERS) {
      await DataLayer.clusters.create(c);
    }
    await DataLayer.meta.markSeeded();
    return true;
  } catch (e) {
    console.error("تعذّر زرع البيانات التجريبية", e);
    return false;
  }
}
