const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const browseButton = document.getElementById("browseButton");
const fileListElement = document.getElementById("fileList");
const emptyState = document.getElementById("emptyState");
const fileSummary = document.getElementById("fileSummary");
const clearButton = document.getElementById("clearButton");
const mergeButton = document.getElementById("mergeButton");
const mergeButtonText = document.getElementById("mergeButtonText");
const mergeSpinner = document.getElementById("mergeSpinner");
const mergeIcon = document.getElementById("mergeIcon");
const statusBox = document.getElementById("statusBox");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");

// Data hanya tersimpan di memori halaman, tidak memakai localStorage.
let selectedFiles = [];
let isMerging = false;

function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function showStatus(message, type = "info") {
    const styles = {
        info: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
        success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
        error: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
    };

    statusBox.className = `mt-5 rounded-xl px-4 py-3 text-sm ${styles[type] || styles.info}`;
    statusBox.textContent = message;
}

function hideStatus() {
    statusBox.classList.add("hidden");
}

function isPdf(file) {
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function addFiles(files) {
    if (isMerging) return;

    const incomingFiles = Array.from(files);
    const validFiles = incomingFiles.filter(isPdf);
    const invalidCount = incomingFiles.length - validFiles.length;

    // Hindari menambahkan file yang sama berulang kali.
    for (const file of validFiles) {
        const alreadyAdded = selectedFiles.some(
            item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified
        );

        if (!alreadyAdded) selectedFiles.push(file);
    }

    renderFiles();
    hideStatus();

    if (invalidCount > 0) {
        showStatus(`${invalidCount} file bukan PDF dan tidak ditambahkan.`, "error");
    }
}

function renderFiles() {
    fileListElement.innerHTML = "";

    selectedFiles.forEach((file, index) => {
        const card = document.createElement("div");
        card.className = "file-card flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/60";

        const fileIcon = document.createElement("div");
        fileIcon.className = "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400";
        fileIcon.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 3.75h7l5 5v11.5A1.75 1.75 0 0117.25 22h-10.5A1.75 1.75 0 015 20.25V5.5A1.75 1.75 0 016.75 3.75z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 4v5h5M8 14h8M8 17h5" />
          </svg>
        `;

        const details = document.createElement("div");
        details.className = "min-w-0 flex-1";

        const name = document.createElement("p");
        name.className = "truncate text-sm font-semibold text-slate-800 dark:text-slate-100";
        name.textContent = file.name;
        name.title = file.name;

        const meta = document.createElement("p");
        meta.className = "mt-0.5 text-xs text-slate-500 dark:text-slate-400";
        meta.textContent = `${formatBytes(file.size)} · File ${index + 1}`;

        details.append(name, meta);

        const controls = document.createElement("div");
        controls.className = "flex shrink-0 items-center gap-1";

        const upButton = createControlButton("Naikkan urutan", "↑", index === 0);
        upButton.addEventListener("click", () => moveFile(index, -1));

        const downButton = createControlButton("Turunkan urutan", "↓", index === selectedFiles.length - 1);
        downButton.addEventListener("click", () => moveFile(index, 1));

        const removeButton = createControlButton("Hapus file", "×", false, true);
        removeButton.addEventListener("click", () => {
            selectedFiles.splice(index, 1);
            renderFiles();
            hideStatus();
        });

        controls.append(upButton, downButton, removeButton);
        card.append(fileIcon, details, controls);
        fileListElement.appendChild(card);
    });

    const count = selectedFiles.length;
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

    fileSummary.textContent = count
        ? `${count} file dipilih · Total ${formatBytes(totalSize)}`
        : "Belum ada file PDF";

    emptyState.classList.toggle("hidden", count > 0);
    clearButton.classList.toggle("hidden", count === 0);
    mergeButton.disabled = count < 2 || isMerging;
}

function createControlButton(label, text, disabled, isRemove = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.textContent = text;
    button.disabled = disabled || isMerging;
    button.className = isRemove
        ? "flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
        : "flex h-8 w-8 items-center justify-center rounded-lg text-lg text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400";
    return button;
}

function moveFile(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selectedFiles.length) return;

    [selectedFiles[index], selectedFiles[nextIndex]] = [selectedFiles[nextIndex], selectedFiles[index]];
    renderFiles();
}

function setMergingState(active, message = "Sedang menggabungkan...") {
    isMerging = active;
    mergeButtonText.textContent = active ? message : "Gabungkan PDF";
    mergeSpinner.classList.toggle("hidden", !active);
    mergeIcon.classList.toggle("hidden", active);
    mergeButton.disabled = active || selectedFiles.length < 2;
    renderFiles();
}

async function mergePdfs() {
    if (selectedFiles.length < 2 || isMerging) return;

    if (!window.PDFLib) {
        showStatus("Library PDF gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.", "error");
        return;
    }

    hideStatus();
    setMergingState(true, "Menyiapkan PDF...");

    try {
        const { PDFDocument } = window.PDFLib;
        const mergedPdf = await PDFDocument.create();
        let totalPages = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            setMergingState(true, `Memproses file ${i + 1} dari ${selectedFiles.length}...`);

            const bytes = await file.arrayBuffer();
            const pdf = await PDFDocument.load(bytes);
            const pageIndices = pdf.getPageIndices();
            const pages = await mergedPdf.copyPages(pdf, pageIndices);

            pages.forEach(page => mergedPdf.addPage(page));
            totalPages += pages.length;
        }

        setMergingState(true, "Membuat file hasil...");
        const mergedBytes = await mergedPdf.save();
        const blob = new Blob([mergedBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `gabungan-pdf-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        showStatus(`Berhasil! ${selectedFiles.length} file dengan total ${totalPages} halaman sudah digabungkan dan diunduh.`, "success");
    } catch (error) {
        console.error("Gagal menggabungkan PDF:", error);
        showStatus(
            "Gagal membaca salah satu PDF. Pastikan file tidak rusak atau terkunci dengan kata sandi, lalu coba lagi.",
            "error"
        );
    } finally {
        setMergingState(false);
    }
}

// Pilih file
browseButton.addEventListener("click", event => {
    event.stopPropagation();
    fileInput.click();
});

dropZone.addEventListener("click", event => {
    if (event.target.closest("button")) return;
    fileInput.click();
});

fileInput.addEventListener("change", event => {
    addFiles(event.target.files);
    // Mengizinkan pengguna memilih file yang sama lagi setelah dihapus.
    fileInput.value = "";
});

// Drag and drop
["dragenter", "dragover"].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.add("is-dragging");
    });
});

["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, event => {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.remove("is-dragging");
    });
});

dropZone.addEventListener("drop", event => {
    addFiles(event.dataTransfer.files);
});

// Tombol aksi
clearButton.addEventListener("click", () => {
    if (isMerging) return;
    selectedFiles = [];
    renderFiles();
    hideStatus();
});

mergeButton.addEventListener("click", mergePdfs);

// Dark/light mode: tidak disimpan, jadi setiap refresh kembali ke light mode.
themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    themeIcon.textContent = isDark ? "☀️" : "🌙";
    themeLabel.textContent = isDark ? "Mode terang" : "Mode gelap";
});

renderFiles();
