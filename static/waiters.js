document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('tablesGrid');
  const refreshIndicator = document.getElementById('refreshIndicator');

  // Modal elements
  const modal = document.getElementById('tableModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBackdrop = modal.querySelector('.table-modal-backdrop');
  const closeFooterBtn = document.getElementById('closeFooterBtn');
  const clearBtn = document.getElementById('clearTableBtn');

  const dTableNum = document.getElementById('detailTableNum');
  const dStatus = document.getElementById('detailStatus');
  const dCustomer = document.getElementById('detailCustomer');
  const dWaiter = document.getElementById('detailWaiter');
  const dTimestamp = document.getElementById('detailTimestamp');

  // Track table state transitions to avoid hitting details too early
  const state = {
    // tableNumber: { firstTakenAt: number, retryAt: number, retryCount: number }
  };
  const DETAILS_DELAY_MS = 4000; // wait for waiter selection + file write
  const RETRY_BASE_MS = 2000;

  // Format timestamp object { date:{day,month,year}, time:{hour,minutes,seconds} }
  function fmt2(n) { return String(n ?? '').padStart(2, '0'); }
  function formatTimestampReadable(ts) {
    try {
      if (!ts || typeof ts !== 'object') return '-';
      const d = ts.date || {};
      const t = ts.time || {};
      const day = Number(d.day), month = Number(d.month), year = Number(d.year);
      const hour = Number(t.hour), minutes = Number(t.minutes), seconds = Number(t.seconds);
      if (!day || !month || !year) return '-';
      // Produce 21/09/2025 19:53:51 format
      return `${fmt2(day)}/${fmt2(month)}/${year} ${fmt2(hour)}:${fmt2(minutes)}:${fmt2(seconds)}`;
    } catch { return '-'; }
  }

  // Build 20 table cards initially
  for (let i = 1; i <= 20; i++) {
    const card = document.createElement('button');
    card.className = 'table-card';
    card.setAttribute('data-table', String(i));
    card.innerHTML = `
      <div class="table-card-header">
        <span class="table-number">Table ${i}</span>
        <span class="status-badge" data-status>...</span>
      </div>
      <div class="table-card-body">
        <div class="table-mini-details" data-mini>Loading...</div>
      </div>
    `;
    card.addEventListener('click', () => openTableDetails(i));
    grid.appendChild(card);
  }

  async function fetchJSON(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  }

  function setRefreshing(text) {
    if (!refreshIndicator) return;
    refreshIndicator.textContent = text || '';
  }

  async function refreshGrid() {
    try {
      setRefreshing('Refreshing...');
      const freeData = await fetchJSON('/tables/free-tables');
      const free = new Set((freeData && freeData.free_tables) || []);
      for (let i = 1; i <= 20; i++) {
        const card = grid.querySelector(`.table-card[data-table="${i}"]`);
        if (!card) continue;
        const statusEl = card.querySelector('[data-status]');
        const mini = card.querySelector('[data-mini]');

        if (free.has(i)) {
          card.classList.remove('taken');
          card.classList.add('free');
          statusEl.textContent = 'Free';
          mini.textContent = '-';
          delete state[i];
        } else {
          card.classList.remove('free');
          card.classList.add('taken');
          statusEl.textContent = 'Occupied';
          // Set first-taken timestamp if newly seen
          if (!state[i] || !state[i].firstTakenAt) {
            state[i] = { firstTakenAt: Date.now(), retryAt: 0, retryCount: 0 };
            mini.textContent = 'Assigning waiter...';
            continue;
          }

          const now = Date.now();
          const age = now - state[i].firstTakenAt;

          // Respect backoff schedule if any
          if (state[i].retryAt && now < state[i].retryAt) {
            mini.textContent = 'Preparing table...';
            continue;
          }

          // Wait initial delay before attempting to read details file
          if (age < DETAILS_DELAY_MS) {
            mini.textContent = 'Assigning waiter...';
            continue;
          }

          // Try fetching details; on failure, backoff and avoid spamming 500s
          try {
            const data = await fetchJSON(`/tables/table-${i}`);
            const cust = (data && data.customer) ? data.customer : '-';
            const waiter = (data && data.waiter) ? data.waiter : '-';
            mini.textContent = `Customer: ${cust} • Waiter: ${waiter}`;
            // reset retry on success
            state[i].retryAt = 0;
            state[i].retryCount = 0;
          } catch (e) {
            // Exponential backoff up to ~16s
            state[i].retryCount = (state[i].retryCount || 0) + 1;
            const delay = Math.min(RETRY_BASE_MS * Math.pow(2, state[i].retryCount - 1), 16000);
            state[i].retryAt = Date.now() + delay;
            mini.textContent = 'Waiting for table data...';
          }
        }
      }
      setRefreshing('Updated');
      setTimeout(() => setRefreshing(''), 800);
    } catch (e) {
      setRefreshing('Failed to refresh');
    }
  }

  async function openTableDetails(num) {
    // Determine if free or taken from the card class
    const card = grid.querySelector(`.table-card[data-table="${num}"]`);
    const isFree = card?.classList.contains('free');
    dTableNum.textContent = String(num);

    if (isFree) {
      dStatus.textContent = 'Free';
      dCustomer.textContent = '-';
      dWaiter.textContent = '-';
      dTimestamp.textContent = '-';
      clearBtn.style.display = 'none';
      showModal();
      return;
    }

    // If table recently turned occupied, wait before querying details
    const st = state[num];
    if (st) {
      const now = Date.now();
      if ((now - (st.firstTakenAt || 0)) < DETAILS_DELAY_MS || (st.retryAt && now < st.retryAt)) {
        dStatus.textContent = 'Occupied';
        dCustomer.textContent = '-';
        dWaiter.textContent = '-';
        dTimestamp.textContent = 'Waiting for waiter assignment...';
        clearBtn.style.display = 'none';
        showModal();
        return;
      }
    }

    try {
      const data = await fetchJSON(`/tables/table-${num}`);
      dStatus.textContent = 'Occupied';
      dCustomer.textContent = (data && data.customer) ? data.customer : '-';
      dWaiter.textContent = (data && data.waiter) ? data.waiter : '-';
      dTimestamp.textContent = (data && data.timestamp) ? formatTimestampReadable(data.timestamp) : '-';
      clearBtn.style.display = '';
      clearBtn.dataset.table = String(num);
      showModal();
    } catch (e) {
      dStatus.textContent = 'Unknown';
      dCustomer.textContent = '-';
      dWaiter.textContent = '-';
      dTimestamp.textContent = 'Waiting for table data...';
      clearBtn.style.display = 'none';
      showModal();
    }
  }

  function showModal() {
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');
  }
  function hideModal() {
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('open');
  }

  modalCloseBtn.addEventListener('click', hideModal);
  closeFooterBtn.addEventListener('click', hideModal);
  modalBackdrop.addEventListener('click', hideModal);

  clearBtn.addEventListener('click', async (e) => {
    const table = Number(e.currentTarget.dataset.table);
    if (!table) return;
    const ok = confirm(`Clear table ${table}?`);
    if (!ok) return;
    try {
      await fetch(`/tables/delete-table/${table}`, { method: 'DELETE' });
      hideModal();
      await refreshGrid();
    } catch (err) {
      alert('Failed to clear table');
    }
  });

  // Initial load and polling
  refreshGrid();
  setInterval(refreshGrid, 10000);
});
