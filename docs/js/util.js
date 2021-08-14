function Util() {

}
Util.copyObj = function(data) {
    return JSON.parse(JSON.stringify(data));
}