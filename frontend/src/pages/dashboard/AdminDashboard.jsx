import React from "react";

const Card = ({ title, value }) => (
  <div className="bg-white shadow rounded-xl p-6">
    <h3 className="text-gray-500 text-sm">{title}</h3>
    <p className="text-2xl font-bold mt-2">{value}</p>
  </div>
);

const AdminDashboard = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        Tổng quan hệ thống
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Tổng khách hàng" value="1,245" />
        <Card title="Hợp đồng đang hoạt động" value="876" />
        <Card title="Doanh thu tháng" value="350,000,000₫" />
      </div>

      <div className="bg-white shadow rounded-xl p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">
          Biểu đồ doanh thu (Demo)
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Chart Component Here
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;