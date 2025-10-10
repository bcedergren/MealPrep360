const request = require("supertest");
const express = require("express");
const contentRoutes = require("./content");

const app = express();
app.use(express.json());
app.use("/content", contentRoutes);

describe("Content Service Endpoints", () => {
  it("POST /content/blog/outline returns 400 for missing topic", async () => {
    const res = await request(app).post("/content/blog/outline").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("POST /content/blog/outline returns 200 for valid topic", async () => {
    const res = await request(app)
      .post("/content/blog/outline")
      .send({ topic: "Meal Prep" });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.outlineId).toBeDefined();
  });

  it("POST /content/blog/draft returns 400 for missing outlineId", async () => {
    const res = await request(app).post("/content/blog/draft").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("POST /content/blog/draft returns 200 for valid outlineId", async () => {
    const res = await request(app)
      .post("/content/blog/draft")
      .send({ outlineId: "outline-1" });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.draftId).toBeDefined();
  });

  it("GET /content/jobs/:id returns 404 for unknown job", async () => {
    const res = await request(app).get("/content/jobs/unknown");
    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
  });
});
