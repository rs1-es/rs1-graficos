// Se ejecuta de forma síncrona en <head> para evitar el parpadeo del tema.
// Tema guardado o, en la primera visita, el del sistema (sin romper si localStorage no está disponible)
try {
  document.documentElement.dataset.theme = localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
} catch (e) {
  document.documentElement.dataset.theme = 'light';
}
