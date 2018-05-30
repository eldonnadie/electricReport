Date.prototype.addDays = function(days) {
  var dat = new Date(this.valueOf());
  dat.setDate(dat.getDate() + days);
  return dat;
}

Array.prototype.firstOrNull = function(evaluatorFunction) {
	
	var array = this.valueOf();
	if(array == null || evaluatorFunction == null) return null;
	
	for(var i = 0; i < array.length; i++) {
		var arrayElement = array[i];
		if(evaluatorFunction(arrayElement)) {
			return arrayElement;
		}
	}
	
	return null;
}

Array.prototype.lastOrNull = function(evaluatorFunction) {
	
	var array = this.valueOf();
	if(array == null || evaluatorFunction == null) return null;
	var lastFound = null;
	
	for(var i = 0; i < array.length; i++) {
		var arrayElement = array[i];
		if(evaluatorFunction(arrayElement)) {
			lastFound = arrayElement;
		}
	}
	
	return lastFound;
}