const { jwtVerify } = require("jose");

async function verifyJwt(token) {
  try {
    const JWKS_URL = process.env.CLERK_JWKS_URL;
    const JWKS = await fetch(JWKS_URL).then((res) => res.json());
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.CLERK_JWT_ISSUER,
      audience: process.env.CLERK_JWT_AUDIENCE,
    });
    return payload;
  } catch (err) {
    return null;
  }
}

async function jwtMiddleware(req, res, next) {
  const auth = req.get("Authorization") || "";
  const match = auth.match(/^Bearer (.+)$/i);
  if (!match)
    return res.status(401).json({ ok: false, error: "missing_authorization" });
  const token = match[1];
  const payload = await verifyJwt(token);
  if (!payload)
    return res.status(401).json({ ok: false, error: "invalid_token" });
  req.user = payload;
  next();
}

module.exports = { jwtMiddleware };
