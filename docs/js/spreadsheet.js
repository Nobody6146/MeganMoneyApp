function Spreadsheet() {

}

Spreadsheet.listSheets = async function() {
    return (
        await gapi.client.drive.files.list({q: "mimeType='application/vnd.google-apps.spreadsheet'"})
    ).result.files;
}

Spreadsheet.create = function(name) {
    const sheets = [
        {
            name: "Info",
            columns: ["id","createDate","updateDate","isActive","name","value"]
        },
        {
            name: "Settings",
            columns: ["id","createDate","updateDate","isActive","name","value"]
        },
        {
            name: "Enums",
            columns: ["id","createDate","updateDate","isActive","enumType","name","value"]
        },
        {
            name: "ImportSettings",
            columns: ["id","createDate","updateDate","isActive","profileName", "column", "pattern", "fieldTypeId", "value"]
        },
        {
            name: "Labels",
            columns: ["id","createDate","updateDate","isActive","name","color","paymentMethod","primaryCategory","secondaryCategory"]
        },
        {
            name: "Transactions",
            columns: ["id","createDate","updateDate","isActive","transactionDate","accountingMonth","transactionMonth","transactionDay","transactionDayOfTheWeek","transactionYear","transactionTypeId","paymentMethodId","amount","primaryCategoryId","subCategoryIds","memo", "fileId"]
        },
        {
            name: "Budgets",
            columns: ["id","createDate","updateDate","isActive","labelId","labelTypeId","limitTypeId","limitCap","trackingTypeId","dueDate"]
        }
    ]

    const spreadsheet = {
        properties: {
            title: name,
        },
        sheets: [],
        namedRanges: []
    }

    for(let i = 0; i < sheets.length; i++)
    {
        let sheet = sheets[i];
        spreadsheet.sheets.push({
            properties: {
                sheetId: i,
                title: sheet.name,
            },
            data: [
                {
                    startRow: 0,
                    startColumn: 0,
                    rowData: [
                        {
                            values: sheet.columns.map(x => {
                                return {userEnteredValue: {string_value: x}}
                            })
                        }
                    ]
                },
            ],
        });
        spreadsheet.namedRanges.push( {
            name: sheet.name.substring(0, 1).toLowerCase() + sheet.name.substring(1),
            range: {
                sheetId: i,
                // startRowIndex: 0,
                // endRowIndex: 6,
                startColumnIndex: 0,
                endColumnIndex: sheet.columns.length
            }
        });
    }
    
    // const spreadsheet = {
    //     properties: {
    //         title: name,
    //     },
    //     sheets: [
    //         {
    //             properties: {
    //                 sheetId: 0,
    //                 title: "Info",
    //                 // index: integer,
    //             },
    //             data: [
    //                 {
    //                     startRow: 0,
    //                     startColumn: 0,
    //                     rowData: [
    //                         {
    //                             values: [
    //                                 {userEnteredValue: {string_value: "id"}},
    //                                 {userEnteredValue: {string_value: "createDate"}},
    //                                 {userEnteredValue: {string_value: "updateDate"}},
    //                                 {userEnteredValue: {string_value: "isActive"}},
    //                                 {userEnteredValue: {string_value: "name"}},
    //                                 {userEnteredValue: {string_value: "value"}}
    //                             ]
    //                         }
    //                     ]
    //                 },
    //             ],
    //         },
    //         {
    //             properties: {
    //                 sheetId: 1,
    //                 title: "Settings",
    //                 // index: integer,
    //             },
    //             data: [
    //                 {
    //                     startRow: 0,
    //                     startColumn: 0,
    //                     rowData: [
    //                         {
    //                             values: [
    //                                 {userEnteredValue: {string_value: "id"}},
    //                                 {userEnteredValue: {string_value: "createDate"}},
    //                                 {userEnteredValue: {string_value: "updateDate"}},
    //                                 {userEnteredValue: {string_value: "isActive"}},
    //                                 {userEnteredValue: {string_value: "name"}},
    //                                 {userEnteredValue: {string_value: "value"}}
    //                             ]
    //                         }
    //                     ]
    //                 },
    //             ],
    //         }
    //     ],
    //     namedRanges: [
    //         {
    //             // namedRangeId: string,
    //             name: "info",
    //             range: {
    //                 sheetId: 0,
    //                 // startRowIndex: 0,
    //                 // endRowIndex: 6,
    //                 startColumnIndex: 0,
    //                 endColumnIndex: 6
    //             }
    //         }
    //     ]
    // };

    return new Promise( (resolve, reject) => {
        let result = null;

        gapi.client.sheets.spreadsheets.create({}, spreadsheet)
        .then(res => {
            result = res.result;
            return App.updateSheetsList();
        })
        .then( () => {
            App.models.currentSelection.spreadsheet = result.spreadsheetId;
            Storage.clearCache();
        })
        .then(() => {
            const date = new Date().toISOString();
            return Storage.updateInfo([
                {id: 1, createDate: date, updateDate: date, isActive: true, name: "version", value: 1.0}
            ]);
        })
        .then(() => {
            const date = new Date().toISOString();
            let positiveAmount = new Setting();
            return Storage.updateSettings([
                {
                    positiveAmount: 1,
                    goodTransaction: 1,
                    themePrimaryColor: "royalblue"
                }
            ]);
        })
        .then(() => {
            const date = new Date().toISOString();
            let label = new Label();
            label.id = 1;
            label.name = "None";
            label.color = "#FF0000";
            return Storage.updateLabels([label]);
        })
        .then(() => {
            resolve(result);
        })
        .catch(err => {
            reject(err);
        });
    });
}
Spreadsheet.getTransactions = function() {
    return new Promise( (resolve, reject) => {
        Query.info()
        .then(res => {
            let info = {};
            res.forEach(row => {
                info[row.name] = row.value;
            });
            resolve(info);
        })
        .catch(err => {
            reject(err);
        });
    });
}
Spreadsheet.settings = function() {
    return Query.settings();
}
Spreadsheet.enums = function() {
    return Query.enums();
}
Spreadsheet.labels = function() {
    return Query.labels();
}
Spreadsheet.importSettings = function() {
    return Query.importSettings();
}
Spreadsheet.labels = function() {
    return Query.labels();
}
Spreadsheet.transactions = function() {
    return Query.transactions();
}
Spreadsheet.budgets = function() {
    return Query.budgets();
}

