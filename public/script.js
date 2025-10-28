const apiBase = "http://localhost:3000";

document.getElementById("recordForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const patientName = document.getElementById("patientName").value.trim();
  const diagnosis = document.getElementById("diagnosis").value.trim();
  const treatment = document.getElementById("treatment").value.trim();
  const date = document.getElementById("date").value;

  if (!patientName || !diagnosis || !treatment || !date) {
    alert("⚠️ Please fill all fields!");
    return;
  }

  await fetch(`${apiBase}/edit-record`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientName, diagnosis, treatment, date }),
  });

  loadRecords();
  e.target.reset();
});

async function loadRecords() {
  const res = await fetch(`${apiBase}/records`);
  const records = await res.json();
  const list = document.getElementById("recordsList");
  list.innerHTML = "";

  if (records.length === 0) {
    list.innerHTML = `<p class="text-muted">No medical records found.</p>`;
    return;
  }

  records.forEach((block, index) => {
    const { patientName, diagnosis, treatment, date } = block.data;
    const recordDiv = document.createElement("div");
    recordDiv.className = "record mb-3";

    recordDiv.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h5><i class="fa-solid fa-user"></i> ${index + 1}. ${patientName}</h5>
          <p><b>Diagnosis:</b> ${diagnosis}</p>
          <p><b>Treatment:</b> ${treatment}</p>
          <p><b>Date:</b> ${date}</p>
          <p><b>Hash:</b> <small>${block.hash.substring(0, 35)}...</small></p>
        </div>
        <div>
          <button class="btn edit-btn btn-sm" onclick="editRecord('${patientName}', '${diagnosis}', '${treatment}', '${date}')">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button class="btn delete-btn btn-sm" onclick="deleteRecord('${patientName}')">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
    list.appendChild(recordDiv);
  });
}

async function editRecord(name, diagnosis, treatment, date) {
  document.getElementById("patientName").value = name;
  document.getElementById("diagnosis").value = diagnosis;
  document.getElementById("treatment").value = treatment;
  document.getElementById("date").value = date;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteRecord(patientName) {
  if (confirm(`🗑️ Are you sure you want to delete record for ${patientName}?`)) {
    await fetch(`${apiBase}/delete-record`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientName }),
    });
    loadRecords();
  }
}

loadRecords();
