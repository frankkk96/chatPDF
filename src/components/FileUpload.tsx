'use client';
import { Inbox } from 'lucide-react';
import React from 'react'
import { useDropzone } from 'react-dropzone'

const FileUpload = () => {
    const {getRootProps, getInputProps} = useDropzone({
        accept: {'application/pdf': ['.pdf']},
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            console.log(acceptedFiles)
        }
    })
    return (
        <div className='p-2 bg-white rounded-xl'>
            <div {...getRootProps({
                className: 'border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col'
                })}
            >
                <input {...getInputProps()}/>
                <div>
                    <Inbox className='w-10 h10 text-blue-500 content-center'/>
                    <p className='mt-2 text-sm text-slate-400'>drop file here</p>
                </div>
            </div>
        </div>
    )
}

export default FileUpload