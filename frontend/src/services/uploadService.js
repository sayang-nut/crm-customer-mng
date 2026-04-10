import api from './api';

const uploadService = {
  /**
   * Gọi API tải file lên Cloudinary (Backend)
   * @param {FormData} formData - Chứa file đính kèm
   */
  uploadSingle: (formData) => {
    return api.post('/api/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default uploadService;