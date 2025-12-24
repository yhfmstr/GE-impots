/**
 * YearSelector Component
 *
 * Dropdown to select the active tax declaration year.
 * Shows status indicator for each year.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Circle, Clock, CheckCircle2 } from 'lucide-react';
import { useDeclarationYearStore, DECLARATION_STATUS } from '@/stores/declarationYearStore';

const YearSelector = ({ className = '' }) => {
  const {
    activeYear,
    setActiveYear,
    getAvailableYears,
    getStatus,
    getCompletionPercent
  } = useDeclarationYearStore();

  const years = getAvailableYears();

  // Get status icon and color for a year
  const getStatusIndicator = (year) => {
    const status = getStatus(year);
    const percent = getCompletionPercent(year);

    switch (status) {
      case DECLARATION_STATUS.FINALIZED:
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-500'
        };
      case DECLARATION_STATUS.IN_PROGRESS:
        return {
          icon: Clock,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500',
          percent
        };
      default:
        return {
          icon: Circle,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted-foreground'
        };
    }
  };

  return (
    <Select
      value={activeYear?.toString()}
      onValueChange={(value) => setActiveYear(parseInt(value))}
    >
      <SelectTrigger className={`w-[180px] ${className}`}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <SelectValue placeholder="Année fiscale" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => {
          const indicator = getStatusIndicator(year);
          const Icon = indicator.icon;

          return (
            <SelectItem key={year} value={year.toString()}>
              <div className="flex items-center justify-between w-full gap-4">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${indicator.color}`} />
                  <span>Déclaration {year}</span>
                </div>
                {indicator.percent !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {indicator.percent}%
                  </Badge>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default YearSelector;
