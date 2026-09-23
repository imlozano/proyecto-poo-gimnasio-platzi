const routines = [];

const ROUTINE_VALIDATION = {
    name: {
        minLength: 3,
        errorMessage: 'El nombre de la rutina debe tener al menos 3 caracteres.'
    },
    series: {
        min: 2,
        max: 5,
        errorMessage: 'El número de series debe estar entre 2 y 5.'
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

function validateInteger(value, rule) {
    if (!Number.isInteger(value) || value < rule.min || value > rule.max) {
        throw new Error(rule.errorMessage);
    }
}


class Routine {
    #id;
    #name;
    #series;
    #repetitionsPerSet;
    #rest;
    #durationPerSet;
    #durationRoutine;
    #createdAt;

    static #idCounter = 0;


    constructor(name, series, repetitionsPerSet, rest) {

        this.#id = Routine.generateId();
        this.name = name;
        this.#durationPerSet = 5;
        this.series = series;
        this.repetitionsPerSet = repetitionsPerSet;
        this.rest = rest;
        this.#durationRoutine = this.calculateDuration();
        this.#createdAt = new Date().toISOString();
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this.#name;
    }

    set name(value) {
        validateName(value);
        this.#name = value.trim();
    }

    get series() {
        return this.#series;
    }

    set series(value) {
        validateInteger(value, ROUTINE_VALIDATION.series);
        this.#series = value;
    }

    get repetitionsPerSet() {
        return this.#repetitionsPerSet;
    }

    set repetitionsPerSet(value) {
        validateInteger(value, ROUTINE_VALIDATION.repetitionsPerSet);
        this.#repetitionsPerSet = value;
    }

    get rest() {
        return this.#rest;
    }

    set rest(value) {
        validateInteger(value, ROUTINE_VALIDATION.rest);
        this.#rest = value;
    }

    get durationRoutine() {
        return this.#durationRoutine;
    }

    rename(newName) {

        this.name = newName;
    }

    changeCountSeries(newValue) {
    
        this.series = newValue;

        this.#durationRoutine = this.calculateDuration();
    }

    changeRepetitionsPerSet(newValue) {
    
        this.repetitionsPerSet = newValue;

        this.#durationRoutine = this.calculateDuration();
    }

    changeRest(newValue) {

        this.rest = newValue;

        this.#durationRoutine = this.calculateDuration();
    }

    calculateDuration() {
        return ((this.#repetitionsPerSet * this.#durationPerSet) * this.#series) + ((this.#series - 1) * this.#rest);
    }

    static generateId() {
        return ++Routine.#idCounter;
    }


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

    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    //debugger;
    return `${minutes} m : ${seconds} s`
}

function renderRoutines() {
    const routinesTable = document.getElementById('routinesTable');


    if (routines.length === 0) {

        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state'
        emptyState.textContent = 'No hay rutinas. Haz clic en "Crear Rutina" para comenzar.';
        routinesTable.replaceChildren(emptyState);

        return;
    }

    const table = document.createElement('table');
    table.className = 'routine-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const headers = [
        'Ejercicio',
        'Series',
        'Repeticiones',
        'Descanso',
        'Duración'
    ];

    headers.forEach((header) => {
        const th = document.createElement('th');

        th.scope = 'col';
        th.textContent = header;

        headerRow.append(th);
    });

    thead.append(headerRow);

    const tbody = document.createElement('tbody');

    routines.forEach((routine) => {
        const row = document.createElement('tr');

        const namecell = document.createElement('th');
        namecell.scope = 'row';
        namecell.textContent = routine.name;

        const seriesCell = document.createElement('td');
        seriesCell.textContent = routine.series;

        const repetitionsCell = document.createElement('td');
        repetitionsCell.textContent = routine.repetitionsPerSet;

        const restCell = document.createElement('td');
        restCell.textContent = `${routine.rest} s`

        const durationCell = document.createElement('td');
        durationCell.textContent = transfordurationRutine(routine.durationRoutine);

        row.append(
            namecell,
            seriesCell,
            repetitionsCell,
            restCell,
            durationCell
        );

        tbody.append(row);
    });

    table.append(thead, tbody);

    routinesTable.replaceChildren(table);

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

    // Cierra el diálogo modal
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
