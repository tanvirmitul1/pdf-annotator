import type {
    DocumentInitParameters,
    PDFDocumentLoadingTask,
} from "pdfjs-dist/types/src/display/api"

declare module "pdfjs-dist/legacy/build/pdf" {
    export const GlobalWorkerOptions: {
        workerSrc: string
    }

    export function getDocument(
        data: DocumentInitParameters | string
    ): PDFDocumentLoadingTask
}
