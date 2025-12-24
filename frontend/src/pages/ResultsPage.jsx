import Results from '../components/Results';

export default function ResultsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Résultats</h1>
        <p className="text-muted-foreground">
          Estimation de vos impôts et recommandations d'optimisation
        </p>
      </div>
      <Results />
    </div>
  );
}
