import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import fs from "fs";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

export const scanFile = async (
  filename: string
): Promise<ReceiptInfo | ServiceInvoiceInfo | OutsourcingInvoiceInfo> => {
  const fileObj = await loadFile(filename);
  const docType = await detectDocumentType(fileObj);
  console.log(`FileType: ${fileObj.type}, DocType: ${docType}`);
  switch (docType) {
    case DocType.Receipt:
      return receiptScanner(fileObj);
    case DocType.ServiceInvoice:
      return serviceInvoiceScanner(fileObj);
    case DocType.OutsourcingInvoice:
      return outsourcingInvoiceScanner(fileObj);
  }
};

enum FileType {
  Image,
  PDF,
}

type FileObject = ImageObject | PDFObject;

type ImageObject = {
  type: FileType.Image;
  filename: string;
  base64Data: string;
};
type PDFObject = {
  type: FileType.PDF;
  filename: string;
  textContent: string;
};
const loadFile = async (filename: string): Promise<FileObject> => {
  const fileType = detectFileType(filename);
  switch (fileType) {
    case FileType.Image:
      const image = fs.readFileSync(filename).toString("base64");
      return {
        type: FileType.Image,
        filename,
        base64Data: image,
      };
    case FileType.PDF:
      const documents = await new PDFLoader(filename).load();
      const textContent = documents.map((doc) => doc.pageContent).join("\n");
      return {
        type: FileType.PDF,
        filename,
        textContent,
      };
  }
};

const detectFileType = (filename: string): FileType => {
  if (filename.endsWith(".png") || filename.endsWith(".jpg")) {
    return FileType.Image;
  }
  if (filename.endsWith(".pdf")) {
    return FileType.PDF;
  }
  throw new Error(
    "Unsupported file type.File extension must be .png, .jpg, or .pdf"
  );
};
const PROMPTS = {
  company: `会社名を抜き出して。出力は会社名だけを出して。`,
  totalPrice: `合計金額を抜き出して。出力は金額と単位だけを出して。`,
  publishedDate: `発行された日付を抜き出して。`,
  paymentDueDate: `支払期限を抜き出して。`,
  invoiceNumber: `登録番号を抜き出して。
  登録番号は、"T" + 数字13桁の形式です。
  出力は登録番号だけを出して。
  "T"から始まる登録番号が見つからない場合は、「なし」を出して`,
  tax10: `税率10%対象の消費税額を抜き出して。10%の記載が無い時は、税率8%対象の消費税が見つかった場合は"0円"、見つからない場合は消費税額を見つけて抜き出して`,
  tax8: `税率8%対象の消費税額を抜き出して。8%の記載がない場合は、税率10%対象の消費税が見つかった場合は"0円"、見つからない場合は消費税額を見つけて抜き出して`,
};

enum DocType {
  Receipt = "領収書",
  ServiceInvoice = "サービス請求書",
  OutsourcingInvoice = "業務委託請求書",
}

const detectDocumentType = async (fileObj: FileObject): Promise<DocType> => {
  const result = await scan(fileObj, {
    detectType: `領収書か、サービスや物品購入の請求書か、業務委託の請求書かを判定してください。
領収書の場合は「領収書」、サービスや物品購入の請求書の場合は「サービス請求書」、業務委託の請求書の場合は「業務委託請求書」と出力してください。    
`,
  });
  if (result.detectType === "領収書") {
    return DocType.Receipt;
  } else if (result.detectType === "サービス請求書") {
    return DocType.ServiceInvoice;
  } else if (result.detectType === "業務委託請求書") {
    return DocType.OutsourcingInvoice;
  }
  throw new Error("Document type detection failed:" + result.detectType);
};

type ReceiptInfo = {
  company: string;
  totalPrice: string;
  publishedDate: string;
  invoiceNumber: string;
  tax10: string;
  tax8: string;
};

const receiptScanner = async (fileObj: FileObject): Promise<ReceiptInfo> => {
  return {
    company: "株式会社〇〇",
    totalPrice: "1000円",
    publishedDate: "2021-01-01",
    invoiceNumber: "T1234567890123",
    tax10: "100円",
    tax8: "80円",
  };
};

type ServiceInvoiceInfo = {
  company: string;
  totalPrice: string;
  publishedDate: string;
  paymentDueDate: string;
  invoiceNumber: string;
  tax10: string;
  tax8: string;
};
const SERVICE_INVOICE_PROMPTS = {
  company: `会社名を抜き出して。出力は会社名だけを出して。`,
  totalPrice: `合計金額を抜き出して。出力は金額と単位だけを出して。`,
  publishedDate: `発行された日付を抜き出して。`,
  paymentDueDate: `支払期限を抜き出して。`,
  invoiceNumber: `登録番号を抜き出して。
  登録番号は、"T" + 数字13桁の形式です。
  出力は登録番号だけを出して。
  "T"から始まる登録番号が見つからない場合は、「なし」を出して`,
  tax10: `税率10%対象の消費税額を抜き出して。10%の記載が無い時は、税率8%対象の消費税が見つかった場合は"0円"、見つからない場合は消費税額を見つけて抜き出して`,
  tax8: `税率8%対象の消費税額を抜き出して。8%の記載がない場合は、税率10%対象の消費税が見つかった場合は"0円"、見つからない場合は消費税額を見つけて抜き出して`,
};

const serviceInvoiceScanner = async (
  fileObj: FileObject
): Promise<ServiceInvoiceInfo> => {
  return scan(fileObj, SERVICE_INVOICE_PROMPTS);
};

type OutsourcingInvoiceInfo = {
  company: string;
  totalPrice: string;
  publishedDate: string;
  paymentDueDate: string;
  invoiceNumber: string;
  tax10: string;
  withholdingTax: string;
};
const outsourcingInvoiceScanner = async (
  fileObj: FileObject
): Promise<OutsourcingInvoiceInfo> => {
  return {
    company: "株式会社〇〇",
    totalPrice: "1000円",
    publishedDate: "2021-01-01",
    paymentDueDate: "2021-01-31",
    invoiceNumber: "T1234567890123",
    tax10: "100円",
    withholdingTax: "10%",
  };
};

const MODEL = "gemini-1.5-pro-latest";

const scan = async <T extends { [K: string]: string }>(
  fileObj: FileObject,
  prompts: T
): Promise<{ [Key in keyof T]: string }> => {
  const model = new ChatGoogleGenerativeAI({
    model: MODEL,
    maxOutputTokens: 2048,
  });

  const createMessage = (prompt: string) => {
    if (fileObj.type === FileType.Image) {
      return new HumanMessage({
        content: [
          {
            type: "text",
            text: `${prompt}`,
          },
          {
            type: "image_url",
            image_url: `data:image/png;base64,${fileObj.base64Data}`,
          },
        ],
      });
    } else {
      return new HumanMessage({
        content: [
          {
            type: "text",
            text: `"""${fileObj.textContent}"""
            ${prompt}`,
          },
        ],
      });
    }
  };

  const results = {} as any;
  for (const [key, prompt] of Object.entries(prompts)) {
    console.log(`Scanning ${key}...`);
    const res = await model.invoke([createMessage(prompt)]);
    results[key] = res.content.toString().trim();
  }
  return results;
};
