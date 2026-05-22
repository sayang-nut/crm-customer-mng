# Bado CRM – Hệ thống Quản trị Quan hệ Khách hàng Nội bộ

> Dự án thực tập tốt nghiệp tại Công ty TNHH Dịch vụ và Giải pháp phần mềm Bado  
> Thời gian: 02/2026 – 04/2026

## Bối cảnh & Vấn đề

Bado là công ty phần mềm B2B với ~4 dòng sản phẩm (Retail, Care, F&B, Edu).  
Trước khi có hệ thống này, toàn bộ dữ liệu khách hàng được quản lý phân tán qua 
Excel, email, Google Sheets — dẫn đến mất dữ liệu, không theo dõi được vòng đời 
hợp đồng, và bỏ lỡ cơ hội gia hạn.

**Giải pháp:** Xây dựng hệ thống CRM nội bộ tùy biến hoàn toàn theo nghiệp vụ 
của Bado, thay thế các giải pháp thị trường (HubSpot, Odoo) không đáp ứng được 
đặc thù subscription-based B2B.

**Kiến trúc 3 tầng:** Presentation → Application (MVC + Layered) → Data  
**Bảo mật:** JWT (Access 15p + Refresh 7 ngày), bcrypt, Helmet, CORS, Rate Limiting

## Tính năng nổi bật

### Phân quyền 5 vai trò
| Vai trò | Phạm vi |
|---------|---------|
| Admin | Toàn quyền hệ thống |
| Manager | Xem toàn bộ, phê duyệt hợp đồng |
| Sales | Chỉ thấy khách hàng được giao |
| CSKH | Quản lý ticket, xem hợp đồng liên quan |
| Technical | Xử lý ticket được phân công |

### Tự động hóa (6 cron job)
- ⏰ Cảnh báo hợp đồng hết hạn trước **30 ngày** và **7 ngày**
- 🔄 Tự động chuyển trạng thái hợp đồng → `Expired`
- 🎫 Cảnh báo ticket không cập nhật sau **36 giờ**
- ✅ Tự động đóng ticket đã Resolve sau **72 giờ**

### Vòng đời dữ liệu chuẩn hóa
- Khách hàng: `Lead → Active → Expired → Churned`
- Hợp đồng: `Pending → Active → Near_Expired → Expired`
- Ticket: `Open → Processing → Resolved → Closed`


## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | ReactJS, Redux Toolkit, React Router, Tailwind CSS, Vite |
| Backend | Node.js, Express.js, Sequelize ORM, Node-Cron |
| Database | MySQL |
| Auth | JWT (Access + Refresh Token) |
| Storage | Cloudinary |
| Security | bcrypt, Helmet, CORS, Rate Limiting, express-validator |

## Screenshots

| Dashboard Admin | Quản lý Khách hàng |
|---|---|
| ![](./screenshots/dashboard.png) | ![](./screenshots/customers.png) |

| Chi tiết Hợp đồng | Ticket Support |
|---|---|
| ![](screenshots/contract.png) | ![](screenshots/ticket.png) |

