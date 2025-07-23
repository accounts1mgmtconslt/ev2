
import React, { useState, useCallback } from 'react';
import { UploadIcon, FileIcon } from './icons/Icon';

interface FileUploadProps {
  onFileUploaded: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (selectedFile: File | undefined | null) => {
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        onFileUploaded(selectedFile);
      } else {
        setError('Invalid file type. Please upload a .csv file.');
        setFile(null);
      }
    }
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFileChange(event.dataTransfer.files[0]);
    }
  }, [onFileUploaded]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
        <div 
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            className={`mt-1 flex justify-center px-6 pt-10 pb-12 border-2 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'} border-dashed rounded-xl transition-colors duration-200`}
        >
            <div className="space-y-4 text-center">
                {file ? <FileIcon /> : <UploadIcon />}
                <div className="flex text-sm text-slate-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={(e) => handleFileChange(e.target.files?.[0])} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500">CSV files up to 10MB</p>
                {file && <p className="text-sm font-medium text-green-600">File selected: {file.name}</p>}
                {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            </div>
        </div>
    </div>
  );
};

export default FileUpload;
