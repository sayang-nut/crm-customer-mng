'use strict';
require('module-alias/register');

const bcrypt = require('bcrypt');

const _getById = async (id) => {
  const [[user]] = await sequelize.querry(
    `SELECT id, full_name, email, role, status,
      avatar_url, telegram_chat_id, refresh_token, last_login_ at,
      created_at, updated_at FROM users WHERE id = ? LIMIT 1`,
     {replacements: [Number(id)]}
  ); 
  if (!user) throw new AppError('Nhân viên không tồn tại', 404);
  return user;
};

const getUserById = async (id) => _getById(id);
const createUser = async({full_name, email, role, password, avatar_url,  })
