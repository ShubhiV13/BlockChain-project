async function loadRecords() {
  const res = await fetch("/records");
  const chain = await res.json();

  const list = document.getElementById("recordList");
  list.innerHTML = "";

  chain.slice(1).forEach((block, index) => {
    const record = document.createElement("div");
    record.className = "record";
    record.innerHTML = `
      <strong>${index + 1}. ${block.data.patientName}</strong><br>
      Diagnosis: ${block.data.diagnosis}<br>
      Treatment: ${block.data.treatment}<br>
      Date: ${block.data.date}<br>
      Hash: ${block.hash.substring(0, 40)}...
    `;
    list.appendChild(record);
  });
}

async function addRecord() {
  const patientName = document.getElementById("patientName").value.trim();
  const diagnosis = document.getElementById("diagnosis").value.trim();
  const treatment = document.getElementById("treatment").value.trim();
  const date = document.getElementById("date").value;

  if (!patientName || !diagnosis || !treatment || !date) {
    alert("⚠️ Please fill all fields!");
    return;
  }

  await fetch("/add-record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientName, diagnosis, treatment, date }),
  });

  document.getElementById("patientName").value = "";
  document.getElementById("diagnosis").value = "";
  document.getElementById("treatment").value = "";
  document.getElementById("date").value = "";

  loadRecords();
}

loadRecords();
