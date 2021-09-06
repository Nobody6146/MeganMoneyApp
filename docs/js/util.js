function Util() {

}
Util.copyObj = function(data) {
    return JSON.parse(JSON.stringify(data));
}
Util.inputToDate = function(date) {
    const [ year, month, day] = date.split("-");
    return new Date(year, month - 1, day !== undefined ? day : 1);
}