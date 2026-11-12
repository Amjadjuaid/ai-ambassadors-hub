const express = require("express");
const { db } = require("../firebaseAdmin");
const { nextRef } = require("../counters");
const { makeHistoryCollection } = require("../historyCollection");
const { PARTICIPATION_DEFAULT_STATUS } = require("../constants");
const { requireAuth } = require("../auth");

const router = express.Router();
const participation = makeHistoryCollection("participationRequests");

function clean(str) { return (str || "").toString().trim(); }

// POST /api/participation  — عام: أي موظف يسجّل اهتمامه بدون تسجيل دخول.
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
    const refNumber = await nextRef("participation", "AI-PT");
    const aiTools = Array.isArray(b.aiTools) ? b.aiTools : (b.aiTools ? [b.aiTools] : []);
    const data = {
      id: refNumber, refNumber,
      name: clean(b.employeeName), employeeId: clean(b.employeeId),
      department: clean(b.department), track: clean(b.track),
      aiTools, aiToolsOther: clean(b.aiToolsOther),
      hasBuiltBefore: clean(b.hasBuiltBefore), experienceDescription: clean(b.experienceDescription),
      status: PARTICIPATION_DEFAULT_STATUS,
      originalAmbassadorId: amb ? amb.id : null, originalAmbassadorName: amb ? amb.name : null,
      assignedAmbassadorId: amb ? amb.id : null, assignedAmbassadorName: amb ? amb.name : null,
      statusHistory: [{ from: null, to: PARTICIPATION_DEFAULT_STATUS, changedBy: "النظام", changedAt: now }],
      assignmentHistory: [],
      notes: [],
      submittedAt: now, createdAt: now, updatedAt: now,
    };
    await participation.create(refNumber, data);
    res.status(201).json(data);
  } catch (err) {
    console.error("POST /participation error", err);
    res.status(500).json({ error: "تعذّر إرسال الطلب" });
  }
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    res.json(await participation.listAll());
  } catch (err) {
    console.error("GET /participation error", err);
    res.status(500).json({ error: "خطأ غير متوقع" });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const item = await participation.get(req.params.id);
    if (!item) return res.status(404).json({ error: "غير موجود" });
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: "status مطلوب" });
    await participation.changeStatus(req.params.id, { from: item.status, to: status, changedBy: req.ambassador.name });
    res.json({ ok: true });
  } catch (err) {
    console.error("PATCH /participation/:id/status error", err);
    res.status(500).json({ error: "خطأ غير متوقع" });
  }
});

router.post("/:id/notes", async (req, res) => {
  try {
    const text = clean(req.body && req.body.text);
    if (!text) return res.status(400).json({ error: "النص مطلوب" });
    await participation.addNote(req.params.id, { text, author: req.ambassador.name, at: new Date().toISOString() });
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /participation/:id/notes error", err);
    res.status(500).json({ error: "خطأ غير متوقع" });
  }
});

router.patch("/:id/reassign", async (req, res) => {
  try {
    const item = await participation.get(req.params.id);
    if (!item) return res.status(404).json({ error: "غير موجود" });
    const { to, toName, reason, reasonOther } = req.body || {};
    await participation.reassign(req.params.id, {
      from: item.assignedAmbassadorId, fromName: item.assignedAmbassadorName,
      to, toName, reason, reasonOther, changedBy: req.ambassador.name,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("PATCH /participation/:id/reassign error", err);
    res.status(500).json({ error: "خطأ غير متوقع" });
  }
});

module.exports = router;
