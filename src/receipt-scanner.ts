const readFile = async (
  filename: string
): Promise<ReceiptInfo | ServiceInvoiceInfo | OutsourcingInvoiceInfo> => {
  const fileType = await detectDocumentType(filename);
  switch (fileType) {
    case DocType.Receipt:
      return receiptScanner(filename);
    case DocType.ServiceInvoice:
      return serviceInvoiceScanner(filename);
    case DocType.OutsourcingInvoice:
      return outsourcingInvoiceScanner(filename);
  }
};

enum FileType {
  Image,
  PDF,
}

type ImageObject = {
  filename: string;
  base64Data: string;
};
type PDFObject = {};

const detectFileType = async (filename: string): Promise<FileType> => {
  return FileType.PDF;
};

enum DocType {
  Receipt = "領収書",
  ServiceInvoice = "サービス請求書",
  OutsourcingInvoice = "業務委託請求書",
}

const detectDocumentType = async (filename: string): Promise<DocType> => {
  return DocType.Receipt;
};

type ReceiptInfo = {
  company: string;
  totalPrice: string;
  publishedDate: string;
  invoiceNumber: string;
  tax10: string;
  tax8: string;
};

const receiptScanner = async (fileName: string): Promise<ReceiptInfo> => {
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

const serviceInvoiceScanner = async (
  fileName: string
): Promise<ServiceInvoiceInfo> => {
  return {
    company: "株式会社〇〇",
    totalPrice: "1000円",
    publishedDate: "2021-01-01",
    paymentDueDate: "2021-01-31",
    invoiceNumber: "T1234567890123",
    tax10: "100円",
    tax8: "80円",
  };
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
  filename: string
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
