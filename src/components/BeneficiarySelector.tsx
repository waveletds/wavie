import React from 'react';
import { Phone, Lightbulb, Tv, UserPlus, Heart } from 'lucide-react';
import { SavedBeneficiary } from '../types';

interface BeneficiarySelectorProps {
  beneficiaries: SavedBeneficiary[];
  onSelect: (b: SavedBeneficiary) => void;
  activeType: 'phone' | 'meter' | 'iuc' | 'all';
  label: string;
}

export const BeneficiarySelector: React.FC<BeneficiarySelectorProps> = ({
  beneficiaries,
  onSelect,
  activeType,
  label,
}) => {
  const filtered = beneficiaries.filter(
    (b) => activeType === 'all' || b.type === activeType
  );

  const getLogoColor = (provider: string) => {
    const prov = provider.toUpperCase();
    if (prov.includes('MTN')) return 'bg-amber-400 text-slate-900 border-amber-300';
    if (prov.includes('AIRTEL')) return 'bg-red-650 text-white border-red-500';
    if (prov.includes('GLO')) return 'bg-green-600 text-white border-green-500';
    if (prov.includes('9MOBILE')) return 'bg-emerald-900 text-white border-emerald-700';
    if (prov.includes('IKEJA') || prov.includes('EKO') || prov.includes('ABUJA')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (prov.includes('DSTV') || prov.includes('GOTV')) return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getIcon = (type: 'phone' | 'meter' | 'iuc') => {
    switch (type) {
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'meter':
        return <Lightbulb className="w-4 h-4" />;
      case 'iuc':
        return <Tv className="w-4 h-4" />;
    }
  };

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-5 bg-white/60 border border-dashed border-slate-205 rounded-2xl">
        <Heart className="w-5 h-5 text-slate-350 stroke-[1.5]" />
        <span className="text-xs text-slate-450 mt-1.5 font-medium">No saved beneficiaries here yet.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
          {label}
        </label>
        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-semibold">
          {filtered.length} Saved
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
        {filtered.map((b) => (
          <button
            key={b.id}
            id={`beneficiary-item-${b.id}`}
            type="button"
            onClick={() => onSelect(b)}
            className="flex-shrink-0 flex items-center gap-3 p-3 bg-white/75 backdrop-blur-sm border border-[#E5E2DA]/85 hover:border-emerald-500 hover:bg-white hover:shadow-lg rounded-2xl text-left transition-all duration-300 group focus:outline-none"
            style={{ width: '175px' }}
          >
            {/* Round Avatar badge */}
            <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold transition-transform group-hover:scale-105 font-display text-sm ${getLogoColor(b.provider)}`}>
              {b.provider.startsWith('MTN') || b.provider.startsWith('Airtel') || b.provider.startsWith('Glo') || b.provider.startsWith('9mobile') 
                ? b.provider.substring(0, 1) 
                : getIcon(b.type)
              }
            </div>

            {/* Beneficiary particulars */}
            <div className="flex flex-col min-w-0 flex-grow">
              <span className="text-xs font-bold text-slate-700 truncate font-display group-hover:text-indigo-605">
                {b.name}
              </span>
              <span className="text-[10px] text-slate-400 truncate font-mono">
                {b.value}
              </span>
              <span className="text-[9px] text-slate-450 truncate font-medium uppercase font-display select-none">
                {b.provider}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
