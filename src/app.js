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

class LogTracker {
    #dates = []

    addLog(date) {
        if (typeof date !== 'string' || date.length != 10) {
            return null;
        }

        const regex = /^\d{4}-\d{2}-\d{2}$/;

        if (!regex.test(date)) {
            return null;
        }

        const [year, month, day] = date.split('-');

        const dateFormat = new Date(year, month - 1, day);

        const yearNumber = Number(year);
        const monthNumber = Number(month);
        const dayNumber = Number(day);

        if (!((dateFormat.getFullYear() === yearNumber) && ((dateFormat.getMonth() + 1) === monthNumber) && (dateFormat.getDate() === dayNumber))) {
            return null;
        }

        this.#dates.push(date);
        return date;


    }

    getLogs() {
        return [...this.#dates];
    }
}


class Routine {
    #id;
    #name;
    #series;
    #repetitionsPerSet;
    #rest;
    #durationPerSet;
    #createdAt;
    #logtracker

    static #idCounter = 0;


    constructor(name, series, repetitionsPerSet, rest, logtracker = new LogTracker()) {

        this.#id = Routine.generateId();
        this.name = name;
        this.#durationPerSet = 5;
        this.series = series;
        this.repetitionsPerSet = repetitionsPerSet;
        this.rest = rest;
        this.#createdAt = new Date().toISOString();
        this.#logtracker = logtracker;
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
        return this.calculateDuration();
    }

    rename(newName) {

        this.name = newName;
    }

    changeCountSeries(newValue) {

        this.series = newValue;

    }

    changeRepetitionsPerSet(newValue) {

        this.repetitionsPerSet = newValue;

    }

    changeRest(newValue) {

        this.rest = newValue;

    }

