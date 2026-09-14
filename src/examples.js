const ROUTINE_VALIDATION = {
    name: { minLength: 3 },
    series: { min: 2, max: 5 },
    repetitionsPerSet: { min: 5, max: 30 },
    rest: { min: 30, max: 60 }
};

const VALIDATION_MESSAGES = {
    object: {
        name: 'El nombre de la rutina debe tener al menos 3 caracteres',
        series: 'El nuevo valor es superior a 5 series o es menor a 5 series. Recuerda que no te puedes exceder y no puedes no hacer nada.',
        repetitionsPerSet: 'El valor de las repeticiones por serie es muy alto o muy bajo. Recuerda que el máximo son 30. Empieza de a poco 😉',
        rest: 'El descanso máximo es de un minuto. Mas te puede dar pereza 🦥. Y menos tiempo te puede dar fatiga'
    },
    class: {
        name: 'El nombre de la rutina debe tener al menos 3 caracteres.',
        series: 'El nuevo valor es superior a 5 series o es menor a 5 series. Recuerda que no te puedes exceder y no puedes no hacer nada.',
        repetitionsPerSet: 'El valor de las repeticiones por serie es muy alto o muy bajo. Recuerda que el máximo son 30. Empieza de a poco 😉.',
        rest: 'El descanso máximo es de un minuto. Mas te puede dar pereza 🦥. Y menos tiempo te puede dar fatiga. El rango es de 30 a 60 segundos.'
    }
};

function validateName(name, errorMessage) {
    if (name.trim().length < ROUTINE_VALIDATION.name.minLength) {
        throw new Error(errorMessage);
    }
}

function validateRange(value, rule, errorMessage) {
    if (value < rule.min || value > rule.max) {
        throw new Error(errorMessage);
    }
}

function validateRoutine(name, series, repetitionsPerSet, rest, messages) {
    validateName(name, messages.name);
    validateRange(series, ROUTINE_VALIDATION.series, messages.series);
    validateRange(repetitionsPerSet, ROUTINE_VALIDATION.repetitionsPerSet, messages.repetitionsPerSet);
    validateRange(rest, ROUTINE_VALIDATION.rest, messages.rest);
}

// Objeto literal con estado + comportamiento
let routineIdCounterTwo = 0;

function createRoutineObject(name, series, repetitionsPerSet, rest) {

    validateRoutine(name, series, repetitionsPerSet, rest, VALIDATION_MESSAGES.object);

    const routine = {

        // Propiedades
        id: ++routineIdCounterTwo,
        name: name,
        durationPerSet: 5,
        series: series,
        repetitionsPerSet: repetitionsPerSet,
        rest: rest,
        durationRoutine: 0,
        createdAt: new Date().toISOString(),

        // Comportamientos
        rename: function (newName) {
            validateName(newName, VALIDATION_MESSAGES.object.name);
            this.name = newName.trim();

        },

        changeCountSeries: function (newValue) {
            validateRange(newValue, ROUTINE_VALIDATION.series, VALIDATION_MESSAGES.object.series);

            this.series = newValue;
            this.durationRoutine = this.calculateDuration()

        },

        changeRepetitionsPerSet: function (newValue) {
            validateRange(newValue, ROUTINE_VALIDATION.repetitionsPerSet, VALIDATION_MESSAGES.object.repetitionsPerSet);

            this.repetitionsPerSet = newValue;
            this.durationRoutine = this.calculateDuration()

        },

        changeRest: function (newValue) {
            validateRange(newValue, ROUTINE_VALIDATION.rest, VALIDATION_MESSAGES.object.rest);

            this.rest = newValue;
            this.durationRoutine = this.calculateDuration()

        },

        calculateDuration: function () {
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
        },

    }

    routine.durationRoutine = routine.calculateDuration();

    return routine;

}

const objeto1 = createRoutineObject('Sentadilla', 2, 10, 30)
console.log(objeto1);
objeto1.changeRepetitionsPerSet(5);
console.log(objeto1);

// rutina invalida
const objeto2 = createRoutineObject('Burpees', 20, 5, 45);


//const routines = [];

let routineIdCounter = 0;

function Routine(name, series, repetitionsPerSet, rest) {

    validateRoutine(name, series, repetitionsPerSet, rest, VALIDATION_MESSAGES.class);



    // Propiedades
    this.id = ++routineIdCounter;
    this.name = name;
    this.durationPerSet = 5;
    this.series = series;
    this.repetitionsPerSet = repetitionsPerSet;
    this.rest = rest;
    this.durationRoutine = this.calculateDuration();
    this.createdAt = new Date().toISOString();


}

// Comportamientos
Routine.prototype.rename = function rename(newName) {
    validateName(newName, VALIDATION_MESSAGES.class.name);
    this.name = newName.trim();

}

Routine.prototype.changeCountSeries = function changeCountSeries(newValue) {
    validateRange(newValue, ROUTINE_VALIDATION.series, VALIDATION_MESSAGES.class.series);

    this.series = newValue;
    this.durationRoutine = this.calculateDuration()

}

Routine.prototype.changeRepetitionsPerSet = function changeRepetitionsPerSet(newValue) {
    validateRange(newValue, ROUTINE_VALIDATION.repetitionsPerSet, VALIDATION_MESSAGES.class.repetitionsPerSet);

    this.repetitionsPerSet = newValue;
    this.durationRoutine = this.calculateDuration()

}

Routine.prototype.changeRest = function changeRest(newValue) {
    validateRange(newValue, ROUTINE_VALIDATION.rest, VALIDATION_MESSAGES.class.rest);

    this.rest = newValue;
    this.durationRoutine = this.calculateDuration()

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


// const objeto1 = createRoutineObject('Sentadilla', 2, 10, 15)
// console.log(objeto1);
const rutina1 = new Routine('Sentadilla', 2, 10, 35)
console.log(rutina1);
rutina1.changeCountSeries(4);
console.log(rutina1.calculateDuration())
console.log(rutina1);

const rutina2 = new Routine('Salto en estrella', 2, 30, 45)
console.log(rutina2);

console.log(rutina1.calculateDuration === rutina2.calculateDuration)