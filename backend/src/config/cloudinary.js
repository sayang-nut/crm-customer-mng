const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// TODO: THAY THẾ CÁC GIÁ TRỊ DƯỚI ĐÂY BẰNG THÔNG TIN TỪ TÀI KHOẢN CLOUDINARY CỦA BẠN
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dylirczkb',
  api_key: process.env.CLOUDINARY_API_KEY || '699386713354842',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'rMJ4FLi90iJgfNP_Wi35uLrg8ps'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'crm_proofs', // Thư mục lưu trữ trên Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    resource_type: 'auto' // 'auto' giúp file PDF có thể mở xem trực tiếp trên tab mới
  },
});

const uploadCloud = multer({ storage });

module.exports = { cloudinary, uploadCloud };
