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
    
    return Promise.all([Storage.getLabels(), Storage.getTransactions(), Storage.getSettings()])
    .then(res => {
        const [labels, transactions, settings] = res;
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
        const canDeleteLabel = function(label){
            return new Promise( (resolve, reject) => {
                let errors = [];
                transactions.filter(x => x.isActive).forEach(x => {
                    const sign = (x.transactionType == settings.positiveAmount) ? 1 : -1;
                    const transaction = "$" + (x.amount * sign) + " on " + x.transactionDate;
                    if(x.paymentMethodId == label.id)
                        errors.push('Label is a payment method for transaction: "' + transaction + '"');
                    if(x.primaryCategoryId == label.id)
                        errors.push('Label is a primary category for transaction: "' + transaction + '"');
                    if(x.subCategoryIds.split(" ").map(y => Number.parseInt(y)).includes(label.id))
                        errors.push('Label is a sub category for transaction: "' + transaction + '"');
                });
                if(errors.length == 0)
                    resolve();
                else
                    reject(errors.join("\n"));
            });
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
                            label.createDate = new Date().toISOString()
                        }
                        label.updateDate = new Date().toISOString();
                        label.isActive = true;
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
                                label.updateDate = new Date().toISOString();
                                canDeleteLabel(label)
                                .then(res => {
                                    return Storage.updateLabels(labels)
                                })
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
        let periodTransactions = transactions.filter(x => x.isActive && x.accountingMonth == accountingMonth);
        periodTransactions.forEach(x => {
            const dateParts = Util.inputToDate(x.transactionDate).toString().split(" ");
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
        dateParts = Util.inputToDate(accountingMonth).toString().split(" ");
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
                },
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
            if(transaction.paymentMethodId == null || transaction.paymentMethodId === "")
                errors.push("payment method id is required")
            if(transaction.amount == null || transaction.amount == 0)
                errors.push("non-zero amount is required")
            if(transaction.primaryCategoryId == null || transaction.primaryCategoryId === "")
                errors.push("primary category is required")
            return errors.length == 0 ? null : errors.join(", ");
        }
        labels.forEach(x => x.removeCategory = function(event, spaEvent) {
            let model = spaEvent.app.getModel(spaEvent.modelName.substring(0, spaEvent.modelName.lastIndexOf(".")));
            model.splice(spaEvent.varName, 1);
        });
        const labelGroups = {
            paymentMethods: labels.filter(x => x.paymentMethod && x.isActive),
            primaryCategories: labels.filter(x => x.primaryCategory && x.isActive),
            subCategories: labels.filter(x => x.subCategory && x.isActive),
        };
        let subCategories = {
            selected: null,
            categories: !transaction.subCategoryIds ? [] : transaction.subCategoryIds.split(" ").map(x => labels.find(y => y.id == x))
        };
        const addSubCategory = function(event, spaEvent) {
            event.preventDefault();
            // alert();
            let label = labelGroups.subCategories.find(x => x.name == spaEvent.model.selected);
            spaEvent.model.selected = null;
            if(!label)
                return;
            if(spaEvent.data.categories.findIndex(x => x.id == label.id) !== -1)
                return;
            spaEvent.model.categories.push(label);
        }
        subCategories.addSubCategory = addSubCategory;
        return {
            transaction,
            transactionTypes,
            labels: labelGroups,
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
                            transactions.push(transaction);
                            transaction.id = transactions.length;
                            transaction.createDate = new Date().toISOString();
                        }
                        const date = Util.inputToDate(transaction.transactionDate);
                        console.log(transaction.transactionDate);
                        console.log(date);
                        const dateParts = date.toString().split(" ");
                        transaction.updateDate = new Date().toISOString();
                        transaction.isActive = true;
                        transaction.accountingMonth = date.toISOString().substring(0, 7);
                        transaction.transactionMonth = dateParts[1];
                        transaction.transactionDay = date.getDate();
                        transaction.transactionDayOfTheWeek = dateParts[0];
                        transaction.transactionYear = date.getFullYear();
                        transaction.subCategoryIds = subCategories.categories.map(x => x.id).join(" ");
                        console.log(transaction);
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
                                transaction.updateDate = new Date().toISOString();
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

function TransactionsChartsView() {
    MeganMoneyView.call(this,"Transactions");
}
TransactionsChartsView.prototype = Object.create(MeganMoneyView.prototype);
TransactionsChartsView.prototype.getRoute = function() {
    return "#transactions/visual";
}
TransactionsChartsView.prototype.getHTML = function() {
   return fetch("views/transactions/index.html");
}
TransactionsChartsView.prototype.getData = function(req, res) {
    return Promise.all([Storage.getSettings(), Storage.getLabels(), Storage.getTransactions()])
    .then(res => {
        const [settings, labels, transactions] = res;
        let accountingMonth = Storage.getCurrentAccountingMonth();
        let dateParts = accountingMonth.split("-");
        let periodTransactions = transactions.filter(x => x.isActive && x.accountingMonth == accountingMonth);
        periodTransactions.forEach(x => {
            const dateParts = Util.inputToDate(x.transactionDate).toString().split(" ");
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
        dateParts = Util.inputToDate(accountingMonth).toString().split(" ");
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
                },
                newTransaction: {
                    onclick: function(event, spaEvent) {
                        window.location = TransactionsEditView.prototype.getRoute(0);
                    }
                }
            }
        };
    });
}