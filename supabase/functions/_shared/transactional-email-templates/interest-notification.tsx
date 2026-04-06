/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Border Pay'

interface InterestNotificationProps {
  name?: string
  email?: string
  company?: string
  location?: string
}

const locationMap: Record<string, string> = {
  'northern-ireland': 'Northern Ireland',
  'ireland': 'Ireland',
  'uk-other': 'UK (other)',
  'other': 'Other',
}

const InterestNotificationEmail = ({ name, email, company, location }: InterestNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New interest registration from {name || 'someone'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Interest Registration</Heading>
        <Text style={text}>Someone has registered their interest in {SITE_NAME}.</Text>

        <Section style={detailsSection}>
          <Text style={label}>Name</Text>
          <Text style={value}>{name || '—'}</Text>

          <Text style={label}>Email</Text>
          <Text style={value}>{email || '—'}</Text>

          <Text style={label}>Company</Text>
          <Text style={value}>{company || '—'}</Text>

          <Text style={label}>Location</Text>
          <Text style={value}>{location ? (locationMap[location] || location) : '—'}</Text>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>This notification was sent from the {SITE_NAME} website interest form.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InterestNotificationEmail,
  subject: (data: Record<string, any>) =>
    `New Interest: ${data.name || 'Unknown'}${data.company ? ` (${data.company})` : ''}`,
  to: 'contact@finteco.co.uk',
  displayName: 'Interest registration notification',
  previewData: { name: 'Jane Smith', email: 'jane@example.com', company: 'Acme Ltd', location: 'northern-ireland' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#1A3A2A', margin: '0 0 16px', borderBottom: '2px solid #1A3A2A', paddingBottom: '10px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const detailsSection = { margin: '16px 0' }
const label = { fontSize: '12px', color: '#999', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '12px 0 2px', fontWeight: '600' as const }
const value = { fontSize: '15px', color: '#1A3A2A', margin: '0 0 8px', fontWeight: '600' as const }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '0' }
