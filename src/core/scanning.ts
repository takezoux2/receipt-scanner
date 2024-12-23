import { HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  FileObject,
  FileType,
  DocType,
  ServiceInvoiceInfo,
  OutsourcingInvoiceInfo,
  ReceiptInfo,
} from "./accounting-objects";

export const detectDocumentType = async (
  fileObj: FileObject
): Promise<DocType> => {
  const result = await scan(fileObj, {
    detectType: `領収書か、サービスや物品購入の請求書か、業務委託の請求書か見積書かを判定してください。
領収書の場合は「領収書」、サービスや物品購入の請求書の場合は「サービス請求書」、業務委託の請求書の場合は「業務委託請求書」と出力してください。
見積書または、どれにも該当しない場合は「不明」と出力してください。    
`,
  });
  if (result.detectType === "領収書") {
    return DocType.Receipt;
  } else if (result.detectType === "サービス請求書") {
    return DocType.ServiceInvoice;
  } else if (result.detectType === "業務委託請求書") {
    return DocType.OutsourcingInvoice;
  }
  console.log("Document type detection failed:" + result.detectType);
  return DocType.Unknown;
};

export const serviceInvoiceScanner = async (
  fileObj: FileObject
): Promise<ServiceInvoiceInfo> => {
  const scanResult = await scan(fileObj, SERVICE_INVOICE_PROMPTS);
  return { type: "ServiceInvoice", ...scanResult };
};
export const outsourcingInvoiceScanner = async (
  fileObj: FileObject
): Promise<OutsourcingInvoiceInfo> => {
  const scanResult = await scan(fileObj, OUTSOURCING_INVOICE_PROMPTS);
  return { type: "OutsourcingInvoice", ...scanResult };
};

export const receiptScanner = async (
  fileObj: FileObject
): Promise<ReceiptInfo> => {
  const scanResult = await scan(fileObj, RECEIPT_PROMPTS);
  return { type: "Receipt", ...scanResult };
};

const SELF_COMPANY_NAME = "TSKaigi Association";

const PROMPTS = {
  totalPrice: `合計金額を抜き出して。出力は金額の数値だけを出して。`,
  publishedDate: `発行された日付を抜き出して。`,
  paymentDueDate: `支払期限を抜き出して。`,
  invoiceNumber: `登録番号を抜き出して。
  登録番号は、"T" + 数字13桁の形式です。
  出力は登録番号だけを出して。
  "T"から始まる登録番号が見つからない場合は、「なし」を出して`,
  tax10: `税率10%対象の消費税額を金額の数値だけ抜き出して。10%の記載が無い時は、税率8%対象の消費税が見つかった場合は"0"、見つからない場合は消費税額を見つけて金額の数値だけ抜き出して`,
  tax8: `税率8%対象の消費税額を金額の数値だけ抜き出して。8%の記載がない場合は、税率10%対象の消費税が見つかった場合は"0"、見つからない場合は消費税額を見つけて金額の数値だけ抜き出して`,
};

const SERVICE_INVOICE_PROMPTS = {
  company: `会社名、店名を抜き出して。出力は名前だけを出して。
"${SELF_COMPANY_NAME}"が含まれる会社名は、自社なので無視をして。
会社名 > 店名の順の優先度で抜き出して。
店名の場合は、地名まで含めて出して。
  `,
  totalPrice: PROMPTS.totalPrice,
  publishedDate: PROMPTS.publishedDate,
  paymentDueDate: PROMPTS.paymentDueDate,
  invoiceNumber: PROMPTS.invoiceNumber,
  tax10: PROMPTS.tax10,
  tax8: PROMPTS.tax8,
};
const OUTSOURCING_INVOICE_PROMPTS = {
  company: `会社名、または、個人名を抜き出して。出力は名前だけを出して。
"${SELF_COMPANY_NAME}"が含まれる会社名は、自社なので無視をして。
会社名 > 個人名の順の優先度で抜き出して。
  `,
  totalPrice: PROMPTS.totalPrice,
  publishedDate: PROMPTS.publishedDate,
  paymentDueDate: PROMPTS.paymentDueDate,
  invoiceNumber: PROMPTS.invoiceNumber,
  tax10: PROMPTS.tax10,
  withholdingTax: `源泉所得税の金額を数値だけ抜き出して。該当する項目が無い場合は、"なし"と出力して`,
};
const RECEIPT_PROMPTS = {
  company: `会社名、または、店名を抜き出して。出力は名前だけを出して。
"${SELF_COMPANY_NAME}"が含まれる会社名は、自社なので無視をして。
会社名 > 店名の順の優先度で抜き出して。
店名の場合は、地名まで含めて出して。
  `,
  totalPrice: PROMPTS.totalPrice,
  publishedDate: PROMPTS.publishedDate,
  invoiceNumber: PROMPTS.invoiceNumber,
  tax10: PROMPTS.tax10,
  tax8: PROMPTS.tax8,
};

// const MODEL = "gemini-1.5-pro-latest";
const MODEL = "gemini-1.5-flash-latest";

export const scan = async <T extends { [K: string]: string }>(
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
  const keys = Object.keys(prompts);
  const messages = Object.values(prompts).map((prompt) => [
    createMessage(prompt),
  ]);
  const res = await model.generate(messages);
  res.generations.forEach((gen, i) => {
    results[keys[i]] = gen[0].text.toString().trim();
  });
  return results;
};
