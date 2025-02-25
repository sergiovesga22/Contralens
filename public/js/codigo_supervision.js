document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu toggle
  document.querySelector('.mobile-menu-toggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('active');
  });

  // Sistema de notificaciones
  window.mostrarNotificacion = (mensaje, tipo = 'success', duracion = 3000) => {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
      notificacion.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notificacion.remove(), 300);
    }, duracion);
  };

  // Gráfico de progreso con Chart.js
  const initProgressChart = () => {
    const ctx = document.getElementById('progressChart');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completado', 'Pendiente'],
        datasets: [{
          data: [70, 30],
          backgroundColor: ['#4CAF50', '#E0E0E0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // El contenedor tiene altura fija
        animation: { duration: 0 }, // Desactivar animación para evitar redibujos continuos
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { enabled: true }
        }
      }
    });
  };
  initProgressChart();

  // Validación mejorada de NIT
  const validarNIT = (nit) => {
    const regex = /^[0-9]{9}-[0-9]$/;
    if (!regex.test(nit)) throw new Error('Formato NIT inválido. Debe ser: 123456789-0');
  };

  // Buscador global con debounce
  const globalSearch = document.getElementById('globalSearch');
  let timeoutBusqueda;
  globalSearch && globalSearch.addEventListener('input', () => {
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(() => {
      const query = globalSearch.value.toLowerCase();
      const filteredContratos = contratos.filter(c =>
        c.numeroContrato.toLowerCase().includes(query) ||
        c.nombreContratista.toLowerCase().includes(query) ||
        c.objetoContrato.toLowerCase().includes(query)
      );
      renderFilteredContratos(filteredContratos);
    }, 300);
  });

  // Variables para contratos
  let contratos = JSON.parse(localStorage.getItem('contratos')) || [];
  let editIndex = -1;

  const navItems = document.querySelectorAll('.sidebar ul li');
  const sections = document.querySelectorAll('.section');
  const totalContratosEl = document.getElementById('totalContratos');
  const contratosActivosEl = document.getElementById('contratosActivos');
  const contratosInactivosEl = document.getElementById('contratosInactivos');
  const tablaContratos = document.querySelector('#tablaContratos tbody');
  const tarjetasContratos = document.getElementById('tarjetasContratos');
  const btnAgregarContrato = document.getElementById('btnAgregarContrato');

  const modalAgregarContrato = document.getElementById('modalAgregarContrato');
  const closeModal = document.querySelector('.close-modal');
  const contratoForm = document.getElementById('contratoForm');
  const modalTitle = document.getElementById('modalTitle');

  const adicionesContainer = document.getElementById('adicionesContainer');
  const prorrogasContainer = document.getElementById('prorrogasContainer');
  const polizaContainer = document.getElementById('polizaContainer');
  const btnAgregarAdicion = document.getElementById('btnAgregarAdicion');
  const btnAgregarProrroga = document.getElementById('btnAgregarProrroga');
  const btnAgregarPoliza = document.getElementById('btnAgregarPoliza');

  const supervisionForm = document.getElementById('supervisionForm');

  /* Navegación entre secciones */
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      item.classList.add('active');
      const sectionId = item.getAttribute('data-section');
      document.getElementById(sectionId).classList.add('active');
    });
  });

  /* Apertura/Cierre del Modal */
  btnAgregarContrato.addEventListener('click', () => {
    editIndex = -1;
    modalTitle.textContent = "Agregar Nuevo Contrato";
    contratoForm.reset();
    clearDynamicFields();
    modalAgregarContrato.style.display = 'block';
  });

  closeModal.addEventListener('click', () => {
    modalAgregarContrato.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    // Cierra el modal si se hace clic fuera del contenido del modal
    if (e.target == modalAgregarContrato) {
      modalAgregarContrato.style.display = 'none';
    }
  });

  /* Funciones para campos dinámicos */
  function clearDynamicFields() {
    adicionesContainer.innerHTML = "";
    prorrogasContainer.innerHTML = "";
    polizaContainer.innerHTML = "";
  }

  function crearCampoDinamico(container, nameAttr, placeholderText, type = 'text') {
    const div = document.createElement('div');
    div.classList.add('dynamic-field');
    
    const input = document.createElement('input');
    input.type = type;
    input.name = nameAttr;
    input.placeholder = placeholderText;
    input.required = true;
    
    if (type === 'number') {
      input.min = 0;
      input.step = "any";
      input.addEventListener('input', (e) => {
        if (!/^\d*\.?\d*$/.test(e.target.value)) {
          e.target.setCustomValidity('Solo números permitidos');
          e.target.reportValidity();
        } else {
          e.target.setCustomValidity('');
        }
      });
    }
    
    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.className = 'btn-eliminar-dynamic';
    btnEliminar.innerHTML = '<i class="fas fa-times"></i>';
    
    btnEliminar.addEventListener('click', () => {
      container.removeChild(div);
      actualizarValorFinal();
    });
    
    div.appendChild(input);
    div.appendChild(btnEliminar);
    container.appendChild(div);
    
    input.addEventListener('input', actualizarValorFinal);
  }

  btnAgregarAdicion.addEventListener('click', () => {
    crearCampoDinamico(adicionesContainer, 'adiciones', 'Valor Adición');
  });

  btnAgregarProrroga.addEventListener('click', () => {
    crearCampoDinamico(prorrogasContainer, 'prorrogas', 'Detalle Prórroga');
  });

  btnAgregarPoliza.addEventListener('click', () => {
    crearCampoDinamico(polizaContainer, 'poliza', 'Modificación Póliza');
  });

  function actualizarValorFinal() {
    // Aquí puedes implementar la lógica para actualizar el valor final según las adiciones o prórrogas.
  }

  /* Actualizar Dashboard */
  function updateDashboard() {
    totalContratosEl.textContent = contratos.length;
    const activos = contratos.filter(c => c.estado === 'activo' || parseFloat(c.valorFinal) > 0).length;
    const inactivos = contratos.length - activos;
    if (contratosActivosEl) contratosActivosEl.textContent = activos;
    if (contratosInactivosEl) contratosInactivosEl.textContent = inactivos;
  }

  /* Renderizar Contratos en Vista de Tabla */
  function renderTablaContratos() {
    tablaContratos.innerHTML = "";
    contratos.forEach((contrato, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td aria-label="Convenio">${sanitizarEntrada(contrato.convenio)}</td>
        <td aria-label="Número">${sanitizarEntrada(contrato.numeroContrato)}</td>
        <td aria-label="Contratista">${sanitizarEntrada(contrato.nombreContratista)}</td>
        <td aria-label="Representante">${sanitizarEntrada(contrato.representanteLegal)}</td>
        <td aria-label="NIT">${sanitizarEntrada(contrato.nitEmpresa)}</td>
        <td aria-label="Objeto">${sanitizarEntrada(contrato.objetoContrato)}</td>
        <td aria-label="Valor Inicial">${contrato.valorInicial}</td>
        <td aria-label="Adiciones">${contrato.adiciones.join(', ')}</td>
        <td aria-label="Valor Final">${contrato.valorFinal}</td>
        <td aria-label="Fecha Suscripción">${contrato.fechaSuscripcion}</td>
        <td aria-label="Fecha Inicio">${contrato.fechaInicio}</td>
        <td aria-label="Prórrogas">${contrato.prorrogas.join(', ')}</td>
        <td aria-label="Fecha Final">${contrato.fechaFinal}</td>
        <td aria-label="Póliza">${contrato.poliza.join(', ')}</td>
        <td aria-label="Estado">${contrato.estado || 'N/A'}</td>
        <td aria-label="Acciones">
          <button class="btn-editar" data-index="${index}" aria-label="Editar contrato">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-eliminar" data-index="${index}" aria-label="Eliminar contrato">
            <i class="fas fa-trash"></i>
          </button>
          <button class="btn-doc" data-index="${index}" aria-label="Gestión Documental">
            <i class="fas fa-folder-open"></i>
          </button>
        </td>
      `;
      tablaContratos.appendChild(row);
    });
  }

  // Función de sanitización para evitar inyección de HTML
  function sanitizarEntrada(texto) {
    return texto.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Guardar en localStorage */
  function guardarLocalStorage() {
    localStorage.setItem('contratos', JSON.stringify(contratos));
  }

  /* Envío del Formulario de Contrato */
  contratoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevoContrato = {
      convenio: document.getElementById('convenio').value.trim(),
      numeroContrato: document.getElementById('numeroContrato').value.trim(),
      nombreContratista: document.getElementById('nombreContratista').value.trim(),
      representanteLegal: document.getElementById('representanteLegal').value.trim(),
      nitEmpresa: document.getElementById('nitEmpresa').value.trim(),
      objetoContrato: document.getElementById('objetoContrato').value.trim(),
      valorInicial: document.getElementById('valorInicial').value.trim(),
      adiciones: Array.from(adicionesContainer.querySelectorAll('input')).map(input => input.value.trim()),
      valorFinal: document.getElementById('valorFinal').value.trim(),
      fechaSuscripcion: document.getElementById('fechaSuscripcion').value,
      fechaInicio: document.getElementById('fechaInicio').value,
      prorrogas: Array.from(prorrogasContainer.querySelectorAll('input')).map(input => input.value.trim()),
      fechaFinal: document.getElementById('fechaFinal').value,
      poliza: Array.from(polizaContainer.querySelectorAll('input')).map(input => input.value.trim()),
      estado: document.getElementById('filterEstado') ? document.getElementById('filterEstado').value : 'activo'
    };

    if (new Date(nuevoContrato.fechaSuscripcion) >= new Date(nuevoContrato.fechaInicio)) {
      alert('La fecha de suscripción debe ser anterior a la fecha de inicio.');
      return;
    }

    try {
      validarNIT(nuevoContrato.nitEmpresa);
      
      if (editIndex > -1) {
        contratos[editIndex] = nuevoContrato;
      } else {
        contratos.push(nuevoContrato);
      }
  
      // Si deseas integrar con el backend (MySQL), podrías enviar una petición fetch aquí.
      // Ejemplo:
      // fetch('/api/contratos', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(nuevoContrato)
      // })
      // .then(response => response.json())
      // .then(data => { console.log(data); })
      // .catch(error => console.error(error));
      
      guardarLocalStorage();
      renderTablaContratos();
      renderTarjetasContratos();
      updateDashboard();
      contratoForm.reset();
      clearDynamicFields();
      modalAgregarContrato.style.display = 'none';
      mostrarNotificacion('Contrato guardado exitosamente!');
    } catch (error) {
      mostrarNotificacion(error.message, 'error');
    }
  });

  /* Manejo de botones de edición, eliminación y gestión documental */
  document.querySelector('#tablaContratos').addEventListener('click', (e) => {
    const target = e.target;
    const index = target.getAttribute('data-index');
    if (target.closest('.btn-editar')) {
      const contrato = contratos[index];
      editIndex = index;
      modalTitle.textContent = "Editar Contrato";
      document.getElementById('convenio').value = contrato.convenio;
      document.getElementById('numeroContrato').value = contrato.numeroContrato;
      document.getElementById('nombreContratista').value = contrato.nombreContratista;
      document.getElementById('representanteLegal').value = contrato.representanteLegal;
      document.getElementById('nitEmpresa').value = contrato.nitEmpresa;
      document.getElementById('objetoContrato').value = contrato.objetoContrato;
      document.getElementById('valorInicial').value = contrato.valorInicial;
      document.getElementById('valorFinal').value = contrato.valorFinal;
      document.getElementById('fechaSuscripcion').value = contrato.fechaSuscripcion;
      document.getElementById('fechaInicio').value = contrato.fechaInicio;
      document.getElementById('fechaFinal').value = contrato.fechaFinal;
      
      clearDynamicFields();
      contrato.adiciones.forEach(val => {
        crearCampoDinamico(adicionesContainer, 'adiciones', 'Valor Adición');
        adicionesContainer.lastElementChild.querySelector('input').value = val;
      });
      contrato.prorrogas.forEach(val => {
        crearCampoDinamico(prorrogasContainer, 'prorrogas', 'Detalle Prórroga');
        prorrogasContainer.lastElementChild.querySelector('input').value = val;
      });
      contrato.poliza.forEach(val => {
        crearCampoDinamico(polizaContainer, 'poliza', 'Modificación Póliza');
        polizaContainer.lastElementChild.querySelector('input').value = val;
      });
      
      modalAgregarContrato.style.display = 'block';
    }

    if (target.closest('.btn-eliminar')) {
      if (confirm("¿Está seguro de eliminar este contrato?")) {
        contratos.splice(index, 1);
        guardarLocalStorage();
        renderTablaContratos();
        renderTarjetasContratos();
        updateDashboard();
      }
    }

    if (target.closest('.btn-doc')) {
      alert("Redirigiendo a Gestión Documental...");
      // Aquí podrías abrir un modal o redirigir a la sección de gestión documental.
    }
  });

  /* Buscador Global */
  globalSearch.addEventListener('input', () => {
    const query = globalSearch.value.toLowerCase();
    const filteredContratos = contratos.filter(c => {
      return c.numeroContrato.toLowerCase().includes(query) ||
             c.nombreContratista.toLowerCase().includes(query) ||
             c.objetoContrato.toLowerCase().includes(query);
    });
    renderFilteredContratos(filteredContratos);
  });

  function renderFilteredContratos(filtered) {
    tablaContratos.innerHTML = "";
    filtered.forEach((contrato, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${contrato.convenio}</td>
        <td>${contrato.numeroContrato}</td>
        <td>${contrato.nombreContratista}</td>
        <td>${contrato.representanteLegal}</td>
        <td>${contrato.nitEmpresa}</td>
        <td>${contrato.objetoContrato}</td>
        <td>${contrato.valorInicial}</td>
        <td>${contrato.adiciones.join(', ')}</td>
        <td>${contrato.valorFinal}</td>
        <td>${contrato.fechaSuscripcion}</td>
        <td>${contrato.fechaInicio}</td>
        <td>${contrato.prorrogas.join(', ')}</td>
        <td>${contrato.fechaFinal}</td>
        <td>${contrato.poliza.join(', ')}</td>
        <td>${contrato.estado || 'N/A'}</td>
        <td>
          <button class="btn-editar" data-index="${index}">Editar</button>
          <button class="btn-eliminar" data-index="${index}">Eliminar</button>
          <button class="btn-doc" data-index="${index}">Gestión Documental</button>
        </td>
      `;
      tablaContratos.appendChild(row);
    });
  }

  /* Alternar Vista: Tabla / Tarjeta */
  document.getElementById('tablaView').addEventListener('click', () => {
    document.getElementById('tablaContratos').style.display = '';
    tarjetasContratos.style.display = 'none';
  });

  document.getElementById('tarjetaView').addEventListener('click', () => {
    document.getElementById('tablaContratos').style.display = 'none';
    tarjetasContratos.style.display = 'flex';
    renderTarjetasContratos();
  });

  function renderTarjetasContratos() {
    tarjetasContratos.innerHTML = "";
    contratos.forEach((contrato, index) => {
      const card = document.createElement('div');
      card.classList.add('card');
      card.innerHTML = `
        <h3>${contrato.numeroContrato}</h3>
        <p><strong>Contratista:</strong> ${contrato.nombreContratista}</p>
        <p><strong>Estado:</strong> ${contrato.estado || 'N/A'}</p>
        <button class="btn-editar" data-index="${index}">Editar</button>
        <button class="btn-eliminar" data-index="${index}">Eliminar</button>
      `;
      tarjetasContratos.appendChild(card);
    });
  }

  /* Guardar en localStorage */
  function guardarLocalStorage() {
    localStorage.setItem('contratos', JSON.stringify(contratos));
  }

  /* Envío del Formulario de Contrato */
  contratoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevoContrato = {
      convenio: document.getElementById('convenio').value.trim(),
      numeroContrato: document.getElementById('numeroContrato').value.trim(),
      nombreContratista: document.getElementById('nombreContratista').value.trim(),
      representanteLegal: document.getElementById('representanteLegal').value.trim(),
      nitEmpresa: document.getElementById('nitEmpresa').value.trim(),
      objetoContrato: document.getElementById('objetoContrato').value.trim(),
      valorInicial: document.getElementById('valorInicial').value.trim(),
      adiciones: Array.from(adicionesContainer.querySelectorAll('input')).map(input => input.value.trim()),
      valorFinal: document.getElementById('valorFinal').value.trim(),
      fechaSuscripcion: document.getElementById('fechaSuscripcion').value,
      fechaInicio: document.getElementById('fechaInicio').value,
      prorrogas: Array.from(prorrogasContainer.querySelectorAll('input')).map(input => input.value.trim()),
      fechaFinal: document.getElementById('fechaFinal').value,
      poliza: Array.from(polizaContainer.querySelectorAll('input')).map(input => input.value.trim()),
      estado: document.getElementById('filterEstado') ? document.getElementById('filterEstado').value : 'activo'
    };

    if (new Date(nuevoContrato.fechaSuscripcion) >= new Date(nuevoContrato.fechaInicio)) {
      alert('La fecha de suscripción debe ser anterior a la fecha de inicio.');
      return;
    }

    try {
      validarNIT(nuevoContrato.nitEmpresa);
      
      if (editIndex > -1) {
        contratos[editIndex] = nuevoContrato;
      } else {
        contratos.push(nuevoContrato);
      }
  
      // Si deseas integrar con el backend, aquí puedes enviar los datos con fetch:
      /*
      fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoContrato)
      })
      .then(response => response.json())
      .then(data => console.log('Contrato guardado en MySQL:', data))
      .catch(error => console.error(error));
      */
  
      guardarLocalStorage();
      renderTablaContratos();
      renderTarjetasContratos();
      updateDashboard();
      contratoForm.reset();
      clearDynamicFields();
      modalAgregarContrato.style.display = 'none';
      mostrarNotificacion('Contrato guardado exitosamente!');
    } catch (error) {
      mostrarNotificacion(error.message, 'error');
    }
  });

  /* Manejo de botones de edición, eliminación y gestión documental */
  document.querySelector('#tablaContratos').addEventListener('click', (e) => {
    const target = e.target;
    const index = target.getAttribute('data-index');
    if (target.closest('.btn-editar')) {
      const contrato = contratos[index];
      editIndex = index;
      modalTitle.textContent = "Editar Contrato";
      document.getElementById('convenio').value = contrato.convenio;
      document.getElementById('numeroContrato').value = contrato.numeroContrato;
      document.getElementById('nombreContratista').value = contrato.nombreContratista;
      document.getElementById('representanteLegal').value = contrato.representanteLegal;
      document.getElementById('nitEmpresa').value = contrato.nitEmpresa;
      document.getElementById('objetoContrato').value = contrato.objetoContrato;
      document.getElementById('valorInicial').value = contrato.valorInicial;
      document.getElementById('valorFinal').value = contrato.valorFinal;
      document.getElementById('fechaSuscripcion').value = contrato.fechaSuscripcion;
      document.getElementById('fechaInicio').value = contrato.fechaInicio;
      document.getElementById('fechaFinal').value = contrato.fechaFinal;
      
      clearDynamicFields();
      contrato.adiciones.forEach(val => {
        crearCampoDinamico(adicionesContainer, 'adiciones', 'Valor Adición');
        adicionesContainer.lastElementChild.querySelector('input').value = val;
      });
      contrato.prorrogas.forEach(val => {
        crearCampoDinamico(prorrogasContainer, 'prorrogas', 'Detalle Prórroga');
        prorrogasContainer.lastElementChild.querySelector('input').value = val;
      });
      contrato.poliza.forEach(val => {
        crearCampoDinamico(polizaContainer, 'poliza', 'Modificación Póliza');
        polizaContainer.lastElementChild.querySelector('input').value = val;
      });
      
      modalAgregarContrato.style.display = 'block';
    }

    if (target.closest('.btn-eliminar')) {
      if (confirm("¿Está seguro de eliminar este contrato?")) {
        contratos.splice(index, 1);
        guardarLocalStorage();
        renderTablaContratos();
        renderTarjetasContratos();
        updateDashboard();
      }
    }

    if (target.closest('.btn-doc')) {
      alert("Redirigiendo a Gestión Documental...");
      // Aquí puedes implementar la lógica para abrir un modal o redirigir a la sección de gestión documental.
    }
  });

  /* Buscador Global */
  globalSearch.addEventListener('input', () => {
    const query = globalSearch.value.toLowerCase();
    const filteredContratos = contratos.filter(c => {
      return c.numeroContrato.toLowerCase().includes(query) ||
             c.nombreContratista.toLowerCase().includes(query) ||
             c.objetoContrato.toLowerCase().includes(query);
    });
    renderFilteredContratos(filteredContratos);
  });

  function renderFilteredContratos(filtered) {
    tablaContratos.innerHTML = "";
    filtered.forEach((contrato, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${contrato.convenio}</td>
        <td>${contrato.numeroContrato}</td>
        <td>${contrato.nombreContratista}</td>
        <td>${contrato.representanteLegal}</td>
        <td>${contrato.nitEmpresa}</td>
        <td>${contrato.objetoContrato}</td>
        <td>${contrato.valorInicial}</td>
        <td>${contrato.adiciones.join(', ')}</td>
        <td>${contrato.valorFinal}</td>
        <td>${contrato.fechaSuscripcion}</td>
        <td>${contrato.fechaInicio}</td>
        <td>${contrato.prorrogas.join(', ')}</td>
        <td>${contrato.fechaFinal}</td>
        <td>${contrato.poliza.join(', ')}</td>
        <td>${contrato.estado || 'N/A'}</td>
        <td>
          <button class="btn-editar" data-index="${index}">Editar</button>
          <button class="btn-eliminar" data-index="${index}">Eliminar</button>
          <button class="btn-doc" data-index="${index}">Gestión Documental</button>
        </td>
      `;
      tablaContratos.appendChild(row);
    });
  }

  /* Alternar Vista: Tabla / Tarjeta */
  document.getElementById('tablaView').addEventListener('click', () => {
    document.getElementById('tablaContratos').style.display = '';
    tarjetasContratos.style.display = 'none';
  });

  document.getElementById('tarjetaView').addEventListener('click', () => {
    document.getElementById('tablaContratos').style.display = 'none';
    tarjetasContratos.style.display = 'flex';
    renderTarjetasContratos();
  });

  function renderTarjetasContratos() {
    tarjetasContratos.innerHTML = "";
    contratos.forEach((contrato, index) => {
      const card = document.createElement('div');
      card.classList.add('card');
      card.innerHTML = `
        <h3>${contrato.numeroContrato}</h3>
        <p><strong>Contratista:</strong> ${contrato.nombreContratista}</p>
        <p><strong>Estado:</strong> ${contrato.estado || 'N/A'}</p>
        <button class="btn-editar" data-index="${index}">Editar</button>
        <button class="btn-eliminar" data-index="${index}">Eliminar</button>
      `;
      tarjetasContratos.appendChild(card);
    });
  }

  /* Guardar en localStorage */
  function guardarLocalStorage() {
    localStorage.setItem('contratos', JSON.stringify(contratos));
  }

  /* Envío del Formulario de Contrato */
  contratoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevoContrato = {
      convenio: document.getElementById('convenio').value.trim(),
      numeroContrato: document.getElementById('numeroContrato').value.trim(),
      nombreContratista: document.getElementById('nombreContratista').value.trim(),
      representanteLegal: document.getElementById('representanteLegal').value.trim(),
      nitEmpresa: document.getElementById('nitEmpresa').value.trim(),
      objetoContrato: document.getElementById('objetoContrato').value.trim(),
      valorInicial: document.getElementById('valorInicial').value.trim(),
      adiciones: Array.from(adicionesContainer.querySelectorAll('input')).map(input => input.value.trim()),
      valorFinal: document.getElementById('valorFinal').value.trim(),
      fechaSuscripcion: document.getElementById('fechaSuscripcion').value,
      fechaInicio: document.getElementById('fechaInicio').value,
      prorrogas: Array.from(prorrogasContainer.querySelectorAll('input')).map(input => input.value.trim()),
      fechaFinal: document.getElementById('fechaFinal').value,
      poliza: Array.from(polizaContainer.querySelectorAll('input')).map(input => input.value.trim()),
      estado: document.getElementById('filterEstado') ? document.getElementById('filterEstado').value : 'activo'
    };

    if (new Date(nuevoContrato.fechaSuscripcion) >= new Date(nuevoContrato.fechaInicio)) {
      alert('La fecha de suscripción debe ser anterior a la fecha de inicio.');
      return;
    }

    try {
      validarNIT(nuevoContrato.nitEmpresa);
      
      if (editIndex > -1) {
        contratos[editIndex] = nuevoContrato;
      } else {
        contratos.push(nuevoContrato);
      }
  
      // Aquí se podría enviar la información al backend mediante fetch, por ejemplo:
      // fetch('/api/contratos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoContrato) })
      //   .then(response => response.json())
      //   .then(data => console.log('Contrato guardado en MySQL:', data))
      //   .catch(error => console.error(error));
  
      guardarLocalStorage();
      renderTablaContratos();
      renderTarjetasContratos();
      updateDashboard();
      contratoForm.reset();
      clearDynamicFields();
      modalAgregarContrato.style.display = 'none';
      mostrarNotificacion('Contrato guardado exitosamente!');
    } catch (error) {
      mostrarNotificacion(error.message, 'error');
    }
  });

  /* Manejo de botones de edición, eliminación y gestión documental */
  document.querySelector('#tablaContratos').addEventListener('click', (e) => {
    const target = e.target;
    const index = target.getAttribute('data-index');
    if (target.closest('.btn-editar')) {
      const contrato = contratos[index];
      editIndex = index;
      modalTitle.textContent = "Editar Contrato";
      document.getElementById('convenio').value = contrato.convenio;
      document.getElementById('numeroContrato').value = contrato.numeroContrato;
      document.getElementById('nombreContratista').value = contrato.nombreContratista;
      document.getElementById('representanteLegal').value = contrato.representanteLegal;
      document.getElementById('nitEmpresa').value = contrato.nitEmpresa;
      document.getElementById('objetoContrato').value = contrato.objetoContrato;
      document.getElementById('valorInicial').value = contrato.valorInicial;
      document.getElementById('valorFinal').value = contrato.valorFinal;
      document.getElementById('fechaSuscripcion').value = contrato.fechaSuscripcion;
      document.getElementById('fechaInicio').value = contrato.fechaInicio;
      document.getElementById('fechaFinal').value = contrato.fechaFinal;
      
      clearDynamicFields();
      contrato.adiciones.forEach(val => {
        crearCampoDinamico(adicionesContainer, 'adiciones', 'Valor Adición');
        adicionesContainer.lastElementChild.querySelector('input').value = val;
      });
      contrato.prorrogas.forEach(val => {
        crearCampoDinamico(prorrogasContainer, 'prorrogas', 'Detalle Prórroga');
        prorrogasContainer.lastElementChild.querySelector('input').value = val;
      });
      contrato.poliza.forEach(val => {
        crearCampoDinamico(polizaContainer, 'poliza', 'Modificación Póliza');
        polizaContainer.lastElementChild.querySelector('input').value = val;
      });
      
      modalAgregarContrato.style.display = 'block';
    }

    if (target.closest('.btn-eliminar')) {
      if (confirm("¿Está seguro de eliminar este contrato?")) {
        contratos.splice(index, 1);
        guardarLocalStorage();
        renderTablaContratos();
        renderTarjetasContratos();
        updateDashboard();
      }
    }

    if (target.closest('.btn-doc')) {
      alert("Redirigiendo a Gestión Documental...");
      // Aquí puedes implementar la lógica para abrir un modal o redirigir a la sección de gestión documental.
    }
  });

  /* Buscador Global */
  globalSearch.addEventListener('input', () => {
    const query = globalSearch.value.toLowerCase();
    const filteredContratos = contratos.filter(c => {
      return c.numeroContrato.toLowerCase().includes(query) ||
             c.nombreContratista.toLowerCase().includes(query) ||
             c.objetoContrato.toLowerCase().includes(query);
    });
    renderFilteredContratos(filteredContratos);
  });

  function renderFilteredContratos(filtered) {
    tablaContratos.innerHTML = "";
    filtered.forEach((contrato, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${contrato.convenio}</td>
        <td>${contrato.numeroContrato}</td>
        <td>${contrato.nombreContratista}</td>
        <td>${contrato.representanteLegal}</td>
        <td>${contrato.nitEmpresa}</td>
        <td>${contrato.objetoContrato}</td>
        <td>${contrato.valorInicial}</td>
        <td>${contrato.adiciones.join(', ')}</td>
        <td>${contrato.valorFinal}</td>
        <td>${contrato.fechaSuscripcion}</td>
        <td>${contrato.fechaInicio}</td>
        <td>${contrato.prorrogas.join(', ')}</td>
        <td>${contrato.fechaFinal}</td>
        <td>${contrato.poliza.join(', ')}</td>
        <td>${contrato.estado || 'N/A'}</td>
        <td>
          <button class="btn-editar" data-index="${index}">Editar</button>
          <button class="btn-eliminar" data-index="${index}">Eliminar</button>
          <button class="btn-doc" data-index="${index}">Gestión Documental</button>
        </td>
      `;
      tablaContratos.appendChild(row);
    });
  }

  /* Alternar Vista: Tabla / Tarjeta */
  document.getElementById('tablaView').addEventListener('click', () => {
    document.getElementById('tablaContratos').style.display = '';
    tarjetasContratos.style.display = 'none';
  });

  document.getElementById('tarjetaView').addEventListener('click', () => {
    document.getElementById('tablaContratos').style.display = 'none';
    tarjetasContratos.style.display = 'flex';
    renderTarjetasContratos();
  });

  function renderTarjetasContratos() {
    tarjetasContratos.innerHTML = "";
    contratos.forEach((contrato, index) => {
      const card = document.createElement('div');
      card.classList.add('card');
      card.innerHTML = `
        <h3>${contrato.numeroContrato}</h3>
        <p><strong>Contratista:</strong> ${contrato.nombreContratista}</p>
        <p><strong>Estado:</strong> ${contrato.estado || 'N/A'}</p>
        <button class="btn-editar" data-index="${index}">Editar</button>
        <button class="btn-eliminar" data-index="${index}">Eliminar</button>
      `;
      tarjetasContratos.appendChild(card);
    });
  }

  /* Guardar en localStorage */
  function guardarLocalStorage() {
    localStorage.setItem('contratos', JSON.stringify(contratos));
  }

  /* Envío del Formulario de Contrato */
  contratoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nuevoContrato = {
      convenio: document.getElementById('convenio').value.trim(),
      numeroContrato: document.getElementById('numeroContrato').value.trim(),
      nombreContratista: document.getElementById('nombreContratista').value.trim(),
      representanteLegal: document.getElementById('representanteLegal').value.trim(),
      nitEmpresa: document.getElementById('nitEmpresa').value.trim(),
      objetoContrato: document.getElementById('objetoContrato').value.trim(),
      valorInicial: document.getElementById('valorInicial').value.trim(),
      adiciones: Array.from(adicionesContainer.querySelectorAll('input')).map(input => input.value.trim()),
      valorFinal: document.getElementById('valorFinal').value.trim(),
      fechaSuscripcion: document.getElementById('fechaSuscripcion').value,
      fechaInicio: document.getElementById('fechaInicio').value,
      prorrogas: Array.from(prorrogasContainer.querySelectorAll('input')).map(input => input.value.trim()),
      fechaFinal: document.getElementById('fechaFinal').value,
      poliza: Array.from(polizaContainer.querySelectorAll('input')).map(input => input.value.trim()),
      estado: document.getElementById('filterEstado') ? document.getElementById('filterEstado').value : 'activo'
    };

    if (new Date(nuevoContrato.fechaSuscripcion) >= new Date(nuevoContrato.fechaInicio)) {
      alert('La fecha de suscripción debe ser anterior a la fecha de inicio.');
      return;
    }

    try {
      validarNIT(nuevoContrato.nitEmpresa);
      
      if (editIndex > -1) {
        contratos[editIndex] = nuevoContrato;
      } else {
        contratos.push(nuevoContrato);
      }
  
      // Enviar datos al backend con fetch (opcional)
      /*
      fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoContrato)
      })
      .then(response => response.json())
      .then(data => console.log('Contrato guardado en MySQL:', data))
      .catch(error => console.error(error));
      */
      
      guardarLocalStorage();
      renderTablaContratos();
      renderTarjetasContratos();
      updateDashboard();
      contratoForm.reset();
      clearDynamicFields();
      modalAgregarContrato.style.display = 'none';
      mostrarNotificacion('Contrato guardado exitosamente!');
    } catch (error) {
      mostrarNotificacion(error.message, 'error');
    }
  });

  /* Manejo de botones de edición, eliminación y gestión documental */
  document.querySelector('#tablaContratos').addEventListener('click', (e) => {
    const target = e.target;
    const index = target.getAttribute('data-index');
    if (target.closest('.btn-editar')) {
      const contrato = contratos[index];
      editIndex = index;
      modalTitle.textContent = "Editar Contrato";
      document.getElementById('convenio').value = contrato.convenio;
      document.getElementById('numeroContrato').value = contrato.numeroContrato;
      document.getElementById('nombreContratista').value = contrato.nombreContratista;
      document.getElementById('representanteLegal').value = contrato.representanteLegal;
      document.getElementById('nitEmpresa').value = contrato.nitEmpresa;
      document.getElementById('objetoContrato').value = contrato.objetoContrato;
      document.getElementById('valorInicial').value = contrato.valorInicial;
      document.getElementById('valorFinal').value = contrato.valorFinal;
      document.getElementById('fechaSuscripcion').value = contrato.fechaSuscripcion;
      document.getElementById('fechaInicio').value = contrato.fechaInicio;
      document.getElementById('fechaFinal').value = contrato.fechaFinal;
      
      clearDynamicFields();
      contrato.adiciones.forEach(val => {
        crearCampoDinamico(adicionesContainer, 'adiciones', 'Valor Adición');
        adicionesContainer.lastElementChild.querySelector('input').value = val;
      });
      contrato.prorrogas.forEach(val => {
        crearCampoDinamico(prorrogasContainer, 'prorrogas', 'Detalle Prórroga');
        prorrogasContainer.lastElementChild.querySelector('input').value = val;
      });
      contrato.poliza.forEach(val => {
        crearCampoDinamico(polizaContainer, 'poliza', 'Modificación Póliza');
        polizaContainer.lastElementChild.querySelector('input').value = val;
      });
      
      modalAgregarContrato.style.display = 'block';
    }

    if (target.closest('.btn-eliminar')) {
      if (confirm("¿Está seguro de eliminar este contrato?")) {
        contratos.splice(index, 1);
        guardarLocalStorage();
        renderTablaContratos();
        renderTarjetasContratos();
        updateDashboard();
      }
    }

    if (target.closest('.btn-doc')) {
      alert("Redirigiendo a Gestión Documental...");
      // Aquí podrías implementar la lógica para abrir un modal o redirigir a la sección de gestión documental.
    }
  });

  /* Manejo del Formulario de Supervisión */
  supervisionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const numeroContrato = document.getElementById('numeroContratoSupervision').value.trim();
    const prioridad = document.getElementById('prioridadTarea').value;
    const observaciones = document.getElementById('observaciones').value.trim();
    alert(`Supervisión guardada para el contrato ${numeroContrato} con prioridad ${prioridad}:\n${observaciones}`);
    supervisionForm.reset();
  });

  // Renderizado inicial
  renderTablaContratos();
  renderTarjetasContratos();
  updateDashboard();
});
