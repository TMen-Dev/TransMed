import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { Resend } from "npm:resend@3"

// ── Types ──────────────────────────────────────────────────────────────────

interface WebhookPayload {
  type: "UPDATE"
  table: "demandes"
  record: {
    id: string
    patient_id: string
    nom: string
    statut: string
    acheteur_id: string | null
    transporteur_id: string | null
    single_aidant: boolean
    email_notif_envoyee: boolean
  }
  old_record: {
    statut: string
  }
}

type EventType = "rdv_patient" | "acheteur_transporteur_dispo" | "transporteur_acheteur_pret"

interface NotifEvent {
  eventType: EventType
  destinataireId: string
}

// ── Routing logic ──────────────────────────────────────────────────────────
// Détermine l'événement email à envoyer selon la transition de statut.
// Retourne null si la transition ne déclenche pas de notification.

function resolveEvent(payload: WebhookPayload): NotifEvent | null {
  const { record, old_record } = payload
  const oldStatut = old_record.statut
  const newStatut = record.statut

  // (any) → rdv_a_fixer : notifier le patient qu'un RDV est à fixer
  // Couvre à la fois le scénario 1 (auto D→F) et les scénarios 2/3 (E→F)
  if (newStatut === "rdv_a_fixer") {
    return { eventType: "rdv_patient", destinataireId: record.patient_id }
  }

  // (B) → transporteur_et_medicaments_prets : notifier l'acheteur qu'un transporteur est dispo
  if (
    newStatut === "transporteur_et_medicaments_prets" &&
    oldStatut === "medicaments_achetes_attente_transporteur" &&
    record.acheteur_id
  ) {
    return { eventType: "acheteur_transporteur_dispo", destinataireId: record.acheteur_id }
  }

  // (C) → transporteur_et_medicaments_prets : notifier le transporteur que l'acheteur est prêt
  if (
    newStatut === "transporteur_et_medicaments_prets" &&
    oldStatut === "transporteur_disponible_attente_acheteur" &&
    record.transporteur_id
  ) {
    return { eventType: "transporteur_acheteur_pret", destinataireId: record.transporteur_id }
  }

  return null
}

// ── Email templates ────────────────────────────────────────────────────────

function renderRdvPatient(prenom: string, nomDemande: string): { subject: string; html: string } {
  return {
    subject: `Livraison organisée pour "${nomDemande}" — Fixez votre RDV`,
    html: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#1B8C5A;font-size:22px;font-weight:700;">
        Votre livraison est organisée, ${prenom} !
      </h2>
      <p style="margin:0 0 12px;color:#1A1510;font-size:15px;line-height:1.6;">
        Les médicaments de votre demande <strong>${nomDemande}</strong> sont pris en charge
        et un transporteur se prépare à vous les livrer.
      </p>
      <p style="margin:0 0 24px;color:#1A1510;font-size:15px;line-height:1.6;">
        Il ne reste plus qu'à fixer un rendez-vous de livraison avec le transporteur.
      </p>
      ${actionBox("Action requise", "Ouvrez TransMed et confirmez votre disponibilité pour la livraison.")}
      ${ctaButton("Fixer mon RDV →")}
    `),
  }
}

function renderAcheteurTransporteurDispo(prenom: string, nomDemande: string): { subject: string; html: string } {
  return {
    subject: `Un transporteur est disponible — "${nomDemande}"`,
    html: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#2B7CC1;font-size:22px;font-weight:700;">
        Un transporteur est prêt, ${prenom} !
      </h2>
      <p style="margin:0 0 12px;color:#1A1510;font-size:15px;line-height:1.6;">
        Pour la demande <strong>${nomDemande}</strong>, un aidant-transporteur vient de confirmer
        sa disponibilité pour livrer les médicaments.
      </p>
      <p style="margin:0 0 24px;color:#1A1510;font-size:15px;line-height:1.6;">
        Vous pouvez maintenant envoyer les médicaments que vous avez achetés à ce transporteur.
      </p>
      ${actionBox("Prochaine étape", "Ouvrez TransMed et confirmez l'envoi des médicaments au transporteur.")}
      ${ctaButton("Voir la demande →")}
    `),
  }
}

