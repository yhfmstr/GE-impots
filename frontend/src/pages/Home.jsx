import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MessageSquare, FileText, Upload, Calculator, ArrowRight, CheckCircle, Sparkles, Clock, ChevronRight, AlertTriangle, Users, FileCheck, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TAX_YEAR } from '@/config/taxYear';
import { useMouseParallax, useScrollReveal, useAnimatedCounter } from '@/hooks/useParallax';
import Lottie from 'lottie-react';

const deductionLimits = [
  { label: '3ème pilier A (avec LPP)', value: 'CHF 7\'056' },
  { label: 'Frais de garde par enfant', value: 'CHF 26\'080' },
  { label: 'Formation continue', value: 'CHF 12\'640' },
  { label: 'Assurance maladie (adulte)', value: 'CHF 16\'207' },
];

// Deadline: 31 March of the year after TAX_YEAR (e.g., for 2024 taxes, deadline is 31 March 2025)
// Using 2026 since current date is December 2025
const DEADLINE = new Date('2026-03-31T23:59:59');

// Simple Lottie animation data (document/tax illustration)
const documentAnimation = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  assets: [],
  layers: [{
    ddd: 0,
    ind: 1,
    ty: 4,
    nm: "Document",
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 1, k: [{ i: { x: [0.67], y: [1] }, o: { x: [0.33], y: [0] }, t: 0, s: [-3] }, { i: { x: [0.67], y: [1] }, o: { x: [0.33], y: [0] }, t: 30, s: [3] }, { t: 60, s: [-3] }] },
      p: { a: 0, k: [100, 100, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] }
    },
    shapes: [
      { ty: "rc", d: 1, s: { a: 0, k: [60, 80] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 4 }, nm: "Rect" },
      { ty: "fl", c: { a: 0, k: [0.84, 0.27, 0.31, 1] }, o: { a: 0, k: 100 }, nm: "Fill" }
    ]
  }]
};

const checkAnimation = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  assets: [],
  layers: [{
    ddd: 0,
    ind: 1,
    ty: 4,
    nm: "Check",
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [100, 100, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 1, k: [{ i: { x: [0.67, 0.67, 0.67], y: [1, 1, 1] }, o: { x: [0.33, 0.33, 0.33], y: [0, 0, 0] }, t: 0, s: [95, 95, 100] }, { i: { x: [0.67, 0.67, 0.67], y: [1, 1, 1] }, o: { x: [0.33, 0.33, 0.33], y: [0, 0, 0] }, t: 30, s: [105, 105, 100] }, { t: 60, s: [95, 95, 100] }] }
    },
    shapes: [
      { ty: "el", d: 1, s: { a: 0, k: [60, 60] }, p: { a: 0, k: [0, 0] }, nm: "Circle" },
      { ty: "fl", c: { a: 0, k: [0.42, 0.61, 0.48, 1] }, o: { a: 0, k: 100 }, nm: "Fill" }
    ]
  }]
};

/**
 * Deadline countdown banner with urgency styling
 */
