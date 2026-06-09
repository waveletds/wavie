import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Share2, Globe, Heart, Eye, Users, ArrowRight, Sparkles, Check, ChevronDown, CheckCircle } from 'lucide-react';
import { UserState } from '../types';

interface SmmBoosterPanelProps {
  user: UserState;
  onTriggerPurchase: (params: {
    type: 'smm';
    amount: number;
    recipient: string;
    description: string;
    details: {
      platform: string;
      serviceName: string;
      quantity: number;
      targetUrl: string;
      category: string;
    };
  }) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

interface SmmService {
  id: string;
  name: string;
  pricePerThousand: number;
  icon: React.ReactNode;
  delivery: string;
  minQty: number;
  maxQty: number;
}

const SMM_SERVICES: Record<string, { brandColor: string; bgTint: string; services: SmmService[] }> = {
  instagram: {
    brandColor: 'from-pink-500 to-rose-500 text-rose-500',
    bgTint: 'bg-rose-50/50 border-rose-100',
    services: [
      { id: 'ig-followers', name: 'Instagram Real Profile Followers', pricePerThousand: 1200, icon: <Users className="w-4 h-4" />, delivery: '15 - 30 mins', minQty: 100, maxQty: 10000 },
      { id: 'ig-likes', name: 'Instagram Automated Post Likes', pricePerThousand: 350, icon: <Heart className="w-4 h-4" />, delivery: '5 - 15 mins', minQty: 100, maxQty: 10000 },
      { id: 'ig-views', name: 'Instagram Viral Reels/Video Views', pricePerThousand: 180, icon: <Eye className="w-4 h-4" />, delivery: 'Instant', minQty: 200, maxQty: 50000 },
    ]
  },
  tiktok: {
    brandColor: 'from-slate-950 to-red-500 text-slate-900',
    bgTint: 'bg-slate-50 border-slate-200',
    services: [
      { id: 'tt-followers', name: 'TikTok Organic Profile Followers', pricePerThousand: 1450, icon: <Users className="w-4 h-4" />, delivery: '30 - 60 mins', minQty: 100, maxQty: 10000 },
      { id: 'tt-likes', name: 'TikTok High-Engagement Post Likes', pricePerThousand: 500, icon: <Heart className="w-4 h-4" />, delivery: '10 - 20 mins', minQty: 100, maxQty: 10000 },
      { id: 'tt-views', name: 'TikTok Instant Video Views Booster', pricePerThousand: 120, icon: <Eye className="w-4 h-4" />, delivery: 'Instant', minQty: 500, maxQty: 100000 },
    ]
  },
  youtube: {
    brandColor: 'from-red-600 to-red-700 text-red-650',
    bgTint: 'bg-red-50/50 border-red-100',
    services: [
      { id: 'yt-subscribers', name: 'YouTube Permanent Video Subscribers', pricePerThousand: 4200, icon: <Users className="w-4 h-4" />, delivery: '1 - 3 hours', minQty: 50, maxQty: 1000 },
      { id: 'yt-likes', name: 'YouTube Video Genuine Likes Pack', pricePerThousand: 950, icon: <Heart className="w-4 h-4" />, delivery: '15 - 45 mins', minQty: 100, maxQty: 5000 },
      { id: 'yt-views', name: 'YouTube High-Retention Watch Views', pricePerThousand: 1100, icon: <Eye className="w-4 h-4" />, delivery: '20 - 40 mins', minQty: 100, maxQty: 10000 },
    ]
  },
  twitter: {
    brandColor: 'from-sky-500 to-blue-600 text-sky-600',
    bgTint: 'bg-sky-50/50 border-sky-100',
    services: [
      { id: 'tw-followers', name: 'Twitter/X Active Profile Followers', pricePerThousand: 2100, icon: <Users className="w-4 h-4" />, delivery: '15 - 45 mins', minQty: 100, maxQty: 5000 },
      { id: 'tw-likes', name: 'Twitter/X Post Quality Favorites/Likes', pricePerThousand: 650, icon: <Heart className="w-4 h-4" />, delivery: '10 - 20 mins', minQty: 100, maxQty: 5000 },
      { id: 'tw-views', name: 'Twitter/X Premium Impressions Booster', pricePerThousand: 130, icon: <Eye className="w-4 h-4" />, delivery: 'Instant', minQty: 1000, maxQty: 500000 },
    ]
  }
};

export const SmmBoosterPanel: React.FC<SmmBoosterPanelProps> = ({
  user,
  onTriggerPurchase,
  addToast,
}) => {
  const [activePlatform, setActivePlatform] = useState<string>('instagram');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('ig-followers');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1000);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const currentPlatformConfig = SMM_SERVICES[activePlatform];
  const activeService = currentPlatformConfig.services.find(s => s.id === selectedServiceId) || currentPlatformConfig.services[0];

