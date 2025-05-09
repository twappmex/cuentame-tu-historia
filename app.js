// Configuración global
const { jsPDF } = window.jspdf;
const API_URL = "1Srjg7fDMcIeWd5zffxLZvbUBS1sFl8nC1hOgzc69ogY"; // REEMPLAZA CON TU URL

// Estado de la aplicación
let currentUser = null;
let entries = [];
let favorites = [];
const questions = [
    { id: 1, text: "¿Cuál es tu primer recuerdo de la infancia?", category: "infancia", icon: "fa-baby" },
    // ... (Todas tus 130 preguntas) ...
    { id: 130, text: "¿Cómo quieres que te recuerde?", category: "mensajes", icon: "fa-child" }
];

// Elementos del DOM
const authContainer = document.getElementById('auth-container');
const loginForm = document.getElementById('login-form-element');
const recentEntriesGrid = document.getElementById('recent-entries-grid');
const questionsGrid = document.getElementById('questions-grid');
// ... (añade otros selectores que necesites) ...

// ======================
// FUNCIONES PRINCIPALES
// ======================

async function loginUser(password) {
    try {
        const response = await fetch(`${API_URL}?action=login&password=${encodeURIComponent(password)}`);
        const data = await response.json();
        
        if (data.success) {
            currentUser = { id: data.userId };
            localStorage.setItem('loggedIn', 'true');
            await loadUserData();
            showApp();
            return true;
        } else {
            alert(data.error || 'Contraseña incorrecta');
            return false;
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('Error de conexión con el servidor');
        return false;
    }
}

async function loadUserData() {
    try {
        const response = await fetch(`${API_URL}?action=getEntries&userId=${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
            entries = data.entries;
            updateProgressBar();
            loadRecentEntries();
            loadQuestions();
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

async function saveEntry(questionId, questionText, answer, category) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'saveEntry',
                userId: currentUser.id,
                questionId: questionId,
                questionText: questionText,
                answer: answer,
                category: category
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Error guardando entrada:', error);
        return { success: false };
    }
}

// ======================
// FUNCIONES DE INTERFAZ
// ======================

function updateProgressBar() {
    const progress = Math.round((entries.length / questions.length) * 100);
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${progress}% completado`;
}

function loadRecentEntries() {
    recentEntriesGrid.innerHTML = '';
    const recent = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
    
    recent.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'entry-card';
        card.innerHTML = `
            <div class="entry-header">
                <h3>${entry.questionText}</h3>
                <p class="entry-date">${formatDate(entry.date)}</p>
            </div>
            <div class="entry-content">${truncateText(entry.answer, 100)}</div>
        `;
        card.addEventListener('click', () => openEntryModal(entry));
        recentEntriesGrid.appendChild(card);
    });
}

function loadQuestions() {
    questionsGrid.innerHTML = '';
    questions.forEach(question => {
        const existingEntry = entries.find(e => e.questionId === question.id);
        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = `
            <h3><i class="fas ${question.icon}"></i> ${question.text}</h3>
            <p>${existingEntry ? '✅ Respondida' : '❌ Sin responder'}</p>
            <button class="answer-btn">
                ${existingEntry ? '<i class="fas fa-edit"></i> Editar' : '<i class="fas fa-pen"></i> Responder'}
            </button>
        `;
        card.querySelector('.answer-btn').addEventListener('click', () => {
            existingEntry ? openEntryModal(existingEntry) : openQuestionModal(question);
        });
        questionsGrid.appendChild(card);
    });
}

// ======================
// UTILIDADES
// ======================

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// ======================
// INICIALIZACIÓN
// ======================

document.addEventListener('DOMContentLoaded', () => {
    // Event listeners
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await loginUser(document.getElementById('login-password').value);
    });

    // Cargar datos si ya está logueado
    if (localStorage.getItem('loggedIn') === 'true') {
        initApp();
    }
});

async function initApp() {
    // Simular usuario para pruebas (eliminar en producción)
    currentUser = { id: 'usuario-de-prueba' };
    await loadUserData();
    showApp();
}

function showApp() {
    authContainer.style.display = 'none';
    document.querySelector('.app-container').style.display = 'block';
}