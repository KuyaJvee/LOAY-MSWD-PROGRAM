/* =========================
   Constants & State
   ========================= */
const CHILDREN_MAX = 13;
const INCOME_OPTIONS = {
  BELOW_MIN: "Below minimum wage",
  MID_RANGE: "Minimum wage +1 to Php 20,833",
  ABOVE_20K: "Php 20,834 and above"
};

let data = JSON.parse(localStorage.getItem("soloParentsData")) || [];
let filteredData = []; // used for secondary search results

/* =========================
   Utilities
   ========================= */
function calculateAge(birthdate) {
  if (!birthdate) return "";
  const b = new Date(birthdate);
  if (isNaN(b)) return "";
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).replace(",", "");
}

function openPopup(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}
function closePopup(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

/* =========================
   DOM References
   ========================= */
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const exportBtn = document.getElementById("exportBtn");
const categorySearch = document.getElementById("categorySearch");
const categorySearchBtn = document.getElementById("categorySearchBtn");
const genderSummaryBtn = document.getElementById("genderSummaryBtn");
const lguSummaryBtn = document.getElementById("lguSummaryBtn");
const secondaryGlobalSearch = document.getElementById("secondaryGlobalSearch");
const secondaryGlobalClearBtn = document.getElementById("secondaryGlobalClearBtn");
const registerForm = document.getElementById("registerForm");
const showdataBtn = document.getElementById("showdataBtn");
const dataTableContainer = document.getElementById("dataTableContainer");
const childrenInputsContainer = document.getElementById("childrenInputs");
const addChildrenBtn = document.getElementById("addChildrenBtn");

// New name search elements
const nameSearchInput = document.getElementById("nameSearch");
const nameSearchClear = document.getElementById("nameSearchClear");
const nameSearchResults = document.getElementById("nameSearchResults");

/* =========================
   Utilities used by DOM helpers
   ========================= */
function cloneSelectOptions(sourceSelectId) {
  const src = document.getElementById(sourceSelectId);
  return src ? src.innerHTML : "";
}
function setSelectValue(selectEl, value) {
  if (!selectEl) return;
  selectEl.value = value || "";
}

/* =========================
   Import / Export
   ========================= */
function importByBarangayExcel(file) {
  if (!file) return;
  if (file.name !== "SoloParentImportData.xlsx") {
    alert("Invalid file name. Please upload 'SoloParentImportData.xlsx'.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const wb = XLSX.read(e.target.result, { type: "binary" });
      let importedData = [];
      wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const records = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!records || records.length === 0) return;
        records.forEach(r => {
          if (!r["Last Name"] && !r["First Name"]) return;
          const childrenArr = (r["Children"] || "")
            .split("|")
            .map(c => {
              const parts = c.trim().match(/(.+?) \((.+?), Age: (-?\d+)\)/);
              return parts ? { name: parts[1], birthdate: parts[2], age: parseInt(parts[3], 10) } : null;
            })
            .filter(Boolean);
          const fullName = `${r["Last Name"] || ""}, ${r["First Name"] || ""} ${r["Middle Name"] || ""} ${r["Suffix"] || ""}`.trim();
          importedData.push({
            lastName: r["Last Name"] || "",
            firstName: r["First Name"] || "",
            middleName: r["Middle Name"] || "",
            suffix: r["Suffix"] || "",
            gender: r["Gender"] === "M" ? "Male" : r["Gender"] === "F" ? "Female" : r["Gender"],
            birthdate: r["Birthdate"] || "",
            dateRegistered: r["Date Registered"] || "",
            age: r["Age"] || "",
            barangay: r["Barangay"] || sheetName,
            category: r["Category"] || "",
            bqCode: r["BQ Code"] || "",
            spId: r["SP ID"] || "",
            idExpiration: r["ID Expiration"] || "",
            civilStatus: r["Civil Status"] || "",
            employmentStatus: r["Employment Status"] || "",
            monthlyIncome: r["Monthly Income"] || "",
            philhealth: r["Philhealth"] || "",
            pantawid: r["Pantawid Beneficiary"] || "",
            indigenous: r["Indigenous Person"] || "",
            lgbtq: r["LGBTQ+"] || "",
            children: childrenArr,
            fullName
          });
        });
      });
      data = data.concat(importedData);
      localStorage.setItem("soloParentsData", JSON.stringify(data));
      renderTable();
      alert("Data imported successfully!");
    } catch (err) {
      console.error(err);
      alert("Error reading file. Please upload a valid export file.");
    }
  };
  reader.readAsBinaryString(file);
}

function exportByBarangayExcel() {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }
  const grouped = {};
  data.forEach(d => {
    if (!grouped[d.barangay]) grouped[d.barangay] = [];
    grouped[d.barangay].push(d);
  });
  const wb = XLSX.utils.book_new();
  const headers = [
    "Last Name","First Name","Middle Name","Suffix","Gender","Birthdate",
    "Date Registered","Age","Barangay","Category","BQ Code","SP ID",
    "ID Expiration","Civil Status","Employment Status","Monthly Income",
    "Philhealth","Pantawid Beneficiary","Indigenous Person","LGBTQ+","Children"
  ];
  Object.keys(grouped).sort().forEach(barangay => {
    const records = grouped[barangay].map(d => ({
      "Last Name": d.lastName,
      "First Name": d.firstName,
      "Middle Name": d.middleName,
      "Suffix": d.suffix,
      "Gender": d.gender === "Male" ? "M" : d.gender === "Female" ? "F" : d.gender,
      "Birthdate": d.birthdate,
      "Date Registered": d.dateRegistered,
      "Age": d.age,
      "Barangay": d.barangay,
      "Category": d.category,
      "BQ Code": d.bqCode,
      "SP ID": d.spId,
      "ID Expiration": d.idExpiration,
      "Civil Status": d.civilStatus,
      "Employment Status": d.employmentStatus,
      "Monthly Income": d.monthlyIncome,
      "Philhealth": d.philhealth,
      "Pantawid Beneficiary": d.pantawid,
      "Indigenous Person": d.indigenous,
      "LGBTQ+": d.lgbtq,
      "Children": (d.children || []).map(c => `${c.name} (${c.birthdate}, Age: ${c.age})`).join(" | ")
    }));
    const ws = XLSX.utils.json_to_sheet(records, { header: headers });
    XLSX.utils.book_append_sheet(wb, ws, barangay);
  });
  XLSX.writeFile(wb, "SoloParentImportData.xlsx");
}

/* =========================
   Build registration children inputs
   ========================= */
function buildChildrenInputs() {
  const container = childrenInputsContainer;
  if (!container) return;
  container.innerHTML = "";
  for (let i = 1; i <= CHILDREN_MAX; i++) {
    const row = document.createElement("div");
    row.className = "child-row";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Child " + i + " Name";

    const birthInput = document.createElement("input");
    birthInput.type = "date";

    const ageLabel = document.createElement("label");
    ageLabel.textContent = "Age:";
    const ageInput = document.createElement("input");
    ageInput.type = "text";
    ageInput.className = "child-age";
    ageInput.readOnly = true;

    birthInput.addEventListener("input", () => {
      ageInput.value = calculateAge(birthInput.value);
    });

    if (i === 1) {
      nameInput.required = true;
      birthInput.required = true;
    }

    row.appendChild(nameInput);
    row.appendChild(birthInput);
    row.appendChild(ageLabel);
    row.appendChild(ageInput);
    container.appendChild(row);
  }
}