  // Recalculate cost
  const pricePerUnit = activeService.pricePerThousand / 1000;
  const orderCost = parseFloat((quantity * pricePerUnit).toFixed(2));
  const cashBackValue = parseFloat((orderCost * 0.03).toFixed(2)); // Standard 3% cash back on social boost

  const handlePlatformChange = (plat: string) => {
    setActivePlatform(plat);
    const firstService = SMM_SERVICES[plat].services[0];
    setSelectedServiceId(firstService.id);
    // Adjust default quantity if minQty is higher
    if (quantity < firstService.minQty) {
      setQuantity(firstService.minQty);
    } else if (quantity > firstService.maxQty) {
      setQuantity(firstService.maxQty);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) {
      addToast('Please enter your social media profile username or post link!', 'warning');
      return;
    }

    if (quantity < activeService.minQty || quantity > activeService.maxQty) {
      addToast(`Allowed quantity range is ${activeService.minQty.toLocaleString()} to ${activeService.maxQty.toLocaleString()}`, 'warning');
      return;
    }

    if (orderCost > user.walletBalance) {
      addToast('Insufficient wallet balance to place SMM boost order!', 'error');
      return;
    }

    onTriggerPurchase({
      type: 'smm',
      amount: orderCost,
      recipient: targetUrl,
      description: `${activeService.name} - ${quantity.toLocaleString()} Boost`,
      details: {
        platform: activePlatform,
        serviceName: activeService.name,
        quantity,
        targetUrl,
        category: 'SMM Booster'
      }
    });

    addToast('Social media boost details pre-compiled!', 'info');
  };

