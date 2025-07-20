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
        <div class="content">
        <img src="${repair.image || 'phones.jpg'}" alt="" srcset="">
        <div class="texts">
          <div class="rname">${repair.customer}</div>
          <div class="rmodel">${repair.model}</div>
          <div class="rimei">${repair.imei || '35000000000000'}</div>
          <div class="rwork">${repair.description}</div>
          <div class="rprice">#${formatNumbers(repair.amount)}</div>
          <small>${new Date(repair.date).toLocaleString()}</small>
        </div>
        </div>
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
      enableLongPressEditDelete();
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
     /*
      if (!validateImei(imei)) {
        WebApp.showAlert("IMEI must be exactly 15 digits!");
        return;
      } */

      const repair = {
        customer: document.getElementById('customer').value,
        model: document.getElementById('model').value,
        imei,
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        image: document.getElementById('scanimg').src || '',
        date: new Date().toISOString()
      };
      repairs.unshift(repair);
      saveRepairsToCloud();
      repairForm.reset();
      toggleAdd(false);
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

    function toggleAdd(show) {
  const addContainer = document.querySelector('.add-container');
  const main = document.querySelector('.main');
  if (show) {
    addContainer.style.display = 'flex';
    main.style.display = 'none';
  } else {
    addContainer.style.display = 'none';
    main.style.display = 'flex';
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


document.getElementById('snapBtn').onclick = function() {
  document.getElementById('cameraInput').click();
};



// Replace with your Cloudinary cloud name and unsigned upload preset
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dd2skzasq/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'repair-upload';

document.getElementById('cameraInput').onchange = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Compress image to 10% quality
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(function(blob) {
        // Prepare form data for Cloudinary
        const formData = new FormData();
        formData.append('file', blob, 'photo.jpg');
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        // Upload to Cloudinary
        fetch(CLOUDINARY_URL, {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.secure_url) {
            document.getElementById('previewBox').innerHTML = `<img src="${data.secure_url}" style="max-width:100%;max-height:200px;border:1px solid #ccc;" />`;
          } else {
            document.getElementById('previewBox').innerHTML = `<span style="color:red;">Upload failed</span>`;
          }
        })
        .catch(() => {
          document.getElementById('previewBox').innerHTML = `<span style="color:red;">Upload error</span>`;
        });
      }, 'image/jpeg', 0.1); // 10% quality
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};
/*php format 

document.getElementById('cameraInput').onchange = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Compress image to 10% quality
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(function(blob) {
        // Prepare form data
        const formData = new FormData();
        formData.append('image', blob, 'photo.jpg');

        // Upload to server
        fetch('upload.php', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.url) {
            document.getElementById('previewBox').innerHTML = `<img src="${data.url}" style="max-width:100%;max-height:200px;border:1px solid #ccc;" />`;
          } else {
            document.getElementById('previewBox').innerHTML = `<span style="color:red;">Upload failed</span>`;
          }
        })
        .catch((e) => {
          document.getElementById('previewBox').innerHTML = `<span style="color:red;">Upload error ${e}</span>`;
        });
      }, 'image/jpeg', 0.1); // 10% quality
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

*/

// Enable long press to show edit/delete options
// Uncomment the line below to enable long press edit/delete functionality
//enableLongPressEditDelete();
function enableLongPressEditDelete() {
  document.querySelectorAll('.repair-item').forEach(item => {
    let pressTimer;
    const editDelete = item.querySelector('.edit-delete');

    // Helper to show/hide
    function showEditDelete() {
      if (editDelete) editDelete.style.display = 'flex';
    }
    function hideEditDelete() {
      if (editDelete) editDelete.style.display = 'none';
    }

    // Mouse events
    item.addEventListener('mousedown', startPress);
    item.addEventListener('mouseup', cancelPress);
    item.addEventListener('mouseleave', cancelPress);

    // Touch events for mobile
    item.addEventListener('touchstart', startPress);
    item.addEventListener('touchend', cancelPress);
    item.addEventListener('touchcancel', cancelPress);

    function startPress(e) {
      cancelPress();
      pressTimer = setTimeout(showEditDelete, 500); // 500ms long press
    }

    function cancelPress(e) {
      clearTimeout(pressTimer);
    }

    // Hide on tap/click outside or double tap/click
    document.addEventListener('touchstart', function(ev) {
      if (editDelete && !item.contains(ev.target)) hideEditDelete();
    });
    document.addEventListener('mousedown', function(ev) {
      if (editDelete && !item.contains(ev.target)) hideEditDelete();
    });

    item.addEventListener('dblclick', hideEditDelete);
    item.addEventListener('dbltap', hideEditDelete); // Custom event, not standard, but for completeness
  });
}
    // Load data when app starts
    loadRepairsFromCloud();

