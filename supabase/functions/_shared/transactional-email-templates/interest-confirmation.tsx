/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Border Pay'
const SITE_URL = 'https://borderpay.app'

interface InterestConfirmationProps {
  name?: string
}

const InterestConfirmationEmail = ({ name }: InterestConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're on the {SITE_NAME} early-access list</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Thanks, ${name} — you're on the list` : "Thanks — you're on the list"}
        </Heading>

        <Text style={text}>
          We've received your interest in {SITE_NAME}. We're building cross-border GBP↔EUR
          payments for businesses on the island of Ireland, and you'll be first to hear when
          we open up.
        </Text>

        <Section style={section}>
          <Heading as="h2" style={h2}>What happens next</Heading>
          <Text style={listItem}>
            <strong style={strong}>1. Authorisation.</strong> We're working through regulatory
            approval. We'll only start onboarding once we're cleared to issue stablecoins and
            provide payment services.
          </Text>
          <Text style={listItem}>
            <strong style={strong}>2. Early-access invite.</strong> When we go live you'll
            receive a personal invite with priority onboarding and early-adopter rates.
          </Text>
          <Text style={listItem}>
            <strong style={strong}>3. Product updates.</strong> Occasional progress notes — no
            spam, no third-party sharing.
          </Text>
        </Section>

        <Hr style={hr} />

        <Text style={text}>
          In the meantime, you can read more about what we're building at{' '}
          <Link href={SITE_URL} style={link}>borderpay.app</Link>, or just reply to this email
          if you have questions — we read every message.
        </Text>

        <Text style={signoff}>— The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InterestConfirmationEmail,
  subject: "You're on the Border Pay early-access list",
  displayName: 'Interest registration confirmation',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#1A3A2A', margin: '0 0 20px', lineHeight: '1.3' }
const h2 = { fontSize: '16px', fontWeight: '700' as const, color: '#1A3A2A', margin: '0 0 12px' }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 16px' }
const section = { backgroundColor: '#f7f5ef', borderRadius: '8px', padding: '20px 22px', margin: '20px 0' }
const listItem = { fontSize: '14px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 10px' }
const strong = { color: '#1A3A2A' }
const link = { color: '#1A3A2A', textDecoration: 'underline' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const signoff = { fontSize: '14px', color: '#55575d', margin: '20px 0 0' }
