var spa;
var auth;
var storage;

function App() {
    App.models = {};
    let addModelProp = function(name) {
        Object.defineProperty(App.models, name, {
            get() {
                const model = App.getModel(name);
                if(model !== undefined)
                    return model;
                return App.setModel(name, {});
            },
            set(value) {
                if(value instanceof Object)
                {
                    const model = value._;
                    if(model !== undefined)
                        value = model;
                }
                return App.setModel(name, value);
            }
        });
    }
    App.storage = {};
    let addStorageProp = function(name, getter, setter) {
        Object.defineProperty(App.storage, name, {
            get() {
                return getter();
            },
            set(value) {
                return setter(value);
            }
        });
    }

    addModelProp("user");
    addModelProp("spreadsheets");
    addModelProp("currentSelection");
    addModelProp("newSpreadsheet");
    App.models.newSpreadsheet.createSpreadsheet = function(domEvent, spaEvent) {
        const name = spaEvent.model.name;
        App.displayWaitingModal();
        Spreadsheet.create(name)
        .then(res => {
            App.dismissModals();
            App.models.currentSelection.spreadsheet = res.spreadsheetId;
            return App.updateSheetsList();
        })
        .then(res => {
            App.showTopMenu(true);
        })
        .catch(err => {
            App.showTopMenu(true);
            App.dismissModals();
            App.logError(err);
        });
    }
    addStorageProp("version", Storage.getVersion, Storage.setVersion);
    addStorageProp("spreadsheet", Storage.getCurrentSpreadsheet, Storage.setCurrentSpreadsheet);
    addStorageProp("month", Storage.getCurrentAccountingMonth, Storage.setCurrentAccountingMonth);
}
App.latestVersion = "1.0";
App.models = {};
App.start = function() {
    try {
        //Create the app
        const options = {
            dom: {
                root: "body"
            },
            routing: {
                hashRouting: true,
                exactMatch: true
            }
        };
        spa = new SootheApp(options);
        new App();
        auth = new Auth();
        storage = new Storage();
        // auth.start();

        App.models.currentSelection = {
            spreadsheet: App.storage.spreadsheet != null ? App.storage.spreadsheet : "",
            month: App.storage.month = ""
        };

        if(App.storage.version == null)
        {
            App.storage.version = App.latestVersion;
        }
        else if(App.storage.version != App.latestVersion) {
            App.promptVersionUpgrade();
        }
    }
    catch(err) {
        App.logError(error);
        // App.displayErrorModal(err.toString());
    }
}
//========== Utility
App.logError = function(error) {
    console.log(error);
    App.setModel("error", {message: error});
    App.displayErrorModal(error);
}

//============ Modals
App.dismissModals = function() {
    document.querySelectorAll(".modal").forEach(modal => {
        modal.classList.add("modal-hidden");
        //modal.hidden = true;
    });//);
}
App.displayModal = function(id, toggle) {
    App.dismissModals();
    let modal = document.querySelector("#" + id);
    if(!modal || !toggle)
        return modal;
    //modal.hidden = false;
    modal.classList.remove("modal-hidden");
    return modal;
}
App.displayWaitingModal = function() {
    App.displayModal("waiting-modal", true);
}
App.displayErrorModal = function(message) {
    let modal = App.displayModal("error-modal", true);
    let messageBox = modal.querySelector("span");
    if(message)
        messageBox.innerText = message;
    else
        messageBox.innerText = "An unknown error has occured";
}
App.displayCreateNewSpreadsheetModal = function() {
    App.models.newSpreadsheet.name = "";
    App.displayModal("newSpreadsheet-modal", true);
}

//======== Versioning =========//
App.promptVersionUpgrade = function() {
    console.log("Need to upgrade version from: " + App.storage.version + " to " + App.latestVersion);
}

//========= authentication
App.logIn = function() {
    try{
        return auth.signIn();
    }
    catch(error){
        App.logError(error);
    }
    
}
App.logOut = function() {
    return auth.signOut();
}
App.signedIn = async function(user) {
    App.models.user = user;

    try
    {
        App.models.spreadsheets = {
            list: null,
            selectedId: Storage.getCurrentSpreadsheet()
        };
        await App.updateSheetsList();
        
    }
    catch(err)
    {
        App.logError(err);
    }
}
App.signedOut = function() {
    App.models.user = {name: "[LOGGED_OUT]"};
    console.log("signed out");
}

//========== Model manipulation
App.getModel = function(name) {
    return spa.getModel(name);
}
App.setModel = function(name, data){
    return spa.bindModel(name, data);
}


//============ App Screens
App.showTopMenu = function(toggle) {
    const picker = document.querySelector(".selectionMenu");
    picker.classList.toggle("selectionMenu-active", toggle);
}
App.showSideMenu = function(toggle) {
    const picker = document.querySelector(".sidebar");
    picker.classList.toggle("sidebar-active", toggle);
}

//=========== Selections ================//
App.updateSheetsList = async function() {
    
    return Spreadsheet.listSheets()
    .then(res => {
        App.models.spreadsheets.list = res
        console.log(res);
    });
}

App.updateSelection = function(spaEvent) {
    const model = spaEvent.model;
    App.storage.spreadsheet = model.spreadsheet;
    App.storage.month = model.month;
}

//========= Data
App.transactions = {};
App.transactions.get = function(month = new Date().getMonth() + 1, year = new Date().getFullYear()) {
    return new Promise( (resolve, reject) => {
        Query.transactions()
        .then(res => {
            resolve(res.filter(x => x.transactionMonth === month && x.transactionYear == year));
        })
        .catch(err => {
            reject(err);
        });
    });
}

console.log("hello");
    document.querySelectorAll(".modal").forEach(modal => {
        modal.classList.add("modal-hidden");
        //modal.hidden = true;
    });
