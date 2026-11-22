// DEMONSTRATION VERSION ONLY
// The information is temporary and is not stored in a real database.

let accounts = [
    {
        id: "ADMIN 1",
        password: "mamamoblue",
        role: "admin"
    },
    {
        id: "STUDENT 1",
        password: "pinkblue",
        role: "student",
        studentId: "STUDENT001"
    }
];

let students = [
    {
        id: "STUDENT001",
        name: "Demo Student",
        grade: "Grade 12",
        strand: "TVL-Cookery",
        password: "student123",
        guardian: "",
        active: true,
        rfid: "",
        fingerprintId: "",
        fingerprintStatus: "Not enrolled"
    }
];

let attendance = [];
let documentSubmissions = [];
let currentAccount = null;
let editingStudentId = null;

const $ = id => document.getElementById(id);

function toast(message) {
    const box = $("toast");
    box.textContent = message;
    box.classList.remove("hidden");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
        box.classList.add("hidden");
    }, 3000);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

function showOnly(id) {
    [
        "admin-home",
        "admin-subpage",
        "student-home",
        "student-subpage"
    ].forEach(page => $(page).classList.add("hidden"));

    $(id).classList.remove("hidden");
}

// ================= LOGIN =================

$("login-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const id = $("login-id").value.trim();
    const password = $("login-password").value;

    const account = accounts.find(a =>
        a.id === id && a.password === password
    );

    if (!account) {
        $("login-message").textContent =
            "Incorrect ID or password.";
        return;
    }

    if (account.role === "student") {
        const student = students.find(s =>
            s.id === account.studentId && s.active
        );

        if (!student) {
            $("login-message").textContent =
                "Student account is inactive.";
            return;
        }
    }

    currentAccount = account;

    $("login-message").textContent = "";
    $("home").classList.add("hidden");
    $("app").classList.remove("hidden");

    if (account.role === "admin") {
        $("signed-in-label").textContent =
            "Administrator: " + account.id;

        showOnly("admin-home");
        refreshAdmin();
    } else {
        $("signed-in-label").textContent =
            "Student: " + account.id;

        showOnly("student-home");
        refreshStudent();
    }
});

// ================= LOGOUT =================

$("logout-button").addEventListener("click", function() {
    currentAccount = null;

    $("app").classList.add("hidden");
    $("home").classList.remove("hidden");

    $("login-form").reset();
    $("login-message").textContent = "";

    showOnly("admin-home");
});

// ================= ADMIN DASHBOARD =================

document.querySelectorAll("[data-admin-page]").forEach(button => {
    button.addEventListener("click", function() {
        openAdminPage(this.dataset.adminPage);
    });
});

function openAdminPage(name) {
    showOnly("admin-subpage");

    document.querySelectorAll(
        "#admin-subpage .content-page"
    ).forEach(page => page.classList.add("hidden"));

    $("page-" + name).classList.remove("hidden");

    if (name === "students") renderStudents();

    if (name === "devices") refreshDevicePage();

    if (name === "attendance") {
        fillStudentSelect("attendance-student");
        renderAttendance();
    }

    if (name === "reports") renderReports();

    if (name === "sms") {
        fillStudentSelect("guardian-student");
        renderSMS();
    }

    if (name === "accounts") renderAccounts();
}

$("admin-back").addEventListener("click", function() {
    showOnly("admin-home");
    refreshAdmin();
});

function refreshAdmin() {
    $("stat-students").textContent =
        students.filter(s => s.active).length;

    const today = new Date().toISOString().slice(0, 10);

    $("stat-present").textContent =
        attendance.filter(a =>
            a.date === today && a.status === "Present"
        ).length;

    $("stat-rfid").textContent =
        students.filter(s => s.rfid).length;

    $("stat-fingerprint").textContent =
        students.filter(s =>
            s.fingerprintStatus === "Enrolled"
        ).length;
}

