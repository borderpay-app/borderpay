/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Border Pay'
const PITCH_DECK_URL = 'https://pqjebmtxfmjvdrlvzkla.supabase.co/storage/v1/object/public/email-assets/BorderPay-Pitch-Deck.pptx'

const PitchDeckDeliveryEmail = () => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Border Pay Pitch Deck is ready to download</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your Pitch Deck</Heading>
        <Text style={text}>
          Thank you for your interest in {SITE_NAME}. Please find our investor pitch deck available for download below.
        </Text>

        <Button style={button} href={PITCH_DECK_URL}>
          Download Pitch Deck
        </Button>

        <Text style={textSmall}>
          The pitch deck covers our market opportunity, the BDRP dual-pegged stablecoin solution, 
          competitive advantages over Revolut, Wise, and Stripe, and how we're transforming 
          cross-border payments on the island of Ireland.
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          If you have any questions, reply to this email or reach out at hello@borderpay.app.
        </Text>
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PitchDeckDeliveryEmail,
  subject: 'Border Pay — Investor Pitch Deck',
  displayName: 'Pitch deck delivery',
  previewData: {},
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#1A3A2A', margin: '0 0 16px', borderBottom: '2px solid #1A3A2A', paddingBottom: '10px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 24px' }
const textSmall = { fontSize: '13px', color: '#777', lineHeight: '1.5', margin: '24px 0 16px' }
const button = {
  backgroundColor: '#1A3A2A',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '0 0 4px' }
