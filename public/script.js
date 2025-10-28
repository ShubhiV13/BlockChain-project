const apiBase = "http://localhost:3000";
let currentPatientId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  loadRecords();
  updateSystemStatus();
  
  // Set default date to today
  document.getElementById('date').valueAsDate = new Date();
});

// Form submission
document.getElementById("recordForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const patientId = document.getElementById("patientId").value;
  const patientName = document.getElementById("patientName").value.trim();
  const diagnosis = document.getElementById("diagnosis").value.trim();
  const treatment = document.getElementById("treatment").value.trim();
  const date = document.getElementById("date").value;

  if (!validateForm(patientName, diagnosis, treatment, date)) {
    return;
  }

  try {
    const endpoint = patientId ? "/edit-record" : "/add-record";
    const payload = patientId ? 
      { patientId, patientName, diagnosis, treatment, date } :
      { patientName, diagnosis, treatment, date };

    const response = await fetch(`${apiBase}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Operation failed');
    }

    showAlert(result.message, 'success');
    clearForm();
    loadRecords();
    updateSystemStatus();
    
  } catch (error) {
    console.error('Error:', error);
    showAlert(error.message, 'danger');
  }
});

// Form validation
function validateForm(patientName, diagnosis, treatment, date) {
  if (patientName.length < 2) {
    showAlert('Patient name must be at least 2 characters long', 'warning');
    return false;
  }
  
  if (diagnosis.length < 2) {
    showAlert('Please enter a valid diagnosis', 'warning');
    return false;
  }
  
  if (treatment.length < 2) {
    showAlert('Please enter a valid treatment plan', 'warning');
    return false;
  }
  
  if (!date) {
    showAlert('Please select a date', 'warning');
    return false;
  }
  
  return true;
}

// Load records
async function loadRecords() {
  try {
    const res = await fetch(`${apiBase}/records`);
    if (!res.ok) throw new Error('Failed to fetch records');
    
    const records = await res.json();
    const list = document.getElementById("recordsList");
    list.innerHTML = "";

    if (records.length === 0) {
      list.innerHTML = `
        <div class="text-center py-4">
          <i class="fa-solid fa-folder-open fa-3x text-muted mb-3"></i>
          <p class="text-muted">No medical records found.</p>
        </div>
      `;
      return;
    }

    records.forEach((record, index) => {
      const { patientId, patientName, diagnosis, treatment, date, hash } = record;
      const recordDiv = document.createElement("div");
      recordDiv.className = "record mb-3";

      recordDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center mb-2">
              <h5 class="mb-0 me-2">
                <i class="fa-solid fa-user"></i> ${index + 1}. ${patientName}
              </h5>
              <small class="text-muted">ID: ${patientId}</small>
            </div>
            <p class="mb-1"><b>Diagnosis:</b> ${diagnosis}</p>
            <p class="mb-1"><b>Treatment:</b> ${treatment}</p>
            <p class="mb-1"><b>Date:</b> ${new Date(date).toLocaleDateString()}</p>
            <p class="mb-0">
              <b>Block Hash:</b> 
              <small class="font-monospace" title="${hash}">${hash.substring(0, 20)}...</small>
            </p>
          </div>
          <div class="btn-group-vertical ms-3">
            <button class="btn btn-outline-primary btn-sm" onclick="editRecord('${patientId}')">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button class="btn btn-outline-warning btn-sm" onclick="viewHistory('${patientId}')">
              <i class="fa-solid fa-history"></i> History
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteRecord('${patientId}', '${patientName}')">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </div>
      `;
      list.appendChild(recordDiv);
    });
  } catch (error) {
    console.error('Error loading records:', error);
    showAlert('Failed to load records', 'danger');
  }
}

// Edit record
async function editRecord(patientId) {
  try {
    const res = await fetch(`${apiBase}/records`);
    if (!res.ok) throw new Error('Failed to fetch records');
    
    const records = await res.json();
    const record = records.find(r => r.patientId === patientId);
    
    if (record) {
      document.getElementById("patientId").value = record.patientId;
      document.getElementById("patientName").value = record.patientName;
      document.getElementById("diagnosis").value = record.diagnosis;
      document.getElementById("treatment").value = record.treatment;
      document.getElementById("date").value = record.date;
      
      window.scrollTo({ top: 0, behavior: "smooth" });
      showAlert(`Editing record for ${record.patientName}`, 'info');
    }
  } catch (error) {
    console.error('Error loading record for edit:', error);
    showAlert('Failed to load record for editing', 'danger');
  }
}

