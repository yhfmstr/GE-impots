import { Link } from 'react-router-dom';
import { MessageSquare, FileText, Upload, Calculator, ArrowRight, CheckCircle, Sparkles, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TAX_YEAR } from '@/config/taxYear';
import { useMouseParallax, useScrollReveal } from '@/hooks/useParallax';

const deductionLimits = [
  { label: '3ème pilier A (avec LPP)', value: 'CHF 7\'056' },
  { label: 'Frais de garde par enfant', value: 'CHF 26\'080' },
  { label: 'Formation continue', value: 'CHF 12\'640' },
  { label: 'Assurance maladie (adulte)', value: 'CHF 16\'207' },
];

/**
 * Scroll-reveal wrapper component
 */
function RevealOnScroll({ children, className = '', delay = 0 }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Floating decorative shape with mouse parallax
 */
function FloatingShape({ className, intensity = 20 }) {
  const { ref, style } = useMouseParallax(intensity);
  return <div ref={ref} style={style} className={className} />;
}

export default function Home() {
  return (
    <div className="space-y-16 overflow-hidden">
      {/* Hero Section with Floating Elements */}
      <div className="min-h-[calc(100vh-12rem)] flex flex-col justify-center relative">
        {/* Floating Background Shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden animate-fade-in animation-delay-300">
          <FloatingShape
            intensity={30}
            className="absolute top-20 right-[10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl"
          />
          <FloatingShape
            intensity={40}
            className="absolute top-40 left-[5%] w-48 h-48 bg-warning/5 rounded-full blur-3xl"
          />
          <FloatingShape
            intensity={25}
            className="absolute bottom-20 right-[20%] w-56 h-56 bg-info/5 rounded-full blur-3xl"
          />
          <FloatingShape
            intensity={35}
            className="absolute bottom-40 left-[15%] w-40 h-40 bg-success/5 rounded-full blur-3xl"
          />

          {/* Subtle Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(var(--color-border) 1px, transparent 1px),
                linear-gradient(90deg, var(--color-border) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Hero Content - Staggered entrance animations */}
        <div className="relative z-10">
          <div className="animate-fade-in-up">
            <Badge variant="default" className="mb-4 md:mb-6 gap-2 w-fit">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Déclaration {TAX_YEAR}
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 animate-fade-in-up animation-delay-200">
            Déclaration d'impôts<br />
            <span className="text-primary">Canton de Genève</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-2xl mb-8 md:mb-10 animate-fade-in-up animation-delay-400">
            Simplifiez votre déclaration fiscale avec notre assistant intelligent.
            Optimisez vos déductions et évitez les erreurs.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in-up animation-delay-600">
            <Button asChild size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-3 md:py-4 group">
              <Link to="/declaration">
                Commencer ma déclaration
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-3 md:py-4">
              <Link to="/chat">
                <MessageSquare className="w-5 h-5 mr-2" />
                Poser une question
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll Indicator - positioned at bottom of hero */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-muted animate-fade-in-up-centered animation-delay-800">
          <span className="text-xs uppercase tracking-wider">Découvrir</span>
          <div className="w-6 h-10 border-2 border-border rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-text-muted rounded-full animate-bounce" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="space-y-8 relative">
        {/* Section Background Decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <FloatingShape
            intensity={50}
            className="absolute top-1/4 -left-32 w-64 h-64 bg-purple/5 rounded-full blur-3xl"
          />
          <FloatingShape
            intensity={45}
            className="absolute bottom-1/4 -right-32 w-72 h-72 bg-success/5 rounded-full blur-3xl"
          />
        </div>

        <RevealOnScroll>
          <div className="text-center max-w-2xl mx-auto relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Comment souhaitez-vous procéder?
            </h2>
            <p className="text-text-secondary">
              Choisissez l'approche qui correspond le mieux à votre situation
            </p>
          </div>
        </RevealOnScroll>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 relative z-10">

          {/* Featured Card - Déclaration Guidée (spans 2 columns on large) */}
          <RevealOnScroll delay={100} className="lg:col-span-2">
            <Link to="/wizard" className="block group h-full">
              <Card className="h-full bg-gradient-to-br from-warning-light to-card border-warning/30 hover:border-warning/60 hover:shadow-xl hover:shadow-warning/10 transition-all duration-300 overflow-hidden relative hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-warning/5 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <CardContent className="p-6 md:p-8 relative">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-warning/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Sparkles className="w-7 h-7 text-warning" />
                        </div>
                        <Badge className="bg-warning text-warning-foreground font-medium">
                          Recommandé
                        </Badge>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 group-hover:text-warning transition-colors">
                        Déclaration guidée
                      </h3>
                      <p className="text-text-secondary mb-4 md:mb-0 max-w-md">
                        Notre assistant vous guide étape par étape avec des questions simples adaptées à votre profil. Idéal pour les premières déclarations.
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-text-muted">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-medium">15-35 min</span>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center group-hover:bg-warning group-hover:scale-110 transition-all duration-300">
                        <ChevronRight className="w-6 h-6 text-warning group-hover:text-warning-foreground transition-colors" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </RevealOnScroll>

          {/* Déclaration Complète */}
          <RevealOnScroll delay={200}>
            <Link to="/declaration" className="block group h-full">
              <Card className="h-full bg-gradient-to-br from-success-light to-card border-success/20 hover:border-success/50 hover:shadow-lg hover:shadow-success/10 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-6 h-6 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-success transition-colors">
                    Déclaration complète
                  </h3>
                  <p className="text-text-secondary text-sm flex-1">
                    Accès direct à toutes les rubriques avec les codes GeTax officiels.
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-text-muted">Pour utilisateurs expérimentés</span>
                    <ChevronRight className="w-5 h-5 text-success/50 group-hover:text-success group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </RevealOnScroll>

          {/* Assistant Fiscal */}
          <RevealOnScroll delay={300}>
            <Link to="/chat" className="block group h-full">
              <Card className="h-full bg-gradient-to-br from-info-light to-card border-info/20 hover:border-info/50 hover:shadow-lg hover:shadow-info/10 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <MessageSquare className="w-6 h-6 text-info" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-info transition-colors">
                    Assistant fiscal
                  </h3>
                  <p className="text-text-secondary text-sm flex-1">
                    Posez vos questions à notre expert IA disponible 24/7.
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-text-muted">Réponses instantanées</span>
                    <ChevronRight className="w-5 h-5 text-info/50 group-hover:text-info group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </RevealOnScroll>

          {/* Documents */}
          <RevealOnScroll delay={400}>
            <Link to="/documents" className="block group h-full">
              <Card className="h-full bg-gradient-to-br from-purple-light to-card border-purple/20 hover:border-purple/50 hover:shadow-lg hover:shadow-purple/10 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-purple/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-6 h-6 text-purple" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-purple transition-colors">
                    Mes documents
                  </h3>
                  <p className="text-text-secondary text-sm flex-1">
                    Téléchargez vos justificatifs pour extraction automatique.
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-text-muted">OCR intelligent</span>
                    <ChevronRight className="w-5 h-5 text-purple/50 group-hover:text-purple group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </RevealOnScroll>

          {/* Estimation */}
          <RevealOnScroll delay={500}>
            <Link to="/results" className="block group h-full">
              <Card className="h-full bg-gradient-to-br from-primary-light to-card border-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Calculator className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    Estimation d'impôts
                  </h3>
                  <p className="text-text-secondary text-sm flex-1">
                    Calcul détaillé ICC et IFD avec transparence totale.
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-text-muted">Barèmes {TAX_YEAR}</span>
                    <ChevronRight className="w-5 h-5 text-primary/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </RevealOnScroll>

        </div>
      </section>

      {/* Quick Reference */}
      <RevealOnScroll>
        <Card className="bg-geneva-dark border-geneva-dark relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <CardContent className="p-8 text-white relative z-10">
            <h2 className="text-2xl font-bold mb-6">Limites de déductions {TAX_YEAR}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {deductionLimits.map((item, index) => (
                <RevealOnScroll key={item.label} delay={index * 100}>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-white/70">{item.label}:</span>
                    <span className="font-semibold ml-auto">{item.value}</span>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
            <p className="mt-6 text-sm text-white/50">
              Source: Guide de la déclaration d'impôts {TAX_YEAR} - Administration fiscale cantonale de Genève
            </p>
          </CardContent>
        </Card>
      </RevealOnScroll>

      {/* CTA */}
      <RevealOnScroll>
        <div className="text-center py-8">
          <p className="text-text-secondary mb-4">
            Besoin d'aide? Notre assistant fiscal est disponible 24/7
          </p>
          <Button asChild variant="link" className="group">
            <Link to="/chat">
              Discuter avec l'assistant
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </RevealOnScroll>
    </div>
  );
}
