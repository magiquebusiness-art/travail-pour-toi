const crypto = require('crypto');
const salt = 'seed-diane-nyxia-2024';
const password = 'NyXia2024!';
const data = Buffer.from(salt + password, 'utf-8');
const hashHex = crypto.createHash('sha256').update(data).digest('hex');
const hashStr = `$sha256$${salt}$${hashHex}`;
const id = crypto.randomUUID();
const affiliateCode = 'SUPERADM';

console.log('-- Diane Super Admin Seed');
console.log(`INSERT INTO users (id, email, password_hash, full_name, role, affiliate_code, created_at, updated_at)`);
console.log(`VALUES ('${id}', 'admin@nyxia.com', '${hashStr}', 'Diane (Super Admin)', 'super_admin', '${affiliateCode}', datetime('now'), datetime('now'));`);
console.log();
console.log('Login: admin@nyxia.com');
console.log('Password: NyXia2024!');