// View patient history
async function viewHistory(patientId) {
  try {
    const res = await fetch(`${apiBase}/patient-history/${patientId}`);
    if (!res.ok) throw new Error('Failed to fetch patient history');
    
    const history = await res.json();
    
    if (history.length === 0) {
      showAlert('No history found for this patient', 'info');
      return;
    }
    
    let historyHTML = `<h5>Patient History (${history.length} records)</h5>`;
    history.forEach(record => {
      const typeBadge = record.type === 'create' ? 'success' : 
                       record.type === 'update' ? 'warning' : 'danger';
      
      historyHTML += `
        <div class="record mb-2 p-2 border-start border-3 border-${typeBadge}">
          <small class="text-${typeBadge}">
            <i class="fa-solid fa-${record.type === 'create' ? 'plus' : record.type === 'update' ? 'pencil' : 'trash'}"></i>
            ${record.type.toUpperCase()}
          </small>
          <p class="mb-1"><b>Date:</b> ${new Date(record.timestamp).toLocaleString()}</p>
          ${record.diagnosis ? `<p class="mb-1"><b>Diagnosis:</b> ${record.diagnosis}</p>` : ''}
          <small class="text-muted">Hash: ${record.hash.substring(0, 20)}...</small>
        </div>
      `;
    });
    
    showAlert(historyHTML, 'info', true);
  } catch (error) {
    console.error('Error loading patient history:', error);
    showAlert('Failed to load patient history', 'danger');
  }
}

// Delete record
async function deleteRecord(patientId, patientName) {
  if (confirm(`🗑️ Are you sure you want to delete record for ${patientName}? This action cannot be undone.`)) {
    try {
      const response = await fetch(`${apiBase}/delete-record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed');
      }

      showAlert(result.message, 'success');
      clearForm();
      loadRecords();
      updateSystemStatus();
    } catch (error) {
      console.error('Error deleting record:', error);
      showAlert(error.message, 'danger');
    }
  }
}

// Clear form
function clearForm() {
  document.getElementById("recordForm").reset();
  document.getElementById("patientId").value = "";
  document.getElementById("date").valueAsDate = new Date();
  showAlert('Form cleared', 'info');
}

// Show alert
function showAlert(message, type = 'info', isHTML = false) {
  const alertContainer = document.getElementById('alertContainer');
  const alertId = 'alert-' + Date.now();
  
  const alertHTML = `
    <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${isHTML ? message : `<i class="fa-solid fa-${getAlertIcon(type)}"></i> ${message}`}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  alertContainer.innerHTML = alertHTML;
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    const alert = document.getElementById(alertId);
    if (alert) {
      alert.remove();
    }
  }, 5000);
}

function getAlertIcon(type) {
  const icons = {
    success: 'check-circle',
    danger: 'exclamation-triangle',
    warning: 'exclamation-circle',
    info: 'info-circle'
  };
  return icons[type] || 'info-circle';
}

// Update system status
async function updateSystemStatus() {
  try {
    const [chainRes, healthRes] = await Promise.all([
      fetch(`${apiBase}/validate-chain`),
      fetch(`${apiBase}/health`)
    ]);
    
    if (chainRes.ok && healthRes.ok) {
      const chainData = await chainRes.json();
      const healthData = await healthRes.json();
      
      document.getElementById('chainLength').textContent = chainData.chainLength;
      document.getElementById('patientCount').textContent = chainData.patientCount;
      
      const statusElement = document.getElementById('chainStatus');
      if (chainData.valid) {
        statusElement.innerHTML = '<span class="badge bg-success">Valid</span>';
      } else {
        statusElement.innerHTML = '<span class="badge bg-danger">Invalid</span>';
      }
    }
  } catch (error) {
    console.error('Error updating system status:', error);
  }
}

// Refresh status every 30 seconds
setInterval(updateSystemStatus, 30000);