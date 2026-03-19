const sequelize = require('../../config/database');
const { ROLES } = require('../../config/constants');

const getAdminDashboard = async () => {
  const [[customerStats]] = await sequelize.query(`
    SELECT
      COUNT(*) as total,
      SUM(status='lead') as lead_count,
      SUM(status='active') as active_count,
      SUM(status='expired') as expired_count
    FROM customers
  `);

  const [[contractStats]] = await sequelize.query(`
    SELECT
      COUNT(*) as total,
      SUM(status='active') as active_count,
      SUM(status='near_expired') as near_expired_count,
      SUM(status='expired') as expired_count,
      SUM(status='cancelled') as cancelled_count
    FROM contracts
  `);

  const [[ticketStats]] = await sequelize.query(`
    SELECT
      COUNT(*) as total,
      SUM(status='open') as open_count,
      SUM(status='processing') as processing_count,
      SUM(status='resolved') as resolved_count,
      SUM(status='closed') as closed_count
    FROM tickets
  `);

  const [[revenueCurrentMonth]] = await sequelize.query(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM revenues WHERE MONTH(payment_date) = MONTH(CURDATE()) AND YEAR(payment_date) = YEAR(CURDATE())
  `);

  const [[revenueCurrentYear]] = await sequelize.query(`
    SELECT COALESCE(SUM(amount), 0) as total FROM revenues WHERE YEAR(payment_date) = YEAR(CURDATE())
  `);

  const [revenueByMonth] = await sequelize.query(`
    SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, SUM(amount) as total
    FROM revenues WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY month ORDER BY month ASC
  `);

  const [revenueBySolution] = await sequelize.query(`
    SELECT s.name as solution_name, SUM(r.amount) as total
    FROM revenues r JOIN contracts c ON c.id = r.contract_id JOIN solutions s ON s.id = c.solution_id
    WHERE YEAR(r.payment_date) = YEAR(CURDATE())
    GROUP BY s.id ORDER BY total DESC
  `);

  const [expiringContracts] = await sequelize.query(`
    SELECT c.id, c.contract_number, c.end_date, c.status,
           cu.company_name, u.full_name as sales_name,
           DATEDIFF(c.end_date, CURDATE()) as days_left
    FROM contracts c
    JOIN customers cu ON cu.id = c.customer_id
    JOIN users u ON u.id = c.assigned_to
    WHERE c.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    AND c.status = 'active'
    ORDER BY c.end_date ASC LIMIT 10
  `);

  const [overdueTickets] = await sequelize.query(`
    SELECT t.id, t.title, t.priority, t.status, t.created_at,
           cu.company_name, u.full_name as assigned_to_name,
           TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) as stale_hours
    FROM tickets t
    JOIN customers cu ON cu.id = t.customer_id
    LEFT JOIN users u ON u.id = t.assigned_to
    WHERE t.status IN ('open','processing')
    AND TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) >= 36
    ORDER BY stale_hours DESC LIMIT 10
  `);

  const [customersByIndustry] = await sequelize.query(`
    SELECT i.name as industry, COUNT(c.id) as count
    FROM customers c JOIN industries i ON i.id = c.industry_id
    GROUP BY i.id ORDER BY count DESC
  `);

  return {
    customerStats,
    contractStats,
    ticketStats,
    revenue: {
      currentMonth: revenueCurrentMonth.total,
      currentYear: revenueCurrentYear.total,
      byMonth: revenueByMonth,
      bySolution: revenueBySolution,
    },
    expiringContracts,
    overdueTickets,
    customersByIndustry,
  };
};

const getSalesDashboard = async (userId) => {
  const [[myCustomers]] = await sequelize.query(`
    SELECT COUNT(*) as total, SUM(status='lead') as lead, SUM(status='active') as active
    FROM customers WHERE assigned_to = ?
  `, { replacements: [userId] });

  const [[myRevenue]] = await sequelize.query(`
    SELECT COALESCE(SUM(amount),0) as month_total
    FROM revenues WHERE created_by = ?
    AND MONTH(payment_date)=MONTH(CURDATE()) AND YEAR(payment_date)=YEAR(CURDATE())
  `, { replacements: [userId] });

  const [myExpiringContracts] = await sequelize.query(`
    SELECT c.id, c.contract_number, c.end_date, cu.company_name,
           DATEDIFF(c.end_date, CURDATE()) as days_left
    FROM contracts c JOIN customers cu ON cu.id = c.customer_id
    WHERE c.assigned_to = ? AND c.status = 'active'
    AND c.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    ORDER BY c.end_date ASC
  `, { replacements: [userId] });

  const [myRevenueByMonth] = await sequelize.query(`
    SELECT DATE_FORMAT(payment_date,'%Y-%m') as month, SUM(amount) as total
    FROM revenues WHERE created_by = ?
    AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY month ORDER BY month ASC
  `, { replacements: [userId] });

  return { myCustomers, myRevenue, myExpiringContracts, myRevenueByMonth };
};

const getCSKHDashboard = async (userId) => {
  const [[myTickets]] = await sequelize.query(`
    SELECT COUNT(*) as total,
           SUM(status='open') as open, SUM(status='processing') as processing,
           SUM(status='resolved') as resolved
    FROM tickets WHERE assigned_to = ?
  `, { replacements: [userId] });

  const [myOverdueTickets] = await sequelize.query(`
    SELECT t.id, t.title, t.priority, t.status,
           cu.company_name, TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) as stale_hours
    FROM tickets t JOIN customers cu ON cu.id = t.customer_id
    WHERE t.assigned_to = ? AND t.status IN ('open','processing')
    AND TIMESTAMPDIFF(HOUR, t.last_updated_at, NOW()) >= 36
    ORDER BY stale_hours DESC
  `, { replacements: [userId] });

  return { myTickets, myOverdueTickets };
};

module.exports = { getAdminDashboard, getSalesDashboard, getCSKHDashboard };