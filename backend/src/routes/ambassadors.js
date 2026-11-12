const express = require("express");
const { db } = require("../firebaseAdmin");

const router = express.Router();

// GET /api/ambassadors  — عام (بدون مصادقة): فقط الحقول العامة اللازمة لقوائم الاختيار،
// لا يُعاد أبدًا passwordHash أو أي حقل حساس آخر.
router.get("/", async (req, res) => {
  try {
    const snap = await db.collection("ambassadors").get();
    const list = snap.docs
      .map((d) => {
        const a = d.data();
        if (a.isDemo === true) return null;
        return { id: d.id, name: a.name || "", department: a.department || null, track: a.track || null };
      })
      .filter(Boolean);
    list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
    res.json(list);
  } catch (err) {
    console.error("GET /ambassadors error", err);
    res.status(500).json({ error: "خطأ غير متوقع" });
  }
});

module.exports = router;
