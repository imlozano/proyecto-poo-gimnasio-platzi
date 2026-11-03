const routines = [];

class DomainError extends Error {
    constructor(message, code) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
    }
}

class ValidationError extends DomainError {}

class CreationError extends DomainError {}

const ROUTINE_VALIDATION = {
    name: {
        minLength: 3,
        errorMessage: 'El nombre de la rutina debe tener al menos 3 caracteres.',
        code: 'ROUTINE_NAME_INVALID'
    },
    series: {
        min: 2,
        max: 5,
        errorMessage: 'El número de series debe estar entre 2 y 5.',
        code: 'ROUTINE_SERIES_OUT_OF_RANGE'
    },
    repetitionsPerSet: {
        min: 5,
        max: 30,
        errorMessage: 'El valor de las repeticiones por serie es muy alto o muy bajo. Recuerda que el máximo son 30. Empieza de a poco 😉.',
        code: 'ROUTINE_REPETITIONS_OUT_OF_RANGE'
    },
    rest: {
        min: 30,
        max: 60,
        errorMessage: 'El descanso máximo es de un minuto. Mas te puede dar pereza 🦥. Y menos tiempo te puede dar fatiga. El rango es de 30 a 60 segundos.',
        code: 'ROUTINE_REST_OUT_OF_RANGE'
    }
};

function validateName(name) {
    if (typeof name !== 'string' || name.trim().length < ROUTINE_VALIDATION.name.minLength) {
        throw new ValidationError(
            ROUTINE_VALIDATION.name.errorMessage,
            ROUTINE_VALIDATION.name.code
        );
    }
}

