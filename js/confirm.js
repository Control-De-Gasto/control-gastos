
/* ==========================================================
   CONTROL DE GASTOS
   Confirmación de correo mediante Supabase Auth
   ========================================================== */

// 1. CONFIGURACIÓN DE SUPABASE

const SUPABASE_URL = "https://TU_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "TU_SUPABASE_ANON_KEY";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// 2. ELEMENTOS HTML

const statusIcon = document.getElementById("statusIcon");
const statusTitle = document.getElementById("statusTitle");
const statusText = document.getElementById("statusText");
const browserButton = document.getElementById("browserButton");
const messageBox = document.getElementById("message");


// 3. VARIABLES

const params = new URLSearchParams(window.location.search);

const tokenHash = params.get("token_hash");
const tokenType = params.get("type");

let verificationStarted = false;


// 4. DETECTAR DISPOSITIVO MÓVIL

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
    );
}


// 5. MOSTRAR ESTADOS

function showSuccess() {

    statusIcon.textContent = "✓";
    statusTitle.textContent = "¡Correo verificado!";

    statusText.textContent =
        "Tu dirección de correo electrónico se ha confirmado correctamente.";

    browserButton.classList.add("hidden");

    messageBox.className = "message success";
    messageBox.textContent =
        "Tu cuenta ya está activa. Puedes iniciar sesión en Control de Gastos.";
}

function showError(message) {

    statusIcon.textContent = "!";
    statusTitle.textContent = "No se pudo confirmar el correo";

    statusText.textContent = message;

    messageBox.className = "message error";
    messageBox.textContent =
        "Comprueba que el enlace no haya caducado o sido utilizado anteriormente.";
}

function showMobileMessage() {

    statusIcon.textContent = "📱";
    statusTitle.textContent = "Abriendo Control de Gastos";

    statusText.textContent =
        "Estamos intentando abrir la aplicación. Si no se abre, puedes continuar desde el navegador.";

    browserButton.classList.remove("hidden");
}


// 6. VERIFICAR TOKEN EN EL NAVEGADOR

async function verifyInBrowser() {

    if (verificationStarted) return;

    verificationStarted = true;

    browserButton.classList.add("hidden");

    statusTitle.textContent = "Verificando tu correo...";
    statusText.textContent =
        "Estamos validando tu enlace con Supabase.";

    try {

        const { data, error } =
            await supabaseClient.auth.verifyOtp({
                token_hash: tokenHash,
                type: "email"
            });

        if (error) {
            throw error;
        }

        if (!data.user) {
            throw new Error("No se ha podido verificar la cuenta.");
        }

        showSuccess();

    } catch (error) {

        console.error("Error de confirmación:", error);

        showError(
            error.message || "No se ha podido verificar tu correo."
        );

    }

}


// 7. ABRIR FLUTTER EN MÓVILES

function openFlutterApp() {

    showMobileMessage();

    const appUrl = new URL(
        "controlgastos://login-callback/"
    );

    appUrl.searchParams.set("token_hash", tokenHash);
    appUrl.searchParams.set("type", "email");
    appUrl.searchParams.set("flow", "confirmation");

    // Intentar abrir la aplicación
    window.location.href = appUrl.toString();

    // Si la aplicación no está instalada,
    // el usuario podrá continuar en el navegador.
    setTimeout(() => {

        if (!document.hidden) {
            browserButton.classList.remove("hidden");
        }

    }, 1800);

}


// 8. INICIALIZACIÓN

function initializeConfirmation() {

    // Comprobar que existe el token
    if (!tokenHash || tokenType !== "email") {

        showError(
            "El enlace de confirmación no es válido o está incompleto."
        );

        return;
    }

    // Botón alternativo para verificar desde el navegador
    browserButton.addEventListener(
        "click",
        verifyInBrowser
    );

    // Móvil: abrir Flutter
    if (isMobileDevice()) {

        openFlutterApp();

    } else {

        // Ordenador: verificar directamente
        verifyInBrowser();

    }

}


// Ejecutar
initializeConfirmation();
