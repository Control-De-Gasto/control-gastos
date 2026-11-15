/* ==========================================================
   CONTROL DE GASTOS
   Recuperación de contraseña mediante Supabase Auth
   Escritorio: formulario web
   Móvil: abrir la app y cambiar la contraseña en Flutter
   ========================================================== */

const SUPABASE_URL = "https://jvtliypgkjlyredslhmx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xq7ax6RrfqkGB70MCepj6A_3HXqU5V1";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
        }
    }
);

const resetForm = document.getElementById("resetForm");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const resetButton = document.getElementById("resetButton");
const messageBox = document.getElementById("message");
const browserButton = document.getElementById("browserButton");

const params = new URLSearchParams(window.location.search);
const tokenHash = params.get("token_hash");
const tokenType = params.get("type");

let recoveryReady = false;
let verificationStarted = false;

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = "message " + type;
}

function showForm() {
    recoveryReady = true;
    resetForm.classList.remove("hidden");
    browserButton.classList.add("hidden");
    showMessage("Enlace verificado. Introduce tu nueva contraseña.", "info");
}

function showInvalidLink(message) {
    recoveryReady = false;
    resetForm.classList.add("hidden");
    showMessage(
        message || "El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo desde la aplicación.",
        "error"
    );
}

function getUrlError() {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    return params.get("error_description") || params.get("error_code") || params.get("error") ||
        hashParams.get("error_description") || hashParams.get("error_code") || hashParams.get("error");
}

// En escritorio, validar el token con Supabase y mostrar el formulario web.
async function verifyAndShowWebForm() {
    if (verificationStarted) return;
    verificationStarted = true;
    browserButton.classList.add("hidden");
    showMessage("Comprobando el enlace de recuperación...", "info");

    if (getUrlError()) {
        showInvalidLink("El enlace de recuperación ha caducado o no es válido. Solicita uno nuevo.");
        return;
    }

    if (!tokenHash || tokenType !== "recovery") {
        showInvalidLink("El enlace no contiene un token de recuperación válido.");
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery"
        });

        if (error) throw error;
        if (!data.session) throw new Error("Supabase no ha creado una sesión de recuperación.");
        showForm();
    } catch (error) {
        console.error("Error al verificar el enlace de recuperación:", error);
        showInvalidLink(error.message || "No se ha podido verificar el enlace.");
    }
}

// En móvil, enviar token_hash a Flutter. La app ejecutará verifyOTP(recovery)
// y mostrará PasswordRecoveryPage para cambiar la contraseña dentro de la app.
function openFlutterApp() {
    showMessage("Abriendo Control de Gastos para cambiar tu contraseña...", "info");
    browserButton.classList.remove("hidden");

    const appUrl = new URL("controlgastos://login-callback/");
    appUrl.searchParams.set("token_hash", tokenHash);
    appUrl.searchParams.set("type", "recovery");
    appUrl.searchParams.set("flow", "recovery");

    window.location.href = appUrl.toString();

    // Si el usuario sigue en esta página, puede elegir continuar en el navegador.
    setTimeout(() => {
        if (!document.hidden) browserButton.classList.remove("hidden");
    }, 1800);
}

browserButton.addEventListener("click", verifyAndShowWebForm);

function initializeRecovery() {
    if (getUrlError()) {
        showInvalidLink("El enlace de recuperación ha caducado o no es válido. Solicita uno nuevo.");
        return;
    }

    if (!tokenHash || tokenType !== "recovery") {
        showInvalidLink("El enlace no contiene un token de recuperación válido.");
        return;
    }

    if (isMobileDevice()) {
        openFlutterApp();
    } else {
        verifyAndShowWebForm();
    }
}

resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!recoveryReady) {
        showInvalidLink();
        return;
    }

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password.length < 6) {
        showMessage("La contraseña debe tener al menos 6 caracteres.", "error");
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Las contraseñas no coinciden.", "error");
        return;
    }

    resetButton.disabled = true;
    resetButton.textContent = "Actualizando contraseña...";

    try {
        const { error } = await supabaseClient.auth.updateUser({ password });
        if (error) throw error;

        recoveryReady = false;
        resetForm.classList.add("hidden");
        passwordInput.value = "";
        confirmPasswordInput.value = "";
        showMessage(
            "¡Contraseña actualizada correctamente! Ya puedes iniciar sesión con tu nueva contraseña.",
            "success"
        );
    } catch (error) {
        console.error("Error al actualizar contraseña:", error);
        showMessage(error.message || "No se ha podido actualizar la contraseña.", "error");
    } finally {
        resetButton.disabled = false;
        resetButton.textContent = "Cambiar contraseña";
    }
});

initializeRecovery();


// 8. INICIAR

initializeRecovery();
