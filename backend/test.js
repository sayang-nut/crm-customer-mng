const moduleAlias = require('module-alias');
const path = require('path');

moduleAlias.addAliases({
  '@modules': path.join(__dirname, 'src/modules'),
  '@middleware': path.join(__dirname, 'src/middleware'),
  '@config': path.join(__dirname, 'src/config'),
  '@utils': path.join(__dirname, 'src/utils'),
  '@database': path.join(__dirname, 'src/database')
});

try {
  const resolvedPath = require.resolve('@modules/auth/controller');
  console.log("Alias hoạt động ✅");
  console.log("Path thực:", resolvedPath);
} catch (err) {
  console.error("Alias lỗi ❌:", err.message);
}