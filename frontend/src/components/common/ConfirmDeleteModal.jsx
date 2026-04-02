import React from 'react';
import Modal from './Modal';
import Button from './Button';

const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  title = "Xác nhận xóa",
  warningMessage = "Hành động này sẽ xóa toàn bộ dữ liệu liên quan và không thể khôi phục lại.",
  isDeleting = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<span className="text-xl font-black text-red-600">{title}</span>}
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting} className="!rounded-none px-6">
            Hủy
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isDeleting} className="!rounded-none px-6 font-bold">
            {isDeleting ? 'Đang xử lý...' : 'Xóa vĩnh viễn'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-800 text-lg">
          Bạn có chắc chắn muốn xóa: <br />
          <span className="font-black text-dark-900 text-xl">{itemName}</span>?
        </p>
        {warningMessage && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm italic">
            * Cảnh báo: {warningMessage}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ConfirmDeleteModal;