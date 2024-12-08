import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import fs from "fs";
import { HumanMessage } from "@langchain/core/messages";
import sharp from "sharp";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import dotenv from "dotenv";
dotenv.config();

// AIzaSyANwd2jsH63R2ZnOD3lr8IGzN20j-YMF3U
// gemini-1.5-pro-latest
// gemini-1.5-flash-latest

const MODEL = "gemini-1.5-pro-latest";

const resize = async (fileName: string) => {
  const s = sharp(fileName);
  await sharp(fileName)
    .rotate()
    .trim({
      threshold: 150,
    })
    .resize({ width: 1024 })
    .toFormat("jpeg")
    .toFile(fileName + ".jpg");
};

const readReceipt = async (fileName: string) => {
  const image = fs.readFileSync(fileName).toString("base64");

  const model = new ChatGoogleGenerativeAI({
    model: MODEL,
    maxOutputTokens: 2048,
  });

  const res = await model.invoke([
    new HumanMessage({
      content: [
        {
          type: "text",
          text: `領収書から、
* 会社名
* 金額
* 日付
* 登録番号
* 税率と各税率の内訳
を読み取り、次のJson形式で返してください。JSONのみを返してください。
{
  "company": "{会社名}",
  "amount": {金額},
  "date": "{日付}",
  "invoice_number": "{登録番号}",
  "tax": [{ "rate": {税率}, "amount": {税額} }, ...]
}
# 入力
登録番号は、"T" + 数字13桁の形式です。

# 出力
金額は、number型で返してください。
日付は、"YYYY-MM-DD"の形式で返してください。
 `,
        },
        fileName.endsWith(".pdf")
          ? { type: "pdf", url: await new PDFLoader(fileName).load() }
          : {
              type: "image_url",
              image_url: `data:image/png;base64,${image}`,
            },
      ],
    }),
  ]);
  console.log(res.content.toString());
  return JSON.parse(res.content.toString());
};

const readCompany = async (fileName: string) => {
  const image = fs.readFileSync(fileName).toString("base64");

  const model = new ChatGoogleGenerativeAI({
    model: MODEL,
    maxOutputTokens: 2048,
  });

  const res = await model.invoke([
    new HumanMessage({
      content: [
        {
          type: "text",
          text: `会社名を抜き出して`,
        },
        {
          type: "image_url",
          image_url: `data:image/png;base64,${image}`,
        },
      ],
    }),
  ]);
  console.log(res.content.toString());
  return res.content.toString();
};

const prompts = {
  company: `会社名を抜き出して。出力は会社名だけを出して。`,
  totalPrice: `合計金額を抜き出して。出力は金額と単位だけを出して。`,
  publishedDate: `発行された日付を抜き出して。`,
  invoiceNumber: `登録番号を抜き出して。
  登録番号は、"T" + 数字13桁の形式です。
  出力は登録番号だけを出して。`,
  tax10: `税率10%対象の消費税額を抜き出して。10%の記載が無い時は、税率8%対象の消費税が見つかった場合は"0円"、見つからない場合は消費税額を見つけて抜き出して`,
  tax8: `税率8%対象の消費税額を抜き出して。8%の記載がない場合は、税率10%対象の消費税が見つかった場合は"0円"、見つからない場合は消費税額を見つけて抜き出して`,
};

const readParameters = async (fileName: string) => {
  const image = fs.readFileSync(fileName).toString("base64");

  const model = new ChatGoogleGenerativeAI({
    model: MODEL,
    maxOutputTokens: 2048,
  });
  const documents = await new PDFLoader(fileName).load();
  const text = documents.map((doc) => doc.pageContent).join("\n");
  const results = {} as any;
  for (const [key, prompt] of Object.entries(prompts)) {
    const res = await model.invoke([
      new HumanMessage({
        content: [
          {
            type: "text",
            text: `"""${text}"""
            ${prompt}`,
          },
          // {
          //   type: "image_url",
          //   image_url: `data:image/png;base64,${image}`,
          // },
        ],
      }),
    ]);
    results[key] = res.content.toString();
  }

  console.log(results);
  return results;
};

const detectType = async (fileName: string) => {
  const image = fs.readFileSync(fileName).toString("base64");

  const model = new ChatGoogleGenerativeAI({
    model: MODEL,
    maxOutputTokens: 2048,
  });
  const documents = await new PDFLoader(fileName).load();
  const text = documents.map((doc) => doc.pageContent).join("\n");
  const prompts = {
    detectType: `領収書か、サービスや物品購入の請求書か、業務委託の請求書かを判定してください。
回答は、"領収書","サービス請求書","業務委託請求書"のいずれかでお願いします。
    `,
  };
  const results = {} as any;
  for (const [key, prompt] of Object.entries(prompts)) {
    const res = await model.invoke([
      new HumanMessage({
        content: [
          {
            type: "text",
            text: `"""${text}"""
            ${prompt}`,
          },
          // {
          //   type: "image_url",
          //   image_url: `data:image/png;base64,${image}`,
          // },
        ],
      }),
    ]);
    results[key] = res.content.toString();
  }
  console.log(results);
  return results;
};

const run = async () => {
  //await readReceipt("receipt/kakuyasu.pdf");
  //await readCompany("receipt/IMG_3027.jpg");
  for (const file of [
    //"E:\\program\\typescript\\drive_to_gcs\\download\\F0814FTJGUC_領収書_20241115_スピーカーディナー.jpg",
    //"E:\\program\\typescript\\drive_to_gcs\\download\\F081215GNG3_領収書_懇親会ドリンク_1.jpg",
    "E:\\program\\typescript\\drive_to_gcs\\download\\F081446QK37_請求書_弁当.pdf",
  ]) {
    console.log("--  " + file + ".jpg  --");
    //await resize(`${file}`);
    //await readCompany(`${file}.jpg`);
    console.log("--  " + file + "  --");
    await detectType(`${file}`);
    await readParameters(`${file}`);
  }
};
run();
// readCompany("receipt/IMG_3090.HEIC").then((res) => {
//   console.log(res);
// });
