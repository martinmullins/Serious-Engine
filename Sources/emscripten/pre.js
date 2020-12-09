(function() {
  if (1) { // hide emscripten default elements
    document.body.childNodes.forEach(c => {
      // center loading bar
      if (!c.id && c.className === 'emscripten') {
        c.id = 'loading-bar';
        c.style.width = '300px';
        c.style.height = '20px';
        c.style.position = 'fixed';
        c.style.zIndex = 100;  
        c.style.top = '50%';  
        c.style.left = '50%';  
        c.style.margin = '-10px 0 0 -150px';  
        return;
      }

      // hide all other UI
      if (c.style) {
        c.style.display = 'none';
      }
    });

    // hide the loading bar after finished
    Module['onRuntimeInitialized'] = () => {
      document.querySelector('#loading-bar').style.display = 'none';
    };
  }
  const canv = document.querySelector('#canvas');
  document.body.appendChild(canv);
  document.body.style.width = '100vw';
  document.body.style.height = '100vh';
  canv.width = document.body.clientWidth;
  canv.height = document.body.clientHeight;
  window.addEventListener('resize', () => {
    console.log('resize');
    canv.width = document.body.clientWidth;
    canv.height = document.body.clientHeight;
  });
})();