// نسخة Backend من الثوابت المشتركة (بدون كود الوصول القديم — حُذف نهائيًا).
// أي تعديل على القوائم هنا يجب أن يبقى مطابقًا لملف constants.js في الواجهة الأمامية.

const CHALLENGE_DEFAULT_STATUS = "received";
const CHALLENGE_STATUS_IDS = [
  "received", "studying", "need_info", "verified", "evaluating", "approved",
  "forming_team", "designing", "prototyping", "testing", "implementing",
  "launched", "measuring", "completed", "not_suitable", "duplicate", "closed_no_action",
];
const CHALLENGE_CLOSURE_STATUSES = new Set(["not_suitable", "duplicate", "closed_no_action"]);

const PARTICIPATION_DEFAULT_STATUS = "new";
const PARTICIPATION_STATUS_IDS = ["new", "reviewed", "contacted", "joined", "closed"];

module.exports = {
  CHALLENGE_DEFAULT_STATUS,
  CHALLENGE_STATUS_IDS,
  CHALLENGE_CLOSURE_STATUSES,
  PARTICIPATION_DEFAULT_STATUS,
  PARTICIPATION_STATUS_IDS,
};
