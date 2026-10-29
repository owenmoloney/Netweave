-- Netweave schema + Row Level Security
-- Run in the Supabase SQL Editor (Dashboard → SQL → New query) if you are
-- not using the Supabase CLI.

CREATE TYPE public.node_type AS ENUM (
  'SELF',
  'PERSON',
  'COMPANY',
  'CAREER_BOARD'
);

CREATE TYPE public.relationship_type AS ENUM (
  'met_at_event',
  'colleague',
  'intro_by',
  'client',
  'mentor',
  'recruiter',
  'friend',
  'applied_via',
  'found_listing',
  'board_referral',
  'board_contact',
  'other'
);

CREATE TABLE public.nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type public.node_type NOT NULL,
  notes text,
  pos_x double precision,
  pos_y double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  full_name text,
  job_title text,
  email text,
  linkedin_url text,
  company_id uuid,
  company_name text,
  industry text,
  location text,
  website text
);

CREATE INDEX nodes_user_id_idx ON public.nodes (user_id);
CREATE UNIQUE INDEX nodes_one_self_per_user ON public.nodes (user_id) WHERE type = 'SELF';

CREATE TABLE public.edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.nodes (id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.nodes (id) ON DELETE CASCADE,
  relationship_type public.relationship_type NOT NULL DEFAULT 'other',
  how_met text,
  where_met text,
  why_talked text,
  date_of_interaction timestamptz,
  strength integer NOT NULL DEFAULT 3 CHECK (strength >= 1 AND strength <= 5),
  follow_up_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT edges_no_self_loop CHECK (source_id <> target_id)
);

CREATE INDEX edges_user_id_idx ON public.edges (user_id);
CREATE INDEX edges_source_id_idx ON public.edges (source_id);
CREATE INDEX edges_target_id_idx ON public.edges (target_id);
CREATE UNIQUE INDEX edges_undirected_unique
  ON public.edges (user_id, LEAST(source_id, target_id), GREATEST(source_id, target_id));

-- Keep updated_at current
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER nodes_set_updated_at
  BEFORE UPDATE ON public.nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER edges_set_updated_at
  BEFORE UPDATE ON public.edges
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Client writes: force user_id from the JWT so it cannot be spoofed.
-- Auth signup trigger: auth.uid() is null, so keep the user_id already set.
CREATE OR REPLACE FUNCTION public.set_row_user_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  ELSIF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER nodes_set_user_id
  BEFORE INSERT ON public.nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_user_id();

CREATE TRIGGER edges_set_user_id
  BEFORE INSERT ON public.edges
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_user_id();

-- Self node: position can change; identity fields cannot. Never delete it.
CREATE OR REPLACE FUNCTION public.protect_self_node()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.type = 'SELF' THEN
      RAISE EXCEPTION 'Cannot delete the Self node';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id';
  END IF;

  IF OLD.type = 'SELF' THEN
    IF NEW.type IS DISTINCT FROM OLD.type
      OR NEW.full_name IS DISTINCT FROM OLD.full_name
      OR NEW.job_title IS DISTINCT FROM OLD.job_title
      OR NEW.email IS DISTINCT FROM OLD.email
      OR NEW.linkedin_url IS DISTINCT FROM OLD.linkedin_url
      OR NEW.company_id IS DISTINCT FROM OLD.company_id
      OR NEW.company_name IS DISTINCT FROM OLD.company_name
      OR NEW.industry IS DISTINCT FROM OLD.industry
      OR NEW.location IS DISTINCT FROM OLD.location
      OR NEW.website IS DISTINCT FROM OLD.website
      OR NEW.notes IS DISTINCT FROM OLD.notes
    THEN
      RAISE EXCEPTION 'Cannot edit the Self node';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER nodes_protect_self
  BEFORE UPDATE OR DELETE ON public.nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_self_node();

CREATE OR REPLACE FUNCTION public.prevent_edge_user_id_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot change user_id';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER edges_prevent_user_id_change
  BEFORE UPDATE ON public.edges
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_edge_user_id_change();

-- Edge must connect the owner's nodes, with valid type pairs
CREATE OR REPLACE FUNCTION public.validate_edge_connection()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  source_type public.node_type;
  target_type public.node_type;
  source_user uuid;
  target_user uuid;
BEGIN
  SELECT type, user_id INTO source_type, source_user
  FROM public.nodes WHERE id = NEW.source_id;

  SELECT type, user_id INTO target_type, target_user
  FROM public.nodes WHERE id = NEW.target_id;

  IF source_type IS NULL OR target_type IS NULL THEN
    RAISE EXCEPTION 'Source or target node not found';
  END IF;

  IF source_user IS DISTINCT FROM NEW.user_id
    OR target_user IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Edge must connect your own nodes';
  END IF;

  IF source_type = 'COMPANY' AND target_type = 'COMPANY' THEN
    RAISE EXCEPTION 'Invalid connection between these node types';
  END IF;

  IF source_type = 'CAREER_BOARD' AND target_type = 'CAREER_BOARD' THEN
    RAISE EXCEPTION 'Invalid connection between these node types';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER edges_validate_connection
  BEFORE INSERT OR UPDATE OF source_id, target_id, user_id ON public.edges
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_edge_connection();

-- Create the Self node when a user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.nodes (user_id, type, full_name, pos_x, pos_y)
  VALUES (NEW.id, 'SELF', 'You', 0, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS: the anon key is public. These policies are the security model.
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY nodes_select_own
  ON public.nodes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY nodes_insert_own
  ON public.nodes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY nodes_update_own
  ON public.nodes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY nodes_delete_own
  ON public.nodes FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND type <> 'SELF');

CREATE POLICY edges_select_own
  ON public.edges FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY edges_insert_own
  ON public.edges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY edges_update_own
  ON public.edges FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY edges_delete_own
  ON public.edges FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nodes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edges TO authenticated;
