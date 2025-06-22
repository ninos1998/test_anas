const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketio = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const articleRoutes = require('./routes/articleRoutes');
const commentRoutes = require('./routes/commentRoutes');
const { notifyAuthor } = require('./services/notificationService');
const Comment = require('./models/comment');
const Article = require('./models/article');
const { Server } = require('socket.io');

require('dotenv').config();

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:4200'];

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (comme Postman) en développement
    if (!origin && process.env.NODE_ENV === 'development') return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Initialisation de l'application
connectDB();

const app = express();
const server = http.createServer(app);

// const io = socketio(server, {
//   cors: {
//     origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
//     methods: ['GET', 'POST'],
//     credentials: true
//   },
//   transports: ['websocket', 'polling']
// });

const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200", // URL de votre app Angular
    methods: ["GET", "POST"],
    credentials: true
  }
});
// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);

// Gestion des connexions Socket.io
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Enregistrement de l'utilisateur
  socket.on('register-user', (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Gestion des rooms d'article
  socket.on('join-article-room', (articleId) => {
    socket.join(articleId);
    console.log(`Socket ${socket.id} joined article room ${articleId}`);
  });

  // Gestion des nouveaux commentaires
  socket.on('create-comment', async (data) => {
    try {
      const { content, articleId, userId, parentCommentId } = data;
      
      // Validation des données
      if (!content || !articleId || !userId) {
        throw new Error('Missing required fields');
      }

      // Création du commentaire
      const comment = new Comment({
        content,
        article: articleId,
        author: userId,
        parentComment: parentCommentId || null
      });

      const savedComment = await comment.save();
      const populatedComment = await Comment.findById(savedComment._id)
        .populate('author', 'username avatar')
        .populate('parentComment');

      // Diffusion du commentaire
      io.to(articleId).emit('new-comment', populatedComment);

      // Notification de l'auteur de l'article
      const article = await Article.findById(articleId);
      if (article.author.toString() !== userId) {
        const authorSocketId = userSockets.get(article.author.toString());
        if (authorSocketId) {
          io.to(authorSocketId).emit('new-comment-notification', {
            articleId,
            articleTitle: article.title,
            comment: populatedComment
          });
        }
        await notifyAuthor(article.author, populatedComment);
      }

    } catch (error) {
      console.error('Error creating comment:', error);
      socket.emit('comment-error', { error: error.message });
    }
  });

  // Gestion de la déconnexion
  socket.on('disconnect', () => {
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  res.status(500).json({ 
    error: 'Erreur serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});

module.exports = { app, io };