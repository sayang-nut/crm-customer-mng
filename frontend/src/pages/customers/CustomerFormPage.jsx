//frontend/src/pages/customers/CustomerFormPage.jsx
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
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Company name
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Vui lòng nhập tên công ty';
    }

    // Tax code
    if (!formData.tax_code.trim()) {
      newErrors.tax_code = 'Vui lòng nhập mã số thuế';
    } else if (!/^\d{10}(-\d{3})?$/.test(formData.tax_code)) {
      newErrors.tax_code = 'Mã số thuế không hợp lệ (10-13 số)';
    }

    // Industry
    if (!formData.industry) {
      newErrors.industry = 'Vui lòng chọn ngành nghề';
    }

    // Representative name
    if (!formData.representative_name.trim()) {
      newErrors.representative_name = 'Vui lòng nhập tên người đại diện';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0|\+84)[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    // Address
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
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách khách hàng</span>
        </button>

        <h1 className="text-3xl font-bold text-dark-900 mb-2">
          {isEditMode ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        </h1>
        <p className="text-gray-600">
          {isEditMode
            ? 'Cập nhật thông tin khách hàng'
            : 'Nhập đầy đủ thông tin để thêm khách hàng mới vào hệ thống'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            <Card title="Thông tin công ty">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Tên công ty"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    error={errors.company_name}
                    required
                    placeholder="VD: Công ty TNHH ABC"
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
                />

                <div>
                  <label className="label label-required">Ngành nghề</label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className={`select ${errors.industry ? 'input-error' : ''}`}
                  >
                    <option value="">Chọn ngành nghề</option>
                    <optgroup label="Bán lẻ">
                      <option value="Thời trang">Thời trang</option>
                      <option value="Điện thoại & Điện máy">
                        Điện thoại & Điện máy
                      </option>
                      <option value="Vật liệu xây dựng">
                        Vật liệu xây dựng
                      </option>
                      <option value="Nhà thuốc">Nhà thuốc</option>
                      <option value="Mẹ và bé">Mẹ và bé</option>
                      <option value="Sách & Văn phòng phẩm">
                        Sách & Văn phòng phẩm
                      </option>
                    </optgroup>
                    <optgroup label="Lưu trú & Làm đẹp">
                      <option value="Spa & Massage">Spa & Massage</option>
                      <option value="Hair Salon & Nails">
                        Hair Salon & Nails
                      </option>
                      <option value="Khách sạn & Nhà nghỉ">
                        Khách sạn & Nhà nghỉ
                      </option>
                      <option value="Homestay & Villa">Homestay & Villa</option>
                      <option value="Resort">Resort</option>
                      <option value="Fitness & Yoga">Fitness & Yoga</option>
                    </optgroup>
                    <optgroup label="Ăn uống & Giải trí">
                      <option value="Nhà hàng">Nhà hàng</option>
                      <option value="Cà phê & Trà sữa">Cà phê & Trà sữa</option>
                      <option value="Karaoke & Bida">Karaoke & Bida</option>
                      <option value="Bar & Pub">Bar & Pub</option>
                      <option value="Căn tin & Trạm nghỉ">
                        Căn tin & Trạm nghỉ
                      </option>
                    </optgroup>
                  </select>
                  {errors.industry && (
                    <p className="error-message">{errors.industry}</p>
                  )}
                </div>

                <Input
                  label="Website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
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
                  />
                </div>
              </div>
            </Card>

            {/* Representative Information */}
            <Card title="Thông tin người đại diện">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Họ và tên"
                  name="representative_name"
                  value={formData.representative_name}
                  onChange={handleChange}
                  error={errors.representative_name}
                  required
                  placeholder="VD: Nguyễn Văn A"
                />

                <Input
                  label="Chức vụ"
                  name="representative_position"
                  value={formData.representative_position}
                  onChange={handleChange}
                  placeholder="VD: Giám đốc"
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
                />
              </div>
            </Card>

            {/* Additional Information */}
            <Card title="Thông tin bổ sung">
              <div>
                <label className="label">Ghi chú</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="textarea"
                  placeholder="Nhập ghi chú về khách hàng..."
                />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card title="Trạng thái">
              <div>
                <label className="label">Trạng thái khách hàng</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="select"
                >
                  <option value="lead">Lead (Tiềm năng)</option>
                  <option value="active">Active (Đang hoạt động)</option>
                  <option value="expired">Expired (Hết hạn)</option>
                  <option value="churned">Churned (Rời bỏ)</option>
                </select>
                <p className="text-xs text-gray-600 mt-2">
                  Trạng thái sẽ được tự động cập nhật khi có hợp đồng hoặc thay đổi
                </p>
              </div>
            </Card>

            {/* Actions */}
            <Card>
              <div className="space-y-3">
                <Button
                  type="submit"
                  variant="primary-gradient"
                  size="lg"
                  fullWidth
                  loading={submitting}
                  disabled={submitting}
                  icon={Save}
                >
                  {submitting
                    ? 'Đang lưu...'
                    : isEditMode
                    ? 'Cập nhật khách hàng'
                    : 'Thêm khách hàng'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={handleCancel}
                  disabled={submitting}
                  icon={X}
                >
                  Hủy
                </Button>
              </div>

              {isEditMode && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    <strong>Lưu ý:</strong> Thay đổi thông tin khách hàng sẽ được
                    lưu vào lịch sử hoạt động
                  </p>
                </div>
              )}
            </Card>

            {/* Tips */}
            <Card title="💡 Gợi ý">
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  • Mã số thuế phải chính xác để tránh trùng lặp
                </p>
                <p>
                  • Email và SĐT sẽ được dùng cho thông báo tự động
                </p>
                <p>
                  • Chọn ngành nghề phù hợp để hệ thống gợi ý giải pháp đúng
                </p>
                <p>
                  • Ghi chú chi tiết giúp team hiểu rõ hơn về khách hàng
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