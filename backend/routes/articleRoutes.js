const express = require('express');
const router = express.Router();
const {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  uploadImage,
  getImage,
  likeArticle,
  getTopArticles,
  getTrends,
  trackView
} = require('../controllers/articleController'); // Vérifiez ce chemin
const { protect,authorize } = require('../middlewares/authMiddleware');
const { checkArticlePermissions } = require('../middlewares/articlePermissions');
const upload = require('../middlewares/imageUpload');


router.route('/')
  .get(getArticles)
  .post(protect, authorize('writer', 'editor', 'admin'), createArticle);

router.route('/:id')
  .get(getArticle)
  .put(protect, checkArticlePermissions('update'), updateArticle)
  .delete(protect, authorize('admin'), deleteArticle); 

router.route('/:id/image')
  .post(
    protect,
    checkArticlePermissions('update'),
    upload.single('image'),
    uploadImage
  );

router.route('/images/:id')
  .get(getImage);


router.post('/:id/like', protect, likeArticle);

router.post('/:id/view', trackView);

router.get('/analytics/top-articles',protect, authorize('admin'), getTopArticles);
router.get('/analytics/trends', protect, authorize('admin'), getTrends);
module.exports = router;