    calculateDuration(durationPerRepetition = this.#durationPerSet) {
        return ((this.#repetitionsPerSet * durationPerRepetition) * this.#series) + ((this.#series - 1) * this.#rest);
    }

    logWorkout(date) {
        const created = this.#logtracker.addLog(date);
        if (!created) {
            return null;
        }

        return {
            habitId: this.#id,
            date: created,
        };
    }

    getLogs() {
        return this.#logtracker.getLogs();
    }

    static generateId() {
        return ++Routine.#idCounter;
    }


}

class RunningRoutine extends Routine {

    #kilometersGoal;
    #paceSecondsPerKm;

    constructor(name, series, repetitionsPerSet, rest, logtracker, kilometersGoal, paceSecondsPerKm) {
        super(name, series, repetitionsPerSet, rest, logtracker);
        this.kilometersGoal = kilometersGoal;
        this.paceSecondsPerKm = paceSecondsPerKm;
    }

    get kilometersGoal() {
        return this.#kilometersGoal;
    }

    set kilometersGoal(value) {
        const km = Number(value);
        if (isNaN(km) || km <= 0) {
            throw new Error('El objetivo de los kilometros debe de ser un número positivo');
        }

        this.#kilometersGoal = km;

    }

    get paceSecondsPerKm() {

        const minutes = Math.floor(this.#paceSecondsPerKm / 60);
        const seconds = Math.floor(this.#paceSecondsPerKm % 60);

        if (seconds < 10) {
            return `${minutes}:0${seconds}`;
        }

        return `${minutes}:${seconds}`;

    }

    set paceSecondsPerKm(value) {

        if (typeof value !== 'string') {
            throw new Error('Debes pasar el ritmo como string')
        }
        if (!value.includes(':')) {
            throw new Error('El formato para pasar el ritmo es mm:ss');
        }

        const values = value.split(':');

        if (values.length !== 2 || values[0] === '' || values[1] === '') {
            throw new Error('Recuerda pasar los minutos y segundos, no solo un valor');
        }

        const minutes = Number(values[0]);
        const seconds = Number(values[1]);

        if (isNaN(minutes) || isNaN(seconds)) {
            throw new Error('El ritmo deben ser valores numericos')
        }

        if (!Number.isInteger(minutes) || !Number.isInteger(seconds)) {
            throw new Error('Tanto los minutos como los segundos deben ser valores enteros')
        }


        if (seconds < 0 || seconds > 59) {
            throw new Error('Los segundos deben estar entre 0 y 59');
        }

        if (minutes < 0) {
            throw new Error('Los minutos no puedes negativos')
        }

        const transforMinutes = minutes * 60;
        const total = transforMinutes + seconds;

        if (total === 0) {
            throw new Error('El ritmo total no puede ser 0');
        }

        this.#paceSecondsPerKm = total;


    }

    calculateDuration() {
        const totalRunningSeconds = this.#kilometersGoal * this.#paceSecondsPerKm;
        const totalIntervals = this.series * this.repetitionsPerSet;
        const secondsPerInterval = totalRunningSeconds / totalIntervals;
        
        const totalDuration = super.calculateDuration(secondsPerInterval)


        return totalDuration;
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

// ======================================================
// PRUEBAS ETAPA 3 - COMPOSICIÓN + HERENCIA + SUPER
// ======================================================

function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ ${message}`);
    }

    console.log(`✅ ${message}`);
}

function expectError(callback, message) {
    try {
        callback();

        throw new Error(
            `❌ ${message} → NO se lanzó ningún error`
        );
    } catch (error) {

        if (error.message.startsWith('❌')) {
            throw error;
        }

        console.log(`✅ ${message}`);
    }
}


// ======================================================
// 1. LOGTRACKER - ESTADO INICIAL
// ======================================================

const tracker = new LogTracker();

assert(
    Array.isArray(tracker.getLogs()),
    'LogTracker permite consultar los registros'
);

assert(
    tracker.getLogs().length === 0,
    'LogTracker inicia sin registros'
);


// ======================================================
// 2. LOGTRACKER - REGISTRO VÁLIDO
// ======================================================

const firstLog = tracker.addLog('2026-09-30');

assert(
    firstLog === '2026-09-30',
    'LogTracker agrega una fecha válida'
);

assert(
    tracker.getLogs().length === 1,
    'El registro válido queda almacenado'
);

assert(
    tracker.getLogs()[0] === '2026-09-30',
    'LogTracker conserva correctamente la fecha registrada'
);


// ======================================================
// 3. LOGTRACKER - FORMATO Y FECHA REAL
// ======================================================

const dateValidationTracker = new LogTracker();

assert(
    dateValidationTracker.addLog('2026-10-01') === '2026-10-01',
    'LogTracker acepta una fecha válida normal'
);

assert(
    dateValidationTracker.addLog('2024-02-29') === '2024-02-29',
    'LogTracker acepta 29 de febrero en año bisiesto'
);

assert(
    dateValidationTracker.addLog('2026-02-29') === null,
    'LogTracker rechaza 29 de febrero en año no bisiesto'
);

assert(
    dateValidationTracker.addLog('2026-04-31') === null,
    'LogTracker rechaza días inexistentes'
);

assert(
    dateValidationTracker.addLog('2026-13-01') === null,
    'LogTracker rechaza meses mayores a 12'
);

assert(
    dateValidationTracker.addLog('2026-00-01') === null,
    'LogTracker rechaza el mes 00'
);

assert(
    dateValidationTracker.addLog('aaaaaaaaaa') === null,
    'LogTracker rechaza texto con longitud válida pero formato inválido'
);

assert(
    dateValidationTracker.addLog('2026/10/01') === null,
    'LogTracker exige el formato YYYY-MM-DD'
);

assert(
    dateValidationTracker.addLog('hola') === null,
    'LogTracker rechaza cadenas con longitud incorrecta'
);

assert(
    dateValidationTracker.getLogs().length === 2,
    'Solo las fechas realmente válidas quedan almacenadas'
);


// ======================================================
// 4. LOGTRACKER - ENCAPSULAMIENTO
// ======================================================

const copiedLogs = tracker.getLogs();

copiedLogs.push('fecha-falsa');

assert(
    copiedLogs.length === 2,
    'La copia de logs puede modificarse externamente'
);

assert(
    tracker.getLogs().length === 1,
    'Modificar la copia no altera el estado privado de LogTracker'
);


// ======================================================
// 5. ROUTINE - CREACIÓN Y GETTERS
// ======================================================

const routineTracker = new LogTracker();

const routine = new Routine(
    'Sentadilla',
    2,
    10,
    30,
    routineTracker
);

assert(
    routine.name === 'Sentadilla',
    'Routine inicializa correctamente el nombre'
);

assert(
    routine.series === 2,
    'Routine inicializa correctamente las series'
);

assert(
    routine.repetitionsPerSet === 10,
    'Routine inicializa correctamente las repeticiones'
);

assert(
    routine.rest === 30,
    'Routine inicializa correctamente el descanso'
);


// ======================================================
// 6. ROUTINE - CÁLCULO BASE
// ======================================================

// Fórmula:
//
// (10 repeticiones × 5 segundos) × 2 series
// +
// (2 - 1) × 30 segundos descanso
//
// 100 + 30 = 130

assert(
    routine.calculateDuration() === 130,
    'Routine calcula correctamente la duración usando durationPerSet por defecto'
);

assert(
    routine.durationRoutine === 130,
    'durationRoutine utiliza calculateDuration()'
);


// ======================================================
// 7. ROUTINE - calculateDuration CON DURACIÓN PERSONALIZADA
// ======================================================

// Le indicamos que cada repetición dura 10 segundos:
//
// (10 × 10) × 2
// +
// 30
//
// = 230

assert(
    routine.calculateDuration(10) === 230,
    'Routine permite recibir una duración personalizada por repetición'
);


// ======================================================
// 8. ROUTINE - COMPOSICIÓN CON LOGTRACKER
// ======================================================

const loggedWorkout = routine.logWorkout('2026-10-01');

assert(
    loggedWorkout !== null,
    'Routine puede registrar un entrenamiento mediante LogTracker'
);

assert(
    loggedWorkout.date === '2026-10-01',
    'Routine delega correctamente el registro de la fecha'
);

assert(
    routine.getLogs().length === 1,
    'Routine delega correctamente la consulta de registros'
);

assert(
    routine.getLogs()[0] === '2026-10-01',
    'Routine devuelve los registros almacenados por LogTracker'
);


// ======================================================
// 9. ROUTINE - LOG INVÁLIDO
// ======================================================

const invalidRoutineLog = routine.logWorkout('hola');

assert(
    invalidRoutineLog === null,
    'Routine devuelve null cuando LogTracker rechaza un registro'
);

assert(
    routine.getLogs().length === 1,
    'Un log inválido no modifica los registros de Routine'
);


// ======================================================
// 10. RUNNINGROUTINE - HERENCIA
// ======================================================

const running = new RunningRoutine(
    'Running por intervalos',
    3,
    5,
    60,
    new LogTracker(),
    6,
    '5:00'
);

assert(
    running instanceof RunningRoutine,
    'running es una instancia de RunningRoutine'
);

assert(
    running instanceof Routine,
    'RunningRoutine hereda de Routine'
);

assert(
    running.name === 'Running por intervalos',
    'RunningRoutine hereda los getters de Routine'
);

assert(
    running.series === 3,
    'RunningRoutine hereda series de Routine'
);

assert(
    running.repetitionsPerSet === 5,
    'RunningRoutine hereda repetitionsPerSet de Routine'
);

assert(
    running.rest === 60,
    'RunningRoutine hereda rest de Routine'
);


// ======================================================
// 11. CAMPOS ESPECÍFICOS DE RUNNINGROUTINE
// ======================================================

assert(
    running.kilometersGoal === 6,
    'kilometersGoal se inicializa correctamente'
);

assert(
    running.paceSecondsPerKm === '5:00',
    'El getter del ritmo devuelve el formato mm:ss'
);


// ======================================================
// 12. CÁLCULO DE RUNNING POR INTERVALOS
// ======================================================
//
// 6 km × 300 segundos/km
// = 1800 segundos corriendo
//
// 3 series × 5 repeticiones
// = 15 intervalos
//
// 1800 / 15
// = 120 segundos por intervalo
//
// super.calculateDuration(120)
//
// (5 × 120) × 3
// +
// (3 - 1) × 60
//
// 1800 + 120
// = 1920 segundos
//

assert(
    running.calculateDuration() === 1920,
    'RunningRoutine calcula correctamente la duración de una sesión por intervalos'
);


// ======================================================
// 13. durationRoutine + POLIMORFISMO
// ======================================================

assert(
    running.durationRoutine === 1920,
    'durationRoutine utiliza el calculateDuration sobrescrito de RunningRoutine'
);


// ======================================================
// 14. COMPATIBILIDAD CON EL FORMATEADOR
// ======================================================

assert(
    transfordurationRutine(running.durationRoutine) === '32 m : 0 s',
    'La duración de RunningRoutine es compatible con el formateador existente'
);


// ======================================================
// 15. RECÁLCULO DINÁMICO - DISTANCIA
// ======================================================

// Cambiamos de 6 km a 10 km.
//
// 10 × 300 = 3000 segundos corriendo
//
// descansos:
// (3 - 1) × 60 = 120
//
// total:
// 3120 segundos

running.kilometersGoal = 10;

assert(
    running.calculateDuration() === 3120,
    'La duración cambia automáticamente al modificar kilometersGoal'
);

assert(
    running.durationRoutine === 3120,
    'durationRoutine refleja el nuevo objetivo de kilómetros'
);


// ======================================================
// 16. RECÁLCULO DINÁMICO - RITMO
// ======================================================

// 10 km a 6:00/km:
//
// 10 × 360
// = 3600 segundos corriendo
//
// + 120 segundos de descanso
//
// = 3720 segundos

running.paceSecondsPerKm = '6:00';

assert(
    running.paceSecondsPerKm === '6:00',
    'El setter permite modificar el ritmo'
);

assert(
    running.calculateDuration() === 3720,
    'La duración cambia automáticamente al modificar el ritmo'
);

assert(
    running.durationRoutine === 3720,
    'durationRoutine refleja el nuevo ritmo'
);


// ======================================================
// 17. RECÁLCULO DINÁMICO - DESCANSO
// ======================================================

// Ahora descanso = 30:
//
// carrera = 3600
//
// descansos:
// (3 - 1) × 30
// = 60
//
// total = 3660

running.changeRest(30);

assert(
    running.rest === 30,
    'RunningRoutine puede modificar el descanso heredado'
);

assert(
    running.durationRoutine === 3660,
    'La duración se recalcula al modificar el descanso'
);


// ======================================================
// 18. VALIDACIONES kilometersGoal
// ======================================================

running.kilometersGoal = 5;

assert(
    running.kilometersGoal === 5,
    'kilometersGoal acepta enteros positivos'
);

running.kilometersGoal = 5.5;

assert(
    running.kilometersGoal === 5.5,
    'kilometersGoal acepta decimales positivos'
);

running.kilometersGoal = '5.5';

assert(
    running.kilometersGoal === 5.5,
    'kilometersGoal acepta strings numéricos válidos'
);

expectError(
    () => {
        running.kilometersGoal = 0;
    },
    'kilometersGoal rechaza cero'
);

expectError(
    () => {
        running.kilometersGoal = -1;
    },
    'kilometersGoal rechaza números negativos'
);

expectError(
    () => {
        running.kilometersGoal = '5abc';
    },
    'kilometersGoal rechaza strings parcialmente numéricos'
);

expectError(
    () => {
        running.kilometersGoal = 'hola';
    },
    'kilometersGoal rechaza strings no numéricos'
);

assert(
    running.kilometersGoal === 5.5,
    'Un valor inválido no altera el último kilometersGoal válido'
);


// ======================================================
// 19. VALIDACIONES DEL RITMO
// ======================================================

// Dejamos primero un ritmo válido conocido

running.paceSecondsPerKm = '6:00';

expectError(
    () => {
        running.paceSecondsPerKm = 330;
    },
    'El ritmo rechaza valores que no sean string'
);

expectError(
    () => {
        running.paceSecondsPerKm = '5';
    },
    'El ritmo exige el separador ":"'
);

expectError(
    () => {
        running.paceSecondsPerKm = '5:';
    },
    'El ritmo rechaza segundos vacíos'
);

expectError(
    () => {
        running.paceSecondsPerKm = ':30';
    },
    'El ritmo rechaza minutos vacíos'
);

expectError(
    () => {
        running.paceSecondsPerKm = 'hola:30';
    },
    'El ritmo rechaza minutos no numéricos'
);

expectError(
    () => {
        running.paceSecondsPerKm = '5:hola';
    },
    'El ritmo rechaza segundos no numéricos'
);

expectError(
    () => {
        running.paceSecondsPerKm = '5.5:30';
    },
    'El ritmo rechaza minutos decimales'
);

expectError(
    () => {
        running.paceSecondsPerKm = '5:30.5';
    },
    'El ritmo rechaza segundos decimales'
);

expectError(
    () => {
        running.paceSecondsPerKm = '5:60';
    },
    'El ritmo rechaza segundos superiores a 59'
);

expectError(
    () => {
        running.paceSecondsPerKm = '-1:30';
    },
    'El ritmo rechaza minutos negativos'
);

expectError(
    () => {
        running.paceSecondsPerKm = '0:00';
    },
    'El ritmo total no puede ser cero'
);

assert(
    running.paceSecondsPerKm === '6:00',
    'Los errores de ritmo no alteran el último valor válido'
);


// ======================================================
// 20. ESTADO VÁLIDO DESPUÉS DE ERRORES
// ======================================================

assert(
    running.kilometersGoal === 5.5,
    'kilometersGoal mantiene el último valor válido después de errores'
);

assert(
    running.paceSecondsPerKm === '6:00',
    'paceSecondsPerKm mantiene el último valor válido después de errores'
);


// ======================================================
// 21. RUNNINGROUTINE + COMPOSICIÓN HEREDADA
// ======================================================

assert(
    running.getLogs().length === 0,
    'RunningRoutine hereda la consulta de logs'
);

const runningLog = running.logWorkout('2026-10-02');

assert(
    runningLog !== null,
    'RunningRoutine puede registrar entrenamientos'
);

assert(
    running.getLogs().length === 1,
    'RunningRoutine utiliza LogTracker mediante composición heredada'
);

assert(
    running.getLogs()[0] === '2026-10-02',
    'El registro queda almacenado en el LogTracker de RunningRoutine'
);


// ======================================================
// 22. RUNNINGROUTINE - LOG INVÁLIDO
// ======================================================

const invalidRunningLog = running.logWorkout('fecha-falsa');

assert(
    invalidRunningLog === null,
    'RunningRoutine rechaza registros con fecha inválida'
);

assert(
    running.getLogs().length === 1,
    'Un registro inválido no modifica el historial de RunningRoutine'
);


// ======================================================
// 23. CAMBIO DE SERIES Y RECÁLCULO
// ======================================================

// Dejamos un caso fácil:
//
// 5.5 km
// 6:00/km
//
// tiempo corriendo:
// 5.5 × 360
// = 1980 segundos
//
// series = 2
// descanso = 30
//
// descanso total:
// (2 - 1) × 30
// = 30
//
// total = 2010

running.changeCountSeries(2);

assert(
    running.series === 2,
    'RunningRoutine puede modificar las series heredadas'
);

assert(
    running.durationRoutine === 2010,
    'La duración se recalcula correctamente al cambiar las series'
);


// ======================================================
// 24. CAMBIO DE REPETICIONES Y CONSISTENCIA
// ======================================================

// Aunque cambie el número de intervalos,
// los 1980 segundos de carrera se redistribuyen.
//
// El tiempo total corriendo sigue siendo 1980.
//
// + 30 segundos de descanso
//
// = 2010

running.changeRepetitionsPerSet(10);

assert(
    running.repetitionsPerSet === 10,
    'RunningRoutine puede modificar las repeticiones heredadas'
);

assert(
    running.durationRoutine === 2010,
    'Cambiar la cantidad de intervalos redistribuye el esfuerzo sin alterar la distancia total'
);


// ======================================================
// 25. COMPROBAR NUEVA INTERPRETACIÓN DE INTERVALOS
// ======================================================

const intervalRoutine = new RunningRoutine(
    'Intervalos 6K',
    3,
    5,
    60,
    new LogTracker(),
    6,
    '5:00'
);

assert(
    intervalRoutine.calculateDuration() === 1920,
    'El cálculo por intervalos produce 32 minutos para 6 km a ritmo 5:00 con descansos'
);

assert(
    transfordurationRutine(intervalRoutine.durationRoutine) === '32 m : 0 s',
    'La sesión por intervalos muestra correctamente 32 minutos'
);


// ======================================================
// RESULTADO FINAL
// ======================================================

console.log('');
console.log('========================================================');
console.log('✅ TODAS LAS PRUEBAS ACTUALIZADAS DE LA ETAPA 3 PASARON');
console.log('========================================================');

document.addEventListener('DOMContentLoaded', initApp);
