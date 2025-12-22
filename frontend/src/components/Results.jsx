import { useState, useEffect } from 'react';
import { Calculator, TrendingDown, AlertTriangle, CheckCircle, Download, RotateCcw, Archive, ChevronUp, ChevronDown, Trash2, FileText, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadSecure, saveSecure, STORAGE_KEYS, exportData } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TAX_YEAR, getExportFilename } from '@/config/taxYear';
import { calculateTaxWithSteps } from '@/lib/taxCalculator';
import TaxBreakdown from '@/components/TaxBreakdown';

export default function Results() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taxEstimate, setTaxEstimate] = useState(null);
  const [calculationSteps, setCalculationSteps] = useState([]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [archives, setArchives] = useState([]);
  const [showArchives, setShowArchives] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    loadArchives();
  }, []);

  const loadData = () => {
    try {
      const parsedData = loadSecure(STORAGE_KEYS.TAX_DATA, null);
      if (parsedData) {
        setData(parsedData);
        if (parsedData.grossSalary) {
          calculateTax(parsedData);
        }
      }
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  };

  const loadArchives = () => {
    try {
      const saved = loadSecure(STORAGE_KEYS.ARCHIVES, []);
      setArchives(Array.isArray(saved) ? saved : []);
    } catch {
      setArchives([]);
    }
  };

  const restoreArchive = (archive) => {
    try {
      const currentData = loadSecure(STORAGE_KEYS.TAX_DATA, null);
      if (currentData) {
        const newArchive = {
          id: Date.now(),
          date: new Date().toISOString(),
          data: currentData
        };
        const existingArchives = loadSecure(STORAGE_KEYS.ARCHIVES, []);
        existingArchives.unshift(newArchive);
        const limitedArchives = existingArchives.slice(0, 5);
        saveSecure(STORAGE_KEYS.ARCHIVES, limitedArchives);
      }

      saveSecure(STORAGE_KEYS.TAX_DATA, archive.data);
      setData(archive.data);
      if (archive.data.grossSalary) {
        calculateTax(archive.data);
      }
      loadArchives();
    } catch {
      // Silently handle errors
    }
  };

  const deleteArchive = (id) => {
    const updated = archives.filter(a => a.id !== id);
    saveSecure(STORAGE_KEYS.ARCHIVES, updated);
    setArchives(updated);
  };

  const handleReset = () => {
    try {
      const currentData = loadSecure(STORAGE_KEYS.TAX_DATA, null);
      if (currentData) {
        const archive = {
          id: Date.now(),
          date: new Date().toISOString(),
          data: currentData
        };
        const existingArchives = loadSecure(STORAGE_KEYS.ARCHIVES, []);
        existingArchives.unshift(archive);
        const limitedArchives = existingArchives.slice(0, 5);
        saveSecure(STORAGE_KEYS.ARCHIVES, limitedArchives);
      }

      localStorage.removeItem(STORAGE_KEYS.TAX_DATA);
      setShowResetModal(false);
      setData(null);
      setTaxEstimate(null);
      navigate('/declaration');
    } catch {
      // Silently handle errors
    }
  };

  // Download report as JSON
  const downloadReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      year: TAX_YEAR,
      declaration: data,
      estimate: taxEstimate,
      extractions: loadSecure(STORAGE_KEYS.EXTRACTIONS, [])
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getExportFilename('declaration-impots')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download report as text (human-readable)
  const downloadTextReport = () => {
    const lines = [
      '='.repeat(60),
      `DÉCLARATION D'IMPÔTS GENÈVE ${TAX_YEAR}`,
      '='.repeat(60),
      `Généré le: ${new Date().toLocaleDateString('fr-CH')}`,
      '',
      '--- REVENUS ---',
      `Revenu brut: CHF ${(data?.grossSalary || 0).toLocaleString('fr-CH')}`,
      `Cotisations AVS: CHF ${(data?.avsContributions || 0).toLocaleString('fr-CH')}`,
      `Cotisations LPP: CHF ${(data?.lppContributions || 0).toLocaleString('fr-CH')}`,
      '',
      '--- DÉDUCTIONS ---',
      `3ème pilier A: CHF ${(data?.pilier3a || 0).toLocaleString('fr-CH')}`,
      `Assurance maladie: CHF ${(data?.healthInsurance || 0).toLocaleString('fr-CH')}`,
      `Total déductions: CHF ${(taxEstimate?.totalDeductions || 0).toLocaleString('fr-CH')}`,
      '',
      '--- ESTIMATION IMPÔTS ---',
      `Revenu imposable: CHF ${(taxEstimate?.taxableIncome || 0).toLocaleString('fr-CH')}`,
      `ICC (cantonal): CHF ${(taxEstimate?.icc || 0).toLocaleString('fr-CH')}`,
      `Centimes additionnels: CHF ${(taxEstimate?.centimesAdd || 0).toLocaleString('fr-CH')}`,
      `IFD (fédéral): CHF ${(taxEstimate?.ifd || 0).toLocaleString('fr-CH')}`,
      `Impôt fortune: CHF ${(taxEstimate?.fortuneTax || 0).toLocaleString('fr-CH')}`,
      '-'.repeat(40),
      `TOTAL ESTIMÉ: CHF ${(taxEstimate?.total || 0).toLocaleString('fr-CH')}`,
      `Taux effectif: ${taxEstimate?.effectiveRate || 0}%`,
      '',
      '='.repeat(60),
      'AVERTISSEMENT: Cette estimation est indicative.',
      'Le montant final peut varier selon votre situation exacte.',
      '='.repeat(60)
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getExportFilename('rapport-impots')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateTax = (declarationData) => {
    // Use the new step-by-step calculator
    const result = calculateTaxWithSteps(declarationData);

    // Set the summary for backwards compatibility
    setTaxEstimate(result.summary);

    // Store steps for transparency display
    setCalculationSteps(result.steps);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!taxEstimate) {
    return (
      <Alert variant="warning">
        <AlertTriangle className="h-5 w-5" />
        <AlertDescription>
          <strong className="block mb-1">Données insuffisantes</strong>
          Veuillez compléter la déclaration pour voir l'estimation de vos impôts.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Revenu imposable</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              CHF {taxEstimate.taxableIncome.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Déductions totales</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              CHF {taxEstimate.totalDeductions.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold">%</span>
              </div>
              <span className="text-sm text-gray-500">Taux effectif</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {taxEstimate.effectiveRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Estimation des impôts {TAX_YEAR}</CardTitle>
          <CardDescription>Basée sur les informations fournies</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            <div className="flex justify-between p-4 hover:bg-gray-50">
              <span className="text-gray-600">ICC (Impôt cantonal)</span>
              <span className="font-medium">CHF {taxEstimate.icc.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-4 hover:bg-gray-50">
              <span className="text-gray-600">Centimes additionnels communaux</span>
              <span className="font-medium">CHF {taxEstimate.centimesAdd.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-4 hover:bg-gray-50">
              <span className="text-gray-600">IFD (Impôt fédéral direct)</span>
              <span className="font-medium">CHF {taxEstimate.ifd.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-4 hover:bg-gray-50">
              <span className="text-gray-600">Impôt sur la fortune</span>
              <span className="font-medium">CHF {taxEstimate.fortuneTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-4 bg-red-50">
              <span className="font-semibold text-gray-900">Total estimé</span>
              <span className="font-bold text-red-600 text-lg">
                CHF {taxEstimate.total.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Alert variant="info">
        <AlertTriangle className="h-5 w-5" />
        <AlertDescription>
          <strong>Estimation indicative:</strong> Ce calcul est une approximation basée sur les barèmes {TAX_YEAR}.
          Le montant final peut varier selon votre situation exacte et les centimes additionnels de votre commune.
        </AlertDescription>
      </Alert>

      {/* Calculation Transparency Toggle */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setShowBreakdown(!showBreakdown)}
      >
        {showBreakdown ? (
          <>
            <EyeOff className="w-4 h-4 mr-2" />
            Masquer le détail du calcul
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-2" />
            Voir le détail du calcul
          </>
        )}
      </Button>

      {/* Calculation Breakdown */}
      {showBreakdown && calculationSteps.length > 0 && (
        <TaxBreakdown steps={calculationSteps} />
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button className="flex-1" size="lg" onClick={downloadTextReport}>
          <Download className="w-5 h-5" />
          Télécharger le rapport
        </Button>
        <Button variant="outline" className="flex-1" size="lg" onClick={downloadReport}>
          <FileText className="w-5 h-5" />
          Exporter données (JSON)
        </Button>
      </div>

      {/* Archives Section */}
      {archives.length > 0 && (
        <Card>
          <button
            onClick={() => setShowArchives(!showArchives)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Archive className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900">Déclarations archivées</span>
              <span className="text-sm text-gray-500">({archives.length})</span>
            </div>
            {showArchives ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showArchives && (
            <div className="border-t border-gray-200 divide-y divide-gray-100">
              {archives.map((archive, index) => (
                <div key={archive.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Déclaration #{archives.length - index}
                      </p>
                      <p className="text-sm text-gray-500">
                        Archivée le {new Date(archive.date).toLocaleDateString('fr-CH', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {archive.data.grossSalary && (
                        <p className="text-sm text-gray-400 mt-1">
                          Revenu: CHF {archive.data.grossSalary.toLocaleString('fr-CH')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => restoreArchive(archive)}
                      >
                        Restaurer
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteArchive(archive.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Reset Button */}
      <div className="pt-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full text-gray-600 hover:text-red-600"
          onClick={() => setShowResetModal(true)}
        >
          <RotateCcw className="w-4 h-4" />
          Recommencer une nouvelle déclaration
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recommencer?</DialogTitle>
            <DialogDescription>
              Cette action va archiver votre déclaration actuelle.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="warning" className="my-4">
            <Archive className="h-5 w-5" />
            <AlertDescription>
              Vos données actuelles seront <strong>archivées</strong> avant d'être effacées.
              Vous pourrez les consulter plus tard si nécessaire.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-gray-600">
            <p>Cette action va:</p>
            <ul className="mt-2 space-y-1">
              <li>• Archiver votre déclaration actuelle</li>
              <li>• Effacer toutes les données du questionnaire</li>
              <li>• Vous rediriger vers une nouvelle déclaration</li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowResetModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleReset}>
              Oui, recommencer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
