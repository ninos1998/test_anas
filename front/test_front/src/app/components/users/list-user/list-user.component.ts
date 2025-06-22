// src/app/components/list-user/list-user.component.ts
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service.ts';
import { User } from '../../../models/user.model';


@Component({
  selector: 'app-list-user',
  templateUrl: './list-user.component.html',
  styleUrls: ['./list-user.component.scss']
})
export class ListUserComponent implements OnInit {
  users: User[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private UserService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.UserService.getUsers().subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data;
        } else {
          this.errorMessage = 'Erreur inconnue du serveur';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des utilisateurs';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  deleteUser(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.UserService.deleteUser(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadUsers(); // Recharger la liste
          } else {
            this.errorMessage = 'Échec de la suppression';
          }
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la suppression';
          console.error(err);
        }
      });
    }
  }

  updateRole(user: User): void {
    const newRole = prompt('Nouveau rôle (user, admin, editor, writer):', user.role);
    if (newRole && ['user', 'admin', 'editor', 'writer'].includes(newRole) && newRole !== user.role) {
      this.UserService.updateUserRole(user._id, newRole).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadUsers(); // Recharger la liste
          } else {
            this.errorMessage = 'Échec de la mise à jour du rôle';
          }
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la mise à jour du rôle';
          console.error(err);
        }
      });
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR');
  }
}