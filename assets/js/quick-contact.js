/* Short form on /contact/ and /fr/contact/. Same endpoint, same fields and same
   contact_form_submit event as the form in script.js, which this page does not load. */
(function () {
  var form = document.getElementById('quick-contact');
  if (!form) return;
  var fr = document.documentElement.lang === 'fr';
  var box = document.getElementById('cf-error');
  var ok = document.getElementById('cf-success');
  var button = form.querySelector('.cf-submit');

  var CHECKS = [
    ['cf-name', function (v) { return v.trim(); }, fr ? 'Indiquez votre nom.' : 'Please enter your name.'],
    ['cf-email', function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()); }, fr ? 'Indiquez une adresse électronique valide.' : 'Please enter a valid email address.'],
    ['cf-service', function (v) { return v; }, fr ? 'Choisissez un service.' : 'Please select a service.'],
    ['cf-message', function (v) { return v.trim(); }, fr ? 'Écrivez votre message.' : 'Please write your message.']
  ];

  function clearError(el) {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  }

  function showError(el, msg) {
    box.textContent = msg;
    box.style.display = 'block';
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', 'cf-error');
    el.focus();
  }

  function firstProblem() {
    for (var i = 0; i < CHECKS.length; i++) {
      var el = document.getElementById(CHECKS[i][0]);
      clearError(el);
      if (!CHECKS[i][1](el.value)) return [el, CHECKS[i][2]];
    }
    var consent = document.getElementById('cf-consent');
    clearError(consent);
    if (!consent.checked) return [consent, fr ? 'Cochez la case pour que je puisse vous répondre.' : 'Please tick the box so that I can reply to you.'];
    return null;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var hp = document.getElementById('cf-website');
    if (hp && hp.value.trim()) return;
    box.style.display = 'none';
    ok.style.display = 'none';
    var problem = firstProblem();
    if (problem) { showError(problem[0], problem[1]); return; }
    var payload = {
      access_key: form.querySelector('[name="access_key"]').value,
      subject: 'Website Enquiry — Azaël Iloki Website',
      name: document.getElementById('cf-name').value.trim(),
      email: document.getElementById('cf-email').value.trim(),
      phone: '',
      service: document.getElementById('cf-service').value,
      document_type: '(not specified)',
      deadline: '(not specified)',
      volume: '(not specified)',
      message: document.getElementById('cf-message').value.trim(),
      from_name: 'Website Contact Form',
      page: window.location.pathname
    };
    button.disabled = true;
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) { return res.json(); }).then(function (data) {
      if (!data.success) throw new Error(data.message || 'Submit failed');
      form.reset();
      ok.style.display = 'block';
      if (typeof window.siteEvent === 'function') window.siteEvent('contact_form_submit', { type: 'website', page: window.location.pathname });
    }).catch(function () {
      box.textContent = fr
        ? 'L’envoi a échoué. Réessayez, ou écrivez-moi sur WhatsApp — votre message n’est pas perdu.'
        : 'Sending failed. Try again, or message me on WhatsApp — your message is not lost.';
      box.style.display = 'block';
    }).then(function () {
      button.disabled = false;
    });
  });
})();