function validateInteger(value, rule) {
    if (!Number.isInteger(value) || value < rule.min || value > rule.max) {
        throw new ValidationError(rule.errorMessage, rule.code);
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

let factoryCreationAllowed = false


class Routine {
    #id;
    #name;
    #series;
    #repetitionsPerSet;
    #rest;
    #durationPerSet;
    #createdAt;
    #logtracker
    #frequency

    static #idCounter = 0;


    constructor(name, series, repetitionsPerSet, rest, logtracker = new LogTracker(), frequency = 'daily') {

        if (!factoryCreationAllowed) {
            throw new CreationError(
                'Debe usarse una factoria',
                'ROUTINE_FACTORY_REQUIRED'
            );
        }

        factoryCreationAllowed = false;

        this.#id = Routine.generateId();
        this.name = name;
        this.#durationPerSet = 5;
        this.series = series;
        this.repetitionsPerSet = repetitionsPerSet;
        this.rest = rest;
        this.#createdAt = new Date().toISOString();
        this.#logtracker = logtracker;
        this.frequency = frequency;
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

    get frequency() {
        return this.#frequency;
    }

    set frequency(value) {
        const validFrequencies = ['daily', 'weekly'];

        if (!validFrequencies.includes(value)) {
            throw new ValidationError(
                'La frecuencia debe ser "daily" o "weekly".',
                'ROUTINE_FREQUENCY_INVALID'
            );
        }

        this.#frequency = value;
    }

    get createdAt() {
        return this.#createdAt;
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

    calculateStreak(today) {

        const calculator = streakCalculators[this.frequency];

        if (!today) {
            const currentDate = new Date();

            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');

            today = `${year}-${month}-${day}`;

        }

        return calculator.calculate(this, this.getLogs(), today);
    }

    static daily(name, series, repetitionsPerSet, rest, logtracker) {
        factoryCreationAllowed = true;
        return new Routine(name, series, repetitionsPerSet, rest, logtracker, 'daily');
    }

    static weekly(name, series, repetitionsPerSet, rest, logtracker) {
        factoryCreationAllowed = true;
        return new Routine(name, series, repetitionsPerSet, rest, logtracker, 'weekly');
    }

    static generateId() {
        return ++Routine.#idCounter;
    }


}

class RunningRoutine extends Routine {

    #kilometersGoal;
    #paceSecondsPerKm;

    constructor(name, series, repetitionsPerSet, rest, logtracker, kilometersGoal, paceSecondsPerKm, frequency = 'daily') {
        super(name, series, repetitionsPerSet, rest, logtracker, frequency);
        this.kilometersGoal = kilometersGoal;
        this.paceSecondsPerKm = paceSecondsPerKm;
    }

    get kilometersGoal() {
        return this.#kilometersGoal;
    }

    set kilometersGoal(value) {
        const km = Number(value);
        if (isNaN(km) || km <= 0) {
            throw new ValidationError(
                'El objetivo de los kilometros debe de ser un número positivo',
                'RUNNING_KILOMETERS_INVALID'
            );
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
            throw new ValidationError(
                'Debes pasar el ritmo como string',
                'RUNNING_PACE_INVALID'
            );
        }
        if (!value.includes(':')) {
            throw new ValidationError(
                'El formato para pasar el ritmo es mm:ss',
                'RUNNING_PACE_INVALID'
            );
        }

        const values = value.split(':');

        if (values.length !== 2 || values[0] === '' || values[1] === '') {
            throw new ValidationError(
                'Recuerda pasar los minutos y segundos, no solo un valor',
                'RUNNING_PACE_INVALID'
            );
        }

        const minutes = Number(values[0]);
        const seconds = Number(values[1]);

        if (isNaN(minutes) || isNaN(seconds)) {
            throw new ValidationError(
                'El ritmo deben ser valores numericos',
                'RUNNING_PACE_INVALID'
            );
        }

        if (!Number.isInteger(minutes) || !Number.isInteger(seconds)) {
            throw new ValidationError(
                'Tanto los minutos como los segundos deben ser valores enteros',
                'RUNNING_PACE_INVALID'
            );
        }


        if (seconds < 0 || seconds > 59) {
            throw new ValidationError(
                'Los segundos deben estar entre 0 y 59',
                'RUNNING_PACE_INVALID'
            );
        }

        if (minutes < 0) {
            throw new ValidationError(
                'Los minutos no puedes negativos',
                'RUNNING_PACE_INVALID'
            );
        }

        const transforMinutes = minutes * 60;
        const total = transforMinutes + seconds;

        if (total === 0) {
            throw new ValidationError(
                'El ritmo total no puede ser 0',
                'RUNNING_PACE_INVALID'
            );
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

    static daily(name, series, repetitions, rest, kilometersGoal, pace, logtracker) {
        factoryCreationAllowed = true;
        return new RunningRoutine(name, series, repetitions, rest, logtracker, kilometersGoal, pace, 'daily');
    }

    static weekly(name, series, repetitions, rest, kilometersGoal, pace, logtracker) {
        factoryCreationAllowed = true;
        return new RunningRoutine(name, series, repetitions, rest, logtracker, kilometersGoal, pace, 'weekly');
    }
}

class StreakCalculator {
    constructor() {
        if (new.target === StreakCalculator) {
            throw new TypeError("No se puede instanciar una clase base directamente. Debes heredar de ella.");

        }
    }

    calculate(habit, logs, today) {
        throw new TypeError("La clase base no sabe calcular una racha");
    }
}

class DailyStreakCalculator extends StreakCalculator {
    calculate(habit, logs, today) {

        const logsCopy = [...logs];

        if (logsCopy.length === 0) { // validacion de no registros de rachas
            return 0;
        }

        const unique = [...new Set(logsCopy)];

        // ordenar logs del mas recientes al mas antiguo
        const sortedLogs = unique.sort((a, b) => b.localeCompare(a));

        const todayDate = new Date(`${today}T00:00:00`);
        const todayString = this.#getDateString(todayDate);

        const yesterdayDate = new Date(todayDate);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);

        const yesterdayString = this.#getDateString(yesterdayDate);

        let currentDate;

        if (unique.includes(todayString)) {
            currentDate = todayDate;
        } else if (unique.includes(yesterdayString)) {
            currentDate = yesterdayDate;
        } else {
            return 0;
        }

        let streak = 0;

        for (let i = 0; i < sortedLogs.length; i++) {
            const expectedDate = this.#getDateString(currentDate);

            if (sortedLogs[i] === expectedDate) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    #getDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }
}

class WeeklyStreakCalculator extends StreakCalculator {
    calculate(habit, logs, today) {

        const logsCopy = [...logs];

        if (logsCopy.length === 0) {
            return 0;
        }

        const unique = [...new Set(logsCopy)]

        const weeks = this.#groupByWeek(unique);
        const sortedWeeks = Object.keys(weeks).sort((a, b) => b.localeCompare(a));

        let streak = 0;

        const currentWeek = this.#getWeekKey(today);
        let expectedWeek = currentWeek;

        if (!weeks[currentWeek]) {
            expectedWeek = this.#getPreviousWeek(currentWeek);

            if (!weeks[expectedWeek]) {
                return 0;
            }
        }
        for (const week of sortedWeeks) {
            if (week === expectedWeek) {
                streak++;
                expectedWeek = this.#getPreviousWeek(expectedWeek);
            } else {
                break;
            }
        }

        return streak;
    }

    // ⚠️ Cuando se trabaja con fechas hay que tocarlo con pinzas ya que es uno de los conceptos y de las formas en la que vamos a estar trabajando que pueda ser bastante entretenida colocando atención al detalle ya que hay distintas formas en JS de manipular el calendario.todo haciendo calculo de la fecha actual y de los logs registrados ⚠️
    #groupByWeek(logs) {
        const weeks = {};
        logs.forEach((log) => {
            const weekKey = this.#getWeekKey(new Date(log + 'T00:00:00'));
            if (!weeks[weekKey]) {
                weeks[weekKey] = [];
            }
            weeks[weekKey].push(log);
        });
        return weeks;
    }


    #getWeekKey(date) {

        const copyDate = typeof date === 'string'
            ? new Date(`${date}T00:00:00`)
            : new Date(date);


        copyDate.setHours(0, 0, 0, 0);

        copyDate.setDate(copyDate.getDate() + 4 - (copyDate.getDay() || 7));

        const year = copyDate.getFullYear();

        const weekNo = this.#getWeekNumber(copyDate);

        return `${year}-W${String(weekNo).padStart(2, '0')}`;
    }

    #getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
        return weekNo;
    }

    #getPreviousWeek(weekKey) {
        const [year, weekStr] = weekKey.split('-W');
        let week = parseInt(weekStr);
        let y = parseInt(year);

        week--;
        if (week < 1) {
            y--;

            const month = 11;
            const day = 28;
            const lastDayOfYear = new Date(y, month, day);

            week = this.#getWeekNumber(lastDayOfYear);
        }

        return `${y}-W${String(week).padStart(2, '0')}`;
    }

}

// Mapa de estrategias por frecuencia
const streakCalculators = {
    daily: new DailyStreakCalculator(),
    weekly: new WeeklyStreakCalculator(),
};



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
        const routine = Routine.daily(name, series, repetitionsPerSet, rest);
        routines.push(routine);
        return routine;
    } catch (error) {
        if (!(error instanceof DomainError)) {
            throw error;
        }

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

// ======================================================
// PRUEBAS DEL PROYECTO
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

function expectDomainError(callback, expectedCode, expectedMessage, message) {
    let receivedError = null;

    try {
        callback();
    } catch (error) {
        receivedError = error;
    }

    assert(
        receivedError !== null,
        `${message}: debía lanzar un error`
    );

    assert(
        receivedError instanceof DomainError &&
            receivedError instanceof Error,
        `${message}: es un DomainError y un Error`
    );

    assert(
        receivedError.code === expectedCode,
        `${message}: conserva el código ${expectedCode}`
    );

    assert(
        receivedError.message === expectedMessage,
        `${message}: conserva el mensaje original`
    );
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

const routine = Routine.daily(
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

const running = RunningRoutine.daily(
    'Running por intervalos',
    3,
    5,
    60,
    6,
    '5:00',
    new LogTracker()
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

const intervalRoutine = RunningRoutine.daily(
    'Intervalos 6K',
    3,
    5,
    60,
    6,
    '5:00',
    new LogTracker()
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
// 26. CALCULADORAS DE RACHAS
// ======================================================

const dailyCalculator = new DailyStreakCalculator();
const weeklyCalculator = new WeeklyStreakCalculator();

const today = '2026-10-10';

// La clase base no puede instanciarse directamente
let baseCalculatorRejected = false;

try {
    new StreakCalculator();
} catch (error) {
    baseCalculatorRejected = true;
}

assert(
    baseCalculatorRejected,
    'StreakCalculator rechaza instancias directas'
);

// Lista vacía
assert(
    dailyCalculator.calculate(null, [], today) === 0,
    'La calculadora diaria devuelve 0 sin registros'
);

assert(
    weeklyCalculator.calculate(null, [], today) === 0,
    'La calculadora semanal devuelve 0 sin registros'
);

// Fechas desordenadas: 8, 9 y 10 de octubre
const unorderedLogs = [
    '2026-10-08',
    '2026-10-10',
    '2026-10-09'
];

assert(
    dailyCalculator.calculate(null, unorderedLogs, today) === 3,
    'La calculadora diaria ordena las fechas correctamente'
);

// Duplicado: el mismo día no aumenta la racha
const duplicatedLogs = [
    '2026-10-10',
    '2026-10-10',
    '2026-10-09'
];

assert(
    dailyCalculator.calculate(null, duplicatedLogs, today) === 2,
    'La calculadora diaria ignora fechas duplicadas'
);

// Hueco diario: falta el 9 de octubre
const dailyGapLogs = [
    '2026-10-10',
    '2026-10-08'
];

assert(
    dailyCalculator.calculate(null, dailyGapLogs, today) === 1,
    'La calculadora diaria detiene la racha ante un hueco'
);

// La lista original no debe modificarse
const originalLogs = [
    '2026-10-08',
    '2026-10-10',
    '2026-10-09'
];

const originalLogsCopy = [...originalLogs];

dailyCalculator.calculate(null, originalLogs, today);

assert(
    JSON.stringify(originalLogs) === JSON.stringify(originalLogsCopy),
    'La calculadora diaria no modifica la lista recibida'
);

// Varias fechas dentro de la misma semana ISO cuentan como una sola semana
const sameWeekLogs = [
    '2026-10-05',
    '2026-10-07',
    '2026-10-10',
    '2026-10-10'
];

assert(
    weeklyCalculator.calculate(null, sameWeekLogs, today) === 1,
    'La calculadora semanal cuenta una semana una sola vez'
);

// Tres semanas consecutivas: semanas 41, 40 y 39
const consecutiveWeekLogs = [
    '2026-10-10',
    '2026-10-01',
    '2026-09-25'
];

assert(
    weeklyCalculator.calculate(null, consecutiveWeekLogs, today) === 3,
    'La calculadora semanal cuenta semanas consecutivas'
);

// Hueco semanal: falta la semana del 28 de septiembre al 4 de octubre
const weeklyGapLogs = [
    '2026-10-10',
    '2026-09-25'
];

assert(
    weeklyCalculator.calculate(null, weeklyGapLogs, today) === 1,
    'La calculadora semanal detiene la racha ante un hueco'
);

// La lista original tampoco debe modificarse en la calculadora semanal
const weeklyOriginalLogs = [
    '2026-09-25',
    '2026-10-10',
    '2026-10-01'
];

const weeklyOriginalLogsCopy = [...weeklyOriginalLogs];

weeklyCalculator.calculate(null, weeklyOriginalLogs, today);

assert(
    JSON.stringify(weeklyOriginalLogs) === JSON.stringify(weeklyOriginalLogsCopy),
    'La calculadora semanal no modifica la lista recibida'
);

// Polimorfismo: ambas responden al mismo método
const calculators = [
    dailyCalculator,
    weeklyCalculator
];

assert(
    calculators.every((calculator) => typeof calculator.calculate === 'function'),
    'Las calculadoras comparten el mismo contrato público'
);

// ======================================================
// 27. CASOS DE FECHAS SEMANALES Y CAMBIO DE AÑO
// ======================================================

// Caso límite: today es lunes
const mondayLogs = [
    '2026-10-12'
];

assert(
    weeklyCalculator.calculate(null, mondayLogs, '2026-10-12') === 1,
    'La calculadora semanal cuenta correctamente un lunes'
);

// Cruce de año ISO: semana 53 de 2026 y semana 1 de 2027
const newYearLogs = [
    '2026-12-28',
    '2027-01-04'
];

assert(
    weeklyCalculator.calculate(null, newYearLogs, '2027-01-04') === 2,
    'La calculadora semanal cruza correctamente de la semana 53 a la semana 1'
);

// La misma semana no aumenta la racha
const repeatedWeekLogs = [
    '2027-01-04',
    '2027-01-06',
    '2027-01-10'
];

assert(
    weeklyCalculator.calculate(null, repeatedWeekLogs, '2027-01-10') === 1,
    'Varios registros de una misma semana cuentan como una sola semana'
);

// Ayer y anteayer: debe conservar la racha
const yesterdayAndBeforeLogs = [
    '2026-10-09',
    '2026-10-08'
];

assert(
    dailyCalculator.calculate(
        null,
        yesterdayAndBeforeLogs,
        '2026-10-10'
    ) === 2,
    'La calculadora diaria conserva la racha si hoy todavía no hay registro'
);

// Si falta hoy y también ayer, la racha se pierde
const oldDailyLogs = [
    '2026-10-08'
];

assert(
    dailyCalculator.calculate(
        null,
        oldDailyLogs,
        '2026-10-10'
    ) === 0,
    'La calculadora diaria devuelve 0 después de un día completo sin entrenar'
);

// Semana anterior: debe conservar la racha
const previousWeekLogs = [
    '2026-10-05',
    '2026-10-07'
];

assert(
    weeklyCalculator.calculate(
        null,
        previousWeekLogs,
        '2026-10-15'
    ) === 1,
    'La calculadora semanal conserva la racha de la semana anterior'
);

// Dos semanas atrás: la semana anterior completa sin registros rompe la racha
const oldWeeklyLogs = [
    '2026-09-28'
];

assert(
    weeklyCalculator.calculate(
        null,
        oldWeeklyLogs,
        '2026-10-15'
    ) === 0,
    'La calculadora semanal devuelve 0 después de una semana completa sin entrenar'
);

// ======================================================
// 28. ROUTINE + CALCULADORAS DE RACHAS
// ======================================================

const dailyRoutineLogs = new LogTracker();

dailyRoutineLogs.addLog('2026-10-08');
dailyRoutineLogs.addLog('2026-10-09');
dailyRoutineLogs.addLog('2026-10-10');

const dailyRoutine = Routine.daily(
    'Rutina diaria',
    2,
    10,
    30,
    dailyRoutineLogs
);

const weeklyRoutine = Routine.weekly(
    'Rutina semanal',
    2,
    10,
    30,
    dailyRoutineLogs
);

assert(
    dailyRoutine.frequency === 'daily',
    'Routine guarda la frecuencia diaria'
);

assert(
    weeklyRoutine.frequency === 'weekly',
    'Routine guarda la frecuencia semanal'
);

assert(
    dailyRoutine.calculateStreak('2026-10-10') === 3,
    'Routine diaria delega el cálculo de la racha'
);

assert(
    weeklyRoutine.calculateStreak('2026-10-10') === 1,
    'Routine semanal delega el cálculo de la racha'
);

// Frecuencia inválida
let invalidFrequencyRejected = false;

try {
    dailyRoutine.frequency = 'monthly';
} catch (error) {
    invalidFrequencyRejected = true;
}

assert(
    invalidFrequencyRejected,
    'Routine rechaza una frecuencia inválida'
);

// RunningRoutine hereda calculateStreak
const runningRoutineLogs = new LogTracker();

runningRoutineLogs.addLog('2026-10-08');
runningRoutineLogs.addLog('2026-10-09');
runningRoutineLogs.addLog('2026-10-10');

const runningStreakRoutine = RunningRoutine.daily(
    'Running con racha',
    3,
    5,
    30,
    5,
    '5:00',
    runningRoutineLogs
);

assert(
    runningStreakRoutine.calculateStreak('2026-10-10') === 3,
    'RunningRoutine calcula la racha mediante herencia'
);

// Routine usa la fecha local actual cuando no se proporciona today
const currentDate = new Date();

const todayString = [
    currentDate.getFullYear(),
    String(currentDate.getMonth() + 1).padStart(2, '0'),
    String(currentDate.getDate()).padStart(2, '0')
].join('-');

const routineWithoutToday = Routine.daily(
    'Rutina sin fecha',
    2,
    10,
    30
);

routineWithoutToday.logWorkout(todayString);

assert(
    routineWithoutToday.calculateStreak() === 1,
    'Routine usa la fecha local actual cuando no se proporciona today'
);

// ======================================================
// 29. FACTORÍAS ESTÁTICAS
// ======================================================

let invalidFactoryRejected = false;

try {
    Routine.daily(
        'A',
        2,
        10,
        30
    );
} catch (error) {
    invalidFactoryRejected =
        error.message === ROUTINE_VALIDATION.name.errorMessage;
}

assert(
    invalidFactoryRejected,
    'Una factoría conserva las validaciones de Routine'
);

// El error de la factoría no debe dejar abierto el candado
let directAfterFactoryErrorRejected = false;

try {
    new Routine('Creación directa posterior', 2, 10, 30);
} catch (error) {
    directAfterFactoryErrorRejected =
        error.message.includes('factoria');
}

assert(
    directAfterFactoryErrorRejected,
    'Una creación directa sigue rechazada después de un error de factoría'
);

const factoryDailyRoutine = Routine.daily(
    'Rutina factory diaria',
    2,
    10,
    30
);

const factoryWeeklyRoutine = Routine.weekly(
    'Rutina factory semanal',
    2,
    10,
    30
);

const factoryDailyRunningRoutine = RunningRoutine.daily(
    'Running factory diario',
    3,
    5,
    30,
    5,
    '5:00'
);

const factoryWeeklyRunningRoutine = RunningRoutine.weekly(
    'Running factory semanal',
    3,
    5,
    30,
    5,
    '5:00'
);

assert(
    factoryDailyRoutine instanceof Routine &&
        factoryDailyRoutine.frequency === 'daily',
    'Routine.daily crea una rutina diaria'
);

assert(
    factoryWeeklyRoutine instanceof Routine &&
        factoryWeeklyRoutine.frequency === 'weekly',
    'Routine.weekly crea una rutina semanal'
);

assert(
    factoryDailyRunningRoutine instanceof RunningRoutine &&
        factoryDailyRunningRoutine.frequency === 'daily',
    'RunningRoutine.daily crea una rutina diaria de running'
);

assert(
    factoryWeeklyRunningRoutine instanceof RunningRoutine &&
        factoryWeeklyRunningRoutine.frequency === 'weekly',
    'RunningRoutine.weekly crea una rutina semanal de running'
);

let directRoutineRejected = false;

try {
    new Routine('Creación directa', 2, 10, 30);
} catch (error) {
    directRoutineRejected = error.message.includes('factoria');
}

assert(
    directRoutineRejected,
    'Routine rechaza la creación directa y exige una factoría'
);

let directRunningRoutineRejected = false;

try {
    new RunningRoutine(
        'Running directo',
        3,
        5,
        30,
        new LogTracker(),
        5,
        '5:00'
    );
} catch (error) {
    directRunningRoutineRejected = error.message.includes('factoria');
}

assert(
    directRunningRoutineRejected,
    'RunningRoutine rechaza la creación directa y exige una factoría'
);

const firstIndependentRoutine = Routine.daily(
    'Primera rutina independiente',
    2,
    10,
    30
);

const secondIndependentRoutine = Routine.daily(
    'Segunda rutina independiente',
    2,
    10,
    30
);

firstIndependentRoutine.logWorkout('2026-10-10');

assert(
    firstIndependentRoutine.getLogs().length === 1 &&
        secondIndependentRoutine.getLogs().length === 0,
    'Las rutinas creadas por factoría no comparten LogTracker'
);

// ======================================================
// 30. ERRORES DE DOMINIO
// ======================================================

expectDomainError(
    () => Routine.daily('A', 2, 10, 30),
    'ROUTINE_NAME_INVALID',
    ROUTINE_VALIDATION.name.errorMessage,
    'Nombre inválido'
);

expectDomainError(
    () => Routine.daily('Rutina válida', 1, 10, 30),
    'ROUTINE_SERIES_OUT_OF_RANGE',
    ROUTINE_VALIDATION.series.errorMessage,
    'Series inválidas'
);

expectDomainError(
    () => Routine.daily('Rutina válida', 2, 4, 30),
    'ROUTINE_REPETITIONS_OUT_OF_RANGE',
    ROUTINE_VALIDATION.repetitionsPerSet.errorMessage,
    'Repeticiones inválidas'
);

expectDomainError(
    () => Routine.daily('Rutina válida', 2, 10, 29),
    'ROUTINE_REST_OUT_OF_RANGE',
    ROUTINE_VALIDATION.rest.errorMessage,
    'Descanso inválido'
);

expectDomainError(
    () => {
        const routineWithInvalidFrequency = Routine.daily(
            'Rutina válida',
            2,
            10,
            30
        );

        routineWithInvalidFrequency.frequency = 'monthly';
    },
    'ROUTINE_FREQUENCY_INVALID',
    'La frecuencia debe ser "daily" o "weekly".',
    'Frecuencia inválida'
);

expectDomainError(
    () => RunningRoutine.daily(
        'Running válido',
        3,
        5,
        30,
        0,
        '5:00'
    ),
    'RUNNING_KILOMETERS_INVALID',
    'El objetivo de los kilometros debe de ser un número positivo',
    'Kilómetros inválidos'
);

expectDomainError(
    () => RunningRoutine.daily(
        'Running válido',
        3,
        5,
        30,
        5,
        'ritmo inválido'
    ),
    'RUNNING_PACE_INVALID',
    'El formato para pasar el ritmo es mm:ss',
    'Ritmo inválido'
);

expectDomainError(
    () => new Routine('Creación directa', 2, 10, 30),
    'ROUTINE_FACTORY_REQUIRED',
    'Debe usarse una factoria',
    'Creación directa'
);

const invalidRoutineResult = addRoutine(
    'Rutina válida',
    1,
    10,
    30
);

assert(
    invalidRoutineResult === null,
    'addRoutine devuelve null ante un error de dominio'
);

assert(
    document.getElementById('messageBox').textContent ===
        ROUTINE_VALIDATION.series.errorMessage,
    'addRoutine muestra el mensaje del error de dominio'
);

console.log('');
console.log('========================================================');
console.log('✅ TODAS LAS PRUEBAS DE LA ETAPA 4 PASARON');
console.log('========================================================');

// ======================================================
// 31. ROUTINE - CREATEDAT
// ======================================================

const createdAtBefore = Date.now();

const createdAtRoutine = Routine.daily(
    'Rutina con fecha de creación',
    2,
    10,
    30
);

const createdAtAfter = Date.now();
const firstCreatedAt = createdAtRoutine.createdAt;
const secondCreatedAt = createdAtRoutine.createdAt;
const parsedCreatedAt = new Date(firstCreatedAt);

assert(
    typeof firstCreatedAt === 'string' &&
        firstCreatedAt !== undefined,
    'Routine.createdAt devuelve un string'
);

assert(
    !Number.isNaN(parsedCreatedAt.getTime()) &&
        parsedCreatedAt.toISOString() === firstCreatedAt &&
        parsedCreatedAt.getTime() >= createdAtBefore &&
        parsedCreatedAt.getTime() <= createdAtAfter,
    'Routine.createdAt es una fecha ISO válida y cercana al momento actual'
);

assert(
    firstCreatedAt === secondCreatedAt,
    'Dos lecturas de Routine.createdAt devuelven el mismo valor'
);

try {
    createdAtRoutine.createdAt = '2000-01-01T00:00:00.000Z';
} catch (error) {
    assert(
        error instanceof TypeError,
        'Asignar Routine.createdAt puede rechazar el cambio con TypeError'
    );
}

assert(
    createdAtRoutine.createdAt === firstCreatedAt,
    'Routine.createdAt no permite modificar su valor'
);

// RunningRoutine hereda el getter createdAt
const runningCreatedAtRoutine = RunningRoutine.daily(
    'Running con fecha de creación',
    3,
    5,
    30,
    5,
    '5:00'
);

assert(
    typeof runningCreatedAtRoutine.createdAt === 'string' &&
        !Number.isNaN(new Date(runningCreatedAtRoutine.createdAt).getTime()),
    'RunningRoutine hereda el getter createdAt'
);