import { GetObjectCommandOutput, S3 } from '@aws-sdk/client-s3';
import fs from 'fs'

export async function downloadFromS3(fileKey: string) {
    const s3 = new S3({
        region: process.env.NEXT_PUBLIC_S3_BUCKET_REGION,
        credentials: {
            accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
        },
    })
    const params = {
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
        Key: fileKey,
    }
    const fileKeyPure = fileKey.split("/").pop()
    let obj: GetObjectCommandOutput | null = null;
    try {
        obj = await s3.getObject(params)
    } catch (error) {
        console.log("error downloading from s3")
        console.error(error)
        return null
    }
    if (!fs.existsSync('/tmp/pdf')){
        fs.mkdirSync('/tmp/pdf')
    }
    const fileName = `/tmp/pdf/${fileKeyPure}`
    console.log("writing to file system", fileName)

    try {
        if (obj) {
            const file = fs.createWriteStream(fileName)
            // 第三版代码，会在pipe写完之前就返回了
            // @ts-ignore
            // await obj.Body.pipe(file)
            //     .on('finish', () => {
            //         console.log("wrote to file system", fileName);
            //     })
            //     .on('error', () => {
            //         throw new Error("error writing to file system")
            //     });
            // return fileName

            // 第二版代码，最好用
            await new Promise((resolve, reject) => {
                // @ts-ignore
                obj.Body?.pipe(file)
                    .on('finish', () => {
                        console.log("wrote to file system", fileName)
                        resolve(fileName)
                    })
                    .on('error', () => {
                        reject
                        throw new Error("error writing to file system")
                    });
            });
            return fileName

            // 第一版代码，会在pipe写完之前就返回了，原仓库中会包一个resolve，但没有捕捉好错误
            // file.on("open", function (fd) {
            //     // @ts-ignore
            //     obj.Body?.pipe(file).on("finish", () => {
            //         console.log("wrote to file system", fileName)
            //         return fileName
            //     })
            // }) 
        } else {
            throw new Error("null object")
        }
    } catch (error) {
        console.log("error writing to file system")
        console.error(error)
        return null
    }
}