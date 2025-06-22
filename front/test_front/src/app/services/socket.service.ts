import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { Comment } from '../models/comment.model';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor(private authService: AuthService) {
        const token = localStorage.getItem('jwt_token');

    this.socket = io(environment.apiUrl, {
      auth: {
        token: token || '' 
      },
       transports: ['websocket'] 
    });
  }

  // Rejoindre une room d'article
  joinArticleRoom(articleId: string) {
    this.socket.emit('joinArticleRoom', articleId);
  }

  // Envoyer un nouveau commentaire
  sendComment(commentData: { articleId: string, content: string, parentCommentId?: string }) {
    this.socket.emit('newComment', commentData);
  }

  // Envoyer une réponse à un commentaire
  sendReply(replyData: { articleId: string, content: string, parentCommentId: string }) {
    this.socket.emit('replyToComment', replyData);
  }

  // Écouter les nouveaux commentaires
  onNewComment() {
    return new Observable<Comment>(observer => {
      this.socket.on('commentAdded', (comment: Comment) => {
        observer.next(comment);
      });
    });
  }

  // Écouter les erreurs
  onCommentError() {
    return new Observable<string>(observer => {
      this.socket.on('commentError', (error: { error: string }) => {
        observer.next(error.error);
      });
    });
  }

  // Écouter les notifications
  onNotification() {
    return new Observable<{message: string}>(observer => {
      this.socket.on('newNotification', (notification: {message: string}) => {
        observer.next(notification);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}