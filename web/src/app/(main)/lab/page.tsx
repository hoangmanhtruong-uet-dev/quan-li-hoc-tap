'use client';

import React, { useState } from 'react';
import { useCampusStore } from '@/lib/campus-store';
import { LabPaywallShowcase } from '@/components/lab/lab-paywall-showcase';
import { LabResearchWorkspace } from '@/components/lab/lab-research-workspace';
import { VietQrCheckoutModal } from '@/components/monetization/vietqr-checkout-modal';
import { LabTier } from '@/types/database';

export default function CampusLabPage() {
  const { state } = useCampusStore();
  const [checkoutTier, setCheckoutTier] = useState<LabTier | null>(null);

  // If user is already VIP with plus/pro/ultra tier, render workspace directly
  const hasVipAccess = state.isLabVip || (state.tier && state.tier !== 'free');

  return (
    <div className="mx-auto max-w-7xl pb-16">
      {hasVipAccess ? (
        <LabResearchWorkspace
          userTier={(state.tier as 'plus' | 'pro' | 'ultra') || 'ultra'}
          onUpgradeToUltra={() => setCheckoutTier('ultra')}
        />
      ) : (
        <LabPaywallShowcase onOpenCheckout={(selectedTier) => setCheckoutTier(selectedTier)} />
      )}

      {/* VietQR Payment Modal */}
      {checkoutTier && (
        <VietQrCheckoutModal
          isOpen={true}
          defaultTier={checkoutTier}
          onClose={() => setCheckoutTier(null)}
          onSuccess={() => setCheckoutTier(null)}
        />
      )}
    </div>
  );
}
