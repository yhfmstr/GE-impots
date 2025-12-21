import FileUpload from '../components/FileUpload';

export default function DocumentsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-1">
          Téléchargez vos justificatifs (certificats de salaire, relevés bancaires, etc.)
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <FileUpload />
      </div>
    </div>
  );
}
