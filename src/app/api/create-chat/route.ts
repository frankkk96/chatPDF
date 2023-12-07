import { loadS3IntoPinecone } from "@/lib/pinecone"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@clerk/nextjs"
import { chats } from "@/lib/db/schema"
import { getS3Url } from "@/lib/s3"

// route to /api/create-chat
export async function POST(req: Request, res: Response) {
    const { userId } = await auth()
    if (!userId) {
        return NextResponse.json({error: "not authenticated"}, {status: 401})
    }
    try {
        const body = await req.json()
        const {fileKey, fileName} = body
        console.log(fileKey, fileName)
        await loadS3IntoPinecone(fileKey)
        const chatId = await db.insert(chats).values({
            fileKey: fileKey,
            pdfName: fileName,
            pdfUrl: getS3Url(fileKey),
            userId: userId,
        }).returning({
            insertedId: chats.id,
        })
        return NextResponse.json(
            { chatId: chatId[0].insertedId },
            { status: 200 }
        );
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: "internal server error" },
            { status: 500 }
        );
    }
}