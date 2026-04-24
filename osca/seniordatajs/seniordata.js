
// Logout button logic
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-Btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedIn");
      window.location.href = "loginsenior.html";
    });
  }
});

// Global variables
let seniors = JSON.parse(localStorage.getItem('seniors')) || [];
let pendingSenior = null;
let duplicateIndex = -1;
let deleteIndex = -1;

// Disable browser zoom shortcuts
document.addEventListener("wheel", e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
document.addEventListener("keydown", e => {
  if (e.ctrlKey && ["+", "-", "="].includes(e.key)) e.preventDefault();
});

// Age calculation
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
// Display table
function displayTable(list = seniors) {
  const tbody = document.querySelector("#resultsTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  list.sort((a, b) => (a.lastName + a.Barangay).toLowerCase().localeCompare((b.lastName + b.Barangay).toLowerCase()));

  list.forEach((s, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${s.lastName}</td>
      <td>${s.firstName}</td>
      <td>${s.middleName}</td>
      <td>${s.suffix || ""}</td>
      <td>${s.gender}</td>
      <td>${s.birthDate}</td>
      <td>${s.dateRegistered}</td>
      <td>${s.age}</td>
      <td>${s.Barangay}, Loay, Bohol</td>
      <td>${s.IDnumber}</td>
      <td>${s.pension}</td>
      <td>${s.philhealth || ""}</td>
      <td><button onclick="editSenior(${index})" style="background:yellow; color:black; border:none; padding:4px 8px;">Edit</button></td>
      <td><button onclick="deleteSenior(${index})" style="background:red; color:white; border:none; padding:4px 8px;">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

//secondary live search
document.addEventListener("DOMContentLoaded", () => {
  const secondarySearchBar = document.getElementById("secondarySearchBar");
  if (secondarySearchBar) {
    secondarySearchBar.addEventListener("input", () => secondaryLiveSearch(secondarySearchBar.value));
  }

  const clearBtn = document.getElementById("clearSecondarySearch");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      secondarySearchBar.value = "";
      secondaryLiveSearch(""); // reset table
    });
  }
});

function secondaryLiveSearch(query) {
  query = query.toLowerCase().trim();
  const rows = document.querySelectorAll("#resultsTable tbody tr");

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    if (cells.length > 0) {
      const lastName = cells[1].textContent.toLowerCase().trim();
      const firstName = cells[2].textContent.toLowerCase().trim();
      const middleName = cells[3].textContent.toLowerCase().trim();
      const suffix = cells[4].textContent.toLowerCase().trim();
      const oscaId = cells[10].textContent.toLowerCase().trim();
      const birthDate = cells[6].textContent.toLowerCase().trim();

      // Build flexible name variants
      const nameVariants = [
        `${firstName} ${middleName} ${lastName} ${suffix}`,
        `${firstName} ${middleName} ${lastName}`,
        `${firstName} ${lastName}`,
        `${lastName} ${firstName} ${middleName} ${suffix}`,
        `${lastName} ${firstName} ${middleName}`,
        `${lastName} ${firstName}`,
        `${firstName} ${middleName} ${suffix} ${lastName}`,
        `${lastName} ${suffix} ${firstName} ${middleName}`
      ].map(n => n.toLowerCase().trim());

      // Match against query
      if (
        nameVariants.some(n => n.includes(query)) ||
        oscaId.includes(query) ||
        birthDate.includes(query)
      ) {
        row.style.display = ""; // show
      } else {
        row.style.display = "none"; // hide
      }
    }
  });
}
document.getElementById("clearSecondarySearch").addEventListener("click", () => {
  document.getElementById("secondarySearchBar").value = "";
  secondaryLiveSearch(""); // reset table
});



