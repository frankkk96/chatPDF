import { PutObjectCommandOutput, S3 } from '@aws-sdk/client-s3';
import toast from 'react-hot-toast';

function hashFileName(fileName: string) {
    const extension = fileName.split(".").pop()
    const hash = fileName.split("").reduce((acc, char) => {
        acc = (acc << 5) - acc + char.charCodeAt(0)
        return acc & acc
    }, 0)
    return `${hash}.${extension}`
}

export async function uploadToS3(file: File): Promise<{ fileKey: string; fileName: string }> {
    return new Promise((resolve, reject) => {
        try {
            const s3 = new S3({
                region: process.env.NEXT_PUBLIC_S3_BUCKET_REGION,
                credentials: {
                    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
                },
            })

            const fileKey = `uploads/${Date.now().toString()}-${hashFileName(file.name)}`
            const params = {
                Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
                Key: fileKey,
                Body: file,
            }
            s3.putObject(
                params,
                (err: any, data: PutObjectCommandOutput | undefined) => {
                    return resolve({
                        fileKey,
                        fileName: file.name,
                    })
                }
            )
            toast.success(`File uploaded successfully. ${fileKey}`)
        } catch (error) {
            toast.error(`Error uploading file. ${error}`)
            reject(error)
        }
    })
}

export function getS3Url(fileKey: string){
    const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_S3_BUCKET_REGION}.amazonaws.com/${fileKey}`
    return url
}