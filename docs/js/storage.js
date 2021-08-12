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
//
Storage.data = {
    info: null,
    settings: null,
    labels: null,
};
Storage.clearCache = function() {
    Storage.data = {
        info: null,
        settings: null,
        labels: null,
    };
}
Storage.getInfo = function(){
    return new Promise( (resolve, reject) => {
        if(Storage.data.info != null)
            resolve(Storage.data.info);
        Query.info.get()
        .then(res => {
            Storage.data.info = res;
            resolve(res);
        })
        .catch(err => reject(err));
    });
}
Storage.updateInfo = function(info) {
    Storage.data.info = info;
    return Query.info.update(info);
}
Storage.getSettings = function(){
    return new Promise( (resolve, reject) => {
        if(Storage.data.settings != null)
            resolve(Storage.data.settings);
        Query.settings.get()
        .then(res => {
            Storage.data.settings = res;
            resolve(res);
        })
        .catch(err => reject(err));
    });
}
Storage.updateSettings = function(settings) {
    Storage.data.settings = settings;
    return Query.settings.update(settings);
}