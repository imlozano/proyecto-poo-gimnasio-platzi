let routineIdCounter = 0;

function Routines(name, series, repetitionsPerSet, rest) {

    if (name.trim().length < 3) {
        throw new Error('El nombre de la rutina debe tener al menos 3 caracteres.')
    } else if (series < 2 || series > 5) {
        throw new Error('El nuevo valor es superior a 5 series o es mejor a 5 series. Recuerda que no te puedes exceder y no puedes no hacer nada.')
    } else if (repetitionsPerSet < 5 || repetitionsPerSet > 30) {
        throw new Error('El valor de las repeticiones por serie es muy alto o muy bajo. Recuerda que el máximo son 30. Empieza de a poco 😉.')
    } else if (rest < 30 || rest > 60) {
        throw new Error('El descanso máximo es de un minuto. Mas te puede dar pereza 🦥. Y menos tiempo te puede dar fatiga. El rango es de 30 a 60 segundos.')
    }



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
Routines.prototype.rename = function rename(newName) {
    if (newName.trim().length < 3) {
        throw new Error('El nombre de la rutina debe tener al menos 3 caracteres.')
    }
    this.name = newName.trim();

}

Routines.prototype.changeCountSeries = function changeCountSeries(newValue) {
    if (newValue < 2 || newValue > 5) {
        throw new Error('El nuevo valor es superior a 5 series o es mejor a 5 series. Recuerda que no te puedes exceder y no puedes no hacer nada.')
    }

    this.series = newValue;
    this.durationRoutine = this.calculateDuration()

}

Routines.prototype.changeRepetitionsPerSet = function changeRepetitionsPerSet(newValue) {
    if (newValue < 5 || newValue > 30) {
        throw new Error('El valor de las repeticiones por serie es muy alto o muy bajo. Recuerda que el máximo son 30. Empieza de a poco 😉.')
    }

    this.repetitionsPerSet = newValue;
    this.durationRoutine = this.calculateDuration()

}

Routines.prototype.changeRest = function changeRest(newValue) {
    if (newValue < 30 || newValue > 60) {
        throw new Error('El descanso máximo es de un minuto. Mas te puede dar pereza 🦥. Y menos tiempo te puede dar fatiga. El rango es de 30 a 60 segundos.')
    }

    this.rest = newValue;
    this.durationRoutine = this.calculateDuration()

}

Routines.prototype.calculateDuration = function calculateDuration() {
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
