import React, { forwardRef, useState } from 'react';
import { Upload } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface FileUploadProps {
  sessionToken: string;
  onUploadSuccess: () => void;
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ sessionToken, onUploadSuccess }, ref) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setUploadStatus('Uploading...');

      const formData = new FormData();
      formData.append('session_token', sessionToken);
      formData.append('file', file);

      try {
        const response = await fetch(`${API_BASE}/upload-and-embed`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          setUploadStatus('Upload successful!');
          onUploadSuccess();
          setTimeout(() => setUploadStatus(''), 3000);
        } else {
          setUploadStatus(data.message || 'Upload failed');
          setTimeout(() => setUploadStatus(''), 5000);
        }
      } catch (error) {
        setUploadStatus('Upload failed');
        setTimeout(() => setUploadStatus(''), 5000);
      } finally {
        setIsUploading(false);
        event.target.value = '';
      }
    };

    return (
      <div className="relative">
        <input
          ref={ref}
          type="file"
          accept=".pdf,.docx,.ppt,.pptx"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        
        <button
          onClick={() => (ref as React.RefObject<HTMLInputElement>)?.current?.click()}
          disabled={isUploading}
          className="p-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
          title="Upload document"
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </button>

        {uploadStatus && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap">
            {uploadStatus}
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

export default FileUpload;