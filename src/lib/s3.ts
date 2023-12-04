import AWS from "aws-sdk"

function hashFileName(fileName: string) {
    const extension = fileName.split(".").pop()
    const hash = fileName.split("").reduce((acc, char) => {
        acc = (acc << 5) - acc + char.charCodeAt(0)
        return acc & acc
    }, 0)
    return `${hash}.${extension}`
}

export async function uploadToS3(file: File) {
    try {
        AWS.config.update({
            accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
        })
        const s3 = new AWS.S3({
            params: {
                Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME
            },
            region: process.env.NEXT_PUBLIC_S3_BUCKET_REGION
        })
        const fileKey = `uploads/${Date.now().toString()}-${hashFileName(file.name)}`
        const params = {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key: fileKey,
            Body: file,
        }
        const upload = s3.putObject(params).on('httpUploadProgress', function (evt) {  
            console.log('uploading to s3 ...', parseInt(((evt.loaded * 100) / evt.total).toString(), 10), '%');
        }).promise()

        await upload.then(data => {
            console.log('upload successful: ', fileKey)
        })

        return Promise.resolve({
            fileKey,
            fileName: file.name,
        })
    } catch {
        
    }
}

export function getS3Url(fileKey: string){
    const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_S3_BUCKET_REGION}.amazonaws.com/${fileKey}`
    return url
}