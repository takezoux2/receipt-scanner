export enum FileType {
  Image,
  PDF,
}

export type FileObject = ImageObject | PDFObject;

export type ImageObject = {
  type: FileType.Image;
  filename: string;
  base64Data: string;
};
export type PDFObject = {
  type: FileType.PDF;
  filename: string;
  textContent: string;
};

export enum DocType {
  Receipt = "領収書",
  ServiceInvoice = "サービス請求書",
  OutsourcingInvoice = "業務委託請求書",
  Unknown = "不明",
}
export type UnknownInfo = {
  type: "Unknown";
  filename: string;
};

export type ServiceInvoiceInfo = {
  type: "ServiceInvoice";
  company: string;
  totalPrice: string;
  publishedDate: string;
  paymentDueDate: string;
  invoiceNumber: string;
  tax10: string;
  tax8: string;
};
export type OutsourcingInvoiceInfo = {
  type: "OutsourcingInvoice";
  company: string;
  totalPrice: string;
  publishedDate: string;
  paymentDueDate: string;
  invoiceNumber: string;
  tax10: string;
  withholdingTax: string;
};

export type ReceiptInfo = {
  type: "Receipt";
  company: string;
  totalPrice: string;
  publishedDate: string;
  invoiceNumber: string;
  tax10: string;
  tax8: string;
};
