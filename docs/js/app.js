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

    addModelProp("theme");
    addModelProp("user");
    addModelProp("spreadsheets");
    addModelProp("currentSelection");
    addModelProp("newSpreadsheet");
    addModelProp("page");
    addModelProp("import");
    App.models.import = {
        files: null,
        profiles: null,
        importTransactions: function(domEvent, spaEvent) {
            const profile = spaEvent.data.profiles.selectedId;
            const file = spaEvent.data.files.selectedId;
            App.displayWaitingModal();

            App.readCsvFile(file)
            .then(res => {
                return App.importTransactions(file, profile, res);
            })
            .then(res => {
                App.displayOkModal("Success", `Import Complete! ${res.purged} transactions have been purged and ${res.added} added`,
                    "Ok",
                    function() {
                        App.route();
                    }
                );
            })
            .catch(err => {
                App.dismissModals();
                App.logError(err);
            });
        }
    }
    
    App.models.newSpreadsheet.createSpreadsheet = function(domEvent, spaEvent) {
        const name = spaEvent.data.name;
        App.displayWaitingModal();
        Spreadsheet.create(name)
        .then(res => {
            return App.updateTheme();
        })
        .then(res => {
            App.dismissModals();
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
            month: App.storage.month,
            updateSelection: App.updateSelection
        };

        if(App.storage.version == null)
        {
            App.storage.version = App.latestVersion;
        }
        else if(App.storage.version != App.latestVersion) {
            App.promptVersionUpgrade();
        }

        App.loadPages();
        //App.displayWaitingModal();
    }
    catch(err) {
        App.logError(error);
        App.displayErrorModal(err.toString());
    }
}
App.loadPages = function() {
    //Create views
    let dashboardView = new DashboardView();
    let loginView = new LoginView();
    let labelsView = new LabelsView();
    let labelsEditView = new LabelsEditView();
    let transactionsView = new TransactionsView();
    let transactionsEditView = new TransactionsEditView();
    let transactionsSummaryView = new TransactionsSummaryView();

    //Bind routes
    spa.addRoute(".*", (req, res, next) => {
        App.models.page.loading = true;
        //Auth check middleware
        if(App.isLoggedIn())
        {
            return next();
        }
        loginView.render.bind(loginView)(req, res, next);
    });
    spa.addRoute(dashboardView.getRoute(), dashboardView.render.bind(dashboardView));
    spa.addRoute(labelsView.getRoute(), labelsView.render.bind(labelsView));
    spa.addRoute(labelsEditView.getRoute(), labelsEditView.render.bind(labelsEditView));
    spa.addRoute(transactionsView.getRoute(), transactionsView.render.bind(transactionsView));
    spa.addRoute(transactionsEditView.getRoute(), transactionsEditView.render.bind(transactionsEditView));
    spa.addRoute(transactionsSummaryView.getRoute(), transactionsSummaryView.render.bind(transactionsSummaryView));
    spa.addRoute(".*", (req, res, next) => {
        res.spa.navigateTo(dashboardView.getRoute());
    });

    App.models.page = {
        tabs: {
            dashboard: {selected: false, link: dashboardView.getRoute()},
            labels: {selected: false, link: labelsView.getRoute()},
            transactions: {selected: false, link: transactionsView.getRoute()},
            budgets: {selected: false},
            savings: {selected: false},
        },
        loading: false
    };
}
//========== Utility
App.route = function(url, model) {
    spa.navigateTo(url, model);
}
App.logError = function(error) {
    console.error(error);
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
App.displayConfirmModal = function(title, message, cancelTitle, confirmTitle, confirmCallback) {
    const modal = App.displayModal("confirm-modal", true);
    modal.querySelectorAll(".modal-header h3")[0].innerHTML = title;
    modal.querySelectorAll(".modal-body span")[0].innerHTML = message;
    modal.querySelectorAll("#deny-button")[0].innerHTML = cancelTitle != null ? cancelTitle : "Cancel";
    modal.querySelectorAll("#confirm-button")[0].innerHTML = confirmTitle != null ? confirmTitle : "Ok";
    modal.querySelectorAll("#confirm-button")[0].onclick = function() {
        App.dismissModals();
        if(confirmCallback)
            confirmCallback();
    }
}
App.displayOkModal = function(title, message, dismissTitle, dismissCallback) {
    const modal = App.displayModal("ok-modal", true);
    modal.querySelectorAll(".modal-header h3")[0].innerHTML = title;
    modal.querySelectorAll(".modal-body span")[0].innerHTML = message;
    modal.querySelectorAll("#dismiss-button")[0].innerHTML = dismissTitle != null ? dismissTitle : "Ok";
    modal.querySelectorAll("#dismiss-button")[0].onclick = function() {
        App.dismissModals();
        if(dismissCallback)
            dismissCallback();
    }
}
App.displayCreateNewSpreadsheetModal = function() {
    App.models.newSpreadsheet.name = "";
    App.displayModal("newSpreadsheet-modal", true);
}
App.displayImportTransactionModal = async function() 
{
    return Promise.all([Storage.getImportSettings(), gapi.client.drive.files.list({q: "mimeType='text/csv' and trashed=false"})])
    .then(res => {
        const [importSettings, fileList] = res;
        const profileNames = importSettings.map(x => x.profileName)
        .filter((v, i, a) => a.indexOf(v) === i)
        .map(x =>
        {
            return {
                name: x,
                value: x
            }
        });

        App.models.import.files = {
            list: fileList.result.files,
            selectedId: "",
        };
        App.models.import.profiles = {
            list: profileNames,
            selectedId: "",
        };
        App.displayModal("importTransactions-modal", true);
    })
    .catch(err =>
    {
        App.logError(err);
    });
}

//======== Versioning =========//
App.promptVersionUpgrade = function() {
    console.log("Need to upgrade version from: " + App.storage.version + " to " + App.latestVersion);
}

//========= authentication
App.isLoggedIn = function() {
    return auth.isSignedIn();
}
App.logIn = function() {
    try{
        auth.signIn();
    }
    catch(error){
        App.logError(error);
    }
    
}
App.logOut = function() {
    auth.signOut();
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
        await App.updateTheme();
        App.route();
    }
    catch(err)
    {
        App.logError(err);
    }
}
App.signedOut = async function() {
    App.models.user = {name: "[LOGGED_OUT]"};
    App.models.spreadsheets = {};
    console.log("signed out");
    App.route();
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
        App.models.spreadsheets.list = res;
    });
}
App.updateTheme = async function() {
    return Storage.getSettings()
    .then(settings => {
        App.models.theme = {
            primaryColor: settings.themePrimaryColor
        };
    });
}

