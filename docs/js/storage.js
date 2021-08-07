function Storage() {
    
}
Storage.keys = {
    APP_VERSION: "version",
    CURRENT_SPREADSHEET: "spreadsheet",
    CURRENT_AccountingMonth: "month"
}
Storage.getVersion = function() {
    return localStorage.getItem(Storage.keys.APP_VERSION);
}
Storage.setVersion = function(version) {
    return localStorage.setItem(Storage.keys.APP_VERSION, version);
}
Storage.getCurrentSpreadsheet = function() {
    return localStorage.getItem(Storage.keys.CURRENT_SPREADSHEET);
}
Storage.setCurrentSpreadsheet = function(spreadsheetId) {
    return localStorage.setItem(Storage.keys.CURRENT_SPREADSHEET, spreadsheetId);
}
Storage.getCurrentAccountingMonth = function() {
    return localStorage.getItem(Storage.keys.CURRENT_AccountingMonth);
}
Storage.setCurrentAccountingMonth = function(mmyy) {
    return localStorage.setItem(Storage.keys.CURRENT_AccountingMonth, mmyy);
}