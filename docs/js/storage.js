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
            resolve(Util.copyObj(Storage.data.info));
        Query.info.get()
        .then(res => {
            Storage.data.info = res;
            resolve(Util.copyObj(res));
        })
        .catch(err => reject(err));
    });
}
Storage.updateInfo = function(info) {
    Storage.data.info = info;
    return Query.info.update(info)
    .then(res => Util.copyObj(res));
}
Storage.getSettings = function(){
    return new Promise( (resolve, reject) => {
        if(Storage.data.settings != null)
            resolve(Util.copyObj(Storage.data.settings));
        Query.settings.get()
        .then(res => {
            Storage.data.settings = res;
            resolve(Util.copyObj(res));
        })
        .catch(err => reject(err));
    });
}
Storage.updateSettings = function(settings) {
    Storage.data.settings = settings;
    return Query.settings.update(settings)
    .then(res => Util.copyObj(res));
}
Storage.getLabels = function(){
    const date = new Date().toISOString();
    // return Promise.resolve([
    //     {id: 1, createDate: date, updateDate: date, isActive: true, name: "None", color: "#FF0000", paymentMethod: true, primaryCategory: true, secondaryCategory: true}
    // ]);

    return new Promise( (resolve, reject) => {
        if(Storage.data.labels != null)
            resolve(Util.copyObj(Storage.data.labels));
        Query.labels.get()
        .then(res => {
            Storage.data.labels = res;
            resolve(Util.copyObj(res));
        })
        .catch(err => reject(err));
    });
}
Storage.updateLabels = function(labels) {
    Storage.data.labels = labels;
    return Query.labels.update(labels)
    .then(res => Util.copyObj(res));
}