function deleteSenior(index) {
  deleteIndex = index;
  const s = seniors[index];

  // Fill delete details table
  const table = document.getElementById("deleteDetailsTable");
  table.innerHTML = `
    <tr><td><strong>Full Name</strong></td><td>${s.lastName}, ${s.firstName} ${s.middleName} ${s.suffix || ""}</td></tr>
    <tr><td><strong>Gender</strong></td><td>${s.gender}</td></tr>
    <tr><td><strong>Birthdate</strong></td><td>${s.birthDate}</td></tr>
    <tr><td><strong>Date Registered</strong></td><td>${s.dateRegistered}</td></tr>
    <tr><td><strong>Age</strong></td><td>${s.age}</td></tr>
    <tr><td><strong>Barangay</strong></td><td>${s.Barangay}</td></tr>
    <tr><td><strong>ID Number</strong></td><td>${s.IDnumber}</td></tr>
    <tr><td><strong>Pension</strong></td><td>${s.pension}</td></tr>
    <tr><td><strong>PhilHealth</strong></td><td>${s.philhealth}</td></tr>
  `;

  document.getElementById("deletePopup").style.display = "flex";
}
document.getElementById("confirmdeleteBtn").onclick = () => {
  if (deleteIndex > -1) {
    seniors.splice(deleteIndex, 1); // remove from array
    localStorage.setItem("seniors", JSON.stringify(seniors)); // update storage
    displayTable(seniors); // refresh table
    deleteIndex = -1;
    document.getElementById("deletePopup").style.display = "none";

    // Optional: show success popup
    document.getElementById("successPopup").style.display = "flex";
    document.getElementById("successPopup").querySelector("h3").textContent = "Record Deleted Successfully!";
  }
};

document.getElementById("canceldeleteBtn").onclick = () => {
  deleteIndex = -1;
  document.getElementById("deletePopup").style.display = "none";
};
document.getElementById("confirmdeleteBtn").onclick = () => {
  if (deleteIndex > -1) {
    seniors.splice(deleteIndex, 1); // remove from array
    localStorage.setItem("seniors", JSON.stringify(seniors)); // update storage
    displayTable(seniors); // refresh table
    deleteIndex = -1;
    document.getElementById("deletePopup").style.display = "none";

    // Show success popup with red text
    const successPopup = document.getElementById("successPopup");
    const successMessage = successPopup.querySelector("h3");
    successMessage.textContent = "Record Deleted Successfully!";
    successMessage.style.color = "red";  
    successPopup.style.display = "flex";
  }
};



//Edit data
let editIndex = -1;

function editSenior(index) {
  editIndex = index;
  const s = seniors[index];

  document.getElementById("editLastName").value = s.lastName;
  document.getElementById("editFirstName").value = s.firstName;
  document.getElementById("editMiddleName").value = s.middleName;
  document.getElementById("editSuffix").value = s.suffix || "";
  document.getElementById("editGender").value = s.gender;
  document.getElementById("editBirthDate").value = s.birthDate;
  document.getElementById("editDateRegistered").value = s.dateRegistered;
  document.getElementById("editBarangay").value = s.Barangay;   // ✅ direct
  document.getElementById("editIDnumber").value = s.IDnumber;
  document.getElementById("editPension").value = s.pension;
  document.getElementById("editPhilhealth").value = s.philhealth;

  document.getElementById("editPopup").style.display = "flex";
}

// Confirm changes
document.getElementById("confirmEditBtn").addEventListener("click", () => {
  if (editIndex > -1) {
    seniors[editIndex] = {
      lastName: document.getElementById("editLastName").value.trim(),
      firstName: document.getElementById("editFirstName").value.trim(),
      middleName: document.getElementById("editMiddleName").value.trim(),
      suffix: document.getElementById("editSuffix").value.trim(),
      gender: document.getElementById("editGender").value,
      birthDate: document.getElementById("editBirthDate").value,
      dateRegistered: document.getElementById("editDateRegistered").value,
      age: calculateAge(document.getElementById("editBirthDate").value),
      Barangay: document.getElementById("editBarangay").value,
      IDnumber: document.getElementById("editIDnumber").value.trim(),
      pension: document.getElementById("editPension").value,
      philhealth: document.getElementById("editPhilhealth").value
    };

    localStorage.setItem("seniors", JSON.stringify(seniors));
    displayTable(seniors);

    document.getElementById("editPopup").style.display = "none";
    document.getElementById("successPopup").style.display = "flex";
    document.getElementById("successPopup").querySelector("h3").textContent = "Changes Saved Successfully!";
    document.getElementById("successPopup").querySelector("h3").style.color = "green";

    document.getElementById("editForm").reset();

    editIndex = -1;
  }
});


document.getElementById("cancelEditBtn").addEventListener("click", () => {
  document.getElementById("editPopup").style.display = "none";
});