/* =========================
   Render functions
   ========================= */
function renderSecondaryGlobalResults(filtered) {
  filteredData = filtered || [];
  const tbody = document.querySelector("#secondaryGlobalResultsTable tbody");
  tbody.innerHTML = "";
  if (!filteredData || filteredData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="22" style="text-align:center; color:red;">No matches found</td></tr>`;
    return;
  }
  filteredData.forEach((d, i) => {
    const expirationClass = d.idExpiration ? (new Date(d.idExpiration) < new Date() ? "expired" : "valid") : "";
    const row = `
      <tr>
        <td>${i + 1}</td>
        <td>${d.lastName || ""}</td>
        <td>${d.firstName || ""}</td>
        <td>${d.middleName || ""}</td>
        <td>${d.suffix || ""}</td>
        <td>${d.gender || ""}</td>
        <td>${formatDate(d.birthdate)}</td>
        <td>${formatDate(d.dateRegistered)}</td>
        <td>${calculateAge(d.birthdate)}</td>
        <td>${d.barangay || ""}</td>
        <td>${d.category || ""}</td>
        <td>${d.bqCode || ""}</td>
        <td>${d.spId || ""}</td>
        <td class="${expirationClass}">${formatDate(d.idExpiration)}</td>
        <td><button class="childrenBtn" data-index="${i}" type="button">Children</button></td>
        <td>${d.civilStatus || ""}</td>
        <td>${d.employmentStatus || ""}</td>
        <td>${d.monthlyIncome || ""}</td>
        <td>${d.philhealth || ""}</td>
        <td>${d.pantawid || ""}</td>
        <td>${d.indigenous || ""}</td>
        <td>${d.lgbtq || ""}</td>
        <td><button class="editBtn" data-index="${i}" type="button">Edit 🖊️</button></td>
        <td><button class="deleteBtn" data-index="${i}" type="button">Delete 🗑️</button></td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

function renderTable(filtered = data) {
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";
  if (!filtered || filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="22" style="text-align:center; color:red;">No data Found</td></tr>`;
    return;
  }
  filtered.forEach((d, i) => {
    const expirationClass = d.idExpiration ? (new Date(d.idExpiration) < new Date() ? "expired" : "valid") : "";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${d.lastName || ""}</td>
      <td>${d.firstName || ""}</td>
      <td>${d.middleName || ""}</td>
      <td>${d.suffix || ""}</td>
      <td>${d.gender === "Male" ? "M" : d.gender === "Female" ? "F" : ""}</td>
      <td>${formatDate(d.birthdate)}</td>
      <td>${formatDate(d.dateRegistered)}</td>
      <td>${calculateAge(d.birthdate)}</td>
      <td>${d.barangay || ""}</td>
      <td class="category category-${d.category}"><strong>${d.category || ""}</strong></td>
      <td>${d.bqCode || ""}</td>
      <td>${d.spId || ""}</td>
      <td class="${expirationClass}">${formatDate(d.idExpiration)}</td>
      <td><button class="childrenBtn" data-index="${i}" type="button">Children</button></td>
      <td>${d.civilStatus || ""}</td>
      <td>${d.employmentStatus || ""}</td>
      <td>${d.monthlyIncome || ""}</td>
      <td>${d.philhealth || ""}</td>
      <td>${d.pantawid || ""}</td>
      <td>${d.indigenous || ""}</td>
      <td>${d.lgbtq || ""}</td>
      <td><button class="editBtn" data-index="${i}" type="button">Edit 🖊️</button></td>
      <td><button class="deleteBtn" data-index="${i}" type="button">Delete 🗑️</button></td>
    `;
    tbody.appendChild(row);
  });
}

/* =========================
   Details & Children Popups
   ========================= */
function showDetailsPopup(record) {
  if (!record) return;
  const rows = `
    <tr><th>Last Name</th><td>${record.lastName}</td></tr>
    <tr><th>First Name</th><td>${record.firstName}</td></tr>
    <tr><th>Middle Name</th><td>${record.middleName}</td></tr>
    <tr><th>Suffix</th><td>${record.suffix}</td></tr>
    <tr><th>Gender</th><td>${record.gender}</td></tr>
    <tr><th>Birthdate</th><td>${formatDate(record.birthdate)}</td></tr>
    <tr><th>Date Registered</th><td>${formatDate(record.dateRegistered)}</td></tr>
    <tr><th>Age</th><td>${calculateAge(record.birthdate)}</td></tr>
    <tr><th>Barangay</th><td>${record.barangay}</td></tr>
    <tr><th>Category</th><td>${record.category}</td></tr>
    <tr><th>BQ Code</th><td>${record.bqCode}</td></tr>
    <tr><th>SP ID</th><td>${record.spId}</td></tr>
    <tr><th>ID Expiration</th><td>${formatDate(record.idExpiration)}</td></tr>
    <tr><th>Civil Status</th><td>${record.civilStatus}</td></tr>
    <tr><th>Employment Status</th><td>${record.employmentStatus}</td></tr>
    <tr><th>Monthly Income</th><td>${record.monthlyIncome}</td></tr>
    <tr><th>Philhealth</th><td>${record.philhealth}</td></tr>
    <tr><th>Pantawid</th><td>${record.pantawid}</td></tr>
    <tr><th>Indigenous</th><td>${record.indigenous}</td></tr>
    <tr><th>LGBTQ+</th><td>${record.lgbtq}</td></tr>
    <tr>
      <th>Children</th>
      <td>
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr><th>No.</th><th>Name</th><th>Birthdate</th><th>Age</th></tr>
          </thead>
          <tbody>
            ${(record.children || []).map((c, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${c.name}</td>
                <td>${formatDate(c.birthdate)}</td>
                <td>${calculateAge(c.birthdate)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </td>
    </tr>
  `;
  document.getElementById("detailsPopupBody").innerHTML = `<table><tbody>${rows}</tbody></table>`;
  openPopup("detailsPopup");
  document.getElementById("detailsPopupClose").onclick = () => closePopup("detailsPopup");
  document.getElementById("detailsPopupBack").onclick = () => closePopup("detailsPopup");
}

function showChildrenPopup(children, parentFullName = "") {
  const body = document.getElementById("childrenPopupBody");

  if (!children || children.length === 0) {
    body.innerHTML = `
      <h3>Children Details</h3>
      ${parentFullName ? `<div style="font-weight:700; margin-bottom:8px;">Parent: ${parentFullName}</div>` : ""}
      <p style="color:red; font-weight:bold;">No children data available.</p>
    `;
  } else {
    const rows = children.map((c, i) => {
      const age = calculateAge(c.birthdate);
      let colorClass = "";
      if (age <= 21) colorClass = "child-green";
      else if (age === 22) colorClass = "child-yellow";
      else if (age >= 23) colorClass = "child-red";

      return `
        <tr>
          <td>${i + 1}</td>
          <td>${c.name}</td>
          <td>${formatDate(c.birthdate)}</td>
          <td class="${colorClass}">${age}</td>
        </tr>
      `;
    }).join("");

    body.innerHTML = `
      <h3>Children Details</h3>
      ${parentFullName ? `<div style="font-weight:700; margin-bottom:8px;">Parent: ${parentFullName}</div>` : ""}
      <div style="margin-bottom:8px;">
        <span style="color:green; font-weight:bold;">Green:</span> Age 0–21 &nbsp; 
        <span style="color:goldenrod; font-weight:bold;">Yellow:</span> Age 22 &nbsp; 
        <span style="color:red; font-weight:bold;">Red:</span> Age 23+
      </div>
      <div class="scrollable-table" style="margin-top:8px;">
        <table class="children-summary-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Name</th>
              <th>Birthdate</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  openPopup("childrenPopup");
  document.getElementById("childrenPopupBack").onclick = () => closePopup("childrenPopup");
  document.getElementById("childrenPopupClose").onclick = () => closePopup("childrenPopup");
}


/* =========================
   Edit/Delete/Registration (kept intact)
   ========================= */
/* Edit popup builder and handlers (kept, unchanged except minor cleanup) */
function buildEditChildrenRows(children, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  (children || []).forEach((c, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "edit-child-wrapper";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = `editChildName${idx}`;
    nameInput.value = c.name || "";
    nameInput.placeholder = `Child ${idx + 1} Name`;

    const birthInput = document.createElement("input");
    birthInput.type = "date";
    birthInput.id = `editChildBirthday${idx}`;
    birthInput.value = c.birthdate || "";

    const ageInput = document.createElement("input");
    ageInput.type = "text";
    ageInput.id = `editChildAge${idx}`;
    ageInput.value = calculateAge(c.birthdate);
    ageInput.readOnly = true;

    birthInput.addEventListener("input", () => {
      ageInput.value = calculateAge(birthInput.value);
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "removeChildBtn";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      children.splice(idx, 1);
      buildEditChildrenRows(children, containerId);
    });

    wrapper.appendChild(nameInput);
    wrapper.appendChild(birthInput);
    wrapper.appendChild(ageInput);
    wrapper.appendChild(removeBtn);
    container.appendChild(wrapper);
  });

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.id = "addChildBtn";
  addBtn.textContent = "Add Child";
  addBtn.addEventListener("click", () => {
    if ((children || []).length >= CHILDREN_MAX) {
      alert(`Maximum ${CHILDREN_MAX} children allowed.`);
      return;
    }
    children.push({ name: "", birthdate: "", age: "" });
    buildEditChildrenRows(children, containerId);
  });
  container.appendChild(addBtn);
}

function showEditPopup(record, idx) {
  if (!record) return;

  const barangayOptions = cloneSelectOptions("barangay");
  const categoryOptions = cloneSelectOptions("category");
  const bqCodeOptions = cloneSelectOptions("bqCode");
  const civilStatusOptions = cloneSelectOptions("civilStatus");
  const employmentOptions = cloneSelectOptions("employmentStatus");
  const monthlyIncomeOptions = cloneSelectOptions("monthlyIncome");

  document.getElementById("editFormBody").innerHTML = `
    <div>
      <label>Last Name</label>
      <input type="text" id="editLastName" value="${record.lastName || ""}" required>
    </div>
    <div>
      <label>First Name</label>
      <input type="text" id="editFirstName" value="${record.firstName || ""}" required>
    </div>

    <div>
      <label>Middle Name</label>
      <input type="text" id="editMiddleName" value="${record.middleName || ""}">
    </div>
    <div>
      <label>Suffix</label>
      <select id="editSuffix">
        <option value="">None</option>
        <option value="Jr.">Jr.</option>
        <option value="Sr.">Sr.</option>
        <option value="II">II</option>
        <option value="III">III</option>
      </select>
    </div>

    <div>
      <label>Gender</label>
      <select id="editGender">
        <option value="">Select</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
    </div>
    <div>
      <label>Birthdate</label>
      <input type="date" id="editBirthdate" value="${record.birthdate || ""}">
    </div>

    <div>
      <label>Age</label>
      <input type="text" id="editAge" value="${calculateAge(record.birthdate)}" readonly>
    </div>
    <div>
      <label>Date Registered</label>
      <input type="date" id="editDateRegistered" value="${record.dateRegistered || ""}">
    </div>

    <div>
      <label>Barangay</label>
      <select id="editBarangay">${barangayOptions}</select>
    </div>
    <div>
      <label>Category</label>
      <select id="editCategory">${categoryOptions}</select>
    </div>

    <div>
      <label>BQ Code</label>
      <select id="editBqCode">${bqCodeOptions}</select>
    </div>
    <div>
      <label>SP ID Number</label>
      <input type="text" id="editSpId" value="${record.spId || ""}">
    </div>

    <div>
      <label>ID Expiration</label>
      <input type="date" id="editIdExpiration" value="${record.idExpiration || ""}">
    </div>
    <div>
      <label>Civil Status</label>
      <select id="editCivilStatus">${civilStatusOptions}</select>
    </div>

    <div>
      <label>Employment Status</label>
      <select id="editEmploymentStatus">${employmentOptions}</select>
    </div>
    <div>
      <label>Monthly Income</label>
      <select id="editMonthlyIncome">${monthlyIncomeOptions}</select>
    </div>

    <div>
      <label>Philhealth</label>
      <select id="editPhilhealth">
        <option value="">Select</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
    </div>

    <div>
      <label>Pantawid</label>
      <select id="editPantawid">
        <option value="">Select</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
    </div>

    <div>
      <label>Indigenous Person</label>
      <select id="editIndigenous">
        <option value="">Select</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
    </div>
    <div>
      <label>LGBTQ+</label>
      <select id="editLgbtq">
        <option value="">Select</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
    </div>

    <div style="grid-column: 1 / -1;">
      <h4>Children</h4>
      <div id="editChildrenContainer"></div>
    </div>
  `;

  setSelectValue(document.getElementById("editSuffix"), record.suffix || "");
  setSelectValue(document.getElementById("editGender"), record.gender || "");
  setSelectValue(document.getElementById("editBarangay"), record.barangay || "");
  setSelectValue(document.getElementById("editCategory"), record.category || "");
  setSelectValue(document.getElementById("editBqCode"), record.bqCode || "");
  setSelectValue(document.getElementById("editCivilStatus"), record.civilStatus || "");
  setSelectValue(document.getElementById("editEmploymentStatus"), record.employmentStatus || "");
  setSelectValue(document.getElementById("editMonthlyIncome"), record.monthlyIncome || "");
  setSelectValue(document.getElementById("editPhilhealth"), record.philhealth || "");
  setSelectValue(document.getElementById("editPantawid"), record.pantawid || "");
  setSelectValue(document.getElementById("editIndigenous"), record.indigenous || "");
  setSelectValue(document.getElementById("editLgbtq"), record.lgbtq || "");

  record.children = record.children || [];
  buildEditChildrenRows(record.children, "editChildrenContainer");

  const editBirthdateEl = document.getElementById("editBirthdate");
  const editAgeEl = document.getElementById("editAge");
  if (editBirthdateEl) {
    editBirthdateEl.addEventListener("input", (e) => {
      editAgeEl.value = calculateAge(e.target.value);
    });
  }

  openPopup("editPopup");

  const confirmBtn = document.getElementById("editPopupConfirm");
  const cancelBtn = document.getElementById("editPopupCancel");
  const closeBtn = document.getElementById("editPopupClose");

  if (confirmBtn) confirmBtn.replaceWith(confirmBtn.cloneNode(true));
  if (cancelBtn) cancelBtn.replaceWith(cancelBtn.cloneNode(true));
  if (closeBtn) closeBtn.replaceWith(closeBtn.cloneNode(true));

  const newConfirm = document.getElementById("editPopupConfirm");
  const newCancel = document.getElementById("editPopupCancel");
  const newClose = document.getElementById("editPopupClose");

  newConfirm.addEventListener("click", () => {
    const lastName = document.getElementById("editLastName").value.trim();
    const firstName = document.getElementById("editFirstName").value.trim();
    const barangay = document.getElementById("editBarangay").value.trim();
    const category = document.getElementById("editCategory").value.trim();
    const civilStatus = document.getElementById("editCivilStatus").value.trim();
    const employmentStatus = document.getElementById("editEmploymentStatus").value.trim();

    if (!lastName || !firstName || !barangay || !category || !civilStatus || !employmentStatus) {
      openPopup("editValidationPopup");
      return;
    }

    record.lastName = lastName;
    record.firstName = firstName;
    record.middleName = document.getElementById("editMiddleName").value.trim();
    record.suffix = document.getElementById("editSuffix").value;
    record.gender = document.getElementById("editGender").value;
    record.birthdate = document.getElementById("editBirthdate").value;
    record.age = calculateAge(record.birthdate);
    record.dateRegistered = document.getElementById("editDateRegistered").value;
    record.barangay = document.getElementById("editBarangay").value;
    record.category = document.getElementById("editCategory").value;
    record.bqCode = document.getElementById("editBqCode").value;
    record.spId = document.getElementById("editSpId").value;
    record.idExpiration = document.getElementById("editIdExpiration").value;
    record.civilStatus = document.getElementById("editCivilStatus").value;
    record.employmentStatus = document.getElementById("editEmploymentStatus").value;
    record.monthlyIncome = document.getElementById("editMonthlyIncome").value;
    record.philhealth = document.getElementById("editPhilhealth").value;
    record.pantawid = document.getElementById("editPantawid").value;
    record.indigenous = document.getElementById("editIndigenous").value;
    record.lgbtq = document.getElementById("editLgbtq").value;
    record.fullName = `${record.lastName}, ${record.firstName} ${record.middleName || ""} ${record.suffix || ""}`.trim();

    const childWrappers = document.querySelectorAll("#editChildrenContainer .edit-child-wrapper");
    const newChildren = [];
    childWrappers.forEach((w, i) => {
      const name = w.querySelector(`#editChildName${i}`)?.value?.trim() || "";
      const birth = w.querySelector(`#editChildBirthday${i}`)?.value || "";
      const age = birth ? calculateAge(birth) : (w.querySelector(`#editChildAge${i}`)?.value || "");
      if (name !== "") newChildren.push({ name, birthdate: birth, age });
    });
    record.children = newChildren;

    data[idx] = record;
    localStorage.setItem("soloParentsData", JSON.stringify(data));
    renderTable();
    renderSecondaryGlobalResults(filteredData);

    closePopup("editPopup");
    openPopup("editSuccessPopup");
  });

  newCancel.addEventListener("click", () => closePopup("editPopup"));
  newClose.addEventListener("click", () => closePopup("editPopup"));

  document.getElementById("editSuccessPopupBack").onclick = () => closePopup("editSuccessPopup");
  document.getElementById("editSuccessPopupClose").onclick = () => closePopup("editSuccessPopup");
  document.getElementById("editValidationPopupBack").onclick = () => { closePopup("editValidationPopup"); openPopup("editPopup"); };
  document.getElementById("editValidationPopupClose").onclick = () => { closePopup("editValidationPopup"); openPopup("editPopup"); };
}

