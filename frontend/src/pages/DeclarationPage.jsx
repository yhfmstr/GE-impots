import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Questionnaire from '../components/Questionnaire';
import { CheckCircle } from 'lucide-react';

export default function DeclarationPage() {
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  const handleComplete = (data) => {
    setCompleted(true);
    // Redirect to results after a short delay
    setTimeout(() => {
      navigate('/results');
    }, 2000);
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Questionnaire terminé!</h2>
        <p className="mt-2 text-gray-600">Redirection vers les résultats...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Déclaration d'impôts 2024</h1>
        <p className="text-gray-600 mt-1">
          Complétez les informations section par section
        </p>
      </div>
      <Questionnaire onComplete={handleComplete} />
    </div>
  );
}
