import Results from '../components/Results';

export default function ResultsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Résultats</h1>
        <p className="text-gray-600 mt-1">
          Estimation de vos impôts et recommandations d'optimisation
        </p>
      </div>
      <Results />
    </div>
  );
}
