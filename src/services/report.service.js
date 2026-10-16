const reportRepository = require('../repositories/report.repository');
const { AppError } = require('../utils/response');

function getDateRange(query) {
  const today = new Date();
  const defaultTo = today.toISOString().slice(0, 10);
  const defaultFromDate = new Date(today);
  defaultFromDate.setUTCDate(defaultFromDate.getUTCDate() - 30);
  const defaultFrom = defaultFromDate.toISOString().slice(0, 10);
  const from = query.from || defaultFrom;
  const to = query.to || defaultTo;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
    throw new AppError('INVALID_INPUT', 'Khoảng thời gian báo cáo không hợp lệ.', 400);
  }
  return { from, to };
}

class ReportService {
  async getAll(query) {
    const range = getDateRange(query);
    return require('../utils/cache').reports.get(JSON.stringify(range), async () => {
    const [revenueByStatus, bookingsByDay, occupancyByRoomType] = await Promise.all([
      reportRepository.revenueByStatus(range),
      reportRepository.bookingsByDay(range),
      reportRepository.occupancyByRoomType(range)
    ]);
    return { range, revenueByStatus, bookingsByDay, occupancyByRoomType };
    });
  }
}

module.exports = new ReportService();