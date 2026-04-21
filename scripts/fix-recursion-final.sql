-- Script para solucionar el error de recursión infinita en las políticas de profiles
-- Ejecuta este script en el SQL Editor de Supabase (https://app.supabase.com)

-- 1. Crear una función de ayuda para obtener el rol del usuario actual de forma segura
-- 'SECURITY DEFINER' hace que la función se ejecute con los permisos del creador (bypass RLS),
-- lo que evita la recursión infinita al consultar la misma tabla que tiene la política.
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Limpiar políticas existentes en la tabla profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Allow all authenticated users full access to profiles" ON profiles;

-- 3. Crear políticas CORRECTAS y NO RECURSIVAS para profiles

-- Los usuarios pueden ver su propio perfil (Sin recursión porque usa auth.uid() directamente)
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Los administradores pueden ver todos los perfiles (Usa la función SECURITY DEFINER para evitar recursión)
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (get_auth_role() = 'admin');

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Los administradores pueden actualizar cualquier perfil
CREATE POLICY "Admins can update profiles" ON profiles
FOR UPDATE USING (get_auth_role() = 'admin');

-- Permitir la creación de perfiles (necesario para el registro de nuevos usuarios)
-- Se usa auth.uid() para asegurar que solo el propio usuario cree su perfil
CREATE POLICY "Allow profile creation" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. (Opcional) Actualizar políticas de la tabla attendees para usar la nueva función
-- Esto hace que las políticas de attendees sean más eficientes y consistentes
DROP POLICY IF EXISTS "Allow authenticated staff to read attendees" ON attendees;
CREATE POLICY "Allow authenticated staff to read attendees" ON attendees
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    get_auth_role() IN ('admin', 'editor')
  )
);

DROP POLICY IF EXISTS "Allow admins to update attendees" ON attendees;
CREATE POLICY "Allow admins to update attendees" ON attendees
FOR UPDATE USING (
  auth.role() = 'authenticated' AND get_auth_role() = 'admin'
);

DROP POLICY IF EXISTS "Allow admins to delete attendees" ON attendees;
CREATE POLICY "Allow admins to delete attendees" ON attendees
FOR DELETE USING (
  auth.role() = 'authenticated' AND get_auth_role() = 'admin'
);

-- Verificar que se crearon las políticas
SELECT 
  tablename, 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'attendees')
ORDER BY tablename, policyname;