function DeadlineBanner() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = DEADLINE - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        setTimeLeft({ days, hours, minutes });
        setIsUrgent(days < 30);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const urgencyClass = isUrgent
    ? 'bg-gradient-to-r from-primary/20 via-warning-light to-primary/20 border-primary/50 animate-pulse-glow'
    : 'bg-gradient-to-r from-info-light to-card border-info/30';

  return (
    <div className={`rounded-xl border p-4 mb-8 ${urgencyClass} animate-fade-in`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isUrgent ? (
            <AlertTriangle className="w-6 h-6 text-primary animate-pulse" />
          ) : (
            <Clock className="w-6 h-6 text-info" />
          )}
          <div>
            <p className={`font-semibold ${isUrgent ? 'text-primary' : 'text-foreground'}`}>
              {isUrgent ? 'Délai approchant!' : 'Délai de dépôt'}
            </p>
            <p className="text-sm text-text-secondary">31 mars 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="text-center px-3 py-2 bg-card rounded-lg border border-border">
              <span className="text-2xl font-bold text-foreground counter-number">{timeLeft.days}</span>
              <p className="text-xs text-text-muted">jours</p>
            </div>
            <div className="text-center px-3 py-2 bg-card rounded-lg border border-border">
              <span className="text-2xl font-bold text-foreground counter-number">{timeLeft.hours}</span>
              <p className="text-xs text-text-muted">heures</p>
            </div>
            <div className="text-center px-3 py-2 bg-card rounded-lg border border-border">
              <span className="text-2xl font-bold text-foreground counter-number">{timeLeft.minutes}</span>
              <p className="text-xs text-text-muted">min</p>
            </div>
          </div>

          <Button asChild size="sm" variant={isUrgent ? 'default' : 'secondary'}>
            <Link to="/declaration">Commencer</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Animated statistic counter
 */
function StatCounter({ target, suffix = '', label, icon: Icon, delay = 0 }) {
  const { ref, count, isComplete } = useAnimatedCounter(target, 2000);

  return (
    <div
      ref={ref}
      className="text-center p-6 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-foreground counter-number">
        {count.toLocaleString('fr-CH')}{suffix}
      </div>
      <p className="text-sm text-text-secondary mt-1">{label}</p>
    </div>
  );
}

/**
 * How it works step component
 */
function HowItWorksStep({ number, title, description, icon: Icon, isLast = false, delay = 0 }) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className="relative flex flex-col items-center text-center"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.6s ease-out ${delay}ms`,
      }}
    >
      {/* Connector line */}
      {!isLast && (
        <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
      )}

      {/* Step number badge */}
      <div className="relative mb-4">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-light to-card border border-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
          <Icon className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">
          {number}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-[200px]">{description}</p>
    </div>
  );
}

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

/**
 * Hero image with mouse parallax effect
 */
function HeroImage() {
  const { ref, style } = useMouseParallax(15);

  return (
    <div className="flex-1 lg:max-w-[45%] relative animate-fade-in animation-delay-300">
      {/* Image with parallax */}
      <div ref={ref} style={style} className="relative">
        <img
          src="/images/hero.png"
          alt="Illustration déclaration fiscale"
          className="w-full h-auto max-w-md lg:max-w-xl mx-auto drop-shadow-2xl"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="space-y-16 overflow-hidden">
      {/* Hero Section with Floating Elements */}
      <div className="min-h-[calc(100vh-12rem)] flex flex-col justify-center relative">
        {/* Hero Gradient Glow - Full bleed to screen edge */}
        <div
          className="fixed top-0 right-0 w-[60vw] h-[80vh] pointer-events-none animate-fade-in"
          style={{
            background: 'radial-gradient(ellipse at 70% 30%, rgba(214, 69, 80, 0.25) 0%, rgba(196, 151, 58, 0.15) 40%, transparent 70%)',
            filter: 'blur(60px)',
            zIndex: 0,
          }}
        />

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

        {/* Hero Content - Two column layout with image */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Text Content */}
          <div className="flex-1 lg:max-w-[55%]">
            <div className="animate-fade-in-up">
              <Badge variant="default" className="mb-4 md:mb-6 gap-2 w-fit">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Déclaration {TAX_YEAR}
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 animate-fade-in-up animation-delay-200">
              Déclaration d'impôts<br />
              <span className="text-gradient">Canton de Genève</span>
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

          {/* Hero Image - Right side with parallax effect */}
          <HeroImage />
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

      {/* Deadline Countdown Banner - Strategic placement after features */}
      <RevealOnScroll>
        <DeadlineBanner />
      </RevealOnScroll>

      {/* Statistics Section with Animated Counters */}
      <section className="py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <RevealOnScroll>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Utilisé par des milliers de Genevois
            </h2>
            <p className="text-text-secondary">
              Rejoignez notre communauté de contribuables satisfaits
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative z-10">
          <StatCounter target={2500} suffix="+" label="Déclarations" icon={FileCheck} delay={0} />
          <StatCounter target={4200} suffix="+" label="Utilisateurs" icon={Users} delay={100} />
          <StatCounter target={98} suffix="%" label="Satisfaction" icon={TrendingUp} delay={200} />
          <StatCounter target={15} label="Minutes en moyenne" icon={Clock} delay={300} />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 relative">
        <FloatingShape
          intensity={35}
          className="absolute top-1/2 left-[5%] w-48 h-48 bg-info/5 rounded-full blur-3xl"
        />
        <FloatingShape
          intensity={40}
          className="absolute bottom-1/4 right-[10%] w-56 h-56 bg-warning/5 rounded-full blur-3xl"
        />

        <RevealOnScroll>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Comment ça fonctionne?
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Trois étapes simples pour compléter votre déclaration fiscale en toute sérénité
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative z-10">
          <HowItWorksStep
            number={1}
            title="Téléchargez vos documents"
            description="Importez vos certificats de salaire et autres justificatifs. L'IA extrait automatiquement les données."
            icon={Upload}
            delay={0}
          />
          <HowItWorksStep
            number={2}
            title="Répondez aux questions"
            description="Notre assistant vous guide avec des questions adaptées à votre situation personnelle."
            icon={MessageSquare}
            delay={150}
          />
          <HowItWorksStep
            number={3}
            title="Obtenez votre estimation"
            description="Calculez vos impôts ICC et IFD avec transparence totale sur les déductions appliquées."
            icon={Calculator}
            delay={300}
            isLast
          />
        </div>

        {/* Lottie animation illustration */}
        <div className="flex justify-center mt-8 opacity-60">
          <div className="w-32 h-32">
            <Lottie animationData={documentAnimation} loop={true} />
          </div>
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
