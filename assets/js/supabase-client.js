(function () {
  var SUPABASE_URL = 'https://cdqoekcrqohxitbgmrdk.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_OhQqmB3s4e3dA_GZcpO_Fg_0VSPL08-';
  var scriptPromise = null;
  var clientPromise = null;

  function loadSupabaseScript() {
    if (window.supabase) return Promise.resolve();
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return scriptPromise;
  }

  window.getSupabaseClient = function () {
    if (clientPromise) return clientPromise;
    clientPromise = loadSupabaseScript().then(function () {
      return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }).catch(function (err) {
      clientPromise = null;
      console.error('Supabase load error:', err);
      return null;
    });
    return clientPromise;
  };

  window.preloadSupabase = function () {
    return window.getSupabaseClient();
  };
})();