/* =========================
   Delete popup
   ========================= */
function showDeletePopup(record, idx) {
  if (!record) return;

  const childrenRows = (record.children || []).map((c, i) => `
    <tr>
      <td style="padding:6px; border:1px solid #ddd;">${i + 1}</td>
      <td style="padding:6px; border:1px solid #ddd;">${c.name}</td>
      <td style="padding:6px; border:1px solid #ddd;">${formatDate(c.birthdate)}</td>
      <td style="padding:6px; border:1px solid #ddd;">${calculateAge(c.birthdate)}</td>
    </tr>
  `).join("") || `<tr><td colspan="4" style="padding:6px; border:1px solid #ddd; text-align:center;">No children</td></tr>`;

  const mainTable = `
    <table style="width:100%; border-collapse: collapse;">
      <tbody>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Full Name</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.fullName}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>SP ID</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.spId}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Gender</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.gender}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Civil Status</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.civilStatus}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Birthdate (Age)</strong></td><td style="padding:6px; border:1px solid #ddd;">${formatDate(record.birthdate)} (${record.age || calculateAge(record.birthdate)})</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Employment Status</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.employmentStatus}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Date Registered</strong></td><td style="padding:6px; border:1px solid #ddd;">${formatDate(record.dateRegistered)}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Monthly Income</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.monthlyIncome}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Barangay</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.barangay}, Loay, Bohol</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Pantawid</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.pantawid}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Category</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.category}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Indigenous</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.indigenous}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>BQ Code</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.bqCode}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>LGBTQ+</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.lgbtq}</td></tr>
        <tr><td style="padding:6px; border:1px solid #ddd;"><strong>ID Expiration</strong></td><td style="padding:6px; border:1px solid #ddd;">${formatDate(record.idExpiration)}</td></tr>
      </tbody>
    </table>
  `;

  const childrenTable = `
    <h4>Children</h4>
    <table style="width:100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="padding:6px; border:1px solid #ddd;">No.</th>
          <th style="padding:6px; border:1px solid #ddd;">Name</th>
          <th style="padding:6px; border:1px solid #ddd;">Birthdate</th>
          <th style="padding:6px; border:1px solid #ddd;">Age</th>
        </tr>
      </thead>
      <tbody>
        ${childrenRows}
      </tbody>
    </table>
  `;

  document.getElementById("deletePopupBody").innerHTML = `
    <h3 style="color:red; font-weight:bold;">Confirm Delete</h3>
    <div class="scrollable-table">
      ${mainTable}
      <div style="margin-top:12px;">${childrenTable}</div>
      <p style="color:red; font-weight:bold; margin-top:12px;">Are you sure you want to delete this record?</p>
    </div>
  `;

  openPopup("deletePopup");
  document.getElementById("deletePopupConfirm").onclick = () => {
    data.splice(idx, 1);
    localStorage.setItem("soloParentsData", JSON.stringify(data));
    renderTable();
    renderSecondaryGlobalResults(filteredData);
    closePopup("deletePopup");
  };
  document.getElementById("deletePopupCancel").onclick = () => closePopup("deletePopup");
  document.getElementById("deletePopupClose").onclick = () => closePopup("deletePopup");
}

