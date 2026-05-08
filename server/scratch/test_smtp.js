import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('--- SMTP Test Configuration ---');
console.log('Host: smtp-relay.brevo.com');
console.log('User:', process.env.SMTP_USER);
console.log('Pass Length:', process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0);
console.log('Sender:', process.env.SENDER_EMAIL);
console.log('-------------------------------\n');

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function runTest() {
    console.log('Verifying connection...');
    try {
        await transporter.verify();
        console.log('✅ Connection verified successfully!');
        
        console.log('Sending test email to', process.env.SENDER_EMAIL, '...');
        const info = await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: process.env.SENDER_EMAIL,
            subject: 'SMTP Test from RR Palace',
            text: 'If you receive this, your SMTP settings are correct.',
            html: '<b>If you receive this, your SMTP settings are correct.</b>',
        });
        console.log('✅ Email sent successfully! Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Error Detected:');
        console.error('Code:', error.code);
        console.error('Response:', error.response);
        console.error('Response Code:', error.responseCode);
        console.error('Message:', error.message);
        
        if (error.responseCode === 535) {
            console.log('\n💡 Suggestion: Brevo rejected your credentials. Please ensure:');
            console.log('1. You are using the SMTP KEY, not your login password.');
            console.log('2. The key is active in your Brevo dashboard.');
        }
    }
}

runTest();
