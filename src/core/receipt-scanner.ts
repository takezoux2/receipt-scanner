import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import fs from "fs";
import {
  FileType,
  FileObject,
  DocType,
  ReceiptInfo,
  ServiceInvoiceInfo,
  OutsourcingInvoiceInfo,
  UnknownInfo,
} from "./accounting-objects";
import {
  detectDocumentType,
  outsourcingInvoiceScanner,
  receiptScanner,
  serviceInvoiceScanner,
} from "./scanning";

export const scanFile = async (
  filename: string
): Promise<
  ReceiptInfo | ServiceInvoiceInfo | OutsourcingInvoiceInfo | UnknownInfo
> => {
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
    default:
      return {
        type: "Unknown",
        filename,
      };
  }
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
