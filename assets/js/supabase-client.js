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
      /* Exact version and integrity hash (G-01, 2026-11-25): "@2" ran whatever
         2.x release was newest, unchecked. The package's own file, not the
         jsDelivr-minified one, whose hash jsDelivr does not promise to keep.
         To upgrade: change the version AND the hash together, from
         https://data.jsdelivr.com/v1/packages/npm/@supabase/supabase-js@<version>?structure=flat */
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/dist/umd/supabase.js';
      s.integrity = 'sha256-iBavBNmRXbuhiC1vhPC0AtxAJoBjpj2cZtJPUvNxwmM=';
      s.crossOrigin = 'anonymous';
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