/* =========================
   Category search
   ========================= */
categorySearchBtn.addEventListener("click", function () {
  const val = categorySearch.value;
  if (!val) { renderTable(); return; }
  const counts = {};
  data.forEach(d => { if (d.category === val) counts[d.barangay] = (counts[d.barangay] || 0) + 1; });
  const total = Object.values(counts).reduce((a,b) => a + b, 0);
  const rows = Object.entries(counts).sort(([a],[b]) => a.localeCompare(b)).map(([barangay, count]) => `
    <tr><td class="barangay-cell">${barangay}</td><td class="category-cell category-${val}">${count}</td></tr>
  `).join("");
  document.getElementById("categoryPopupBody").innerHTML = `
    <h3>Category Search Result</h3>
    <div class="scrollable-table">
      <table class="category-summary-table">
        <thead><tr><th class="barangay-cell">Barangay</th><th class="category-cell category-${val}">${val}</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td class="barangay-cell"><strong>Total</strong></td><td class="category-cell category-${val}"><strong>${total}</strong></td></tr></tfoot>
      </table>
    </div>
  `;
  openPopup("categoryPopup");
  document.getElementById("categoryPopupBack").onclick = () => closePopup("categoryPopup");
  document.getElementById("categoryPopupClose").onclick = () => closePopup("categoryPopup");
});

