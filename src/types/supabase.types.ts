export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cagnottes: {
        Row: {
          created_at: string
          demande_id: string
          id: string
          montant_cible: number | null
          montant_collecte: number
          statut: string
        }
        Insert: {
          created_at?: string
          demande_id: string
          id?: string
          montant_cible?: number | null
          montant_collecte?: number
          statut?: string
        }
        Update: {
          created_at?: string
          demande_id?: string
          id?: string
          montant_cible?: number | null
          montant_collecte?: number
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "cagnottes_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: true
            referencedRelation: "demandes"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          aidant_id: string
          aidant_prenom: string
          cagnotte_id: string
          created_at: string
          id: string
          montant: number
        }
        Insert: {
          aidant_id: string
          aidant_prenom: string
          cagnotte_id: string
          created_at?: string
          id?: string
          montant: number
        }
        Update: {
          aidant_id?: string
          aidant_prenom?: string
          cagnotte_id?: string
          created_at?: string
          id?: string
          montant?: number
        }
        Relationships: [
          {
            foreignKeyName: "contributions_aidant_id_fkey"
            columns: ["aidant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_cagnotte_id_fkey"
            columns: ["cagnotte_id"]
            isOneToOne: false
            referencedRelation: "cagnottes"
            referencedColumns: ["id"]
          },
        ]
      }
      demandes: {
        Row: {
          adresse_livraison: string
          created_at: string
          delivered_at: string | null
          email_notif_envoyee: boolean
          id: string
          message_remerciement: string | null
          nom: string
          patient_id: string
          patient_prenom: string
          statut: string
          transporteur_id: string | null
          transporteur_prenom: string | null
          updated_at: string
          urgente: boolean
        }
        Insert: {
          adresse_livraison: string
          created_at?: string
          delivered_at?: string | null
          email_notif_envoyee?: boolean
          id?: string
          message_remerciement?: string | null
          nom: string
          patient_id: string
          patient_prenom: string
          statut?: string
          transporteur_id?: string | null
          transporteur_prenom?: string | null
          updated_at?: string
          urgente?: boolean
        }
        Update: {
          adresse_livraison?: string
          created_at?: string
          delivered_at?: string | null
          email_notif_envoyee?: boolean
          id?: string
          message_remerciement?: string | null
          nom?: string
          patient_id?: string
          patient_prenom?: string
          statut?: string
          transporteur_id?: string | null
          transporteur_prenom?: string | null
          updated_at?: string
          urgente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "demandes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_transporteur_id_fkey"
            columns: ["transporteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medicaments: {
        Row: {
          created_at: string
          demande_id: string
          id: string
          nom: string
          quantite: number
        }
        Insert: {
          created_at?: string
          demande_id: string
          id?: string
          nom: string
          quantite: number
        }
        Update: {
          created_at?: string
          demande_id?: string
          id?: string
          nom?: string
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "medicaments_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          auteur_id: string
          auteur_prenom: string
          auteur_role: string
          contenu: string
          created_at: string
          demande_id: string
          id: string
        }
        Insert: {
          auteur_id: string
          auteur_prenom: string
          auteur_role: string
          contenu: string
          created_at?: string
          demande_id: string
          id?: string
        }
        Update: {
          auteur_id?: string
          auteur_prenom?: string
          auteur_role?: string
          contenu?: string
          created_at?: string
          demande_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes"
            referencedColumns: ["id"]
          },
        ]
      }
      ordonnances: {
        Row: {
          created_at: string
          demande_id: string
          id: string
          mime_type: string
          storage_path: string
          taille_octets: number | null
        }
        Insert: {
          created_at?: string
          demande_id: string
          id?: string
          mime_type: string
          storage_path: string
          taille_octets?: number | null
        }
        Update: {
          created_at?: string
          demande_id?: string
          id?: string
          mime_type?: string
          storage_path?: string
          taille_octets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ordonnances_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: true
            referencedRelation: "demandes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          adresse_defaut: string | null
          created_at: string
          email: string | null
          id: string
          prenom: string | null
          role: string | null
        }
        Insert: {
          adresse_defaut?: string | null
          created_at?: string
          email?: string | null
          id: string
          prenom?: string | null
          role?: string | null
        }
        Update: {
          adresse_defaut?: string | null
          created_at?: string
          email?: string | null
          id?: string
          prenom?: string | null
          role?: string | null
        }
        Relationships: []
      }
      propositions: {
        Row: {
          aidant_id: string
          aidant_prenom: string
          created_at: string
          demande_id: string
          id: string
          montant_contribue: number | null
          type: string
        }
        Insert: {
          aidant_id: string
          aidant_prenom: string
          created_at?: string
          demande_id: string
          id?: string
          montant_contribue?: number | null
          type: string
        }
        Update: {
          aidant_id?: string
          aidant_prenom?: string
          created_at?: string
          demande_id?: string
          id?: string
          montant_contribue?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "propositions_aidant_id_fkey"
            columns: ["aidant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propositions_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: { Args: never; Returns: string }
      update_demande_statut: {
        Args: {
          p_demande_id: string
          p_expected_statut: string
          p_new_statut: string
        }
        Returns: {
          adresse_livraison: string
          created_at: string
          delivered_at: string | null
          email_notif_envoyee: boolean
          id: string
          message_remerciement: string | null
          nom: string
          patient_id: string
          patient_prenom: string
          statut: string
          transporteur_id: string | null
          transporteur_prenom: string | null
          updated_at: string
          urgente: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "demandes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
