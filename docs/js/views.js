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
        const validateInput = function(label) {
            let errors = [];
            if(label.name == null || label.name === "")
                errors.push("name is required")
            else if(labels.findIndex(x => x.name === label.name && x.id != label.id) > -1)
                errors.push("name is already in use");
            if(label.color == null || label.color === "")
                errors.push("color is required")
            return errors.length == 0 ? null : errors.join(", ");
        }
        return {
            label, 
            buttons: {
                save: {
                    onclick: function(event, spaEvent) {
                        App.displayWaitingModal();
                        let validationError = validateInput(label);
                        if(validationError)
                        {
                            App.displayErrorModal(validationError);
                            return;
                        }
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
    return Promise.all([Storage.getSettings(), Storage.getLabels(), Storage.getTransactions()])
    .then(res => {
        const [settings, labels, transactions] = res;
        let accountingMonth = Storage.getCurrentAccountingMonth();
        let dateParts = accountingMonth.split("-");
        let periodTransactions = transactions.filter(x => x.isActive && x.transactionYear == dateParts[0] && x.transactionMonth == dateParts[1]);
        periodTransactions.forEach(x => {
            const dateParts = new Date(x.transactionDate).toString().split(" ");
            x.date = dateParts[0] + " " + parseInt(dateParts[2]);
            x.edit = function() {
                window.location = TransactionsEditView.prototype.getRoute(x.id);
            };
            x.transactionClass = x.transactionTypeId == settings.goodTransaction ? "transaction-good" : "transaction-bad";
            x.primaryCategory = labels.find(y => y.id == x.primaryCategoryId);
            x.color = x.primaryCategory.color;
            x.name = x.primaryCategory.name;
        });
        let balance = periodTransactions.reduce(
            (total, next) => total + (next.transactionTypeId == settings.positiveAmount ? next.amount : - next.amount),
            0
        );
        dateParts = new Date(accountingMonth).toString().split(" ");
        return {
            accounting: {
                accountingMonth: dateParts[1] + " " + dateParts[3],
                balance,
                transactionClass: (balance < 0 === settings.goodTransaction < 0) || (balance >= 0 === settings.goodTransaction >= 0)
                    ? "transaction-good" : "transaction-bad"
            },
            transactions: periodTransactions,
            buttons: {
                newTransaction: {
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
    
    return Promise.all([Storage.getTransactions(), Storage.getLabels()])
    .then(res => {
        const [transactions, labels] = res;
        const transactionTypes = Util.copyObj(Enums.transactionType);
        const transaction = id == 0 ? new Transaction() : transactions.filter(x => x.id == id)[0];
        const validateInput = function(transaction) {
            let errors = [];
            if(transaction.transactionDate == null || transaction.transactionDate === "")
                errors.push("transaction date is required")
            if(transaction.transactionTypeId == null || transaction.transactionTypeId === "")
                errors.push("transaction type id is required")
            if(transaction.paymentMethod == null || transaction.paymentMethod === "")
                errors.push("payment method id is required")
            if(transaction.amount == null || transaction.amount == 0)
                errors.push("non-zero amount is required")
            if(transaction.primaryCategoryId == null || transaction.primaryCategoryId === "")
                errors.push("primary category is required")
            return errors.length == 0 ? null : errors.join(", ");
        }
        let subCategories = {
            selected: null,
            categories: []
        }
        const addSubCategory = function(event, spaEvent) {
            event.preventDefault();
            // alert();
            let label = labels.find(x => x.id == subCategories.selected);
            subCategories.selected = null;
            if(!label)
                return;
            categories.push(label);
        }
        subCategories.addSubCategory = addSubCategory;
        return {
            transaction,
            transactionTypes,
            labels: {
                paymentMethods: labels.filter(x => x.paymentMethod),
                primaryCategories: labels.filter(x => x.primaryCategory),
                subCategories: labels.filter(x => x.subCategory),
            },
            subCategories,
            buttons: {
                save: {
                    onclick: function(event, spaEvent) {
                        App.displayWaitingModal();
                        let validationError = validateInput(transaction);
                        if(validationError)
                        {
                            App.displayErrorModal(validationError);
                            return;
                        }
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