const Article = require('../models/article');


exports.checkArticlePermissions = (action) => {
  return async (req, res, next) => {
     console.log('--- DEBUG checkArticlePermissions ---');
    console.log('User:', req.user); 
    console.log('User role:', req.user?.role);
    console.log('Article ID:', req.params.id);
    console.log('Action:', action);
    try {
      const article = await Article.findById(req.params.id);
      
      if (!article) {
        return res.status(404).json({ success: false, message: 'Article not found' });
      }

      if (req.user.role === 'admin') return next();

      switch(action) {
        case 'update':
          if (req.user.role === 'editor') return next();
          if (req.user.role === 'writer' && article.author.equals(req.user._id)) {
            return next();
          }
          break;
          
        case 'delete':
          break;
          
        default:
          return res.status(403).json({
            success: false,
            message: 'Action non autorisée'
          });
      }

      return res.status(403).json({ 
        success: false, 
        message: `Not authorized to ${action} this article` 
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };
};