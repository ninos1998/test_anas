import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Article } from '../models/article.model';
import { AuthService } from './auth.service';
import { PaginatedResponse } from '../models/PaginatedResponse';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private apiUrl = `${environment.apiUrl}/articles`;

  constructor(private authService:AuthService, private http: HttpClient) { }

  // Get all articles
  getArticles(page = 1, limit = 3): Observable<PaginatedResponse<Article>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<Article>>(this.apiUrl, { params });
  }

  // Get a single article by ID
  getArticle(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Create a new article
createArticle(formData: FormData) {

  const token = localStorage.getItem('jwt_token'); 
  const userId = this.authService.getCurrentUserId();
  if (userId) {
      formData.append('author', userId);
    }
    console.log(userId)
    console.log(formData)
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.post<Article>(`${this.apiUrl}`, formData, { headers });
}

  // Update an existing article
  updateArticle(id: string, articleData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, articleData, { headers: this.getAuthHeader() });
  }

  // Delete an article
  deleteArticle(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeader() });
  }

  // Upload an image for an article
  uploadArticleImage(id: string, imageFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return this.http.post(
      `${this.apiUrl}/${id}/image`, 
      formData, 
      { headers: this.getAuthHeader() }
    );
  }

getImage(imageId: string): Observable<string> {
  return this.http.get<{ contentType: string, data: string }>(
    `${this.apiUrl}/images/${imageId}`
  ).pipe(
    map(response => {
      return `data:${response.contentType};base64,${response.data}`;
    })
  );
}

  // Version avec cache
  private imageCache: {[key: string]: string} = {};

  getImageWithCache(imageId: string): Observable<string> {
    if (this.imageCache[imageId]) {
      return of(this.imageCache[imageId]);
    }

    return this.getImage(imageId).pipe(
      tap(url => {
        this.imageCache[imageId] = url;
      })
    );
  }

  // Helper method to get authorization header
  private getAuthHeader(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
getArticleImage(imageId: string) {
    return this.http.get(`http://localhost:5000/api/articles/images/${imageId}`, {
      responseType: 'text' 
    });
  }s
}