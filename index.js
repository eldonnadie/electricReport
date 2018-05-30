const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
const utils = require('./lib/utils');
const calendarUtils = require('./lib/calendar');
const reporting = require('./lib/reporting');

admin.initializeApp(functions.config().firebase);
var db = admin.database();
var currentDate = new Date();

var holidays = [
    currentDate.getYear() + "-01-01",
    (getFirstMondayFebruary()).toISOString().slice(0, 10),
    (getFirstMondayMarch()).toISOString().slice(0, 10),
    currentDate.getYear() + "-05-01",
    currentDate.getYear() + "-09-16",
    (getFirstMondayNovember()).toISOString().slice(0, 10),
    currentDate.getYear() + "-12-25"
];

exports.transformData = functions.database.ref('/MedidorCorriente/{medidorId}/corriente').onWrite((event) => {

    var original = null;
    return event.data.ref.parent.once("value").then(snap => {

        original = snap.val();

        var timeFormatted = calendarUtils.formatHour(original.Hora);
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

function getBillingCategory (seasonAndWeekDay, idHour) {
    if (seasonAndWeekDay.season == calendarUtils.SEASONS.SUMMER) {
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
    return calendarUtils.getMonthDays(2018, calendarUtils.MONTHS.FEBRUARY).firstOrNull(function(monthDay) {		
        return monthDay.getDay() == calendarUtils.DAYS_OF_WEEK.MONDAY
    });
}

function getFirstMondayMarch() {
    return calendarUtils.getMonthDays(2018, calendarUtils.MONTHS.MARCH).firstOrNull(function(monthDay) {
        return monthDay.getDay() == calendarUtils.DAYS_OF_WEEK.MONDAY
    });
	
}

function getFirstMondayNovember() {
    return calendarUtils.getMonthDays(2018, calendarUtils.MONTHS.NOVEMBER).firstOrNull(function(monthDay) {
        return monthDay.getDay() == calendarUtils.DAYS_OF_WEEK.MONDAY
    });
}

function getFirstSundayApril() {
    return calendarUtils.getMonthDays(2018, calendarUtils.MONTHS.APRIL).firstOrNull(function(monthDay) {
        return monthDay.getDay() == calendarUtils.DAYS_OF_WEEK.SUNDAY
    });
}

function getLastSundayOctober() {
    return calendarUtils.getMonthDays(2018, calendarUtils.MONTHS.OCTOBER).firstOrNull(function(monthDay) {
        return monthDay.getDay() == calendarUtils.DAYS_OF_WEEK.SUNDAY
    });
}

function getSeason(month, day) {
    var firstSundayApril = getFirstSundayApril();
    var lastSundayOct = getLastSundayOctober();
    var season;

    if (['Ene', 'Feb', 'Mar', 'Nov', 'Dic'].includes(month)) {
        season = calendarUtils.SEASONS.WINTER;
    } else if (['May', 'Jun', 'Jul', 'Ago', 'Sep'].includes(month)) {
        season = calendarUtils.SEASONS.SUMMER;
    } else if (month == "Abr") {
        season = day >= firstSundayApril ? calendarUtils.SEASONS.SUMMER : calendarUtils.SEASONS.WINTER;
    } else if (month === "Oct") {
        season = day >= lastSundayOct ? calendarUtils.SEASONS.SUMMER : calendarUtils.SEASONS.WINTER;
    } else {
        season = calendarUtils.SEASONS.ERROR;
    }

    return season;
}

// returns D if it's a holiday or a sunday, returns saturday if it's saturday, otherwise returns L
function getMeasurableWeekDay (day, month, year) {

    day = ("0" + day).slice(-2);
    var monthIndex = 1;

    for (monthIndex = 1; monthIndex <= 12; monthIndex++) {
        var monthArreglo = calendarUtils.SPANISH_MONTHS_TEXT[monthIndex - 1];
        if (monthArreglo == month) {
            break;
        }
    }

    monthIndex = ("0" + monthIndex).slice(-2);

    var medidorInputDateString = year + "-" + monthIndex + "-" + day;
    var medidorInputDate = new Date(medidorInputDateString);
    var presidentChangeDay = year + "-12-01";

    if (calendarUtils.isPresidentialYear() && medidorInputDateString == presidentChangeDay) {
        return 'D';
    }

    for (var holiday in holidays) {
        if (holidays[holiday] == medidorInputDateString) {
            return 'D';
        }
    }

    var daySemana = medidorInputDate.getDay();

    if (daySemana == calendarUtils.DAYS_OF_WEEK.SUNDAY) {
        return 'D';
    }

    return daySemana == calendarUtils.DAYS_OF_WEEK.SATURDAY ? 'S' : 'L';
}