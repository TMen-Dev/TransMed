import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { Resend } from "npm:resend@3"

interface RetryResponse {
  success: true
  retried: number
  succeeded: number
  abandoned: number
}

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const resendApiKey = Deno.env.get("RESEND_API_KEY")!

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
  const resend = new Resend(resendApiKey)

  // Récupérer les notifications échouées à retenter
  // (tentatives < 3 ET derniere_tentative > 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data: notifications, error: selectError } = await supabase
    .from("notification_emails")
    .select("id, demande_id, patient_id, patient_email, tentatives")
    .eq("statut", "failed")
    .lt("tentatives", 3)
    .or(`derniere_tentative.is.null,derniere_tentative.lt.${fiveMinutesAgo}`)

  if (selectError) {
    console.error("[retry-notifications] Select error:", selectError)
    return new Response(
      JSON.stringify({ error: "select_failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  if (!notifications || notifications.length === 0) {
    const result: RetryResponse = { success: true, retried: 0, succeeded: 0, abandoned: 0 }
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  let succeeded = 0
  let abandoned = 0

  for (const notif of notifications) {
    const newTentatives = notif.tentatives + 1
    const now = new Date().toISOString()

    // Incrémenter tentatives avant de tenter l'envoi
    await supabase
      .from("notification_emails")
      .update({ tentatives: newTentatives, derniere_tentative: now })
      .eq("id", notif.id)

    if (newTentatives > 3) {
      // Abandon définitif (tentatives >= 3 après cet essai)
      abandoned++
      continue
    }

    // Récupérer email et prénom du patient
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, prenom")
      .eq("id", notif.patient_id)
      .single()

    const patientEmail = profile?.email ?? notif.patient_email
    const prenom = profile?.prenom ?? "Patient"

    // Récupérer le nom de la demande
    const { data: demande } = await supabase
      .from("demandes")
      .select("nom")
      .eq("id", notif.demande_id)
      .single()

    const nomDemande = demande?.nom ?? "votre demande"

    // Tenter l'envoi
    const { data: emailData, error: resendError } = await resend.emails.send({
      from: "TransMed <onboarding@resend.dev>",
      to: patientEmail,
      subject: `Votre demande "${nomDemande}" est prête — Action requise`,
      html: renderEmailHtml(prenom, nomDemande),
    })

    if (!resendError && emailData?.id) {
      // Succès
      await supabase
        .from("notification_emails")
        .update({
          statut: "sent",
          envoyee_at: now,
          resend_email_id: emailData.id,
          erreur: null,
        })
        .eq("id", notif.id)

      // Marquer la demande comme notifiée
      await supabase
        .from("demandes")
        .update({ email_notif_envoyee: true })
        .eq("id", notif.demande_id)
        .eq("email_notif_envoyee", false)

      succeeded++
    } else {
      // Nouvel échec — tentatives déjà incrémenté, mettre à jour l'erreur
      await supabase
        .from("notification_emails")
        .update({ erreur: resendError?.message ?? "resend_error" })
        .eq("id", notif.id)
    }
  }

  const result: RetryResponse = {
    success: true,
    retried: notifications.length,
    succeeded,
    abandoned,
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})

function renderEmailHtml(prenom: string, nomDemande: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Votre demande est prête — TransMed</title>
</head>
<body style="margin:0;padding:0;background:#F7F3ED;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F3ED;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0"
               style="background:#FFFFFF;border-radius:16px;border:1px solid #E8E1D9;overflow:hidden;max-width:600px;">
          <tr>
            <td style="background:#1B8C5A;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;">TransMed</p>
              <p style="margin:8px 0 0;color:#B2DFC8;font-size:13px;">Solidarité médicale</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;">
              <h2 style="margin:0 0 16px;color:#1B8C5A;font-size:22px;font-weight:700;">
                Votre demande est prête, ${prenom} !
              </h2>
              <p style="margin:0 0 24px;color:#1A1510;font-size:15px;line-height:1.6;">
                Votre demande <strong>${nomDemande}</strong> a abouti. Les fonds sont collectés et un transporteur est assigné.
              </p>
              <div style="background:#E8F7F0;border:1px solid #B2DFC8;border-radius:10px;padding:20px 24px;margin:0 0 28px;">
                <p style="margin:0 0 8px;color:#146B45;font-size:14px;font-weight:700;text-transform:uppercase;">Action requise</p>
                <p style="margin:0;color:#1A1510;font-size:15px;">Ouvrez TransMed et confirmez la prise en charge.</p>
              </div>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-radius:10px;background:#1B8C5A;">
                    <a href="https://transmed.app"
                       style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
                      Ouvrir TransMed →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#F7F3ED;border-top:1px solid #E8E1D9;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#7A6E65;font-size:12px;">Email automatique TransMed — ne pas répondre.</p>
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
