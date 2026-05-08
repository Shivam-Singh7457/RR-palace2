import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('JWT_SECRET:', JSON.stringify(process.env.JWT_SECRET));
console.log('SMTP_USER:', JSON.stringify(process.env.SMTP_USER));
console.log('SMTP_PASS:', JSON.stringify(process.env.SMTP_PASS));
