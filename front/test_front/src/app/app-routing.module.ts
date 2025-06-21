import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { RegisterComponent } from './components/register/register.component';
import { ArticleListComponent } from './components/articles/article-list/article-list.component';
import { ArticleViewComponent } from './components/articles/article-view/article-view.component';
import { ArticleFormComponent } from './components/articles/article-form/article-form.component';
import { LayoutComponent } from './components/layout/layout.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent, canActivate: [AuthGuard] },
    { 
    path: 'home', 
    component: LayoutComponent,  
    canActivate: [AuthGuard],
    children: [
      { path: '', component: HomeComponent },  
      { path: 'get/articles', component: ArticleListComponent },  
      { path: 'create/articles', component: ArticleFormComponent }, 
      { path: 'get/articles/:id', component: ArticleViewComponent }  
    ]
  },
  
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }