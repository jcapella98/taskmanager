let sections = [];
let fileHandle = null;

const sectionsContainer = document.getElementById('sections-container');
const newSectionInput = document.getElementById('new-section-input');
const addSectionBtn = document.getElementById('add-section-btn');
const newFileBtn = document.getElementById('new-file-btn');
const loadFileBtn = document.getElementById('load-file-btn');
const saveFileBtn = document.getElementById('save-file-btn');
const fileInput = document.getElementById('file-input');

// --- Renderizado principal ---
function render() {
  sectionsContainer.innerHTML = '';
  sections.forEach((section, sectionIndex) => {
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('section');

    const header = document.createElement('div');
    header.classList.add('section-header');
    header.innerHTML = `
      <h3>${section.name}</h3>
      <button onclick="deleteSection(${sectionIndex})">🗑️</button>
    `;

    const taskInput = document.createElement('input');
    taskInput.placeholder = 'Nueva tarea...';
    taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && taskInput.value.trim() !== '') {
        section.tasks.push({ text: taskInput.value.trim(), completed: false });
        taskInput.value = '';
        render();
      }
    });

    const taskList = document.createElement('ul');
    taskList.classList.add('task-list');

    section.tasks.forEach((task, taskIndex) => {
      const li = document.createElement('li');
      li.classList.add('task-item');
      if (task.completed) li.classList.add('completed');

      li.innerHTML = `
        <span>${task.text}</span>
        <div class="task-actions">
          <button onclick="toggleTask(${sectionIndex}, ${taskIndex})">✔️</button>
					<button onclick="editTask(${sectionIndex}, ${taskIndex})">✏️</button>
          <button onclick="deleteTask(${sectionIndex}, ${taskIndex})">🗑️</button>
        </div>
      `;

      taskList.appendChild(li);
    });

    sectionDiv.appendChild(header);
    sectionDiv.appendChild(taskInput);
    sectionDiv.appendChild(taskList);

    sectionsContainer.appendChild(sectionDiv);
  });

  updateButtonsState();
}

// --- Crear sección ---
addSectionBtn.addEventListener('click', () => {
  const name = newSectionInput.value.trim();
  if (name) {
    sections.push({ name, tasks: [] });
    newSectionInput.value = '';
    render();
  }
});

// --- Acciones sobre tareas ---
function toggleTask(sectionIndex, taskIndex) {
  sections[sectionIndex].tasks[taskIndex].completed =
    !sections[sectionIndex].tasks[taskIndex].completed;
  render();
}

function editTask(sectionIndex, taskIndex) {
  const task = sections[sectionIndex].tasks[taskIndex];
  const taskItem = event.target.closest('.task-item'); // Encuentra el item de la tarea desde el botón clickeado

  // Crea un input para editar el texto de la tarea
  const taskText = taskItem.querySelector('span');
  const originalText = taskText.textContent;
  
  const input = document.createElement('input');
  input.value = originalText; // Coloca el texto original de la tarea en el input
  taskItem.replaceChild(input, taskText); // Reemplaza el texto con el input

  // Cuando el input pierde el foco o el usuario presiona Enter, guardamos el nuevo texto
  input.addEventListener('blur', () => saveEdit(input, sectionIndex, taskIndex, originalText));
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveEdit(input, sectionIndex, taskIndex, originalText);
    }
  });
}

function saveEdit(input, sectionIndex, taskIndex, originalText) {
  const newText = input.value.trim();
  if (newText && newText !== originalText) {
    sections[sectionIndex].tasks[taskIndex].text = newText;
    render(); // Vuelve a renderizar para actualizar el DOM
  } else {
    // Si el texto no cambió o está vacío, revertimos al texto original
    render();
  }
}



function deleteTask(sectionIndex, taskIndex) {
  sections[sectionIndex].tasks.splice(taskIndex, 1);
  render();
}

function deleteSection(index) {
  if (confirm('¿Eliminar esta sección y todas sus tareas?')) {
    sections.splice(index, 1);
    render();
  }
}

// --- Gestión de archivos locales ---
// Crear nuevo archivo en blanco
newFileBtn.addEventListener('click', () => {
  if (confirm('¿Deseas crear un nuevo archivo? Se perderán los cambios no guardados.')) {
    sections = [];
    fileHandle = null;
    render();
    alert('Nuevo archivo creado. Agrega secciones y guarda cuando quieras.');
  }
});

// Cargar archivo JSON existente
loadFileBtn.addEventListener('click', async () => {
  // Si el navegador soporta el File System Access API
  if ('showOpenFilePicker' in window) {
    try {
      [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'Archivo JSON', accept: { 'application/json': ['.json'] } }]
      });
      const file = await fileHandle.getFile();
      const text = await file.text();
      sections = JSON.parse(text);
      render();
      alert('✅ Archivo cargado correctamente.');
    } catch (err) {
      console.error(err);
    }
  } else {
    // Alternativa para navegadores sin soporte
    fileInput.click();
  }
});

// Cargar mediante input oculto
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      sections = JSON.parse(e.target.result);
      render();
      alert('✅ Archivo cargado correctamente.');
    } catch {
      alert('❌ Error al leer el archivo JSON.');
    }
  };
  reader.readAsText(file);
});

// Guardar archivo JSON (sobrescribe o crea uno nuevo)
saveFileBtn.addEventListener('click', async () => {
  const json = JSON.stringify(sections, null, 2);

  // Si el navegador soporta el File System Access API
  if ('showSaveFilePicker' in window) {
    try {
      if (!fileHandle) {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: 'tareas.json',
          types: [{ description: 'Archivo JSON', accept: { 'application/json': ['.json'] } }]
        });
      }
      const writable = await fileHandle.createWritable();
      await writable.write(json);
      await writable.close();
      alert('💾 Archivo guardado correctamente.');
    } catch (err) {
      console.error(err);
    }
  } else {
    // Descarga como archivo
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tareas.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }
});

function updateButtonsState() {
  const hasData = sections.length > 0;
  newSectionInput.disabled = !true;
  addSectionBtn.disabled = false;
  saveFileBtn.disabled = !hasData;
}

render();
