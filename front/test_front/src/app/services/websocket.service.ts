
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket;
  private socketConnected = false;

  // Observable for new comments
  private newCommentSubject = new Subject<any>();
  public newComment$ = this.newCommentSubject.asObservable();

  // Observable for comment notifications
  private commentNotificationSubject = new Subject<any>();
  public commentNotification$ = this.commentNotificationSubject.asObservable();

  constructor(private authService: AuthService) {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    // Connect to WebSocket server
this.socket = io(environment.wsUrl, {
  transports: ['websocket'], 
  upgrade: false,
  auth: {
    token: localStorage.getItem('jwt_token') // Envoyez le token si nécessaire
  }
});
    this.socket.on('connect', () => {
      this.socketConnected = true;
      console.log('Connected to WebSocket server');

      // Register user if authenticated
      const currentUser = this.authService.currentUserValue;
      if (currentUser) {
        this.registerUser(currentUser.id);
      }
    });

    // Handle new comments
    this.socket.on('new-comment', (comment) => {
      this.newCommentSubject.next(comment);
    });

    // Handle comment notifications
    this.socket.on('new-comment-notification', (notification) => {
      this.commentNotificationSubject.next(notification);
    });

    this.socket.on('disconnect', () => {
      this.socketConnected = false;
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('comment-error', (error) => {
      console.error('Comment error:', error);
    });
  }

  registerUser(userId: string): void {
    if (this.socketConnected) {
      this.socket.emit('register-user', userId);
    }
  }

  joinArticleRoom(articleId: string): void {
    if (this.socketConnected) {
      this.socket.emit('join-article-room', articleId);
    }
  }

  createComment(commentData: { content: string, articleId: string }): void {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  console.log(currentUser.user)
  if (!currentUser.user || !currentUser.user._id) {
    console.error('User not authenticated');
    return;
  }

  const payload = {
    content: commentData.content,
    articleId: commentData.articleId,
    userId: currentUser.user._id 
  };

  console.log('Sending comment payload:', payload); // Debug

  if (this.socket?.connected) {
    this.socket.emit('create-comment', payload);
  } else {
    console.error('WebSocket not connected');
  }
}

}