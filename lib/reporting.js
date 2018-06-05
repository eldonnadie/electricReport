var reporting = {

    updateCorrespondingBilling: function(inputObject, outputObject) {

        switch (inputObject.Tarifa) {
            case 'Base':
                outputObject.BaseDia += inputObject.kwhCalculado;
                break;
            case 'Intermedia':
                outputObject.IntermediaDia += inputObject.kwhCalculado;
                break;
            case 'Punta':
                outputObject.PuntaDia += inputObject.kwhCalculado;
                break;
        }
    },

    updatePercentages: function(monthObject, base, intermediate, peak) {

        var globalSum = (base + intermediate + peak == 0) ? 1 : (base + intermediate + peak);
        monthObject.basePercent = base / globalSum * 100;
        monthObject.intermediaPercent = intermediate / globalSum * 100;
        monthObject.puntaPercent = (peak != 0 ? (100 - monthObject.basePercent - monthObject.intermediaPercent) : 0);
    },

    dailyReportArray: function(year, month, day, transformedInputs, db) {
        var finalPath = '/ResumenPorDia/' + year + '/' + month;
        console.log('enterifng ftion dr');
        return db.ref(finalPath).once('value').then(function(daysOfTheMonthArray) {
            console.log('logging dailyReport promise');
            var monthsDaysArray = daysOfTheMonthArray.val();
            console.log('logging daily wow');
            console.log(monthsDaysArray);
            for (var tIndex = 0; tIndex < transformedInputs.length; tIndex++) {
                var transformedInput = transformedInputs[tIndex];

                if (monthsDaysArray == null) {
                    monthsDaysArray = [{
                        BaseDia: 0.0,
                        IntermediaDia: 0.0,
                        PuntaDia: 0.0,
                        IdDia: day,
                        Mes: month
                    }];
                    reporting.updateCorrespondingBilling(transformedInput, monthsDaysArray[0]);

                } else {
                    for (var i = 0; i < monthsDaysArray.length; i++) {
                        // console.log('comparing ' + monthsDaysArray[i].IdDia +  ' and ' + day);
                        if (day == monthsDaysArray[i].IdDia) {

                            reporting.updateCorrespondingBilling(transformedInput, monthsDaysArray[i]);
                            break;
                        }
                    }
                }
            }

            db.ref(finalPath).set(monthsDaysArray);
        });
    },

    dailyReport: function(year, month, day, transformedInput, db) {
        var finalPath = '/ResumenPorDia/' + year + '/' + month;
        console.log('enterifng ftion dr');
        return db.ref(finalPath).once('value').then(function(daysOfTheMonthArray) {
            console.log('logging dailyReport promise');
            var monthsDaysArray = daysOfTheMonthArray.val();
            console.log('logging daily wow');
            console.log(monthsDaysArray);
            if (monthsDaysArray == null) {
                monthsDaysArray = [{
                    BaseDia: 0.0,
                    IntermediaDia: 0.0,
                    PuntaDia: 0.0,
                    IdDia: day,
                    Mes: month
                }];
                reporting.updateCorrespondingBilling(transformedInput, monthsDaysArray[0]);

            } else {
                for (var i = 0; i < monthsDaysArray.length; i++) {
                    // console.log('comparing ' + monthsDaysArray[i].IdDia +  ' and ' + day);
                    if (day == monthsDaysArray[i].IdDia) {

                        reporting.updateCorrespondingBilling(transformedInput, monthsDaysArray[i]);
                        break;
                    }
                }
            }

            db.ref(finalPath).set(monthsDaysArray);
            // monthlyReport(year, month);
        });
    },

    monthlyReport: function(year, month) {
        return db.ref('/ResumenPorMes').once('value').then(function(allSummaries) {
            return db.ref('/ResumenPorDia/' + year + '/' + month).once('value').then(function(daysOfTheMonth) {

                var daysOfTheMonthArray = daysOfTheMonth.val();
                var baseSum = 0,
                    intermediateSum = 0,
                    peakSum = 0;
                var correspondingMonth = null;
                var allSummariesArray = allSummaries.val();

                if (daysOfTheMonthArray != null) {
                    for (var i = 0; i < daysOfTheMonthArray.length; i++) {
                        baseSum += daysOfTheMonthArray[i].BaseDia;
                        intermediateSum += daysOfTheMonthArray[i].IntermediaDia;
                        peakSum += daysOfTheMonthArray[i].PuntaDia;
                    }
                }

                if (allSummariesArray == null) {
                    var newMonth = {
                        Mes: month,
                        Anio: year
                    };
                    reporting.updatePercentages(newMonth, baseSum, intermediateSum, peakSum);
                    allSummariesArray = [newMonth];
                } else {
                    for (var j = 0; j < allSummariesArray.length; j++) {
                        if (allSummariesArray[i].Anio == year && allSummariesArray[i].Mes == month) {
                            correspondingMonth = allSummariesArray[i];
                            reporting.updatePercentages(allSummariesArray[i], baseSum, intermediateSum, peakSum);
                            break;
                        }
                    }
                    if (correspondingMonth == null) { // if the month's not in the array yet
                        correspondingMonth = {
                            Mes: month,
                            Anio: year
                        };
                        reporting.updatePercentages(correspondingMonth, baseSum, intermediateSum, peakSum);
                        allSummariesArray.push(correspondingMonth);
                    }
                }

                db.ref('/ResumenPorMes').set(allSummariesArray);
            });
        });
    },

    parseAllDailyReports: function(db) {
        console.log('entering parse all daily');
        return db.ref('/hasbeenUsed').once('value').then(function(hasBeenUsed) {
            console.log('entering has been used');
            if (hasBeenUsed.val() != -1) {
                console.log('has been used ' + hasBeenUsed.val());
                if (hasBeenUsed.val() == 32) return;

                console.log('parsing value day -0=-=-=-=-' + hasBeenUsed.val());
                db.ref('/hasbeenUsed').set(-1);
                db.ref('/Kwh/2018/May/' + hasBeenUsed.val()).once('value').then(function(dailyInputs) {
                    console.log('read daily inputs======');
                    reporting.dailyReportArray(2018, 'May', hasBeenUsed.val(), dailyInputs,db);
                    console.log('update daily sum---------');
                    db.ref('/hasbeenUsed').set(parseInt(hasBeenUsed.val()) + 1);
                });
            }
        });
    }
};
module.exports = reporting;