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
//=========== settings ================//
function SettingsView() {
    MeganMoneyView.call(this, "Settings");
}
SettingsView.prototype = Object.create(MeganMoneyView.prototype);
SettingsView.prototype.getRoute = function() {
    return "#settings";
}
SettingsView.prototype.getHTML = function() {
    return fetch("views/home/settings.html");
}
SettingsView.prototype.getData = function(req, res) {
    return Storage.getSettings()
    .then(settings => {
        return {
            settings: settings,
            options: {
                transactionTypes: Enums.transactionType.map(x => {
                   return {id: x.value, name: x.name}
                })
            },
            buttons: {
                save: {
                    onclick: function(domEvent, spaEvent) {
                        App.displayWaitingModal();
                        
                        Storage.updateSettings(settings)
                        .then(res => {
                            return App.refreshSettings();
                        })
                        .then(res => {
                            App.displayOkModal("Success", `Settings have been saved!`, "Dismiss");
                        })
                        .catch(err => {
                            App.dismissModals();
                            App.logError(err);
                        });
                    }
                }
            }
        };
    });
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
            labels: res.filter(x => x.isActive).sort((x, y) => x.name < y.name ? -1 : 1),
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
        const activeTransactions = transactions.filter(x => x.isActive && x.accountingMonth <= accountingMonth)
            .sort((x, y) => x.transactionDate > y.transactionDate ? 1 : x.transactionDate < y.transactionDate ? -1 : x.id > y.id ? 1 : -1);
        let periodTransactions = activeTransactions.filter(x => x.accountingMonth == accountingMonth);
        let accountBalance = 0;
        let priorBalance = 0;
        for(let i = 0; i < activeTransactions.length; i++)
        {
            let x = activeTransactions[i];
            x.amount = x.transactionTypeId == settings.positiveAmount ? Number.parseFloat(x.amount) : - Number.parseFloat(x.amount)
            accountBalance += x.amount;
            if(x.accountingMonth != accountingMonth)
            {
                priorBalance = accountBalance;
                continue;
            }
            const dateParts = Util.inputToDate(x.transactionDate).toString().split(" ");
            x.date = dateParts[0] + " " + parseInt(dateParts[2]);
            x.edit = function() {
                window.location = TransactionsEditView.prototype.getRoute(x.id);
            };
            x.transactionClass = x.transactionTypeId == settings.goodTransaction ? "transaction-good" : "transaction-bad";
            x.primaryCategory = labels.find(y => y.id == x.primaryCategoryId);
            x.paymentMethod = labels.find(y => y.id == x.paymentMethodId);
            x.primaryCategoryColor = x.primaryCategory.color;
            x.primaryCategoryName = x.primaryCategory.name;
            x.paymentMethodColor = x.paymentMethod.color;
            x.paymentMethodName = x.paymentMethod.name;
            x.name = x.primaryCategory.name;
            x.accountBalance = accountBalance.toFixed(2);
            x.description = x.memo != null && x.memo != "" ? x.memo : x.paymentMethod.name;
        }

        //periodTransactions = periodTransactions.sort((x, y) => x.transactionDate > y.transactionDate ? -1 : x.transactionDate < y.transactionDate ? 1 : x.id > y.id ? -1 : 1);
        let transactionGroups = {};
        periodTransactions.forEach(x => {
            let group = transactionGroups[x.transactionDay];
            if(group === undefined)
            {
                group = {label: x.date, transactions: []};
                transactionGroups[x.transactionDay] = group;
            }
            group.transactions.push({
                primaryCategoryColor: x.primaryCategoryColor,
                primaryCategoryName: x.primaryCategoryName,
                description: x.description,
                amount: x.amount,
                transactionClass: x.transactionClass,
                accountBalance: x.accountBalance,
                edit: x.edit
            });
        });

        dateParts = Util.inputToDate(accountingMonth).toString().split(" ");
        let balanceGrowth = (accountBalance - priorBalance);
        return {
            accounting: {
                accountingMonth: dateParts[1] + " " + dateParts[3],
                balance: accountBalance.toFixed(2),
                priorBalance: priorBalance.toFixed(2),
                balanceGrowth: balanceGrowth.toFixed(2),
                balanceGrowthPercent: (balanceGrowth/priorBalance * 100).toFixed(2),
                growthClass: (balanceGrowth < 0 === settings.goodTransaction < 0) || (balanceGrowth >= 0 === settings.goodTransaction >= 0)
                    ? "transaction-good" : "transaction-bad",
                transactionClass: (accountBalance < 0 === settings.goodTransaction < 0) || (accountBalance >= 0 === settings.goodTransaction >= 0)
                    ? "transaction-good" : "transaction-bad"
            },
            //transactions: periodTransactions,//.sort((x, y) => x.transactionDate > y.transactionDate ? -1 : x.transactionDate < y.transactionDate ? 1 : x.id < y.id ? 1 : -1),
            transactionGroups: transactionGroups,
            buttons: {
                newTransaction: {
                    onclick: function(event, spaEvent) {
                        window.location = TransactionsEditView.prototype.getRoute(0);
                    }
                },
                importTransactions: {
                    onclick: function(event, spaEvent) {
                        App.displayImportTransactionModal();
                    }
                },
                summary: {
                    onclick: function(event, spaEvent) {
                        window.location = TransactionsSummaryView.prototype.getRoute();
                    }
                },
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
            categories: !transaction.subCategoryIds ? [] : transaction.subCategoryIds.toString().split(" ").map(x => labels.find(y => y.id == x))
        };
        const addSubCategory = function(event, spaEvent) {
            event.preventDefault();
            let name = spaEvent.model.selected.trim();
            let label = labelGroups.subCategories.find(x => x.name == name);
            if(!label)
            {
                label = new Label();
                label.name = name;
            }
            spaEvent.model.selected = null;
            if(spaEvent.data.categories.findIndex(x => x.name == label.name) !== -1)
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
                    onclick: async function(event, spaEvent) {
                        App.displayWaitingModal();
                        let validationError = validateInput(transaction);
                        if(validationError)
                        {
                            App.displayErrorModal(validationError);
                            return;
                        }

                        //If we created any new labels on the fly, add them
                        let newLabels = subCategories.categories.filter(x => x.id == 0);
                        if(newLabels)
                        {
                            newLabels.forEach(x => {
                                let label = new Label();
                                label.id = labels.length + 1;
                                label.name = x.name;
                                label.createDate = new Date().toISOString()
                                label.updateDate = new Date().toISOString();
                                labels.push(label);
                                x.id = label.id;
                            });
                            try{
                                await Storage.updateLabels(labels);
                            } 
                            catch(err){
                                App.logError(err);
                            }
                        }
                        
                        if(id == 0) {
                            transactions.push(transaction);
                            transaction.id = transactions.length;
                            transaction.createDate = new Date().toISOString();
                        }
                        const date = Util.inputToDate(transaction.transactionDate);
                        const dateParts = date.toString().split(" ");
                        transaction.updateDate = new Date().toISOString();
                        transaction.isActive = true;
                        transaction.accountingMonth = date.toISOString().substring(0, 7);
                        transaction.transactionMonth = dateParts[1];
                        transaction.transactionDay = date.getDate();
                        transaction.transactionDayOfTheWeek = dateParts[0];
                        transaction.transactionYear = date.getFullYear();
                        transaction.subCategoryIds = subCategories.categories.map(x => x.id).join(" ");
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

function TransactionsSummaryView() {
    MeganMoneyView.call(this,"Transactions");
}
TransactionsSummaryView.prototype = Object.create(MeganMoneyView.prototype);
TransactionsSummaryView.prototype.getRoute = function() {
    return TransactionsView.prototype.getRoute() + "/summary"
}
TransactionsSummaryView.prototype.getHTML = function() {
   return fetch("views/transactions/summary.html");
}
 TransactionsSummaryView.prototype.getData = function(req, res) {
    let accountingMonth = Storage.getCurrentAccountingMonth();

    return Promise.all([Storage.getSettings(), Storage.getLabels(), Storage.getTransactions(accountingMonth)])
    .then(res => {
        const [settings, labels, transactions] = res;

        let charts = {};
        let addToChart = function(chartName, key, color, value) {
            let chart = charts[chartName];
            if(!chart) {
                chart = {
                    id: chartName,
                    title: chartName.replace(/_/g, " "),
                    data: [],
                    generateChart: function(event) {
                        let chartName = event.varName;
                        let rawChart = event.app.getModelData("page.data.charts")[chartName];
                        if(!rawChart)
                            return;
                    
                        let chartDiv = document.querySelector("#" + chartName);
                        let chartOptions = new ChartOptions(rawChart.title, 200);
                        let chartData = Object.keys(rawChart.data).map(label => {
                            let data = rawChart.data[label];
                            let value = (typeof data.value === 'number') ? data.value : Number.parseFloat(data.value.toString()); 
                            return new ChartData(label, value.toFixed(0), data.color);
                        });
                        let chart = new Chart(chartDiv, chartOptions);
                        chart.drawPieChart(chartData);
                    }
                };
                charts[chartName] = chart;
            }
            if(chart.data[key])
                chart.data[key].value += value;
            else
                chart.data[key] = {
                    color, value
                };
        }

        const defaultLabel = new Label();
        defaultLabel.id = 0;
        defaultLabel.name = "Unknown";
        defaultLabel.color = "lightgray";
        defaultLabel.paymentMethod = true;
        defaultLabel.primaryCategory = true;
        defaultLabel.subCategory = true;

        transactions.forEach(transaction => {
            let paymentLabel = labels.find(x => x.id == transaction.paymentMethodId);
            if(paymentLabel == null)
                paymentLabel = defaultLabel;
            let primaryLabel = labels.find(x => x.id == transaction.primaryCategoryId);
            if(primaryLabel == null)
                primaryLabel = defaultLabel;
            let amount = transaction.amount;
            addToChart("Transactions_by_Category", primaryLabel.name, primaryLabel.color, 1);
            addToChart("Totals_by_Category", primaryLabel.name, primaryLabel.color, amount);
            transaction.subCategoryIds.toString().split(" ").forEach(categoryId => {
                let categoryLabel = labels.find(x => x.id == categoryId);
                if(categoryLabel == null)
                    categoryLabel = defaultLabel;
                addToChart("Transactions_by_Category", categoryLabel.name, categoryLabel.color, 1);
                addToChart("Totals_by_Category", categoryLabel.name, categoryLabel.color, amount);
            })
            addToChart("Totals_by_Payment_Method", paymentLabel.name, paymentLabel.color, amount);
            addToChart("Transactions_by_Payment_Method", paymentLabel.name, paymentLabel.color, 1);
        });

        return {
            charts,
            buttons: {
                transactions: {
                    onclick: function(event, spaEvent) {
                        window.location = TransactionsView.prototype.getRoute()
                    }
                }
            }
        };
    });
}