/* =========================
   Secondary global search (existing)
   ========================= */
secondaryGlobalSearch.addEventListener("input", function () {
  const val = this.value.trim().toLowerCase();
  const tbody = document.querySelector("#secondaryGlobalResultsTable tbody");
  if (val === "") { tbody.innerHTML = ""; filteredData = []; return; }
  const filtered = data.filter(d => {
    const recordString = Object.keys(d).map(key => {
      if (key === "children" && Array.isArray(d.children)) return d.children.map(c => `${c.name} ${c.birthdate} ${c.age}`).join(" ");
      return String(d[key] || "");
    }).join(" ").toLowerCase();
    return recordString.includes(val);
  });
  renderSecondaryGlobalResults(filtered);
});

secondaryGlobalClearBtn.addEventListener("click", function () {
  secondaryGlobalSearch.value = "";
  document.querySelector("#secondaryGlobalResultsTable tbody").innerHTML = "";
  filteredData = [];
});

/* =========================
   LIVE NAME SEARCH (NEW)
   - Matches any part of the name in any order
   - Partial matches allowed (letter-by-letter)
   - Shows results below the search bar with Show Details button
   ========================= */
function normalizeNameString(s) {
  return (s || "").toString().replace(/\s+/g, " ").trim().toLowerCase();
}

function nameMatchesQuery(record, queryTokens) {
  // Build searchable name variants: fullName, last-first-middle, first-middle-last, without suffix
  const parts = [
    `${record.lastName || ""} ${record.firstName || ""} ${record.middleName || ""} ${record.suffix || ""}`,
    `${record.firstName || ""} ${record.middleName || ""} ${record.lastName || ""} ${record.suffix || ""}`,
    `${record.firstName || ""} ${record.lastName || ""} ${record.middleName || ""}`,
    `${record.lastName || ""} ${record.firstName || ""} ${record.middleName || ""}`
  ].map(normalizeNameString);

  // Also include SP ID as searchable field
  if (record.spId) parts.push(normalizeNameString(record.spId));

  // For each token in query, ensure at least one part contains it
  return queryTokens.every(token => parts.some(p => p.includes(token)));
}

function performNameSearch(query) {
  const q = normalizeNameString(query);
  if (!q) return [];
  const tokens = q.split(" ").filter(Boolean);
  // Return matches with original index in data
  const matches = [];
  data.forEach((rec, idx) => {
    if (nameMatchesQuery(rec, tokens)) matches.push({ rec, idx });
  });
  return matches;
}

function renderNameSearchResults(matches) {
  nameSearchResults.innerHTML = "";
  if (!matches || matches.length === 0) {
    nameSearchResults.innerHTML = `<div class="no-results" style="color:#b00; padding:8px;">No matches found</div>`;
    return;
  }
  const list = document.createElement("div");
  list.className = "name-results-list";
  matches.forEach(({ rec, idx }) => {
    const item = document.createElement("div");
    item.className = "name-result-item";
    const displayName = rec.fullName || `${rec.lastName || ""}, ${rec.firstName || ""} ${rec.middleName || ""} ${rec.suffix || ""}`.trim();
    item.innerHTML = `
      <span class="result-name">${displayName}</span>
      <button class="result-details-btn" data-index="${idx}" type="button">Show Details</button>
    `;
    list.appendChild(item);
  });
  nameSearchResults.appendChild(list);
}

// Live search: letter-by-letter
if (nameSearchInput) {
  nameSearchInput.addEventListener("input", (e) => {
    const q = e.target.value;
    if (!q || q.trim() === "") {
      nameSearchResults.innerHTML = "";
      return;
    }
    const matches = performNameSearch(q);
    renderNameSearchResults(matches);
  });
}

// Clear button
if (nameSearchClear) {
  nameSearchClear.addEventListener("click", () => {
    if (nameSearchInput) nameSearchInput.value = "";
    nameSearchResults.innerHTML = "";
    nameSearchInput.focus();
  });
}

// Delegate clicks on Show Details buttons in name search results
if (nameSearchResults) {
  nameSearchResults.addEventListener("click", (e) => {
    const t = e.target;
    if (t.classList.contains("result-details-btn")) {
      const idx = parseInt(t.getAttribute("data-index"), 10);
      const record = data[idx];
      if (record) {
        showDetailsPopup(record);
      } else {
        alert("Record not found.");
      }
    }
  });
}

/* =========================
   Table Event Delegation
   ========================= */
document.querySelector("#dataTable").addEventListener("click", (e) => {
  const t = e.target;
  if (t.classList.contains("childrenBtn")) {
    const idx = parseInt(t.getAttribute("data-index"), 10);
    const parent = data[idx] || {};
    const parentFullName = parent.fullName || `${parent.lastName || ""}, ${parent.firstName || ""}`.trim();
    showChildrenPopup(parent.children || [], parentFullName);
  } else if (t.classList.contains("editBtn")) {
    const idx = parseInt(t.getAttribute("data-index"), 10);
    showEditPopup(data[idx], idx);
  } else if (t.classList.contains("deleteBtn")) {
    const idx = parseInt(t.getAttribute("data-index"), 10);
    showDeletePopup(data[idx], idx);
  }
});

document.querySelector("#secondaryGlobalResultsTable").addEventListener("click", (e) => {
  const t = e.target;
  if (t.classList.contains("childrenBtn")) {
    const idx = parseInt(t.getAttribute("data-index"), 10);
    const parent = filteredData[idx] || {};
    const parentFullName = parent.fullName || `${parent.lastName || ""}, ${parent.firstName || ""}`.trim();
    showChildrenPopup(parent.children || [], parentFullName);
  } else if (t.classList.contains("editBtn")) {
    const idx = parseInt(t.getAttribute("data-index"), 10);
    const record = filteredData[idx];
    const mainIdx = data.indexOf(record);
    if (mainIdx !== -1) showEditPopup(record, mainIdx);
    else {
      const fallbackIdx = data.findIndex(d => d.spId === record.spId || d.fullName === record.fullName);
      if (fallbackIdx !== -1) showEditPopup(data[fallbackIdx], fallbackIdx);
      else alert("Record not found in main dataset.");
    }
  } else if (t.classList.contains("deleteBtn")) {
    const idx = parseInt(t.getAttribute("data-index"), 10);
    const record = filteredData[idx];
    const mainIdx = data.indexOf(record);
    if (mainIdx !== -1) showDeletePopup(record, mainIdx);
    else {
      const fallbackIdx = data.findIndex(d => d.spId === record.spId || d.fullName === record.fullName);
      if (fallbackIdx !== -1) showDeletePopup(data[fallbackIdx], fallbackIdx);
      else alert("Record not found in main dataset.");
    }
  }
});

