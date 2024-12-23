import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import fs from "fs";
import { HumanMessage } from "@langchain/core/messages";
import sharp from "sharp";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import dotenv from "dotenv";
import { scanFile } from "./core/receipt-scanner";
import { listFiles } from "./core/list-files";
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
  for (const file of files.splice(0, 1)) {
    console.log("--  " + file + "  --");
    const r = await scanFile(file);
    console.log(r);
    scanned.push(r);
  }
  const grouped = Map.groupBy(scanned, (f) => f.type);
  console.log(grouped);

  if (grouped.has("Receipt")) {
    const receipts = grouped.get("Receipt");
    console.log(receipts);
  }
};

run();
// readCompany("receipt/IMG_3090.HEIC").then((res) => {
//   console.log(res);
// });
