(() => {
  const trigger = document.querySelector('.intro-video-trigger');
  const dialog = document.querySelector('#intro-video-dialog');
  const close = dialog?.querySelector('.intro-video-close');
  const video = dialog?.querySelector('video');
  if (!trigger || !dialog || !close || !video) return;

  trigger.addEventListener('click', () => {
    if (!video.src) video.src = '/media/democratising-intro-16x9.mp4';
    dialog.showModal();
    video.play().catch(() => {});
  });

  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    video.pause();
    video.currentTime = 0;
    trigger.focus();
  });
})();