document.getElementById("okBtn").addEventListener("click", () => {
  document.getElementById("successPopup").style.display = "none";
});


// Cancel edit
document.getElementById("cancelEditBtn").addEventListener("click", () => {
  document.getElementById("editPopup").style.display = "none";
});

// Success popup OK button
document.getElementById("okBtn").addEventListener("click", () => {
  document.getElementById("successPopup").style.display = "none";
});


// Toggle button logic
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleTableBtn");
  const tableContainer = document.getElementById("tableContainer");

  if (toggleBtn && tableContainer) {
    toggleBtn.addEventListener("click", () => {
      if (tableContainer.style.display === "none") {
        tableContainer.style.display = "block";
        toggleBtn.textContent = "Hide Table";
        displayTable(seniors); // render only when shown
      } else {
        tableContainer.style.display = "none";
        toggleBtn.textContent = "Show Table";
      }
    });
  }
});

// Save handler
function handleSave(event) {
  event.preventDefault();

  const lastName = document.getElementById('lastName').value.trim();
  const firstName = document.getElementById('firstName').value.trim();
  const middleName = document.getElementById('middleName').value.trim();
  const suffix = document.getElementById('suffix').value;
  const gender = document.getElementById('gender').value;
  const birthDate = document.getElementById('birthDate').value;
  const dateRegistered = document.getElementById('dateRegistered').value;
  const Barangay = document.getElementById('Barangay').value.trim();
  const IDnumber = document.getElementById('IDnumber').value.trim();
  const pension = document.getElementById('pensionType').value;
  const philhealthInput = document.querySelector('input[name="philhealth"]:checked');
  const philhealth = philhealthInput ? philhealthInput.value : "";

  if (!lastName || !firstName || !birthDate || !gender || !dateRegistered || !Barangay || !IDnumber || !pension || !philhealth) {
    alert("⚠ PLEASE FILL IN ALL REQUIRED FIELDS BEFORE SAVING.");
    return;
  }

  const age = calculateAge(birthDate);
  const newSenior = { 
    lastName, firstName, middleName, suffix, gender, birthDate, dateRegistered, age,
    Barangay, IDnumber, pension, philhealth
  };

  // Always set pendingSenior first
  pendingSenior = newSenior;

  // Check for duplicates
  duplicateIndex = seniors.findIndex(s => 
    (s.firstName.toLowerCase() === firstName.toLowerCase() &&
     s.lastName.toLowerCase() === lastName.toLowerCase()) ||
    s.IDnumber.toLowerCase() === IDnumber.toLowerCase()
  );

  if (duplicateIndex !== -1) {
    showDuplicatePopup(newSenior, seniors[duplicateIndex]);
  } else {
    showReviewPopup(newSenior);
  }
}

function showReviewPopup(newSenior) {
  const table = document.getElementById("reviewDetailsTable");
  table.innerHTML = `
    <tr><td><strong>Full Name</strong></td><td>${newSenior.lastName}, ${newSenior.firstName} ${newSenior.middleName} ${newSenior.suffix || ""}</td></tr>
    <tr><td><strong>Gender</strong></td><td>${newSenior.gender}</td></tr>
    <tr><td><strong>Birthdate</strong></td><td>${newSenior.birthDate}</td></tr>
    <tr><td><strong>Date Registered</strong></td><td>${newSenior.dateRegistered}</td></tr>
    <tr><td><strong>Age</strong></td><td>${newSenior.age}</td></tr>
    <tr><td><strong>Barangay</strong></td><td>${newSenior.Barangay}</td></tr>
    <tr><td><strong>ID Number</strong></td><td>${newSenior.IDnumber}</td></tr>
    <tr><td><strong>Pension</strong></td><td>${newSenior.pension}</td></tr>
    <tr><td><strong>PhilHealth</strong></td><td>${newSenior.philhealth}</td></tr>
  `;
  document.getElementById("reviewPopup").style.display = "flex";
}

document.getElementById("confirmAddBtn").addEventListener("click", () => {
  if (pendingSenior) {
    seniors.push(pendingSenior);
    localStorage.setItem("seniors", JSON.stringify(seniors));
    displayTable(seniors);

    document.getElementById("reviewPopup").style.display = "none";
    const successPopup = document.getElementById("successPopup");
    successPopup.querySelector("h3").textContent = "Senior Citizen Registered Successfully!";
    successPopup.querySelector("h3").style.color = "green";
    successPopup.style.display = "flex";

    // ✅ Clear form after adding
    document.getElementById("seniorForm").reset();

    pendingSenior = null;
  }
});

