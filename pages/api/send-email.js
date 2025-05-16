// pages/api/send-email.js
import Brevo from "@getbrevo/brevo";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metodo non consentito" });
  }

  const { toEmail, subject, content } = req.body;

  if (!toEmail || !subject || !content) {
    return res.status(400).json({ message: "Dati mancanti" });
  }

  try {
    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const emailData = {
      sender: { name: "Deadlines Manager", email: "noreply@deadlines.local" }, // Personalizza!
      to: [{ email: toEmail }],
      subject,
      htmlContent: `<html><body><p>${content}</p></body></html>`,
    };

    await apiInstance.sendTransacEmail(emailData);

    return res.status(200).json({ message: "Email inviata!" });
  } catch (err) {
    console.error("Errore invio email:", err);
    return res.status(500).json({ message: "Errore invio email" });
  }
}