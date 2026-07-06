document.addEventListener('DOMContentLoaded', () => {
  // Authentication Elements
  const loginOverlay = document.getElementById('login-overlay');
  const loginForm = document.getElementById('login-form');
  const passwordInput = document.getElementById('password-input');
  const togglePasswordBtn = document.getElementById('toggle-password-view');
  const loginError = document.getElementById('login-error');
  
  // Dashboard Core Elements
  const dashboardWrapper = document.getElementById('dashboard-wrapper');
  const btnLogout = document.getElementById('btn-logout');
  const toast = document.getElementById('toast');

  // Tab Navigation Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-content-panel');

  // ==========================================
  // TAB 1: GESTÃO DE LEADS ELEMENTS
  // ==========================================
  const metricTotalLeads = document.getElementById('metric-total-leads');
  const metricTotalCpas = document.getElementById('metric-total-cpas');
  const metricTotalOp = document.getElementById('metric-total-op');
  const metricTotalLeadPay = document.getElementById('metric-total-lead-pay');
  const metricTotalLosses = document.getElementById('metric-total-losses');

  const filterSearch = document.getElementById('filter-search');
  const filterOperator = document.getElementById('filter-operator');
  const filterStatus = document.getElementById('filter-status');
  const filterClosed = document.getElementById('filter-closed');
  const btnNewLead = document.getElementById('btn-new-lead');
  const leadsCountBadge = document.getElementById('leads-count-badge');
  const adminLeadsTbody = document.getElementById('admin-leads-tbody');

  // Lead Modal Elements
  const leadModal = document.getElementById('lead-modal');
  const leadForm = document.getElementById('lead-form');
  const leadModalTitle = document.getElementById('lead-modal-title');
  const leadIdInput = document.getElementById('lead-id-input');
  const leadDateInput = document.getElementById('lead-date-input');
  const leadNameInput = document.getElementById('lead-name-input');
  const leadWhatsappInput = document.getElementById('lead-whatsapp-input');
  const leadOperatorInput = document.getElementById('lead-operator-input');
  const leadStatusInput = document.getElementById('lead-status-input');
  const leadLossesInput = document.getElementById('lead-losses-input');
  const leadIndicationInput = document.getElementById('lead-indication-input');
  const leadClosedInput = document.getElementById('lead-closed-input');
  const leadHousesCheckGrid = document.getElementById('lead-houses-check-grid');
  const cancelLeadModalBtn = document.getElementById('cancel-lead-modal-btn');
  const closeLeadModalBtn = document.getElementById('close-lead-modal-btn');
  const leadModalSubmitBtn = document.getElementById('lead-modal-submit-btn');

  // ==========================================
  // TAB 2: REGRAS & CASAS ELEMENTS
  // ==========================================
  // Config Form
  const generalConfigForm = document.getElementById('general-config-form');
  const whatsappUrlInput = document.getElementById('whatsapp-url-input');
  const headlineValueInput = document.getElementById('headline-value-input');
  const opValueInput = document.getElementById('op-value-input');
  const opBonusInput = document.getElementById('op-bonus-input');
  const leadValueInput = document.getElementById('lead-value-input');
  const leadBonusInput = document.getElementById('lead-bonus-input');
  const minHousesInput = document.getElementById('min-houses-input');
  const operatorsInput = document.getElementById('operators-input');
  const statusesInput = document.getElementById('statuses-input');
  const adminPasswordInput = document.getElementById('admin-password-input');
  
  // Add House Form
  const addHouseForm = document.getElementById('add-house-form');
  const houseNameInput = document.getElementById('house-name-input');
  const houseEmojiInput = document.getElementById('house-emoji-input');
  const houseColorInput = document.getElementById('house-color-input');
  const houseColorHex = document.getElementById('house-color-hex');
  const houseValueInput = document.getElementById('house-value-input');
  const houseActiveInput = document.getElementById('house-active-input');
  const housesTotalBadge = document.getElementById('houses-total-badge');
  const adminHousesTbody = document.getElementById('admin-houses-tbody');

  // Edit House Modal Elements
  const editModal = document.getElementById('edit-modal');
  const editHouseForm = document.getElementById('edit-house-form');
  const editHouseId = document.getElementById('edit-house-id');
  const editHouseName = document.getElementById('edit-house-name');
  const editHouseEmoji = document.getElementById('edit-house-emoji');
  const editHouseColor = document.getElementById('edit-house-color');
  const editHouseColorHex = document.getElementById('edit-house-color-hex');
  const editHouseValue = document.getElementById('edit-house-value');
  const editHouseActive = document.getElementById('edit-house-active');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');

  // ==========================================
  // GLOBAL STATE
  // ==========================================
  let adminToken = localStorage.getItem('admin_token') || '';
  let housesData = [];
  let leadsData = [];
  
  // Commission settings variables loaded from configs table
  let rules = {
    minHousesForBonus: 8,
    opValuePerCpa: 3.12,
    opBonus: 25.00,
    leadValuePerCpa: 6.00,
    leadBonus: 100.00
  };
  
  let operatorsList = [];
  let statusesList = [];

  // Initialize
  checkAuth();

  // ==========================================
  // AUTHENTICATION & LOGIN LOGIC
  // ==========================================
  function checkAuth() {
    if (adminToken) {
      loginOverlay.classList.add('hide');
      dashboardWrapper.classList.remove('hide');
      loadDashboardData();
    } else {
      loginOverlay.classList.remove('hide');
      dashboardWrapper.classList.add('hide');
    }
  }

  // Toggle Password Visiblity
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordBtn.querySelector('i').classList.toggle('fa-eye');
    togglePasswordBtn.querySelector('i').classList.toggle('fa-eye-slash');
  });

  // Login Submit Handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hide');
    
    const password = passwordInput.value;
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        adminToken = data.token;
        localStorage.setItem('admin_token', adminToken);
        passwordInput.value = '';
        checkAuth();
        showToast('Login efetuado com sucesso!');
      } else {
        loginError.textContent = data.error || 'Senha incorreta.';
        loginError.classList.remove('hide');
      }
    } catch (err) {
      console.error(err);
      loginError.textContent = 'Erro de conexão.';
      loginError.classList.remove('hide');
    }
  });

  // Logout Handler
  btnLogout.addEventListener('click', () => {
    adminToken = '';
    localStorage.removeItem('admin_token');
    checkAuth();
    showToast('Sessão encerrada.');
  });

  // ==========================================
  // TAB NAVIGATION
  // ==========================================
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.add('hide'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.dataset.tab);
      if (targetPanel) {
        targetPanel.classList.remove('hide');
      }
    });
  });

  // ==========================================
  // CORE DATA FETCHING
  // ==========================================
  async function loadDashboardData() {
    try {
      const response = await fetch('/api/admin/data', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (response.status === 401 || response.status === 403) {
        adminToken = '';
        localStorage.removeItem('admin_token');
        checkAuth();
        return;
      }
      
      if (!response.ok) throw new Error('Falha ao obter configurações.');
      
      const data = await response.json();
      
      // Load configuration inputs
      whatsappUrlInput.value = data.whatsappUrl;
      headlineValueInput.value = data.headlineValue || 300;
      
      // Load new commission parameter values
      rules.minHousesForBonus = Number(data.minHousesForBonus || 8);
      rules.opValuePerCpa = Number(data.opValuePerCpa || 3.12);
      rules.opBonus = Number(data.opBonus || 25.00);
      rules.leadValuePerCpa = Number(data.leadValuePerCpa || 6.00);
      rules.leadBonus = Number(data.leadBonus || 100.00);
      
      minHousesInput.value = rules.minHousesForBonus;
      opValueInput.value = rules.opValuePerCpa;
      opBonusInput.value = rules.opBonus;
      leadValueInput.value = rules.leadValuePerCpa;
      leadBonusInput.value = rules.leadBonus;
      
      operatorsInput.value = data.operators || "";
      statusesInput.value = data.statuses || "";

      // Parse Dynamic Lists
      operatorsList = data.operators ? data.operators.split(',').map(s => s.strip()) : [];
      statusesList = data.statuses ? data.statuses.split(',').map(s => s.strip()) : [];

      // Update dropdown inputs in UI
      populateDropdowns();

      // Render Betting Houses List
      housesData = data.houses || [];
      housesTotalBadge.textContent = housesData.length;
      renderHousesTable();
      renderHousesCheckboxGrid();

      // Render Leads list
      await fetchLeads();
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar configurações do dashboard.', true);
    }
  }

  // Populate dynamic selects
  function populateDropdowns() {
    // 1. Filter dropdown options
    filterOperator.innerHTML = '<option value="">Todos</option>';
    operatorsList.forEach(op => {
      filterOperator.innerHTML += `<option value="${op}">${op}</option>`;
    });

    filterStatus.innerHTML = '<option value="">Todos</option>';
    statusesList.forEach(st => {
      filterStatus.innerHTML += `<option value="${st}">${st}</option>`;
    });

    // 2. Form dialog dropdown options
    leadOperatorInput.innerHTML = '<option value="">Selecione...</option>';
    operatorsList.forEach(op => {
      leadOperatorInput.innerHTML += `<option value="${op}">${op}</option>`;
    });

    leadStatusInput.innerHTML = '<option value="">Selecione...</option>';
    statusesList.forEach(st => {
      leadStatusInput.innerHTML += `<option value="${st}">${st}</option>`;
    });
  }

  // Fetch leads listing
  async function fetchLeads() {
    const search = filterSearch.value;
    const operator = filterOperator.value;
    const status = filterStatus.value;
    const isClosed = filterClosed.value;

    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (operator) queryParams.append('operator', operator);
    if (status) queryParams.append('status', status);
    if (isClosed) queryParams.append('isClosed', isClosed);

    try {
      const response = await fetch(`/api/admin/leads?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (!response.ok) throw new Error('Erro ao listar leads.');

      leadsData = await response.json();
      leadsCountBadge.textContent = leadsData.length;
      
      calculateMetrics();
      renderLeadsTable();
    } catch (err) {
      console.error(err);
      showToast('Erro ao listar leads.', true);
    }
  }

  // Calculate stats metrics from filters
  function calculateMetrics() {
    let totalLeads = leadsData.length;
    let totalCpas = 0;
    let totalOpCommission = 0.0;
    let totalLeadPay = 0.0;
    let totalLosses = 0.0;

    leadsData.forEach(lead => {
      const cpas = lead.completedHouses ? lead.completedHouses.length : 0;
      totalCpas += cpas;
      totalLosses += lead.losses || 0.0;

      // Operator pay calculation
      let opPay = 0.0;
      if (cpas >= rules.minHousesForBonus) {
        opPay = rules.opBonus;
      } else {
        opPay = cpas * rules.opValuePerCpa;
      }
      totalOpCommission += opPay;

      // Lead pay calculation
      let leadPay = 0.0;
      if (cpas >= rules.minHousesForBonus) {
        leadPay = rules.leadBonus + (cpas - rules.minHousesForBonus) * rules.leadValuePerCpa;
      } else {
        leadPay = cpas * rules.leadValuePerCpa;
      }
      totalLeadPay += leadPay;
    });

    metricTotalLeads.textContent = totalLeads;
    metricTotalCpas.textContent = totalCpas;
    metricTotalOp.textContent = `R$ ${totalOpCommission.toFixed(2)}`;
    metricTotalLeadPay.textContent = `R$ ${totalLeadPay.toFixed(2)}`;
    metricTotalLosses.textContent = `R$ ${totalLosses.toFixed(2)}`;
  }

  // Filter Listeners (debounce to prevent hammer)
  let filterTimeout;
  const triggerFilter = () => {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(fetchLeads, 300);
  };

  filterSearch.addEventListener('input', triggerFilter);
  filterOperator.addEventListener('change', fetchLeads);
  filterStatus.addEventListener('change', fetchLeads);
  filterClosed.addEventListener('change', fetchLeads);

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  
  // Render Houses list table
  function renderHousesTable() {
    if (housesData.length === 0) {
      adminHousesTbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-20">Nenhuma casa de aposta cadastrada ainda.</td>
        </tr>
      `;
      return;
    }

    adminHousesTbody.innerHTML = '';
    housesData.forEach(house => {
      const tr = document.createElement('tr');
      const statusBadge = house.active 
        ? `<span class="house-status-badge status-active">Ativo</span>`
        : `<span class="house-status-badge status-inactive">Inativo</span>`;

      tr.innerHTML = `
        <td><span style="font-size: 1.4rem;">${house.emoji || '🔘'}</span></td>
        <td><strong style="color: ${house.color || '#fff'}">${house.name}</strong></td>
        <td>R$ ${house.value.toFixed(2)}</td>
        <td>${statusBadge}</td>
        <td class="text-right">
          <div class="action-buttons">
            <button class="btn-secondary btn-icon btn-edit-house" data-id="${house.id}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-danger btn-icon btn-delete-house" data-id="${house.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-edit-house').addEventListener('click', () => openEditHouseModal(house));
      tr.querySelector('.btn-delete-house').addEventListener('click', () => deleteHouse(house.id, house.name));

      adminHousesTbody.appendChild(tr);
    });
  }

  // Render Houses Checkbox list inside Lead Dialog
  function renderHousesCheckboxGrid() {
    if (housesData.length === 0) {
      leadHousesCheckGrid.innerHTML = '<p class="text-muted" style="font-size: 0.85rem;">Cadastre casas primeiro na aba "Regras & Casas".</p>';
      return;
    }

    leadHousesCheckGrid.innerHTML = '';
    housesData.forEach(house => {
      const label = document.createElement('label');
      label.className = 'house-check-item';
      label.innerHTML = `
        <input type="checkbox" name="lead-house" value="${house.name}">
        <span title="${house.name}">${house.emoji || '🔘'} ${house.name}</span>
      `;
      leadHousesCheckGrid.appendChild(label);
    });
  }

  // Render Leads list table
  function renderLeadsTable() {
    if (leadsData.length === 0) {
      adminLeadsTbody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-20">Nenhum lead encontrado com os filtros atuais.</td>
        </tr>
      `;
      return;
    }

    adminLeadsTbody.innerHTML = '';
    leadsData.forEach(lead => {
      const tr = document.createElement('tr');
      
      const cpaCount = lead.completedHouses ? lead.completedHouses.length : 0;
      
      // Calculate inline values based on rules
      let opPay = cpaCount >= rules.minHousesForBonus ? rules.opBonus : (cpaCount * rules.opValuePerCpa);
      let leadPay = cpaCount >= rules.minHousesForBonus ? (rules.leadBonus + (cpaCount - rules.minHousesForBonus) * rules.leadValuePerCpa) : (cpaCount * rules.leadValuePerCpa);
      
      const housesTooltip = lead.completedHouses && lead.completedHouses.length > 0
        ? lead.completedHouses.join(', ')
        : 'Nenhuma casa registrada';

      const checkedAttr = lead.isClosed ? 'checked' : '';

      // Format Date nicely
      let formattedDate = lead.date;
      try {
        const dObj = new Date(lead.date + 'T00:00:00');
        formattedDate = dObj.toLocaleDateString('pt-BR');
      } catch(e){}

      tr.innerHTML = `
        <td>${formattedDate}</td>
        <td>
          <div style="font-weight: 700;">${lead.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${lead.whatsapp || '-'}</div>
        </td>
        <td>${lead.operator}</td>
        <td><span class="lead-status-badge">${lead.status}</span></td>
        <td>
          <span class="badge" style="background-color: var(--border-color); cursor: help;" title="${housesTooltip}">
            ${cpaCount} / ${housesData.length}
          </span>
        </td>
        <td><strong style="color: var(--success);">R$ ${leadPay.toFixed(2)}</strong></td>
        <td><strong style="color: var(--primary);">R$ ${opPay.toFixed(2)}</strong></td>
        <td style="${lead.losses > 0 ? 'color: var(--danger); font-weight: 600;' : ''}">R$ ${lead.losses.toFixed(2)}</td>
        <td>
          <input type="checkbox" class="toggle-closed-checkbox" data-id="${lead.id}" ${checkedAttr} style="width:16px; height:16px; cursor:pointer;">
        </td>
        <td class="text-right">
          <div class="action-buttons">
            <button class="btn-secondary btn-icon btn-edit-lead" data-id="${lead.id}"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="btn-danger btn-icon btn-delete-lead" data-id="${lead.id}"><i class="fa-solid fa-user-minus"></i></button>
          </div>
        </td>
      `;

      // Inline Toggle checkbox listener for fast closing
      tr.querySelector('.toggle-closed-checkbox').addEventListener('change', async (e) => {
        const targetId = e.target.dataset.id;
        const isClosed = e.target.checked;
        await fastToggleLeadClosed(targetId, isClosed);
      });

      tr.querySelector('.btn-edit-lead').addEventListener('click', () => openEditLeadModal(lead));
      tr.querySelector('.btn-delete-lead').addEventListener('click', () => deleteLead(lead.id, lead.name));

      adminLeadsTbody.appendChild(tr);
    });
  }

  // Helper to string strip equivalent for Javascript
  String.prototype.strip = function() {
    return this.trim();
  };

  // ==========================================
  // GENERAL CONFIG FORM HANDLER
  // ==========================================
  generalConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const whatsappUrl = whatsappUrlInput.value;
    const adminPassword = adminPasswordInput.value;
    const headlineValue = headlineValueInput.value;
    const minHousesForBonus = minHousesInput.value;
    const opValuePerCpa = opValueInput.value;
    const opBonus = opBonusInput.value;
    const leadValuePerCpa = leadValueInput.value;
    const leadBonus = leadBonusInput.value;
    const operators = operatorsInput.value;
    const statuses = statusesInput.value;
    
    const payload = { 
      whatsappUrl, headlineValue,
      minHousesForBonus, opValuePerCpa, opBonus,
      leadValuePerCpa, leadBonus, operators, statuses
    };
    
    if (adminPassword.trim() !== '') {
      payload.adminPassword = adminPassword.trim();
    }
    
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('Configurações salvas com sucesso!');
        adminPasswordInput.value = '';
        if (data.token) {
          adminToken = data.token;
          localStorage.setItem('admin_token', adminToken);
        }
        loadDashboardData();
      } else {
        showToast(data.error || 'Erro ao salvar configurações.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão.', true);
    }
  });

  // ==========================================
  // HOUSES FORM ACTIONS & LOGIC
  // ==========================================
  houseColorInput.addEventListener('input', () => { houseColorHex.value = houseColorInput.value; });
  houseColorHex.addEventListener('input', () => {
    if (houseColorHex.value.startsWith('#') && houseColorHex.value.length === 7) {
      houseColorInput.value = houseColorHex.value;
    }
  });

  editHouseColor.addEventListener('input', () => { editHouseColorHex.value = editHouseColor.value; });
  editHouseColorHex.addEventListener('input', () => {
    if (editHouseColorHex.value.startsWith('#') && editHouseColorHex.value.length === 7) {
      editHouseColor.value = editHouseColorHex.value;
    }
  });

  // Add House submit
  addHouseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = houseNameInput.value;
    const emoji = houseEmojiInput.value;
    const color = houseColorHex.value;
    const value = houseValueInput.value;
    const active = houseActiveInput.checked;
    
    try {
      const response = await fetch('/api/admin/houses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ name, emoji, color, value, active })
      });
      
      if (response.ok) {
        showToast(`Casa "${name}" cadastrada!`);
        addHouseForm.reset();
        houseColorInput.value = '#00ff66';
        houseColorHex.value = '#00ff66';
        loadDashboardData();
      } else {
        const data = await response.json();
        showToast(data.error || 'Erro ao cadastrar casa.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão.', true);
    }
  });

  // Delete betting house
  async function deleteHouse(id, name) {
    if (!confirm(`Tem certeza que deseja excluir a casa "${name}"? Leads que concluíram esta casa não a perderão, mas ela sumirá das listas.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/houses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (response.ok) {
        showToast(`Casa "${name}" removida.`);
        loadDashboardData();
      } else {
        const data = await response.json();
        showToast(data.error || 'Erro ao remover.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão.', true);
    }
  }

  // Open Edit House modal
  function openEditHouseModal(house) {
    editHouseId.value = house.id;
    editHouseName.value = house.name;
    editHouseEmoji.value = house.emoji || '🔘';
    editHouseColor.value = house.color || '#00ff66';
    editHouseColorHex.value = house.color || '#00ff66';
    editHouseValue.value = house.value;
    editHouseActive.checked = house.active !== false;
    
    editModal.classList.remove('hide');
  }

  function closeEditModal() {
    editModal.classList.add('hide');
    editHouseForm.reset();
  }
  
  cancelEditBtn.addEventListener('click', closeEditModal);
  closeModalBtn.addEventListener('click', closeEditModal);

  // Edit House submit
  editHouseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = editHouseId.value;
    const name = editHouseName.value;
    const emoji = editHouseEmoji.value;
    const color = editHouseColorHex.value;
    const value = editHouseValue.value;
    const active = editHouseActive.checked;
    
    try {
      const response = await fetch(`/api/admin/houses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ name, emoji, color, value, active })
      });
      
      if (response.ok) {
        showToast('Casa de aposta atualizada com sucesso!');
        closeEditModal();
        loadDashboardData();
      } else {
        const data = await response.json();
        showToast(data.error || 'Erro ao atualizar.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão.', true);
    }
  });

  // ==========================================
  // LEADS FORM ACTIONS & LOGIC
  // ==========================================

  // Open creation modal
  btnNewLead.addEventListener('click', () => {
    leadForm.reset();
    leadIdInput.value = '';
    
    // Set default date to today in input
    const today = new Date().toISOString().split('T')[0];
    leadDateInput.value = today;
    
    leadLossesInput.value = 0;
    leadClosedInput.checked = false;
    
    // Clear all completed house checkboxes
    document.querySelectorAll('input[name="lead-house"]').forEach(cb => {
      cb.checked = false;
    });

    leadModalTitle.textContent = "Novo Lead";
    leadModalSubmitBtn.textContent = "Cadastrar Lead";
    
    leadModal.classList.remove('hide');
  });

  // Close Lead Modal
  function closeLeadModal() {
    leadModal.classList.add('hide');
    leadForm.reset();
  }
  
  cancelLeadModalBtn.addEventListener('click', closeLeadModal);
  closeLeadModalBtn.addEventListener('click', closeLeadModal);

  // Open Edit Lead Modal
  function openEditLeadModal(lead) {
    leadIdInput.value = lead.id;
    leadDateInput.value = lead.date;
    leadNameInput.value = lead.name;
    leadWhatsappInput.value = lead.whatsapp || "";
    leadOperatorInput.value = lead.operator || "";
    leadStatusInput.value = lead.status || "";
    leadLossesInput.value = lead.losses || 0;
    leadIndicationInput.value = lead.indication || "";
    leadClosedInput.checked = lead.isClosed || false;

    // Check houses checkboxes
    const completedSet = new Set(lead.completedHouses || []);
    document.querySelectorAll('input[name="lead-house"]').forEach(cb => {
      cb.checked = completedSet.has(cb.value);
    });

    leadModalTitle.textContent = "Editar Lead";
    leadModalSubmitBtn.textContent = "Salvar Alterações";
    
    leadModal.classList.remove('hide');
  }

  // Submit Lead creation / edition
  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = leadIdInput.value;
    const date = leadDateInput.value;
    const name = leadNameInput.value;
    const whatsapp = leadWhatsappInput.value;
    const operator = leadOperatorInput.value;
    const status = leadStatusInput.value;
    const losses = Number(leadLossesInput.value || 0);
    const indication = leadIndicationInput.value;
    const isClosed = leadClosedInput.checked;
    
    // Extract checked houses
    const completedHouses = Array.from(document.querySelectorAll('input[name="lead-house"]:checked'))
      .map(cb => cb.value);

    const payload = {
      date,
      name,
      whatsapp,
      operator,
      status,
      completedHouses,
      losses,
      isClosed,
      indication
    };

    const isEditing = !!id;
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/admin/leads/${id}` : '/api/admin/leads';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        showToast(isEditing ? 'Lead atualizado!' : 'Lead cadastrado com sucesso!');
        closeLeadModal();
        fetchLeads();
      } else {
        showToast(data.error || 'Erro ao salvar o lead.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão.', true);
    }
  });

  // Fast inline closed toggle
  async function fastToggleLeadClosed(id, isClosed) {
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ isClosed })
      });

      if (response.ok) {
        showToast(isClosed ? 'Atendimento encerrado.' : 'Atendimento reaberto.');
        fetchLeads(); // refresh totals and row metrics
      } else {
        const data = await response.json();
        showToast(data.error || 'Erro ao alterar encerramento.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão.', true);
    }
  }

  // Delete lead
  async function deleteLead(id, name) {
    if (!confirm(`Tem certeza que deseja excluir o lead "${name}"? Esta ação é irreversível!`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.ok) {
        showToast(`Lead "${name}" removido.`);
        fetchLeads();
      } else {
        const data = await response.json();
        showToast(data.error || 'Erro ao remover lead.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão.', true);
    }
  }

  // ==========================================
  // UTILITIES
  // ==========================================
  function showToast(message, isError = false) {
    toast.textContent = message;
    if (isError) {
      toast.classList.add('toast-error');
    } else {
      toast.classList.remove('toast-error');
    }
    
    toast.classList.remove('hide');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      toast.classList.add('hide');
    }, 3000);
  }
});
