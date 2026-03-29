import { formatKPI } from "@/lib/calculationEngine";

type FmtKey = "arboles" | "co2" | "energia" | "agua" | "economic_impact" | "kg_brutos" | "kg_netos";

interface DualPeriodBadgeProps {
  filteredValue: number;
  yearValue: number;
  fmtKey: FmtKey;
  unit: string;
  dashYear: number;
  isAllMonths: boolean;
  prefix?: string;
}

const DualPeriodBadge = ({
  filteredValue,
  yearValue,
  fmtKey,
  unit,
  dashYear,
  isAllMonths,
  prefix = "",
}: DualPeriodBadgeProps) => {
  if (isAllMonths) return null;

  return (
    <div className="flex items-center gap-3 mt-1.5 px-1">
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-primary" />
        <span className="text-[10px] text-muted-foreground font-medium">Este mes:</span>
        <span className="text-[11px] font-bold text-foreground">
          {prefix}{formatKPI(fmtKey, filteredValue)} <span className="font-normal text-muted-foreground">{unit}</span>
        </span>
      </div>
      <div className="w-px h-3 bg-border" />
      <div className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/40" />
        <span className="text-[10px] text-muted-foreground font-medium">Acumulado {dashYear}:</span>
        <span className="text-[11px] font-bold text-muted-foreground">
          {prefix}{formatKPI(fmtKey, yearValue)} <span className="font-normal">{unit}</span>
        </span>
      </div>
    </div>
  );
};

export default DualPeriodBadge;
