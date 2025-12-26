-- Function:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profile (id, username, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'username', '/default_avatar.svg');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Trigger:
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
