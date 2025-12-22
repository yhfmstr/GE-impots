import { Link } from 'react-router-dom';
import { MessageSquare, FileText, Upload, Calculator, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TAX_YEAR } from '@/config/taxYear';

const features = [
  {
    icon: Sparkles,
    title: 'Déclaration guidée',
    description: 'Mode simplifié adapté à votre profil (15-35 min)',
    link: '/wizard',
    color: 'amber',
    isNew: true
  },
  {
    icon: FileText,
    title: 'Déclaration complète',
    description: 'Toutes les rubriques avec les codes GeTax',
    link: '/declaration',
    color: 'green'
  },
  {
    icon: MessageSquare,
    title: 'Assistant fiscal',
    description: 'Posez vos questions à notre expert IA',
    link: '/chat',
    color: 'blue'
  },
  {
    icon: Upload,
    title: 'Mes documents',
    description: 'Extraction automatique depuis vos justificatifs',
    link: '/documents',
    color: 'purple'
  },
  {
    icon: Calculator,
    title: 'Estimation d\'impôts',
    description: `Calcul détaillé ICC et IFD ${TAX_YEAR}`,
    link: '/results',
    color: 'red'
  }
];

const deductionLimits = [
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
        <Badge variant="default" className="mb-6 gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Déclaration {TAX_YEAR}
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Déclaration d'impôts<br />
          <span className="text-red-600">Canton de Genève</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Simplifiez votre déclaration fiscale avec notre assistant intelligent.
          Optimisez vos déductions et évitez les erreurs.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/declaration">
              Commencer ma déclaration
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/chat">
              <MessageSquare className="w-5 h-5" />
              Poser une question
            </Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link key={feature.title} to={feature.link}>
            <Card className={`h-full hover:border-gray-300 hover:shadow-lg transition-all group ${
              feature.isNew ? 'ring-2 ring-amber-300 ring-offset-2' : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    feature.color === 'blue' ? 'bg-blue-100' :
                    feature.color === 'green' ? 'bg-green-100' :
                    feature.color === 'purple' ? 'bg-purple-100' :
                    feature.color === 'amber' ? 'bg-amber-100' :
                    'bg-red-100'
                  }`}>
                    <feature.icon className={`w-6 h-6 ${
                      feature.color === 'blue' ? 'text-blue-600' :
                      feature.color === 'green' ? 'text-green-600' :
                      feature.color === 'purple' ? 'text-purple-600' :
                      feature.color === 'amber' ? 'text-amber-600' :
                      'text-red-600'
                    }`} />
                  </div>
                  {feature.isNew && (
                    <Badge className="bg-amber-500 hover:bg-amber-600">Nouveau</Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Reference */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">Limites de déductions {TAX_YEAR}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {deductionLimits.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-gray-300">{item.label}:</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-400">
            Source: Guide de la déclaration d'impôts {TAX_YEAR} - Administration fiscale cantonale de Genève
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">
          Besoin d'aide? Notre assistant fiscal est disponible 24/7
        </p>
        <Button asChild variant="link">
          <Link to="/chat">
            Discuter avec l'assistant
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
