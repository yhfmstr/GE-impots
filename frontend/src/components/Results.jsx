import { useState, useEffect } from 'react';
import { Calculator, TrendingDown, AlertTriangle, CheckCircle, Download, RotateCcw, X, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Results() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taxEstimate, setTaxEstimate] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [archives, setArchives] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    loadArchives();
  }, []);

  const loadData = () => {
    try {
      // Load from localStorage instead of API
      const saved = localStorage.getItem('taxDeclarationData');
      if (saved) {
        const parsedData = JSON.parse(saved);
        setData(parsedData);

        // Calculate taxes if we have enough data
        if (parsedData.grossSalary) {
          calculateTax(parsedData);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArchives = () => {
    const saved = localStorage.getItem('taxDeclarationArchives');
    if (saved) {
      setArchives(JSON.parse(saved));
    }
  };

  const handleReset = () => {
    // Archive current data before reset
    const currentData = localStorage.getItem('taxDeclarationData');
    if (currentData) {
      const parsedData = JSON.parse(currentData);
      const archive = {
        id: Date.now(),
        date: new Date().toISOString(),
        data: parsedData
      };

      const existingArchives = JSON.parse(localStorage.getItem('taxDeclarationArchives') || '[]');
      existingArchives.unshift(archive); // Add to beginning
      // Keep only last 5 archives
      const limitedArchives = existingArchives.slice(0, 5);
      localStorage.setItem('taxDeclarationArchives', JSON.stringify(limitedArchives));
    }

    // Clear current data
    localStorage.removeItem('taxDeclarationData');
    setShowResetModal(false);
    setData(null);
    setTaxEstimate(null);

    // Redirect to declaration page
    navigate('/declaration');
  };

  const calculateTax = (declarationData) => {
    // Support both flat structure (from localStorage) and nested structure
    const grossIncome = declarationData.grossSalary || declarationData.income?.grossSalary || 0;
    const avsContributions = declarationData.avsContributions || declarationData.income?.avsContributions || 0;
    const lppContributions = declarationData.lppContributions || declarationData.income?.lppContributions || 0;
    const pilier3a = declarationData.pilier3a || declarationData.deductions?.pilier3a || 0;
    const healthInsurance = declarationData.healthInsurance || declarationData.deductions?.healthInsurance || 0;
    const bankAccounts = declarationData.bankAccounts || declarationData.wealth?.bankAccounts || 0;
    const securities = declarationData.securities || declarationData.wealth?.securities || 0;
    const vehicleValue = declarationData.vehicleValue || declarationData.wealth?.vehicleValue || 0;
    const personalLoans = declarationData.personalLoans || declarationData.wealth?.personalLoans || 0;
    const otherDebts = declarationData.otherDebts || declarationData.wealth?.otherDebts || 0;

    // Calculate deductions
    const totalDeductions =
      avsContributions +
      lppContributions +
      pilier3a +
      healthInsurance +
      Math.min(grossIncome * 0.03, 1796); // forfait professionnel ICC

    const taxableIncome = Math.max(0, grossIncome - totalDeductions);

    // Simplified ICC calculation (progressive rates)
    let icc = 0;
    if (taxableIncome > 0) {
      if (taxableIncome <= 17493) icc = taxableIncome * 0.08;
      else if (taxableIncome <= 21076) icc = 1399 + (taxableIncome - 17493) * 0.09;
      else if (taxableIncome <= 23184) icc = 1722 + (taxableIncome - 21076) * 0.10;
      else if (taxableIncome <= 25291) icc = 1933 + (taxableIncome - 23184) * 0.11;
      else if (taxableIncome <= 27399) icc = 2165 + (taxableIncome - 25291) * 0.12;
      else if (taxableIncome <= 33198) icc = 2417 + (taxableIncome - 27399) * 0.13;
      else if (taxableIncome <= 36889) icc = 3171 + (taxableIncome - 33198) * 0.14;
      else if (taxableIncome <= 40580) icc = 3688 + (taxableIncome - 36889) * 0.145;
      else if (taxableIncome <= 45854) icc = 4223 + (taxableIncome - 40580) * 0.15;
      else if (taxableIncome <= 72420) icc = 5014 + (taxableIncome - 45854) * 0.155;
      else if (taxableIncome <= 119107) icc = 9132 + (taxableIncome - 72420) * 0.16;
      else if (taxableIncome <= 160520) icc = 16602 + (taxableIncome - 119107) * 0.175;
      else if (taxableIncome <= 498293) icc = 23849 + (taxableIncome - 160520) * 0.185;
      else icc = 86387 + (taxableIncome - 498293) * 0.19;
    }

    // Centimes additionnels (moyenne Genève ~45%)
    const centimesAdd = icc * 0.45;

    // IFD (simplified)
    const ifd = taxableIncome * 0.115 * 0.8;

    // Fortune tax
    const totalWealth = bankAccounts + securities + vehicleValue - personalLoans - otherDebts;
    const fortuneTax = Math.max(0, (totalWealth - 87864) * 0.005);

    setTaxEstimate({
      grossIncome,
      totalDeductions,
      taxableIncome,
      icc: Math.round(icc),
      centimesAdd: Math.round(centimesAdd),
      ifd: Math.round(ifd),
      fortuneTax: Math.round(fortuneTax),
      total: Math.round(icc + centimesAdd + ifd + fortuneTax),
      effectiveRate: taxableIncome > 0 ? ((icc + centimesAdd + ifd) / grossIncome * 100).toFixed(1) : 0
    });
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Données insuffisantes</h3>
        <p className="mt-2 text-gray-600">
          Veuillez compléter le questionnaire pour voir l'estimation de vos impôts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Revenu imposable</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            CHF {taxEstimate.taxableIncome.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Déductions totales</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            CHF {taxEstimate.totalDeductions.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 font-bold">%</span>
            </div>
            <span className="text-sm text-gray-500">Taux effectif</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {taxEstimate.effectiveRate}%
          </p>
        </div>
      </div>

      {/* Tax Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Estimation des impôts 2024</h3>
          <p className="text-sm text-gray-500 mt-1">Basée sur les informations fournies</p>
        </div>

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
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800">
            <strong>Estimation indicative:</strong> Ce calcul est une approximation basée sur les barèmes 2024.
            Le montant final peut varier selon votre situation exacte et les centimes additionnels de votre commune.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button className="flex-1 flex items-center justify-center gap-2 p-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
          <Download className="w-5 h-5" />
          Télécharger le rapport
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
          <CheckCircle className="w-5 h-5" />
          Vérifier la conformité
        </button>
      </div>

      {/* Reset Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowResetModal(true)}
          className="flex items-center justify-center gap-2 w-full p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Recommencer une nouvelle déclaration
        </button>
        {archives.length > 0 && (
          <p className="text-xs text-center text-gray-400 mt-2">
            {archives.length} déclaration(s) archivée(s)
          </p>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recommencer?</h3>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl mb-4">
                <Archive className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800">
                    Vos données actuelles seront <strong>archivées</strong> avant d'être effacées.
                    Vous pourrez les consulter plus tard si nécessaire.
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Cette action va:
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Archiver votre déclaration actuelle</li>
                <li>• Effacer toutes les données du questionnaire</li>
                <li>• Vous rediriger vers une nouvelle déclaration</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReset}
                className="flex-1 p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Oui, recommencer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
