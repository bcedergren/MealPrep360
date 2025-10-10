const { jwtVerify } = require("jose");

async function verifyClerkJwt(token) {
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

module.exports = { verifyClerkJwt };
