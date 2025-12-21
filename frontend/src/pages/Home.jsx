import { Link } from 'react-router-dom';
import { MessageSquare, FileText, Upload, Calculator, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Déclaration pas à pas',
    description: 'Suivez le guide avec les codes GeTax et importez vos documents',
    link: '/declaration',
    color: 'green'
  },
  {
    icon: MessageSquare,
    title: 'Assistant fiscal',
    description: 'Posez vos questions à notre expert alimenté par IA',
    link: '/chat',
    color: 'blue'
  },
  {
    icon: Upload,
    title: 'Mes documents',
    description: 'Consultez l\'historique de vos documents importés',
    link: '/documents',
    color: 'purple'
  },
  {
    icon: Calculator,
    title: 'Estimation d\'impôts',
    description: 'Calculez vos impôts ICC et IFD 2024',
    link: '/results',
    color: 'red'
  }
];

const limits2024 = [
  { label: '3ème pilier A (avec LPP)', value: 'CHF 7\'056' },
  { label: 'Frais de garde par enfant', value: 'CHF 26\'080' },
  { label: 'Formation continue', value: 'CHF 12\'640' },
  { label: 'Assurance maladie (adulte)', value: 'CHF 16\'207' },
];

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Déclaration 2024
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Déclaration d'impôts<br />
          <span className="text-red-600">Canton de Genève</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Simplifiez votre déclaration fiscale avec notre assistant intelligent.
          Optimisez vos déductions et évitez les erreurs.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/declaration"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            Commencer ma déclaration
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/chat"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Poser une question
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.title}
            to={feature.link}
            className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
              feature.color === 'blue' ? 'bg-blue-100' :
              feature.color === 'green' ? 'bg-green-100' :
              feature.color === 'purple' ? 'bg-purple-100' :
              'bg-red-100'
            }`}>
              <feature.icon className={`w-6 h-6 ${
                feature.color === 'blue' ? 'text-blue-600' :
                feature.color === 'green' ? 'text-green-600' :
                feature.color === 'purple' ? 'text-purple-600' :
                'text-red-600'
              }`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
              {feature.title}
            </h3>
            <p className="mt-2 text-gray-600">{feature.description}</p>
          </Link>
        ))}
      </div>

      {/* Quick Reference */}
      <div className="bg-gray-900 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-6">Limites de déductions 2024</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {limits2024.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">{item.label}:</span>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-gray-400">
          Source: Guide de la déclaration d'impôts 2024 - Administration fiscale cantonale de Genève
        </p>
      </div>

      {/* CTA */}
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">
          Besoin d'aide? Notre assistant fiscal est disponible 24/7
        </p>
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 text-red-600 font-medium hover:text-red-700"
        >
          Discuter avec l'assistant
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
