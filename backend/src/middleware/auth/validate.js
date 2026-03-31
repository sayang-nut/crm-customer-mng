
const { validationResult } = require('express-validator');
 
const validate = (req, res, next) => {
  const errors = validationResult(req);
 
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu đầu vào không hợp lệ.',
      errors:  errors.array().map((e) => ({
        field:   e.path,
        message: e.msg,
        value:   process.env.NODE_ENV !== 'production' ? e.value : undefined,
      })),
    });
  }
 
  next();
};
 
module.exports = { validate };