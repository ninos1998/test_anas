import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { RegisterComponent } from './components/register/register.component';
import { ArticleFormComponent } from './components/articles/article-form/article-form.component';
import { ArticleListComponent } from './components/articles/article-list/article-list.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { LayoutComponent } from './components/layout/layout.component';
import { ListUserComponent } from './components/users/list-user/list-user.component';
import { ArticleCommentsComponent } from './components/articles/article-comments/article-comments.component';
import { SocketIoModule } from 'ngx-socket-io';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    ArticleFormComponent,
    ArticleListComponent,
    SidebarComponent,
    LayoutComponent,
    ListUserComponent,
    ArticleCommentsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
     SocketIoModule.forRoot({
      url: 'http://localhost:5000', 
      options: {
        transports: ['websocket'],
        withCredentials: true
      }
    })
  

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }