function updateCorrespondingBilling(inputObject, outputObject) {
    
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
}

function updatePercentages(monthObject, base, intermediate, peak) {

    var globalSum = (base + intermediate + peak == 0) ? 1 : (base + intermediate + peak);
    monthObject.basePercent = base / globalSum * 100;
    monthObject.intermediaPercent = intermediate / globalSum * 100;
    monthObject.puntaPercent = (peak != 0 ? (100 - monthObject.basePercent - monthObject.intermediaPercent) : 0);
}

function dailyReport(year, month, day, transformedInput) {
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
            updateCorrespondingBilling(transformedInput, monthsDaysArray[0]);

        } else {
            for (var i = 0; i < monthsDaysArray.length; i++) {
                // console.log('comparing ' + monthsDaysArray[i].IdDia +  ' and ' + day);
                if (day == monthsDaysArray[i].IdDia) {

                    updateCorrespondingBilling(transformedInput, monthsDaysArray[i]);
                    break;
                }
            }
        }

        db.ref(finalPath).set(monthsDaysArray);
        // monthlyReport(year, month);
    });
}

function monthlyReport(year, month) {
    return db.ref('/ResumenPorMes').once('value').then(function(allSummaries) {
        return db.ref('/ResumenPorDia/' + year + '/' + month).once('value').then(function(daysOfTheMonth) {
            
            var daysOfTheMonthArray = daysOfTheMonth.val();
            var  baseSum = 0, intermediateSum = 0, peakSum = 0;             
            var correspondingMonth = null;
            var allSummariesArray = allSummaries.val();
            
            if(daysOfTheMonthArray != null) {
                for(var i = 0; i < daysOfTheMonthArray.length; i++) {
                    baseSum += daysOfTheMonthArray[i].BaseDia;
                    intermediateSum += daysOfTheMonthArray[i].IntermediaDia;
                    peakSum += daysOfTheMonthArray[i].PuntaDia;
                }
            }
            
            if (allSummariesArray == null) {
                var newMonth = { Mes: month, Anio: year };
                updatePercentages(newMonth, baseSum, intermediateSum, peakSum);
                allSummariesArray = [ newMonth ];
            } else {
                for(var j = 0; j < allSummariesArray.length; j++) {
                    if(allSummariesArray[i].Anio == year && allSummariesArray[i].Mes == month) {
                        correspondingMonth = allSummariesArray[i];
                        updatePercentages(allSummariesArray[i], baseSum, intermediateSum, peakSum);
                        break;
                    }
                }
                if(correspondingMonth == null) { // if the month's not in the array yet
                    correspondingMonth = { Mes: month, Anio: year };
                    updatePercentages(correspondingMonth, baseSum, intermediateSum, peakSum);
                    allSummariesArray.push(correspondingMonth);
                }
            }
            
            db.ref('/ResumenPorMes').set(allSummariesArray);
        });
    });
}

function parseAllDailyReports() {
    return db.ref('/hasbeenUsed').once('value').then(function(hasBeenUsed) {
        console.log('entering parser');
        if(hasBeenUsed.val() == 0) {
            db.ref('/hasbeenUsed').set(1);
            
            db.ref('/Kwh/2018/May').once('value').then(function(daysOfTheMonthArray) {
                console.log('reading days --- parser');
                daysOfTheMonthArray = daysOfTheMonthArray.val();
				console.log(daysOfTheMonthArray);
                for(var i = 0; i < daysOfTheMonthArray.length; i++) {
                    var dailyInputs = daysOfTheMonthArray[i];
					if(dailyInputs == null) continue;
                    for(var j = 0; j < dailyInputs.length; j++) {
                        dailyInputs[j].Tarifa = getTarifa({Mes: 'May', Anio: 2018, Dia: dailyInputs[j].Dia }, dailyInputs[j].IdHora);               
                        dailyReport(2018, 'May', dailyInputs[j].Dia, dailyInputs[j]);
                    }                       
                }
                
                db.ref('/Kwh/2018/May1/').set(daysOfTheMonthArray);
            });
        } 
    });
}