import { Pinecone } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'

let pinecone: Pinecone | null = null;

export const getPineconeClient = async () => {
    if (!pinecone) {
        pinecone = new Pinecone({
            environment: process.env.PINECONE_ENVIRONMENT!,
            apiKey: process.env.PINECONE_API_KEY!,
        })
    }
    return pinecone
}

export async function loadS3IntoPinecone(fileKey: string) {
    // 1. obtain the pdf
    console.log("downloading s3 into file system")
    const fileName = await downloadFromS3(fileKey)
    if (!fileName) {
        throw new Error("could not download file from s3")
    }
    const loader = new PDFLoader(fileName)
    const pages = await loader.load()
    return pages
    // 2. split and segment pdf
    // 3. vectorise and embed segments
    // 4. store vectors to pinecone
}