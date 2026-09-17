require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log('====================================================');
  console.log('  CSE702051 - THIET KE WEB NANG CAO | DH PHENIKAA');
  console.log('  DE TAI 07: HE THONG QUAN LY KHACH SAN VA DAT PHONG');
  console.log(`  May chu dang lang nghe tai cong: ${PORT}`);
  console.log(`  Dia chi cuc bo: http://localhost:${PORT}`);
  console.log(`  Diem cuoi kiem tra: http://localhost:${PORT}/api/v1/health`);
  console.log('====================================================');
});
