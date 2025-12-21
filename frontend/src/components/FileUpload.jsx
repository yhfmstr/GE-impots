import { useState, useCallback } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadApi } from '@/lib/api';

const CATEGORIES = [
  { id: 'certificats-salaire', name: 'Certificats de salaire', icon: '📄' },
  { id: 'releves-bancaires', name: 'Relevés bancaires', icon: '🏦' },
  { id: 'attestations-3a', name: 'Attestations 3a', icon: '🏛️' },
  { id: 'autres', name: 'Autres documents', icon: '📎' },
];

export default function FileUpload() {
  const [selectedCategory, setSelectedCategory] = useState('certificats-salaire');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const uploadFile = useCallback(async (file) => {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', selectedCategory);

    try {
      const response = await uploadApi.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadedFiles(prev => [...prev, {
        ...response.data,
        id: Date.now(),
        status: 'success'
      }]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur lors du téléchargement';
      setError(errorMsg);
      setUploadedFiles(prev => [...prev, {
        originalName: file.name,
        id: Date.now(),
        status: 'error',
        error: errorMsg
      }]);
    } finally {
      setUploading(false);
    }
  }, [selectedCategory]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, [uploadFile]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedCategory === cat.id
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">{cat.icon}</span>
            <p className="mt-2 text-sm font-medium text-gray-900">{cat.name}</p>
          </button>
        ))}
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          onChange={handleFileSelect}
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />

        <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-red-500' : 'text-gray-400'}`} />
        <p className="text-lg font-medium text-gray-900">
          {uploading ? 'Téléchargement en cours...' : 'Glissez vos fichiers ici'}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          ou cliquez pour sélectionner (PDF, JPEG, PNG, max 10MB)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Documents téléchargés</h3>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                file.status === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {file.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{file.originalName}</p>
                  <p className="text-sm text-gray-500">
                    {file.status === 'success'
                      ? `Catégorie: ${CATEGORIES.find(c => c.id === file.category)?.name}`
                      : file.error}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
