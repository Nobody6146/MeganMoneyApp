function MeganMoneyView(name) {
    this.name = name;
    SootheView.call(this);
}
MeganMoneyView.prototype = Object.create(SootheView.prototype);
MeganMoneyView.prototype.getTitle = function() {
    return 'MeganMoney | ' + this.name;
}
MeganMoneyView.prototype.getRoot = function() {
    return document.querySelector(".main-content");
}
MeganMoneyView.prototype.processData = function(data) {
    App.models.page.data = data;
}
MeganMoneyView.prototype.getRoute = function() {
    return "#";
}
MeganMoneyView.prototype.startRendering = function() {
    App.displayWaitingModal();
    
    const tabName = this.name.toLowerCase();
    //Update selected tab
    Object.keys(App.models.page.tabs).forEach(x => {
        App.models.page.tabs[x].selected = x === tabName;
    });
}
MeganMoneyView.prototype.finishRendering = function(error) {
    if(!error) {
        App.dismissModals();
        App.models.page.loading = false;
    }
    else {
        App.displayErrorModal(error.message);
        App.models.page.loaded = false;
        console.error(error);
    }
}




//============ Login ===========//
function LoginView() {
    MeganMoneyView.call(this, "Login");
}
LoginView.prototype = Object.create(MeganMoneyView.prototype);
LoginView.prototype.getRoute = function() {
    return "#login";
}
LoginView.prototype.getHTML = function() {
    return fetch("views/home/login.html");
}

//============ Dashboard ============//
function DashboardView() {
    MeganMoneyView.call(this,"Dashboard");
}
DashboardView.prototype = Object.create(MeganMoneyView.prototype);
DashboardView.prototype.getRoute = function() {
    return "#dashboard";
}
DashboardView.prototype.getHTML = function() {
   return fetch("views/dashboard/index.html");
}

//============ Labels ============//
function LabelsView() {
    MeganMoneyView.call(this,"Labels");
}
LabelsView.prototype = Object.create(MeganMoneyView.prototype);
LabelsView.prototype.getRoute = function() {
    return "#labels";
}
LabelsView.prototype.getHTML = function() {
   return fetch("views/labels/index.html");
}
LabelsView.prototype.getData = function(req, res) {
    return Storage.getLabels()
    .then(res => {
        res.forEach(x => {
            const route = LabelsEditView.prototype.getRoute(x.id);
            x.edit = function() {
                window.location = route;
            };
        });
        return {
            labels: res.filter(x => x.isActive),
            buttons: {
                newLabel: {
                    onclick: function(event, spaEvent) {
                        window.location = LabelsEditView.prototype.getRoute(0);
                    }
                }
            }
        };
    });
}

function LabelsEditView() {
    MeganMoneyView.call(this,"Labels");
}
LabelsEditView.prototype = Object.create(MeganMoneyView.prototype);
LabelsEditView.prototype.getRoute = function(id) {
    return LabelsView.prototype.getRoute() + "/edit/" + (id === undefined ? ":id" : id);
}
LabelsEditView.prototype.getHTML = function() {
   return fetch("views/labels/edit.html");
}
LabelsEditView.prototype.getData = function(req) {
    const id = req.params.id;
    
    return Storage.getLabels()
    .then(labels => {
        const label = id == 0 ? new Label() : labels.filter(x => x.id == id)[0];
        return {
            label, 
            buttons: {
                save: {
                    onclick: function(event, spaEvent) {
                        App.displayWaitingModal();
                        if(id == 0) {
                            labels.push(label);
                            label.id = labels.length;
                        }
                        Storage.updateLabels(labels)
                        .then(res => {
                            App.dismissModals();
                            window.location = LabelsView.prototype.getRoute()
                        })
                        .catch(err => {
                            App.dismissModals();
                            App.logError(err);
                        });
                    }
                },
                delete: {
                    onclick: function(event, spaEvent) {
                        App.displayConfirmModal(
                            "Delete Label",
                            "Are you sure you want to delete this label?",
                            "No",
                            "Yes",
                            function() {
                                App.displayWaitingModal();
                                if(id == 0) {
                                    window.location = LabelsView.prototype.getRoute();
                                    return;
                                }
                                label.isActive = false;
                                Storage.updateLabels(labels)
                                .then(res => {
                                    App.dismissModals();
                                    window.location = LabelsView.prototype.getRoute()
                                })
                                .catch(err => {
                                    App.dismissModals();
                                    App.logError(err);
                                });
                            }
                        );
                    }
                },
                cancel: {
                    onclick: function(event, spaEvent) {
                        window.location = LabelsView.prototype.getRoute()
                    }
                }
            }
        };
    });
}


//============ Transactions ============//
function TransactionsView() {
    MeganMoneyView.call(this,"Transactions");
}
TransactionsView.prototype = Object.create(MeganMoneyView.prototype);
TransactionsView.prototype.getRoute = function() {
    return "#transactions";
}
TransactionsView.prototype.getHTML = function() {
   return fetch("views/transactions/index.html");
}
TransactionsView.prototype.getData = function(req, res) {
    let settings = null;
    return Storage.getSettings()
    .then(res => {
        settings = res;
        return Storage.getTransactions();
    })
    .then(res => {
        res.forEach(x => {
            const route = TransactionsEditView.prototype.getRoute(x.id);
            x.edit = function() {
                window.location = route;
            };
        });
        let accountingMonth = Storage.getCurrentAccountingMonth();
        const dateParts = accountingMonth.split("-");
        let periodTransactions = res.filter(x => x.isActive && x.transactionYear == dateParts[0] && x.transactionMonth == dateParts[1]);
        let goodTransactionType = settings.goodTransaction
        return {
            accounting: {
                accountingMonth,
                balance: periodTransactions.reduce(
                    (total, next) => total + (next.transactionTypeId == settings.goodTransaction ? next.amount : - next.amount),
                    0
                ),
            },
            transactions: periodTransactions,
            buttons: {
                newLabel: {
                    onclick: function(event, spaEvent) {
                        window.location = TransactionsEditView.prototype.getRoute(0);
                    }
                }
            }
        };
    });
}

function TransactionsEditView() {
    MeganMoneyView.call(this,"Transactions");
}
TransactionsEditView.prototype = Object.create(MeganMoneyView.prototype);
TransactionsEditView.prototype.getRoute = function(id) {
    return TransactionsView.prototype.getRoute() + "/edit/" + (id === undefined ? ":id" : id);
}
TransactionsEditView.prototype.getHTML = function() {
   return fetch("views/transactions/edit.html");
}
TransactionsEditView.prototype.getData = function(req) {
    const id = req.params.id;
    
    return Storage.getTransactions()
    .then(transactions => {
        const transaction = id == 0 ? new Transaction() : transactions.filter(x => x.id == id)[0];
        return {
            transaction, 
            buttons: {
                save: {
                    onclick: function(event, spaEvent) {
                        App.displayWaitingModal();
                        if(id == 0) {
                            transactions.push(transactions);
                            transaction.id = transactions.length;
                        }
                        Storage.updateTransactions(transactions)
                        .then(res => {
                            App.dismissModals();
                            window.location = TransactionsView.prototype.getRoute()
                        })
                        .catch(err => {
                            App.dismissModals();
                            App.logError(err);
                        });
                    }
                },
                delete: {
                    onclick: function(event, spaEvent) {
                        App.displayConfirmModal(
                            "Delete Transaction",
                            "Are you sure you want to delete this transaction?",
                            "No",
                            "Yes",
                            function() {
                                App.displayWaitingModal();
                                if(id == 0) {
                                    window.location = TransactionsView.prototype.getRoute();
                                    return;
                                }
                                transaction.isActive = false;
                                Storage.updateTransactions(transactions)
                                .then(res => {
                                    App.dismissModals();
                                    window.location = TransactionsView.prototype.getRoute()
                                })
                                .catch(err => {
                                    App.dismissModals();
                                    App.logError(err);
                                });
                            }
                        );
                    }
                },
                cancel: {
                    onclick: function(event, spaEvent) {
                        window.location = TransactionsView.prototype.getRoute()
                    }
                }
            }
        };
    });
}