import Results from '../components/Results';

export default function ResultsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Résultats</h1>
        <p className="text-text-secondary mt-1">
          Estimation de vos impôts et recommandations d'optimisation
        </p>
      </div>
      <Results />
    </div>
  );
}
