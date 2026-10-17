(() => {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('contact-form-status');
  let statusKey = '';
  const labels = {
    ru: {name:'Имя',email:'Email для ответа',subject:'Сообщение с сайта-портфолио',opened:'Запрошено открытие почтового приложения. Отправьте письмо в нём. Если оно не открылось, скопируйте текст сообщения и напишите на pr110oat18@gmail.com.',copied:'Текст сообщения скопирован. Вставьте его в письмо на pr110oat18@gmail.com.',copyFailed:'Не удалось скопировать текст. Выделите сообщение вручную и напишите на pr110oat18@gmail.com.',required:'Пожалуйста, заполните это поле.'},
    en: {name:'Name',email:'Reply email',subject:'Message from the portfolio website',opened:'Opening your email app was requested. Send the draft from there. If it did not open, copy the message and email pr110oat18@gmail.com.',copied:'Message copied. Paste it into an email to pr110oat18@gmail.com.',copyFailed:'Could not copy the text. Select your message manually and email pr110oat18@gmail.com.',required:'Please fill out this field.'}
  };
  const copy = () => labels[document.documentElement.lang === 'en' ? 'en' : 'ru'];
  const showStatus = key => {statusKey=key;status.textContent=copy()[key] || ''};
  const fields = ['name','email','message'].map(name=>form.elements.namedItem(name));
  function validate() {
    for (const field of fields) field.setCustomValidity(field.value.trim() ? '' : copy().required);
    return form.reportValidity();
  }
  function draft() {
    const [name,email,message] = fields.map(field=>field.value.trim());
    return {
      subject: `${copy().subject}: ${name}`,
      body: `${copy().name}: ${name}\n${copy().email}: ${email}\n\n${message}`
    };
  }
  function translate() {
    const lang = document.documentElement.lang === 'en' ? 'en' : 'ru';
    form.querySelectorAll('[data-placeholder-ru]').forEach(field=>{field.placeholder=field.dataset[lang === 'en' ? 'placeholderEn' : 'placeholderRu']});
    fields.forEach(field=>field.setCustomValidity(''));
    if(statusKey) showStatus(statusKey);
  }
  fields.forEach(field=>field.addEventListener('input',()=>{field.setCustomValidity('');showStatus('')}));
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!validate()) return;
    const {subject,body}=draft();
    showStatus('opened');
    window.location.href=`mailto:pr110oat18@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
  document.getElementById('copy-message').addEventListener('click',async()=>{
    if(!validate()) return;
    const {subject,body}=draft();
    try {await navigator.clipboard.writeText(`${subject}\n\n${body}`);showStatus('copied')}
    catch {showStatus('copyFailed')}
  });
  document.addEventListener('portfolio:languagechange',translate);
  translate();
})();
