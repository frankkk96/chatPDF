import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";

let pinecone: Pinecone | null = null;

// 为什么这里直接从pinecone导入会有问题，需要重新写这个函数
// FIXME
export const getPineconeClient = async () => {
    if (!pinecone) {
        pinecone = new Pinecone({
            environment: process.env.PINECONE_ENVIRONMENT!,
            apiKey: process.env.PINECONE_API_KEY!,
        })
    }
    return pinecone
}

export async function getMatchesFromEmbeddings(embeddings: number[], fileKey: string){
    const pinecone = await getPineconeClient()
    const index = pinecone.Index('chatpdf')
    
    try {
        const namespace = convertToAscii(fileKey)
        const ns1 = index.namespace(namespace)
        const queryResult = await ns1.query({
            topK: 5,
            vector: embeddings,
            includeMetadata: true
        })
        return queryResult.matches || []
    } catch (error) {
        console.log('error querying embeddings', error)
        throw error
    }
}

export async function getContext(query: string, fileKey: string) {
    const queryEmbeddings = await getEmbeddings(query)
    const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey)
    
    const qualifyingDocs = matches.filter(
        (match) => match.score && match.score > 0.7
    )

    type Metadata = {
        text: string,
        pageNumber: number,
    }

    let docs = qualifyingDocs.map(match => (match.metadata as Metadata).text)
    return docs.join('\n').substring(0, 3000)
}