/* =========================
   Register form handling
   ========================= */
registerForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const lastName = document.getElementById("lastName").value.trim();
  const firstName = document.getElementById("firstName").value.trim();
  const middleName = document.getElementById("middleName").value.trim();
  const suffix = document.getElementById("suffix").value.trim();
  const gender = document.getElementById("gender").value.trim();
  const birthdate = document.getElementById("birthdate").value.trim();
  const dateRegistered = document.getElementById("dateRegistered").value.trim();
  const barangay = document.getElementById("barangay").value.trim();
  const category = document.getElementById("category").value.trim();
  const bqCode = document.getElementById("bqCode").value.trim();
  const spId = document.getElementById("spId").value.trim();
  const idExpiration = document.getElementById("idExpiration").value.trim();
  const civilStatus = document.getElementById("civilStatus").value.trim();
  const employmentStatus = document.getElementById("employmentStatus").value.trim();
  const monthlyIncome = document.getElementById("monthlyIncome").value.trim();
  const philhealth = (document.querySelector("input[name='philhealth']:checked")?.value.trim()) || "";
  const pantawid = (document.querySelector("input[name='pantawid']:checked")?.value.trim()) || "";
  const indigenous = (document.querySelector("input[name='indigenous']:checked")?.value.trim()) || "";
  const lgbtq = (document.querySelector("input[name='lgbtq']:checked")?.value.trim()) || "";

  const children = [];
  document.querySelectorAll("#childrenInputs .child-row").forEach(row => {
    const name = row.querySelector("input[type='text']").value.trim();
    const birth = row.querySelector("input[type='date']").value;
    const age = birth ? calculateAge(birth) : "";
    if (name !== "") children.push({ name, birthdate: birth, age });
  });

  const age = birthdate ? calculateAge(birthdate) : "";
  const fullName = `${lastName}, ${firstName} ${middleName} ${suffix}`.trim();

  const inputRecord = {
    lastName, firstName, middleName, suffix, gender, birthdate, dateRegistered,
    barangay, category, bqCode, spId, idExpiration, civilStatus,
    employmentStatus, monthlyIncome, philhealth, pantawid, indigenous, lgbtq,
    age, children, fullName
  };

  const duplicateIdx = data.findIndex(d => (d.fullName && d.fullName === fullName) || (d.spId && d.spId === spId));
  const duplicate = duplicateIdx !== -1 ? data[duplicateIdx] : null;

  function buildRecordTable(record) {
    const childrenRows = (record.children || []).map((c, i) => `
      <tr>
        <td style="padding:6px; border:1px solid #ddd;">${i + 1}</td>
        <td style="padding:6px; border:1px solid #ddd;">${c.name}</td>
        <td style="padding:6px; border:1px solid #ddd;">${formatDate(c.birthdate)}</td>
        <td style="padding:6px; border:1px solid #ddd;">${calculateAge(c.birthdate)}</td>
      </tr>
    `).join("") || `<tr><td colspan="4" style="padding:6px; border:1px solid #ddd; text-align:center;">No children</td></tr>`;

    const mainTable = `
      <table style="width:100%; border-collapse: collapse;">
        <tbody>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Full Name</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.fullName}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>SP ID</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.spId}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Gender</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.gender}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Civil Status</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.civilStatus}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Birthdate (Age)</strong></td><td style="padding:6px; border:1px solid #ddd;">${formatDate(record.birthdate)} (${record.age || calculateAge(record.birthdate)})</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Employment Status</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.employmentStatus}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Date Registered</strong></td><td style="padding:6px; border:1px solid #ddd;">${formatDate(record.dateRegistered)}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Monthly Income</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.monthlyIncome}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Barangay</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.barangay}, Loay, Bohol</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Pantawid</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.pantawid}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Category</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.category}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Indigenous</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.indigenous}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>BQ Code</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.bqCode}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>LGBTQ+</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.lgbtq}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>ID Expiration</strong></td><td style="padding:6px; border:1px solid #ddd;">${formatDate(record.idExpiration)}</td></tr>
        </tbody>
      </table>
    `;

    const childrenTable = `
      <h4>Children</h4>
      <table style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding:6px; border:1px solid #ddd;">No.</th>
            <th style="padding:6px; border:1px solid #ddd;">Name</th>
            <th style="padding:6px; border:1px solid #ddd;">Birthdate</th>
            <th style="padding:6px; border:1px solid #ddd;">Age</th>
          </tr>
        </thead>
        <tbody>
          ${childrenRows}
        </tbody>
      </table>
    `;

    return { mainTable, childrenTable };
  }

  if (duplicate) {
    const inputTables = buildRecordTable(inputRecord);
    const existingTables = buildRecordTable(duplicate);

    document.getElementById("registrationPopupBody").innerHTML = `
      <h3 style="grid-column: span 2;">Duplicate Detected - Compare Input vs Existing</h3>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
        <div style="border:1px solid #ccc; padding:8px; background:#fff;">
          <h4 style="margin-top:0;">Your Input</h4>
          ${inputTables.mainTable}
          <div style="margin-top:8px;">${inputTables.childrenTable}</div>
        </div>
        <div style="border:1px solid #ccc; padding:8px; background:#fff;">
          <h4 style="margin-top:0;">Existing Record</h4>
          ${existingTables.mainTable}
          <div style="margin-top:8px;">${existingTables.childrenTable}</div>
        </div>
      </div>
      <p style="color:orange; font-weight:bold; margin-top:12px;">Do you want to update the existing record with your input?</p>
    `;

    openPopup("registrationPopup");

    document.getElementById("registrationPopupConfirm").onclick = () => {
      Object.assign(duplicate, {
        lastName: inputRecord.lastName,
        firstName: inputRecord.firstName,
        middleName: inputRecord.middleName,
        suffix: inputRecord.suffix,
        gender: inputRecord.gender,
        birthdate: inputRecord.birthdate,
        dateRegistered: inputRecord.dateRegistered,
        barangay: inputRecord.barangay,
        category: inputRecord.category,
        bqCode: inputRecord.bqCode,
        spId: inputRecord.spId,
        idExpiration: inputRecord.idExpiration,
        civilStatus: inputRecord.civilStatus,
        employmentStatus: inputRecord.employmentStatus,
        monthlyIncome: inputRecord.monthlyIncome,
        philhealth: inputRecord.philhealth,
        pantawid: inputRecord.pantawid,
        indigenous: inputRecord.indigenous,
        lgbtq: inputRecord.lgbtq,
        age: inputRecord.age,
        children: inputRecord.children,
        fullName: inputRecord.fullName
      });
      localStorage.setItem("soloParentsData", JSON.stringify(data));
      renderTable();
      renderSecondaryGlobalResults(filteredData);
      closePopup("registrationPopup");
      clearFormInputs();
    };

    document.getElementById("registrationPopupCancel").onclick = () => closePopup("registrationPopup");
    document.getElementById("registrationPopupClose").onclick = () => closePopup("registrationPopup");
    return;
  }

  const tables = (function buildSingleTables(record) {
    const childrenRows = (record.children || []).map((c, i) => `
      <tr>
        <td style="padding:6px; border:1px solid #ddd;">${i + 1}</td>
        <td style="padding:6px; border:1px solid #ddd;">${c.name}</td>
        <td style="padding:6px; border:1px solid #ddd;">${formatDate(c.birthdate)}</td>
        <td style="padding:6px; border:1px solid #ddd;">${calculateAge(c.birthdate)}</td>
      </tr>
    `).join("") || `<tr><td colspan="4" style="padding:6px; border:1px solid #ddd; text-align:center;">No children</td></tr>`;

    const mainTable = `
      <table style="width:100%; border-collapse: collapse;">
        <tbody>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Full Name</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.fullName}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>SP ID</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.spId}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Gender</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.gender}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Civil Status</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.civilStatus}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Birthdate (Age)</strong></td><td style="padding:6px; border:1px solid #ddd;">${formatDate(record.birthdate)} (${record.age || calculateAge(record.birthdate)})</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Employment Status</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.employmentStatus}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Date Registered</strong></td><td style="padding:6px; border:1px solid #ddd;">${formatDate(record.dateRegistered)}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Monthly Income</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.monthlyIncome}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Barangay</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.barangay}, Loay, Bohol</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Pantawid</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.pantawid}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Category</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.category}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>Indigenous</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.indigenous}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>BQ Code</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.bqCode}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>LGBTQ+</strong></td><td style="padding:6px; border:1px solid #ddd;">${record.lgbtq}</td></tr>
          <tr><td style="padding:6px; border:1px solid #ddd;"><strong>ID Expiration</strong></td><td style="padding:6px; border:1px solid #ddd;">${formatDate(record.idExpiration)}</td></tr>
        </tbody>
      </table>
    `;

    const childrenTable = `
      <h4>Children</h4>
      <table style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding:6px; border:1px solid #ddd;">No.</th>
            <th style="padding:6px; border:1px solid #ddd;">Name</th>
            <th style="padding:6px; border:1px solid #ddd;">Birthdate</th>
            <th style="padding:6px; border:1px solid #ddd;">Age</th>
          </tr>
        </thead>
        <tbody>
          ${childrenRows}
        </tbody>
      </table>
    `;

    return { mainTable, childrenTable };
  })(inputRecord);

  document.getElementById("registrationPopupBody").innerHTML = `
    <h3 style="grid-column: span 2;">Confirm Add Record</h3>
    <div class="scrollable-table">
      ${tables.mainTable}
      <div style="margin-top:12px;">${tables.childrenTable}</div>
      <p style="color:green; font-weight:bold; margin-top:12px;">Are you sure you want to Add this record?</p>
    </div>
  `;

  openPopup("registrationPopup");

  document.getElementById("registrationPopupConfirm").onclick = () => {
    data.push(inputRecord);
    localStorage.setItem("soloParentsData", JSON.stringify(data));
    renderTable();
    renderSecondaryGlobalResults(filteredData);
    closePopup("registrationPopup");
    clearFormInputs();
  };
  document.getElementById("registrationPopupCancel").onclick = () => closePopup("registrationPopup");
  document.getElementById("registrationPopupClose").onclick = () => closePopup("registrationPopup");
});

