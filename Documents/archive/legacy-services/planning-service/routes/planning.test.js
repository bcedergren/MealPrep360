const request = require("supertest");
const express = require("express");
const planningRoutes = require("./planning");

const app = express();
app.use(express.json());
app.use("/planning", planningRoutes);

describe("Planning Service Endpoints", () => {
  it("POST /planning/plan returns 400 for missing meals", async () => {
    const res = await request(app).post("/planning/plan").send({ meals: [] });
    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("POST /planning/plan returns 200 for valid meals", async () => {
    const res = await request(app)
      .post("/planning/plan")
      .send({ meals: [{ name: "Meal1" }] });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.planId).toBeDefined();
  });

  it("POST /planning/smart-list returns 200", async () => {
    const res = await request(app).post("/planning/smart-list").send({});
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.listId).toBeDefined();
  });
});
