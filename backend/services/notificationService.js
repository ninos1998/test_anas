const User = require('../models/user');
const Notification = require('../models/notification');

exports.notifyAuthor = async (authorId, message, metadata) => {
  try {
    const author = await User.findById(authorId);
    if (!author) return;

    const notification = new Notification({
      recipient: authorId,
      message,
      metadata,
      read: false
    });

    await notification.save();

    // 3. Envoyez via WebSocket si connecté
    // (Implémentation dépend de votre configuration Socket.io)
    const io = require('../socket').getIO();
    io.to(`user_${authorId}`).emit('new-notification', notification);

  } catch (error) {
    console.error('Erreur dans notifyAuthor:', error);
    throw error;
  }
};