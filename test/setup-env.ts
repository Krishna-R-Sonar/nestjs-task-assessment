// test/setup-env.ts
import * as dotenv from 'dotenv';
import * as path from 'path';

console.log("🔍 Loading env from:", path.join(__dirname, '.env.test'));

dotenv.config({
  path: path.join(__dirname, '.env.test'),
});

console.log("🔐 JWT_SECRET loaded:", process.env.JWT_SECRET);
