import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const { name, email, phone, message } = await req.json()

    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

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

    // Setup email payload
    const mailOptions = {
      from: `"MCS Lead Form" <${gmailUser}>`,
      to: "admin@mcsc.co.id", // Delivered to your target testing mailbox
      replyTo: email,                 // Allows replying directly to the customer
      subject: `🔥 New Contact Lead from ${name}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">MCS CONSULTING</h2>
            <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">New Lead Notification</p>
          </div>
          
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #475569; width: 100px; font-size: 14px;">Name:</td>
                <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 700;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #475569; font-size: 14px;">Email:</td>
                <td style="padding: 6px 0; color: #3b82f6; font-size: 14px;"><a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #475569; font-size: 14px;">Phone:</td>
                <td style="padding: 6px 0; color: #0f172a; font-size: 14px;"><a href="tel:${phone}" style="color: #0f172a; text-decoration: none; font-weight: 600;">${phone}</a></td>
              </tr>
            </table>
          </div>

          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; border-left: 4px solid #3b82f6;">
            <p style="font-weight: 700; margin: 0 0 8px 0; color: #1e293b; font-size: 14px;">Message Details:</p>
            <p style="color: #334155; line-height: 1.6; white-space: pre-wrap; margin: 0; font-size: 14px;">${message}</p>
          </div>

          <p style="font-size: 11px; color: #94a3b8; margin-top: 32px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.5;">
            This lead was securely generated from the MCS Consulting Contact page.<br/>
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
