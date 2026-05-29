import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/lib/models/invoice";
import { Customer } from "@/lib/models/customer";
import { Business } from "@/lib/models/business";
import { getAuthBusinessId } from "@/lib/api-auth";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: parseInt(process.env.BREVO_SMTP_PORT || "587"),
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    const { id } = await params;
    await connectDB();

    const customer = await Customer.findOne({ _id: id, businessId }).lean();
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const business = await Business.findById(businessId).lean();
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const creditInvoices = await Invoice.find({
      businessId,
      customerId: id,
      status: "credit",
    }).lean();

    if (creditInvoices.length === 0) {
      return NextResponse.json(
        { error: "No outstanding balance for this customer" },
        { status: 400 }
      );
    }

    const outstandingTotal = creditInvoices.reduce(
      (sum, inv) => sum + inv.total,
      0
    );

    const invoiceList = creditInvoices
      .map(
        (inv) =>
          `${inv.invoiceNumber} — ${formatCurrency(inv.total)}`
      )
      .join("\n");

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 0;">
        <div style="height: 4px; background: #2563eb;"></div>
        <div style="padding: 32px 32px 24px;">
          <table style="width:100%;">
            <tr>
              <td style="vertical-align:top;">
                <p style="font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 2px;">${business.name}</p>
                <p style="font-size: 12px; color: #6b7280; margin: 1px 0;">${business.email}${business.phone ? ` | ${business.phone}` : ""}</p>
              </td>
            </tr>
          </table>
          <hr style="border: none; border-top: 2px solid #2563eb; margin: 16px 0;">
          <p style="font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 4px;">Dear ${customer.name},</p>
          <p style="font-size: 14px; color: #4b5563; margin: 0 0 16px;">This is a gentle reminder that you have an outstanding balance of <strong>${formatCurrency(outstandingTotal)}</strong> on the following invoices:</p>
          <div style="background: #f8fafc; border-radius: 0; padding: 20px; margin: 16px 0;">
            <pre style="font-size: 13px; color: #4b5563; margin: 0; font-family: monospace; white-space: pre-wrap;">${invoiceList}</pre>
          </div>
          <p style="font-size: 14px; color: #4b5563; margin: 16px 0 0;">Please clear the amount at your earliest convenience. If you have already made the payment, kindly ignore this message.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 16px;">
          <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0;">Thank you for your continued trust in ${business.name}.</p>
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 8px 0 0;">Powered by BolKeBill — AI-powered invoicing</p>
        </div>
        <div style="height: 4px; background: #2563eb;"></div>
      </div>
    `;

    let emailSent = false;
    if (customer.email) {
      try {
        await transporter.sendMail({
          from:
            process.env.EMAIL_FROM ||
            `"${business.name}" <${process.env.BREVO_SMTP_USER}>`,
          to: customer.email,
          subject: `Payment Reminder from ${business.name} — Outstanding: ${formatCurrency(outstandingTotal)}`,
          html,
        });
        emailSent = true;
      } catch (err) {
        console.error("Reminder email failed:", err);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bolkebill.app";
    const waMessage = encodeURIComponent(
      `Dear ${customer.name}, this is a reminder from ${business.name}. Your outstanding balance of ${formatCurrency(outstandingTotal)} is pending. Please clear it at your earliest convenience. Thank you!`
    );
    const waUrl = customer.phone
      ? `https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}?text=${waMessage}`
      : null;

    return NextResponse.json({
      success: true,
      emailSent,
      waUrl,
      customerName: customer.name,
      outstandingTotal,
    });
  } catch (err) {
    console.error("Reminder error:", err);
    return NextResponse.json(
      { error: "Failed to send reminder" },
      { status: 500 }
    );
  }
}
