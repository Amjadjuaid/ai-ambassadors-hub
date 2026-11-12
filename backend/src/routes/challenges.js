const express = require("express");
const { db } = require("../firebaseAdmin");
const { nextRef } = require("../counters");
const { makeHistoryCollection } = require("../historyCollection");
const { CHALLENGE_DEFAULT_STATUS } = require("../constants");
const { requireAuth } = require("../auth");

const router = express.Router();
const challenges = makeHistoryCollection("challenges");

function clean(str) { return (str || "").toString().trim(); }

// POST /api/challenges  — عام: أي موظف يرفع تحدي بدون أي تسجيل دخول.
router.post("/", async (req, res) => {
  try {
    const b = req.body || {};
    const ambId = clean(b.ambassadorId);
    let amb = null;
    if (ambId) {
      const snap = await db.collection("ambassadors").doc(ambId).get();
      if (snap.exists) amb = { id: ambId, name: snap.data().name };
    }
    const now = new Date().toISOString();
    const refNumber = await nextRef("challenges", "AI-CH");
    const data = {
      id: refNumber, refNumber,
      employeeName: clean(b.employeeName), employeeId: clean(b.employeeId),
      department: clean(b.department), track: clean(b.track),
      title: clean(b.title), description: clean(b.description),
      timeImpact: clean(b.timeImpact), affectedParties: clean(b.affectedParties),
      status: CHALLENGE_DEFAULT_STATUS,
      closureReason: null, closedBy: null, closedAt: null,
      originalAmbassadorId: amb ? amb.id : null, originalAmbassadorName: amb ? amb.name : null,
      assignedAmbassadorId: amb ? amb.id : null, assignedAmbassadorName: amb ? amb.name : null,
      statusHistory: [{ from: null, to: CHALLENGE_DEFAULT_STATUS, changedBy: "النظام", changedAt: now }],
      assignmentHistory: [],
      notes: [],
      submittedAt: now, createdAt: now, updatedAt: now,
    };
    await challenges.create(refNumber, data);
    res.status(201).json(data);
  } catch (err) {
    console.error("POST /challenges error", err);
    res.status(500).json({ error: "تعذّر إرسال الطلب" });
  }
});

// كل ما يلي يتطلب تسجيل دخول سفير (JWT صالح)
router.use(requireAuth);

// GET /api/challenges  — قائمة كاملة (نفس سلوك التطبيق القديم: كل سفير يشوف الكل للتنسيق بينهم)
router.get("/", async (req, res) => {
  try {
    res.json(await challenges.listAll());
  } catch (err) {
    console.error("GET /challenges error", err);
    res.status(500).json({ error: "خطأ غير متوقع" });
  }
});

// PATCH /api/challenges/:id/status  { status, closureReason? }
router.patch("/:id/status", async (req, res) => {
  try {
    const item = await challenges.get(req.params.id);
    if (!item) return res.status(404).json({ error: "غير موجود" });
    const { status, closureReason } = req.body || {};
    if (!status) return res.status(400).json({ error: "status مطلوب" });
    await challenges.changeStatus(req.params.id, {
      from: item.status, to: status, changedBy: req.ambassador.name,
      closureReason: closureReason || null,
      closedBy: closureReason ? req.ambassador.name : null,
      closedAt: closureReason ? new Date().toISOString() : null,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("PATCH /challenges/:id/status error", err);
    res.status(500).json({ error: "خطأ غير متوقع" });
  }
});

// POST /api/challenges/:id/notes  { text }
router.post("/:id/notes", async (req, res) => {
  try {
    const text = clean(req.body && req.body.text);
    if (!text) return res.status(400).json({ error: "النص مطلوب" });
    await challenges.addNote(req.params.id, { text, author: req.ambassador.name, at: new Date().toISOString() });
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /challenges/:id/notes error", err);
    res.status(500).json({ error: "خطأ غير متوقع" });
  }
});

// PATCH /api/challenges/:id/reassign  { to, toName, reason, reasonOther }
router.patch("/:id/reassign", async (req, res) => {
  try {
    const item = await challenges.get(req.params.id);
    if (!item) return res.status(404).json({ error: "غير موجود" });
    const { to, toName, reason, reasonOther } = req.body || {};
    await challenges.reassign(req.params.id, {
      from: item.assignedAmbassadorId, fromName: item.assignedAmbassadorName,
      to, toName, reason, reasonOther, changedBy: req.ambassador.name,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("PATCH /challenges/:id/reassign error", err);
    res.status(500).json({ error: "خطأ غير متوقع" });
  }
});

module.exports = router;