document.getElementById("cancelAddBtn").addEventListener("click", () => {
  pendingSenior = null;
  document.getElementById("reviewPopup").style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");
  if (registerBtn) {
    registerBtn.addEventListener("click", handleSave);
  }
});


document.getElementById("cancelAddBtn").addEventListener("click", () => {
  pendingSenior = null;
  document.getElementById("reviewPopup").style.display = "none";
});

document.getElementById("cancelAddBtn").addEventListener("click", () => {
  pendingSenior = null;
  document.getElementById("reviewPopup").style.display = "none";
});

function showDuplicatePopup(newData, existingData) {
  const newTable = document.getElementById("newDataTable");
  newTable.innerHTML = `
    <tr><td><strong>Full Name</strong></td><td>${newData.lastName}, ${newData.firstName} ${newData.middleName} ${newData.suffix || ""}</td></tr>
    <tr><td><strong>Gender</strong></td><td>${newData.gender}</td></tr>
    <tr><td><strong>Birthdate</strong></td><td>${newData.birthDate}</td></tr>
    <tr><td><strong>Date Registered</strong></td><td>${newData.dateRegistered}</td></tr>
    <tr><td><strong>Age</strong></td><td>${newData.age}</td></tr>
    <tr><td><strong>Barangay</strong></td><td>${newData.Barangay}</td></tr>
    <tr><td><strong>ID Number</strong></td><td>${newData.IDnumber}</td></tr>
    <tr><td><strong>Pension</strong></td><td>${newData.pension}</td></tr>
    <tr><td><strong>PhilHealth</strong></td><td>${newData.philhealth}</td></tr>
  `;

  const existingTable = document.getElementById("existingDataTable");
  existingTable.innerHTML = `
    <tr><td><strong>Full Name</strong></td><td>${existingData.lastName}, ${existingData.firstName} ${existingData.middleName} ${existingData.suffix || ""}</td></tr>
    <tr><td><strong>Gender</strong></td><td>${existingData.gender}</td></tr>
    <tr><td><strong>Birthdate</strong></td><td>${existingData.birthDate}</td></tr>
    <tr><td><strong>Date Registered</strong></td><td>${existingData.dateRegistered}</td></tr>
    <tr><td><strong>Age</strong></td><td>${existingData.age}</td></tr>
    <tr><td><strong>Barangay</strong></td><td>${existingData.Barangay}</td></tr>
    <tr><td><strong>ID Number</strong></td><td>${existingData.IDnumber}</td></tr>
    <tr><td><strong>Pension</strong></td><td>${existingData.pension}</td></tr>
    <tr><td><strong>PhilHealth</strong></td><td>${existingData.philhealth}</td></tr>
  `;

  document.getElementById("duplicatePopup").style.display = "flex";
}

document.getElementById("updateBtn").onclick = () => {
  if (duplicateIndex > -1 && pendingSenior) {
    seniors[duplicateIndex] = pendingSenior;
    localStorage.setItem("seniors", JSON.stringify(seniors));
    displayTable(seniors);

    document.getElementById("duplicatePopup").style.display = "none";
    document.getElementById("updateSuccessPopup").style.display = "flex";

    // Clear form after updating
    document.getElementById("seniorForm").reset();

    pendingSenior = null;
    duplicateIndex = -1;
  }
};


document.getElementById("cancelDupBtn").onclick = () => {
  pendingSenior = null;
  duplicateIndex = -1;
  document.getElementById("duplicatePopup").style.display = "none";
};

document.getElementById("okUpdateBtn").onclick = () => {
  document.getElementById("updateSuccessPopup").style.display = "none";
};


// Live Search with flexible name formats
document.addEventListener("DOMContentLoaded", () => {
  const searchBar = document.getElementById("searchBar");
  if (searchBar) {
    searchBar.addEventListener("input", () => liveSearch(searchBar.value));
  }

  // Back button for popup
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      document.getElementById("detailsPopup").style.display = "none";
    });
  }
});

