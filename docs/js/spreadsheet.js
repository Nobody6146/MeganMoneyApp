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
            columns: ["id","createDate","updateDate","isActive","profileName","regex","labelTypeId","labelId"]
        },
        {
            name: "Labels",
            columns: ["id","createDate","updateDate","isActive","name","color","paymentMethod","primaryCategory","secondaryCategory"]
        },
        {
            name: "Transactions",
            columns: ["id","createDate","updateDate","isActive","transactionDate","accountingMonth","transactionMonth","transactionDay","transactionYear","transactionTypeId","paymentMethodId","amount","primaryCategoryId","subCategoryIds","memo"]
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
        gapi.client.sheets.spreadsheets.create({}, spreadsheet)
        .then(res => {
            resolve(res.result);
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