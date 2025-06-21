const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');

// Create storage engine with proper error handling
const storage = new GridFsStorage({
  db: mongoose.connection,  // Use existing connection
  file: (req, file) => {
    return {
      filename: file.originalname,
      bucketName: 'uploads',
      metadata: {
        uploadedBy: req.user?.id,  // Optional: store user who uploaded
        articleId: req.params.id   // Optional: associate with article
      }
    };
  }
});

// Add connection error handling
storage.on('connection', (db) => {
  console.log('GridFS Storage connected to MongoDB');
});

storage.on('connectionFailed', (err) => {
  console.error('GridFS Storage connection failed:', err);
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
  }
});