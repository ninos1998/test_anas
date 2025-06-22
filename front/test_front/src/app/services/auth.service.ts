import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {
    this.currentUserSubject = new BehaviorSubject<any>(
      JSON.parse(localStorage.getItem('currentUser') || null)
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }
    public get currentUserValue() {
    return this.currentUserSubject.value;
  }
async register(userData: { 
  username: string, 
  email: string, 
  password: string,
  role?: string 
}): Promise<any> {
  try {
    const payload = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user' 
    };

    const response = await axios.post(
      `${this.apiUrl}/auth/register`, 
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    this.setToken(response.data.token);
    return response.data;
  } catch (error) {
    console.log('Registration error:');
  }
}

  login(credentials: {email: string, password: string}): Observable<any> {
    return this.http.post('http://localhost:5000/api/auth/login', credentials).pipe(
      tap(response => {
        const userData = {
          token: response.token,
          user: response.user 
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('jwt_token', userData.token);

        // Mise à jour du BehaviorSubject
        this.currentUserSubject.next(userData);
        
        // Redirection
        this.router.navigate(['/home']);
      })
    );
  }


  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    
    try {
      const decoded: any = jwtDecode(token);
      return Date.now() < decoded.exp * 1000;
    } catch {
      return false;
    }
  }

  private setToken(token: string) {
    localStorage.setItem('jwt_token', token);
  }

getCurrentUserId(): string | null {
  const currentUser = this.currentUserValue;
  return currentUser?.user?._id || null;
}
getCurrentUser(): any {
  const userData = localStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
}

}