function Query() {

}
Query.get = function(range, valueRenderOption = "UNFORMATTED_VALUE", spreadsheetId = App.storage.spreadsheet) {
    return new Promise( (resolve, reject) => {
        gapi.client.sheets.spreadsheets.values.get({spreadsheetId, range: range, valueRenderOption})
        .then(res => {
            const raw = JSON.parse(res.body).values;
            let list = [];
            for(let i = 1; i < raw.length; i++)
            {
                let row = {};
                for(let j = 0; j < raw[i].length; j++)
                    row[raw[0][j]] = raw[i][j];
                list.push(row);
            }
            resolve(list);
        })
        .catch(err => {
            reject(err);
        });
    });
    
}
Query.update = function(range, values, valueInputOption = "USER_ENTERED", spreadsheetId = App.storage.spreadsheet) {
    const valueRange = {
        range: range,
        majorDimension: "ROWS",
        values: [values]
    }
    return new Promise( (resolve, reject) => {
        gapi.client.sheets.spreadsheets.values.update({spreadsheetId, range: range, valueInputOption}, valueRange)
        .then(res => {
            resolve(res.result);
        })
        .catch(err => {
            reject(err);
        });
    });
}
Query.insert = function(range, values, valueInputOption = "USER_ENTERED", insertDataOption = "INSERT_ROWS", spreadsheetId = App.storage.spreadsheet) {
    const valueRange = {
        range: range,
        majorDimension: "ROWS",
        values: [values]
    };
    return new Promise( (resolve, reject) => {
        gapi.client.sheets.spreadsheets.values.append({spreadsheetId, range: range, valueInputOption}, valueRange)
        .then(res => {
            resolve(res.result);
        })
        .catch(err => {
            reject(err);
        });
    });
}
Query.info = function() {
    return Query.get("info");
}
Query.settings = function() {
    return Query.get("settings");
}
Query.enums = function() {
    return Query.get("enums");
}
Query.labels = function() {
    return Query.get("labels");
}
Query.importSettings = function() {
    return Query.get("importSettings");
}
Query.labels = function() {
    return Query.get("labels");
}
Query.transactions = function() {
    return Query.get("transactions");
}
Query.budgets = function() {
    return Query.get("budgets");
}