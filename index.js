const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const calendarUtilities = require('/lib/calendarUtilities');
const reporting = require('/lib/reporting');
const utils = require('/lib/utils');

var db = admin.database();
var currentDate = new Date();

var holidays = [
    currentDate.getYear() + "-01-01",
    (getFirstMondayFebruary()).toISOString().slice(0, 10),
    (getFirstMondayFebruary()).toISOString().slice(0, 10),
    currentDate.getYear() + "-05-01",
    currentDate.getYear() + "-09-16",
    (getFirstMondayNovember()).toISOString().slice(0, 10),
    currentDate.getYear() + "-12-25",
];

admin.initializeApp(functions.config().firebase);

exports.transformData = functions.database.ref('/MedidorCorriente/{medidorId}/corriente').onWrite((event) => {

    var original = null;
    return event.data.ref.parent.once("value").then(snap => {

        original = snap.val();

        var timeFormatted = calendarUtilities.formatHour(original.Hora);
        var idHoraArray = (timeFormatted + '').split(':');

        var transformedData = {
            'Dia': original.Dia,
            'Hora': timeFormatted,
            'IdHora': idHoraArray[0],
            'Tarifa': getTarifa(original, idHoraArray[0]),
            'kwhCalculado': ((original.corriente * 120) / 60)
        };

        var finalPath = '/Kwh/' + original.Anio + '/' + original.Mes + '/' + original.Dia;
        db.ref(finalPath).once('value').then(function(testArrayVal) {

            var arrayResponse = [];

            if (testArrayVal.val() !== null) {
                arrayResponse = testArrayVal.val();
            } else {
                // console.log('The value of the array is null');
            }

            arrayResponse.push(transformedData);
            db.ref(finalPath).set(arrayResponse);

            reporting.parseAllDailyReports();
        });
    });
});

function getTarifa(entradaMedidor, idHour) {
    var month = entradaMedidor.Mes;
    var year = entradaMedidor.Anio;
    var day = entradaMedidor.Dia;
    var seasonV = getSeason(month, day);
    var weekDayV = getMeasurableWeekDay(day, month, year);

    var seasonAndWeekDay = {
        season: seasonV,
        weekDay: weekDayV
    };
	
    return getBillingCategory(seasonAndWeekDay, idHour);
}

function getBillingCategory(seasonAndWeekDay, idHour) {
    if (seasonAndWeekDay.season == SEASON.SUMMER) {
        if (seasonAndWeekDay.weekDay == 'L') {
            if (idHour >= 0 && idHour <= 5) {
                return "Base";
            } 
                
			return (idHour == 20 || idHour == 21) ? 'Punta' : 'Intermedia';            
        } else if (seasonAndWeekDay.weekDay == 'S') {
            return (idHour >= 0 && idHour <= 6) ? 'Base' : 'Intermedia';
        } else if (seasonAndWeekDay.weekDay == 'D') {
            return (idHour >= 0 && idHour <= 18) ? 'Base' : 'Intermedia';
        }
    }
    // WINTER
    else {
        if (seasonAndWeekDay.weekDay == 'L') {
            if (idHour >= 0 && idHour <= 5) {
                return "Base";
            }
            return (idHour >= 18 && idHour <= 20) ? 'Punta' : 'Intermedia';
        }
        if (seasonAndWeekDay.weekDay == 'S') {
            if (idHour >= 0 && idHour <= 7) {
                return "Base";
            }

            return (idHour == 19 && idHour == 20) ? 'Punta' : 'Intermedia';
        }
        if (seasonAndWeekDay.weekDay == 'D') {
            return (idHour >= 0 && idHour <= 17) ? 'Base' : 'Intermedia';
        }
    }
}

function getFirstMondayFebruary() {
    return calendarUtilities.getMonthDays(2018, calendarUtilities.MONTHS.FEBRUARY).firstOrNull(function(monthDay) {
        monthDay.getDay() == calendarUtilities.DAYS_OF_WEEK.MONDAY
    });
}

function getFirstMondayMarch() {
    return calendarUtilities.getMonthDays(2018, calendarUtilities.MONTHS.MARCH).firstOrNull(function(monthDay) {
        monthDay.getDay() == calendarUtilities.DAYS_OF_WEEK.MONDAY
    });
}

function getFirstMondayNovember() {
    return calendarUtilities.getMonthDays(2018, calendarUtilities.MONTHS.NOVEMBER).firstOrNull(function(monthDay) {
        monthDay.getDay() == calendarUtilities.DAYS_OF_WEEK.MONDAY
    });
}

function getFirstSundayApril() {
    return calendarUtilities.getMonthDays(2018, calendarUtilities.MONTHS.APRIL).firstOrNull(function(monthDay) {
        monthDay.getDay() == calendarUtilities.DAYS_OF_WEEK.SUNDAY
    });
}

function getLastSundayOctober() {
    return calendarUtilities.getMonthDays(2018, calendarUtilities.MONTHS.OCTOBER).firstOrNull(function(monthDay) {
        monthDay.getDay() == calendarUtilities.DAYS_OF_WEEK.SUNDAY
    });
}

function getSeason(month, day) {
    var firstSundayApril = getFirstSundayApril();
    var lastSundayOct = getLastSundayOctober();
    var season = "";

    if (['Ene', 'Feb', 'Mar', 'Nov', 'Dic'].includes(month)) {
        season = SEASON.WINTER;
    } else if (['May', 'Jun', 'Jul', 'Ago', 'Sep'].includes(month)) {
        season = SEASON.SUMMER;
    } else if (month == "Abr") {
        season = day >= firstSundayApril ? SEASON.SUMMER : SEASON.WINTER;
    } else if (month === "Oct") {
        season = day >= lastSundayOct ? SEASON.SUMMER : SEASON.WINTER;
    } else {
        season = season.error;
    }

    return season;
}

// returns D if it's a holiday or a sunday, returns saturday if it's saturday, otherwise returns L
function getMeasurableWeekDay(day, month, year) {

    day = ("0" + day).slice(-2);
    var monthIndex = 1;

    for (monthIndex = 1; monthIndex <= 12; monthIndex++) {
        var monthArreglo = calendarUtilities.SPANISH_MONTHS_TEXT[monthIndex - 1];
        if (monthArreglo == month) {
            break;
        }
    }

    monthIndex = ("0" + monthIndex).slice(-2);

    var medidorInputDateString = year + "-" + monthIndex + "-" + day;
    var medidorInputDate = new Date(medidorInputDateString);
    var presidentChangeDay = year + "-12-01";

    if (calendarUtilities.isPresidentialYear() && medidorInputDateString == presidentChangeDay) {
        return 'D';
    }

    for (var holiday in holidays) {
        if (holidays[holiday] == medidorInputDateString) {
            return 'D';
        }
    }

    var daySemana = medidorInputDate.getDay();

    if (daySemana == calendarUtilities.DAYS_OF_WEEK.SUNDAY) {
        return 'D';
    }

    return daySemana == calendarUtilities.DAYS_OF_WEEK.SATURDAY ? 'S' : 'L';
}