// ================= STUDENT MANAGEMENT =================

$("student-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const id = $("student-id").value.trim();

    const record = {
        id: id,
        name: $("student-name").value.trim(),
        grade: $("student-grade").value,
        strand: $("student-strand").value.trim(),
        password: $("student-password").value,
        guardian: $("student-guardian").value.trim(),
        active: true,
        rfid: "",
        fingerprintId: "",
        fingerprintStatus: "Not enrolled"
    };

    if (editingStudentId) {
        const existing = students.find(s =>
            s.id === editingStudentId
        );

        if (!existing) return;

        if (id !== editingStudentId &&
            students.some(s => s.id === id)) {
            toast("Student ID already exists.");
            return;
        }

        const oldId = existing.id;

        Object.assign(existing, record, {
            rfid: existing.rfid,
            fingerprintId: existing.fingerprintId,
            fingerprintStatus: existing.fingerprintStatus
        });

        const account = accounts.find(a =>
            a.studentId === oldId
        );

        if (account) {
            account.id = id;
            account.password = record.password;
            account.studentId = id;
        }

        attendance.forEach(a => {
            if (a.studentId === oldId) {
                a.studentId = id;
                a.name = record.name;
            }
        });

        toast("Student updated.");
    } else {
        if (students.some(s => s.id === id)) {
            toast("Student ID already exists.");
            return;
        }

        students.push(record);

        accounts.push({
            id: id,
            password: record.password,
            role: "student",
            studentId: id
        });

        toast("Student successfully added.");
    }

    resetStudentForm();
    renderStudents();
    refreshAdmin();
});

function resetStudentForm() {
    $("student-form").reset();

    editingStudentId = null;

    $("student-form-title").textContent =
        "Add a Student";

    $("student-save-button").textContent =
        "Add Student";

    $("student-cancel-edit").classList.add("hidden");
}

$("student-cancel-edit").addEventListener("click", resetStudentForm);

$("student-search").addEventListener("input", renderStudents);

function renderStudents() {
    const query = $("student-search").value.toLowerCase();

    const list = students.filter(s =>
        (s.id + " " + s.name).toLowerCase().includes(query)
    );

    $("students-table").innerHTML = list.map(s => `
        <tr>
            <td>${escapeHTML(s.id)}</td>
            <td>${escapeHTML(s.name)}</td>
            <td>${escapeHTML(s.grade)}</td>
            <td>${escapeHTML(s.strand)}</td>
            <td>${s.active ? "Active" : "Inactive"}</td>
            <td>
                <button class="table-action"
                    data-edit="${escapeHTML(s.id)}">Edit</button>

                <button class="table-action"
                    data-toggle="${escapeHTML(s.id)}">
                    ${s.active ? "Deactivate" : "Activate"}
                </button>
            </td>
        </tr>
    `).join("") || `
        <tr><td colspan="6">No students found.</td></tr>
    `;

    document.querySelectorAll("[data-edit]").forEach(button => {
        button.addEventListener("click", () => {
            editStudent(button.dataset.edit);
        });
    });

    document.querySelectorAll("[data-toggle]").forEach(button => {
        button.addEventListener("click", () => {
            toggleStudent(button.dataset.toggle);
        });
    });
}

function editStudent(id) {
    const s = students.find(s => s.id === id);

    if (!s) return;

    editingStudentId = id;

    $("student-id").value = s.id;
    $("student-name").value = s.name;
    $("student-grade").value = s.grade;
    $("student-strand").value = s.strand;
    $("student-password").value = s.password;
    $("student-guardian").value = s.guardian;

    $("student-form-title").textContent = "Edit Student";
    $("student-save-button").textContent = "Save Changes";
    $("student-cancel-edit").classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleStudent(id) {
    const s = students.find(s => s.id === id);

    if (!s) return;

    s.active = !s.active;

    renderStudents();
    refreshAdmin();

    toast("Student account status updated.");
}

// ================= SELECT STUDENT =================

function fillStudentSelect(selectId) {
    const select = $(selectId);
    const previous = select.value;

    select.innerHTML =
        '<option value="">Select Student</option>' +
        students.map(s => `
            <option value="${escapeHTML(s.id)}">
                ${escapeHTML(s.id)} - ${escapeHTML(s.name)}
            </option>
        `).join("");

    if (students.some(s => s.id === previous)) {
        select.value = previous;
    }
}

// ================= DEVICE REGISTRATION =================

$("device-student").addEventListener("change", renderDeviceSummary);

function refreshDevicePage() {
    fillStudentSelect("device-student");
    renderDeviceSummary();
}

function renderDeviceSummary() {
    const s = students.find(s =>
        s.id === $("device-student").value
    );

    if (!s) {
        $("device-student-summary").textContent =
            "Select a student to view registration status.";

        $("rfid-uid").value = "";
        $("fingerprint-template").value = "";

        $("fingerprint-status").textContent = "Not Enrolled";
        $("fingerprint-detail").textContent =
            "R307 sensor is not connected.";

        return;
    }

    $("rfid-uid").value = s.rfid;
    $("fingerprint-template").value = s.fingerprintId;

    $("fingerprint-status").textContent =
        s.fingerprintStatus;

    $("fingerprint-detail").textContent =
        s.fingerprintStatus === "Waiting for hardware"
        ? "Waiting for actual hardware integration."
        : s.fingerprintStatus === "Enrolled"
        ? "Demo template: " + s.fingerprintId
        : "R307 sensor is not connected.";

    $("device-student-summary").innerHTML = `
        <b>${escapeHTML(s.name)}</b> (${escapeHTML(s.id)})<br>
        RFID: ${s.rfid ? escapeHTML(s.rfid) : "Not Registered"}<br>
        Fingerprint: ${escapeHTML(s.fingerprintStatus)}
    `;
}

// RFID REGISTRATION

$("rfid-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const s = students.find(s =>
        s.id === $("device-student").value
    );

    if (!s) {
        toast("Select a student first.");
        return;
    }

    s.rfid = $("rfid-uid").value.trim();

    renderDeviceSummary();
    refreshAdmin();

    toast("RFID reference saved in demo.");
});

// FINGERPRINT ENROLLMENT

$("fingerprint-start").addEventListener("click", function() {
    const s = students.find(s =>
        s.id === $("device-student").value
    );

    if (!s) {
        toast("Select a student first.");
        return;
    }

    s.fingerprintStatus = "Waiting for hardware";
    s.fingerprintId = "";

    renderDeviceSummary();
    refreshAdmin();

    toast("Demo enrollment status updated. No fingerprint was captured.");
});

$("fingerprint-clear").addEventListener("click", function() {
    const s = students.find(s =>
        s.id === $("device-student").value
    );

    if (!s) {
        toast("Select a student first.");
        return;
    }

    s.fingerprintStatus = "Not enrolled";
    s.fingerprintId = "";

    renderDeviceSummary();
    refreshAdmin();

    toast("Demo fingerprint status cleared.");
});

// ================= ATTENDANCE =================

$("attendance-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const s = students.find(s =>
        s.id === $("attendance-student").value && s.active
    );

    if (!s) {
        toast("Select an active student.");
        return;
    }

    attendance.push({
        studentId: s.id,
        name: s.name,
        date: $("attendance-date").value,
        time: $("attendance-time").value,
        status: $("attendance-status").value
    });

    renderAttendance();
    refreshAdmin();

    toast("Demo attendance record added.");
});

$("attendance-search").addEventListener("input", renderAttendance);

