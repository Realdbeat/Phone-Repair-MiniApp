    const WebApp = Telegram.WebApp;
    WebApp.ready();
    const BackButton = WebApp.BackButton;
    const SettingsButton = WebApp.SettingsButton;

        WebApp.BackButton.onClick(function() {
            WebApp.showAlert('Back button pressed');
        });

        WebApp.SettingsButton.onClick(function() {
            WebApp.showAlert('Settings opened!');
        });

   // WebApp.MainButton.text = "Add Repair";
    //WebApp.MainButton.show();
    BackButton.show();
    SettingsButton.show();

    const repairForm = document.getElementById('repairForm');
    const repairsList = document.getElementById('repairsList');
    const totalsDiv = document.getElementById('totals');
    const imeiSearchInput = document.getElementById('imeiSearch');

    const bottomSheet = document.getElementById('bottomSheet');
    const sheetOverlay = document.getElementById('sheetOverlay');

    let repairs = [];
    let filteredRepairs = [];

    function loadRepairsFromCloud() {
      WebApp.CloudStorage.getItem('repairs', (err, value) => {
        if (!err && value) {
          try {
            repairs = JSON.parse(value);
            renderRepairs();
            updateTotals();
          } catch (e) {
            console.error("Failed to parse stored data");
            WebApp.showAlert('Failed to parse stored data! Error: ' + e);
          }
        } else {
          WebApp.showAlert('No repairs found!');
          repairs = [];
          renderRepairs();
          updateTotals();
        }
      });
    }

    function saveRepairsToCloud() {
      const key = 'repairs';
      const value = JSON.stringify(repairs);
      WebApp.CloudStorage.setItem(key, value, function(err, saved) {
        if (err) {
          WebApp.showAlert('Save error: ' + err);
        } else {
          if (saved) {
            if (typeof WebApp.cloudStorageItems[key] === 'undefined') {
              WebApp.cloudStorageKeys.push(key);
            }
            WebApp.cloudStorageItems[key] = value;
          }
        }
      });
    }

    function validateImei(imei) {
      return /^\d{15}$/.test(imei.trim());
    }

    function filterByImei(query) {
      query = query.trim().toLowerCase();
      if (query === '') {
        filteredRepairs = [...repairs];
      } else {
        filteredRepairs = repairs.filter(repair =>
          repair.imei.toLowerCase().includes(query)
        );
      }
      renderFilteredRepairs();
    }

    function renderFilteredRepairs() {
      repairsList.innerHTML = '';
      (filteredRepairs.length ? filteredRepairs : repairs).forEach((repair, index) => {
        const item = document.createElement('div');
        item.className = 'repair-item';
        item.innerHTML = `
          <strong>${repair.customer}</strong><br/>
          ${repair.model}<br/>
          🔢 IMEI: ${repair.imei || 'N/A'}<br/>
          ${repair.description}<br/>
          💵 $${parseFloat(repair.amount).toFixed(2)}<br/>
          <small>${new Date(repair.date).toLocaleString()}</small>
          <div class="edit-delete">
            <button onclick="editRepair(${index})">Edit</button>
            <button onclick="deleteRepair(${index})">Delete</button>
          </div>
        `;
        repairsList.appendChild(item);
      });
    }

    function renderRepairs() {
      filteredRepairs = [...repairs];
      renderFilteredRepairs();
    }

    function updateTotals() {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentMonth = today.slice(0, 7); // YYYY-MM
      const currentYear = today.slice(0, 4); // YYYY

      let dailyTotal = { count: 0, amount: 0 };
      let monthlyTotal = { count: 0, amount: 0 };
      let yearlyTotal = { count: 0, amount: 0 };

      repairs.forEach(repair => {
        const date = new Date(repair.date);
        const day = date.toISOString().split('T')[0];
        const month = day.slice(0, 7);
        const year = day.slice(0, 4);

        if (day === today) {
          dailyTotal.count++;
          dailyTotal.amount += parseFloat(repair.amount);
        }
        if (month === currentMonth) {
          monthlyTotal.count++;
          monthlyTotal.amount += parseFloat(repair.amount);
        }
        if (year === currentYear) {
          yearlyTotal.count++;
          yearlyTotal.amount += parseFloat(repair.amount);
        }
      });

      totalsDiv.innerHTML = `
        <h3>📊 Totals Calculation</h3>
        <div class='totals-main'>
        <div class='daily'>
        <h2>Daily Totals</h2>
        <div class='repairs'>${formatNumbers(dailyTotal.count)} </div>
        <div class='revenues'>#${formatNumbers(dailyTotal.amount)}</div>
        </div>
        <div class='monthly'>
        <h2>Monthly Totals</h2>
        <div class='repairs'>${formatNumbers(monthlyTotal.count)}</div>
        <div class='revenues'>#${formatNumbers(monthlyTotal.amount)}</div>
        </div>
        <div class='yearly'>
        <h2>Yearly Totals</h2>
        <div class='repairs'>${formatNumbers(yearlyTotal.count)}</div>
        <div class='revenues'>#${formatNumbers(yearlyTotal.amount)}</div>
        </div>
        </div>
      `;
    }

    repairForm.addEventListener('submit', e => {
      e.preventDefault();
      const imei = document.getElementById('imei').value.trim();
      if (!validateImei(imei)) {
        WebApp.showAlert("IMEI must be exactly 15 digits!");
        return;
      }

      const repair = {
        customer: document.getElementById('customer').value,
        model: document.getElementById('model').value,
        imei,
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        date: new Date().toISOString()
      };
      repairs.unshift(repair);
      saveRepairsToCloud();
      repairForm.reset();
      toggleSheet(false);
      renderRepairs();
      updateTotals();
    });

    function deleteRepair(index) {
      if (confirm("Are you sure you want to delete this repair?")) {
        repairs.splice(index, 1);
        saveRepairsToCloud();
        renderRepairs();
        updateTotals();
      }
    }

    function editRepair(index) {
      const repair = repairs[index];
      const newAmount = prompt("Edit Amount:", repair.amount);
      if (newAmount !== null && !isNaN(parseFloat(newAmount))) {
        repair.amount = parseFloat(newAmount);
        saveRepairsToCloud();
        renderRepairs();
        updateTotals();
      }
    }

    function toggleSheet(show) {
      if (show) {
        bottomSheet.classList.add('active');
        sheetOverlay.classList.add('active');
      } else {
        bottomSheet.classList.remove('active');
        sheetOverlay.classList.remove('active');
      }
    }

    function formatNumbers(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }else if(num >= 1000){
                return (num / 1000).toFixed(1) + 'K';
             }
        return num.toString();
        }

    // Load data when app starts
    loadRepairsFromCloud();