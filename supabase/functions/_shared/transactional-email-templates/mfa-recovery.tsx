/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Img, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://pqjebmtxfmjvdrlvzkla.supabase.co/storage/v1/object/public/email-assets/logo.png'

interface Props {
  recoveryUrl: string
  expiresInMinutes: number
}

const MfaRecoveryEmail = ({ recoveryUrl, expiresInMinutes }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your two-factor authentication for Border Pay</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="Border Pay" width="48" height="48" style={logo} />
        <Heading style={h1}>Reset your two-factor authentication</Heading>
        <Text style={text}>
          We received a request to reset the two-factor authentication on your Border Pay admin account.
          Click the button below to remove your existing authenticator and enrol a new one. This link
          expires in {expiresInMinutes} minutes and can only be used once.
        </Text>
        <Button style={button} href={recoveryUrl}>Reset two-factor</Button>
        <Text style={textSmall}>
          Or paste this link into your browser:<br />
          <span style={{ wordBreak: 'break-all' }}>{recoveryUrl}</span>
        </Text>
        <Text style={footer}>
          If you didn't request this, you can ignore this email — your two-factor authentication will
          stay in place. For your security, the link only works once and expires shortly.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template: TemplateEntry = {
  component: MfaRecoveryEmail,
  subject: 'Reset your two-factor authentication',
  displayName: 'Admin MFA recovery',
  previewData: {
    recoveryUrl: 'https://borderpay.app/auth/mfa-recovery?token=preview',
    expiresInMinutes: 30,
  },
}

export default MfaRecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1A3A2A', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 25px' }
const textSmall = { fontSize: '12px', color: '#55575d', lineHeight: '1.5', margin: '20px 0' }
const button = { backgroundColor: '#1A3A2A', color: '#F5F2ED', fontSize: '14px', borderRadius: '12px', padding: '12px 24px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
