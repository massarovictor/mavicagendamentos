-- Adiciona a coluna para a senha criptografada
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS senha_hash TEXT;

-- Cria a função para verificar a senha
CREATE OR REPLACE FUNCTION public.verificar_senha(p_email TEXT, p_senha TEXT)
RETURNS SETOF public.usuarios AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.usuarios
  WHERE email = p_email AND senha_hash = crypt(p_senha, senha_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
