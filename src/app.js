let routineIdCounter = 0;

const routines = [];

const ROUTINE_VALIDATION = {
    name: {
        minLength: 3,
        errorMessage: 'El nombre de la rutina debe tener al menos 3 caracteres.'
    },
    series: {
        min: 2,
        max: 5,
        errorMessage: 'El nuevo valor es superior a 5 series o es mejor a 5 series. Recuerda que no te puedes exceder y no puedes no hacer nada.'
    },
    repetitionsPerSet: {
        min: 5,
        max: 30,
        errorMessage: 'El valor de las repeticiones por serie es muy alto o muy bajo. Recuerda que el máximo son 30. Empieza de a poco 😉.'
    },
    rest: {
        min: 30,
        max: 60,
        errorMessage: 'El descanso máximo es de un minuto. Mas te puede dar pereza 🦥. Y menos tiempo te puede dar fatiga. El rango es de 30 a 60 segundos.'
    }
};

function validateName(name) {
    if (typeof name !== 'string' || name.trim().length < ROUTINE_VALIDATION.name.minLength) {
        throw new Error(ROUTINE_VALIDATION.name.errorMessage);
    }
}

// function validateRange(value, rule) {
//     if (value < rule.min || value > rule.max) {
//         throw new Error(rule.errorMessage);
//     }
// }

function validateInteger(value, rule) {
    if (!Number.isInteger(value) || value < rule.min || value > rule.max) {
        throw new Error(rule.errorMessage);
    }
}

function validateRoutine(name, series, repetitionsPerSet, rest) {
    validateName(name);
    // validateRange(series, ROUTINE_VALIDATION.series);
    // validateRange(repetitionsPerSet, ROUTINE_VALIDATION.repetitionsPerSet);
    // validateRange(rest, ROUTINE_VALIDATION.rest);

    validateInteger(series, ROUTINE_VALIDATION.series);
    validateInteger(repetitionsPerSet, ROUTINE_VALIDATION.repetitionsPerSet);
    validateInteger(rest, ROUTINE_VALIDATION.rest);
}

function Routine(name, series, repetitionsPerSet, rest) {

    validateRoutine(name, series, repetitionsPerSet, rest);

    // Propiedades
    this.id = ++routineIdCounter;
    this.name = name.trim();
    this.durationPerSet = 5;
    this.series = series;
    this.repetitionsPerSet = repetitionsPerSet;
    this.rest = rest;
    this.durationRoutine = this.calculateDuration();
    this.createdAt = new Date().toISOString();


}

// Comportamientos
Routine.prototype.rename = function rename(newName) {
    validateName(newName);
    this.name = newName.trim();

}

Routine.prototype.changeCountSeries = function changeCountSeries(newValue) {
    validateInteger(newValue, ROUTINE_VALIDATION.series);

    this.series = newValue;
    this.durationRoutine = this.calculateDuration();

}

Routine.prototype.changeRepetitionsPerSet = function changeRepetitionsPerSet(newValue) {
    validateInteger(newValue, ROUTINE_VALIDATION.repetitionsPerSet);

    this.repetitionsPerSet = newValue;
    this.durationRoutine = this.calculateDuration();

}

Routine.prototype.changeRest = function changeRest(newValue) {
    validateInteger(newValue, ROUTINE_VALIDATION.rest);

    this.rest = newValue;
    this.durationRoutine = this.calculateDuration();

}

Routine.prototype.calculateDuration = function calculateDuration() {
    // const repetitions = this.repetitionsPerSet
    // const durationPerSet = this.durationPerSet
    // const calculateExecution = repetitions * durationPerSet;
    // const series = this.series
    // const calculateEffort = series * calculateExecution;
    // const rest = this.rest;
    // const calculateTotalRest = (series - 1) * rest
    // const durationRoutine = calculateEffort + calculateTotalRest

    // return durationRoutine;
    return ((this.repetitionsPerSet * this.durationPerSet) * this.series) + ((this.series - 1) * this.rest);
}

let messageTimeout;

