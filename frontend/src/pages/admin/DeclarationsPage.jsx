import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { db, DECLARATION_STATUS } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';

const STATUS_COLORS = {
  [DECLARATION_STATUS.DRAFT]: 'bg-gray-100 text-gray-800',
  [DECLARATION_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [DECLARATION_STATUS.SUBMITTED]: 'bg-yellow-100 text-yellow-800',
  [DECLARATION_STATUS.UNDER_REVIEW]: 'bg-purple-100 text-purple-800',
  [DECLARATION_STATUS.APPROVED]: 'bg-green-100 text-green-800',
  [DECLARATION_STATUS.REJECTED]: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  [DECLARATION_STATUS.DRAFT]: 'Brouillon',
  [DECLARATION_STATUS.IN_PROGRESS]: 'En cours',
  [DECLARATION_STATUS.SUBMITTED]: 'Soumise',
  [DECLARATION_STATUS.UNDER_REVIEW]: 'En révision',
  [DECLARATION_STATUS.APPROVED]: 'Approuvée',
  [DECLARATION_STATUS.REJECTED]: 'Rejetée',
};

export default function AdminDeclarationsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [yearFilter, setYearFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Review dialog
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' | 'reject' | 'review'
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const limit = 20;
  const totalPages = Math.ceil(totalCount / limit);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    loadDeclarations();
  }, [page, statusFilter, yearFilter]);

  const loadDeclarations = async () => {
    setLoading(true);
    try {
      const status = statusFilter === 'all' ? null : statusFilter;
      const year = yearFilter === 'all' ? null : parseInt(yearFilter);

      const { data, count } = await db.admin.getAllDeclarations(page, limit, status, year);
      if (data) {
        setDeclarations(data);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('Error loading declarations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setPage(1);
    if (value === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', value);
    }
    setSearchParams(searchParams);
  };

  const openReviewDialog = (declaration, action) => {
    setSelectedDeclaration(declaration);
    setReviewAction(action);
    setReviewNotes('');
    setRejectionReason('');
    setShowReviewDialog(true);
  };

  const handleReview = async () => {
    if (!selectedDeclaration || !reviewAction) return;

    setUpdating(true);
    try {
      let newStatus;
      switch (reviewAction) {
        case 'approve':
          newStatus = DECLARATION_STATUS.APPROVED;
          break;
        case 'reject':
          newStatus = DECLARATION_STATUS.REJECTED;
          break;
        case 'review':
          newStatus = DECLARATION_STATUS.UNDER_REVIEW;
          break;
        default:
          return;
      }

      await db.admin.reviewDeclaration(
        selectedDeclaration.id,
        newStatus,
        user.id,
        reviewNotes || null,
        reviewAction === 'reject' ? rejectionReason : null
      );

      await loadDeclarations();
      setShowReviewDialog(false);
    } catch (err) {
      console.error('Error reviewing declaration:', err);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Déclarations</h1>
        <p className="text-muted-foreground">
          Gérer et réviser les déclarations fiscales
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtres:</span>
            </div>

            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={(v) => { setYearFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les années</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Declarations Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {totalCount} déclaration{totalCount !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : declarations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune déclaration trouvée</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contribuable</TableHead>
                    <TableHead>Année</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Revenu imposable</TableHead>
                    <TableHead>Impôt total</TableHead>
                    <TableHead>Soumise le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {declarations.map((declaration) => (
                    <TableRow key={declaration.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {declaration.profiles?.first_name
                              ? `${declaration.profiles.first_name} ${declaration.profiles.last_name || ''}`
                              : '—'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {declaration.profiles?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {declaration.tax_year}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[declaration.status]}>
                          {STATUS_LABELS[declaration.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(declaration.revenu_imposable)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(declaration.impot_total)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(declaration.submitted_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/admin/declarations/${declaration.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>

                          {declaration.status === DECLARATION_STATUS.SUBMITTED && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReviewDialog(declaration, 'review')}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Réviser
                            </Button>
                          )}

                          {declaration.status === DECLARATION_STATUS.UNDER_REVIEW && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => openReviewDialog(declaration, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => openReviewDialog(declaration, 'reject')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' && 'Approuver la déclaration'}
              {reviewAction === 'reject' && 'Rejeter la déclaration'}
              {reviewAction === 'review' && 'Mettre en révision'}
            </DialogTitle>
            <DialogDescription>
              Déclaration {selectedDeclaration?.tax_year} de{' '}
              {selectedDeclaration?.profiles?.first_name || selectedDeclaration?.profiles?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {reviewAction === 'reject' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Raison du rejet *</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Expliquez pourquoi la déclaration est rejetée..."
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes internes (optionnel)</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Notes visibles uniquement par les administrateurs..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleReview}
              disabled={updating || (reviewAction === 'reject' && !rejectionReason)}
              className={
                reviewAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : reviewAction === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {reviewAction === 'approve' && 'Approuver'}
                  {reviewAction === 'reject' && 'Rejeter'}
                  {reviewAction === 'review' && 'Mettre en révision'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
