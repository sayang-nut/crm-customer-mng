/**
 * @file     backend/src/database/seed.js
 * @location backend/src/database/
 * ─────────────────────────────────────────────────────────────────
 * VAI TRÒ: Chèn dữ liệu mẫu vào database đã có sẵn schema.
 *
 * ĐIỀU KIỆN TRƯỚC KHI CHẠY:
 *   1. MySQL đang chạy (local)
 *   2. Đã chạy schema.sql trong MySQL Workbench (tạo bảng trước)
 *   3. File backend/.env đã điền đúng thông tin DB
 *
 * CÁCH CHẠY:
 *   npm run db:seed           (từ thư mục gốc bado-crm/)
 *   node src/database/seed.js (từ thư mục backend/)
 *
 * DỮ LIỆU ĐƯỢC SEED:
 *   - 5 tài khoản nhân viên (admin, manager, sales, cskh, technical)
 *   - 12 ngành nghề (industries)
 *   - 3 nhóm giải pháp + 5 giải pháp + 9 gói dịch vụ
 *
 * MẬT KHẨU MẶC ĐỊNH: Bado@123 (đổi sau khi setup xong)
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const bcrypt    = require('bcryptjs');
const sequelize = require('../config/database');
const logger    = require('../config/logger');

// ── Helper: chạy query, bắt lỗi duplicate im lặng ────────────────
const run = (sql, replacements = []) =>
  sequelize.query(sql, { replacements }).catch((err) => {
    if (err.original?.code === 'ER_DUP_ENTRY') return; // ignore duplicate
    throw err;
  });

async function seed() {
  logger.info('🌱 Bắt đầu seed database...');

  // ── Kiểm tra kết nối ─────────────────────────────────────────
  await sequelize.authenticate();
  logger.info('✅ Kết nối MySQL thành công.');

  // ── 1. Tài khoản nhân viên ────────────────────────────────────
  logger.info('👤 Seeding: users...');
  const PW = await bcrypt.hash('Bado@123', 12);

  const users = [
    { name: 'Super Admin',   email: 'admin@bado.vn',     role: 'admin'     },
    { name: 'Nguyễn Manager',email: 'manager@bado.vn',   role: 'manager'   },
    { name: 'Trần Sales',    email: 'sales@bado.vn',     role: 'sales'     },
    { name: 'Lê CSKH',       email: 'cskh@bado.vn',      role: 'cskh'      },
    { name: 'Phạm Kỹ thuật', email: 'technical@bado.vn', role: 'technical' },
  ];

  for (const u of users) {
    await run(
      `INSERT IGNORE INTO users (full_name, email, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [u.name, u.email, PW, u.role]
    );
  }

  // ── 2. Ngành nghề ─────────────────────────────────────────────
  logger.info('🏭 Seeding: industries...');
  const industries = [
    'Thời trang & May mặc', 'Điện tử & Điện máy', 'Siêu thị & Tạp hóa',
    'Spa & Làm đẹp', 'Khách sạn & Lưu trú', 'Gym & Fitness',
    'Nhà hàng', 'Cà phê & Trà sữa', 'Bar & Nightclub',
    'Bán lẻ tổng hợp', 'Dược phẩm & Y tế', 'Giáo dục',
  ];
  for (const name of industries) {
    await run(`INSERT IGNORE INTO industries (name) VALUES (?)`, [name]);
  }

  // ── 3. Nhóm giải pháp ────────────────────────────────────────
  logger.info('📦 Seeding: solution_groups, solutions, service_packages...');
  const groups = [
    { name: 'Bán lẻ',             desc: 'Giải pháp cho các cửa hàng bán lẻ' },
    { name: 'Lưu trú & Làm đẹp', desc: 'Spa, Khách sạn, Gym' },
    { name: 'Ăn uống & Giải trí', desc: 'Nhà hàng, Cà phê, Bar' },
  ];
  for (const g of groups) {
    await run(
      `INSERT IGNORE INTO solution_groups (name, description) VALUES (?, ?)`,
      [g.name, g.desc]
    );
  }

  const [[retail]] = await sequelize.query(`SELECT id FROM solution_groups WHERE name = 'Bán lẻ' LIMIT 1`);
  const [[beauty]] = await sequelize.query(`SELECT id FROM solution_groups WHERE name = 'Lưu trú & Làm đẹp' LIMIT 1`);
  const [[fnb]]    = await sequelize.query(`SELECT id FROM solution_groups WHERE name = 'Ăn uống & Giải trí' LIMIT 1`);

  // ── 4. Giải pháp ─────────────────────────────────────────────
  const solutions = [
    { gid: retail.id, name: 'Bado Retail',  desc: 'Phần mềm quản lý bán lẻ' },
    { gid: retail.id, name: 'Bado Fashion', desc: 'Phần mềm quản lý thời trang' },
    { gid: beauty.id, name: 'Bado Care',    desc: 'Phần mềm quản lý spa & làm đẹp' },
    { gid: beauty.id, name: 'Bado Hotel',   desc: 'Phần mềm quản lý khách sạn' },
    { gid: fnb.id,    name: 'Bado FnB',     desc: 'Phần mềm quản lý nhà hàng & cà phê' },
  ];
  for (const s of solutions) {
    await run(
      `INSERT IGNORE INTO solutions (solution_group_id, name, description) VALUES (?, ?, ?)`,
      [s.gid, s.name, s.desc]
    );
  }

  const [[retailSol]] = await sequelize.query(`SELECT id FROM solutions WHERE name = 'Bado Retail' LIMIT 1`);
  const [[careSol]]   = await sequelize.query(`SELECT id FROM solutions WHERE name = 'Bado Care' LIMIT 1`);
  const [[fnbSol]]    = await sequelize.query(`SELECT id FROM solutions WHERE name = 'Bado FnB' LIMIT 1`);

  // ── 5. Gói dịch vụ ───────────────────────────────────────────
  const packages = [
    { sid: retailSol.id, name: 'Bado Retail – Hỗ trợ',          level: 'support',       pm: 0,       py: 0         },
    { sid: retailSol.id, name: 'Bado Retail – Cơ bản',           level: 'basic',         pm: 500000,  py: 5000000   },
    { sid: retailSol.id, name: 'Bado Retail – Chuyên nghiệp',    level: 'professional',  pm: 900000,  py: 9000000   },
    { sid: retailSol.id, name: 'Bado Retail – Đa kênh',          level: 'multichannel',  pm: 1500000, py: 15000000  },
    { sid: careSol.id,   name: 'Bado Care – Cơ bản',             level: 'basic',         pm: 500000,  py: 5000000   },
    { sid: careSol.id,   name: 'Bado Care – Chuyên nghiệp',      level: 'professional',  pm: 900000,  py: 9000000   },
    { sid: fnbSol.id,    name: 'Bado FnB – Cơ bản',              level: 'basic',         pm: 500000,  py: 5000000   },
    { sid: fnbSol.id,    name: 'Bado FnB – Chuyên nghiệp',       level: 'professional',  pm: 900000,  py: 9000000   },
    { sid: fnbSol.id,    name: 'Bado FnB – Đa kênh',             level: 'multichannel',  pm: 1500000, py: 15000000  },
  ];
  for (const p of packages) {
    await run(
      `INSERT IGNORE INTO service_packages
         (solution_id, name, level, price_monthly, price_yearly, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [p.sid, p.name, p.level, p.pm, p.py]
    );
  }

  // ── Done ──────────────────────────────────────────────────────
  logger.info('');
  logger.info('✅ Seed hoàn tất!');
  logger.info('');
  logger.info('📋 Tài khoản mặc định (mật khẩu: Bado@123):');
  logger.info('   admin@bado.vn     → Admin');
  logger.info('   manager@bado.vn   → Manager');
  logger.info('   sales@bado.vn     → Sales');
  logger.info('   cskh@bado.vn      → CSKH');
  logger.info('   technical@bado.vn → Kỹ thuật');
  logger.info('');
  logger.info('⚠️  Đổi mật khẩu ngay sau khi login lần đầu!');

  await sequelize.close();
  process.exit(0);
}

seed().catch((err) => {
  logger.error('❌ Seed thất bại:', err.message);
  logger.error('Kiểm tra lại:');
  logger.error('  1. MySQL đang chạy chưa?');
  logger.error('  2. Đã chạy schema.sql trong MySQL Workbench chưa?');
  logger.error('  3. File backend/.env đã điền đúng DB_HOST/DB_NAME/DB_USER/DB_PASSWORD chưa?');
  process.exit(1);
});