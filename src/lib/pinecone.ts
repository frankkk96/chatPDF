import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { Document, RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter' 
import { getEmbeddings } from "./embeddings";
import md5 from 'md5'
import { convertToAscii } from "./utils";

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

type PDFPage = {
    pageContent: string;
    metadata: {
        loc: {pageNumber: number}
    }
}

export async function loadS3IntoPinecone(fileKey: string) {
    // 1. obtain the pdf
    console.log("downloading s3 into file system")
    const fileName = await downloadFromS3(fileKey)
    if (!fileName) {
        throw new Error("could not download file from s3")
    }
    const loader = new PDFLoader(fileName)
    const pages = (await loader.load()) as PDFPage[]
    // 2. split and segment pdf
    const documents = await Promise.all(pages.map(page => prepareDocument(page)))
    // 3. vectorise and embed segments
    const vectors = await Promise.all(documents.flat().map(doc => embeddingDocument(doc)))
    // 4. store vectors to pinecone
    const client = await getPineconeClient()
    const pineconeIndex = client.Index('chatpdf')

    console.log('inserting vectors into pinecone')
    const namespace = convertToAscii(fileKey)
    const ns1 = pineconeIndex.namespace(namespace)
    await ns1.upsert(vectors)

    return documents[0]
}

async function embeddingDocument(doc: Document) {
    try {
        const embeddings = await getEmbeddings(doc.pageContent)
        const hash = md5(doc.pageContent)
        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber
            }
        } as PineconeRecord
    } catch (error) {
        console.error('error getting embeddings', error)
        throw error
    }
}

export const truncateStringByBytes = (str: string, byte: number) => {
    const enc = new TextEncoder()
    return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, byte))
}

async function prepareDocument(page: PDFPage) {
    let {pageContent, metadata} = page
    pageContent = pageContent.replace(/\n/g, ' ')
    // split
    const splitter = new RecursiveCharacterTextSplitter()
    const docs = await splitter.splitDocuments([
        new Document({
            pageContent,
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000)
            }
        })
    ])
    return docs
}