App.updateSelection = async function(spaEvent) {
    const model = spaEvent.model;
    App.storage.spreadsheet = model.spreadsheet;
    App.storage.month = model.month;
    Storage.clearCache();

    try{
        await App.updateTheme();
    }
    catch{}
    App.route();
}

//========= Data
App.labels = {};
App.labels.get = function() {
    return new Promise( (resolve, reject) => {
        Query.labels()
        .then(res => {
            resolve(res);
        })
        .catch(err => {
            reject(err);
        });
    });
}
App.labels.set = function() {
    return new Promise( (resolve, reject) => {
        Query.labels()
        .then(res => {
            resolve(res);
        })
        .catch(err => {
            reject(err);
        });
    });
}
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

//========== TRansactions import
App.readCsvFile = function(fileId)
{
    return gapi.client.drive.files.get({fileId: fileId, alt: "media" })
    .then(res => {
        return Promise.resolve(res.body);
    });
}
App.importTransactions = function(fileId, importProfile, text)
{
    let importResult;
    return Spreadsheet.importTransactions(fileId, importProfile, text)
    .then(res => {
        importResult = res;
        //console.log(res.transactions);
        //return Promise.resolve(res.newTransactions);
        return Storage.updateTransactions(res.transactions)
    })
    .then(res => {
        console.log(importResult.transactions);
        return Promise.resolve({
            purged: importResult.replacedTransactions.length,
            added: importResult.newTransactions.length
        });
    })
}