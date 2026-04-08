require('dotenv').config();
console.log("Checking environment variables...");
console.log("GITHUB_CLIENT_ID:", process.env.GITHUB_CLIENT_ID ? "Set" : "Missing");
console.log("GITHUB_CLIENT_SECRET:", process.env.GITHUB_CLIENT_SECRET ? "Set" : "Missing");
console.log("ENCRYPTION_KEY:", process.env.ENCRYPTION_KEY ? "Set" : "Missing");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Missing");
console.log("APP_URL:", process.env.APP_URL);
console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
console.log("GITHUB_REDIRECT_URI:", process.env.GITHUB_REDIRECT_URI);

const crypto = require('crypto');
try {
    const text = "test";
    const secretKey = process.env.ENCRYPTION_KEY;
    const salt = crypto.randomBytes(64);
    const key = crypto.pbkdf2Sync(secretKey, salt, 100000, 32, 'sha512');
    console.log("Encryption test: Success");
} catch (e) {
    console.error("Encryption test: Failed", e.message);
}
