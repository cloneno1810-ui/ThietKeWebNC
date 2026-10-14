const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Neon Serverless driver: ket noi qua HTTPS (cong 443)
// Khong bi tuong lua cua mang truong / mang noi bo chan cong 5432
// Ca sql() tagged template va sql.query() deu tra ve mang rows truc tiep
const sql = neon(process.env.DATABASE_URL);

module.exports = {
  /**
   * Thuc thi mot truy van SQL tham so hoa.
   * Dung $1, $2, ... lam placeholder (khong duoc ghep chuoi SQL - BM1).
   * @param {string} text   - Cau truy van SQL
   * @param {Array}  params - Mang gia tri tham so
   * @returns {Promise<{ rows: any[], rowCount: number }>}
   */
  query: async (text, params) => {
    // sql.query() tra ve mang rows truc tiep (da xac nhan qua kiem thu)
    const rows = await sql.query(text, params || []);
    return { rows, rowCount: rows.length };
  },

  /**
   * Han the template literal cho cac truy van phuc tap hon.
   * Vi du: await sql`SELECT * FROM users WHERE id = ${userId}`
   */
  sql
};
