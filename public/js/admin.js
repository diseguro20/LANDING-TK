document.addEventListener('DOMContentLoaded', () => {
  // Authentication Elements
  const loginOverlay = document.getElementById('login-overlay');
  const loginForm = document.getElementById('login-form');
  const passwordInput = document.getElementById('password-input');
  const togglePasswordBtn = document.getElementById('toggle-password-view');
  const loginError = document.getElementById('login-error');
  
  // Dashboard Elements
  const dashboardWrapper = document.getElementById('dashboard-wrapper');
  const btnLogout = document.getElementById('btn-logout');
  const housesTotalBadge = document.getElementById('houses-total-badge');
  const adminHousesTbody = document.getElementById('admin-houses-tbody');
  
  // Config Form
  const generalConfigForm = document.getElementById('general-config-form');
  const whatsappUrlInput = document.getElementById('whatsapp-url-input');
  const adminPasswordInput = document.getElementById('admin-password-input');
  
  // Add House Form
  const addHouseForm = document.getElementById('add-house-form');
  const houseNameInput = document.getElementById('house-name-input');
  const houseEmojiInput = document.getElementById('house-emoji-input');
  const houseColorInput = document.getElementById('house-color-input');
  const houseColorHex = document.getElementById('house-color-hex');
  const houseValueInput = document.getElementById('house-value-input');
  const houseActiveInput = document.getElementById('house-active-input');

  // Edit House Modal Form
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
  
  // Toast Element
  const toast = document.getElementById('toast');

  let adminToken = localStorage.getItem('admin_token') || '';
  let housesData = [];

  // Initialize
  checkAuth();

  // Toggle Login Password Visibility
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordBtn.querySelector('i').classList.toggle('fa-eye');
    togglePasswordBtn.querySelector('i').classList.toggle('fa-eye-slash');
  });

  // Sync Color Inputs - Creation Form
  houseColorInput.addEventListener('input', () => {
    houseColorHex.value = houseColorInput.value;
  });
  houseColorHex.addEventListener('input', () => {
    if (houseColorHex.value.startsWith('#') && houseColorHex.value.length === 7) {
      houseColorInput.value = houseColorHex.value;
    }
  });

  // Sync Color Inputs - Edit Form
  editHouseColor.addEventListener('input', () => {
    editHouseColorHex.value = editHouseColor.value;
  });
  editHouseColorHex.addEventListener('input', () => {
    if (editHouseColorHex.value.startsWith('#') && editHouseColorHex.value.length === 7) {
      editHouseColor.value = editHouseColorHex.value;
    }
  });

  // Auth checking
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

  // Handle Login Submission
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
        loginError.textContent = data.error || 'Erro ao realizar login.';
        loginError.classList.remove('hide');
      }
    } catch (err) {
      console.error(err);
      loginError.textContent = 'Erro ao se conectar com o servidor.';
      loginError.classList.remove('hide');
    }
  });

  // Handle Logout
  btnLogout.addEventListener('click', () => {
    adminToken = '';
    localStorage.removeItem('admin_token');
    checkAuth();
    showToast('Sessão encerrada.');
  });

  // Fetch configs and houses
  async function loadDashboardData() {
    try {
      const response = await fetch('/api/admin/data', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (response.status === 401 || response.status === 403) {
        // Expired or bad token
        adminToken = '';
        localStorage.removeItem('admin_token');
        checkAuth();
        return;
      }
      
      if (!response.ok) throw new Error('Falha ao buscar dados');
      
      const data = await response.json();
      whatsappUrlInput.value = data.whatsappUrl;
      housesData = data.houses || [];
      
      housesTotalBadge.textContent = housesData.length;
      renderHousesTable();
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar dados do dashboard.', true);
    }
  }

  // Render houses table
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
        <td>
          <strong style="color: ${house.color || '#fff'}">${house.name}</strong>
        </td>
        <td>R$ ${house.value.toFixed(2)}</td>
        <td>${statusBadge}</td>
        <td class="text-right">
          <div class="action-buttons">
            <button class="btn-secondary btn-icon btn-edit" data-id="${house.id}">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-danger btn-icon btn-delete" data-id="${house.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      `;

      // Event listeners
      tr.querySelector('.btn-edit').addEventListener('click', () => openEditModal(house));
      tr.querySelector('.btn-delete').addEventListener('click', () => deleteHouse(house.id, house.name));

      adminHousesTbody.appendChild(tr);
    });
  }

  // Handle General Config Submission
  generalConfigForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const whatsappUrl = whatsappUrlInput.value;
    const adminPassword = adminPasswordInput.value;
    
    const payload = { whatsappUrl };
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
        
        // If password changed, update local token
        if (data.token) {
          adminToken = data.token;
          localStorage.setItem('admin_token', adminToken);
        }
      } else {
        showToast(data.error || 'Erro ao salvar configurações.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão.', true);
    }
  });

  // Handle Add House Submission
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
    if (!confirm(`Tem certeza que deseja excluir permanentemente a casa "${name}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/houses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (response.ok) {
        showToast(`Casa "${name}" removida.`);
        loadDashboardData();
      } else {
        const data = await response.json();
        showToast(data.error || 'Erro ao remover casa.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão.', true);
    }
  }

  // Open Edit Modal
  function openEditModal(house) {
    editHouseId.value = house.id;
    editHouseName.value = house.name;
    editHouseEmoji.value = house.emoji || '🔘';
    editHouseColor.value = house.color || '#00ff66';
    editHouseColorHex.value = house.color || '#00ff66';
    editHouseValue.value = house.value;
    editHouseActive.checked = house.active !== false;
    
    editModal.classList.remove('hide');
  }

  // Close Modal functions
  function closeEditModal() {
    editModal.classList.add('hide');
    editHouseForm.reset();
  }
  
  cancelEditBtn.addEventListener('click', closeEditModal);
  closeModalBtn.addEventListener('click', closeEditModal);

  // Handle Edit House Submission
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
        showToast(data.error || 'Erro ao atualizar casa.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão.', true);
    }
  });

  // Display Toast message
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
