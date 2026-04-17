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

  /**
   * Upload file và trả về URL
   * @param {File} file - File cần upload
   */
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await uploadService.uploadSingle(formData);
    return response.data.data; // { url: '...' }
  },
};

export default uploadService;