  const faqItems = [
    { q: 'How long does the service take to deliver?', a: 'Delivery starts automatically. Most orders begin reflecting within 15 to 45 minutes of verification and are entirely distributed with drip-feed protection to look organic.' },
    { q: 'Do these orders decline or drop over time?', a: 'We utilize stable high-retention pools with premium safety. If any minor drop occurs within 30 days, we perform a complimentary system top-up.' },
    { q: 'What handle link formats should I provide?', a: 'For followers, use standard usernames or profile addresses (e.g., instagram.com/username). For views/likes, use the direct post URL.' }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up" id="smm-booster-feature">
      {/* Premium Tab Bar Selector */}
      <div className="bg-slate-200/50 backdrop-blur-md p-1 border border-[#E5E2DA]/60 rounded-2xl flex gap-1 w-full max-w-lg">
        {Object.keys(SMM_SERVICES).map((plat) => (
          <button
            key={plat}
            onClick={() => handlePlatformChange(plat)}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl capitalize transition-all cursor-pointer ${
              activePlatform === plat
                ? 'bg-white text-slate-950 shadow-sm border border-[#E5E2DA]/40'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {plat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Interactive form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white/95 rounded-3xl border border-[#E5E2DA]/70 shadow-[0_12px_44px_-10px_rgba(115,108,92,0.04)] p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-2.5 border-b border-slate-50 pb-4">
            <span className="p-2.5 bg-purple-50 text-purple-600 border border-purple-150 rounded-xl">
              <Share2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-900 font-display uppercase tracking-wide flex items-center gap-1.5">
                Social Media Growth Booster
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">Instantly boost followers, engagement, and video views organically across Nigerian reseller pools.</p>
            </div>
          </div>

          {/* Service Select List */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest leading-none">
              Select Growth Service Package
            </label>
            <div className="flex flex-col gap-2">
              {currentPlatformConfig.services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-300 cursor-pointer ${
                    selectedServiceId === service.id
                      ? 'border-purple-500 bg-purple-50/15 ring-2 ring-purple-500/10'
                      : 'border-[#E5E2DA]/80 bg-slate-50/20 text-slate-700 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${selectedServiceId === service.id ? 'bg-purple-100/60 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                      {service.icon}
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800">{service.name}</span>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                        Est: {service.delivery} • Min: {service.minQty.toLocaleString()} • Max: {service.maxQty.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-purple-700">₦{service.pricePerThousand.toLocaleString('en-NG')}</span>
                    <p className="text-[8px] text-slate-450 font-medium mt-0.5">per 1k count</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target link field */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest leading-none">
              Target Profile URL or Post Link
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450 text-xs">
                <Globe className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder={activePlatform === 'instagram' ? 'e.g., https://instagram.com/my_business' : 'e.g. video link or account @username'}
                className="w-full pl-10 pr-4 py-3 bg-[#FAF9F6]/50 hover:bg-white border border-[#E5E2DA] focus:border-purple-500 focus:bg-white text-xs font-bold text-slate-850 rounded-2xl outline-none transition-all placeholder-slate-400"
              />
            </div>
          </div>

          {/* Quantity selector */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest leading-none">
                Quantity Count Amount
              </label>
              <span className="text-[10px] text-slate-450 font-bold font-mono">
                Range: ({activeService.minQty.toLocaleString()} - {activeService.maxQty.toLocaleString()})
              </span>
            </div>
            <input
              type="number"
              required
              min={activeService.minQty}
              max={activeService.maxQty}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
              className="w-full px-4 py-3 bg-[#FAF9F6]/50 hover:bg-white border border-[#E5E2DA] focus:border-purple-500 focus:bg-white text-xs font-mono font-black text-slate-850 rounded-2xl outline-none transition-all"
            />
            {/* Short-cut select counts */}
            <div className="flex gap-1.5 mt-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[500, 1000, 2500, 5000].map((num) => {
                if (num >= activeService.minQty && num <= activeService.maxQty) {
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      className={`py-1.5 px-3 rounded-full text-[10px] font-black font-mono transition-all cursor-pointer whitespace-nowrap border ${
                        quantity === num
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-[#E5E2DA]/85'
                      }`}
                    >
                      +{num.toLocaleString()}
                    </button>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Place order trigger payment button */}
          <button
            type="submit"
            className="w-full mt-2 py-3.5 sm:py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 hover:from-purple-500 hover:to-teal-400 text-white rounded-2xl text-xs font-black uppercase tracking-wider relative group overflow-hidden shadow-lg active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Submit Booster Order</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 duration-200" />
          </button>
        </form>

        {/* Right side live simulation order status receipt review */}
        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-tr from-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-white/[0.04] shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/15 group-hover:scale-110 transition-all duration-700 pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="z-10 flex flex-col gap-5">
              <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest">Growth Receipt Draft</span>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-sans uppercase font-black tracking-wider">PREVIEW</span>
              </div>

              <div className="flex flex-col gap-3.5">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Target Service</span>
                  <p className="text-xs font-black text-white font-display mt-0.5 capitalize">{activePlatform} {activeService.name}</p>
                </div>
                
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black font-sans">Target Recipient Link</span>
                  <p className="text-xs font-mono text-slate-200 mt-0.5 truncate break-all">{targetUrl || 'Waiting for input...'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Quantity</span>
                    <p className="text-xs font-mono text-white font-black mt-0.5">{quantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">System Fee</span>
                    <p className="text-xs font-mono text-emerald-400 font-black mt-0.5">₦0.00 (FREE)</p>
                  </div>
                </div>

                <div className="bg-white/[0.04] p-3.5 rounded-2xl border border-white/[0.05] flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Total Debit</span>
                    <p className="text-sm font-mono text-emerald-400 font-black">₦{orderCost.toLocaleString('en-NG')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Estimated Cashback</span>
                    <p className="text-xs font-mono text-purple-400 font-black">+₦{cashBackValue.toLocaleString('en-NG')} (3%)</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.03] mt-1.5 duration-300 hover:border-emerald-500/10 hover:bg-white/[0.03]">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Equipped with drop protection and fully automated execution.</span>
              </div>
            </div>
          </div>

          {/* SMM Specific Help/FAQ accordions */}
          <div className="bg-slate-50 p-4 border border-[#E5E2DA]/80 rounded-2xl">
            <h3 className="text-xs font-black text-slate-800 font-display uppercase tracking-wider mb-2 flex items-center gap-1.5">
              Growth Safety Center
            </h3>
            <div className="flex flex-col gap-2">
              {faqItems.map((item, id) => (
                <div key={id} className="border-b border-slate-200/80 pb-2 last:border-b-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(expandedFaq === id ? null : id)}
                    className="w-full flex justify-between items-center text-left text-[11px] font-black text-slate-700 hover:text-purple-600 focus:outline-none py-1 cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 duration-200 ${expandedFaq === id ? 'rotate-180 text-purple-600' : ''}`} />
                  </button>
                  {expandedFaq === id && (
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1 animate-fade-in-down">
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