function showMessage(message, type = 'success') {
    const box = document.getElementById('messageBox');

    const validTypes = ['success', 'error'];

    if (!validTypes.includes(type)) {
        type = 'success';
    }

    clearTimeout(messageTimeout);
    

    box.textContent = message;
    box.className = `message-box ${type}`;

    messageTimeout = setTimeout(() => {
        box.classList.add('hidden');
    }, 3000)
}


function addRoutine(name, series, repetitionsPerSet, rest) {


    if (typeof name !== 'string' || !name || name.trim().length === 0) {
        showMessage('El nombre de la rutina es obligatorio', 'error');
        console.log('El nombre de la rutina es obligatorio')
        return null;
    }

    try {
        const routine = new Routine(name, series, repetitionsPerSet, rest);
        routines.push(routine);
        return routine;
    } catch (error) {
        showMessage(error.message, 'error');
        console.log(error.message)
        return null;
    }
}

function transfordurationRutine(duration) {

    // Complejo y poco mantenible
    // const minutes = duration / 60;
    // const minuteAndSeconds = minutes.toString().split('.');

    // const minute = Number(minuteAndSeconds[0]);
    // const secondString = minuteAndSeconds[1];
    // const baseTen = 10 ** secondString.length; // Esto es para añadir los 0 antes de la coma.
    // const zerosBeforeTheDecimalPoint =  Number(secondString) / baseTen; 
    // const seconds = Math.floor(zerosBeforeTheDecimalPoint * 60);

    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    //debugger;
    return `${minutes} m : ${seconds} s`
}

function renderRoutines() {
    const routinesTable = document.getElementById('routinesTable');
 

    if (routines.length === 0) {
        routinesTable.innerHTML =
            '<p class="empty-state">No hay rutinas. Haz clic en "Crear Rutina" para comenzar..</p>';
        return;
    }

    const rows = routines
        .map((routine) => {
            return `
        <tr>
            <th scope="row">${routine.name}</th>
            <td>${routine.series}</td>
            <td>${routine.repetitionsPerSet}</td>
            <td>${routine.rest} s</td>
            <td>${transfordurationRutine(routine.durationRoutine)}</td>
        </tr>
            `
        })
        .join('');

    routinesTable.innerHTML = `
    <table class="routine-table">
            <thead>
                <tr>
                    <th scope="col">Ejercicio</th>
                    <th scope="col">Series</th>
                    <th scope="col">Repeticiones</th>
                    <th scope="col">Descanso</th>
                    <th scope="col">Duración</th>
                </tr>
            </thead>

            <tbody>
                ${rows}
            </tbody>
        </table>
    `;


}

function setupModalListener() {
    const modal = document.getElementById('createRoutineModal');
    const btnAbrir = document.getElementById('buttonCreateRutine');

    // Abre el diálogo en formato Modal (bloquea el fondo)
    btnAbrir.addEventListener('click', () => {
        modal.showModal();
    });

}

function closeModal() {
    const modal = document.getElementById('createRoutineModal');
    const btnCerrar = document.getElementById('btnCerrar');

    // Abre el diálogo en formato Modal (bloquea el fondo)
    btnCerrar.addEventListener('click', () => {

        modal.close();
    });

}

function submitForm() {
    const form = document.getElementById('formRoutine');
    const modal = document.getElementById('createRoutineModal');

    form.addEventListener('submit', function (event) {

        event.preventDefault();

        const data = new FormData(form);

        const name = data.get('name');
        const series = Number(data.get('series'));
        const repetitions = Number(data.get('repetitions'));
        const rest = Number(data.get('rest'));

        const routine = addRoutine(name, series, repetitions, rest);
        if (routine) {
            showMessage(`Rutina "${routine.name}" creado exitosamente`, 'success');

            renderRoutines();

            console.log('Rutina creado exitosamente');

            form.reset()

            setTimeout(() => {
                modal.close();
            }, 1000);

        }
    })
}

function initApp() {
    setupModalListener();
    submitForm();
    closeModal();



}

document.addEventListener('DOMContentLoaded', initApp);
