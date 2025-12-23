import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Auth Callback Page
 * Handles OAuth callbacks and email verification links
 */
export default function AuthCallbackPage() {
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus('error');
      setError('Supabase is not configured');
      return;
    }

    const handleCallback = async () => {
      try {
        // Get the session from URL (Supabase handles this)
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          setStatus('success');
          // Small delay to show success message
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        } else {
          // No session means the callback might have failed
          setStatus('error');
          setError('La vérification a échoué. Le lien est peut-être expiré.');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setError(err.message || 'Une erreur est survenue');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'processing' && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <CardTitle>Vérification en cours...</CardTitle>
              <CardDescription>
                Veuillez patienter pendant que nous vérifions votre compte.
              </CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Email vérifié !</CardTitle>
              <CardDescription>
                Votre compte a été activé. Redirection en cours...
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Erreur de vérification</CardTitle>
              <CardDescription>{error}</CardDescription>
            </>
          )}
        </CardHeader>

        {status === 'error' && (
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => navigate('/login')} className="w-full">
              Retour à la connexion
            </Button>
            <Button onClick={() => navigate('/signup')} variant="outline" className="w-full">
              Créer un nouveau compte
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
