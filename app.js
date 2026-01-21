const $ = s => document.querySelector(s);
const today = new Date().toDateString();

// Reset checklist daily
if(localStorage.lastDay !== today){
  document.querySelectorAll('[data-key]').forEach(c=>localStorage[c.dataset.key]='false');
    localStorage.lastDay = today;
    }

    // Load checklist
    const boxes = document.querySelectorAll('[data-key]');
    boxes.forEach(b=>{
      b.checked = localStorage[b.dataset.key] === 'true';
        b.onchange = ()=> localStorage[b.dataset.key] = b.checked;
        });

        // Weight → calories (UK units)
        const w = $('#weight');
        const cal = $('#calories');
        const calc = kg => Math.round(kg*40 + 400);

        w.value = localStorage.weight || '';
        function update(){
          if(w.value){
              const base = calc(+w.value);
                  const extra = +localStorage.extra || 0;
                      cal.textContent = base + extra;
                          localStorage.weight = w.value;
                            }
                            }
                            w.oninput = update; update();

                            $('#addCalories').onclick = ()=>{
                              localStorage.extra = (+localStorage.extra||0) + 200;
                                update();
                                };

                                // Workout notes
                                $('#workout').value = localStorage.workout || '';
                                $('#workout').oninput = e => localStorage.workout = e.target.value;

                                // Weak-day helper
                                $('#weak').onclick = ()=>{
                                  alert('Normal day. Eat something, reduce reps, or rest. Progress continues.');
                                  };

                                  // Status
                                  $('#status').textContent = `Last opened: ${today}`;

                                  // Register service worker for install/offline
                                  if('serviceWorker' in navigator){
                                    navigator.serviceWorker.register('sw.js');
                                    }