// ============================================================
// VEXO HUB · Cliente Supabase + Helpers (idempotente)
// Pode ser carregado múltiplas vezes sem quebrar
// ============================================================
(function () {
  'use strict';

  // 🔒 Guard: se já foi carregado nesta página, não faz nada
  if (window._vexoClientLoaded) {
    console.log('ℹ️ [VEXO] supabase-client.js já carregado, ignorando duplicata');
    return;
  }
  window._vexoClientLoaded = true;

  // ------------------------------------------------------------
  // 1. CONFIGURAÇÃO
  // ------------------------------------------------------------
  const SUPABASE_URL = 'https://stibecxkiupfbarftftd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aWJlY3hraXVwZmJhcmZ0ZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzE4NDMsImV4cCI6MjEwNDYwNzg0M30.hsaGJAs7HQfI3tssAI1ONa8TtbCVtqwNB1j-7-z7BeI';

  // Verifica se o SDK do Supabase foi carregado antes
  if (typeof supabase === 'undefined') {
    console.error('❌ [VEXO] SDK do Supabase não encontrado. Adicione o <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"> antes deste arquivo.');
    return;
  }

  // ------------------------------------------------------------
  // 2. CLIENTE GLOBAL
  // ------------------------------------------------------------
  if (!window.sb) {
    window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ [VEXO] Cliente Supabase inicializado');
  }

  // ------------------------------------------------------------
  // 3. CACHE DO PROFILE
  // ------------------------------------------------------------
  let _profileCache = null;

  // ------------------------------------------------------------
  // 4. HELPERS DE AUTENTICAÇÃO
  // ------------------------------------------------------------

  /**
   * Retorna o profile do usuário logado (com cache).
   * Se não estiver logado, redireciona pro login.
   */
  async function getProfile(forceReload = false) {
    if (_profileCache && !forceReload) return _profileCache;

    const { data: { user }, error: authErr } = await window.sb.auth.getUser();
    if (authErr || !user) {
      console.warn('[VEXO][auth] Sem usuário logado. Redirecionando para login...');
      window.location.href = 'login.html';
      return null;
    }

    const { data: profile, error } = await window.sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.error('[VEXO][auth] Profile não encontrado:', error);
      return null;
    }

    // Injeta o email do auth no objeto retornado
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
    if (profile.role === 'ADMINISTRADOR') return true;
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
   * Limpa o cache local do profile (útil após edição de perfil).
   */
  function limparCacheProfile() {
    _profileCache = null;
  }

  /**
   * Logout completo.
   */
  async function logout() {
    try {
      await window.sb.auth.signOut();
    } catch (e) {
      console.warn('[VEXO] Erro ao encerrar sessão:', e);
    }
    sessionStorage.clear();
    localStorage.removeItem('vexo_ultimo_acesso');
    window.location.href = 'login.html';
  }

  // ------------------------------------------------------------
  // 5. EXPOSIÇÃO GLOBAL
  // ------------------------------------------------------------
  window.getProfile        = getProfile;
  window.hasPermission     = hasPermission;
  window.requireAdmin      = requireAdmin;
  window.limparCacheProfile = limparCacheProfile;
  window.logout            = logout;

  console.log('✅ [VEXO] supabase-client.js carregado com sucesso');
})();
