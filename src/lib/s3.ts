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

export async function uploadToS3(file: File) {
    const s3 = new S3({
        region: process.env.S3_BUCKET_REGION,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
    })
    const fileKey = `uploads/${Date.now().toString()}-${hashFileName(file.name)}`
    const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: fileKey,
        Body: file,
    }
    try {
        await s3.putObject(params)
        toast.success(`File uploaded successfully. ${fileKey}`)
        return {
            fileKey,
            fileName: file.name,
        }
    } catch (err) {
        toast.error(`Error uploading file. ${err}`)
    }
}

export function getS3Url(fileKey: string){
    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_BUCKET_REGION}.amazonaws.com/${fileKey}`
    return url
}