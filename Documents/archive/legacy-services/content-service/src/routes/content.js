const express = require("express");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();

// In-memory job store (stub)
const jobs = {};

// POST /content/blog/outline

router.post("/blog/outline", async (req, res) => {
  const user = req.user || { sub: "unknown" };
  const { topic, style = "neutral" } = req.body || {};
  if (!topic || typeof topic !== "string") {
    return res.status(400).json({ ok: false, error: "invalid_topic" });
  }

  const outlineId = uuidv4();
  jobs[outlineId] = {
    id: outlineId,
    type: "outline",
    topic,
    style,
    status: "queued",
    createdBy: user.sub,
    result: null,
    createdAt: new Date().toISOString(),
  };

  return res.status(200).json({ ok: true, outlineId, status: "queued" });
});

// POST /content/blog/draft

router.post("/blog/draft", async (req, res) => {
  const user = req.user || { sub: "unknown" };
  const { outlineId, tone = "informative" } = req.body || {};
  if (!outlineId || typeof outlineId !== "string") {
    return res.status(400).json({ ok: false, error: "invalid_outlineId" });
  }

  const draftId = uuidv4();
  jobs[draftId] = {
    id: draftId,
    type: "draft",
    outlineId,
    tone,
    status: "queued",
    createdBy: user.sub,
    result: null,
    createdAt: new Date().toISOString(),
  };

  return res.status(200).json({ ok: true, draftId, status: "queued" });
});

// GET /content/jobs/:id
router.get("/jobs/:id", async (req, res) => {
  const id = req.params.id;
  const job = jobs[id];
  if (!job) return res.status(404).json({ ok: false, error: "job_not_found" });
  return res.status(200).json({ ok: true, job });
});

module.exports = router;
