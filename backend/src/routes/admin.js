// نقطة إعداد لمرّة واحدة: تولّد كلمة مرور عشوائية لكل سفير ما عنده passwordHash بعد،
// وتخزّن الـ hash في Firestore، وترجّع القائمة بالنص الصريح في الرد مرة واحدة فقط
// (لا تُخزَّن كلمات المرور الصريحة في أي مكان). محمية بمفتاح SETUP_KEY من متغيرات البيئة
// — احذف هذا الملف أو امسح SETUP_KEY بعد الاستخدام لإغلاق المسار نهائيًا.

const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { db } = require("../firebaseAdmin");

const router = express.Router();

function randomPassword() {
  // كلمة مرور قابلة للنطق/النسخ، 10 محارف من أحرف وأرقام غير ملتبسة
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

router.post("/seed-passwords", async (req, res) => {
  if (!process.env.SETUP_KEY || req.headers["x-setup-key"] !== process.env.SETUP_KEY) {
    return res.status(403).json({ error: "غير مصرّح" });
  }
  try {
    const snap = await db.collection("ambassadors").get();
    const results = [];
    for (const doc of snap.docs) {
      const amb = doc.data();
      if (amb.isDemo === true) continue;
      if (amb.passwordHash && !req.body?.force) continue; // لا يُعاد توليدها إلا بطلب صريح force:true
      const plain = randomPassword();
      const passwordHash = await bcrypt.hash(plain, 12);
      await doc.ref.update({ passwordHash, passwordUpdatedAt: new Date().toISOString() });
      results.push({ ambassadorId: doc.id, name: amb.name || "", password: plain });
    }
    res.json({ generated: results.length, credentials: results });
  } catch (err) {
    console.error("seed-passwords error", err);
    res.status(500).json({ error: "خطأ غير متوقع" });
  }
});

module.exports = router;
