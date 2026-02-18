// src/services/mock/MockUserService.ts

import type { IUserService } from '../interfaces/IUserService'
import type { Utilisateur, CreateUtilisateurDto } from '../../types/user.types'
import { MOCK_USERS } from './data/users.mock'

export class MockUserService implements IUserService {
  private users: Utilisateur[] = [...MOCK_USERS]

  async getAll(): Promise<Utilisateur[]> {
    return [...this.users]
  }

  async getById(id: string): Promise<Utilisateur> {
    const user = this.users.find((u) => u.id === id)
    if (!user) throw new Error(`Utilisateur introuvable : ${id}`)
    return { ...user }
  }

  async create(data: CreateUtilisateurDto): Promise<Utilisateur> {
    if (!data.prenom.trim()) throw new Error('Le prénom est obligatoire.')
    const utilisateur: Utilisateur = {
      id: `user-${crypto.randomUUID()}`,
      prenom: data.prenom.trim(),
      role: data.role,
      adresseDefaut: data.adresseDefaut,
      createdAt: new Date().toISOString(),
    }
    this.users.push(utilisateur)
    return { ...utilisateur }
  }
}
