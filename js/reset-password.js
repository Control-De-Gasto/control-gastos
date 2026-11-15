
/* ==========================================================
   CONTROL DE GASTOS
   Recuperación de contraseña mediante Supabase Auth
   ========================================================== */

// 1. CONFIGURACIÓN DE SUPABASE

const SUPABASE_URL = "https://jvtliypgkjlyredslhmx.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_xq7ax6RrfqkGB70MCepj6A_3HXqU5V1";

// Crear cliente de Supabase
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);


// 2. ELEMENTOS HTML

const resetForm = document.getElementById("resetForm");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const resetButton = document.getElementById("resetButton");
const messageBox = document.getElementById("message");


// 3. ESTADO DE LA RECUPERACIÓN

let recoveryReady = false;


// 4. FUNCIONES AUXILIARES

function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = "message " + type;
}

function hideMessage() {
    messageBox.textContent = "";
    messageBox.className = "message";
}

function showForm() {
    recoveryReady = true;
    resetForm.classList.remove("hidden");
    hideMessage();
}

function showInvalidLink() {
    recoveryReady = false;
    resetForm.classList.add("hidden");

    showMessage(
        "El enlace de recuperación no es válido o ha caducado. " +
        "Solicita un nuevo correo de recuperación desde la aplicación.",
        "error"
    );
}


// 5. COMPROBAR ERRORES DEL ENLACE

function checkUrlErrors() {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
        window.location.hash.substring(1)
    );

    const error =
        params.get("error") ||
        hashParams.get("error");

    const errorCode =
        params.get("error_code") ||
        hashParams.get("error_code");

    if (error || errorCode) {
        showInvalidLink();
        return true;
    }

    return false;
}


// 6. DETECTAR LA RECUPERACIÓN DE CONTRASEÑA

function initializeRecovery() {

    if (checkUrlErrors()) {
        return;
    }

    showMessage(
        "Comprobando el enlace de recuperación...",
        "info"
    );

    // Si el usuario ha recargado la página durante
    // una recuperación que ya había sido validada.
    const previousRecovery =
        sessionStorage.getItem("passwordRecoveryActive") === "true";

    // Escuchar eventos de autenticación de Supabase.
    supabaseClient.auth.onAuthStateChange((event, session) => {

        if (event === "PASSWORD_RECOVERY" && session) {

            sessionStorage.setItem(
                "passwordRecoveryActive",
                "true"
            );

            showForm();
        }

        if (event === "SIGNED_OUT") {

            sessionStorage.removeItem(
                "passwordRecoveryActive"
            );

            recoveryReady = false;
        }
    });

    // Comprobar si existe una sesión válida.
    supabaseClient.auth.getSession().then(({ data, error }) => {

        if (error) {
            showInvalidLink();
            return;
        }

        const session = data.session;

        if (!session) {
            showInvalidLink();
            return;
        }

        if (previousRecovery) {
            showForm();
        }

    });
}


// 7. PROCESAR EL CAMBIO DE CONTRASEÑA

resetForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!recoveryReady) {
        showInvalidLink();
        return;
    }

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validaciones
    if (password.length < 6) {
        showMessage(
            "La contraseña debe tener al menos 6 caracteres.",
            "error"
        );
        return;
    }

    if (password !== confirmPassword) {
        showMessage(
            "Las contraseñas no coinciden.",
            "error"
        );
        return;
    }

    // Deshabilitar botón durante la operación
    resetButton.disabled = true;
    resetButton.textContent = "Actualizando contraseña...";

    try {

        const { data, error } =
            await supabaseClient.auth.updateUser({
                password: password
            });

        if (error) {
            throw error;
        }

        // Recuperación completada
        sessionStorage.removeItem(
            "passwordRecoveryActive"
        );

        resetForm.classList.add("hidden");

        passwordInput.value = "";
        confirmPasswordInput.value = "";

        showMessage(
            "¡Contraseña actualizada correctamente! " +
            "Ya puedes iniciar sesión con tu nueva contraseña.",
            "success"
        );

    } catch (error) {

        console.error("Error al actualizar contraseña:", error);

        showMessage(
            error.message || "No se ha podido actualizar la contraseña.",
            "error"
        );

    } finally {

        resetButton.disabled = false;
        resetButton.textContent = "Cambiar contraseña";

    }

});


// 8. INICIAR

initializeRecovery();
