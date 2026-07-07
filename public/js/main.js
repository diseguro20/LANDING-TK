document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const housesContainer = document.getElementById('houses-container');
  const selectedCountEl = document.getElementById('selected-count');
  const estimatedProfitEl = document.getElementById('estimated-profit');
  const progressFill = document.getElementById('progress-fill');
  const progressPercent = document.getElementById('progress-percent');
  const btnWhatsapp = document.getElementById('btn-whatsapp');
  const ctaHelperText = document.getElementById('cta-helper-text');
  const countdownTimer = document.getElementById('countdown-timer');
  const heroMaxValue = document.getElementById('hero-max-value');
  
  // Simulator Popup Elements
  const btnOpenSimulator = document.getElementById('btn-open-simulator');
  const closeSimulatorBtn = document.getElementById('close-simulator-btn');
  const simulatorModal = document.getElementById('simulator-modal');

  let whatsappBaseUrl = '';
  let availableHouses = [];
  let selectedHouseIds = new Set();
  let headlinePromoValue = 300;

  // Fetch initial data
  async function loadLandingData() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref') || '';
      
      const response = await fetch(`/api/data?ref=${encodeURIComponent(ref)}`);
      if (!response.ok) throw new Error('Erro ao buscar dados');
      
      const data = await response.json();

      whatsappBaseUrl = data.whatsappUrl;
      availableHouses = data.houses;
      headlinePromoValue = data.headlineValue || 300;

      renderHouses();
      updateCalculations();
      updateHeroTitleValue();
    } catch (error) {
      console.error('Falha ao carregar os dados:', error);
      housesContainer.innerHTML = `
        <div class="error-msg" style="grid-column: 1/-1; text-align: center; color: #ff5e00; padding: 20px;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <p>Erro temporário ao carregar as ofertas. Por favor, recarregue a página.</p>
        </div>
      `;
    }
  }

  // Render houses grid
  function renderHouses() {
    if (availableHouses.length === 0) {
      housesContainer.innerHTML = `
        <p style="grid-column: 1/-1; text-align: center; color: var(--text-gray);">
          Nenhuma oferta de banca disponível no momento. Volte mais tarde!
        </p>
      `;
      return;
    }

    housesContainer.innerHTML = '';
    availableHouses.forEach(house => {
      const card = document.createElement('div');
      card.className = 'house-card';
      card.dataset.id = house.id;
      card.style.setProperty('--house-color', house.color || '#00ff66');

      card.innerHTML = `
        <div class="house-card-header">
          <div class="house-name-wrapper">
            <span class="house-emoji">${house.emoji || '🔘'}</span>
            <span class="house-name">${house.name}</span>
          </div>
          <div class="house-checkbox">
            <i class="fa-solid fa-check"></i>
          </div>
        </div>
        <div class="house-card-body">
          <span class="house-bonus-label">Banca Grátis Disponível</span>
          <span class="house-bonus-value">R$ ${house.value.toFixed(2)}</span>
        </div>
        <div class="house-card-footer">
          <i class="fa-solid fa-shield-halved"></i>
          <span>Vaga Garantida para Novo Cadastro</span>
        </div>
      `;

      card.addEventListener('click', () => toggleHouseSelection(house.id, card));
      housesContainer.appendChild(card);
    });
  }

  // Handle card selection
  function toggleHouseSelection(id, cardElement) {
    if (selectedHouseIds.has(id)) {
      selectedHouseIds.delete(id);
      cardElement.classList.remove('selected');
    } else {
      selectedHouseIds.add(id);
      cardElement.classList.add('selected');
    }
    updateCalculations();
  }

  // Calculate values and update UI
  function updateCalculations() {
    const selectedCount = selectedHouseIds.size;
    const totalCount = availableHouses.length;
    
    // Calculate progress percentage
    const percent = totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    
    // Calculate profit (sum of selected houses values + combo bonus)
    let sumValue = 0;
    availableHouses.forEach(house => {
      if (selectedHouseIds.has(house.id)) {
        sumValue += house.value;
      }
    });

    // Combo Bonus logic
    let bonus = 0;
    if (selectedCount >= 5) {
      bonus = 150;
    } else if (selectedCount === 4) {
      bonus = 90;
    } else if (selectedCount === 3) {
      bonus = 50;
    } else if (selectedCount === 2) {
      bonus = 20;
    }

    const totalProfit = sumValue + bonus;

    // Update statistics UI
    selectedCountEl.textContent = selectedCount;
    
    // Add immersive update animation on value change
    estimatedProfitEl.classList.remove('sim-val-bounce');
    void estimatedProfitEl.offsetWidth; // Force layout recalculation
    estimatedProfitEl.classList.add('sim-val-bounce');
    setTimeout(() => {
      estimatedProfitEl.classList.remove('sim-val-bounce');
    }, 200);
    
    if (selectedCount > 0) {
      estimatedProfitEl.innerHTML = `R$ ${totalProfit.toFixed(2)}${bonus > 0 ? ` <span style="font-size: 0.85rem; color: #ff5e00; display: block; text-shadow: none; font-weight: bold;">(+R$ ${bonus} COMBO BONUS! 🔥)</span>` : ''}`;
      
      // Update Button State
      btnWhatsapp.classList.remove('disabled');
      btnWhatsapp.href = whatsappBaseUrl || '#';
      ctaHelperText.textContent = `Bancas liberadas! Clique acima para resgatar R$ ${totalProfit.toFixed(2)} grátis.`;
    } else {
      estimatedProfitEl.textContent = 'R$ 0,00';
      btnWhatsapp.classList.add('disabled');
      btnWhatsapp.href = '#';
      ctaHelperText.textContent = 'Selecione pelo menos 1 casa acima para liberar seu link do WhatsApp!';
    }
  }

  // Update Hero section max potential text dynamically
  function updateHeroTitleValue() {
    if (headlinePromoValue) {
      heroMaxValue.textContent = `R$ ${Number(headlinePromoValue).toFixed(2)}`;
      return;
    }
    
    if (availableHouses.length === 0) return;
    
    // Max potential = sum of all + max combo bonus
    let totalMax = 0;
    availableHouses.forEach(h => {
      totalMax += h.value;
    });

    let maxCombo = 0;
    if (availableHouses.length >= 5) maxCombo = 150;
    else if (availableHouses.length === 4) maxCombo = 90;
    else if (availableHouses.length === 3) maxCombo = 50;
    else if (availableHouses.length === 2) maxCombo = 20;

    const absoluteMax = totalMax + maxCombo;
    heroMaxValue.textContent = `R$ ${absoluteMax.toFixed(2)}`;
  }

  // Evergreen Scarcity Timer (15 minutes)
  let timeInSeconds = 14 * 60 + 59;
  function startTimer() {
    const timerInterval = setInterval(() => {
      let minutes = Math.floor(timeInSeconds / 60);
      let seconds = timeInSeconds % 60;

      // Formatting
      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;

      countdownTimer.textContent = `${minutes}:${seconds}`;

      if (timeInSeconds <= 0) {
        // Reset timer when it reaches 0
        timeInSeconds = 14 * 60 + 59;
      } else {
        timeInSeconds--;
      }
    }, 1000);
  }

  // Simulator Modal bindings
  if (btnOpenSimulator && closeSimulatorBtn && simulatorModal) {
    btnOpenSimulator.addEventListener('click', () => {
      simulatorModal.classList.remove('hide');
      document.body.style.overflow = 'hidden';
    });

    closeSimulatorBtn.addEventListener('click', () => {
      simulatorModal.classList.add('hide');
      document.body.style.overflow = '';
    });

    simulatorModal.addEventListener('click', (e) => {
      if (e.target === simulatorModal) {
        simulatorModal.classList.add('hide');
        document.body.style.overflow = '';
      }
    });
  }

  // Run
  loadLandingData();
  startTimer();
});
