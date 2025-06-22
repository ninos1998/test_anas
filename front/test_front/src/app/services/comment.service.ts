// comment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) { }

  getCommentsForArticle(articleId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/article/${articleId}`);
  }

createComment(content: string, articleId: string, parentCommentId?: string): Observable<any> {
  const token = localStorage.getItem('jwt_token');
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  return this.http.post(
    this.apiUrl, 
    { content, articleId, parentCommentId },
    { headers }
  );
}

  updateComment(commentId: string, content: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${commentId}`, { content });
  }

  deleteComment(commentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${commentId}`);
  }
}