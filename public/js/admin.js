document.addEventListener('DOMContentLoaded', () => {
  // Authentication Elements
  const loginOverlay = document.getElementById('login-overlay');
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username-input');
  const passwordInput = document.getElementById('password-input');
  const togglePasswordBtn = document.getElementById('toggle-password-view');
  const loginError = document.getElementById('login-error');
  
  // Dashboard Core Elements
  const dashboardWrapper = document.getElementById('dashboard-wrapper');
  const loggedUserTitle = document.getElementById('logged-user-title');
  const btnViewSiteLink = document.getElementById('btn-view-site-link');
  const btnLogout = document.getElementById('btn-logout');
  const toast = document.getElementById('toast');

  // Tab Navigation Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-content-panel');
  const tabBtnUsers = document.getElementById('tab-btn-users');

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

  // Pagination Elements
  const btnPrevPage = document.getElementById('btn-prev-page');
  const btnNextPage = document.getElementById('btn-next-page');
  const pageIndicator = document.getElementById('page-indicator');

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
  // TAB 3: CONTAS DE ACESSO ELEMENTS
  // ==========================================
  const addUserForm = document.getElementById('add-user-form');
  const newUsernameInput = document.getElementById('new-username-input');
  const newPasswordInput = document.getElementById('new-password-input');
  const adminUsersTbody = document.getElementById('admin-users-tbody');
  const usersTotalBadge = document.getElementById('users-total-badge');

  // ==========================================
  // GLOBAL STATE
  // ==========================================
  let adminToken = localStorage.getItem('admin_token') || '';
  let loggedUsername = localStorage.getItem('logged_username') || '';
  let housesData = [];
  let leadsData = [];
  
  // Pagination State
  let currentLeadsPage = 1;
  let totalLeadsPages = 1;
  const leadsLimit = 50;
  
  // Commission settings variables loaded from configs
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
    if (adminToken && loggedUsername) {
      loginOverlay.classList.add('hide');
      dashboardWrapper.classList.remove('hide');
      
      // Update Brand Title
      loggedUserTitle.textContent = `Painel: ${loggedUsername}`;
      
      // Customize "Ver Site" link
      if (loggedUsername === 'admin') {
        btnViewSiteLink.href = '/';
        tabBtnUsers.classList.remove('hide'); // show accounts tab for superadmin
      } else {
        btnViewSiteLink.href = `/?ref=${loggedUsername}`;
        tabBtnUsers.classList.add('hide'); // hide accounts tab for others
      }

      loadDashboardData();
    } else {
      loginOverlay.classList.remove('hide');
      dashboardWrapper.classList.add('hide');
    }
  }

  // Toggle Password Visibility
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
    
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        adminToken = data.token;
        // The token is in format "userId:username"
        loggedUsername = data.token.split(':')[1];
        
        localStorage.setItem('admin_token', adminToken);
        localStorage.setItem('logged_username', loggedUsername);
        
        usernameInput.value = '';
        passwordInput.value = '';
        checkAuth();
        showToast('Login efetuado com sucesso!');
      } else {
        loginError.textContent = data.error || 'Usuário ou senha incorretos.';
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
    loggedUsername = '';
    localStorage.removeItem('admin_token');
    localStorage.removeItem('logged_username');
    
    // Reset tab state
    tabButtons.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.add('hide'));
    tabButtons[0].classList.add('active');
    tabPanels[0].classList.remove('hide');

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
        loggedUsername = '';
        localStorage.removeItem('admin_token');
        localStorage.removeItem('logged_username');
        checkAuth();
        return;
      }
      
      if (!response.ok) throw new Error('Falha ao obter configurações.');
      
      const data = await response.json();
      
      // Load configuration inputs
      whatsappUrlInput.value = data.whatsappUrl;
      headlineValueInput.value = data.headlineValue || 300;
      
      // Load commission parameters
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

      // Parse dynamic dropdown lists
      operatorsList = data.operators ? data.operators.split(',').map(s => s.trim()) : [];
      statusesList = data.statuses ? data.statuses.split(',').map(s => s.trim()) : [];

      populateDropdowns();

      // Render houses list
      housesData = data.houses || [];
      housesTotalBadge.textContent = housesData.length;
      renderHousesTable();
      renderHousesCheckboxGrid();

      // Load leads (pages reset to 1)
      currentLeadsPage = 1;
      await fetchLeads();

      // Load sub-accounts list if logged user is superadmin
      if (loggedUsername === 'admin') {
        await loadUserAccounts();
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar configurações do dashboard.', true);
    }
  }

  // Populate filter and modal select inputs
  function populateDropdowns() {
    filterOperator.innerHTML = '<option value="">Todos</option>';
    operatorsList.forEach(op => {
      filterOperator.innerHTML += `<option value="${op}">${op}</option>`;
    });

    filterStatus.innerHTML = '<option value="">Todos</option>';
    statusesList.forEach(st => {
      filterStatus.innerHTML += `<option value="${st}">${st}</option>`;
    });

    leadOperatorInput.innerHTML = '<option value="">Selecione...</option>';
    operatorsList.forEach(op => {
      leadOperatorInput.innerHTML += `<option value="${op}">${op}</option>`;
    });

    leadStatusInput.innerHTML = '<option value="">Selecione...</option>';
    statusesList.forEach(st => {
      leadStatusInput.innerHTML += `<option value="${st}">${st}</option>`;
    });
  }

  // Fetch leads with pagination & filters
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
    
    // Add pagination params
    queryParams.append('page', currentLeadsPage);
    queryParams.append('limit', leadsLimit);

    try {
      const response = await fetch(`/api/admin/leads?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (!response.ok) throw new Error('Erro ao listar leads.');

      const data = await response.json();
      leadsData = data.leads || [];
      
      const pag = data.pagination;
      leadsCountBadge.textContent = pag.totalCount;
      totalLeadsPages = pag.totalPages || 1;
      
      // Update statistics and table rows
      renderMetrics(data.metrics);
      renderLeadsTable();
      updatePaginationControls(pag.totalCount);
    } catch (err) {
      console.error(err);
      showToast('Erro ao listar leads.', true);
    }
  }

  // Render totals cards using backend metrics object
  function renderMetrics(metrics) {
    if (!metrics) return;
    
    let totalLeads = metrics.totalLeads || 0;
    let totalCpas = metrics.totalCpas || 0;
    let totalLosses = metrics.totalLosses || 0.0;
    
    let totalOpCommission = 0.0;
    let totalLeadPay = 0.0;

    (metrics.cpaCounts || []).forEach(cpas => {
      // OP commission
      if (cpas >= rules.minHousesForBonus) {
        totalOpCommission += rules.opBonus;
      } else {
        totalOpCommission += cpas * rules.opValuePerCpa;
      }

      // Lead payment
      if (cpas >= rules.minHousesForBonus) {
        totalLeadPay += rules.leadBonus + (cpas - rules.minHousesForBonus) * rules.leadValuePerCpa;
      } else {
        totalLeadPay += cpas * rules.leadValuePerCpa;
      }
    });

    metricTotalLeads.textContent = totalLeads;
    metricTotalCpas.textContent = totalCpas;
    metricTotalOp.textContent = `R$ ${totalOpCommission.toFixed(2)}`;
    metricTotalLeadPay.textContent = `R$ ${totalLeadPay.toFixed(2)}`;
    metricTotalLosses.textContent = `R$ ${totalLosses.toFixed(2)}`;
  }

  // Pagination UI handler
  function updatePaginationControls(totalCount) {
    pageIndicator.textContent = `Página ${currentLeadsPage} de ${totalLeadsPages} (Total: ${totalCount})`;
    
    btnPrevPage.disabled = currentLeadsPage <= 1;
    btnNextPage.disabled = currentLeadsPage >= totalLeadsPages;
  }

  btnPrevPage.addEventListener('click', () => {
    if (currentLeadsPage > 1) {
      currentLeadsPage--;
      fetchLeads();
    }
  });

  btnNextPage.addEventListener('click', () => {
    if (currentLeadsPage < totalLeadsPages) {
      currentLeadsPage++;
      fetchLeads();
    }
  });

  // Filter Listeners (debounce search and reset page)
  let filterTimeout;
  const triggerFilter = () => {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
      currentLeadsPage = 1;
      fetchLeads();
    }, 300);
  };

  filterSearch.addEventListener('input', triggerFilter);
  filterOperator.addEventListener('change', () => { currentLeadsPage = 1; fetchLeads(); });
  filterStatus.addEventListener('change', () => { currentLeadsPage = 1; fetchLeads(); });
  filterClosed.addEventListener('change', () => { currentLeadsPage = 1; fetchLeads(); });

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

  // Render Houses checkboxes inside Leads modal
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

  // Render Leads list table rows
  function renderLeadsTable() {
    if (leadsData.length === 0) {
      adminLeadsTbody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-20">Nenhum lead encontrado nesta página.</td>
        </tr>
      `;
      return;
    }

    adminLeadsTbody.innerHTML = '';
    leadsData.forEach(lead => {
      const tr = document.createElement('tr');
      const cpaCount = lead.completedHouses ? lead.completedHouses.length : 0;
      
      // Calculate inline payouts
      let opPay = cpaCount >= rules.minHousesForBonus ? rules.opBonus : (cpaCount * rules.opValuePerCpa);
      let leadPay = cpaCount >= rules.minHousesForBonus ? (rules.leadBonus + (cpaCount - rules.minHousesForBonus) * rules.leadValuePerCpa) : (cpaCount * rules.leadValuePerCpa);
      
      const housesTooltip = lead.completedHouses && lead.completedHouses.length > 0
        ? lead.completedHouses.join(', ')
        : 'Nenhuma casa registrada';

      const checkedAttr = lead.isClosed ? 'checked' : '';

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

  // ==========================================
  // CONFIG FORM HANDLER
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

  async function deleteHouse(id, name) {
    if (!confirm(`Tem certeza que deseja excluir a casa "${name}"?`)) return;
    
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
  btnNewLead.addEventListener('click', () => {
    leadForm.reset();
    leadIdInput.value = '';
    
    const today = new Date().toISOString().split('T')[0];
    leadDateInput.value = today;
    
    leadLossesInput.value = 0;
    leadClosedInput.checked = false;
    
    document.querySelectorAll('input[name="lead-house"]').forEach(cb => {
      cb.checked = false;
    });

    leadModalTitle.textContent = "Novo Lead";
    leadModalSubmitBtn.textContent = "Cadastrar Lead";
    
    leadModal.classList.remove('hide');
  });

  function closeLeadModal() {
    leadModal.classList.add('hide');
    leadForm.reset();
  }
  
  cancelLeadModalBtn.addEventListener('click', closeLeadModal);
  closeLeadModalBtn.addEventListener('click', closeLeadModal);

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

    const completedSet = new Set(lead.completedHouses || []);
    document.querySelectorAll('input[name="lead-house"]').forEach(cb => {
      cb.checked = completedSet.has(cb.value);
    });

    leadModalTitle.textContent = "Editar Lead";
    leadModalSubmitBtn.textContent = "Salvar Alterações";
    
    leadModal.classList.remove('hide');
  }

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
        fetchLeads();
      } else {
        const data = await response.json();
        showToast(data.error || 'Erro ao alterar encerramento.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão.', true);
    }
  }

  async function deleteLead(id, name) {
    if (!confirm(`Tem certeza que deseja excluir o lead "${name}"?`)) return;

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
  // TAB 3: ACCOUNT MANAGEMENT LOGIC (Superadmin)
  // ==========================================

  // Load created sub-accounts list
  async function loadUserAccounts() {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (!response.ok) throw new Error('Falha ao listar usuários.');

      const users = await response.json();
      usersTotalBadge.textContent = users.length;
      renderUsersTable(users);
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar contas de acesso.', true);
    }
  }

  // Render accounts list table
  function renderUsersTable(users) {
    if (users.length === 0) {
      adminUsersTbody.innerHTML = `
        <tr>
          <td colspan="3" class="text-center py-20">Nenhuma outra conta de acesso cadastrada.</td>
        </tr>
      `;
      return;
    }

    // Determine current web hostname for customized links
    const currentOrigin = window.location.origin;

    adminUsersTbody.innerHTML = '';
    users.forEach(u => {
      const tr = document.createElement('tr');
      const customUrl = `${currentOrigin}/?ref=${u.username}`;

      tr.innerHTML = `
        <td><strong style="color: var(--primary);">${u.username}</strong></td>
        <td><a href="${customUrl}" target="_blank" style="color: var(--success); text-decoration: underline;">${customUrl}</a></td>
        <td class="text-right">
          <button class="btn-danger btn-icon btn-delete-user" data-id="${u.id}" data-username="${u.username}">
            <i class="fa-solid fa-trash"></i> Excluir
          </button>
        </td>
      `;

      tr.querySelector('.btn-delete-user').addEventListener('click', () => deleteUserAccount(u.id, u.username));
      adminUsersTbody.appendChild(tr);
    });
  }

  // Submit new user creation
  addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = newUsernameInput.value;
    const password = newPasswordInput.value;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Conta de acesso "${username}" criada!`);
        addUserForm.reset();
        await loadUserAccounts();
      } else {
        showToast(data.error || 'Erro ao criar conta.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão.', true);
    }
  });

  // Delete user account
  async function deleteUserAccount(id, username) {
    if (!confirm(`Tem certeza que deseja excluir permanentemente o acesso de "${username}"? Todos os leads, regras e casas deste usuário serão APAGADOS!`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Conta "${username}" excluída.`);
        await loadUserAccounts();
      } else {
        showToast(data.error || 'Erro ao excluir conta.', true);
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
    
    setTimeout(() => {
      toast.classList.add('hide');
    }, 3000);
  }
});
