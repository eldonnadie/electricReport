var calendar = {
	MONTHS: {	
		JANUARY: 0,
		FEBRUARY: 1,
		MARCH: 2,
		APRIL: 3,
		MAY: 4,
		JUNE: 5,
		JULY: 6,
		AUGUST: 7,
		SEPTEMBER: 8,
		OCTOBER: 9,
		NOVEMBER: 10,
		DECEMBER: 11
	},

	SEASONS: {
		WINTER: 0,
		SUMMER: 1,
		ERROR: -1
	},

	SPANISH_MONTHS_TEXT: [
		'Ene',
		'Feb',
		'Mar',
		'Abr',
		'May',
		'Jun',
		'Jul',
		'Ago',
		'Sep',
		'Oct',
		'Nov',
		'Dic'
	],

	DAYS_OF_WEEK: {
		SUNDAY: 0,
		MONDAY: 1,
		TUESDAY: 2,
		WEDNESDAY: 3,
		THURSDAY: 4,
		FRIDAY: 5,
		SATURDAY: 6
	},

	isPresidentialYear: function () {
		var d = new Date();

		year = d.getYear();
		return (year - 112) % 6 === 0;
	},

	getMonthDays: function (year,month) {
		
		var monthFirstDay = new Date(year, month, 1);
		var currentDay = monthFirstDay;
		var response = [];
		
		while (currentDay.getMonth() == month) {		
			response.push(currentDay);
			currentDay = currentDay.addDays(1);		
		}	
		
		return response;
	},

	formatHour: function (time) {
		var hours = Number(time.match(/^(\d+)/)[1]);
		var minutes = Number(time.match(/:(\d+)/)[1]);
		var AMPM = time.match(/\s(.*)$/)[1];
		if (AMPM == "PM" && hours < 12) hours = hours + 12;
		if (AMPM == "AM" && hours == 12) hours = hours - 12;
		var sHours = hours.toString();
		var sMinutes = minutes.toString();
		if (hours < 10) sHours = "0" + sHours;
		if (minutes < 10) sMinutes = "0" + sMinutes;

		return sHours + ':' + sMinutes;
	}
};
module.exports = calendar;var calendar = {
	MONTHS: {	
		JANUARY: 0,
		FEBRUARY: 1,
		MARCH: 2,
		APRIL: 3,
		MAY: 4,
		JUNE: 5,
		JULY: 6,
		AUGUST: 7,
		SEPTEMBER: 8,
		OCTOBER: 9,
		NOVEMBER: 10,
		DECEMBER: 11
	},

	SEASONS: {
		WINTER: 0,
		SUMMER: 1,
		ERROR: -1
	},

	SPANISH_MONTHS_TEXT: [
		'Ene',
		'Feb',
		'Mar',
		'Abr',
		'May',
		'Jun',
		'Jul',
		'Ago',
		'Sep',
		'Oct',
		'Nov',
		'Dic'
	],

	DAYS_OF_WEEK: {
		SUNDAY: 0,
		MONDAY: 1,
		TUESDAY: 2,
		WEDNESDAY: 3,
		THURSDAY: 4,
		FRIDAY: 5,
		SATURDAY: 6
	},

	isPresidentialYear: function () {
		var d = new Date();

		year = d.getYear();
		return (year - 112) % 6 === 0;
	},

	getMonthDays: function (year,month) {
		
		var monthFirstDay = new Date(year, month, 1);
		var currentDay = monthFirstDay;
		var response = [];
		
		while (currentDay.getMonth() == month) {		
			response.push(currentDay);
			currentDay = currentDay.addDays(1);		
		}	
		
		return response;
	},

	formatHour: function (time) {
		var hours = Number(time.match(/^(\d+)/)[1]);
		var minutes = Number(time.match(/:(\d+)/)[1]);
		var AMPM = time.match(/\s(.*)$/)[1];
		if (AMPM == "PM" && hours < 12) hours = hours + 12;
		if (AMPM == "AM" && hours == 12) hours = hours - 12;
		var sHours = hours.toString();
		var sMinutes = minutes.toString();
		if (hours < 10) sHours = "0" + sHours;
		if (minutes < 10) sMinutes = "0" + sMinutes;

		return sHours + ':' + sMinutes;
	}
};
module.exports = calendar;