function renderAttendance() {
    const query = $("attendance-search").value.toLowerCase();

    const list = attendance.filter(a =>
        (a.studentId + " " + a.name).toLowerCase().includes(query)
    );

    $("attendance-table").innerHTML = list.map(a => `
        <tr>
            <td>${escapeHTML(a.studentId)}</td>
            <td>${escapeHTML(a.name)}</td>
            <td>${escapeHTML(a.date)}</td>
            <td>${escapeHTML(a.time)}</td>
            <td>${escapeHTML(a.status)}</td>
        </tr>
    `).join("") || `
        <tr><td colspan="5">No attendance records yet.</td></tr>
    `;
}

// ================= REPORTS =================

function renderReports() {
    $("report-present").textContent =
        attendance.filter(a => a.status === "Present").length;

    $("report-late").textContent =
        attendance.filter(a => a.status === "Late").length;

    $("report-absent").textContent =
        attendance.filter(a => a.status === "Absent").length;

    $("report-total").textContent = attendance.length;
}

// ================= SMS MANAGEMENT =================

$("guardian-student").addEventListener("change", function() {
    const s = students.find(s => s.id === this.value);

    $("guardian-number").value = s ? s.guardian : "";
});

$("guardian-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const s = students.find(s =>
        s.id === $("guardian-student").value
    );

    if (!s) {
        toast("Select a student.");
        return;
    }

    s.guardian = $("guardian-number").value.trim();

    toast("Guardian number saved in demo.");
    renderSMS();
});

function renderSMS() {
    const count = students.filter(s => s.guardian).length;

    $("sms-log").textContent = count
        ? count + " student account(s) have registered guardian numbers. SMS is not connected."
        : "No guardian numbers have been registered in this demo.";

    renderDocumentSubmissions();
}

// ================= ACCOUNT MANAGEMENT =================

function renderAccounts() {
    const admins = accounts.filter(a => a.role === "admin");

    $("accounts-table").innerHTML = admins.map(a => `
        <tr>
            <td>${escapeHTML(a.id)}</td>
            <td>Administrator</td>
            <td>Demo Account</td>
        </tr>
    `).join("");
}

// ================= STUDENT DASHBOARD =================

document.querySelectorAll("[data-student-page]").forEach(button => {
    button.addEventListener("click", function() {
        openStudentPage(this.dataset.studentPage);
    });
});

function getCurrentStudent() {
    if (!currentAccount || currentAccount.role !== "student") {
        return null;
    }

    return students.find(s =>
        s.id === currentAccount.studentId && s.active
    );
}

function getMyAttendance() {
    const s = getCurrentStudent();

    return s
        ? attendance.filter(a => a.studentId === s.id)
        : [];
}

function refreshStudent() {
    const s = getCurrentStudent();

    if (!s) return;

    const mine = getMyAttendance();

    $("student-welcome").textContent =
        "Welcome, " + s.name;

    $("my-present").textContent =
        mine.filter(a => a.status === "Present").length;

    $("my-late").textContent =
        mine.filter(a => a.status === "Late").length;

    $("my-absent").textContent =
        mine.filter(a => a.status === "Absent").length;
}

function openStudentPage(name) {
    showOnly("student-subpage");

    document.querySelectorAll(
        "#student-subpage .content-page"
    ).forEach(page => page.classList.add("hidden"));

    $("student-page-" + name).classList.remove("hidden");

    if (name === "my-attendance") renderMyAttendance();

    if (name === "my-profile") renderMyProfile();

    if (name === "my-documents") renderMyDocuments();
}

$("student-back").addEventListener("click", function() {
    showOnly("student-home");
    refreshStudent();
});

// STUDENT ATTENDANCE

function renderMyAttendance() {
    const mine = getMyAttendance();

    $("my-attendance-table").innerHTML = mine.map(a => `
        <tr>
            <td>${escapeHTML(a.date)}</td>
            <td>${escapeHTML(a.time)}</td>
            <td>${escapeHTML(a.status)}</td>
        </tr>
    `).join("") || `
        <tr><td colspan="3">No attendance records yet.</td></tr>
    `;
}

// STUDENT PROFILE