/* =========================
   Summaries (Gender & LGU)
   ========================= */
genderSummaryBtn.addEventListener("click", function () {
  const counts = {};
  let totalMale = 0, totalFemale = 0;
  data.forEach(d => {
    if (!counts[d.barangay]) counts[d.barangay] = { male: 0, female: 0 };
    if (d.gender === "Male") { counts[d.barangay].male++; totalMale++; }
    else if (d.gender === "Female") { counts[d.barangay].female++; totalFemale++; }
  });
  const rows = Object.entries(counts).sort(([a],[b]) => a.localeCompare(b)).map(([barangay, g]) => `
    <tr><td>${barangay}</td><td class="male-cell">${g.male}</td><td class="female-cell">${g.female}</td></tr>
  `).join("");
  document.getElementById("genderPopupBody").innerHTML = `
    <h3>Gender Summary</h3>
    <div class="scrollable-table">
      <table class="gender-summary-table">
        <thead><tr><th>Barangay</th><th>Male</th><th>Female</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td><strong>Total</strong></td><td><strong>${totalMale}</strong></td><td><strong>${totalFemale}</strong></td></tr></tfoot>
      </table>
    </div>
  `;
  openPopup("genderPopup");
  document.getElementById("genderPopupBack").onclick = () => closePopup("genderPopup");
  document.getElementById("genderPopupClose").onclick = () => closePopup("genderPopup");
});

