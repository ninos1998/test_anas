import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CommentTestService {
  constructor(
    private socket: Socket,
    private authService: AuthService
  ) {}

  testCreateComment() {
    // Données de test
    const testData = {
      content: 'Ceci est un commentaire de test - ' + new Date().toLocaleTimeString(),
      articleId: '65d1a3f5b92c3e146a3e8f9c', // Remplacez par un vrai ID d'article
      userId: this.authService.currentUserValue?._id || '65d1a3f5b92c3e146a3e8f9d' // ID utilisateur
    };

    // Émettre l'événement
    this.socket.emit('create-comment', testData);

    // Écouter les réponses
    this.socket.fromEvent('new-comment').subscribe(comment => {
      console.log('Nouveau commentaire reçu:', comment);
    });

    this.socket.fromEvent('comment-error').subscribe(error => {
      console.error('Erreur:', error);
    });
  }
}