function renderMyProfile() {
    const s = getCurrentStudent();

    if (!s) return;

    $("my-profile-details").innerHTML = `
        <div class="profile-line">
            <b>Student ID:</b> ${escapeHTML(s.id)}
        </div>

        <div class="profile-line">
            <b>Full Name:</b> ${escapeHTML(s.name)}
        </div>

        <div class="profile-line">
            <b>Grade Level:</b> ${escapeHTML(s.grade)}
        </div>

        <div class="profile-line">
            <b>Strand:</b> ${escapeHTML(s.strand)}
        </div>
    `;
}

// ================= STUDENT DOCUMENTS =================

$("document-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const s = getCurrentStudent();
    const file = $("document-file").files[0];

    if (!s) {
        toast("No active student account is signed in.");
        return;
    }

    if (!file) {
        toast("Choose a document file.");
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        toast("The document must be 5 MB or smaller.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function() {
        documentSubmissions.unshift({
            id: Date.now(),
            studentId: s.id,
            studentName: s.name,
            type: $("document-type").value,
            absenceDate: $("document-date").value,
            reason: $("document-reason").value.trim(),
            fileName: file.name,
            fileType: file.type,
            fileData: reader.result,
            status: "Pending",
            submittedAt: new Date().toLocaleString()
        });

        $("document-form").reset();
        renderMyDocuments();
        toast("Document sent to the administrator.");
    };
    reader.readAsDataURL(file);
});

function renderMyDocuments() {
    const s = getCurrentStudent();

    if (!s) return;

    const mine = documentSubmissions.filter(d =>
        d.studentId === s.id
    );

    $("my-documents-table").innerHTML = mine.map(d => `
        <tr>
            <td>${escapeHTML(d.type)}<br><small>${escapeHTML(d.fileName)}</small></td>
            <td>${escapeHTML(d.absenceDate)}</td>
            <td>${escapeHTML(d.status)}</td>
            <td>${escapeHTML(d.submittedAt)}</td>
        </tr>
    `).join("") || `
        <tr><td colspan="4">No documents submitted yet.</td></tr>
    `;
}

// ================= ADMIN DOCUMENT SUBMISSIONS =================

$("document-search").addEventListener("input", renderDocumentSubmissions);

function renderDocumentSubmissions() {
    const query = ($("document-search").value || "").toLowerCase();

    const list = documentSubmissions.filter(d =>
        (d.studentId + " " + d.studentName + " " +
         d.type + " " + d.fileName).toLowerCase().includes(query)
    );

    $("document-submissions-table").innerHTML = list.map(d => `
        <tr>
            <td>${escapeHTML(d.studentName)}<br><small>${escapeHTML(d.studentId)}</small></td>
            <td>${escapeHTML(d.type)}</td>
            <td>${escapeHTML(d.absenceDate)}</td>
            <td>${escapeHTML(d.reason)}</td>
            <td>
                ${d.fileData
                    ? `<a href="${d.fileData}" download="${escapeHTML(d.fileName)}"
                           class="document-link">${escapeHTML(d.fileName)}</a>`
                    : escapeHTML(d.fileName)}
            </td>
            <td>${escapeHTML(d.status)}</td>
            <td>
                ${d.status === "Pending"
                    ? `<button class="table-action" data-review="${d.id}">Mark Reviewed</button>`
                    : "Reviewed"}
            </td>
        </tr>
    `).join("") || `
        <tr><td colspan="7">No student documents have been submitted.</td></tr>
    `;

    document.querySelectorAll("[data-review]").forEach(button => {
        button.addEventListener("click", function() {
            const submission = documentSubmissions.find(d =>
                d.id === Number(this.dataset.review)
            );

            if (!submission) return;

            submission.status = "Reviewed";
            renderDocumentSubmissions();
            toast("Document marked as reviewed.");
        });
    });
}

// INITIAL DISPLAY

refreshAdmin();