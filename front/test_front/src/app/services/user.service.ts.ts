// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5000/api/users'

  constructor(private http: HttpClient) { }

   getUsers(): Observable<ApiResponse<User[]>> {
    const token = localStorage.getItem('jwt_token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ApiResponse<User[]>>(this.apiUrl, { headers });
  }

  deleteUser(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  updateUserRole(id: string, role: string): Observable<ApiResponse<User>> {
    const token = localStorage.getItem('jwt_token');
    
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    return this.http.put<ApiResponse<User>>(
        `${this.apiUrl}/${id}/role`, 
        { role },
        { headers }
    );
}
}