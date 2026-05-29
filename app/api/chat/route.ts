import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/lib/models/invoice";
import { Customer } from "@/lib/models/customer";
import { InventoryItem } from "@/lib/models/inventory";
import { getAuthBusinessId } from "@/lib/api-auth";
import { parseCommand, type CommandResult } from "@/lib/command-parser";

export async function POST(request: NextRequest) {
  const { businessId, error } = await getAuthBusinessId();
  if (error) return error;

  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const command = await parseCommand(message);

    if (command.type === "action" && command.action === "send-reminder") {
      await connectDB();
      const creditInvoices = await Invoice.aggregate([
        { $match: { businessId: new mongoose.Types.ObjectId(businessId as string), status: "credit" } },
        { $group: { _id: "$customerId", customerName: { $first: "$customerName" }, total: { $sum: "$total" }, invoiceCount: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { total: -1 } },
      ]);
      const data = creditInvoices.map((c) => ({
        _id: c._id?.toString() || "unknown",
        name: c.customerName || "Unknown",
        total: c.total,
        invoiceCount: c.invoiceCount,
      }));
      return NextResponse.json({ ...command, data });
    }

    if (command.type === "query" && command.queryType) {
      await connectDB();
      let data: unknown;

      switch (command.queryType) {
        case "invoices": {
          const query: Record<string, unknown> = { businessId };
          if (command.params?.status) {
            query.status = command.params.status;
          }
          if (command.params?.customerName) {
            query.customerName = {
              $regex: command.params.customerName as string,
              $options: "i",
            };
          }
          if (command.params?.search) {
            query.$or = [
              {
                customerName: {
                  $regex: command.params.search as string,
                  $options: "i",
                },
              },
              {
                invoiceNumber: {
                  $regex: command.params.search as string,
                  $options: "i",
                },
              },
            ];
          }
          const limit = (command.params?.limit as number) || 20;
          const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
          data = invoices;
          break;
        }
        case "stats": {
          const [totalInvoices, totalRevenue, totalCustomers] =
            await Promise.all([
              Invoice.countDocuments({ businessId }),
              Invoice.aggregate([
                {
                  $match: {
                    businessId: new mongoose.Types.ObjectId(businessId as string),
                    status: { $ne: "cancelled" },
                  },
                },
                { $group: { _id: null, total: { $sum: "$total" } } },
              ]),
              Customer.countDocuments({ businessId }),
            ]);
          data = {
            totalInvoices,
            totalRevenue: totalRevenue[0]?.total || 0,
            totalCustomers,
          };
          break;
        }
        case "customers": {
          const customers = await Customer.find({ businessId })
            .sort({ totalSpent: -1 })
            .limit(20)
            .lean();
          data = customers;
          break;
        }
        case "inventory": {
          const items = await InventoryItem.find({ businessId })
            .sort({ name: 1 })
            .lean();
          data = items;
          break;
        }
        case "outstanding": {
          const creditInvoices = await Invoice.find({
            businessId,
            status: "credit",
          })
            .sort({ createdAt: -1 })
            .select("customerName total invoiceNumber createdAt")
            .lean();
          const totalOutstanding = creditInvoices.reduce(
            (sum, inv) => sum + inv.total,
            0
          );
          const customerMap: Record<string, { name: string; total: number }> =
            {};
          for (const inv of creditInvoices) {
            const name = inv.customerName || "Unknown";
            if (!customerMap[name]) {
              customerMap[name] = { name, total: 0 };
            }
            customerMap[name].total += inv.total;
          }
          data = {
            totalOutstanding,
            invoices: creditInvoices,
            customers: Object.values(customerMap).sort(
              (a, b) => b.total - a.total
            ),
          };
          break;
        }
      }

      return NextResponse.json({ ...command, data });
    }

    return NextResponse.json(command);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        type: "error" as const,
        message:
          "Sorry, I encountered an error processing your request. Please try again.",
      },
      { status: 500 }
    );
  }
}