function renderTransporteurAcheteurPret(prenom: string, nomDemande: string): { subject: string; html: string } {
  return {
    subject: `Les médicaments sont achetés — "${nomDemande}"`,
    html: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#C8521A;font-size:22px;font-weight:700;">
        Les médicaments sont prêts, ${prenom} !
      </h2>
      <p style="margin:0 0 12px;color:#1A1510;font-size:15px;line-height:1.6;">
        Pour la demande <strong>${nomDemande}</strong>, un aidant-acheteur vient de confirmer
        que les médicaments ont été achetés et sont en route vers vous.
      </p>
      <p style="margin:0 0 24px;color:#1A1510;font-size:15px;line-height:1.6;">
        Préparez-vous à réceptionner le colis, puis à le livrer au patient.
      </p>
      ${actionBox("Prochaine étape", "Ouvrez TransMed et confirmez la réception des médicaments.")}
      ${ctaButton("Voir la demande →")}
    `),
  }
}

function renderEmail(
  eventType: EventType,
  prenom: string,
  nomDemande: string
): { subject: string; html: string } {
  switch (eventType) {
    case "rdv_patient":
      return renderRdvPatient(prenom, nomDemande)
    case "acheteur_transporteur_dispo":
      return renderAcheteurTransporteurDispo(prenom, nomDemande)
    case "transporteur_acheteur_pret":
      return renderTransporteurAcheteurPret(prenom, nomDemande)
  }
}

// ── HTML helpers ───────────────────────────────────────────────────────────

function emailWrapper(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TransMed</title>
</head>
<body style="margin:0;padding:0;background:#F7F3ED;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F3ED;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0"
               style="background:#FFFFFF;border-radius:16px;border:1px solid #E8E1D9;overflow:hidden;max-width:600px;">
          <tr>
            <td style="background:#1B8C5A;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.5px;">TransMed</p>
              <p style="margin:8px 0 0;color:#B2DFC8;font-size:13px;">Solidarité médicale</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;">
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="background:#F7F3ED;border-top:1px solid #E8E1D9;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#7A6E65;font-size:12px;line-height:1.5;">
                Cet email a été envoyé automatiquement par TransMed.<br>Ne répondez pas à cet email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function actionBox(titre: string, texte: string): string {
  return `<div style="background:#E8F7F0;border:1px solid #B2DFC8;border-radius:10px;padding:20px 24px;margin:0 0 28px;">
    <p style="margin:0 0 8px;color:#146B45;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${titre}</p>
    <p style="margin:0;color:#1A1510;font-size:15px;line-height:1.5;">${texte}</p>
  </div>`
}

function ctaButton(label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0">
    <tr>
      <td style="border-radius:10px;background:#1B8C5A;box-shadow:0 4px 12px rgba(27,140,90,0.35);">
        <a href="https://transmed.app"
           style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

// ── Handler ────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json()

    // Déterminer si cette transition déclenche une notification
    const notifEvent = resolveEvent(payload)
    if (!notifEvent) {
      return new Response(JSON.stringify({ message: "Skipped" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { eventType, destinataireId } = notifEvent
    const demandeId = payload.record.id
    const nomDemande = payload.record.nom

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    // Guard idempotence : UNIQUE(demande_id, event_type) — évite les doublons
    const { data: existing } = await supabaseAdmin
      .from("notification_emails")
      .select("id, statut")
      .eq("demande_id", demandeId)
      .eq("event_type", eventType)
      .maybeSingle()

    if (existing?.statut === "sent") {
      return new Response(JSON.stringify({ message: "Already sent", eventType }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Récupérer email et prénom du destinataire
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, prenom")
      .eq("id", destinataireId)
      .single()

    if (profileError || !profile?.email) {
      await supabaseAdmin.from("notification_emails").upsert({
        demande_id: demandeId,
        destinataire_id: destinataireId,
        event_type: eventType,
        patient_email: "",
        statut: "failed",
        erreur: "email_manquant",
        tentatives: (existing?.statut ? 1 : 0) + 1,
        derniere_tentative: new Date().toISOString(),
      }, { onConflict: "demande_id, event_type" })
      return new Response(
        JSON.stringify({ error: "email_missing", demandeId, eventType }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    const destinataireEmail = profile.email.toLowerCase()
    const prenom = profile.prenom ?? "Bonjour"

    // Générer le contenu email selon l'événement
    const { subject, html } = renderEmail(eventType, prenom, nomDemande)

    // Envoi via Resend
    const resend = new Resend(resendApiKey)
    const { data: emailData, error: resendError } = await resend.emails.send({
      from: "TransMed <onboarding@resend.dev>",
      to: destinataireEmail,
      subject,
      html,
    })

    if (resendError || !emailData?.id) {
      await supabaseAdmin.from("notification_emails").upsert({
        demande_id: demandeId,
        destinataire_id: destinataireId,
        event_type: eventType,
        patient_email: destinataireEmail,
        statut: "failed",
        erreur: resendError?.message ?? "resend_error",
        tentatives: (existing?.statut ? 1 : 0) + 1,
        derniere_tentative: new Date().toISOString(),
      }, { onConflict: "demande_id, event_type" })
      return new Response(
        JSON.stringify({ error: "send_failed", demandeId, eventType }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    // Succès
    await supabaseAdmin.from("notification_emails").upsert({
      demande_id: demandeId,
      destinataire_id: destinataireId,
      event_type: eventType,
      patient_email: destinataireEmail,
      statut: "sent",
      envoyee_at: new Date().toISOString(),
      resend_email_id: emailData.id,
      tentatives: 1,
      derniere_tentative: new Date().toISOString(),
    }, { onConflict: "demande_id, event_type" })

    return new Response(
      JSON.stringify({ success: true, eventType, emailId: emailData.id }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (err) {
    console.error("[notify-patient] Unexpected error:", err)
    return new Response(
      JSON.stringify({ error: "internal_error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