//live search above
function liveSearch(query) {
  query = query.toLowerCase().trim();
  const resultsDiv = document.getElementById("searchResults");
  resultsDiv.innerHTML = "";

  if (!query) return;

  const matches = seniors.filter(s => {
    const birthDate = new Date(s.birthDate);
    const birthDateStr1 = s.birthDate.toLowerCase();
    const birthDateStr2 = birthDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }).toLowerCase();
    const birthDateStr3 = birthDate.toLocaleDateString("en-US");

    const fullNameVariants = [
      `${s.firstName} ${s.middleName} ${s.lastName} ${s.suffix || ""}`,
      `${s.firstName} ${s.middleName} ${s.lastName}`,
      `${s.firstName} ${s.lastName}`,
      `${s.lastName} ${s.firstName} ${s.middleName} ${s.suffix || ""}`,
      `${s.lastName} ${s.firstName} ${s.middleName}`,
      `${s.lastName} ${s.firstName}`
    ].map(name => name.toLowerCase().trim());

    const oscaId = s.IDnumber ? s.IDnumber.toLowerCase() : "";
    const barangay = s.Barangay ? s.Barangay.toLowerCase() : "";

    return (
      fullNameVariants.some(name => name.includes(query)) ||
      birthDateStr1.includes(query) ||
      birthDateStr2.includes(query) ||
      birthDateStr3.includes(query) ||
      oscaId.includes(query) ||
      barangay.includes(query)   // ✅ added
    );
  });

  if (matches.length === 0) {
    resultsDiv.innerHTML = `<p style="color:red;">No matches found</p>`;
    return;
  }

  matches.forEach((s, index) => {
    const div = document.createElement("div");
    div.className = "search-item";
    div.innerHTML = `
      <span>${s.lastName}, ${s.firstName} ${s.middleName} ${s.suffix || ""}</span>
      <button onclick="showDetails(${index})">Show Details</button>
    `;
    resultsDiv.appendChild(div);
  });
}


// Show details popup
function showDetails(index) {
  const s = seniors[index];
  const table = document.getElementById("detailsTable");
  table.innerHTML = `
    <tr><td><strong>Full Name</strong></td><td>${s.lastName}, ${s.firstName} ${s.middleName} ${s.suffix || ""}</td></tr>
    <tr><td><strong>Gender</strong></td><td>${s.gender}</td></tr>
    <tr><td><strong>Birthdate</strong></td><td>${s.birthDate}</td></tr>
    <tr><td><strong>Date Registered</strong></td><td>${s.dateRegistered}</td></tr>
    <tr><td><strong>Age</strong></td><td>${s.age}</td></tr>
    <tr><td><strong>Barangay</strong></td><td>${s.Barangay}</td></tr>
    <tr><td><strong>ID Number</strong></td><td>${s.IDnumber}</td></tr>
    <tr><td><strong>Pension</strong></td><td>${s.pension}</td></tr>
    <tr><td><strong>PhilHealth</strong></td><td>${s.philhealth}</td></tr>
  `;
  document.getElementById("detailsPopup").style.display = "flex";
}

//OGTA AND NONA
// Utility: calculate age this year
function calculateAgeThisYear(birthDate) {
  const b = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  return age;
}

