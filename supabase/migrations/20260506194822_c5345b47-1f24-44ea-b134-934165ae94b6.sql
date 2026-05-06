
-- Create a security-definer function so admins can query interest registrations
-- joined with their notification email status.
CREATE OR REPLACE FUNCTION public.admin_interest_log()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  company text,
  location text,
  registered_at timestamptz,
  email_status text,
  email_sent_at timestamptz,
  email_error text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ir.id,
    ir.name,
    ir.email,
    ir.company,
    ir.location,
    ir.created_at AS registered_at,
    esl.status AS email_status,
    esl.created_at AS email_sent_at,
    esl.error_message AS email_error
  FROM interest_registrations ir
  LEFT JOIN LATERAL (
    SELECT DISTINCT ON (el.message_id) el.status, el.created_at, el.error_message
    FROM email_send_log el
    WHERE el.template_name = 'interest-notification'
      AND el.recipient_email = 'hello@borderpay.app'
      AND el.message_id = ('interest-notify-' || ir.id::text)
    ORDER BY el.message_id, el.created_at DESC
    LIMIT 1
  ) esl ON true
  ORDER BY ir.created_at DESC
  LIMIT 200;
$$;
