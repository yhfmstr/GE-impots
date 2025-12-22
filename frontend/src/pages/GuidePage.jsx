import { useState, useEffect, useRef } from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import { loadSecure, STORAGE_KEYS, validateTaxData } from '@/lib/storage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TAX_YEAR } from '@/config/taxYear';
import { GETAX_PAGES } from '@/config/getax-annexes';
import { AnnexeSelector, DocumentUpload, RubriquesList, QuickChat } from '@/components/guide';

export default function GuidePage() {
  const [selectedPage, setSelectedPage] = useState(GETAX_PAGES[0]);
  const [userData, setUserData] = useState({});
  const [hasData, setHasData] = useState(false);
  const [uploadedDocTypes, setUploadedDocTypes] = useState([]);
  const uploadRef = useRef(null);

  // Load data from localStorage with validation
  useEffect(() => {
    try {
      const saved = loadSecure(STORAGE_KEYS.TAX_DATA, {});
      const validated = validateTaxData(saved);
      if (Object.keys(validated).length > 0) {
        setUserData(validated);
        setHasData(true);
      }
      // Load uploaded document types
      const extractions = loadSecure(STORAGE_KEYS.EXTRACTIONS, []);
      const docTypes = [...new Set(extractions.map(e => e.documentType))];
      setUploadedDocTypes(docTypes);
    } catch {
      // Fallback to empty state on error
      setUserData({});
      setHasData(false);
    }
  }, []);

  // Handle data extraction from upload
  const handleDataExtracted = (mergedData) => {
    setUserData(mergedData);
    setHasData(true);
  };

  // Handle document type uploaded
  const handleDocTypeUploaded = (docType) => {
    setUploadedDocTypes(prev => [...new Set([...prev, docType])]);
  };

  // Scroll to and open upload section
  const handleOpenUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-7 h-7 text-red-600" />
          Déclaration d'impôts {TAX_YEAR}
        </h1>
        <p className="text-gray-600 mt-1">
          Suivez ce guide rubrique par rubrique et importez vos documents
        </p>
      </div>

      {/* No data warning */}
      {!hasData && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            <strong className="block mb-1">Commencez par importer vos documents</strong>
            Téléchargez vos certificats et attestations pour remplir automatiquement les rubriques.
          </AlertDescription>
        </Alert>
      )}

      {/* Page Selector */}
      <AnnexeSelector
        selectedPage={selectedPage}
        onSelectPage={setSelectedPage}
        uploadedDocTypes={uploadedDocTypes}
        onOpenUpload={handleOpenUpload}
      />

      {/* Document Upload Section */}
      <div ref={uploadRef}>
        <DocumentUpload
          selectedPage={selectedPage}
          onDataExtracted={handleDataExtracted}
          onDocTypeUploaded={handleDocTypeUploaded}
        />
      </div>

      {/* Fields List */}
      <RubriquesList selectedPage={selectedPage} userData={userData} />

      {/* Quick Chat */}
      <QuickChat selectedPage={selectedPage} />

      {/* Tips */}
      <Alert variant="info" className="mt-6">
        <AlertDescription>
          <strong className="block mb-1">Conseil</strong>
          Ouvrez GeTax dans un autre onglet et suivez ce guide rubrique par rubrique.
          Cliquez sur l'icône de copie pour copier la valeur et la coller directement dans GeTax.
        </AlertDescription>
      </Alert>
    </div>
  );
}
