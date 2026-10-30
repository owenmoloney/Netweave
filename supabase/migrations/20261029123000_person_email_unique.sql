-- One PERSON per email per account so Google import cannot duplicate contacts.
CREATE UNIQUE INDEX IF NOT EXISTS nodes_person_email_unique
  ON public.nodes (user_id, lower(email))
  WHERE type = 'PERSON' AND email IS NOT NULL;