Spreadsheet.importTransactions = async function(fileId, importProfileName, rawText) {
    try
    {
        const [transactions, labels, importSettings] = await Promise.all(
            [
                Storage.getTransactions(),
                Storage.getLabels(),
                Storage.getImportSettings()
            ]
        );
        const rules = importSettings.filter(x => x.profileName == importProfileName);
        rules.forEach(rule => {
            rule.fieldType = Enums.importSettingType.find(x => x.name == rule.fieldTypeId).name;
        });
        //Clean up any bad/old transactions
        const replacedTransactions = transactions.filter(x => x.fileId === fileId);
        replacedTransactions.forEach(x => {
            x.isActive = false;
            x.updateDate = new Date().toISOString();
        });

        let lines = rawText.split("\n");

        let columnMappings = lines[0].split(',');

        let newTransactions = [];
        for(let i = 1; i < lines.length; i++)
        {
            let fields = lines[i].split(',');
            if(fields.length < columnMappings.length)
                continue;

            let transaction = new Transaction();
            transaction.id = transactions.length += 1;
            transaction.fileId = fileId;

            //Apply profile import rules
            let transDate = new Date();
            rules.forEach(rule => {
                let index = columnMappings.indexOf(rule.column);
                let fieldValue = fields[index];
                if(fieldValue == null)
                    fieldValue = '';
                if(fieldValue.match(new RegExp(rule.pattern, "i")))
                {
                    switch(rule.fieldType)
                    {
                        case "TransactionDate":
                            transDate = new Date(fieldValue);
                            break;
                        case "TransactionType": 
                            transaction.transactionTypeId = rule.value;
                            break;
                        case "PaymentMethod":
                            transaction.paymentMethodId = rule.value;
                            break;
                        case "Amount":
                            transaction.amount = Math.abs(fieldValue);
                            break;
                        case "PrimaryCategory":
                            transaction.primaryCategoryId = rule.value;
                            break;
                        case "SubCategory":
                            if(transaction.subCategoryIds == null)
                                transaction.subCategoryIds = rule.value
                            else
                                transaction.subCategoryIds += " " + rule.value;
                            break;
                        case "Memo":
                            const memo = rule.value == null || rule.value == ''
                                ? fieldValue : rule.value + fieldValue;
                            transaction.memo = transaction.memo == null ? memo
                                : transaction.memo + memo;
                            break;
                        case "IsActive":
                            transaction.isActive = rule.value == true;
                            break;
                    }
                }
            });

            //Don't import if we chose to ignore
            if(!transaction.isActive)
                continue;
            
            newTransactions.push(transaction);

            if(transaction.paymentMethodId == null)
                transaction.paymentMethodId = labels.find(x => x.paymentMethod == true).id;
            if(transaction.primaryCategoryId == null)
                transaction.primaryCategoryId = labels.find(x => x.primaryCategory == true).id;

            const date = transDate;
            const dateParts = date.toString().split(" ");
            transaction.updateDate = new Date().toISOString();
            transaction.isActive = true;
            transaction.transactionDate = date.toISOString().substring(0, 10);
            transaction.accountingMonth = date.toISOString().substring(0, 7);
            transaction.transactionMonth = dateParts[1];
            transaction.transactionDay = date.getDate();
            transaction.transactionDayOfTheWeek = dateParts[0];
            transaction.transactionYear = date.getFullYear();
        }
        console.log(`${replacedTransactions.length} were deleted. ${newTransactions.length} were imported:`);
        console.log(newTransactions);
    }
    catch(error)
    {
        App.logError(error);
    }
}