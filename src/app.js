let routineIdCounter = 0;

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
    if (name.trim().length < ROUTINE_VALIDATION.name.minLength) {
        throw new Error(ROUTINE_VALIDATION.name.errorMessage);
    }
}

function validateRange(value, rule) {
    if (value < rule.min || value > rule.max) {
        throw new Error(rule.errorMessage);
    }
}

function validateRoutine(name, series, repetitionsPerSet, rest) {
    validateName(name);
    validateRange(series, ROUTINE_VALIDATION.series);
    validateRange(repetitionsPerSet, ROUTINE_VALIDATION.repetitionsPerSet);
    validateRange(rest, ROUTINE_VALIDATION.rest);
}

function Routine(name, series, repetitionsPerSet, rest) {

    validateRoutine(name, series, repetitionsPerSet, rest);

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
    validateName(newName);
    this.name = newName.trim();

}

Routine.prototype.changeCountSeries = function changeCountSeries(newValue) {
    validateRange(newValue, ROUTINE_VALIDATION.series);

    this.series = newValue;
    this.durationRoutine = this.calculateDuration()

}

Routine.prototype.changeRepetitionsPerSet = function changeRepetitionsPerSet(newValue) {
    validateRange(newValue, ROUTINE_VALIDATION.repetitionsPerSet);

    this.repetitionsPerSet = newValue;
    this.durationRoutine = this.calculateDuration()

}

Routine.prototype.changeRest = function changeRest(newValue) {
    validateRange(newValue, ROUTINE_VALIDATION.rest);

    this.rest = newValue;
    this.durationRoutine = this.calculateDuration()

}

Routine.prototype.calculateDuration = function calculateDuration() {
    const repetitions = this.repetitionsPerSet
    const durationPerSet = this.durationPerSet
    const calculateExecution = repetitions * durationPerSet;
    const series = this.series
    const calculateEffort = series * calculateExecution;
    const rest = this.rest;
    const calculateTotalRest = (series - 1) * rest
    const durationRoutine = calculateEffort + calculateTotalRest

    return durationRoutine;
}
