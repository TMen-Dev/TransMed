// src/services/mock/MockUserService.ts

import type { IUserService } from '../interfaces/IUserService'
import type { Utilisateur, CreateUtilisateurDto } from '../../types/user.types'
import { MOCK_USERS, MOCK_CREDENTIALS } from './data/users.mock'

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
      email: data.email ?? '',
      adresseDefaut: data.adresseDefaut,
      createdAt: new Date().toISOString(),
      lastSeenAt: null,
      charteAcceptedAt: null,
      telephone: null,
    }
    this.users.push(utilisateur)
    return { ...utilisateur }
  }

  async verifyOtpAndComplete(
    email: string,
    _token: string,
    prenom: string,
    role: 'patient' | 'aidant'
  ): Promise<Utilisateur> {
    // Mode mock : le code est toujours accepté
    return this.create({ prenom, role, email, password: '' })
  }

  async resendVerificationEmail(_email: string): Promise<void> {
    // no-op en mode mock
  }

  async authenticate(email: string, password: string): Promise<Utilisateur> {
    const credential = MOCK_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === email.toLowerCase().trim() && c.password === password
    )
    if (!credential) throw new Error('Identifiants incorrects. Vérifiez votre email et mot de passe.')
    const user = this.users.find((u) => u.id === credential.userId)
    if (!user) throw new Error('Identifiants incorrects.')
    return { ...user }
  }
}