// Show popup with results
function showAgePopup(category, matches) {
  const table = document.getElementById("agePopupTable");
  table.innerHTML = "";

  if (matches.length === 0) {
    table.innerHTML = `<tr><td colspan="3">No ${category} found this year.</td></tr>`;
  } else {
    table.innerHTML = `
      <tr style="background:#0073e6; color:white;">
        <th>Full Name</th>
        <th>Birthday</th>
        <th>Age</th>
      </tr>
    `;
    matches.forEach(s => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${s.lastName}, ${s.firstName} ${s.middleName || ""} ${s.suffix || ""}</td>
        <td>${s.birthDate}</td>
        <td style="font-weight:bold; color:green;">${calculateAgeThisYear(s.birthDate)}</td>
      `;
      table.appendChild(row);
    });
  }

  document.getElementById("agePopupTitle").textContent = 
    category === "octogenarian" ? "OCTOGENARIANS (80, 85)" : "NONAGENARIANS (90, 95)";
  document.getElementById("agePopup").style.display = "flex";
}

// Search button logic
document.getElementById("ageSearchBtn").addEventListener("click", () => {
  const category = document.getElementById("ageCategory").value;
  if (!category) {
    alert("⚠ Please select a category first.");
    return;
  }

  const matches = seniors.filter(s => {
    const age = calculateAgeThisYear(s.birthDate);
    if (category === "octogenarian") {
      return age === 80 || age === 85;
    } else if (category === "nonagenarian") {
      return age === 90 || age === 95;
    }
    return false;
  });

  showAgePopup(category, matches);
});

// Close popup
document.getElementById("closeAgePopup").addEventListener("click", () => {
  document.getElementById("agePopup").style.display = "none";
});


// Birthday popup
function showBirthdays(targetDate, label) {
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();

  const birthdays = seniors.filter(s => {
    const b = new Date(s.birthDate);
    return b.getMonth() === targetMonth && b.getDate() === targetDay;
  });

  const birthdayList = document.getElementById("birthdayList");
  const popupTitle = document.getElementById("birthdayPopupTitle");

  if (birthdays.length === 0) {
    birthdayList.innerHTML = `<p>No Senior Citizen Birthdays ${label}.</p>`;
  } else {
    birthdayList.innerHTML = birthdays.map((s, i) => `
      <li>${i + 1}. ${s.lastName}, ${s.firstName} ${s.middleName} ${s.suffix || ""} | ${s.Barangay}</li>
    `).join("");
  }

  popupTitle.textContent = `Senior Citizen Birthdays ${label} (${birthdays.length} total)`;
  document.getElementById("birthdayPopup").style.display = "flex";
}


document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("birthdaytdyBtn").addEventListener("click", () => {
    showBirthdays(new Date(), "Today");
  });

  document.getElementById("birthdaytomBtn").addEventListener("click", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    showBirthdays(tomorrow, "Tomorrow");
  });

  document.getElementById("closePopup").addEventListener("click", () => {
    document.getElementById("birthdayPopup").style.display = "none";
  });
});


//Import to Excel
function importDataByBarangay(event) {
  const file = event.target.files[0];
  if (!file) return;

  // ✅ Only allow the custom filename
  if (file.name !== "SeniorCitizenImportData.xlsx") {
    alert("⚠ Only 'SeniorCitizenImportData.xlsx' can be imported.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const wb = XLSX.read(data, { type: "array" });

    const imported = [];

    wb.SheetNames.forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws);

      rows.forEach(r => {
        imported.push({
          lastName: r["Last Name"],
          firstName: r["First Name"],
          middleName: r["Middle Name"],
          suffix: r["Suffix"],
          gender: r["Gender"],
          birthDate: r["Birthdate"],
          dateRegistered: r["Date Registered"],
          age: r["Age"],
          Barangay: r["Barangay"],
          IDnumber: r["ID Number"],
          pension: r["Pension"],
          philhealth: r["PhilHealth"]
        });
      });
    });

    //  Save into seniors array and localStorage
    seniors = imported;
    localStorage.setItem("seniors", JSON.stringify(seniors));
    displayTable(seniors);
    alert("✅ Data imported successfully!");
  };

  reader.readAsArrayBuffer(file);
}


// Export to Excel
function exportDataByBarangay() {
  const grouped = {};

  // Group seniors by Barangay
  seniors.forEach(s => {
    if (!grouped[s.Barangay]) grouped[s.Barangay] = [];
    grouped[s.Barangay].push(s);
  });

  const wb = XLSX.utils.book_new();

  Object.keys(grouped).forEach(barangay => {
    const data = grouped[barangay].map(s => ({
      "Last Name": s.lastName,
      "First Name": s.firstName,
      "Middle Name": s.middleName,
      "Suffix": s.suffix,
      "Gender": s.gender,
      "Birthdate": s.birthDate,
      "Date Registered": s.dateRegistered,
      "Age": s.age,
      "Barangay": s.Barangay,
      "ID Number": s.IDnumber,
      "Pension": s.pension,
      "PhilHealth": s.philhealth
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, barangay);
  });

  XLSX.writeFile(wb, "SeniorCitizenImportData.xlsx"); // ✅ fixed filename
}

document.getElementById("exportBtn").addEventListener("click", exportDataByBarangay);

document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("importFile").click();
});

document.getElementById("importFile").addEventListener("change", importDataByBarangay);

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedIn");
    sessionStorage.removeItem("loggedIn");
    window.location.replace("login.html");
  });
}