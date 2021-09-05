function Util() {

}
Util.copyObj = function(data) {
    return JSON.parse(JSON.stringify(data));
}
Util.inputToDate = function(date) {
    return new Date(date.replace("-", "/"));
}