lguSummaryBtn.addEventListener("click", function () {
  const summaryData = (data && data.length) ? data : getTableData();
  const summary = {
    age: { below19: 0, between20_39: 0, between40_59: 0, above60: 0 },
    sex: { male: 0, female: 0 },
    civilStatus: { single: 0, married: 0, widowed: 0, separated: 0 },
    employment: { employed: 0, selfEmployed: 0, notEmployed: 0 },
    income: { belowMin: 0, midRange: 0, above20k: 0 },
    children: { below6: 0, between7_22: 0, above22: 0 },
    category: {
      "CATEGORY-A": 0, "CATEGORY-A2": 0, "CATEGORY-A3": 0, "CATEGORY-A4": 0,
      "CATEGORY-A5": 0, "CATEGORY-A6": 0, "CATEGORY-A7": 0,
      "CATEGORY-B": 0, "CATEGORY-C": 0, "CATEGORY-D": 0,
      "CATEGORY-E": 0, "CATEGORY-F": 0
    },
    pantawid: { yes: 0, no: 0 },
    indigenous: { yes: 0, no: 0 },
    lgbtq: { yes: 0, no: 0 }
  };

  summaryData.forEach(d => {
    const age = calculateAge(d.birthdate);
    if (age <= 19) summary.age.below19++;
    else if (age <= 39) summary.age.between20_39++;
    else if (age <= 59) summary.age.between40_59++;
    else summary.age.above60++;

    if (d.gender === "Male") summary.sex.male++;
    else if (d.gender === "Female") summary.sex.female++;

    if (d.civilStatus === "Single") summary.civilStatus.single++;
    else if (d.civilStatus === "Married") summary.civilStatus.married++;
    else if (d.civilStatus === "Widowed") summary.civilStatus.widowed++;
    else if ((d.civilStatus || "").includes("Separated") || (d.civilStatus || "").includes("Annulled")) summary.civilStatus.separated++;

    if ((d.employmentStatus || "").includes("Employed")) summary.employment.employed++;
    else if ((d.employmentStatus || "").includes("Self")) summary.employment.selfEmployed++;
    else summary.employment.notEmployed++;

    const income = (d.monthlyIncome || "").trim();
    switch (income) {
      case INCOME_OPTIONS.BELOW_MIN: summary.income.belowMin++; break;
      case INCOME_OPTIONS.MID_RANGE: summary.income.midRange++; break;
      case INCOME_OPTIONS.ABOVE_20K: summary.income.above20k++; break;
      default: break;
    }

    (d.children || []).forEach(c => {
      const childAge = calculateAge(c.birthdate);
      if (childAge <= 6) summary.children.below6++;
      else if (childAge <= 22) summary.children.between7_22++;
      else summary.children.above22++;
    });

    if (summary.category[d.category] !== undefined) summary.category[d.category]++;
    if (d.pantawid === "Yes") summary.pantawid.yes++; else summary.pantawid.no++;
    if (d.indigenous === "Yes") summary.indigenous.yes++; else summary.indigenous.no++;
    if (d.lgbtq === "Yes") summary.lgbtq.yes++; else summary.lgbtq.no++;
  });

  const rows = `
    <tr><td><strong>Age</strong></td><td>
      <table class="inner-table">
        <tr><td>19 years old and below</td><td>${summary.age.below19}</td></tr>
        <tr><td>20–39 years old</td><td>${summary.age.between20_39}</td></tr>
        <tr><td>40–59 years old</td><td>${summary.age.between40_59}</td></tr>
        <tr><td>60 and above</td><td>${summary.age.above60}</td></tr>
      </table>
    </td></tr>
    <tr><td><strong>Gender</strong></td><td>
      <table class="inner-table">
        <tr><td>Male</td><td>${summary.sex.male}</td></tr>
        <tr><td>Female</td><td>${summary.sex.female}</td></tr>
      </table>
    </td></tr>
    <tr><td><strong>Civil Status</strong></td><td>
      <table class="inner-table">
        <tr><td>Single</td><td>${summary.civilStatus.single}</td></tr>
        <tr><td>Married</td><td>${summary.civilStatus.married}</td></tr>
        <tr><td>Widowed</td><td>${summary.civilStatus.widowed}</td></tr>
        <tr><td>Separated/Annulled</td><td>${summary.civilStatus.separated}</td></tr>
      </table>
    </td></tr>
    <tr><td><strong>Employment</strong></td><td>
      <table class="inner-table">
        <tr><td>Employed</td><td>${summary.employment.employed}</td></tr>
        <tr><td>Self-employed</td><td>${summary.employment.selfEmployed}</td></tr>
        <tr><td>Not employed</td><td>${summary.employment.notEmployed}</td></tr>
      </table>
    </td></tr>
    <tr><td><strong>Income</strong></td><td>
      <table class="inner-table">
        <tr><td>${INCOME_OPTIONS.BELOW_MIN}</td><td>${summary.income.belowMin}</td></tr>
        <tr><td>${INCOME_OPTIONS.MID_RANGE}</td><td>${summary.income.midRange}</td></tr>
        <tr><td>${INCOME_OPTIONS.ABOVE_20K}</td><td>${summary.income.above20k}</td></tr>
      </table>
    </td></tr>
    <tr><td><strong>Children</strong></td><td>
      <table class="inner-table">
        <tr><td>6 years old and below</td><td>${summary.children.below6}</td></tr>
        <tr><td>7–22 years old</td><td>${summary.children.between7_22}</td></tr>
        <tr><td>22 years old and above</td><td>${summary.children.above22}</td></tr>
      </table>
    </td></tr>
    <tr><td><strong>Category</strong></td><td>
      <table class="inner-table">
        ${Object.entries(summary.category).map(([cat, val]) => `<tr><td>${cat}</td><td>${val}</td></tr>`).join("")}
      </table>
    </td></tr>
    <tr><td><strong>Pantawid</strong></td><td>
      <table class="inner-table">
        <tr><td>Yes</td><td>${summary.pantawid.yes}</td></tr>
        <tr><td>No</td><td>${summary.pantawid.no}</td></tr>
      </table>
    </td></tr>
    <tr><td><strong>Indigenous</strong></td><td>
      <table class="inner-table">
        <tr><td>Yes</td><td>${summary.indigenous.yes}</td></tr>
        <tr><td>No</td><td>${summary.indigenous.no}</td></tr>
      </table>
    </td></tr>
    <tr><td><strong>LGBTQ+</strong></td><td>
      <table class="inner-table">
        <tr><td>Yes</td><td>${summary.lgbtq.yes}</td></tr>
        <tr><td>No</td><td>${summary.lgbtq.no}</td></tr>
      </table>
    </td></tr>
  `;
  document.getElementById("summaryPopupBody").innerHTML = `<h3>LGU SUMMARY OF SOLO PARENTS</h3><div class="scrollable-table"><table><tbody>${rows}</tbody></table></div>`;
  openPopup("summaryPopup");
  document.getElementById("summaryPopupBack").onclick = () => closePopup("summaryPopup");
  document.getElementById("summaryPopupClose").onclick = () => closePopup("summaryPopup");
});

/* =========================
   Misc utilities & UI controls
   ========================= */
function clearFormInputs() {
  document.querySelectorAll("#registerForm input, #registerForm select").forEach(el => {
    if (el.type === "radio" || el.type === "checkbox") el.checked = false;
    else el.value = "";
  });
  buildChildrenInputs();
}

function getTableData() {
  const rows = document.querySelectorAll("#dataTable tbody tr");
  const tableData = [];
  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    tableData.push({
      lastName: cells[1]?.innerText || "",
      firstName: cells[2]?.innerText || "",
      middleName: cells[3]?.innerText || "",
      suffix: cells[4]?.innerText || "",
      gender: cells[5]?.innerText || "",
      birthdate: cells[6]?.innerText || "",
      dateRegistered: cells[7]?.innerText || "",
      age: cells[8]?.innerText || "",
      barangay: cells[9]?.innerText || "",
      category: cells[10]?.innerText || "",
      bqCode: cells[11]?.innerText || "",
      spId: cells[12]?.innerText || "",
      idExpiration: cells[13]?.innerText || "",
      children: [],
      civilStatus: cells[15]?.innerText || "",
      employmentStatus: cells[16]?.innerText || "",
      monthlyIncome: cells[17]?.innerText || "",
      philhealth: cells[18]?.innerText || "",
      pantawid: cells[19]?.innerText || "",
      indigenous: cells[20]?.innerText || "",
      lgbtq: cells[21]?.innerText || ""
    });
  });
  return tableData;
}

function sortTable(field) {
  data.sort((a, b) => (a[field] || "").toString().localeCompare((b[field] || "").toString()));
  localStorage.setItem("soloParentsData", JSON.stringify(data));
  renderTable();
}

/* =========================
   File & button wiring
   ========================= */
if (importBtn) importBtn.addEventListener("click", () => importFile.click());
if (importFile) importFile.addEventListener("change", (e) => importByBarangayExcel(e.target.files[0]));
if (exportBtn) exportBtn.addEventListener("click", exportByBarangayExcel);

if (showdataBtn) {
  showdataBtn.addEventListener("click", function () {
    if (dataTableContainer.classList.contains("hidden")) {
      dataTableContainer.classList.remove("hidden");
      this.textContent = "Hide Data ▲";
    } else {
      dataTableContainer.classList.add("hidden");
      this.textContent = "Show Data ▼";
    }
  });
}

/* Add Children toggle button (registration form) */
if (addChildrenBtn) {
  addChildrenBtn.addEventListener("click", () => {
    if (!childrenInputsContainer) return;
    if (childrenInputsContainer.classList.contains("hidden")) {
      childrenInputsContainer.classList.remove("hidden");
      addChildrenBtn.textContent = "Add Children ▲";
    } else {
      childrenInputsContainer.classList.add("hidden");
      addChildrenBtn.textContent = "Add Children ▼";
    }
  });
}

/* Disable Ctrl + Scroll zoom */
document.addEventListener("wheel", function (event) {
  if (event.ctrlKey) event.preventDefault();
}, { passive: false });

/* Logout */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedIn");
    sessionStorage.removeItem("loggedIn");
    window.location.replace("loginsp.html");
  });
}

/* =========================
   Initialization
   ========================= */
window.addEventListener("load", () => {
  buildChildrenInputs();
  renderTable();
});
