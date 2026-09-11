// ============================================================
// VEXO HUB · Cliente Supabase + Helpers
// Idempotente: pode ser carregado várias vezes sem quebrar
// ============================================================

// ⚠️ Só declara uma vez (evita "already declared")
if (typeof window.SUPABASE_URL === 'undefined') {
  window.SUPABASE_URL = 'https://stibecxkiupfbarftftd.supabase.co';
}
if (typeof window.SUPABASE_ANON_KEY === 'undefined') {
  window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aWJlY3hraXVwZmJhcmZ0ZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzE4NDMsImV4cCI6MjEwNDYwNzg0M30.hsaGJAs7HQfI3tssAI1ONa8TtbCVtqwNB1j-7-z7BeI';
}

// Cliente global (só cria se ainda não existir)
if (!window.sb) {
  window.sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

// ------------------------------------------------------------
// Cache do profile do usuário logado
// ------------------------------------------------------------
let _profileCache = null;

/**
 * Retorna o profile do usuário logado (com cache).
 * Se não estiver logado, redireciona pro login.
 */
async function getProfile(forceReload = false) {
  if (_profileCache && !forceReload) return _profileCache;

  const { data: { user }, error: authErr } = await sb.auth.getUser();
  if (authErr || !user) {
    console.warn('[auth] Sem usuário logado. Redirecionando...');
    window.location.href = 'login.html';
    return null;
  }

  const { data: profile, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error('[auth] Profile não encontrado:', error);
    return null;
  }

  // Guarda também o email do auth
  profile.email = user.email;
  _profileCache = profile;
  return profile;
}

/**
 * Verifica se o usuário logado tem uma permissão.
 * Uso: await hasPermission('usuarios')
 */
async function hasPermission(permission) {
  const profile = await getProfile();
  if (!profile) return false;
  if (profile.role === 'ADMINISTRADOR') return true; // admin sempre pode tudo
  return Array.isArray(profile.permissoes) && profile.permissoes.includes(permission);
}

/**
 * Verifica se é admin. Redireciona se não for.
 */
async function requireAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== 'ADMINISTRADOR') {
    alert('Acesso restrito a administradores.');
    window.location.href = 'login.html';
    return null;
  }
  return profile;
}

/**
 * Logout
 */
async function logout() {
  await sb.auth.signOut();
  sessionStorage.clear();
  localStorage.removeItem('vexo_ultimo_acesso');
  window.location.href = 'login.html';
}

// Expõe globalmente
window.getProfile    = getProfile;
window.hasPermission = hasPermission;
window.requireAdmin  = requireAdmin;
window.logout        = logout;
