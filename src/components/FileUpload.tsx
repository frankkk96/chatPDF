"use client";
import { uploadToS3 } from '@/lib/s3';
import { Axis3DIcon, Inbox, Loader2 } from 'lucide-react';
import React from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const FileUpload = () => {
    const [uploading, setUploading] = React.useState(false)
    const { mutate, isPending } = useMutation({
        mutationFn: async ({ fileKey, fileName }: { fileKey: string; fileName: string }) => {
            const response = await axios.post("/api/create-chat", { fileKey, fileName })
            return response.data
        }
    })

    const { getRootProps, getInputProps } = useDropzone({
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            console.log(acceptedFiles)
            const file = acceptedFiles[0]
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size exceeds 10MB')
                return
            }
            try {
                setUploading(true)
                const data = await uploadToS3(file)
                if (!data?.fileKey || !data.fileName) {
                    toast.error('Error uploading file')
                    return
                }
                mutate(data, {
                    onSuccess: (data) => {
                        toast.success(data.message)
                    },
                    onError: (error) => {
                        toast.error("Error creating chat")
                    }
                })
            } catch (error) {
                console.error(error)
            } finally {
                setUploading(false)
            }
        }
    })

    return (
        <div className='p-2 bg-white rounded-xl'>
            <div {...getRootProps({
                className: 'border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col'
            })}
            >
                <input {...getInputProps()} />
                {uploading || isPending ?
                    (<div>
                        <Loader2 className='w-10 h-10 text-blue-500 animate-spin' />
                        <p className='mt-2 text-sm text-slate-400'>
                            Spilling Tea to GPT ...
                        </p>
                    </div>) :
                    (<div>
                        <Inbox className='w-10 h10 text-blue-500 content-center' />
                        <p className='mt-2 text-sm text-slate-400'>drop file here</p>
                    </div>)}
            </div>
        </div>
    )
}

export default FileUpload