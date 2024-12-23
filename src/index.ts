import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import fs from "fs";
import { HumanMessage } from "@langchain/core/messages";
import sharp from "sharp";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import dotenv from "dotenv";
import { scanFile } from "./core/receipt-scanner";
import { listFiles } from "./core/list-files";
import { createObjectCsvWriter } from "csv-writer";
dotenv.config();

// AIzaSyANwd2jsH63R2ZnOD3lr8IGzN20j-YMF3U
// gemini-1.5-pro-latest
// gemini-1.5-flash-latest

const run = async () => {
  const files = listFiles("./file_list/tskaigi2025.txt");
  //await readReceipt("receipt/kakuyasu.pdf");
  //await readCompany("receipt/IMG_3027.jpg");
  // const files = [
  //   //"E:\\program\\typescript\\drive_to_gcs\\download\\F081446QK37_請求書_弁当.pdf",
  //   // "E:\\program\\typescript\\drive_to_gcs\\download\\F080BCVQTBP_TSKaigi Association様_Kansai2024_ロゴ作成_御請求書_20241111.pdf",
  //   "E:\\program\\typescript\\drive_to_gcs\\download\\F0814FTJGUC_領収書_20241115_スピーカーディナー.jpg",
  // ];
  const scanned = [];
  for (const file of files) {
    console.log("--  " + file + "  --");
    const r = await scanFile(file);
    console.log(r);
    scanned.push(r);
  }
  const grouped = Map.groupBy(scanned, (f) => f.type);
  console.log(grouped);

  if (!fs.existsSync("./out")) {
    fs.mkdirSync("./out");
  }

  if (grouped.has("Receipt")) {
    const receipts = grouped.get("Receipt")!;
    const writer = createObjectCsvWriter({
      path: "./out/receipts.csv",
      header: [
        { id: "company", title: "Company" },
        { id: "totalPrice", title: "Total Price" },
        { id: "publishedDate", title: "Published Date" },
        { id: "invoiceNumber", title: "Invoice Number" },
        { id: "tax10", title: "税額(10%)" },
        { id: "tax8", title: "税額(8%)" },
      ],
    });
    await writer.writeRecords(receipts);
  }
  if (grouped.has("ServiceInvoice")) {
    const invoices = grouped.get("ServiceInvoice")!;
    const writer = createObjectCsvWriter({
      path: "./out/service_invoices.csv",
      header: [
        { id: "company", title: "Company" },
        { id: "totalPrice", title: "Total Price" },
        { id: "publishedDate", title: "Published Date" },
        { id: "paymentDueDate", title: "Payment Due Date" },
        { id: "invoiceNumber", title: "Invoice Number" },
        { id: "tax10", title: "Tax 10" },
        { id: "tax8", title: "Tax 8" },
      ],
    });
    await writer.writeRecords(invoices);
  }
  if (grouped.has("OutsourcingInvoice")) {
    const invoices = grouped.get("OutsourcingInvoice")!;
    const writer = createObjectCsvWriter({
      path: "./out/outsourcing_invoices.csv",
      header: [
        { id: "company", title: "Company" },
        { id: "totalPrice", title: "Total Price" },
        { id: "publishedDate", title: "Published Date" },
        { id: "paymentDueDate", title: "Payment Due Date" },
        { id: "invoiceNumber", title: "Invoice Number" },
        { id: "tax10", title: "Tax 10" },
        { id: "withholdingTax", title: "Withholding Tax" },
      ],
    });
    await writer.writeRecords(invoices);
  }
};

run();
// readCompany("receipt/IMG_3090.HEIC").then((res) => {
//   console.log(res);
// });
