require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET غير مضبوط في متغيرات البيئة — السيرفر لن يبدأ.");
  process.exit(1);
}

const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json({ limit: "1mb" }));

// نفس الخدمة تخدم الواجهة الأمامية (الملفات الثابتة في جذر المستودع) والـ API معًا
// على نطاق واحد في Render — هذا يلغي الحاجة لإعداد CORS بين موقعين، ويبسّط
// النشر إلى خدمة Render واحدة فقط. FRONTEND_ORIGIN يبقى مفيدًا فقط لو قررت
// مستقبلًا تفصل الواجهة عن الـ API على نطاقين مختلفين.
const allowedOrigin = process.env.FRONTEND_ORIGIN || "*";
app.use(cors({ origin: allowedOrigin }));

const FRONTEND_ROOT = path.join(__dirname, "..");
app.use(express.static(FRONTEND_ROOT));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/ambassadors", require("./src/routes/ambassadors"));
app.use("/api/challenges", require("./src/routes/challenges"));
app.use("/api/participation", require("./src/routes/participation"));
app.use("/api/admin", require("./src/routes/admin"));

// التطبيق Hash-router (كل المسارات بعد #) فلا حاجة لإعادة توجيه مسارات خادمية —
// فقط تأكيد أن الصفحة الرئيسية تُخدَّم لأي رابط لا يبدأ بـ /api
app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(FRONTEND_ROOT, "index.html")));

// معالج أخطاء عام — لا يسرّب تفاصيل داخلية للعميل
app.use((err, req, res, next) => {
  console.error("Unhandled error", err);
  res.status(500).json({ error: "خطأ غير متوقع في السيرفر" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`AI Ambassadors backend listening on :${port}`));
