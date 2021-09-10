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
    let accountingMonth = localStorage.getItem(Storage.keys.CURRENT_AccountingMonth);
    if(accountingMonth)
        return accountingMonth;
    const date = new Date();
    return Storage.setCurrentAccountingMonth(date.getFullYear() + "-" + date.getMonth());
}
Storage.setCurrentAccountingMonth = function(mmyy) {
    return localStorage.setItem(Storage.keys.CURRENT_AccountingMonth, mmyy);
}
//
Storage.data = {
    info: null,
    settings: null,
    labels: null,
    transactions: null
};
Storage.clearCache = function() {
    Storage.data = {
        info: null,
        settings: null,
        labels: null,
        transactions: null,
    };
}
Storage.getInfo = function(){
    return new Promise( (resolve, reject) => {
        if(Storage.data.info != null)
        {
            resolve(Util.copyObj(Storage.data.info));
            return;
        }
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
        {
            resolve(Util.copyObj(Storage.data.settings));
            return;
        }
        Query.settings.get()
        .then(res => {
            let settings = {};
            res.forEach(x => {
                settings[x.name] = x.value;
            });
            Storage.data.settings = settings;
            resolve(Util.copyObj(settings));
        })
        .catch(err => reject(err));
    });
}
Storage.updateSettings = function(settings) {
    Storage.data.settings = settings;
    let req = [];
    const keys = Object.keys(settings);
    for(let i = 0; i < keys.length; i++)
    {
        let setting = new Setting();
        setting.id = i + 1;
        setting.name = keys[i];
        setting.value = settings[keys[i]];
        req.push(setting);
    }
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
        {
            resolve(Util.copyObj(Storage.data.labels));
            return;
        }
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
Storage.getTransactions = function(accountingMonth){
    return new Promise( (resolve, reject) => {
        if(Storage.data.transactions != null)
        {
            let transactions = Util.copyObj(Storage.data.transactions);
            if(accountingMonth)
                transactions = transactions.filter(x => x.accountingMonth === accountingMonth);
            resolve(transactions);
            return;
        } 
        Query.transactions.get()
        .then(res => {
            Storage.data.transactions = res;
            let transactions = Util.copyObj(res);
            if(accountingMonth)
                transactions = transactions.filter(x => x.accountingMonth === accountingMonth);
            resolve(transactions);
        })
        .catch(err => reject(err));
    });
}
Storage.updateTransactions = function(transactions) {
    Storage.data.transactions = transactions;
    return Query.transactions.update(transactions)
    .then(res => Util.copyObj(res));
}