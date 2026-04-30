/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as interestNotification } from './interest-notification.tsx'
import { template as interestConfirmation } from './interest-confirmation.tsx'
import { template as pitchDeckDelivery } from './pitch-deck-delivery.tsx'
import { template as mfaRecovery } from './mfa-recovery.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'interest-notification': interestNotification,
  'interest-confirmation': interestConfirmation,
  'pitch-deck-delivery': pitchDeckDelivery,
  'mfa-recovery': mfaRecovery,
}
