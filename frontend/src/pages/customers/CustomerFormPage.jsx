/**
 * @file     frontend/src/pages/customers/CustomerFormPage.jsx
 * @theme    WHITE PLAIN - No effects, no rounded, sync Header
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCustomerById,
  createCustomer,
  updateCustomer,
  clearCurrentCustomer,
} from '../../store/slices/customerSlice';
import { addNotification } from '../../store/slices/notificationSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';

const CustomerFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCustomer, loading } = useAppSelector((state) => state.customers);

  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    company_name: '',
    tax_code: '',
    industry: '',
    representative_name: '',
    representative_position: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    status: 'lead',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchCustomerById(id));
    }

    return () => {
      dispatch(clearCurrentCustomer());
    };
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (isEditMode && currentCustomer) {
      setFormData({
        company_name: currentCustomer.company_name || '',
        tax_code: currentCustomer.tax_code || '',
        industry: currentCustomer.industry || '',
        representative_name: currentCustomer.representative_name || '',
        representative_position: currentCustomer.representative_position || '',
        email: currentCustomer.email || '',
        phone: currentCustomer.phone || '',
        address: currentCustomer.address || '',
        website: currentCustomer.website || '',
        status: currentCustomer.status || 'lead',
        notes: currentCustomer.notes || '',
      });
    }
  }, [isEditMode, currentCustomer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Vui lòng nhập tên công ty';
    }
    if (!formData.tax_code.trim()) {
      newErrors.tax_code = 'Vui lòng nhập mã số thuế';
    } else if (!/^\d{10}(-\d{3})?$/.test(formData.tax_code)) {
      newErrors.tax_code = 'Mã số thuế không hợp lệ (10-13 số)';
    }
    if (!formData.industry) {
      newErrors.industry = 'Vui lòng chọn ngành nghề';
    }
    if (!formData.representative_name.trim()) {
      newErrors.representative_name = 'Vui lòng nhập tên người đại diện';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0|\+84)[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Lỗi validation',
          message: 'Vui lòng kiểm tra lại thông tin nhập vào',
        })
      );
      return;
    }
    setSubmitting(true);
    try {
      if (isEditMode) {
        await dispatch(updateCustomer({ id, data: formData })).unwrap();
        dispatch(
          addNotification({
            type: 'success',
            title: 'Cập nhật thành công',
            message: `Khách hàng ${formData.company_name} đã được cập nhật`,
          })
        );
      } else {
        await dispatch(createCustomer(formData)).unwrap();
        dispatch(
          addNotification({
            type: 'success',
            title: 'Thêm thành công',
            message: `Khách hàng ${formData.company_name} đã được thêm vào hệ thống`,
          })
        );
      }
      navigate('/customers');
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          title: isEditMode ? 'Cập nhật thất bại' : 'Thêm thất bại',
          message: error.message || 'Có lỗi xảy ra, vui lòng thử lại',
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(isEditMode ? `/customers/${id}` : '/customers');
  };

  if (isEditMode && loading && !currentCustomer) {
    return <Loading fullScreen text="Đang tải thông tin khách hàng..." />;
  }

  return (
    <div className="bg-white min-h-full">
      {/* Header - PLAIN WHITE */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-gray-600 hover:text-dark-900 mb-6 transition-colors font-medium group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Quay lại danh sách khách hàng</span>
        </button>

        <h1 className="text-4xl font-black text-dark-900 tracking-tight mb-2">
          {isEditMode ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        </h1>
        <p className="text-gray-600 text-lg">
          {isEditMode
            ? 'Cập nhật thông tin khách hàng'
            : 'Nhập đầy đủ thông tin để thêm khách hàng mới vào hệ thống'}
        </p>
      </div>

      {/* Form - NO ROUNDED, NO SHADOW */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Company Information */}
            <Card 
              title={<span className="text-xl font-bold text-dark-900">Thông tin công ty</span>}
              className="!rounded-none !shadow-none !border-gray-200 p-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                <div className="md:col-span-2">
                  <Input
                    label="Tên công ty"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    error={errors.company_name}
                    required
                    placeholder="VD: Công ty TNHH ABC"
                    className="!rounded-none !border-gray-300"
                  />
                </div>

                <Input
                  label="Mã số thuế"
                  name="tax_code"
                  value={formData.tax_code}
                  onChange={handleChange}
                  error={errors.tax_code}
                  required
                  placeholder="VD: 0123456789"
                  className="!rounded-none !border-gray-300"
                />

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-1.5">
                    Ngành nghề <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className={`h-[42px] px-3 border border-gray-300 text-dark-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all ${
                      errors.industry ? 'border-red-500 bg-red-50' : 'bg-white'
                    }`}
                  >
                    <option value="">Chọn ngành nghề</option>
                    <optgroup label="Bán lẻ">
                      <option value="Thời trang">Thời trang</option>
                      <option value="Điện thoại & Điện máy">Điện thoại & Điện máy</option>
                      <option value="Vật liệu xây dựng">Vật liệu xây dựng</option>
                      <option value="Nhà thuốc">Nhà thuốc</option>
                      <option value="Mẹ và bé">Mẹ và bé</option>
                      <option value="Sách & Văn phòng phẩm">Sách & Văn phòng phẩm</option>
                    </optgroup>
                    <optgroup label="Lưu trú & Làm đẹp">
                      <option value="Spa & Massage">Spa & Massage</option>
                      <option value="Hair Salon & Nails">Hair Salon & Nails</option>
                      <option value="Khách sạn & Nhà nghỉ">Khách sạn & Nhà nghỉ</option>
                      <option value="Homestay & Villa">Homestay & Villa</option>
                      <option value="Resort">Resort</option>
                      <option value="Fitness & Yoga">Fitness & Yoga</option>
                    </optgroup>
                    <optgroup label="Ăn uống & Giải trí">
                      <option value="Nhà hàng">Nhà hàng</option>
                      <option value="Cà phê & Trà sữa">Cà phê & Trà sữa</option>
                      <option value="Karaoke & Bida">Karaoke & Bida</option>
                      <option value="Bar & Pub">Bar & Pub</option>
                      <option value="Căn tin & Trạm nghỉ">Căn tin & Trạm nghỉ</option>
                    </optgroup>
                  </select>
                  {errors.industry && (
                    <p className="text-xs text-red-500 mt-1">{errors.industry}</p>
                  )}
                </div>

                <Input
                  label="Website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="!rounded-none !border-gray-300"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Địa chỉ"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    error={errors.address}
                    required
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    className="!rounded-none !border-gray-300"
                  />
                </div>
              </div>
            </Card>

            {/* Representative Information */}
            <Card 
              title={<span className="text-xl font-bold text-dark-900">Thông tin người đại diện</span>}
              className="!rounded-none !shadow-none !border-gray-200 p-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                <Input
                  label="Họ và tên"
                  name="representative_name"
                  value={formData.representative_name}
                  onChange={handleChange}
                  error={errors.representative_name}
                  required
                  placeholder="VD: Nguyễn Văn A"
                  className="!rounded-none !border-gray-300"
                />
                <Input
                  label="Chức vụ"
                  name="representative_position"
                  value={formData.representative_position}
                  onChange={handleChange}
                  placeholder="VD: Giám đốc"
                  className="!rounded-none !border-gray-300"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  placeholder="example@company.com"
                  className="!rounded-none !border-gray-300"
                />
                <Input
                  label="Số điện thoại"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  required
                  placeholder="0901234567"
                  className="!rounded-none !border-gray-300"
                />
              </div>
            </Card>

            {/* Additional Information */}
            <Card 
              title={<span className="text-xl font-bold text-dark-900">Thông tin bổ sung</span>}
              className="!rounded-none !shadow-none !border-gray-200 p-2"
            >
              <div className="p-2">
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Ghi chú</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={5}
                  className="w-full border border-gray-300 p-3 text-dark-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all rounded-none resize-none"
                  placeholder="Nhập ghi chú về khách hàng..."
                />
              </div>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Status */}
            <Card 
              title={<span className="text-xl font-bold text-dark-900">Trạng thái</span>}
              className="!rounded-none !shadow-none !border-gray-200"
            >
              <div className="p-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Trạng thái khách hàng
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full h-[42px] px-3 border border-gray-300 text-dark-900 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white rounded-none"
                >
                  <option value="lead">Lead (Tiềm năng)</option>
                  <option value="active">Active (Đang hoạt động)</option>
                  <option value="expired">Expired (Hết hạn)</option>
                  <option value="churned">Churned (Rời bỏ)</option>
                </select>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed italic">
                  * Trạng thái sẽ được tự động cập nhật khi có hợp đồng hoặc thay đổi từ hệ thống.
                </p>
              </div>
            </Card>

            {/* Actions */}
            <Card className="!rounded-none !shadow-none !border-gray-200">
              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-none transition-colors flex items-center justify-center gap-2 disabled:opacity-50 h-14 text-lg"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isEditMode ? 'Cập nhật khách hàng' : 'Thêm khách hàng'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="w-full border border-gray-300 hover:bg-gray-50 text-dark-900 font-bold py-4 px-6 rounded-none transition-colors flex items-center justify-center gap-2 h-14 text-lg"
                >
                  <X className="w-5 h-5" />
                  Hủy
                </button>
              </div>

              {isEditMode && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    <strong>Lưu ý:</strong> Mọi thay đổi về thông tin khách hàng sẽ được hệ thống ghi lại vào lịch sử hoạt động để phục vụ kiểm tra.
                  </p>
                </div>
              )}
            </Card>

            {/* Tips */}
            <Card 
              title={<span className="text-lg font-bold text-dark-900">Gợi ý nhập liệu</span>}
              className="!rounded-none !shadow-none !border-gray-200 bg-gray-50/50"
            >
              <div className="text-sm text-gray-700 space-y-3">
                <p className="flex gap-2">
                  <span className="text-primary-600 font-bold">•</span>
                  Mã số thuế phải chính xác để tránh trùng lặp dữ liệu trên hệ thống.
                </p>
                <p className="flex gap-2">
                  <span className="text-primary-600 font-bold">•</span>
                  Email và SĐT sẽ được dùng để gửi các thông báo nhắc hẹn, hợp đồng tự động.
                </p>
                <p className="flex gap-2">
                  <span className="text-primary-600 font-bold">•</span>
                  Chọn đúng ngành nghề giúp hệ thống gợi ý các giải pháp (Solutions) phù hợp nhất.
                </p>
                <p className="flex gap-2">
                  <span className="text-primary-600 font-bold">•</span>
                  Ghi chú chi tiết về đặc điểm khách hàng giúp đội ngũ Sales hỗ trợ tốt hơn.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CustomerFormPage;