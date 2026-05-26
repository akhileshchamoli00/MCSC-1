import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const {
      appNoInput,
      regNoInput,
      brandInput,
      ownerInput,
      emailInput
    } = payload

    const gmailUser = process.env.GMAIL_USER
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json(
        { error: "Gmail credentials not set up. Please add GMAIL_USER and GMAIL_APP_PASSWORD in .env.local" },
        { status: 500 }
      )
    }

    // Configure Nodemailer Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    })

    // Setup email payload to admin@mcsc.co.id
    const mailOptions = {
      from: `"MCS Status Check Form" <${gmailUser}>`,
      to: "admin@mcsc.co.id",
      subject: `🔍 New Trademark Status Query: ${brandInput || "No Brand Name"}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">MCS CONSULTING</h2>
            <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">New Trademark Status Query</p>
          </div>
          
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; width: 160px; color: #475569; border-bottom: 1px solid #f1f5f9;">Brand Name:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 800; font-size: 15px; border-bottom: 1px solid #f1f5f9;">${brandInput || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Owner Name:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9;">${ownerInput || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Email Address:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9;">
                  <a href="mailto:${emailInput}" style="color: #2563eb; text-decoration: none;">${emailInput || "-"}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Application Number:</td>
                <td style="padding: 8px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${appNoInput || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Registration Number:</td>
                <td style="padding: 8px 0; color: #0f172a;">${regNoInput || "-"}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 11px; color: #94a3b8; margin-top: 32px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.5;">
            This request was securely generated from the MCS Consulting Status Check page.<br/>
            Powered by Gmail SMTP.
          </p>
        </div>
      `,
    }

    // Send the email using Nodemailer
    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    )
  }
}
