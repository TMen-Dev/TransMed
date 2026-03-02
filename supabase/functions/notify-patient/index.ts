import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { Resend } from "npm:resend@3"

interface WebhookPayload {
  type: "UPDATE"
  table: "demandes"
  record: {
    id: string
    patient_id: string
    nom: string
    statut: string
    email_notif_envoyee: boolean
  }
  old_record: {
    statut: string
    email_notif_envoyee: boolean
  }
}

function renderEmailHtml(prenom: string, nomDemande: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre demande est prête — TransMed</title>
</head>
<body style="margin:0;padding:0;background:#F7F3ED;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F3ED;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0"
               style="background:#FFFFFF;border-radius:16px;border:1px solid #E8E1D9;overflow:hidden;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background:#1B8C5A;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.5px;">TransMed</p>
              <p style="margin:8px 0 0;color:#B2DFC8;font-size:13px;">Solidarité médicale</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h2 style="margin:0 0 16px;color:#1B8C5A;font-size:22px;font-weight:700;">
                Votre demande est prête, ${prenom} !
              </h2>
              <p style="margin:0 0 12px;color:#1A1510;font-size:15px;line-height:1.6;">
                Votre demande <strong style="color:#1A1510;">${nomDemande}</strong> a abouti grâce à la solidarité des aidants de votre communauté.
              </p>
              <p style="margin:0 0 24px;color:#1A1510;font-size:15px;line-height:1.6;">
                Les fonds nécessaires sont collectés et un transporteur a été assigné pour livrer vos médicaments.
              </p>
              <!-- Action box -->
              <div style="background:#E8F7F0;border:1px solid #B2DFC8;border-radius:10px;padding:20px 24px;margin:0 0 28px;">
                <p style="margin:0 0 8px;color:#146B45;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                  Action requise
                </p>
                <p style="margin:0;color:#1A1510;font-size:15px;line-height:1.5;">
                  Ouvrez TransMed et confirmez la prise en charge pour que la livraison soit finalisée.
                </p>
              </div>
              <!-- CTA button -->
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:10px;background:#1B8C5A;box-shadow:0 4px 12px rgba(27,140,90,0.35);">
                    <a href="https://transmed.app"
                       style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
                      Ouvrir TransMed →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F7F3ED;border-top:1px solid #E8E1D9;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#7A6E65;font-size:12px;line-height:1.5;">
                Cet email a été envoyé automatiquement par TransMed.<br>
                Ne répondez pas à cet email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

Deno.serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json()

    // Guard: seulement les transitions vers pret_acceptation_patient
    if (payload.record.statut !== "pret_acceptation_patient") {
      return new Response(JSON.stringify({ message: "Skipped" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Guard idempotence: statut déjà pret_acceptation_patient avant cet update
    if (payload.old_record.statut === "pret_acceptation_patient") {
      return new Response(JSON.stringify({ message: "Already sent" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Guard idempotence: email déjà envoyé
    if (payload.record.email_notif_envoyee === true) {
      return new Response(JSON.stringify({ message: "Already sent" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!

    // Client admin (bypass RLS) pour lire profiles et écrire notification_emails
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const demandeId = payload.record.id
    const patientId = payload.record.patient_id
    const nomDemande = payload.record.nom

    // Récupérer email et prénom du patient
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, prenom")
      .eq("id", patientId)
      .single()

    if (profileError || !profile?.email) {
      // Tracer l'échec : email manquant (upsert pour éviter conflit UNIQUE demande_id)
      await supabase.from("notification_emails").upsert({
        demande_id: demandeId,
        patient_id: patientId,
        patient_email: "",
        statut: "failed",
        erreur: "email_manquant",
        tentatives: 1,
        derniere_tentative: new Date().toISOString(),
      }, { onConflict: "demande_id" })
      return new Response(
        JSON.stringify({ error: "email_missing", demandeId }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    const patientEmail = profile.email.toLowerCase()
    const prenom = profile.prenom ?? "Patient"

    // Envoi email via Resend
    const resend = new Resend(resendApiKey)
    const { data: emailData, error: resendError } = await resend.emails.send({
      from: "TransMed <onboarding@resend.dev>",
      to: patientEmail,
      subject: `Votre demande "${nomDemande}" est prête — Action requise`,
      html: renderEmailHtml(prenom, nomDemande),
    })

    if (resendError || !emailData?.id) {
      // Tracer l'échec Resend (upsert pour éviter conflit UNIQUE demande_id)
      await supabase.from("notification_emails").upsert({
        demande_id: demandeId,
        patient_id: patientId,
        patient_email: patientEmail,
        statut: "failed",
        erreur: resendError?.message ?? "resend_error",
        tentatives: 1,
        derniere_tentative: new Date().toISOString(),
      }, { onConflict: "demande_id" })
      return new Response(
        JSON.stringify({ error: "send_failed", demandeId }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    // Succès : tracer l'envoi (upsert pour éviter conflit UNIQUE demande_id)
    await supabase.from("notification_emails").upsert({
      demande_id: demandeId,
      patient_id: patientId,
      patient_email: patientEmail,
      statut: "sent",
      envoyee_at: new Date().toISOString(),
      resend_email_id: emailData.id,
      tentatives: 1,
      derniere_tentative: new Date().toISOString(),
    }, { onConflict: "demande_id" })

    // Marquer la demande comme notifiée (idempotent avec AND email_notif_envoyee=false)
    await supabase
      .from("demandes")
      .update({ email_notif_envoyee: true })
      .eq("id", demandeId)
      .eq("email_notif_envoyee", false)

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (err) {
    // Erreur inattendue → 500 (Supabase Webhook retentera)
    console.error("[notify-patient] Unexpected error:", err)
    return new Response(
      JSON.stringify({ error: "internal_error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
